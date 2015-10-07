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
import datetime

import boto.dynamodb2
from boto.dynamodb2.table import Table
import numpy
import requests

from nta.utils import error_reporting

from taurus.monitoring.monitor_dispatcher import MonitorDispatcher
from taurus.monitoring import (loadConfig,
                               loadEmailParamsFromConfig,
                               MonitorOptionParser)



MIN_THRESHOLD = 3600 # Required minimum number of seconds to pass since last
                     # known timestamp before a model may be _considered_ as
                     # not having recent data
SIGMA_MULTIPLIER = 3 # Standard deviation multiplier
FIXED_WINDOW = 14 # Number of days over which to calculate stddev



_ErrorParams = namedtuple("LatencyMonitorErrorParams",
                          "model_name model_uid threshold")



class LatencyMonitorError(Exception):
  pass



class ModelLatencyChecker(MonitorDispatcher):
  parser = MonitorOptionParser(
    usage="Usage: %prog --table=TABLE [options]",
    description=("Monitoring script to alert on models that do not have recent"
                 " data in public dynamodb table.  A model is considered to "
                 "have exceeded the acceptable threshold if the time since the"
                 "most recent sample exceeds a minimum, user-defined threshold"
                 " (in seconds) AND such interval exceeds a multiple of the "
                 "standard deviation for all intervals for that model during "
                 "a fixed window of time (14 days)."))

  parser.add_option("--threshold",
                    default=MIN_THRESHOLD,
                    type="int",
                    dest="threshold",
                    metavar="SECONDS",
                    help="Default: {}".format(MIN_THRESHOLD))
  parser.add_option("--sigma",
                    default=SIGMA_MULTIPLIER,
                    type="int",
                    dest="sigma",
                    help="Default: {}".format(SIGMA_MULTIPLIER))
  parser.add_option("--table",
                    type="string",
                    dest="table",
                    help="**REQUIRED dynamodb table name**")
  parser.add_option("--days",
                    default=FIXED_WINDOW,
                    type="int",
                    dest="days",
                    help="Default: {}".format(FIXED_WINDOW))


  def __init__(self):
    options = self.parser.parse_args()

    self.config = loadConfig(options)
    self.emailParams = loadEmailParamsFromConfig(self.config)
    self.apiKey = self.config.get("S1", "MODELS_MONITOR_TAURUS_API_KEY")
    self.modelsUrl = self.config.get("S1", "MODELS_MONITOR_TAURUS_MODELS_URL")
    self.region = self.config.get(
      "S1", "MODELS_MONITOR_TAURUS_DYNAMODB_REGION")
    self.awsAccessKeyId = self.config.get(
      "S1", "MODELS_MONITOR_TAURUS_DYNAMODB_AWS_ACCESS_KEY_ID")
    self.awsSecretAccessKey = self.config.get(
      "S1", "MODELS_MONITOR_TAURUS_DYNAMODB_AWS_SECRET_ACCESS_KEY")
    self.threshold = options.threshold
    self.sigma = options.sigma

    if not options.table:
      self.parser.error("You must specify a --table argument.")
    self.table = options.table

    self.days = options.days


  def dispatchNotification(self, checkFn, excType, excValue, excTraceback):
    """  Send notification.

    :param function checkFn: The check function that raised an exception
    :param type excType: Exception type
    :param exception excValue: Exception value
    :param traceback excTraceback: Exception traceback

    Required by MonitorDispatcher abc protocol.
    """
    error_reporting.sendMonitorErrorEmail(
      monitorName=__name__ + ":" + checkFn.__name__,
      resourceName=repr(self),
      message=self.formatTraceback(excType, excValue, excTraceback),
      subjectPrefix="Model Latency Monitor",
      params=self.emailParams
    )



@ModelLatencyChecker.registerCheck
def checkAllModelLatency(monitorObj):
  """ Check all model latencies by querying Taurus API for all models, and then
  checking DynamoDB for corresponding data.  Models that don't have recent
  data trigger an error.  Errors are batched up into a single exception
  reported by MonitorDispatcher.dispatchNotification() protocol

  :param ModelLatencyChecker monitorObj:
  """
  response = requests.get(monitorObj.modelsUrl, auth=(monitorObj.apiKey, ""),
                          timeout=60, verify=False)

  if response.status_code != 200:
    raise LatencyMonitorError("Unable to query Taurus API for active models: "
                              "Unexpected HTTP response status ({}) from {}"
                              .format(response.status_code,
                                      monitorObj.modelsUrl))
  conn = boto.dynamodb2.connect_to_region(
    monitorObj.region,
    aws_access_key_id=monitorObj.awsAccessKeyId,
    aws_secret_access_key=monitorObj.awsSecretAccessKey)

  table = Table(monitorObj.table, connection=conn)

  errors = []

  for model in response.json():
    # Query recent DynamoDB metric data for each model
    then = str(datetime.datetime.now() -
               datetime.timedelta(days=monitorObj.days))
    resultSet = table.query_2(uid__eq=model["uid"], timestamp__gte=then[:19])

    # Track all time intervals between valid (e.g. non-zero) samples
    intervals = []

    lastSampleTimestamp = None
    for sample in resultSet:

      if not sample["metric_value"]:
        continue # Skip

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

    # Only consider intervals that are more than N sigma AND above an arbitrary
    # minimum threshold.  More frequent companies will have a lower stddev and
    # therefore required a higher, if artifical, threshold to avoid too many
    # false positives
    acceptableThreshold = max(monitorObj.threshold, monitorObj.sigma * stddev)

    # If the hypothetical interval exceeds the acceptable threshold, then we
    # have a reasonable expectation that there may be a problem with the model
    if currentInterval > acceptableThreshold:
      errors.append(_ErrorParams(model["name"],
                                 model["uid"],
                                 acceptableThreshold))

  if errors:
    msg = ("The following models have exceeded the acceptable threshold for "
           "time since last timestamp in {} DynamoDB table:\n    "
           .format(table.table_name)) + "\n    ".join(str(error)
                                                      for error in errors)
    raise LatencyMonitorError(msg)


def main():
  ModelLatencyChecker().checkAll()


if __name__ == "__main__":
  main()
