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

"""Unit test of the unicorn_backend.param_finder module"""

# Disable pylint warnings concerning access to protected members
# pylint: disable=W0212

import datetime
import dateutil.tz
import logging
import random
import unittest

import numpy

from nta.utils.logging_support_raw import LoggingSupport
from unicorn_backend import param_finder

_LOGGER = logging.getLogger("unicorn_param_finder_test")



def setUpModule():
  LoggingSupport.initTestApp()



class ParamFinderTestCase(unittest.TestCase):
  def testGetMedianSamplingInterval(self):
    timestamps = numpy.array([datetime.datetime(2000, 1, 1) +
                              datetime.timedelta(hours=i) for i in xrange(24)])
    (medianSamplingInterval,
     medianAbsoluteDev) = param_finder._getMedianSamplingInterval(timestamps)
    self.assertAlmostEqual(medianSamplingInterval,
                           numpy.timedelta64(3600, 's'))
    self.assertAlmostEqual(medianAbsoluteDev,
                           numpy.timedelta64(0, 's'))


  def testGetAggregationFunction(self):
    aggFunc = param_finder._getAggregationFunction(numpy.timedelta64(300, 's'),
                                                   numpy.timedelta64(0, 's'),
                                                   aggregationFuncThresh=0.2)
    self.assertEqual(aggFunc, 'mean')

    aggFunc = param_finder._getAggregationFunction(numpy.timedelta64(300, 's'),
                                                   numpy.timedelta64(100, 's'),
                                                   aggregationFuncThresh=0.2)
    self.assertEqual(aggFunc, 'sum')


  def testResampleData(self):
    # test upsampling by a factor of 2
    timestamps = numpy.array([numpy.datetime64(
      datetime.datetime(2000, 1, 1, tzinfo=dateutil.tz.tzlocal()) +
      datetime.timedelta(hours=i)) for i in xrange(8)])
    values = numpy.linspace(0, 7, 8)
    newSamplingInterval = numpy.timedelta64(1800, 's')
    (newTimeStamps, newValues) = param_finder._resampleData(timestamps,
                                                            values,
                                                            newSamplingInterval)

    trueNewTimeStamps = numpy.array([numpy.datetime64(
      datetime.datetime(2000, 1, 1, tzinfo=dateutil.tz.tzlocal()) +
      datetime.timedelta(hours=0.5 * i)) for i in xrange(15)])
    self.assertTrue(numpy.allclose(newValues, numpy.linspace(0, 7, 15)))
    timestampError = (numpy.sum(
      numpy.abs(newTimeStamps - trueNewTimeStamps))).item().total_seconds()
    self.assertAlmostEqual(timestampError, 0)

    # test down-sampling by a factor of 2
    newSamplingInterval = numpy.timedelta64(7200, 's')
    (newTimeStamps, newValues) = param_finder._resampleData(timestamps,
                                                            values,
                                                            newSamplingInterval)
    trueNewTimeStamps = numpy.array([numpy.datetime64(
      datetime.datetime(2000, 1, 1, tzinfo=dateutil.tz.tzlocal()) +
      datetime.timedelta(hours=2 * i)) for i in xrange(4)])
    timestampError = (numpy.sum(
      numpy.abs(newTimeStamps - trueNewTimeStamps))).item().total_seconds()
    self.assertTrue(numpy.allclose(newValues, numpy.linspace(0, 6, 4)))
    self.assertAlmostEqual(timestampError, 0)


  def testCalculateContinuousWaveletTransform(self):
    """
    Verify that the periodicity can be correctly identified with CWT
    """
    samplingInterval = numpy.timedelta64(300, 's')
    values = numpy.sin(numpy.linspace(0, 100, 101) * 2 * numpy.pi / 10.0)
    targetPeriod = 3000.0

    (cwtVar, timeScale) = param_finder._calculateContinuousWaveletTransform(
      samplingInterval, values)

    calculatedPeriod = timeScale[numpy.where(cwtVar == max(cwtVar))[0][0]]
    calculatedPeriod = calculatedPeriod.astype('float32')
    self.assertTrue(abs(targetPeriod - calculatedPeriod) / targetPeriod < .1)


  def testDetermineEncoderTypes(self):
    # daily and weekly periodicity in units of seconds
    dayPeriod = 86400.0
    weekPeriod = 604800.0

    samplingInterval = numpy.timedelta64(300, 's')
    widths = numpy.logspace(0, numpy.log10(40000 / 20), 50)
    timeScale = widths * samplingInterval * 4
    timeScale = timeScale.astype('float64')

    # a flat cwtVar distribution, no encoder should be used
    cwtVar = numpy.ones(shape=timeScale.shape)
    (useTimeOfDay,
     useDayOfWeek) = param_finder._determineEncoderTypes(cwtVar, timeScale)
    self.assertFalse(useTimeOfDay)
    self.assertFalse(useDayOfWeek)

    # make a peak around daily period
    cwtVar = numpy.exp(-(timeScale - dayPeriod) ** 2 / (2 * 100000.0 ** 2))
    (useTimeOfDay,
     useDayOfWeek) = param_finder._determineEncoderTypes(cwtVar, timeScale)
    self.assertTrue(useTimeOfDay)
    self.assertFalse(useDayOfWeek)

    # make a peak around weekly period
    cwtVar = numpy.exp(-(timeScale - weekPeriod) ** 2 / (2 * 100000.0 ** 2))
    (useTimeOfDay,
     useDayOfWeek) = param_finder._determineEncoderTypes(cwtVar, timeScale)
    self.assertFalse(useTimeOfDay)
    self.assertTrue(useDayOfWeek)

    # a double peaked function
    cwtVar = (numpy.exp(-(timeScale - dayPeriod) ** 2 / (2 * 100000.0 ** 2)) +
              numpy.exp(-(timeScale - weekPeriod) ** 2 / (2 * 100000.0 ** 2)))
    (useTimeOfDay,
     useDayOfWeek) = param_finder._determineEncoderTypes(cwtVar, timeScale)
    self.assertTrue(useTimeOfDay)
    self.assertTrue(useDayOfWeek)


  def testDetermineAggregationWindow(self):
    """
    Verify aggregation window can be determined from the cwtVar distribution
    """
    weekPeriod = 604800.0
    samplingInterval = numpy.timedelta64(300, 's')
    widths = numpy.logspace(0, numpy.log10(40000 / 20), 50)
    timeScale = widths * samplingInterval * 4
    timeScale = timeScale.astype('float64')
    cwtVar = numpy.exp(-(timeScale - weekPeriod) ** 2 / (2 * 100000.0 ** 2))
    numDataPts = 40000

    maxSamplingInterval = (float(numDataPts) / 1000.0 * samplingInterval)
    maxSamplingInterval = maxSamplingInterval.item().total_seconds()

    aggregationTimeScale = param_finder._determineAggregationWindow(
      timeScale=timeScale,
      cwtVar=cwtVar,
      thresh=0.2,
      samplingInterval=samplingInterval,
      numDataPts=40000
    )
    aggregationTimeScale = aggregationTimeScale.item().total_seconds()
    self.assertLessEqual(aggregationTimeScale, maxSamplingInterval)
    self.assertGreater(aggregationTimeScale, samplingInterval.astype('float64'))

    # if the numDataPts < MIN_ROW_AFTER_AGGREGATION, no aggregation should occur
    aggregationTimeScale = param_finder._determineAggregationWindow(
      timeScale=timeScale,
      cwtVar=cwtVar,
      thresh=0.2,
      samplingInterval=samplingInterval,
      numDataPts=param_finder.MIN_ROW_AFTER_AGGREGATION-1
    )
    aggregationTimeScale = aggregationTimeScale.item().total_seconds()
    self.assertEqual(aggregationTimeScale, samplingInterval.astype('float64'))


  def testFindParameters(self):
    def createTestData(dataType, timeStepSeconds=300):
      dayPeriod = 86400.0
      weekPeriod = 604800.0

      timeStep = datetime.timedelta(seconds=timeStepSeconds)
      timestamp = datetime.datetime(2016, 1, 1, 0, 0, 0)

      random.seed(42)
      samples = []
      for i in xrange(2000):
        if dataType == "transaction":
          timestamp += datetime.timedelta(
            seconds=random.randint(1, 2*timeStepSeconds))
        else:
          timestamp += timeStep

        if dataType == "flat":
          value = 10.0
        elif dataType == "daily":
          value = numpy.sin(2 * numpy.pi * (timeStep.seconds * i) / dayPeriod)
        elif dataType == "weekly":
          value = numpy.sin(2 * numpy.pi * (timeStep.seconds * i) / weekPeriod)
        elif dataType == "transaction":
          value = 10.0

        samples.append((timestamp, value))
      return samples

    outputInfo = param_finder.findParameters(createTestData("flat", 300))
    self.assertGreater(outputInfo["aggInfo"]["windowSize"], 300)
    self.assertEqual(outputInfo["aggInfo"]["func"], "mean")
    # Exclude timeOfDay and dayOfWeek encoder for flat line
    self.assertIsNone(outputInfo["modelInfo"]["modelConfig"]["modelParams"]
                      ["sensorParams"]["encoders"]["c0_timeOfDay"])
    self.assertIsNone(outputInfo["modelInfo"]["modelConfig"]["modelParams"]
                      ["sensorParams"]["encoders"]["c0_dayOfWeek"])

    outputInfo = param_finder.findParameters(createTestData("daily", 300))
    self.assertGreater(outputInfo["aggInfo"]["windowSize"], 300)
    self.assertEqual(outputInfo["aggInfo"]["func"], "mean")
    # Use timeOfDay but not dayOfWeek encoder for dataSet with daily period
    self.assertIsNotNone(outputInfo["modelInfo"]["modelConfig"]["modelParams"]
                         ["sensorParams"]["encoders"]["c0_timeOfDay"])
    self.assertIsNone(outputInfo["modelInfo"]["modelConfig"]["modelParams"]
                      ["sensorParams"]["encoders"]["c0_dayOfWeek"])

    outputInfo = param_finder.findParameters(createTestData("weekly", 7200))
    self.assertGreater(outputInfo["aggInfo"]["windowSize"], 7200)
    self.assertEqual(outputInfo["aggInfo"]["func"], "mean")
    # Use dayOfWeek but not timeOfDay encoder for dataSet with daily period
    self.assertIsNone(outputInfo["modelInfo"]["modelConfig"]["modelParams"]
                      ["sensorParams"]["encoders"]["c0_timeOfDay"])
    self.assertIsNotNone(outputInfo["modelInfo"]["modelConfig"]["modelParams"]
                         ["sensorParams"]["encoders"]["c0_dayOfWeek"])

    outputInfo = param_finder.findParameters(createTestData("transaction", 300))
    self.assertGreaterEqual(outputInfo["aggInfo"]["windowSize"], 300)
    self.assertEqual(outputInfo["aggInfo"]["func"], "sum")
    # Use dayOfWeek but not timeOfDay encoder for dataSet with daily period
    self.assertIsNone(outputInfo["modelInfo"]["modelConfig"]["modelParams"]
                      ["sensorParams"]["encoders"]["c0_timeOfDay"])
    self.assertIsNone(outputInfo["modelInfo"]["modelConfig"]["modelParams"]
                      ["sensorParams"]["encoders"]["c0_dayOfWeek"])


  def testGetModelParams(self):
    values = numpy.linspace(0, 10, 10)
    modelParams = param_finder._getModelParams(
      useTimeOfDay=False, useDayOfWeek=False, values=values)

    self.assertIsNone(modelParams["modelConfig"]["modelParams"]
                      ["sensorParams"]["encoders"]["c0_timeOfDay"])
    self.assertIsNone(modelParams["modelConfig"]["modelParams"]
                      ["sensorParams"]["encoders"]["c0_dayOfWeek"])


    modelParams = param_finder._getModelParams(
      useTimeOfDay=True, useDayOfWeek=False, values=values)
    self.assertIsNotNone(modelParams["modelConfig"]["modelParams"]
                         ["sensorParams"]["encoders"]["c0_timeOfDay"])
    self.assertIsNone(modelParams["modelConfig"]["modelParams"]
                      ["sensorParams"]["encoders"]["c0_dayOfWeek"])


    modelParams = param_finder._getModelParams(
      useTimeOfDay=False, useDayOfWeek=True, values=values)
    self.assertIsNone(modelParams["modelConfig"]["modelParams"]
                      ["sensorParams"]["encoders"]["c0_timeOfDay"])
    self.assertIsNotNone(modelParams["modelConfig"]["modelParams"]
                         ["sensorParams"]["encoders"]["c0_dayOfWeek"])


    modelParams = param_finder._getModelParams(
      useTimeOfDay=True, useDayOfWeek=True, values=values)
    self.assertIsNotNone(modelParams["modelConfig"]["modelParams"]
                         ["sensorParams"]["encoders"]["c0_timeOfDay"])
    self.assertIsNotNone(modelParams["modelConfig"]["modelParams"]
                         ["sensorParams"]["encoders"]["c0_dayOfWeek"])

if __name__ == "__main__":
  unittest.main()
