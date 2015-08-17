#!/usr/bin/env python
# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero Public License for more details.
#
# You should have received a copy of the GNU Affero Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------

"""
Sets Grok product edition in product configuration.

As of Grok 1.5, only "standard" edition is permitted. This value is used to
drive logic at runtime, such as instance quota configuration/enforcement.

It's expected that the product edition will be set by the build process.

MUST BE CALLED AFTER INITIALIZATION OF GROK CONFIGURATION, BUT BEFORE
update_quota.py

NOTE: Assumes Grok's configuration system has already been initialized (i.e.,
Grok's `setup.py init` has run)
"""

import logging
from optparse import OptionParser
import sys


from nupic.support.decorators import logEntryExit

from grok import logging_support
from grok.app import GrokProductConfig



def _getLogger():
  return logging.getLogger("grok.set_edition")



@logEntryExit(_getLogger, entryExitLogLevel=logging.INFO)
def setEdition(args):
  supportedEditions = ["standard"]

  helpString = (
    "This script updates Grok production edition in %s.\n"
    "%%prog %s\n\n"
    "IT MUST BE CALLED AFTER INITIALIZATION OF GROK CONFIGURATION, BUT BEFORE "
    "update_quota.py"
    ) % (GrokProductConfig.CONFIG_NAME, "|".join(supportedEditions),)

  parser = OptionParser(helpString)

  (_options, posArgs) = parser.parse_args(args)

  if len(posArgs) != 1:
    parser.error("Expected exactly one positional arg, but got %s" % (
                 len(posArgs),))

  editionType = posArgs[0]
  if editionType not in supportedEditions:
    parser.error("Got unsupported Grok product edition string %r; expected one "
                 "of %s" % (editionType, supportedEditions,))

  config = GrokProductConfig(mode=GrokProductConfig.MODE_OVERRIDE_ONLY)
  if not config.has_section("edition"):
    config.add_section("edition")
  config.set("edition", "type", editionType)
  config.save()



if __name__ == "__main__":
  logging_support.LoggingSupport.initTool()

  logger = _getLogger()
  try:
    setEdition(sys.argv[1:])
  except:
    e = sys.exc_info()[1]
    if not (isinstance(e, SystemExit) and e.code == 0):
      logger.exception("setEdition failed")
    raise
  else:
    logger.info("setEdition completed successfully")
