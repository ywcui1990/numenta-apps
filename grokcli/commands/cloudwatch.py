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



# Subcommand CLI Options

if __name__ == "__main__":
  subCommand = "%prog"
else:
  subCommand = "%%prog %s" % __name__.rpartition('.')[2]

USAGE = """%s (metrics|instances) (list|monitor) \
GROK_SERVER GROK_API_KEY [options]

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
  "--instance",
  dest="instance",
  metavar="INSTANCE_ID",
  help="Instance ID")
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
  help="Cloudwatch dimensions (required for monitor)")
parser.add_option(
  "--format",
  dest="format",
  default="text",
  help='Output format (text|json)')

# Implementation

def getCloudwatchMetrics(grok, region=None, namespace=None,
                         metricName=None):
  """ Request available metric data for specified region,
      namespace, metric name where provided in CLI context
  """
  # Query Grok regions API for available cloudwatch metrics
  if region:
    regions = [region]
  else:
    regions = grok.listMetrics("cloudwatch")["regions"]

  metrics = []

  for region in regions:
    for metric in grok.listCloudwatchMetrics(region,
                                             namespace=namespace,
                                             metric=metricName):
      metrics.append(metric)

  return metrics


def handleMetricsMonitorRequest(grok, nativeMetric):
  result = grok.createModel(nativeMetric)
  model = next(iter(result))
  print model["uid"]


def handleInstanceMonitorRequest(grok, region, namespace, instance):
  grok.createInstance(region, namespace, instance)


def tableAddMetricDimensionColumn(table, metrics, column):
  table.add_column(column, [x['dimensions'][column][0]
    if column in x['dimensions'] else '' for x in metrics])


def handleMetricsListRequest(grok, fmt, region=None, namespace=None,
                             metricName=None):
  metrics = getCloudwatchMetrics(grok, region=region,
                                 namespace=namespace, metricName=metricName)

  if fmt == "json":
    print(json.dumps(metrics))
  else:
    table = PrettyTable()

    table.add_column("Region", [x['region'] for x in metrics])
    table.add_column("Namespace", [x['namespace'] for x in metrics])
    table.add_column("Name", [x['name'] for x in metrics])
    table.add_column("Metric", [x['metric'] for x in metrics])

    tableAddMetricDimensionColumn(table, metrics, 'VolumeId')
    tableAddMetricDimensionColumn(table, metrics, 'InstanceId')
    tableAddMetricDimensionColumn(table, metrics, 'DBInstanceIdentifier')
    tableAddMetricDimensionColumn(table, metrics, 'LoadBalancerName')
    tableAddMetricDimensionColumn(table, metrics, 'AutoScalingGroupName')
    tableAddMetricDimensionColumn(table, metrics, 'AvailabilityZone')

    table.align = "l" # left align
    print(table)


def handle(options, args):
  """ `grok cloudwatch` handler. """
  try:
    resource = args.pop(0)
    action = args.pop(0)
  except IndexError:
    printHelpAndExit()

  (server, apikey) = grokcli.getCommonArgs(parser, args)

  grok = GrokSession(server=server, apikey=apikey)

  if resource == "metrics":

    if action == "monitor":
      nativeMetric = {
          "datasource": "cloudwatch",
          "metric": options.metric,
          "namespace": options.namespace,
          "region": options.region
        }

      if hasattr(dimensions_callback, "dimensions"):
        nativeMetric["dimensions"] = dimensions_callback.dimensions
      else:
        printHelpAndExit()

      handleMetricsMonitorRequest(grok, nativeMetric)

    elif action == "list":
      handleMetricsListRequest(
        grok,
        options.format,
        region=options.region,
        namespace=options.namespace,
        metricName=options.metric)

    else:
      printHelpAndExit()

  elif resource == "instances":

    if action == "monitor":
      if not (options.region and options.namespace and options.instance):
        printHelpAndExit()

      handleInstanceMonitorRequest(grok, options.region,
                                   options.namespace, options.instance)

    elif action == "list":
      print "Not yet implemented"

    else:
      printHelpAndExit()

  else:
    printHelpAndExit()


def printHelpAndExit():
  parser.print_help(sys.stderr)
  sys.exit(1)



if __name__ == "__main__":
  handle(*parser.parse_args())
