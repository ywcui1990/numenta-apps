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
from optparse import OptionParser
import os
import traceback
import types
from urlparse import urljoin
import xmlrpclib

from nta.utils import error_reporting
from nta.utils.config import Config



class SupervisorMonitorError(Exception):
  pass



class SupervisorNotRunning(SupervisorMonitorError):
  pass



class SupervisorProcessInFatalState(SupervisorMonitorError):
  pass



class SupervisorChecker(object):
  parser = OptionParser()

  parser.add_option("--monitorConfPath",
                    help=("Specify full path to ConfigParser-compatible"
                          " monitor conf file, containing a [S1] section and"
                          " the following configuration directives:\n\n"
                          "MODELS_MONITOR_EMAIL_SENDER_ADDRESS\n"
                          "MODELS_MONITOR_EMAIL_RECIPIENTS\n"
                          "MODELS_MONITOR_EMAIL_AWS_REGION\n"
                          "MODELS_MONITOR_EMAIL_SES_ENDPOINT"))
  parser.add_option("--serverUrl",
                    help="Supervisor API (e.g. http://127.0.0.1:9001)")

  _checks = []


  def __init__(self):
    (options, args) = self.parser.parse_args()

    if args:
      self.parser.error("Unexpected positional arguments: {}"
                        .format(repr(args)))

    self.server = xmlrpclib.Server(urljoin(options.serverUrl, "RPC2"))

    confDir = os.path.dirname(options.monitorConfPath)
    confFileName = os.path.basename(options.monitorConfPath)
    config = Config(confFileName, confDir)

    self.emailParams = (
      dict(senderAddress=(
            config.get("S1", "MODELS_MONITOR_EMAIL_SENDER_ADDRESS")),
           recipients=config.get("S1", "MODELS_MONITOR_EMAIL_RECIPIENTS"),
           awsRegion= config.get("S1", "MODELS_MONITOR_EMAIL_AWS_REGION"),
           sesEndpoint=config.get("S1", "MODELS_MONITOR_EMAIL_SES_ENDPOINT"),
           awsAccessKeyId=None,
           awsSecretAccessKey=None))


  def checkAll(self):
    """ Run all previously-registered checks and send an email upon failure
    """
    for check in self._checks:
      try:
        check(self.server)
      except Exception as err:
        error_reporting.sendMonitorErrorEmail(
          monitorName=__name__ + ":" + check.__name__,
          resourceName=repr(self.server),
          message=traceback.format_exc(),
          params=self.emailParams)


  @classmethod
  def registerCheck(cls, fn):
    """ Function decorator to register an externally defined function as a
    check.  Function must accept a ServerProxy instance as its first
    argument.
    """
    cls._checks.append(fn)



@SupervisorChecker.registerCheck
def checkSupervisordState(server):
  """ Check that supervisord is running
  """
  state = server.supervisor.getState()
  if not isinstance(state, types.DictType):
    raise SupervisorMonitorError("Unexpected response from"
                                 " `server.supervisor.getState()`: {}"
                                 .format(repr(state)))

  if state.get("statename") != "RUNNING":
    raise SupervisorNotRunning("Supervisor does not appear to be running:"
                               "{}".format(repr(state)))


@SupervisorChecker.registerCheck
def checkSupervisorProcesses(server):
  """ Check that there are no processes in a 'FATAL' state.
  """
  processes = server.supervisor.getAllProcessInfo()

  if not isinstance(processes, types.ListType):
    raise SupervisorMonitorError("Unexpected response from"
                                 " `server.supervisor.getAllProcessInfo()`: {}"
                                 .format(repr(processes)))

  for process in processes:
    if process.get("statename") == "FATAL":
      logTail = server.supervisor.tailProcessLog(
        process["group"] + ":" + process["name"], -2048, 2048)

      errMessage = ("{group}:{name} is in a FATAL state: {description}"
                    .format(group=process.get("group"),
                            name=process.get("name"),
                            description=process.get("description"))) + (
                    "\n\nLast 2048 bytes of log:" +
                    "\n\n=======================\n\n" +
                    logTail[0] +
                    "\n\n=======================\n")

      raise SupervisorProcessInFatalState(errMessage)

