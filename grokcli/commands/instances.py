#!/usr/bin/env python
#-------------------------------------------------------------------------------
# Copyright (C) 2014 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------

from optparse import OptionParser

from prettytable import PrettyTable

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
  "--delete",
  dest="delete",
  metavar="SERVER_NAME",
  help='Remove monitored instance with server name')



def handleListRequest(grok):
  instances = grok.listInstances()
  table = PrettyTable()

  table.add_column("Instance", [x['name'] for x in instances])
  table.add_column("Service", [x['namespace'] for x in instances])
  table.add_column("Region", [x['location'] for x in instances])
  table.add_column("Server", [x['server'] for x in instances])
  table.add_column("Status", [x['status'] for x in instances])

  table.align = "l" # left align
  print table


def handleDeleteRequest(grok, serverName):
  grok.deleteInstance(serverName)


def handle(options, args):
  """ `grok metrics` handler. """
  (server, apikey) = grokcli.getCommonArgs(parser, args)

  grok = GrokSession(server=server, apikey=apikey)

  if options.delete:
    handleDeleteRequest(grok, options.delete)
  else:
    handleListRequest(grok)



if __name__ == "__main__":
  handle(*parser.parse_args())
