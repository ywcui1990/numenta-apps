#!/usr/bin/env python
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
Compatibility test of the unicorn_backend.model_runner_2 module

"""

import csv
import json
import logging
import os
import subprocess
import sys
import unittest


from nta.utils.logging_support_raw import LoggingSupport
from nta.utils import test_utils



_LOGGER = logging.getLogger("unicorn_model_runner_test")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")



def setUpModule():
  LoggingSupport.initTestApp()



class ModelRunnerCompatibilityTest(unittest.TestCase):


  @staticmethod
  def _startParamFinderRunnerSubprocess(inputSpec):
    """Start the unicorn param_finder subprocess

    :param str inputSpec: JSON object describing the input petric data
      per input_opt_schema.json
    :returns: the started subprocess.Popen object wrapped in
      ManagedSubprocessTerminator
    :rtype: nta.utils.test_utils.ManagedSubprocessTerminator
    """
    process = subprocess.Popen(
      args=[sys.executable,
            "-m", "unicorn_backend.param_finder_runner",
            "--input=%s" % inputSpec],
      stdin=subprocess.PIPE,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      close_fds=True)

    _LOGGER.info("Started unicorn model_runner subprocess=%s", process)
    return test_utils.ManagedSubprocessTerminator(process)


  @staticmethod
  def _startModelRunnerSubprocess(inputSpec, aggSpec, modelSpec):
    """Start the unicorn model_runner subprocess

    :param str inputSpec: JSON object describing the input petric data
      per input_opt_schema.json
    :param str aggSpec: JSON object describing agregation of the input
      metric per agg_opt_schema.json
    :param str modelSpec: JSON object describing the model per
      model_opt_schema.json
    :returns: the started subprocess.Popen object wrapped in
      ManagedSubprocessTerminator
    :rtype: nta.utils.test_utils.ManagedSubprocessTerminator
    """
    argumentPattern = [sys.executable,
                       "-m", "unicorn_backend.model_runner_2",
                       "--input=%s" % inputSpec,
                       "--model=%s" % modelSpec]
    if aggSpec is not None:
      argumentPattern += ["--agg=%s" % aggSpec]

    process = subprocess.Popen(
      args=argumentPattern,
      stdin=subprocess.PIPE,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      close_fds=True)

    _LOGGER.info("Started unicorn model_runner subprocess=%s", process)
    return test_utils.ManagedSubprocessTerminator(process)


  @staticmethod
  def _loadCsvFile(path):
    data = []

    with open(path, 'r') as infile:
      csvReader = csv.reader(infile)
      csvReader.next()
      for line in csvReader:
        data.append(line)

    return data


  def _testParamFinderRunner(self, name, inputSpec):
    """
    Make sure the paramFinder returns expected aggInfo and modelInfo

    :param str name: dataset name
    :param str inputSpec: JSON object describing the input petric data
      per input_opt_schema.json
    :return: json object that contains aggregation and model info
    """

    with self._startParamFinderRunnerSubprocess(inputSpec) as pfrProcess:
      outputInfo = pfrProcess.stdout.readline()
      outputInfo = json.loads(outputInfo)
    print json.dumps(outputInfo, indent=2)
    # with open(os.path.join(RESULTS_DIR, name+'_model_params.json')) as infile:
    #   expectedOutputInfo = json.loads(infile.read())
    #   self.assertEqual(outputInfo, expectedOutputInfo)
    return outputInfo


  def _testModelRunner(self, name, inputSpec, aggSpec, modelSpec):
    """
    Make sure model runner returns correct anomaly likelihood

    :param str name: dataset name
    :param str inputSpec: JSON object describing the input metric data
      per input_opt_schema.json
    :param str aggSpec: JSON object describing aggregation of the input
      metric per agg_opt_schema.json
    :param str modelSpec: JSON object describing the model per
      model_opt_schema.json
    """
    with self._startModelRunnerSubprocess(
      inputSpec, aggSpec, modelSpec) as mrProcess:

      stdoutData, stderrData = mrProcess.communicate()
      out = stdoutData.splitlines()
      self.assertEqual(stderrData, "")

      results = self._loadCsvFile(os.path.join(RESULTS_DIR, name+'.csv'))
      self.assertEqual(len(out), len(results))

      for computedResult, trueResult in zip(out, results):
        outputRecord = json.loads(computedResult)

        trueDataValue = float(trueResult[1])
        trueAnomalyLikelihood = float(trueResult[2])
        self.assertAlmostEqual(outputRecord[1], trueDataValue, places=7)
        self.assertAlmostEqual(outputRecord[2], trueAnomalyLikelihood, places=7)

      self.assertEqual(mrProcess.returncode, 0)


  def _testParamFinderAndModelRunner(self, name):
    """
    Test paramFinder and modelRunner together
    :param str name: dataset name
    """
    inputSpec = json.dumps(
      {"datetimeFormat": "%Y-%m-%d %H:%M:%S",
       "timestampIndex": 0,
       "csv": os.path.join(DATA_DIR, name+".csv"),
       "rowOffset": 4,
       "valueIndex": 1})

    outputInfo = self._testParamFinderRunner(name, inputSpec)

    aggSpec = json.dumps(outputInfo["aggInfo"])
    modelSpec = outputInfo['modelInfo']
    modelSpec['modelId'] = 'test'
    modelSpec = json.dumps(modelSpec)

    self._testModelRunner(name, inputSpec, aggSpec, modelSpec)


  def testAmbientTemperatureSystemFailure(self):
    """
    Run paramFinder and ModelRunner on ambient_temperature_system_failure
    """
    self._testParamFinderAndModelRunner('ambient_temperature_system_failure')


  def testNYCTaxi(self):
    """
    Run paramFinder and ModelRunner on nyc_taxi
    """
    self._testParamFinderAndModelRunner('nyc_taxi')


if __name__ == "__main__":
  unittest.main()
