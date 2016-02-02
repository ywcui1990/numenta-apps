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
import logging
from mock import patch
import os
import sys
import tempfile
import unittest

import numpy

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
    _assertArgumentPatternFails(["--csv="])
    _assertArgumentPatternFails(['--csv="1"'])
    _assertArgumentPatternFails(["--rowOffset="])
    _assertArgumentPatternFails(['--rowOffset=1'])
    _assertArgumentPatternFails(["--timestampIndex="])
    _assertArgumentPatternFails(['--timestampIndex=1'])
    _assertArgumentPatternFails(["--valueIndex="])
    _assertArgumentPatternFails(['--valueIndex=1'])
    _assertArgumentPatternFails(["--datetimeFormat="])
    _assertArgumentPatternFails(['--datetimeFormat="%Y-%m-%d %H:%M:%S"'])
    _assertArgumentPatternFails(['--csv="1"', '--rowOffset=1'])
    _assertArgumentPatternFails(['--csv="1"',
                                 '--rowOffset=1',
                                 '--valueIndex=1'])
    _assertArgumentPatternFails(['--csv="1"',
                                 '--rowOffset=1',
                                 '--valueIndex=1',
                                 "--timestampIndex=1"])

    _assertArgumentPatternPasses(['--csv="1"',
                                 "--valueIndex=1",
                                 '--rowOffset=1',
                                 '--timestampIndex=1',
                                 '--datetimeFormat="%Y-%m-%d %H:%M:%S"'])


  def testReadCSVFile(self):
    """
    Verify CSV file can be correctly read via  _readCSVFile function
    """
    tmpfilepath = os.path.join(tempfile.gettempdir(), "tmp-testfile.csv")
    with open(tmpfilepath, "wb") as file:
      fileWriter = csv.writer(file)
      fileWriter.writerow(['timeStamps', 'values'])
      fileWriter.writerow(['2014-04-01 00:00:00', 20.0])

    (timeStamps, values) = param_finder_runner._readCSVFile(
      fileName=tmpfilepath,
      rowOffset=1,
      timestampIndex=0,
      valueIndex=1,
      datetimeFormat="%Y-%m-%d %H:%M:%S"
    )
    self.assertAlmostEqual(values[0], 20.0)
    self.assertAlmostEqual(timeStamps[0],
                           numpy.datetime64('2014-04-01 00:00:00'))
    os.remove(tmpfilepath)


if __name__ == "__main__":
  unittest.main()
