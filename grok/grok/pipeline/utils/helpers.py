# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------



def checkIfSaneProductionParams(grokRemote, nupicRemote, grokBranch,
                                nupicBranch):
  """
    This method checks if the build is being run against whitelisted
    forks/branches for production purposes.

    :param grokRemote: GROK repository URL used for current build

    :param nupicRemote: NuPIC repository URL used for current build

    :param grokBranch: grok branch used for current build

    :param nupicBranch: NuPIC branch used for NuPIC branch for current build

    :returns: True or False to allow/ prohibit updating ciBranch
    :rtype: bool
  """
  if (grokRemote == "git@github.com:GrokSolutions/applications.git" and
      nupicRemote == "git@github.com:numenta/nupic.git" and
      nupicBranch == "master" and grokBranch == "master"):
    return True
  else:
    return False
