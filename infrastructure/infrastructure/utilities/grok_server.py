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

from time import sleep

from fabric.api import run, settings
from grokcli.api import GrokSession

from infrastructure.utilities.exceptions import (
  GrokConfigError,
  InstanceLaunchError,
  InstanceNotReadyError)

GROK_AWS_CREDENTIALS_SETUP_TRIES = 30
MAX_RETRIES_FOR_INSTANCE_READY = 18
SLEEP_DELAY = 10



def checkGrokServicesStatus(logger):
  """
    Checks to see if all Grok Services are running. Returns True if all Services
    are running and False if any are not running.  This should be wrapped in
    retry logic with error handling.

    :param logger: Initialized logger

    :raises: infrastructure.utilities.exceptions.InstanceLaunchError
      If a Grok service fails to startup.

    :returns: True if GrokServices are running properly.
    :rtype: boolean
  """
  cmd = "supervisorctl -c /opt/numenta/grok/conf/supervisord.conf status"
  grokServicesState = run(cmd, quiet=True)

  for service in grokServicesState.split("\r\n"):
    if set(["FATAL", "EXITED"]) & set(service.split(" ")):
      raise InstanceLaunchError("Some Grok services failed to start:\r\n%s" %
                                grokServicesState.stdout)
    elif set(["STOPPED", "STARTING", "UNKNOWN"]) & set(service.split(" ")):
      logger.debug("Some Grok services are not yet ready: \r\n %s" %
                   grokServicesState.stdout)
      break
  else:
    return True
  return False


def checkNginxStatus(logger):
  """
    Checks to see if Nginx is running for Grok. Returns True if it is and False
    otherwise. This should be wrapped in retry logic with error handling.

    :param logger: Initialized logger

    :raises: infrastructure.utilities.exceptions.InstanceLaunchError
      If Nginx starts up using the error configuration.

    :returns: True if Nginx is running using the correct conf file for Grok.
    :rtype: boolean
  """
  output = run("ps aux | grep -e nginx -e grok-api.conf | grep -v grep")

  # If nginx launches with our error config, raise an exception
  if "grok-error.conf" in output.stdout:
    raise InstanceLaunchError("Nginx launched in Error state: \r\n %s" %
                              output.stdout)
  # Else if we're still stopped or currently loading Grok, just log a debug msg
  elif ("grok-loading.conf" in output.stdout or
        "grok-stopped.conf" in output.stdout):
    logger.debug("Nginx has not yet finished loading: \r\n %s" % output.stdout)


  return "grok-api.conf" in output.stdout


def waitForGrokServerToBeReady(publicDnsName, serverKey, user, logger):
  """
    Wait for a pre-determined amount of time for the Grok server to be ready.

    :param publicDnsName: Reachable DNS entry of a Grok server

    :param serverKey: SSH Key to use to connect to the instance

    :param user: Username to use when connecting via SSH (e.g.: ec2-user)

    :param logger: Initialized logger

    :raises:
      infrastructure.utilities.exceptions.InstanceNotReadyError
      If either Grok or Nginx fails to come up properly in the prescribed time.

    :raises infrastructure.utilities.exceptions.InstanceLaunchError:
      If a Grok service fails to startup.
  """
  nginx = grokServices = False
  with settings(host_string = publicDnsName,
                key_filename = serverKey, user = user,
                connection_attempts = 30, warn_only = True):
    for _ in xrange(MAX_RETRIES_FOR_INSTANCE_READY):
      logger.info("Checking to see if nginx and Grok Services are running")
      try:
        nginx = checkNginxStatus(logger)
        grokServices = checkGrokServicesStatus(logger)
      except EOFError:
        # If SSH hasn't started completely on the remote system, we may get an
        # EOFError trying to provide a password for the user. Instead, just log
        # a warning and continue to retry
        logger.warning("SSH hasn't started completely on the remote machine")
      if nginx and grokServices:
        break
      sleep(SLEEP_DELAY)
    else:
      raise InstanceNotReadyError("Grok services not ready on server %s after "
                                  "%d seconds." % (publicDnsName,
                                                MAX_RETRIES_FOR_INSTANCE_READY *
                                                SLEEP_DELAY))


def setupGrokAWSCredentials(publicDnsName, config):
  """
    Using the Grok CLI, connect to Grok to obtain the API Key for the instance.

    :param publicDnsName: A reachable DNS entry for the Grok server that needs
      to be configured

    :param config: A dict containing values for `AWS_ACCESS_KEY_ID`
      and `AWS_SECRET_ACCESS_KEY`

    :raises: infrastructure.utilities.exceptions.GrokConfigError if
      it is unable to obtain the API Key

    :returns: The API Key of the Grok server
  """
  credentials = {
    "aws_access_key_id": config["AWS_ACCESS_KEY_ID"],
    "aws_secret_access_key": config["AWS_SECRET_ACCESS_KEY"]
  }
  server = "https://%s" % publicDnsName
  grok = GrokSession(server=server)
  grok.apikey = grok.verifyCredentials(**credentials)
  if grok.apikey:
    grok.updateSettings(settings=credentials, section="aws")
    return grok.apikey
  else:
    raise GrokConfigError("Unable to obtain Grok API Key")


def getApiKey(instanceId, publicDnsName, config, logger):
  """
    When the API Key is unknown, get the API Key from the server. This should be
    used for newly instantiated Grok servers.

    :param instanceId: The EC2 instance ID of the new server

    :param publicDnsName: The reachable DNS entry for the instance under test

    :param logger: An initialized logger.

    :raises infrastructure.utilities.exceptions.GrokConfigError: If
      the API Key doesn't get set properly on a new instance.

    :returns: A string value representing the API Key of the new instance.
  """
  for _ in xrange(GROK_AWS_CREDENTIALS_SETUP_TRIES):
    logger.debug("Trying to setup Grok AWS Credentials.")
    try:
      grokApiKey = setupGrokAWSCredentials(publicDnsName, config)
    except GrokConfigError:
      # We want to retry this, so just keep going on a config error
      pass
    if grokApiKey:
      logger.info("GROK API Key: %s" % grokApiKey)
      break
    sleep(SLEEP_DELAY)
  else:
    raise GrokConfigError("Failed to get API Key for instance %s" %
                          instanceId)
  return grokApiKey
