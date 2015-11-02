# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero Public License for more details.
#
# You should have received a copy of the GNU Affero Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------

"""
Unittest of taurus/monitoring/latency_monitor/model_latency_monitor.py
"""
import datetime
from mock import Mock, patch
import pickle
import unittest
import os

#from nta.utils.config import Config
from nta.utils.test_utils import patch_helpers

from taurus.monitoring.latency_monitor.model_latency_monitor import (
  LatencyMonitorError,
  main,
  ModelLatencyChecker
)

# Absolute path to directory in which test.conf configuration file may be found
_CONF_DIR = os.path.dirname(os.path.abspath(__file__))
_TEST_CONF_FILEPATH = os.path.join(_CONF_DIR, "test.conf")

# Absolute path to directory in which pickled metric data files may be found
_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")



def getPickledMetricDataFilename(modelName, dataDir=_DATA_DIR):
  """ Get absolute path to filename containing pickled metric data

  :param str modelName:
  :returns: Absolute path to filename containing pickled metric data
  :rtype: str
  """
  return os.path.join(dataDir, modelName + "-data.pickle")



class ModelLatencyCheckerTest(unittest.TestCase):
  models = (
    [{u"datasource": u"custom",
      u"description": u"Custom metric TWITTER.TWEET.HANDLE.SPG.VOLUME",
      u"display_name": u"Simon Property Group",
      u"last_rowid": 94858,
      u"last_timestamp": None,
      u"location": u"",
      u"message": None,
      u"name": u"TWITTER.TWEET.HANDLE.SPG.VOLUME",
      u"parameters": {u"datasource": u"custom",
                      u"metricSpec": {
                        u"metric": u"TWITTER.TWEET.HANDLE.SPG.VOLUME",
                        u"resource": u"Simon Property Group",
                        u"userInfo": {u"metricType": u"TwitterVolume",
                                      u"metricTypeName": u"Twitter Volume",
                                      u"symbol": u"SPG"}},
                      u"modelParams": {u"minResolution": 0.6}},
      u"poll_interval": 300,
      u"server": u"Simon Property Group",
      u"status": 1,
      u"tag_name": None,
      u"uid": u"0021c2d17c0a4eb4965b6cb315c1d2e9"},
     {u"datasource": u"custom",
      u"description": u"Custom metric XIGNITE.TRI.VOLUME",
      u"display_name": u"Thomson Reuters",
      u"last_rowid": 19191,
      u"last_timestamp": None,
      u"location": u"",
      u"message": None,
      u"name": u"XIGNITE.TRI.VOLUME",
      u"parameters": {u"datasource": u"custom",
                      u"metricSpec": {u"metric": u"XIGNITE.TRI.VOLUME",
                                      u"resource": u"Thomson Reuters",
                                      u"userInfo": {
                                        u"metricType": u"StockVolume",
                                        u"metricTypeName": u"Stock Volume",
                                        u"symbol": u"TRI"}},
                      u"modelParams": {u"minResolution": 0.2}},
      u"poll_interval": 300,
      u"server": u"Thomson Reuters",
      u"status": 1,
      u"tag_name": None,
      u"uid": u"00261089e61b4af1a1e4b3d0c06aa84a"},
     {u"datasource": u"custom",
      u"description": u"Custom metric XIGNITE.BK.CLOSINGPRICE",
      u"display_name": u"Bank of New York Mellon",
      u"last_rowid": 19190,
      u"last_timestamp": None,
      u"location": u"",
      u"message": None,
      u"name": u"XIGNITE.BK.CLOSINGPRICE",
      u"parameters": {u"datasource": u"custom",
                      u"metricSpec": {u"metric": u"XIGNITE.BK.CLOSINGPRICE",
                                      u"resource": u"Bank of New York Mellon",
                                      u"userInfo": {
                                        u"metricType": u"StockPrice",
                                        u"metricTypeName": u"Stock Price",
                                        u"symbol": u"BK"}},
                      u"modelParams": {u"minResolution": 0.2}},
      u"poll_interval": 300,
      u"server": u"Bank of New York Mellon",
      u"status": 1,
      u"tag_name": None,
      u"uid": u"018662cc75b14860b72319d92883c896"}]
  )

  metricDataById = {
    model["uid"]: pickle.load(
      open(getPickledMetricDataFilename(model["name"]), "r"))
    for model in models
  }



  # Mock command line arguments, specifying test config file and bogus
  # metric data table name
  @patch_helpers.patchCLIArgs("taurus-model-latency-monitor",
                              "--monitorConfPath",
                              _TEST_CONF_FILEPATH,
                              "--metricDataTable",
                              "taurus.metric_data.test")
  # Prevent Taurus HTTP API calls
  @patch("requests.get", autospec=True)
  # Prevent boto dynamodb API calls
  @patch("boto.dynamodb2", autospec=True)
  @patch("taurus.monitoring.latency_monitor.model_latency_monitor.Table",
         autospec=True)
  # Fix datetime.datetime.utcnow() to known time relative to cached metric data
  @patch_helpers.patchUTCNow(datetime.datetime(2015, 11, 1, 22, 41, 0, 0))
  # Prevent notifications from being dispatched
  @patch("taurus.monitoring.latency_monitor.model_latency_monitor"
         ".ModelLatencyChecker.dispatchNotification")
  # Disable pylint warning re: unused botoDynamoDB2Mock argument
  # pylint: disable=W0613
  def testCheckAll(self, dispatchNotificationMock, tableMock,
                   botoDynamoDB2Mock, requestsGetMock):

    # Mock API to return pre-defined models in lieu of making an API call to
    # a live taurus models HTTP endpoint
    requestsGetMock.return_value = Mock(status_code=200,
                                        json=Mock(return_value=self.models))

    # Mock boto dynamodb queries by returning locally cached metric data.
    # See data/*-data.pickle
    # Disable pylint warning about unused, and improperly named arguments
    # pylint: disable=W0613,C0103
    def query2SideEffect(uid__eq, timestamp__gte):
      return self.metricDataById[uid__eq]

    tableMock.return_value = Mock(query_2=Mock(side_effect=query2SideEffect))

    # Run all checks normally
    ModelLatencyChecker().checkAll()

    self.assertEqual(dispatchNotificationMock.call_count, 1)

    (_, excType, excValue, _), _ = dispatchNotificationMock.call_args_list[0]
    self.assertIs(excType, LatencyMonitorError)
    self.assertIsInstance(excValue, LatencyMonitorError)
    self.assertEqual(
      excValue.message,
      "The following models have exceeded the acceptable threshold for time si"
      "nce last timestamp in taurus.metric_data.test DynamoDB table:\n    Late"
      "ncyMonitorErrorParams(model_name=u'XIGNITE.TRI.VOLUME', model_uid=u'002"
      "61089e61b4af1a1e4b3d0c06aa84a', threshold=31640.219257818433)\n    Late"
      "ncyMonitorErrorParams(model_name=u'XIGNITE.BK.CLOSINGPRICE', model_uid="
      "u'018662cc75b14860b72319d92883c896', threshold=31640.219257818433)")


  # Mock command line arguments, specifying test config file and bogus
  # metric data table name
  @patch_helpers.patchCLIArgs("taurus-model-latency-monitor",
                              "--monitorConfPath",
                              _TEST_CONF_FILEPATH,
                              "--metricDataTable",
                              "taurus.metric_data.test")
  # Prevent Taurus HTTP API calls
  @patch("requests.get", autospec=True)
  # Prevent notifications from being dispatched
  @patch("taurus.monitoring.latency_monitor.model_latency_monitor"
         ".ModelLatencyChecker.dispatchNotification")
  # Disable pylint warning re: unused botoDynamoDB2Mock argument
  # pylint: disable=W0613
  def testCheckAllGracefullyHandlesAPIFailure(self, dispatchNotificationMock,
                                              requestsGetMock):

    # Mock API to return 500 status in lieu of making an API call to a live
    # taurus models HTTP endpoint
    requestsGetMock.return_value = Mock(status_code=500)

    # Run all checks normally
    ModelLatencyChecker().checkAll()

    self.assertEqual(dispatchNotificationMock.call_count, 1)

    (_, excType, excValue, _), _ = dispatchNotificationMock.call_args_list[0]
    self.assertIs(excType, LatencyMonitorError)
    self.assertIsInstance(excValue, LatencyMonitorError)
    self.assertIn(
      ("Unable to query Taurus API for active models: Unexpected HTTP response"
       " status (500) from taurusModelsUrl"),
      excValue.message)


  # Mock command line arguments, specifying test config file and bogus
  # metric data table name
  @patch_helpers.patchCLIArgs("taurus-model-latency-monitor",
                              "--monitorConfPath",
                              _TEST_CONF_FILEPATH,
                              "--metricDataTable",
                              "taurus.metric_data.test")
  # Prevent Taurus HTTP API calls
  @patch("requests.get", autospec=True)
  # Prevent boto dynamodb API calls
  @patch("boto.dynamodb2", autospec=True)
  @patch("taurus.monitoring.latency_monitor.model_latency_monitor.Table",
         autospec=True)
  # Fix datetime.datetime.utcnow() to known time relative to cached metric data
  @patch_helpers.patchUTCNow(datetime.datetime(2015, 11, 1, 22, 41, 0, 0))
  # Prevent notifications from being dispatched
  @patch("taurus.monitoring.latency_monitor.model_latency_monitor"
         ".ModelLatencyChecker.dispatchNotification")
  # Disable pylint warning re: unused botoDynamoDB2Mock argument
  # pylint: disable=W0613
  def testCheckAllGracefullyHandlesNoMetricData(self, dispatchNotificationMock,
                                                tableMock, botoDynamoDB2Mock,
                                                requestsGetMock):

    # Mock API to return pre-defined models in lieu of making an API call to
    # a live taurus models HTTP endpoint
    requestsGetMock.return_value = Mock(status_code=200,
                                        json=Mock(return_value=self.models))

    # Mock boto dynamodb queries by returning locally cached metric data.
    # See data/*-data.pickle
    # Disable pylint warning about unused, and improperly named arguments
    # pylint: disable=W0613,C0103
    def query2SideEffect(uid__eq, timestamp__gte):
      return []

    tableMock.return_value = Mock(query_2=Mock(side_effect=query2SideEffect))

    # Run all checks normally
    ModelLatencyChecker().checkAll()

    self.assertEqual(dispatchNotificationMock.call_count, 1)

    (_, excType, excValue, _), _ = dispatchNotificationMock.call_args_list[0]
    self.assertIs(excType, LatencyMonitorError)
    self.assertIsInstance(excValue, LatencyMonitorError)
    self.assertEqual(
      excValue.message,
      "The following models have exceeded the acceptable threshold for time si"
      "nce last timestamp in taurus.metric_data.test DynamoDB table:\n    Late"
      "ncyMonitorErrorParams(model_name=u'TWITTER.TWEET.HANDLE.SPG.VOLUME', mo"
      "del_uid=u'0021c2d17c0a4eb4965b6cb315c1d2e9', threshold=None)\n    Laten"
      "cyMonitorErrorParams(model_name=u'XIGNITE.TRI.VOLUME', model_uid=u'0026"
      "1089e61b4af1a1e4b3d0c06aa84a', threshold=None)\n    LatencyMonitorError"
      "Params(model_name=u'XIGNITE.BK.CLOSINGPRICE', model_uid=u'018662cc75b14"
      "860b72319d92883c896', threshold=None)")


  # Mock command line arguments, specifying test config file and ommitting
  # metric data table name
  @patch_helpers.patchCLIArgs("taurus-model-latency-monitor",
                              "--monitorConfPath",
                              _TEST_CONF_FILEPATH)
  def testMissingMetricDataTableArgRaisesParserError(self):

    # Assert that not specifying a required --metricDataTable option will
    # result in a parser error, and consequently a sys.exit(), as indicated by
    # the SystemExit exception
    with self.assertRaises(SystemExit):
      ModelLatencyChecker().checkAll()


  # Mock command line arguments, omitting config file and specifying bogus
  # metric data table name
  @patch_helpers.patchCLIArgs("taurus-model-latency-monitor",
                              "--metricDataTable",
                              "taurus.metric_data.test")
  def testMissingMonitorConfPathArgRaisesParserError(self):

    # Assert that not specifying a required --monitorConfPath option will
    # result in a parser error, and consequently a sys.exit(), as indicated by
    # the SystemExit exception
    with self.assertRaises(SystemExit):
      ModelLatencyChecker().checkAll()


  # Prevent ModelLatencyChecker from actually being instantiated
  @patch("taurus.monitoring.latency_monitor.model_latency_monitor"
         ".ModelLatencyChecker", autospec=True)
  def testMain(self, modelLatencyCheckerMock):
    main()
    modelLatencyCheckerMock.assert_called_once_with()
    modelLatencyCheckerMock.return_value.checkAll.assert_called_once_with()



class ModelLatencyCheckerUtil(ModelLatencyChecker):
  """ Utility helper class for generating new metric data samples from a live
  taurus configuration.

  Usage::

     ModelLatencyCheckerUtil().run()

  This class subclasses ModelLatencyChecker and augments the command line
  parser to accept additional options specific to the process of caching
  metric data samples.  For example:

    python tests/unit/model_latency_monitor_test.py \
      --generateMetricDataSamples \
      --monitorConfPath <path to moniting configuration file> \
      --metricDataTable <taurus metric data dynamodb table name>

  """
  def __init__(self):
    self.parser.add_option("--generateMetricDataSamples",
                                        action="store_true",
                                        default=False)
    self.parser.add_option("--destinationDir",
                                        type="str",
                                        default=_DATA_DIR)
    super(ModelLatencyCheckerUtil, self).__init__()


  def run(self):
    if self.options.generateMetricDataSamples:
      self.generateMetricDataSamples()
    else:
      self.parser.error("Unknown operation.  See --help for details")


  def generateMetricDataSamples(self):
    for model in ModelLatencyCheckerTest.models:
      resultSet = self.getMetricData(metricUid=model["uid"])

      # Cache only a sumset of the data used in the monitor and test
      metricData = [
        {"timestamp": sample["timestamp"],
          "metric_value": sample["metric_value"]
        } for sample in resultSet
      ]

      filename = getPickledMetricDataFilename(model["name"],
                                              self.options.destinationDir)
      with open(filename, "w") as outp:
        pickle.dump(metricData, outp)



if __name__ == "__main__":
  util = ModelLatencyCheckerUtil().run()
