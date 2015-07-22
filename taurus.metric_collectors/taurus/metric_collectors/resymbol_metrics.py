#!/usr/bin/env python
# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------

"""
Purges old records from taurus_collectors.twitter_tweets table.

NOTE: this script may be configured as "console" app by the package
installer.
"""

from collections import namedtuple
from datetime import datetime, timedelta
import logging
from optparse import OptionParser
import os

from sqlalchemy import sql

from taurus.metric_collectors import (
    collectorsdb,
    config,
    logging_support,
    metric_utils)
from taurus.metric_collectors.collectorsdb import schema
from taurus.metric_collectors import gen_metrics_config
from taurus.metric_collectors.twitterdirect import migrate_tweets_to_dynamodb
from taurus.metric_collectors.twitterdirect.twitter_direct_agent import (
    MetricDataForwarder,
    loadMetricSpecs as loadTwitterMetricSpecs,
    _EMITTED_TWEET_VOLUME_SAMPLE_TRACKER_KEY
)
from taurus.metric_collectors.xignite.xignite_stock_agent import (
    _transmitMetricData as forwardStockBars,
    loadMetricSpecs as loadStockBarsMetricSpecs
)



DEFAULT_HTM_SERVER = os.environ.get("TAURUS_HTM_SERVER")


# Maximum window for forwarded metric data samples
MAX_METRIC_SAMPLE_BACKLOG_DAYS = 90


g_log = logging.getLogger(__name__)



def _parseArgs():
  """
  :returns: dict of arg names and values:
    old_symbol - the orignal ticker symbol
    new_symbol - the new ticker symbol
    migrate_price - boolean specifying whether to keep historical price data
    migrate_tweets - boolean specifying whether to keep historical twitter data
  """
  helpString = (
      "%%prog [options]"
      "Tool to rename a metric's symbol and migrate the historical data to the "
      "new metric.")

  parser = OptionParser(helpString)

  parser.add_option(
      "--server",
      action="store",
      type="string",
      dest="htmServer",
      default=DEFAULT_HTM_SERVER,
      help="Hostname or IP address of server running HTM Engine API to create "
      "models [default: %default]")

  parser.add_option(
      "--apikey",
      action="store",
      type="string",
      dest="apikey",
      default="taurus",
      help="API Key of HTM Engine to create models [default: %default]")

  parser.add_option(
      "--period",
      action="store",
      type="int",
      dest="aggPeriod",
      default=300,
      help="Volume aggregation period in seconds [default: %default]")

  parser.add_option(
      "--oldsymbol",
      action="store",
      type="string",
      dest="oldSymbol",
      help="Original ticker symbol currently used by metric_collector")

  parser.add_option(
      "--newsymbol",
      action="store",
      type="string",
      dest="newSymbol",
      help="New ticker symbol to be used")

  parser.add_option(
      "-t", "--twitteronly",
      action="store_false",
      dest="stocks",
      default=True,
      help="Only migrate twitter metric data"
  )

  parser.add_option(
      "-x", "--stocksonly",
      action="store_false",
      dest="twitter",
      default=True,
      help="Only migrate xignite stock metric data"
  )


  options, remainingArgs = parser.parse_args()
  if remainingArgs:
    parser.error("Unexpected remaining args: %r" % (remainingArgs,))

  if options.oldSymbol is None:
    parser.error("Required \"--oldsymbol\" option was not specified")
  if options.newSymbol is None:
    parser.error("Required \"--newsymbol\" option was not specified")


  if (not options.twitter) and (not options.stocks):
    parser.error("Flags specifying a single type of metric to migrate can "
                 "only be used exclusively. Forwarding all metrics is already "
                 "the default behavior of this tool.")

  optionsTuple = namedtuple("optionsTuple", "htmServer "
                                            "apikey "
                                            "aggPeriod "
                                            "oldSymbol "
                                            "newSymbol "
                                            "twitter "
                                            "stocks")

  return optionsTuple(htmServer=options.htmServer,
                      apikey=options.apikey,
                      aggPeriod=options.aggPeriod,
                      oldSymbol=options.oldSymbol.upper(),
                      newSymbol=options.newSymbol.upper(),
                      twitter=options.twitter,
                      stocks=options.stocks)



def _renameTweetSampleMetric(oldSymbol, newSymbol, aggPeriod):
  """
  :param str oldSymbol: old stock symbol, upper case
  :param str newSymbol: new stock symbol, upper case
  :param int aggPeriod: metric aggregation period in seconds
  """
  g_log.info("Renaming tweet sample metrics")

  oldMetricName = gen_metrics_config.getTweetVolumeMetricName(oldSymbol)
  newMetricName = gen_metrics_config.getTweetVolumeMetricName(newSymbol)

  dbEngine = collectorsdb.engineFactory()

  # Rename the metric in tweet sample rows

  with dbEngine.begin() as conn:
    g_log.info("Verifying that new metric %s doesn't exist in table %s yet",
               newMetricName, schema.twitterTweetSamples)
    newMetricRows = conn.execute(
      sql.select([schema.twitterTweetSamples.c.metric])
      .where(schema.twitterTweetSamples.c.metric == newMetricName)
      .limit(1)).fetchall()
    assert not newMetricRows, newMetricRows

    g_log.info("Renaming tweet sample metric %s with %s",
               oldMetricName, newMetricName)

    conn.execute(
      schema.twitterTweetSamples  # pylint: disable=E1120
      .update()
      .where(schema.twitterTweetSamples.c.metric == oldMetricName)
      .values(metric=newMetricName))


  # Forward tweet metric samples to Taurus Engine

  g_log.info("Forwarding new tweet metric samples to Taurus engine...")

  # Get the aggregation timestamp of the starting tweet sample to forward
  #
  # NOTE: prior to March 2015, tweet samples didn't have a consistent reference
  # between twitter agent's restarts. This issue was address with the
  # introduction of emitted_sample_tracker table.
  #
  timestampScanLowerBound = (datetime.utcnow() -
                             timedelta(days=MAX_METRIC_SAMPLE_BACKLOG_DAYS))

  aggStartDatetime = dbEngine.execute(
    sql.select([schema.twitterTweetSamples.c.agg_ts],
      order_by=schema.twitterTweetSamples.c.agg_ts.asc())
    .where(schema.twitterTweetSamples.c.metric == newMetricName)
    .where(schema.twitterTweetSamples.c.agg_ts > timestampScanLowerBound)
    .limit(1)).scalar()

  # Get the timestamp of the most recent sample batch emitted to Taurus engine
  lastEmittedAggTime = metric_utils.queryLastEmittedSampleDatetime(
    key=_EMITTED_TWEET_VOLUME_SAMPLE_TRACKER_KEY)

  if lastEmittedAggTime is None:
    # Last emitted sample datetime has not been established yet; we'll rely
    # on the twitter agent to forward all metric samples to HTM engine
    g_log.info("Last emitted sample datetime has not been established yet; "
               "deferring metric sample forwarding to Twitter Agent.")
    return

  metricDataForwarder = MetricDataForwarder(
    metricSpecs=loadTwitterMetricSpecs(),
    aggSec=aggPeriod)

  metricDataForwarder.aggregateAndForward(
      aggStartDatetime=aggStartDatetime,
      stopDatetime=lastEmittedAggTime + timedelta(seconds=aggPeriod),
      metrics=[newMetricName])


  # Forward tweet media to dynamodb
  g_log.info("Forwarding twitter tweets to dynamodb using new symbol...")
  migrate_tweets_to_dynamodb.migrate(metrics=[newMetricName])



def main():
  """
  NOTE: main also serves as entry point for "console script" generated by setup
  """
  logging_support.LoggingSupport().initTool()

  try:
    options = _parseArgs()
    allSymbols = set(stockData["symbol"] for stockData in
                     metric_utils.getMetricsConfiguration().itervalues() )

    g_log.info("Verifying that agents are in hot_standby mode")
    for section in config.sections():
      assert config.get(section, "opmode") == config.OP_MODE_HOT_STANDBY

    g_log.info("Verifying that the old symbol has been removed from the "
               "metrics configuration")
    assert options.oldSymbol not in allSymbols

    g_log.info("Verifying that the new symbol is present in the metrics "
               "configuration")
    assert options.newSymbol in allSymbols

    if options.twitter and not options.stocks:
      g_log.info("Migrating ONLY twitter data from old-symbol=%s "
                 "to new-symbol=%s",
                 options.oldSymbol, options.newSymbol)
    elif options.stocks and not options.twitter:
      g_log.info("Migrating ONLY xignite stock data from old-symbol=%s "
                 "to new-symbol=%s",
                 options.oldSymbol, options.newSymbol)
    else:
      g_log.info("Migrating BOTH twitter and xignite stock data from "
                 "old-symbol=%s to new-symbol=%s",
                 options.oldSymbol, options.newSymbol)

    # Rename the metrics in collectorsdb and forward new metrics' samples to HTM
    # Engine
    with collectorsdb.engineFactory().begin() as conn:

      g_log.info("Modifying old metrics with new symbol")
      if options.twitter:
        _renameTweetSampleMetric(oldSymbol=options.oldSymbol,
                                 newSymbol=options.newSymbol,
                                 aggPeriod=options.aggPeriod)

      if options.stocks:
        renameStockQuery = (schema.xigniteSecurity  # pylint: disable=E1120
                            .update()
                            .where(schema.xigniteSecurity.c.symbol ==
                                   options.oldSymbol)
                            .values(symbol=options.newSymbol))
        conn.execute(renameStockQuery)

        updateStockBarsQuery = (
          schema.xigniteSecurityBars  # pylint: disable=E1120
          .update()
          .where(schema.xigniteSecurityBars.c.symbol == options.oldSymbol)
          .values(symbol=options.newSymbol))
        conn.execute(updateStockBarsQuery)

        clearEmittedPriceQuery = (
          schema.emittedStockPrice  # pylint: disable=E1120
          .delete()
          .where(schema.emittedStockPrice.c.symbol == options.oldSymbol))
        conn.execute(clearEmittedPriceQuery)
        clearEmittedVolumeQuery = (
          schema.emittedStockVolume  # pylint: disable=E1120
          .delete()
          .where(schema.emittedStockVolume.c.symbol == options.oldSymbol))
        conn.execute(clearEmittedVolumeQuery)

        updateStockHeadlineQuery = (
          schema.xigniteSecurityHeadline  # pylint: disable=E1120
          .update()
          .where(schema.xigniteSecurityHeadline.c.symbol == options.oldSymbol)
          .values(symbol=options.newSymbol))
        conn.execute(updateStockHeadlineQuery)

        updateStockReleaseQuery = (
          schema.xigniteSecurityRelease  # pylint: disable=E1120
          .update()
          .where(schema.xigniteSecurityRelease.c.symbol == options.oldSymbol)
          .values(symbol=options.newSymbol))
        conn.execute(updateStockReleaseQuery)


      g_log.info("Forwarding new metric data to Taurus engine...")

      if options.stocks:
        forwardStockBars(metricSpecs=[spec for spec
                                      in loadStockBarsMetricSpecs()
                                      if spec.symbol == options.newSymbol],
                         symbol=options.newSymbol,
                         engine=conn)

    g_log.info("Unmonitoring and deleting existing metrics associated with "
               "symbol=%s", options.oldSymbol)
    oldModels = metric_utils.getSymbolModels(options.htmServer,
                                             options.apikey,
                                             options.oldSymbol)
    for model in oldModels:
      metric_utils.unmonitorMetric(options.htmServer, options.apikey, model.uid)
      metric_utils.deleteMetric(options.htmServer, options.apikey, model.name)

  except SystemExit as e:
    if e.code != 0:
      g_log.exception("Failed!")
    raise
  except Exception:
    g_log.exception("Failed!")
    raise



if __name__ == "__main__":
  main()
