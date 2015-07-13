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
from datetime import timedelta
import logging
import math
from optparse import OptionParser
import os

from sqlalchemy import sql

from nta.utils.date_time_utils import epochFromNaiveUTCDatetime
from taurus.metric_collectors import (
    ApplicationConfig,
    collectorsdb,
    config,
    logging_support,
    metric_utils)
from taurus.metric_collectors.collectorsdb.schema import (
    emittedStockPrice as stockEmittedPriceSchema,
    twitterTweetSamples as tweetSamplesSchema,
    xigniteSecurity as stockSchema,
    xigniteSecurityBars as stockBarsSchema,
    xigniteSecurityHeadline as stockHeadlineSchema,
    xigniteSecurityRelease as stockReleaseSchema
)
from taurus.metric_collectors.twitterdirect import migrate_tweets_to_dynamodb
from taurus.metric_collectors.twitterdirect.twitter_direct_agent import (
    MetricDataForwarder,
    loadMetricSpecs as loadTwitterMetricSpecs
)
from taurus.metric_collectors.xignite.xignite_stock_agent import (
    _transmitMetricData as forwardStockBars,
    loadMetricSpecs as loadStockBarsMetricSpecs
)



DEFAULT_HTM_SERVER = os.environ.get("TAURUS_HTM_SERVER")
_EMITTED_TWEET_VOLUME_SAMPLE_TRACKER_KEY = "twitter-tweets-volume"
_EMITTED_NEWS_VOLUME_SAMPLE_TRACKER_KEY = "xignite-security-news-volume"



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



def main():
  """
  NOTE: main also serves as entry point for "console script" generated by setup
  """
  logging_support.LoggingSupport().initTool()

  try:
    options = _parseArgs()

    g_log.info("Verifying that agents are in hot_standby mode")
    for section in config.sections():
      try:
        assert(config.get(section, "opmode") == ApplicationConfig.OP_MODE_HOT_STANDBY)
      except Exception, e:
        raise

    g_log.info("Verifying that the old symbol has been removed from the "
               "metrics configuration")
    for stockData in metric_utils.getMetricsConfiguration().itervalues():
      assert(stockData["symbol"] != options.oldSymbol)

    if options.twitter and (not options.stocks):
      g_log.info("Migrating ONLY twitter data from old-symbol=%s "
                 "to new-symbol=%s",
                 options.oldSymbol, options.newSymbol)
    elif options.stocks and (not options.twitter):
      g_log.info("Migrating ONLY xignite stock data from old-symbol=%s "
                 "to new-symbol=%s",
                 options.oldSymbol, options.newSymbol)
    else:
      g_log.info("Migrating BOTH twitter and xignite stock data from "
                 "old-symbol=%s to new-symbol=%s",
                 options.oldSymbol, options.newSymbol)

    oldSymbolTweetPrefix = "TWITTER.TWEET.HANDLE.{symbol}.".format(symbol=options.oldSymbol)
    newSymbolTweetPrefix = "TWITTER.TWEET.HANDLE.{symbol}.".format(symbol=options.newSymbol)
    oldSymbolTweetMetricsList = []

    with collectorsdb.engineFactory().begin() as conn:

      g_log.info("Modifying old metrics for new symbol")
      if options.twitter:
        oldSymbolTweetMetricsQuery = (sql.select([tweetSamplesSchema.c.metric
                                                 .distinct()])
                                      .where(tweetSamplesSchema.c.metric
                                             .contains(oldSymbolTweetPrefix)))
        oldSymbolTweetMetrics = conn.execute(oldSymbolTweetMetricsQuery)

        for tweetSample in oldSymbolTweetMetrics:
          newMetricName = "{newPrefix}{metric}".format(
              newPrefix=newSymbolTweetPrefix,
              metric=tweetSample.metric[len(oldSymbolTweetPrefix):])
          if tweetSample.metric not in oldSymbolTweetMetricsList:
            oldSymbolTweetMetricsList.append(tweetSample.metric)

          updateSampleQuery = (tweetSamplesSchema
                               .update()
                               .where(tweetSamplesSchema.c.metric
                                      .contains(oldSymbolTweetPrefix))
                               .values(metric=newMetricName))

          conn.execute(updateSampleQuery)

      if options.stocks:
        renameStockQuery = (stockSchema
                            .update()
                            .where(stockSchema.c.symbol ==
                                   options.oldSymbol)
                            .values(symbol=options.newSymbol))
        conn.execute(renameStockQuery)

        updateStockBarsQuery = (stockBarsSchema
                                .update()
                                .where(stockBarsSchema.c.symbol ==
                                       options.oldSymbol)
                                .values(symbol=options.newSymbol))
        conn.execute(updateStockBarsQuery)

        clearEmittedPriceQuery = (stockEmittedPriceSchema
                                  .delete()
                                  .where(stockEmittedPriceSchema.c.symbol ==
                                         options.oldSymbol))
        conn.execute(clearEmittedPriceQuery)

        updateStockHeadlineQuery = (stockHeadlineSchema
                                    .update()
                                    .where(stockHeadlineSchema.c.symbol ==
                                           options.oldSymbol)
                                    .values(symbol=options.newSymbol))
        conn.execute(updateStockHeadlineQuery)

        updateStockReleaseQuery = (stockReleaseSchema
                                   .update()
                                   .where(stockReleaseSchema.c.symbol ==
                                          options.oldSymbol)
                                   .values(symbol=options.newSymbol))
        conn.execute(updateStockReleaseQuery)


      g_log.info("Forwarding new metric data to Taurus engine...")
      if options.twitter:
        oldestRecordTs = conn.execute(sql.select(
            [tweetSamplesSchema.c.agg_ts],
            order_by=tweetSamplesSchema.c.agg_ts.asc())).first()[0]
        lastEmittedAggTime = metric_utils.establishLastEmittedSampleDatetime(
          key=_EMITTED_TWEET_VOLUME_SAMPLE_TRACKER_KEY,
          aggSec=options.aggPeriod)
        aggOffset = math.ceil(
          (epochFromNaiveUTCDatetime(lastEmittedAggTime) -
           epochFromNaiveUTCDatetime(oldestRecordTs)) / options.aggPeriod) * options.aggPeriod
        aggStartDatetime = (lastEmittedAggTime -
                            timedelta(seconds=aggOffset) -
                            timedelta(seconds=options.aggPeriod))

        metric_utils.updateLastEmittedSampleDatetime(
            key=_EMITTED_TWEET_VOLUME_SAMPLE_TRACKER_KEY,
            sampleDatetime=aggStartDatetime)

        MetricDataForwarder.runInThread(
            metricSpecs=loadTwitterMetricSpecs(),
            aggSec=options.aggPeriod,
            symbolList=[options.newSymbol],
            forwardOnlyBacklog=True)

        metric_utils.updateLastEmittedSampleDatetime(
            key=_EMITTED_TWEET_VOLUME_SAMPLE_TRACKER_KEY,
            sampleDatetime=lastEmittedAggTime)

      if options.stocks:
        forwardStockBars(metricSpecs=[spec for spec
                                      in loadStockBarsMetricSpecs()
                                      if spec.symbol == options.newSymbol],
                         symbol=options.newSymbol,
                         engine=conn)


    if options.twitter:
      g_log.info("Forwarding twitter tweets to dynamodb using new symbol...")
      migrate_tweets_to_dynamodb.main(symbolList=[options.newSymbol])


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
