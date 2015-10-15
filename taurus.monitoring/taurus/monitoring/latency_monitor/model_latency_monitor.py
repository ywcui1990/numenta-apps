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

from collections import namedtuple
import logging
import datetime

import boto.dynamodb2
from boto.dynamodb2.table import Table
import numpy
import requests

from nta.utils import error_reporting

from taurus.monitoring import (loadConfig,
                               loadEmailParamsFromConfig,
                               logging_support,
                               MonitorOptionParser,
                               TaurusMonitorError)
from taurus.monitoring.monitor_dispatcher import MonitorDispatcher




MIN_THRESHOLD = 3600 # Required minimum number of seconds to pass since last
                     # known timestamp before a model may be _considered_ as
                     # not having recent data
SIGMA_MULTIPLIER = 3 # Standard deviation multiplier.  According to 68-95-99.7
                     # rule, 99.73% of values are within 3 standard deviations
                     # from the mean, assuming a normal distribution.  For our
                     # purposes, intervals greater than 3 x stddev are
                     # exceptional for that data set
FIXED_WINDOW = 14 # Number of days over which to calculate stddev.



g_logger = logging.getLogger(__name__)



_ErrorParams = namedtuple("LatencyMonitorErrorParams",
                          "model_name model_uid threshold")



class LatencyMonitorError(TaurusMonitorError):
  pass



class ModelLatencyChecker(MonitorDispatcher):
  parser = MonitorOptionParser(
    usage="Usage: %prog --metricDataTable=TABLE [options]",
    description=("Monitoring script to alert on models that do not have recent"
                 " data in public metric data dynamodb table.  A model is "
                 "considered to have exceeded the acceptable threshold if the "
                 "time since the most recent sample exceeds a minimum, "
                 "user-defined threshold (in seconds) AND such interval "
                 "exceeds a multiple of the standard deviation for all "
                 "intervals for that model during a fixed window of time (14 "
                 "days)."))

  parser.add_option("--threshold",
                    default=MIN_THRESHOLD,
                    type="int",
                    dest="threshold",
                    metavar="SECONDS",
                    help=("Required minimum number of seconds to pass since "
                          "most-recent known timestamp before a model may be "
                          "_considered_ as not having recent data "
                          "(Default: {})").format(MIN_THRESHOLD))
  parser.add_option("--sigmaMultiplier",
                    default=SIGMA_MULTIPLIER,
                    type="int",
                    dest="sigmaMultiplier",
                    help=("Standard deviation multiplier. Consider 68-95-99.7 "
                          "rule.  For example, 99.7% of values fall within 3 "
                          "standard deviations of the mean.  Any value greater"
                          " than 3 x stddev is considered exceptional. "
                          "(Default: {})").format(SIGMA_MULTIPLIER))
  parser.add_option("--metricDataTable",
                    type="string",
                    dest="metricDataTable",
                    help="**REQUIRED metric data dynamodb table name**")
  parser.add_option("--days",
                    default=FIXED_WINDOW,
                    type="int",
                    dest="days",
                    help="Default: {}".format(FIXED_WINDOW))


  def __init__(self):
    options = self.parser.parse_options()

    logging_support.LoggingSupport.initLogging(
      loggingLevel=options.loggingLevel,
      console=options.loggingConsole,
      logToFile=True)

    self.config = loadConfig(options)
    self.emailParams = loadEmailParamsFromConfig(self.config)
    self.apiKey = self.config.get("S1", "MODELS_MONITOR_TAURUS_API_KEY")
    self.modelsUrl = self.config.get("S1", "MODELS_MONITOR_TAURUS_MODELS_URL")
    self.awsDynamoDBRegion = self.config.get(
      "S1", "MODELS_MONITOR_TAURUS_DYNAMODB_REGION")
    self.awsAccessKeyId = self.config.get(
      "S1", "MODELS_MONITOR_TAURUS_DYNAMODB_AWS_ACCESS_KEY_ID")
    self.awsSecretAccessKey = self.config.get(
      "S1", "MODELS_MONITOR_TAURUS_DYNAMODB_AWS_SECRET_ACCESS_KEY")
    self.threshold = options.threshold
    self.sigmaMultiplier = options.sigmaMultiplier

    if not options.metricDataTable:
      self.parser.error("You must specify a --metricDataTable argument.")
    self.metricDataTable = options.metricDataTable

    self.days = options.days
    self.options = options

    g_logger.info("Initialized {}".format(repr(self)))


  def __repr__(self):
    invocation = " ".join("--{}={}".format(key, value)
                          for key, value in vars(self.options).items())
    return "{} {}".format(self.parser.get_prog_name(), invocation)


  @MonitorDispatcher.preventDuplicates
  def dispatchNotification(self, checkFn, excType, excValue, excTraceback):
    """  Send notification.

    :param function checkFn: The check function that raised an exception
    :param type excType: Exception type
    :param exception excValue: Exception value
    :param traceback excTraceback: Exception traceback

    Required by MonitorDispatcher abc protocol.
    """
    dispatchKwargs = dict(
      monitorName=__name__ + ":" + checkFn.__name__,
      resourceName=repr(self),
      message=self.formatTraceback(excType, excValue, excTraceback),
      subjectPrefix="Model Latency Monitor",
      params=self.emailParams)

    g_logger.info("Dispatching notification: {}".format(dispatchKwargs))

    error_reporting.sendMonitorErrorEmail(**dispatchKwargs)


  def getModels(self):
    """ Queries models API for full model list

    :returns: list of model dicts
    """
    response = requests.get(self.modelsUrl, auth=(self.apiKey, ""),
                            timeout=60, verify=False)

    if response.status_code != 200:
      raise LatencyMonitorError("Unable to query Taurus API for active models:"
                                " Unexpected HTTP response status ({}) from {}"
                                .format(response.status_code, self.modelsUrl))

    return response.json()



  @MonitorDispatcher.registerCheck
  def checkAllModelLatency(self):
    """ Check all model latencies by querying Taurus API for all models, and
    then checking DynamoDB for corresponding data.  Models that don't have
    recent data trigger an error.  Errors are batched up into a single
    exception reported by MonitorDispatcher.dispatchNotification() protocol
    """
    models = self.getModels()

    conn = boto.dynamodb2.connect_to_region(
      self.awsDynamoDBRegion,
      aws_access_key_id=self.awsAccessKeyId,
      aws_secret_access_key=self.awsSecretAccessKey)

    metricDataTable = Table(self.metricDataTable, connection=conn)

    errors = []

    for model in models:
      # Query recent DynamoDB metric data for each model
      then = str(datetime.datetime.now() -
                 datetime.timedelta(days=self.days))
      resultSet = metricDataTable.query_2(uid__eq=model["uid"],
                                          timestamp__gte=then[:19])

      # Track all time intervals between valid (e.g. non-zero) samples
      intervals = []

      lastSampleTimestamp = None
      for sample in resultSet:

        if not sample["metric_value"]:
          continue

        timestamp = datetime.datetime.strptime(sample["timestamp"],
                                               "%Y-%m-%dT%H:%M:%S")

        if lastSampleTimestamp is None:
          lastSampleTimestamp = timestamp
          continue

        intervals.append((timestamp - lastSampleTimestamp).total_seconds())
        lastSampleTimestamp = timestamp

      # Calculate current UTC timestamp adjusted to account for acceptable
      # 10-minute delay in processing.
      utcnow = datetime.datetime.utcnow() - datetime.timedelta(minutes=10)

      stddev = numpy.std(intervals)
      if stddev == float("nan") or lastSampleTimestamp is None:
        errors.append(_ErrorParams(model["name"], model["uid"], None))
        continue

      # Fabricate a hypothetical interval representing the amount of time since
      # the most recent valid timestamp
      currentInterval = (utcnow - lastSampleTimestamp).total_seconds()

      # Only consider intervals that are more than N sigma AND above an
      # arbitrary minimum threshold.  More frequent companies will have a
      # lower stddev and therefore required a higher, if artifical, threshold
      # to avoid too many false positives
      acceptableThreshold = max(self.threshold,
                                self.sigmaMultiplier * stddev)

      # If the hypothetical interval exceeds the acceptable threshold, then we
      # have a reasonable expectation that there may be a problem with the
      # model
      if currentInterval > acceptableThreshold:
        errors.append(_ErrorParams(model["name"],
                                   model["uid"],
                                   acceptableThreshold))

    g_logger.info("Processed statistics for {} model{}, found {} error{}."
                  .format(len(models),
                          "s" if len(models) != 1 else "",
                          len(errors),
                          "s" if len(errors) != 1 else ""))

    if errors:
      msg = ("The following models have exceeded the acceptable threshold for "
             "time since last timestamp in {} DynamoDB table:\n    {}"
             .format(metricDataTable.table_name,
                     "\n    ".join(str(error) for error in errors)))
      raise LatencyMonitorError(msg)



def main():
  ModelLatencyChecker().checkAll()



if __name__ == "__main__":
  main()
