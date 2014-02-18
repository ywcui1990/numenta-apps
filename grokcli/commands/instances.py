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


if __name__ == "__main__":
  subCommand = "%prog"
else:
  subCommand = "%%prog %s" % __name__.rpartition('.')[2]

USAGE = """%s (list|unmonitor) GROK_SERVER GROK_API_KEY [options]

Browse...
""".strip() % subCommand


parser = OptionParser(usage=USAGE)
parser.add_option(
  "--instance",
  dest="instance",
  metavar="INSTANCE_ID",
  help='Instance ID (required for unmonitor')
parser.add_option(
  "--format",
  dest="format",
  default="text",
  help='Output format (text|json)')



def printHelpAndExit():
  parser.print_help(sys.stderr)
  sys.exit(1)


def handleListRequest(grok, fmt):
  instances = grok.listInstances()

  if fmt == "json":
    print(json.dumps(instances))
  else:
    table = PrettyTable()

    table.add_column("ID", [x['server'] for x in instances])
    table.add_column("Instance", [x['name'] for x in instances])
    table.add_column("Service", [x['namespace'] for x in instances])
    table.add_column("Region", [x['location'] for x in instances])
    table.add_column("Status", [x['status'] for x in instances])

    table.align = "l"  # left align
    print(table)


def handleUnmonitorRequest(grok, serverName):
  grok.deleteInstance(serverName)


def handle(options, args):
  """ `grok instance` handler. """
  try:
    action = args.pop(0)
  except IndexError:
    printHelpAndExit()

  (server, apikey) = grokcli.getCommonArgs(parser, args)

  grok = GrokSession(server=server, apikey=apikey)

  if action == "list":
    handleListRequest(grok, options.format)

  elif action == "unmonitor":
    if not options.instance:
      printHelpAndExit()

    handleUnmonitorRequest(grok, options.instance)

  else:
    printHelpAndExit()



if __name__ == "__main__":
  handle(*parser.parse_args())
