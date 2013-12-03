#!/usr/bin/env python
#-------------------------------------------------------------------------------
# Copyright (C) 2013 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------
try:
  import yaml
except ImportError:
  import json # yaml not available, fall back to json
import select
import sys

from functools import partial
from grokcli.api import GrokSession
import grokcli
from optparse import OptionParser

# Subcommand CLI Options

if __name__ == "__main__":
  subCommand = "%prog"
else:
  subCommand = "%%prog %s" % __name__.rpartition('.')[2]

USAGE = """%s GROK_SERVER GROK_API_KEY [FILE]

Import Grok model definitions.
""".strip() % subCommand

parser = OptionParser(usage=USAGE)
parser.add_option(
  "-d",
  "--data",
  dest="data",
  metavar="FILE or -",
  help="Path to file containing Grok model definitions, or - if you " \
       "want to read the data from stdin."

# Implementation

def importMetricsFromFile(grok, fp, **kwargs):
  models = grokcli.load(fp.read())
  result = grok.createModels(models)


def handle(options, args):
  """ `grok import` handler. """
  try:
    server = args.pop(0)
    apikey = args.pop(0)
  except IndexError:
    parser.print_help()
    sys.exit(1)

  if options.data:
    data = options.data
  else:
    # Pop data source off args
    try:
      data = args.pop(0)
    except IndexError:
      data = "-"

  grok = GrokSession(server=server, apikey=apikey)

  if data.strip() == "-":
    if select.select([sys.stdin,],[],[],0.0)[0]:
      importMetricsFromFile(grok, sys.stdin, **vars(options))
    else:
      parser.print_help()
      sys.exit(1)
  elif data:
    with open(data, "r") as fp:
      importMetricsFromFile(grok, fp, **vars(options))




if __name__ == "__main__":
  handle(*parser.parse_args())
