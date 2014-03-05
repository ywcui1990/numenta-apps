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
from grokcli.exceptions import GrokCLIError


if __name__ == "__main__":
  subCommand = "%prog"
else:
  subCommand = "%%prog %s" % __name__.rpartition('.')[2]

USAGE = """%s (stacks|metrics) (list|create|delete|add|remove) \
GROK_SERVER GROK_API_KEY [options]

Browse...
""".strip() % subCommand


parser = OptionParser(usage=USAGE)
parser.add_option(
  "--id",
  dest="id",
  help=('Stack ID (required for '
    'delete, add, remove, metrics list [or provide --name])'))
parser.add_option(
  "--name",
  dest="name",
  help=('Stack name (required for create; delete, '
    'add, remove, metrics list [or provide --id])'))
parser.add_option(
  "--region",
  dest="region",
  help='AWS region (required for create)')
parser.add_option(
  "--filters",
  dest="filters",
  help='Filters (required for create)')
parser.add_option(
  "--metric_id",
  dest="metricID",
  help='Metric ID (required for metrics remove)')
parser.add_option(
  "--metric_namespace",
  dest="metricNamespace",
  help='Metric Namespace (required for metrics add)')
parser.add_option(
  "--metric_name",
  dest="metricName",
  help='Metric Name (required for metrics add)')
parser.add_option(
  "--format",
  dest="format",
  default="text",
  help='Output format (text|json)')



def printHelpAndExit():
  parser.print_help(sys.stderr)
  sys.exit(1)


def findStackByName(grok, name):
  stacks = grok.listAutostacks()
  foundStacks = [s for s in stacks if s['name'] == name]

  if not len(foundStacks):
    raise GrokCLIError("Autostack not found")

  return foundStacks[0]['uid']


def handleListRequest(grok, fmt):
  stacks = grok.listAutostacks()

  if fmt == "json":
    print(json.dumps(stacks))
  else:
    table = PrettyTable()

    table.add_column("ID", [x['uid'] for x in stacks])
    table.add_column("Name", [x['name'] for x in stacks])
    table.add_column("Region", [x['region'] for x in stacks])
    table.add_column("Filters", [x['filters'] for x in stacks])

    table.align = "l"  # left align
    print(table)


def handleCreateRequest(grok, name, region, filters):
  grok.createAutostack(name, region, filters)


def handleDeleteRequest(grok, stackID, stackName):
  if not stackID:
    stackID = findStackByName(grok, stackName)
  
  grok.deleteAutostack(stackID)


def handleMetricsListRequest(grok, stackID, stackName, fmt):
  if not stackID:
    stackID = findStackByName(grok, stackName)

  metrics = grok.listAutostackMetrics(stackID)

  if fmt == "json":
    print(json.dumps(metrics))
  else:
    table = PrettyTable()

    table.add_column("ID", [x['uid'] for x in metrics])
    table.add_column("Display Name", [x['display_name'] for x in metrics])
    table.add_column("Name", [x['name'] for x in metrics])
    table.add_column("Status", [x['status'] for x in metrics])

    table.align = "l"  # left align
    print(table)


def handleMetricsAddRequest(grok, stackID, stackName, metricNamespace, metricName):
  if not stackID:
    stackID = findStackByName(grok, stackName)

  grok.addMetricToAutostack(stackID, metricNamespace, metricName)


def handleMetricsRemoveRequest(grok, stackID, stackName, metricID):
  if not stackID:
    stackID = findStackByName(grok, stackName)

  grok.removeMetricFromAutostack(stackID, metricID)


def handle(options, args):
  """ `grok autostacks` handler. """
  try:
    resource = args.pop(0)
    action = args.pop(0)
  except IndexError:
    printHelpAndExit()

  (server, apikey) = grokcli.getCommonArgs(parser, args)

  grok = GrokSession(server=server, apikey=apikey)

  if resource == "stacks":

    if action == "list":
      handleListRequest(grok, options.format)

    elif action == "create":
      if not (options.name and options.region and options.filters):
        printHelpAndExit()

      handleCreateRequest(grok,
                          options.name, options.region, options.filters)

    elif action == "delete":
      if not (options.id or options.name):
        printHelpAndExit()

      handleDeleteRequest(grok, options.id, options.name)

    else:
      printHelpAndExit()
      
  elif resource == "metrics":

    if not (options.name or options.id):
      printHelpAndExit()

    if action == "list":
      handleMetricsListRequest(grok, options.id, options.name, options.format)

    if action == "add":
      if not (options.metricNamespace and options.metricName):
        printHelpAndExit()

      handleMetricsAddRequest(grok, options.id, options.name,
                              options.metricNamespace, options.metricName)

    if action == "remove":
      if not options.metricID:
        printHelpAndExit()

      handleMetricsRemoveRequest(grok, options.id, options.name,
                                 options.metricID)

  else:
    printHelpAndExit()



if __name__ == "__main__":
  handle(*parser.parse_args())
