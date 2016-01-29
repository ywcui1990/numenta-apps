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
Implements Unicorn's param_finder interface.
"""
from argparse import ArgumentParser
import json
import logging
import os
import sys
import traceback
from param_finder import ParamFinder

g_log = logging.getLogger(__name__)



class _CommandLineArgError(Exception):
  """ Error parsing command-line options """
  pass



class _Options(object):
  """Options returned by _parseArgs"""

  __slots__ = ("fileName",
               "rowOffset",
               "timestampIndex",
               "valueIndex",
               "datetimeFormat")


  def __init__(self,
               fileName,
               rowOffset,
               timestampIndex,
               valueIndex,
               datetimeFormat):
    """
    :param fileName: str path to input csv file
    :param rowOffset: int, zero-based index of first data row in csv
    :param timestampIndex: int, zero-based column index of the timeStamp
    :param valueIndex: int, zero-based column index of the value
    :param datetimeFormat: str, datetime format string for python's
                          datetime.strptime
    """
    self.fileName = fileName
    self.rowOffset = rowOffset
    self.timestampIndex = timestampIndex
    self.valueIndex = valueIndex
    self.datetimeFormat = datetimeFormat
    

  @property
  def __dict__(self):  # pylint: disable=C0103
    """ Required for **vars() usage
    """
    return {slot: getattr(self, slot) for slot in self.__slots__}



def _parseArgs():
  """ Parse command-line args

  :rtype: _Options object
  :raises _CommandLineArgError: on command-line arg error
  """


  class SilentArgumentParser(ArgumentParser):
    def error(self, msg):
      """Override `error()` to prevent unstructured output to stderr"""
      raise _CommandLineArgError(msg)


  parser = SilentArgumentParser(description=("Start Unicorn ParamFinder"))

  parser.add_argument("--csv",
                      type=str,
                      dest="csv",
                      required=True,
                      help="REQUIRED: path to input CSV file")

  parser.add_argument("--rowOffset",
                      type=int,
                      required=True,
                      help="index of first data row in csv file")

  parser.add_argument("--timestampIndex",
                      type=int,
                      required=True,
                      help="zero-based column index of the timestamp")

  parser.add_argument("--valueIndex",
                      type=int,
                      required=True,
                      help="zero-based column index of the data value")

  parser.add_argument("--datetimeFormat",
                      type=str,
                      required=True,
                      help="datetime format string for python's "
                           "datetime.strftime")

  options = parser.parse_args()

  if not options.csv:
    parser.error("Missing or empty --csv option value")

  return _Options(fileName=options.csv,
                  rowOffset=options.rowOffset,
                  timestampIndex=options.timestampIndex,
                  valueIndex=options.valueIndex,
                  datetimeFormat=options.datetimeFormat)



def main():
  # Use NullHandler for now to avoid getting the unwanted unformatted warning
  # message from logger on stderr "No handlers could be found for logger".
  g_log.addHandler(logging.NullHandler())
  try:

    outputInfo = ParamFinder(**vars(_parseArgs())).run()
    sys.stdout.write(json.dumps(outputInfo))
    sys.stdout.flush()

  except Exception as ex:  # pylint: disable=W0703
    g_log.exception("ParamFinder failed")

    errorMessage = {
      "errorText": str(ex) or repr(ex),
      "diagnosticInfo": traceback.format_exc()
    }

    errorMessage = "%s\n" % (json.dumps(errorMessage))

    try:
      sys.stderr.write(errorMessage)
      sys.stderr.flush()
    except Exception:  # pylint: disable=W0703
      g_log.exception("Failed to emit error message to stderr; msg=%s",
                      errorMessage)

    # Use os._exit to abort the process instead of an exception to prevent
    # the python runtime from dumping traceback to stderr (since we dump a json
    # message to stderr, and don't want the extra text to interfere with parsing
    # in the Front End)
    os._exit(1)  # pylint: disable=W0212



if __name__ == "__main__":
  main()
