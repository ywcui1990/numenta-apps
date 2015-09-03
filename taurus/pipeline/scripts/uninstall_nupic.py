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

"""
Simple utility to aid in the removal of nupic.  This wraps the
`pip.commands.uninstall.UninstallCommand` class used in the `pip uninstall`
command
"""

from pip.commands.uninstall import UninstallCommand



class UnableToCompletelyRemoveNuPICError(Exception):
  pass



def removeNupic(maxAttempts=10):
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
  for _ in xrange(maxAttempts):
    try:
      import nupic
    except ImportError:
      break
    UninstallCommand().main(["nupic", "--disable-pip-version-check"])
  else:
    raise UnableToCompletelyRemoveNuPICError(
      "Giving up after {} attempts to remove `nupic`".format(maxAttempts))



if __name__ == "__main__":
  removeNupic()
