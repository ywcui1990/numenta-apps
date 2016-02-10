#!/usr/bin/env python
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
"""Unit test of the unicorn_backend.date_time_utils module"""

import unittest


from unicorn_backend import date_time_utils


class DateTimeUtilsTestCase(unittest.TestCase):

  # Each element is a three-tuple: format, input, result of datetime.isoformat
  _GOOD_SAMPLES = [
    #
    # "ISO 8601"
    #

    # Format "%Y-%m-%dT%H:%M:%S.%f%z"

    # Z
    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123Z",
      "2016-01-29T23:00:00.123000+00:00",
    ),

    # +HHMM
    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123+0000",
      "2016-01-29T23:00:00.123000+00:00",
    ),

    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123+0030",
      "2016-01-29T23:00:00.123000+00:30",
    ),

    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123+1439",
      "2016-01-29T23:00:00.123000+14:39",
    ),

    # +HH:MM
    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123+00:00",
      "2016-01-29T23:00:00.123000+00:00",
    ),

    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123+00:30",
      "2016-01-29T23:00:00.123000+00:30",
    ),

    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123+14:39",
      "2016-01-29T23:00:00.123000+14:39",
    ),

    # -HHMM
    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123-0000",
      "2016-01-29T23:00:00.123000+00:00",
    ),

    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123-0030",
      "2016-01-29T23:00:00.123000-00:30",
    ),

    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123-1439",
      "2016-01-29T23:00:00.123000-14:39",
    ),

    # -HH:MM
    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123-00:00",
      "2016-01-29T23:00:00.123000+00:00",
    ),

    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123-00:30",
      "2016-01-29T23:00:00.123000-00:30",
    ),

    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123-14:39",
      "2016-01-29T23:00:00.123000-14:39",
    ),

    # -HH
    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123-00",
      "2016-01-29T23:00:00.123000+00:00",
    ),

    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.123-14",
      "2016-01-29T23:00:00.123000-14:00",
    ),

    # Experiment with fractions
    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.0123-14",
      "2016-01-29T23:00:00.012300-14:00",
    ),

    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.01230-14",
      "2016-01-29T23:00:00.012300-14:00",
    ),

    (
      "%Y-%m-%dT%H:%M:%S.%f%z",
      "2016-01-29T23:00:00.0-14",
      "2016-01-29T23:00:00-14:00",
    ),


    # Format "%Y-%m-%dT%H:%M:%S.%f"
    (
      "%Y-%m-%dT%H:%M:%S.%f",
      "2016-01-29T23:00:00.1",
      "2016-01-29T23:00:00.100000",
    ),


    # Format "%Y-%m-%dT%H:%M:%S%z"
    (
      "%Y-%m-%dT%H:%M:%S%z",
      "2016-01-29T23:00:00-08",
      "2016-01-29T23:00:00-08:00",
    ),


    # Format "%Y-%m-%dT%H:%M:%S"
    (
      "%Y-%m-%dT%H:%M:%S",
      "2016-01-29T23:00:00",
      "2016-01-29T23:00:00",
    ),


    # Format "%Y-%m-%dT%H:%M%z"
    (
      "%Y-%m-%dT%H:%M%z",
      "2016-01-29T23:00-08",
      "2016-01-29T23:00:00-08:00",
    ),


    # Format "%Y-%m-%dT%H:%M"
    (
      "%Y-%m-%dT%H:%M",
      "2016-01-29T23:00",
      "2016-01-29T23:00:00",
    ),


    #
    # "ISO 8601 no T"
    #


    (
      "%Y-%m-%d %H:%M:%S.%f%z",
      "2016-01-29 23:00:00.123+0800",
      "2016-01-29T23:00:00.123000+08:00",
    ),


    # Format "%Y-%m-%d %H:%M:%S.%f"
    (
      "%Y-%m-%d %H:%M:%S.%f",
      "2016-01-29 23:00:00.1",
      "2016-01-29T23:00:00.100000",
    ),


    # Format "%Y-%m-%d %H:%M:%S%z"
    (
      "%Y-%m-%d %H:%M:%S%z",
      "2016-01-29 23:00:00-08",
      "2016-01-29T23:00:00-08:00",
    ),


    # Format "%Y-%m-%d %H:%M:%S"
    (
      "%Y-%m-%d %H:%M:%S",
      "2016-01-29 23:00:00",
      "2016-01-29T23:00:00",
    ),


    # Format "%Y-%m-%d %H:%M%z"
    (
      "%Y-%m-%d %H:%M%z",
      "2016-01-29 23:00-08",
      "2016-01-29T23:00:00-08:00",
    ),


    # Format "%Y-%m-%d %H:%M"
    (
      "%Y-%m-%d %H:%M",
      "2016-01-29 23:00",
      "2016-01-29T23:00:00",
    ),


    #
    # "US Date, 24h time"
    #

    # Format "%m-%d-%Y %H:%M:%S.%f"
    (
      "%m-%d-%Y %H:%M:%S.%f",
      "01-29-2016 23:00:00.1",
      "2016-01-29T23:00:00.100000",
    ),

    # Format "%m-%d-%Y %H:%M:%S"
    (
      "%m-%d-%Y %H:%M:%S",
      "01-29-2016 23:00:00",
      "2016-01-29T23:00:00",
    ),

    # Format "%m-%d-%Y %H:%M"
    (
      "%m-%d-%Y %H:%M",
      "01-29-2016 23:00",
      "2016-01-29T23:00:00",
    ),


    #
    # "US Date, no time"
    #

    # Format "%m-%d-%Y"
    (
      "%m-%d-%Y",
      "01-29-2016",
      "2016-01-29T00:00:00",
    ),


    # TODO: WARNING the time-only formats are problematic: datetime.strptime
    # defaults the year component to 1900-01-01. If we parse them into
    # datetime.time, do we even have an encoder for it in NuPIC?

    #
    # "US 12h AM/PM time only"
    #


    # Format "%I:%M:%S.%f %p"
    (
      "%I:%M:%S.%f %p",
      "11:01:59.01 AM",
      "1900-01-01T11:01:59.010000"
    ),

    (
      "%I:%M:%S.%f %p",
      "11:01:59.01 PM",
      "1900-01-01T23:01:59.010000"
    ),

    # Format "%I:%M:%S %p"
    (
      "%I:%M:%S %p",
      "11:01:59 PM",
      "1900-01-01T23:01:59"
    ),

    # Format "%I:%M %p"
    (
      "%I:%M %p",
      "11:01 PM",
      "1900-01-01T23:01:00"
    ),


    #
    # 24h time only"
    #

    # Format "%H:%M:%S.%f"
    (
      "%H:%M:%S.%f",
      "11:01:59.01",
      "1900-01-01T11:01:59.010000"
    ),

    (
      "%H:%M:%S.%f",
      "23:01:59.01",
      "1900-01-01T23:01:59.010000"
    ),

    # Format "%H:%M:%S"
    (
      "%H:%M:%S",
      "11:01:59",
      "1900-01-01T11:01:59"
    ),

    # Format "%H:%M"
    (
      "%H:%M",
      "11:01",
      "1900-01-01T11:01:00"
    )

  ]


  def testGoodSamples(self):

    for fmt, timestamp, expectedIso in self._GOOD_SAMPLES:

      try:
        parsed = date_time_utils.parseDatetime(timestamp, fmt)
      except (TypeError, ValueError) as exc:
        self.fail(
          "Failed to parse ts={!r} using fmt={!r}; exc={!r}".format(
            timestamp, fmt, exc))

      try:
        isoEncoded = parsed.isoformat()
      except ValueError as exc:
        self.fail(
          "Failed to isoformat parsed datetime={!r}; ts={!r} using fmt={!r}; "
          "exc={!r}".format(parsed, timestamp, fmt, exc))

      self.assertEqual(
        isoEncoded, expectedIso,
        msg=(
          "ISO result {!r} didn't match expected {!r}; ts={!r} using fmt={!r}"
          .format(isoEncoded, expectedIso, timestamp, fmt)))
