#!/usr/bin/env python
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

import argparse
import json
import os
from pkg_resources import resource_stream

import yaml

from grok.pipeline.utils import build_commands as builder
from grok.pipeline.utils import getGithubUserName
from grok.pipeline.utils.helpers import checkIfSaneProductionParams
from infrastructure.utilities import git
from infrastructure.utilities import logger as log
from infrastructure.utilities import s3
from infrastructure.utilities.env import prepareEnv
from infrastructure.utilities.exceptions import NupicBuildFailed
from infrastructure.utilities.path import changeToWorkingDir


def getDeployTrack(grokRemote, nupicRemote, grokBranch, nupicBranch):
  """
    This method gives us the deployTrack, depending upon parameters
    (basically checks if production parameters or not).

    :param grokRemote: URL for Grok remote repository
    :param nupicRemote: URL for NuPIC remote repository
    :param grokBranch:  Grok branch used for current build
    :param nupicBranch: NuPIC branch used for current build

    :returns: A `string` representing the deployment track
    e.g.
    1)
    grokRemote: git@github.com:<user-name>/applications.git
    nupicRemote: git@github.com:numenta/nupic.git
    deployTrack: <user-name>-numenta
    2)
    grokRemote: git@github.com:Numenta/applications.git
    nupicRemote: git@github.com:numenta/nupic.git
    deployTrack: groksolutions

    :rtype: string
  """
  if checkIfSaneProductionParams(grokRemote, nupicRemote, grokBranch,
                                 nupicBranch):
    return getGithubUserName(grokRemote)
  else:
    return (getGithubUserName(grokRemote) +
            "-" + getGithubUserName(nupicRemote))


def downloadOrCreateNuPICWheel(env, pipelineConfig):
  """
    Downloads the NuPIC wheel from S3 for a given SHA. If a wheel is not found
    for a particular SHA then NuPIC wheel is built for this SHA and uploaded to
    S3. The building and uploading of NuPIC wheel is delegated to nupic.

    While downloading a wheel from S3, if no NuPIC SHA is provided then the
    correct wheel version is read from
    "stable_nupic_version/nupic-package-version.txt" and if SHA is provided then
    correct wheel version is read from "stable_nupic_version/<SHA>".

    :param env: The environment variable which is set before building
    :param pipelineConfig: dict of the pipeline config values, e.g.:
      {
        "buildWorkspace": "/path/to/build/in",
        "grokRemote": "git@github.com:Numenta/numenta-apps.git",
        "grokBranch": "master",
        "grokSha": "HEAD",
        "nupicRemote": "git@github.com:numenta/nupic.git",
        "nupicBranch": "master",
        "nupicSha": "HEAD",
        "pipelineParams": "{dict of parameters}",
        "pipelineJson": "/path/to/json/file"
      }
    :returns: The absolute path of the NuPIC wheel.
    :rtype: string
  """
  g_config = yaml.load(resource_stream(__name__, "../conf/config.yaml"))

  nupicSha = pipelineConfig["nupicSha"]

  if nupicSha:
    path = "stable_nupic_version/%s" % nupicSha
  else:
    path = "stable_nupic_version/nupic-package-version.txt"

  bucketName = g_config["S3_MAPPING_BUCKET"]

  try:
    with open(s3.downloadFileFromS3(bucketName, path, g_logger), "r") as fHandle:
      contents = fHandle.readline().strip()
      pipelineConfig["nupicSha"] = contents.split(":")[0].strip()
      wheelFile = contents.split(":")[1].strip()
  except AttributeError:
    g_logger.debug("NuPIC wheel for %s not found in S3", nupicSha)
    g_logger.debug("Building NuPIC wheel for %s" % nupicSha)
    builder.buildNuPIC(env, pipelineConfig, g_logger)
    wheelFilePath = glob.glob("%s/dist/*.whl" % env["NUPIC"])[0]
    pipelineConfig["nupicBuilt"] = True
  else:
    g_logger.debug("Downloading NuPIC wheel from S3 : %s" % wheelFile)
    with changeToWorkingDir(env["BUILD_WORKSPACE"]):
      wheelFilePath = s3.downloadFileFromS3(bucketName,
                                            "builds_nupic_wheel/%s" % wheelFile,
                                            g_logger)
    pipelineConfig["nupicBuilt"] = False

  return wheelFilePath


def preBuildSetup(env, pipelineConfig):
  """
    Clone the Grok repo if needed and get it set to the right remote, branch,
    and SHA.  Once set, if the NuPIC parameters need to be revised, take care
    of that now, too.

    :param env: The environment variable which is set before building
    :param pipelineConfig: dict of the pipeline config values, e.g.:
      {
        "buildWorkspace": "/path/to/build/in",
        "grokRemote": "git@github.com:Numenta/numenta-apps.git",
        "grokBranch": "master",
        "grokSha": "HEAD",
        "nupicRemote": "git@github.com:numenta/nupic.git",
        "nupicBranch": "master",
        "nupicSha": "HEAD",
        "pipelineParams": "{dict of parameters}",
        "pipelineJson": "/path/to/json/file",
        "wheelFilePath": "/path/to/wheel/file"
      }

    :returns: The updated pipelineConfig dict
    :rtype: dict
  """
  log.printEnv(env, g_logger)

  # Clone Grok if needed, otherwise, setup remote
  with changeToWorkingDir(pipelineConfig["buildWorkspace"]):
    if not os.path.isdir(env["GROK_HOME"]):
      git.clone(pipelineConfig["grokRemote"], directory="products")

  with changeToWorkingDir(env["GROK_HOME"]):
    if pipelineConfig["grokSha"]:
      g_logger.debug("Resetting to %s" % pipelineConfig["grokSha"])
      git.resetHard(pipelineConfig["grokSha"])
    else:
      grokSha = git.getShaFromRemoteBranch(pipelineConfig["grokRemote"],
                                           pipelineConfig["grokBranch"])
      pipelineConfig["grokSha"] = grokSha
      g_logger.debug("Resetting to %s" % grokSha)
      git.resetHard(grokSha)

  wheelFilePath = downloadOrCreateNuPICWheel(env, pipelineConfig)
  pipelineConfig["wheelFilePath"] = wheelFilePath


def addAndParseArgs(jsonArgs):
  """
    Parse the command line arguments or a json blog containing the required
    values.

    :returns: A dict of the parameters needed, as follows:
      {
        "buildWorkspace": "/path/to/build/in",
        "grokRemote": "git@github.com:Numenta/numenta-apps.git",
        "grokBranch": "master",
        "grokSha": "HEAD",
        "nupicRemote": "git@github.com:numenta/nupic.git",
        "nupicBranch": "master",
        "nupicSha": "HEAD",
        "pipelineParams": "{dict of parameters}",
        "pipelineJson": "/path/to/json/file"
      }

    :rtype: dict

    :raises parser.error in case wrong combination of arguments or arguments
      are missing.
  """
  parser = argparse.ArgumentParser(description="build tool for NuPIC and Grok")
  parser.add_argument("--pipeline-json", dest="pipelineJson", type=str,
                      help="The JSON file generated by manifest tool.")
  parser.add_argument("--build-workspace", dest="buildWorkspace", type=str,
                      help="Common dir prefix for Grok and NuPIC")
  parser.add_argument("--grok-remote", dest="grokRemote", type=str,
                      help="The grok remote you want to use, e.g.,  "
                           "git@github.com:Numenta/numenta-apps.git")
  parser.add_argument("--grok-sha", dest="grokSha", type=str,
                      help="Grok SHA that will be built")
  parser.add_argument("--grok-branch", dest="grokBranch", type=str,
                      help="The branch you are building from")
  parser.add_argument("--nupic-remote", dest="nupicRemote", type=str,
                      help="The nupic remote you want to use,"
                           "e.g., git@github.com:numenta/nupic.git")
  parser.add_argument("--nupic-branch", dest="nupicBranch", type=str,
                      help="The NuPIC branch to add in deploy track")
  parser.add_argument("--nupic-sha", dest="nupicSha", type=str,
                      help="NuPIC SHA that will be built.")
  parser.add_argument("--release-version", dest="releaseVersion", type=str,
                      help="Current release version, this will be used as base"
                           "version for grok, NuPIC and tracking rpm")
  parser.add_argument("--log", dest="logLevel", type=str, default="warning",
                      help="Logging level, by default it takes warning")

  args = {}
  if jsonArgs:
    args = jsonArgs
  else:
    args = vars(parser.parse_args())

  global g_logger
  g_logger = log.initPipelineLogger("build", logLevel=args["logLevel"])
  saneParams = {k:v for k, v in args.items() if v is not None}
  del saneParams["logLevel"]

  if "pipelineJson" in saneParams and len(saneParams) > 1:
    errorMessage = "Please provide parameters via JSON file or commandline"
    parser.error(errorMessage)

  if "pipelineJson" in saneParams:
    with open(args["pipelineJson"]) as paramFile:
      pipelineParams = json.load(paramFile)
  else:
    pipelineParams = saneParams

  # Setup defaults
  pipelineConfig = {
    "buildWorkspace": None,
    "grokRemote": "git@github.com:Numenta/numenta-apps.git",
    "grokBranch": "master",
    "grokSha": "HEAD",
    "nupicRemote": "git@github.com:numenta/nupic.git",
    "nupicBranch": "master",
    "nupicSha": None,
    "pipelineParams": pipelineParams,
    "pipelineJson": None
  }

  pipelineConfig["buildWorkspace"] = os.environ.get("BUILD_WORKSPACE",
                    pipelineParams.get("buildWorkspace",
                      pipelineParams.get("manifest", {}).get("buildWorkspace")))
  if not pipelineConfig["buildWorkspace"]:
    parser.error("You must set a BUILD_WORKSPACE environment variable "
                 "or pass the --build-workspace argument via the command line "
                 "or json file.")

  pipelineConfig["grokRemote"] = pipelineParams.get("grokRemote",
                          pipelineParams.get("manifest", {}).get("grokRemote"))
  pipelineConfig["grokBranch"] = pipelineParams.get("grokBranch",
                          pipelineParams.get("manifest", {}).get("grokBranch"))
  pipelineConfig["grokSha"] = pipelineParams.get("grokSha",
                          pipelineParams.get("manifest", {}).get("grokSha"))

  pipelineConfig["nupicRemote"] = pipelineParams.get("nupicRemote",
                          pipelineParams.get("manifest", {}).get("nupicRemote"))
  pipelineConfig["nupicBranch"] = pipelineParams.get("nupicBranch",
                          pipelineParams.get("manifest", {}).get("nupicBranch"))
  pipelineConfig["nupicSha"] = pipelineParams.get("nupicSha",
                          pipelineParams.get("manifest", {}).get("nupicSha"))

  pipelineConfig["pipelineJson"] = args["pipelineJson"]

  return pipelineConfig



def main(jsonArgs):
  """
    Main function.

    :param jsonArgs: dict of pipeline-json and logLevel, defaults to empty
      dict to make the script work independently and via driver scripts.
      e.g. {"pipelineJson" : <PIPELINE_JSON_PATH>,
            "logLevel" : <LOG_LEVEL>}

    :raises NupicBuildFailed if build fails, or a Generic Exception in all
    other cases.

    :param jsonArgs: dict of  pipeline-json and logLevel
      e.g. {"pipelineJson" : <PIPELINE_JSON_PATH>,
            "logLevel" : <LOG_LEVEL>}
  """
  try:
    pipelineConfig = addAndParseArgs(jsonArgs)

    grokUser = getGithubUserName(pipelineConfig["grokRemote"])
    nupicUser = getGithubUserName(pipelineConfig["nupicRemote"])
    amiName = (grokUser + "-" + pipelineConfig["grokBranch"])
    env = prepareEnv(pipelineConfig["buildWorkspace"], None, os.environ)

    preBuildSetup(env, pipelineConfig)

    builder.buildGrok(env, pipelineConfig, g_logger)
    g_logger.debug("Grok built successfully!")

    deployTrack = getDeployTrack(pipelineConfig["grokRemote"],
                                 pipelineConfig["nupicRemote"],
                                 pipelineConfig["grokBranch"],
                                 pipelineConfig["nupicBranch"])

    pipelineConfig["pipelineParams"]["build"] = {
                              "grokSha": pipelineConfig["grokSha"],
                              "nupicSha": pipelineConfig["nupicSha"],
                              "grokHome": env["GROK_HOME"],
                              "nupicBuildDir": env["NUPIC"].rpartition("/")[0],
                              "deployTrack": deployTrack,
                              "grokDeployTrack": grokUser,
                              "nupicDeployTrack": nupicUser,
                              "amiName": amiName
                            }
    g_logger.debug(pipelineConfig["pipelineParams"])
    if pipelineConfig["pipelineJson"]:
      with open(pipelineConfig["pipelineJson"], 'w') as jsonFile:
        jsonFile.write(json.dumps(pipelineConfig["pipelineParams"],
                       ensure_ascii=False))
  except NupicBuildFailed:
    g_logger.exception("NuPIC building failed")
    raise
  except Exception:
    g_logger.exception("Unknown error occurred in build phase")
    raise



if __name__ == "__main__":
  main({})
