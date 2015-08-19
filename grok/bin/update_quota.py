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
Updates Grok quota configuration based on Grok production edition, the host
platform, etc. (e.g., instance quota).

Grok application quota settings are available at rutime via the grok.app.quota
interface.

It's intended that this script will be called at boot time, since the user may
dynamically migrate the installed Grok image to a larger or smaller host
instance.

MUST BE CALLED BEFORE STARTING GROK SERVICES

ASSUMES PRODUCT EDITION HAS ALREADY BEEN CONFIGURED (see set_edition.py)

NOTE: Assumes Grok's configuration system has already been initialized (i.e.,
Grok's `setup.py init` has run against this image)
"""

import logging
from optparse import OptionParser
import sys

from nupic.support.decorators import logEntryExit

from grok import logging_support
from grok.app.quota import Quota, QuotaConfig



def _getLogger():
  return logging.getLogger("grok.update_quota")



@logEntryExit(_getLogger, entryExitLogLevel=logging.INFO)
def updateQuota(args):
  helpString = (
    "This script updates Grok app quotas in %s.\n"
    "%%prog\n\n"
    "IT MUST BE CALLED AFTER set_edition.py, BUT BEFORE STARTING GROK SERVICES"
    ) % (QuotaConfig.CONFIG_NAME,)

  parser = OptionParser(helpString)

  (_options, posArgs) = parser.parse_args(args)

  if len(posArgs) != 0:
    parser.error("Expected no positional args, but got %s" % (
                 len(posArgs),))

  Quota.init()



if __name__ == "__main__":
  logging_support.LoggingSupport.initTool()

  logger = _getLogger()
  try:
    updateQuota(sys.argv[1:])
  except:
    e = sys.exc_info()[1]
    if not (isinstance(e, SystemExit) and e.code == 0):
      logger.exception("updateQuota failed")
    raise
  else:
    logger.info("updateQuota completed successfully")
