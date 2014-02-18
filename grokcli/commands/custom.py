#!/usr/bin/env python
#-------------------------------------------------------------------------------
# Copyright (C) 2014 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------

import json
from optparse import OptionParser
import sys

from prettytable import PrettyTable

import grokcli
from grokcli.api import GrokSession



# Subcommand CLI Options

if __name__ == "__main__":
  subCommand = "%prog"
else:
  subCommand = "%%prog %s" % __name__.rpartition('.')[2]

USAGE = """%s metrics (list|monitor) GROK_SERVER GROK_API_KEY [options]

Manage custom metrics.
""".strip() % subCommand

parser = OptionParser(usage=USAGE)
parser.add_option(
  "--metric",
  dest="metric",
  metavar="ID",
  help="Metric ID (required for monitor)")
parser.add_option(
  "--format",
  dest="format",
  default="text",
  help='Output format (text|json)')



def printHelpAndExit():
  parser.print_help(sys.stderr)
  sys.exit(1)


def handleListRequest(grok, fmt):
  metrics = grok.listMetrics("custom")

  if fmt == "json":
    print(json.dumps(metrics))
  else:
    table = PrettyTable()

    table.add_column("ID", [x['uid'] for x in metrics])
    table.add_column("Name", [x['name'] for x in metrics])
    table.add_column("Display Name", [x['display_name'] for x in metrics])
    table.add_column("Status", [x['status'] for x in metrics])

    table.align = "l" # left align
    print(table)


def handleMonitorRequest(grok, metricID):
  nativeMetric = {
    "datasource": "custom",
    "uid": metricID
  }
  grok.createModel(nativeMetric)


def handle(options, args):
  """ `grok custom` handler. """
  try:
    resource = args.pop(0)
    action = args.pop(0)
  except IndexError:
    printHelpAndExit()

  (server, apikey) = grokcli.getCommonArgs(parser, args)

  grok = GrokSession(server=server, apikey=apikey)

  if resource == "metrics":

    if action == "list":
      handleListRequest(grok, options.format)

    elif action == "monitor":
      if not options.metric:
        printHelpAndExit()

      handleMonitorRequest(grok, options.metric)

    else:
      printHelpAndExit()

  else:
    printHelpAndExit()


if __name__ == "__main__":
  handle(*parser.parse_args())
