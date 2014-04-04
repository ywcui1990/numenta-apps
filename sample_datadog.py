#!/usr/bin/env python
#------------------------------------------------------------------------------
# Copyright 2013-2014 Numenta Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#------------------------------------------------------------------------------

"""Pull data from Grok and upload to Datadog.

This script takes the metric ID for a Grok metric and downloads the most recent
data. It is designed to be run every five minutes or so and will upload
duplicate records. This is fine as long as you don't select "sum" for the
aggregation method in Datadog.

The data is uploaded as two separate Datadog metrics. One for the values and one
for the anomaly scores. The Grok metric server is used as the Datadog host. The
Grok metric name is combined with either ".value" or ".anomalyScore" to make up
the Datadog metric name.
"""

import calendar
import datetime
import optparse
import sys

from dogapi import dog_http_api

from grokcli.api import GrokSession



def _getMetricName(grok, metricId):
  response = grok.get(grok.server + "/_models/" + metricId,
                      auth=grok.auth)
  model = response.json()[0]
  return model["server"], model["name"]



def _getMetricData(grok, metricId, numRecords):
  url = grok.server + "/_models/" + metricId + "/data"
  if numRecords:
    url += "?limit=%i" % numRecords
  response = grok.get(url, auth=grok.auth)
  data = response.json()["data"]
  valuesData = []
  anomaliesData = []
  first = None
  last = None
  for dtStr, value, anomalyScore, _ in reversed(data):
    if not first:
      first = dtStr
    last = dtStr
    dt = datetime.datetime.strptime(dtStr, "%Y-%m-%d %H:%M:%S")
    ts = calendar.timegm(dt.utctimetuple())
    valuesData.append((ts, value))
    anomaliesData.append((ts, anomalyScore))
  print "First: %s and last: %s" % (first, last)
  return valuesData, anomaliesData



def sendDataToDatadog(datadogApiKey, grokServer, grokApiKey, numRecords,
                      metricId):
  # Configure the Datadog library
  dog_http_api.api_key = datadogApiKey

  grok = GrokSession(server=grokServer, apikey=grokApiKey)
  server, metricName = _getMetricName(grok, metricId)
  valuesData, anomaliesData = _getMetricData(grok, metricId, numRecords)
  print "Sending %i records for metric %s on server %s" % (
      len(valuesData), metricName, server)
  response = dog_http_api.metric(metricName + ".value", valuesData,
                                 host=server)
  if response["status"] != "ok":
    print "Datadog upload failed with response:\n\n%r" % response
  response = dog_http_api.metric(metricName + ".anomalyScore", anomaliesData,
                                 host=server)
  if response["status"] != "ok":
    print "Datadog upload failed with response:\n\n%r" % response



if __name__ == "__main__":
  usage = "usage: %prog [options] metricId"
  parser = optparse.OptionParser(usage=usage)
  parser.add_option("--datadogApiKey", help="the API key for Datadog")
  parser.add_option("--grokServer", help="the Grok server URL")
  parser.add_option("--grokApiKey", help="the Grok server API key")
  parser.add_option("--numRecords", type="int", default=6,
                    help="the number of records to fetch, or 0 to get all")

  options, extraArgs = parser.parse_args()

  if len(extraArgs) != 1:
    parser.error("incorrect number of arguments, expected 1 but got %i" %
                 len(extraArgs))

  if options.datadogApiKey is None:
    print "Must supply valid datadogApiKey"
    sys.exit(1)

  if options.grokServer is None:
    print "Must supply valid grokServer"
    sys.exit(1)

  if options.grokApiKey is None:
    print "Must supply valid grokApiKey"
    sys.exit(1)

  if options.numRecords is None:
    print "Must supply valid numRecords"
    sys.exit(1)

  sendDataToDatadog(options.datadogApiKey, options.grokServer,
                    options.grokApiKey, options.numRecords, extraArgs[0])
