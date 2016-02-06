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

"""Unit test of the unicorn_backend.param_finder_runner module"""

import csv
import datetime
import StringIO
import json
import logging
from mock import patch
import os
import sys
import tempfile
import unittest

from nta.utils.logging_support_raw import LoggingSupport
from unicorn_backend import param_finder_runner

_LOGGER = logging.getLogger("unicorn_param_finder_runner_test")



def setUpModule():
  LoggingSupport.initTestApp()



class ParamFinderRunnerTestCase(unittest.TestCase):
  def testParseArgs(self):
    """ Invalid CLI arguments are rejected
    """


    def _assertArgumentPatternFails(argumentPattern=None):
      if argumentPattern is None:
        argumentPattern = []

      argumentPattern = ["unicorn_backend/param_finder_runner.py"
                         ] + argumentPattern
      with patch.object(sys, "argv", argumentPattern):
        # pylint: disable=W0212)
        with self.assertRaises(param_finder_runner._CommandLineArgError):
          param_finder_runner._parseArgs()


    def _assertArgumentPatternPasses(argumentPattern=None):
      if argumentPattern is None:
        argumentPattern = []

      argumentPattern = ["unicorn_backend/param_finder_runner.py"
                         ] + argumentPattern
      with patch.object(sys, "argv", argumentPattern):
        # pylint: disable=W0212)
        param_finder_runner._parseArgs()


    _assertArgumentPatternFails()
    _assertArgumentPatternFails(["--input="])

    inputInfo = {
      'csv': "file.csv",
      'rowOffset': 4,
      'timestampIndex': 0,
      'valueIndex': 1,
      'datetimeFormat': "%m/%d/%y %H:%M"}
    inputInfo = json.dumps(inputInfo)

    _assertArgumentPatternPasses(['--input=' + inputInfo])


  def testReadCSVFile(self):
    """
    Verify CSV file can be correctly read via  _readCSVFile function
    """
    csvFd, csvPath = tempfile.mkstemp()
    self.addCleanup(os.unlink, csvPath)

    with open(csvPath, "wb") as csvFile:
      csvWriter = csv.writer(csvFile)
      csvWriter.writerow(['timeStamps', 'values'])
      csvWriter.writerow(['2014-04-01 00:00:00', 20.0])

    (timeStamps, values) = param_finder_runner._readCSVFile(
      fileName=csvPath,
      rowOffset=1,
      timestampIndex=0,
      valueIndex=1,
      datetimeFormat="%Y-%m-%d %H:%M:%S"
    )

    self.assertAlmostEqual(values[0], 20.0)
    self.assertAlmostEqual(str(timeStamps[0]),
                           '2014-04-01 00:00:00+00:00')


  def testParamFinderRunner(self):
    """
    End-to-end test that calls param finder runner's main with appropriate
    sys.argv, and then validate the value written to stdout
    """
    # Create a temp csv file containing the test dataset
    csvFd, csvPath = tempfile.mkstemp()
    self.addCleanup(os.unlink, csvPath)
    startTime = datetime.datetime(2016, 1, 1, 0, 0, 0)
    timeStep = datetime.timedelta(seconds=300)
    with open(csvPath, "wb") as csvFile:
      csvWriter = csv.writer(csvFile)
      csvWriter.writerow(['timeStamps', 'values'])
      for i in xrange(20):
        csvWriter.writerow([startTime + timeStep * i, 10.0])

    INPUT_INFO = {"datetimeFormat": "%Y-%m-%d %H:%M:%S",
                  "timestampIndex": 0,
                  "valueIndex": 1,
                  "rowOffset": 1,
                  "csv": csvPath}
    argumentPattern = ["unicorn_backend/param_finder_runner.py"] + \
                      ["--input=" + json.dumps(INPUT_INFO)]

    with patch.object(sys, "argv", argumentPattern):
      with patch('sys.stdout', new=StringIO.StringIO()) as fake_out:
        param_finder_runner.main()
        outputInfo = fake_out.getvalue()
        outputInfo = json.loads(outputInfo)

        # since we used a flat line as test data, there should be no aggregation
        self.assertTrue(outputInfo["aggInfo"] == None)
        self.assertTrue(outputInfo["modelInfo"]['modelConfig']['modelParams'] \
                          ['sensorParams']['encoders']['c0_timeOfDay'] == None)
        self.assertTrue(outputInfo["modelInfo"]['modelConfig']['modelParams'] \
                          ['sensorParams']['encoders']['c0_dayOfWeek'] == None)


