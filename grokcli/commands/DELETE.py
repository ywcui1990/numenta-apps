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
from urlparse import urlparse
import grokcli
from grokcli.api import GrokSession, Response
from functools import partial
import select
import sys

# Subcommand CLI Options

if __name__ == "__main__":
  subCommand = "%prog"
else:
  subCommand = "%%prog %s" % __name__.rpartition('.')[2]

USAGE = """%s GROK_URL GROK_API_KEY [options]

""".strip() % subCommand

parser = OptionParser(usage=USAGE)
parser.add_option(
  "-d",
  "--data",
  dest="data",
  metavar="FILE or -",
  help="Path to file containing request data, or - if you want to " \
       "read the data from stdin.")

# Implementation

def handle(options, args):
  """ `grok DELETE` handler. """
  (endpoint, apikey) = grokcli.getCommonArgs(parser, args)

  if options.data:
    data = options.data
  else:
    # Pop data source off args
    try:
      data = args.pop(0)
    except IndexError:
      data = ""

  server = "%(scheme)s://%(netloc)s" % urlparse(endpoint)._asdict()

  grok = GrokSession(server=server, apikey=apikey)

  delete = partial(grok.delete, endpoint)

  response = None
  if data.strip() == "-" or not data:
    if select.select([sys.stdin,],[],[],0.0)[0]:
      response = delete(data=sys.stdin)
    else:
      response = delete()
  elif data:
    with open(data, "r") as fp:
      response = delete(data=fp)

  if isinstance(response, Response):
    print response.text
    sys.exit(not int(bool(response)))


if __name__ == "__main__":
  handle(*parser.parse_args())
