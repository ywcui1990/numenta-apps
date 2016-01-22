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
Implements param finder, which automatically
1. identify appropriate data aggregation window
2. suggest whether to use TimeOfDay encoder
3. suggest data aggregation type (SUM or AVG)
"""

import csv
from datetime import datetime
import dateutil.parser
import numpy

_modeFromNameDict = {
  'v': 0,
  's': 1,
  'f': 2
}



def _convolve(a, v, mode='full'):
  """
  Returns the discrete, linear convolution of two one-dimensional sequences.

  The convolution operator is often seen in signal processing, where it
  models the effect of a linear time-invariant system on a signal [1]_.  In
  probability theory, the sum of two independent random variables is
  distributed according to the convolution of their individual
  distributions.

  If `v` is longer than `a`, the arrays are swapped before computation.

  Parameters
  ----------
  a : (N,) array_like
      First one-dimensional input array.
  v : (M,) array_like
      Second one-dimensional input array.
  mode : {'full', 'valid', 'same'}, optional
      'full':
        By default, mode is 'full'.  This returns the convolution
        at each point of overlap, with an output shape of (N+M-1,). At
        the end-points of the convolution, the signals do not overlap
        completely, and boundary effects may be seen.

      'same':
        Mode `same` returns output of length ``max(M, N)``.  Boundary
        effects are still visible.

      'valid':
        Mode `valid` returns output of length
        ``max(M, N) - min(M, N) + 1``.  The convolution product is only given
        for points where the signals overlap completely.  Values outside
        the signal boundary have no effect.

  Returns
  -------
  out : ndarray
      Discrete, linear convolution of `a` and `v`.

  References
  ----------
  .. [1] Wikipedia, "Convolution", http://en.wikipedia.org/wiki/Convolution.

  """
  a, v = numpy.array(a, ndmin=1), numpy.array(v, ndmin=1)
  if len(v) > len(a):
    a, v = v, a
  if len(a) == 0:
    raise ValueError('a cannot be empty')
  if len(v) == 0:
    raise ValueError('v cannot be empty')
  mode = _modeFromName(mode)
  return numpy.core.multiarray.correlate(a, v[::-1], mode)



def _modeFromName(mode):
  if isinstance(mode, basestring):
    return _modeFromNameDict[mode.lower()[0]]
  return mode



def _rickerWavelet(points, a):
  """
  Return a Ricker wavelet, also known as the "Mexican hat wavelet".

  It models the function:

      ``A (1 - x^2/a^2) exp(-t^2/a^2)``,

  where ``A = 2/sqrt(3a)pi^1/3``.

  Parameters
  ----------
  points : int
      Number of points in `vector`.
      Will be centered around 0.
  a : scalar
      Width parameter of the wavelet.

  Returns
  -------
  vector : (N,) ndarray
      Array of length `points` in shape of ricker curve.

  """
  A = 2 / (numpy.sqrt(3 * a) * (numpy.pi ** 0.25))
  wsq = a ** 2
  vec = numpy.arange(0, points) - (points - 1.0) / 2
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
  data : (N,) ndarray
      data on which to perform the transform.
  wavelet : function
      Wavelet function, which should take 2 arguments.
      The first argument is the number of points that the returned vector
      will have (len(wavelet(width,length)) == length).
      The second is a width parameter, defining the size of the wavelet
      (e.g. standard deviation of a gaussian). See `ricker`, which
      satisfies these requirements.
  widths : (M,) sequence
      Widths to use for transform.

  Returns
  -------
  cwt: (M, N) ndarray
      Will have shape of (len(data), len(widths)).

  """
  output = numpy.zeros([len(widths), len(data)])
  for ind, width in enumerate(widths):
    waveletData = wavelet(min(10 * width, len(data)), width)
    output[ind, :] = _convolve(data, waveletData,
                               mode='same')
  return output



class paramFinder(object):
  def __init__(self,
               fileName,
               rowOffset=1,
               timestampIndex=0,
               valueIndex=1,
               datetimeFormat="YYYY-MM-DD HH:mm:ss"):
    """
    :param fileName: str, path to input csv file
    :param rowOffset: int, index of first data row in csv
    :param timestampIndex: int, column index of the timeStamp
    :param valueIndex: int, column index of the value
    :param datetimeFormat: str, Datetime Format (from ISO 8601)
    """

    self._thresh = 0.2

    (timeStamp, value) = self.readCSVFiles(fileName,
                                           rowOffset,
                                           timestampIndex,
                                           valueIndex,
                                           datetimeFormat)

    numDataPts = len(value)

    self.medianSamplingInterval = self.getMedianSamplingInterval(timeStamp)

    (timeStamp, value) = self.resampleData(timeStamp,
                                           value,
                                           self.medianSamplingInterval)

    (self._cwtVar, self._timeScale) = self.calculateContinuousWaveletTransform(
      self.medianSamplingInterval, value)

    self.suggestedSamplingInterval = self.determineAggregationWindow(
      self._timeScale,
      self._cwtVar,
      self._thresh,
      self.medianSamplingInterval,
      numDataPts)

    # decide whether to use TimeOfDay and DayOfWeek encoders
    (self.useTimeOfDay,
     self.useDayOfWeek) = self.determineEncoderTypes(
      self._cwtVar, self._timeScale)


  @staticmethod
  def readCSVFiles(fileName,
                   rowOffset=1,
                   timestampIndex=0,
                   valueIndex=1,
                   datetimeFormat="YYYY-MM-DD HH:mm:ss"):
    """
    Read csv data file, the data file must have two columns
    that contains time stamps and data values
    :param fileName: str, path to input csv file
    :param rowOffset: int, index of first data row in csv
    :param timestampIndex: int, column index of the timeStamp
    :param valueIndex: int, column index of the value
    :param datetimeFormat: str, Datetime Format (from ISO 8601)
    :return: timeStamps: numpy array of time stamps
             values: numpy array of data values
    """

    with open(fileName, 'r') as csvFile:
      fileReader = csv.reader(csvFile)
      for _ in xrange(rowOffset):
        fileReader.next()  # skip header line

      timeStamps = []
      values = []

      for row in fileReader:
        # timeStamp = datetime.strptime(row[timestampIndex], datetimeFormat)
        timeStamp = dateutil.parser.parse(row[timestampIndex])
        timeStamps.append(numpy.datetime64(timeStamp))
        values.append(row[valueIndex])

      timeStamps = numpy.array(timeStamps, dtype='datetime64[s]')
      values = numpy.array(values, dtype='float32')

      return timeStamps, values


  @staticmethod
  def resampleData(timeStamp, value, newSamplingInterval):
    """
    Resample data at new sampling interval using linear interpolation
    Note: the resampling function is using interpolation,
    it may not be appropriate for aggregation purpose
    :param timeStamp: timeStamp in numpy datetime64 type
    :param value: value of the time series.
    :param newSamplingInterval: numpy timedelta64 format
    """
    totalDuration = (timeStamp[-1] - timeStamp[0])
    nSampleNew = numpy.floor(totalDuration / newSamplingInterval) + 1
    nSampleNew = nSampleNew.astype('int')

    newTimestamp = numpy.empty(nSampleNew, dtype='datetime64[s]')
    for sampleI in xrange(nSampleNew):
      newTimestamp[sampleI] = timeStamp[0] + sampleI * newSamplingInterval

    newValue = numpy.interp((newTimestamp - timeStamp[0]).astype('float32'),
                            (timeStamp - timeStamp[0]).astype('float32'), value)

    return newTimestamp, newValue


  @staticmethod
  def calculateContinuousWaveletTransform(samplingInterval, value):
    """
    Calculate continuous wavelet transformation (CWT)
    Return variance of the cwt coefficients over time

    :param samplingInterval: sampling interval of the time series
    :param value: value of the time series
    :return cwtVar: numpy array of flaots, variance of the wavelet coeff
    :return timeScale: numpy array of floats, corresponding time scales
    """

    widths = numpy.logspace(0, numpy.log10(len(value) / 20), 50)
    timeScale = widths * samplingInterval * 4

    # continuous wavelet transformation with ricker wavelet
    cwtmatr = _cwt(value, _rickerWavelet, widths)
    # clip wavelet coefficients to minimize boundary effect
    maxTimeScale = int(widths[-1])
    cwtmatr = cwtmatr[:, 4 * maxTimeScale:-4 * maxTimeScale]

    # variance of wavelet power
    cwtVar = numpy.var(numpy.abs(cwtmatr), axis=1)
    cwtVar = cwtVar / numpy.sum(cwtVar)

    return cwtVar, timeScale


  @staticmethod
  def getMedianSamplingInterval(timeStamp):
    """
    :param timeStamp: a numpy array of sampling times
    :return: newSamplingInterval, numpy timedelta64 format in unit of seconds
    """
    if timeStamp.dtype != numpy.dtype('<M8[s]'):
      timeStamp = timeStamp.astype('datetime64[s]')

    timeStampDeltas = numpy.diff(timeStamp)

    medianSamplingInterval = numpy.median(timeStampDeltas)
    return medianSamplingInterval


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

      if ((localMaxValue - nearestLocalMinValue) / nearestLocalMinValue
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
