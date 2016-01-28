# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2016, Numenta, Inc.  Unless you have purchased from
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

import datetime
from mock import Mock, patch
import unittest

from taurus.metric_collectors import logging_support
from taurus.metric_collectors.xignite import xignite_stock_agent


def setUpModule():
  logging_support.LoggingSupport.initTestApp()


class XigniteStockAgentTestCase(unittest.TestCase):

  @patch(
    "taurus.metric_collectors.xignite.xignite_stock_agent.transmitMetricData",
    autospec=True)
  @patch(
    "taurus.metric_collectors.xignite.xignite_stock_agent._getLatestSample",
    autospec=True)
  @patch(
    "taurus.metric_collectors.xignite.xignite_stock_agent.collectorsdb",
    autospec=True)
  def testForwardAfterHours(self, collectorsdb, _getLatestSample,
      transmitMetricData):
    """ After-hours data should be silenty ignored.
    """

    mockSample = Mock(EndDate=datetime.date(2015, 1, 15),
                      EndTime=datetime.time(17, 30, 0))
    _getLatestSample.return_value = mockSample

    data = [
      {
          "StartDate": "1/15/2015",
          "StartTime": "5:30:00 PM",
          "EndDate": "1/15/2015",
          "EndTime": "5:35:00 PM",
          "UTCOffset": -5,
          "Open": 46.225,
          "High": 46.38,
          "Low": 45.955,
          "Close": 45.96,
          "Volume": 504494,
          "Trades": 2414,
          "TWAP": 46.1765,
          "VWAP": 46.1756
      }
    ]

    security = {
      "CIK": "0000789019",
      "CUSIP": None,
      "Symbol": "MSFT",
      "ISIN": None,
      "Valoren": "951692",
      "Name": "Microsoft Corp",
      "Market": "NASDAQ",
      "MarketIdentificationCode": "XNAS",
      "MostLiquidExchange": True,
      "CategoryOrIndustry": "InformationTechnologyServices"
    }


    collectorsdb.retryOnTransientErrors.side_effect = [
      Mock(),
      Mock(),
      Mock(return_value = [Mock(StartDate=datetime.date(2015, 1, 15),
                                StartTime=datetime.time(17, 30),
                                EndDate=datetime.date(2015, 1, 15),
                                EndTime=datetime.time(17, 35),
                                UTCOffset=-5.0,
                                Volume=504494,
                                Close=45.96,
                                Close_sent=None,
                                Volume_sent=None,
                                __getitem__ = Mock(side_effect = {
                                  "Close_sent": None,
                                  "Volume_sent": None,
                                  "Volume": 504494}.__getitem__),
                                __contains__ = Mock(side_effect={
                                  "Volume": None
                                  }.__contains__))
                          ])
    ]


    msft = xignite_stock_agent.StockMetricSpec(
      metricName="XIGNITE.MSFT.VOLUME",
      symbol="MSFT",
      stockExchange="NASDAQ",
      sampleKey="Volume")

    xignite_stock_agent.forward((msft,), data, security)

    self.assertEqual(
      collectorsdb.engineFactory.return_value.execute.call_count,
      0,
      "Unexpected database query issued for after-hours record. xignite_stock_"
      "agent.forward() should silently ignore after-hours data.")

    self.assertNotEqual(
      transmitMetricData.call_count,
      0,
      "transmitMetricData() was not called as expected.")
