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

import os

from infrastructure.utilities import logger as log
from infrastructure.utilities.exceptions import BuildFailureException
from infrastructure.utilities.nupic.build_commands import (
  checkIfProjectExistsLocallyForSHA,
  fullBuild,
  installNuPICWheel
)
from infrastructure.utilities.path import changeToWorkingDir
from infrastructure.utilities.cli import runWithOutput

SCRIPTS_DIR = os.path.join(os.environ.get("PRODUCTS"), "grok", "grok",
                           "pipeline", "scripts")


# TODO Refactor and fix the cyclic calls between fullBuild() and buildNuPIC()
# Fix https://jira.numenta.com/browse/TAUR-749
def buildNuPIC(env, pipelineConfig, logger):
  """
    Builds NuPIC with the provided nupicSHA

    :param env: The environment which will be set before building

    :param pipelineConfig: dict of the pipeline config values, e.g.:
      {
        "buildWorkspace": "/path/to/build/in",
        "grokRemote": "git@github.com:GrokSolutions/applications.git",
        "grokBranch": "master",
        "grokSha": "HEAD",
        "nupicRemote": "git@github.com:numenta/nupic.git",
        "nupicBranch": "master",
        "nupicSha": "HEAD",
        "pipelineParams": "{dict of parameters}",
        "pipelineJson": "/path/to/json/file"
      }

    :param logger: Initialized Numenta logger object.
  """
  env = updateEnv(env)

  if not checkIfProjectExistsLocallyForSHA("nupic", pipelineConfig["nupicSha"],
                                           logger):
    # TODO Refactor and fix the cyclic calls between fullBuild() and buildNuPIC()
    # Fix https://jira.numenta.com/browse/TAUR-749
    fullBuild(env, pipelineConfig["buildWorkspace"],
              pipelineConfig["nupicRemote"],
              pipelineConfig["nupicBranch"],
              pipelineConfig["nupicSha"], logger)



def buildGrok(env, pipelineConfig, logger):
  """
    Builds Grok with given Grok SHA.
    :param env: The environment which will be set before building

    :param pipelineConfig: dict of the pipeline config values, e.g.:
      {
        "buildWorkspace": "/path/to/build/in",
        "grokRemote": "git@github.com:GrokSolutions/applications.git",
        "grokBranch": "master",
        "grokSha": "HEAD",
        "nupicRemote": "git@github.com:numenta/nupic.git",
        "nupicBranch": "master",
        "nupicSha": "HEAD",
        "pipelineParams": "{dict of parameters}",
        "pipelineJson": "/path/to/json/file",
        "wheelFilePath": "/path/to/wheel/file"
      }

    :param logger: Logger object.

    :raises
      infrastructure.utilities.exceptions.BuildFailureException:
      This exception is raised if build fails.
  """
  try :
    sitePackagesDir = os.path.join(env["PRODUCTS"],
                                   "grok/lib/python2.7/site-packages")
    if not os.path.exists(sitePackagesDir):
      os.makedirs(sitePackagesDir)
    with changeToWorkingDir(env["PRODUCTS"]):
      installNuPICWheel(env, env["GROK_HOME"],
                        pipelineConfig["wheelFilePath"], logger)

    # Setup the baseline configuration
    with changeToWorkingDir(env["GROK_HOME"]):
      runWithOutput("python setup.py configure_grok", env=env, logger=logger)
  except:
    logger.exception("Unknown failure")
    raise BuildFailureException("Grok building failed. Exiting.")
