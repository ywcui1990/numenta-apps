#!/usr/bin/env python
#-------------------------------------------------------------------------------
# Copyright (C) 2013 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------
import json
import sys
from optparse import OptionParser
import grokcli
from grokcli.api import GrokSession



# Subcommand CLI Options

if __name__ == "__main__":
  subCommand = "%prog"
else:
  subCommand = "%%prog %s" % __name__.rpartition('.')[2]

USAGE = """%s (add|delete|list) GROK_SERVER GROK_API_KEY [options]

Create Grok cloudwatch model
""".strip() % subCommand

def dimensions_callback(option, opt, value, parser):
  if not hasattr(dimensions_callback, "dimensions"):
    dimensions_callback.dimensions = {}
  dimensions_callback.dimensions[value[0]]=value[1]

parser = OptionParser(usage=USAGE)
parser.add_option(
  "--metric",
  dest="metric",
  metavar="NAME",
  help="Metric name")
parser.add_option(
  "--namespace",
  dest="namespace",
  metavar="NAMESPACE",
  help="Metric namespace")
parser.add_option(
  "--region",
  dest="region",
  metavar="REGION",
  help="AWS Region")
parser.add_option(
  "--dimensions",
  dest="dimensions",
  action="callback",
  nargs=2,
  type="str",
  callback=dimensions_callback,
  help="Cloudwatch dimensions (required)")

# Implementation

def handle(options, args):
  """ `grok cloudwatch` handler. """
  try:
    action = args.pop(0)
  except IndexError:
    parser.print_help(sys.stderr)
    sys.exit(1)

  (server, apikey) = grokcli.getCommonArgs(parser, args)

  grok = GrokSession(server=server, apikey=apikey)

  nativeMetric = {
      "datasource": "cloudwatch",
      "metric": options.metric,
      "namespace": options.namespace,
      "region": options.region
    }

  if hasattr(dimensions_callback, "dimensions"):
    nativeMetric["dimensions"] = dimensions_callback.dimensions
  else:
    parser.print_help()
    sys.exit(1)

  if action == "add":
    result = grok.createModel(nativeMetric)
    model = next(iter(result))
    print model["uid"]
  elif action == "delete":
    pass # TODO There is no cloudwatch-specific DELETE interface
  elif action == "list":
    pass # TODO There is no cloudwatch-specific GET interface for models


if __name__ == "__main__":
  handle(*parser.parse_args())
