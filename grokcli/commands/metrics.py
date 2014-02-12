#!/usr/bin/env python
#-------------------------------------------------------------------------------
# Copyright (C) 2013 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------
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



def handle(options, args):
  """ `grok metrics` handler. """
  (server, apikey) = grokcli.getCommonArgs(parser, args)

  grok = GrokSession(server=server, apikey=apikey)



if __name__ == "__main__":
  handle(*parser.parse_args())
