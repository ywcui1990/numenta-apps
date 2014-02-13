#!/usr/bin/env python
#-------------------------------------------------------------------------------
# Copyright (C) 2013-2014 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------
import sys
from optparse import OptionParser
import grokcli
from grokcli.api import GrokSession



# Subcommand CLI Options

if __name__ == "__main__":
  subCommand = "%prog"
else:
  subCommand = "%%prog %s" % __name__.rpartition('.')[2]

USAGE = """%s (list|monitor) GROK_SERVER GROK_API_KEY [options]

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
      parser.print_help()
      sys.exit(1)

    result = grok.createModel(nativeMetric)
    model = next(iter(result))
    print model["uid"]
  elif action == "list":
    (columns, maximums, buf) = handleCloudwatchRequest(
      grok,
      region=options.region,
      namespace=options.namespace,
      metricName=options.metric)

    printTabulatedResults(columns, maximums, buf)


def printTabulatedResults(columns, maximums, buf):
  """ Print tabulated data """
  # Print column names
  for (colnum, value) in enumerate(columns):
    if colnum == 0:
      print " ",
    else:
      print "| ",
    print value.ljust(maximums[colnum]),
  print

  # Print horizontal rule
  for (colnum, value) in enumerate(columns):
    if colnum == 0:
      print " ",
    else:
      print "| ",
    print "_" * maximums[colnum],
  print

  # Print buffered results
  for row in buf:
    for (colnum, value) in enumerate(columns):
      if colnum == 0:
        print " ",
      else:
        print "| ",

      if colnum < len(row):
        print row[colnum].ljust(maximums[colnum]),
      else:
        print "".ljust(maximums[colnum]),

    print


def handleCloudwatchRequest(grok, region=None, namespace=None,
    metricName=None):
  """ Request available metric data for specified region,
      namespace, metric name where provided in CLI context
  """
  # Query Grok regions API for available cloudwatch metrics
  if region:
    regions = [region]
  else:
    regions = grok.listMetrics("cloudwatch")["regions"]

  columns = ["Region", "Namespace", "Name", "Metric"]
  maximums = [len(column) for column in columns]
  buffer_ = []
  for region in regions:
    for metric in grok.listCloudwatchMetrics(region, namespace=namespace,
        metric=metricName):

      maximums[0] = max(maximums[0], len(metric["region"]))
      maximums[1] = max(maximums[1], len(metric["namespace"]))
      maximums[2] = max(maximums[2], len(metric.get("name", "")))
      maximums[3] = max(maximums[3], len(metric["metric"]))

      row = [
        metric["region"],
        metric["namespace"],
        metric.get("name", ""),
        metric["metric"]]

      for dimension in metric["dimensions"]:
        if dimension not in columns[4:]:
          columns.append(dimension)

        colnum = columns[4:].index(dimension) + 4
        if len(maximums) <= colnum:
          maximums.append(len(dimension))
          maximums[colnum] = max(maximums[colnum], len(dimension))

        maximums[colnum] = max(maximums[colnum],
          len(next(iter(metric["dimensions"][dimension]))))

        if len(row) <= colnum:
          row.extend(([""] * (colnum-len(row))))
          if isinstance(metric["dimensions"][dimension], list):
            row.extend(metric["dimensions"][dimension])
          else:
            row.append(metric["dimensions"][dimension])

      buffer_.append(row)

  return (columns, maximums, buffer_)



if __name__ == "__main__":
  handle(*parser.parse_args())
