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
#

import glob
import os
import shutil
import sys

from pip.commands.uninstall import UninstallCommand



class UnableToCompletelyRemoveNuPICError(Exception):
  pass



def removePackage(packageName, maxAttempts=10):
  """ Iteratively attempt to remove nupic with pip until `import nupic`
  raises an ImportError exception.  Multiple attempts are necessary because
  `pip uninstall` only removes the first match.

  :raises UnableToCompletelyRemoveNuPICError: nupic may remain importable if
    installed in development mode (i.e. `python setup.py develop`,
    `pip install -e`), or the `nupic` directory is in PATH or PYTHONPATH.  In
    which case, give up trying to remove it and leave it up to the user to
    remediate either by changing directories, removing any entries from .pth
    files, or symlinks.
  """

  uninstallArgs = ["--yes", "--disable-pip-version-check"]

  for _ in xrange(maxAttempts):
    try:
      module = __import__(packageName)
      UninstallCommand().main([packageName] + uninstallArgs)

      # Remove vestiges of namespace packages, too
      moduleLocation = module.__path__[0]
      print "Removing {}".format(moduleLocation)
      shutil.rmtree(moduleLocation, ignore_errors=True)
      for filename in glob.glob(os.path.join(os.path.dirname(moduleLocation),
                                             packageName + "*")):
        print "Removing {}".format(filename)
        if os.path.isdir(filename):
          shutil.rmtree(filename)
        else:
          os.unlink(filename)
      del sys.modules[packageName]
    except ImportError:
      print "{} not found.".format(packageName)
      break
  else:
    raise UnableToCompletelyRemoveNuPICError(
      "Giving up after {} attempts to remove `{}`".format(maxAttempts,
                                                          packageName))



if __name__ == "__main__":
  removePackage("nupic")
