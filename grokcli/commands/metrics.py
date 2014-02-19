#!/usr/bin/env python
#-------------------------------------------------------------------------------
# Copyright (C) 2013-2014 Numenta Inc. All rights reserved.
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


if __name__ == "__main__":
  subCommand = "%prog"
else:
  subCommand = "%%prog %s" % __name__.rpartition('.')[2]

USAGE = """%s (list|unmonitor) GROK_SERVER GROK_API_KEY [options]

Manage monitored metrics.
""".strip() % subCommand


parser = OptionParser(usage=USAGE)
parser.add_option(
  "--id",
  dest="id",
  metavar="ID",
  help="Metric ID (required for unmonitor)")
parser.add_option(
  "--format",
  dest="format",
  default="text",
  help='Output format (text|json)')



def printHelpAndExit():
  parser.print_help(sys.stderr)
  sys.exit(1)


def handleListRequest(grok, fmt):
  models = grok.listModels()

  if fmt == "json":
    print(json.dumps(models))
  else:
    table = PrettyTable()

    table.add_column("ID", [x['uid'] for x in models])
    table.add_column("Display Name", [x['display_name'] for x in models])
    table.add_column("Name", [x['name'] for x in models])
    table.add_column("Status", [x['status'] for x in models])

    table.align = "l"  # left align
    print(table)


def handleUnmonitorRequest(grok, metricID):
  grok.deleteModel(metricID)


def handle(options, args):
  """ `grok metrics` handler. """
  try:
    action = args.pop(0)
  except IndexError:
    printHelpAndExit()

  (server, apikey) = grokcli.getCommonArgs(parser, args)

  grok = GrokSession(server=server, apikey=apikey)

  if action == "list":
    handleListRequest(grok, options.format)
  elif action == "unmonitor":
    if not options.id:
      printHelpAndExit()

    handleUnmonitorRequest(grok, options.id)
  else:
    printHelpAndExit()


if __name__ == "__main__":
  handle(*parser.parse_args())
