#!/usr/bin/env python
#-------------------------------------------------------------------------------
# Copyright (C) 2013 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------
import sys
from optparse import OptionParser
from urlparse import urlparse
import grokcli
from grokcli.api import GrokSession, Response



# Subcommand CLI Options

if __name__ == "__main__":
  subCommand = "%prog"
else:
  subCommand = "%%prog %s" % __name__.rpartition('.')[2]

USAGE = """%s GROK_URL GROK_API_KEY [options]

""".strip() % subCommand

parser = OptionParser(usage=USAGE)

# Implementation

def handle(options, args):
  """ `grok GET` handler. """
  (endpoint, apikey) = grokcli.getCommonArgs(parser, args)

  server = "%(scheme)s://%(netloc)s" % urlparse(endpoint)._asdict()

  grok = GrokSession(server=server, apikey=apikey)

  response = grok.get(endpoint)

  if isinstance(response, Response):
    print response.text
    sys.exit(not int(bool(response)))


if __name__ == "__main__":
  handle(*parser.parse_args())
