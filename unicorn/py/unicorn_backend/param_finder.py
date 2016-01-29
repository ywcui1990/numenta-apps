#!/usr/bin/env python
# coding=utf-8
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
Implements param finder, which automatically
1. identify appropriate data aggregation window
2. suggest whether to use TimeOfDay encoder
3. suggest data aggregation type (sum or mean)
"""

import csv
import datetime

import numpy

from nupic.frameworks.opf.common_models.cluster_params import (
  getScalarMetricWithTimeOfDayAnomalyParams)

_CORRELATION_MODE_VALID = 0
_CORRELATION_MODE_SAME = 1
_CORRELATION_MODE_FULL = 2



def _convolve(vector1, vector2, mode=2):
  """
  Returns the discrete, linear convolution of two one-dimensional sequences.

  The convolution operator is often seen in signal processing, where it
  models the effect of a linear time-invariant system on a signal [1]_.  In
  probability theory, the sum of two independent random variables is
  distributed according to the convolution of their individual
  distributions.

  If `vector2` is longer than `vector1`, the arrays are swapped before
  computation.

  Parameters
  ----------
  :param vector1: (N,) array_like
      First one-dimensional input array.
  :param vector2: (M,) array_like
      Second one-dimensional input array.
  :param mode: int that indicates mode of convolution, which takes the value of
      2:
        By default, mode is 'full'.  This returns the convolution
        at each point of overlap, with an output shape of (N+M-1,). At
        the end-points of the convolution, the signals do not overlap
        completely, and boundary effects may be seen.

      1:
        Mode `same` returns output of length ``max(M, N)``.  Boundary
        effects are still visible.

      0:
        Mode `valid` returns output of length
        ``max(M, N) - min(M, N) + 1``.  The convolution product is only given
        for points where the signals overlap completely.  Values outside
        the signal boundary have no effect.

  Returns
  -------
  :return out : ndarray
      Discrete, linear convolution of `vector1` and `vector2`.

  References
  ----------
  .. [1] Wikipedia, "Convolution", http://en.wikipedia.org/wiki/Convolution.

  """
  vector1 = numpy.array(vector1, ndmin=1)
  vector2 = numpy.array(vector2, ndmin=1)

  if len(vector1) == 0:
    raise ValueError('vector1 cannot be empty')
  if len(vector2) == 0:
    raise ValueError('vector2 cannot be empty')

  if len(vector2) > len(vector1):
    vector1, vector2 = vector2, vector1

  return numpy.core.multiarray.correlate(vector1, vector2[::-1], mode)



def _rickerWavelet(numPoints, waveletWidth):
  """
  Return a Ricker wavelet, also known as the "Mexican hat wavelet".

  It models the function:

      ``A (1 - x^2/a^2) exp(-t^2/a^2)``,

  where ``A = 2/sqrt(3a)pi^1/3``, a  is the width parameter of the wavelet

  Parameters
  ----------
  :param points: int
      Number of points in `vector`.
      Will be centered around 0.
  :param a: scalar Width parameter of the wavelet.

  Returns
  -------
  :return vector: (N,) ndarray
      Array of length `points` in shape of ricker curve.

  """
  A = 2 / (numpy.sqrt(3 * waveletWidth) * (numpy.pi ** 0.25))
  wsq = waveletWidth ** 2
  vec = numpy.arange(0, numPoints) - (numPoints - 1.0) / 2
  tsq = vec ** 2
  mod = (1 - tsq / wsq)
  gauss = numpy.exp(-tsq / (2 * wsq))
  total = A * mod * gauss
  return total



def _cwt(data, wavelet, widths):
  """
  Continuous wavelet transform.

  Performs a continuous wavelet transform on `data`,
  using the `wavelet` function. A CWT performs a convolution
  with `data` using the `wavelet` function, which is characterized
  by a width parameter and length parameter.

  Parameters
  ----------
  :param data : (N,) ndarray
      data on which to perform the transform.
  :param wavelet : function
      Wavelet function, which should take 2 arguments.
      The first argument is the number of points that the returned vector
      will have (len(wavelet(width,length)) == length).
      The second is a width parameter, defining the size of the wavelet
      (e.g. standard deviation of a gaussian). See `ricker`, which
      satisfies these requirements.
  widths : (M,) sequence
      Widths to use for transform.

  :return Returns
  -------
  cwt: (M, N) ndarray
      Will have shape of (len(data), len(widths)).

  """
  output = numpy.zeros([len(widths), len(data)])
  for ind, width in enumerate(widths):
    waveletData = wavelet(min(10 * width, len(data)), width)
    output[ind, :] = _convolve(data, waveletData, mode=_CORRELATION_MODE_SAME)
  return output



class ParamFinder(object):
  def __init__(self,
               fileName,
               rowOffset,
               timestampIndex,
               valueIndex,
               datetimeFormat):
    """
    :param fileName: str, path to input csv file
    :param rowOffset: int, zero-based index of first data row in csv
    :param timestampIndex: int, zero-based column index of the timeStamp
    :param valueIndex: int, zero-based column index of the value
    :param datetimeFormat: str, datetime format string for python's
                          datetime.strptime
    """

    self._aggregationWindowThreshold = 0.2
    self._fileName = fileName
    self._rowOffset = rowOffset
    self._timestampIndex = timestampIndex
    self._valueIndex = valueIndex
    self._datetimeFormat = datetimeFormat

    self.medianSamplingInterval = None
    self.medianAbsoluteDevSamplingInterval = None
    self._cwtVar = None
    self._timeScale = None
    self.suggestedSamplingInterval = None
    self.useTimeOfDay = None
    self.useDayOfWeek = None
    self.aggFunc = None


  def run(self):
    """
    Run ParamFinder on input csv file

    :return: JSON object with the following properties:

      "aggInfo" aggregation information, JSON null if no aggregation is needed
        otherwise, a JSON object contains the folowing properties:
          "windowSize": aggregation window size in seconds (integer)
          "func": A string representation of the aggregation function (string)
            the following values are supported: "sum", "mean"

      "modelInfo": JSON object describing the model configuration that
      contains the following properties:
        “modelConfig”: OPF Model Configuration parameters (JSON object) for
        passing to the OPF `ModelFactory.create()` method as the
        `modelConfig` parameter.

        “inferenceArgs”: OPF Model Inference parameters (JSON object) for
        passing to the resulting model's `enableInference()` method as the
        inferenceArgs parameter.

        “timestampFieldName”: The name of the field in `modelConfig`
        corresponding to the metric timestamp (string)

        “valueFieldName”: The name of the field in `modelConfig`
        corresponding to the metric value (string)
    """
    (timeStamps, values) = self._readCSVFile(self._fileName,
                                             self._rowOffset,
                                             self._timestampIndex,
                                             self._valueIndex,
                                             self._datetimeFormat)
    numDataPts = len(values)

    (self.medianSamplingInterval,
     self.medianAbsoluteDevSamplingInterval) = self.getMedianSamplingInterval(
      timeStamps)

    (timeStamps, values) = self.resampleData(timeStamps,
                                             values,
                                             self.medianSamplingInterval)

    (self._cwtVar, self._timeScale) = self.calculateContinuousWaveletTransform(
      self.medianSamplingInterval, values)

    self.suggestedSamplingInterval = self.determineAggregationWindow(
      timeScale=self._timeScale,
      cwtVar=self._cwtVar,
      thresh=self._aggregationWindowThreshold,
      samplingInterval=self.medianSamplingInterval,
      numDataPts=numDataPts)

    # decide whether to use TimeOfDay and DayOfWeek encoders
    (self.useTimeOfDay,
     self.useDayOfWeek) = self.determineEncoderTypes(
      self._cwtVar, self._timeScale)

    self.aggFunc = self.getAggregationFunction()

    outputInfo = {
      "aggInfo": self.getAggInfo(),
      "modelInfo": self.getModelParams(values),
      "timestampFieldName": "c0",
      "valueFieldName": "c1"
    }
    return outputInfo


  def getAggInfo(self):
    """
    Return a JSON object containing the aggregation window size and
    aggregation function type
    """
    if self.suggestedSamplingInterval <= self.medianSamplingInterval:
      aggInfo = None
    else:
      aggInfo = {
        "windowSize": self.suggestedSamplingInterval.astype('int'),
        "func": self.aggFunc
      }
    return aggInfo


  def getModelParams(self, value):
    """
    Return a JSON object describing the model configuration

    :param value: numpy array of metric data, used to compute min/max values
    """
    modelParams = getScalarMetricWithTimeOfDayAnomalyParams(
      metricData=value)

    if self.useTimeOfDay:
      modelParams['modelConfig']['modelParams']['sensorParams']['encoders'] \
        ['c0_timeOfDay'] = dict(fieldname='c0',
                                name='c0',
                                type='DateEncoder',
                                timeOfDay=(21, 9))
    else:
      modelParams['modelConfig']['modelParams']['sensorParams']['encoders'] \
        ['c0_timeOfDay'] = None

    if self.useDayOfWeek:
      modelParams['modelConfig']['modelParams']['sensorParams']['encoders'] \
        ['c0_dayOfWeek'] = dict(fieldname='c0',
                                name='c0',
                                type='DateEncoder',
                                dayOfWeek=(21, 3))
    else:
      modelParams['modelConfig']['modelParams']['sensorParams']['encoders'] \
        ['c0_dayOfWeek'] = None
    return modelParams


  @staticmethod
  def _readCSVFile(fileName,
                   rowOffset,
                   timestampIndex,
                   valueIndex,
                   datetimeFormat):
    """
    Read csv data file, the data file must have two columns
    that contains time stamps and data values

    :param fileName: str, path to input csv file
    :param rowOffset: int, index of first data row in csv
    :param timestampIndex: int, column index of the timeStamp
    :param valueIndex: int, column index of the value
    :param datetimeFormat: str, datetime format string for python's
                          datetime.strptime
    :return: A two-tuple (timestamps, values), where
             timeStamps is a numpy array of datetime64 time stamps and
             values is a numpy array of float64 data values
    """

    with open(fileName, 'rU') as csvFile:
      csv.field_size_limit(2 ** 27)
      fileReader = csv.reader(csvFile)
      for _ in xrange(rowOffset):
        fileReader.next()  # skip header line

      timeStamps = []
      values = []

      maxRowNumber = 20000
      numRow = 0
      for row in fileReader:
        timeStamp = datetime.datetime.strptime(row[timestampIndex], datetimeFormat)
        # timeStamp = dateutil.parser.parse(row[timestampIndex])
        timeStamps.append(numpy.datetime64(timeStamp))
        values.append(row[valueIndex])

        numRow += 1
        if numRow >= maxRowNumber:
          break

      timeStamps = numpy.array(timeStamps, dtype='datetime64[s]')
      values = numpy.array(values, dtype='float64')

      return timeStamps, values


  @staticmethod
  def resampleData(timeStamps, values, newSamplingInterval):
    """
    Resample data at new sampling interval using linear interpolation
    Note: the resampling function is using interpolation,
    it may not be appropriate for aggregation purpose

    :param timeStamps: numpy array of timeStamp in datetime64 type
    :param values: numpy array of float64 values
    :param newSamplingInterval: numpy timedelta64 format
    """
    totalDuration = (timeStamps[-1] - timeStamps[0])
    nSampleNew = numpy.floor(totalDuration / newSamplingInterval) + 1
    nSampleNew = nSampleNew.astype('int')

    newTimestamp = numpy.empty(nSampleNew, dtype='datetime64[s]')
    for sampleI in xrange(nSampleNew):
      newTimestamp[sampleI] = timeStamps[0] + sampleI * newSamplingInterval

    newValue = numpy.interp((newTimestamp - timeStamps[0]).astype('float32'),
                            (timeStamps - timeStamps[0]).astype('float32'),
                            values)

    return newTimestamp, newValue


  @staticmethod
  def calculateContinuousWaveletTransform(samplingInterval, values):
    """
    Calculate continuous wavelet transformation (CWT)
    Return variance of the cwt coefficients over time

    :param samplingInterval: sampling interval of the time series
    :param values: numpy array of float64 values
    :return a two tuple of (cwtVar, timeScale) where
    cwtVar is a numpy array that stores variance of the wavelet coefficents
    timeScale is a numpy array that stores the corresponding time scales
    """

    widths = numpy.logspace(0, numpy.log10(len(values) / 20), 50)
    timeScale = widths * samplingInterval * 4

    # continuous wavelet transformation with ricker wavelet
    cwtMatrix = _cwt(values, _rickerWavelet, widths)
    # clip wavelet coefficients to minimize boundary effect
    maxTimeScale = int(widths[-1])
    cwtMatrix = cwtMatrix[:, 4 * maxTimeScale:-4 * maxTimeScale]

    # variance of wavelet power
    cwtVar = numpy.var(numpy.abs(cwtMatrix), axis=1)
    cwtVar = cwtVar / numpy.sum(cwtVar)

    return cwtVar, timeScale


  @staticmethod
  def getMedianSamplingInterval(timeStamps):
    """
    calculate median and median absolute deviation of sampling interval

    :param timeStamps: numpy array of timestamps in datetime64 format
    :return: a two tuple of (medianSamplingInterval, medianAbsoluteDev) where
            medianSamplingInterval is numpy timedelta64 in unit of seconds
            medianAbsoluteDev is the median absolute deviation of
            sampling interval in timedelta64 format
    """
    if timeStamps.dtype != numpy.dtype('<M8[s]'):
      timeStamps = timeStamps.astype('datetime64[s]')

    samplingIntervals = numpy.diff(timeStamps)

    medianSamplingInterval = numpy.median(samplingIntervals)
    medianAbsoluteDev = numpy.median(
      numpy.abs(samplingIntervals - medianSamplingInterval))

    return medianSamplingInterval, medianAbsoluteDev


  @staticmethod
  def determineAggregationWindow(timeScale,
                                 cwtVar,
                                 thresh,
                                 samplingInterval,
                                 numDataPts):
    """
    Determine data aggregation window

    :param timeScale: numpy array, corresponding time scales for wavelet coeffs
    :param cwtVar: numpy array, wavelet coefficients variance over time
    :param thresh: float, cutoff threshold between 0 and 1
    :param samplingInterval: original sampling interval in seconds
    :param numDataPts: number of data points
    :return: aggregationTimeScale: float, suggested sampling interval
    """
    cumulativeCwtVar = numpy.cumsum(cwtVar)
    cutoffTimeScale = timeScale[numpy.where(cumulativeCwtVar >= thresh)[0][0]]

    aggregationTimeScale = cutoffTimeScale / 10.0
    if aggregationTimeScale < samplingInterval * 4:
      aggregationTimeScale = samplingInterval * 4

    # make sure there is at least 1000 records after aggregation
    if numDataPts < 1000:
      aggregationTimeScale = samplingInterval
    else:
      maxSamplingInterval = float(numDataPts) / 1000.0 * samplingInterval
      if aggregationTimeScale > maxSamplingInterval > samplingInterval:
        aggregationTimeScale = maxSamplingInterval

    return aggregationTimeScale


  @staticmethod
  def determineEncoderTypes(cwtVar, timeScale):
    """
    Find local maxima from the wavelet coefficient variance spectrum
    A strong maxima is defined as
    (1) At least 10% higher than the nearest local minima
    (2) Above the baseline value
  
    The algorithm will suggest an encoder if its corresponding
    periodicity is close to a strong maxima:
    (1) horizontally must within the nearest local minimum
    (2) vertically must within 50% of the peak of the strong maxima

    :param cwtVar: numpy array, wavelet coefficients variance over time
    :param timeScale: numpy array, corresponding time scales for wavelet coeffs

    :return a two tuple of (useTimeOfDay, useDayOfWeek), where
            useTimeOfDay is bool, indicating whether to use timeOfDay encoder
            useDayOfWeek is bool, indicating whether to use dayOfWeek encoder
    """

    # Detect all local minima and maxima when the first difference reverse sign
    signOfFirstDifference = numpy.sign(numpy.diff(cwtVar))
    localMin = (numpy.diff(signOfFirstDifference) > 0).nonzero()[0] + 1
    localMax = (numpy.diff(signOfFirstDifference) < 0).nonzero()[0] + 1

    baseline_value = 1.0 / len(cwtVar)

    dayPeriod = 86400.0
    weekPeriod = 604800.0
    timeScale = timeScale.astype('float32')

    cwtVarAtDayPeriod = numpy.interp(dayPeriod, timeScale, cwtVar)
    cwtVarAtWeekPeriod = numpy.interp(weekPeriod, timeScale, cwtVar)

    useTimeOfDay = False
    useDayOfWeek = False

    strongLocalMax = []
    for i in xrange(len(localMax)):
      leftLocalMin = numpy.where(numpy.less(localMin, localMax[i]))[0]
      if len(leftLocalMin) == 0:
        leftLocalMin = 0
        leftLocalMinValue = cwtVar[0]
      else:
        leftLocalMin = localMin[leftLocalMin[-1]]
        leftLocalMinValue = cwtVar[leftLocalMin]

      rightLocalMin = numpy.where(numpy.greater(localMin, localMax[i]))[0]
      if len(rightLocalMin) == 0:
        rightLocalMin = len(cwtVar) - 1
        rightLocalMinValue = cwtVar[-1]
      else:
        rightLocalMin = localMin[rightLocalMin[0]]
        rightLocalMinValue = cwtVar[rightLocalMin]

      localMaxValue = cwtVar[localMax[i]]
      nearestLocalMinValue = numpy.max(leftLocalMinValue, rightLocalMinValue)

      if ((localMaxValue - nearestLocalMinValue) / localMaxValue
            > 0.1 and localMaxValue > baseline_value):
        strongLocalMax.append(localMax[i])

        if (timeScale[leftLocalMin] < dayPeriod < timeScale[rightLocalMin]
            and cwtVarAtDayPeriod > localMaxValue * 0.5):
          useTimeOfDay = True

        if (timeScale[leftLocalMin] < weekPeriod < timeScale[
          rightLocalMin]
            and cwtVarAtWeekPeriod > localMaxValue * 0.5):
          useDayOfWeek = True

    return useTimeOfDay, useDayOfWeek


  def getAggregationFunction(self):
    """
    Return the aggregation function type:
      ("sum" for transactional data types
       "mean" for non-transactional data types)

    The data type is determined via a data type indicator, defined as the
    ratio between median absolute deviation and median of the sampling interval.

    :return aggFunc: a string with value "sum" or "mean"
    """

    dataTypeIndicator = (self.medianAbsoluteDevSamplingInterval /
                         self.medianSamplingInterval)
    if dataTypeIndicator > 0.2:
      aggFunc = "sum"  # "transactional"
    else:
      aggFunc = "mean"  # "non-transactional"

    return aggFunc
