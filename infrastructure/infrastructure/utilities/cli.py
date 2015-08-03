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
import time

from subprocess import CalledProcessError, check_call, check_output

from infrastructure.utilities import logger as log
from infrastructure.utilities.exceptions import CommandFailedError



def executeCommand(command, env=os.environ, logger=None):
  """
  Execute a command and return the raw output

  @param command: String or list containing the exact command to execute.

  @param env: The environment required to execute the command which is passed.
              By default use os.environ

  @param logger: logger for additional debug info if desired

  @raises
    infrastructure.utilities.exceptions.CommandFailedError if
    the command fails

  @returns: A str representing the raw output of the command

  @rtype: string
  """
  try:
    if logger:
      log.printEnv(env, logger)
      logger.debug(command)
    if isinstance(command, basestring):
      command = command.strip().split(" ")
    return check_output(command, env=env).strip()
  except CalledProcessError:
    raise CommandFailedError("Failed to execute command: %s", command)



def runWithRetries(command, retries=1, delay=1, logger=None):
  """
  Run a command up to retries times until it succeeds.

  @param command: Command line to run

  @param retries: maximum number of retries

  @param delay: delay in seconds between retries

  @raises infrastructure.utilities.exceptions.CommandFailedError
  if the command doesn't succeed after trying retries times
  """
  attempts = 0
  while attempts < retries:
    attempts = attempts + 1
    try:
      runWithOutput(command)
      return
    except CommandFailedError:
      if logger:
        logger.debug("Attempt %s to '%s' failed, retrying in %s seconds...",
                     attempts, command, delay)
      time.sleep(delay)
  raise CommandFailedError("%s failed after %s attempts" % (command, retries))



def runWithOutput(command, env=os.environ, logger=None):
  """
  Run a command, printing as the command executes.

  @param command: Command to run. Can be str or list

  @param env: environment variables to use while running command

  @param logger: optional logger for additional debug info if desired
  """
  try:
    if logger:
      log.printEnv(env, logger)
      logger.debug(command)
    if isinstance(command, basestring):
      command = command.strip().split(" ")
    check_call(command, env=env)
  except CalledProcessError:
    raise CommandFailedError("Failed to execute command: %s" % command)
  # Catch other exceptions like empty environment variable
  except Exception as ex:
    template = "An exception of type {0} occured.\nArguments:{1!r}"
    logger.debug(template.format(type(ex).__name__, ex.args))
