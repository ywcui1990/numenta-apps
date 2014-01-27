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


if __name__ == "__main__":
  subCommand = "%prog"
else:
  subCommand = "%%prog %s" % __name__.rpartition('.')[2]

USAGE = """%s GROK_SERVER GROK_API_KEY [options]

Browse...
""".strip() % subCommand


parser = OptionParser(usage=USAGE)
parser.add_option(
  "--datasource",
  dest="datasource",
  metavar="DATASOURCE",
  help='Metric data source ("cloudwatch", "custom", etc.)')
parser.add_option(
  "--metric",
  dest="metric",
  metavar="NAME",
  help="Metric name")
parser.add_option(
  "--namespace",
  dest="namespace",
  metavar="NAMESPACE",
  help="Metric namespace (cloudwatch-only)")
parser.add_option(
  "--region",
  dest="region",
  metavar="REGION",
  help="AWS Region (cloudwatch-only)")



def printTabulatedResults(columns, maximums, buffer_):
  """ Print tabulated data
  """

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
  for row in buffer_:
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


def handleCloudwatchRequest(grok, region=None, datasource=None, namespace=None,
    metricName=None):
  """ Request available metric data for specified region, datasource,
      namespace, metric name where provided in CLI context
  """
  # Query Grok regions API for available cloudwatch metrics
  if region:
    regions = [region]
  else:
    regions = grok.listMetrics(datasource)["regions"]

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


def handle(options, args):
  """ `grok metrics` handler. """
  (server, apikey) = grokcli.getCommonArgs(parser, args)

  grok = GrokSession(server=server, apikey=apikey)

  if options.datasource == "cloudwatch":

    (columns, maximums, buffer_) = handleCloudwatchRequest(grok,
                                    region=options.region,
                                    datasource=options.datasource,
                                    namespace=options.namespace,
                                    metricName=options.metric)

    printTabulatedResults(columns, maximums, buffer_)

  elif options.datasource == "custom":
    print "Not currently supported"

  else:
    columns = ("Datasource",)
    maximums = [len(column) for column in columns]

    buffer_ = []
    for datasource in grok.listMetricDatasources():
      maximums[0] = max(len(datasource), maximums[0])
      buffer_.append((datasource,))

    printTabulatedResults(columns, maximums, buffer_)



if __name__ == "__main__":
  handle(*parser.parse_args())
