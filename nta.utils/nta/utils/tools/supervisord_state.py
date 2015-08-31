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

"""Get state of supervisord"""

from argparse import ArgumentParser
import socket
import sys
import time
import types
from urlparse import urljoin
import xmlrpclib



def getSupervisordState(supervisorApiUrl):
  """Get the state of SupervisorD

  :param str supervisorApiUrl: API URL for the supervisord instance of interest;
    e.g., "http://localhost:9001"
  :returns: state name; one of: FATAL, RUNNING, RESTARTNG, or SHUTDOWN. See
    getState() in http://supervisord.org/api.html.
  :rtype: str

  :raises socket.error: on communication error
  :raises xmlrpclib.Fault: see `xmlrpclib.Fault`
  """
  server = xmlrpclib.Server(urljoin(supervisorApiUrl, "RPC2"))

  state = server.supervisor.getState()

  assert isinstance(state, types.DictType), (
    "unexpected result type %s" % type(state))

  return state["statename"]



def getStateMain():
  """Console script entry point: obtains and prints supervisord state to STDOUT;
  prints error message to STDERR.
  """

  parser = ArgumentParser(
    description=("Get state of supervisord instance. It will be one of: "
                 "FATAL, RUNNING, RESTARTNG, or SHUTDOWN. See getState() in "
                 "http://supervisord.org/api.html\n\n"))

  parser.add_argument(
    "supervisorApiUrl",
    help="URL of supervisord API; e.g., http://localhost:9001")

  args = parser.parse_args()

  try:
    state = getSupervisordState(args.supervisorApiUrl)
  except (socket.error, xmlrpclib.Fault) as ex:
    sys.exit("Failed to get supervisord state: %r" % (ex,))

  print state,



def waitForRunningStateMain():
  """Console script entry point: waits for supervisord to enter RUNNING state;
  sets non-zero exit code on timeout or other non-recoverable error; prints
  status and error messages to STDERR.
  """

  parser = ArgumentParser(
    description=("Wait for supervisord to enter RUNNING state."))

  parser.add_argument(
    "supervisorApiUrl",
    help="URL of supervisord API; e.g., http://localhost:9001")

  args = parser.parse_args()

  maxWaitCycles = 6
  for i in xrange(1, maxWaitCycles + 2):
    try:
      state = getSupervisordState(args.supervisorApiUrl)
    except (socket.error, xmlrpclib.Fault) as ex:
      print >> sys.stderr, "Failed to get supervisord state from %s: %r" % (
        args.supervisorApiUrl, ex)
      state = None

    if state == "RUNNING":
      break

    if i <= maxWaitCycles:
      print >> sys.stderr, "Waiting for supervisord to enter RUNNING state..."
      time.sleep(5)
  else:
    sys.exit("Timed out waiting for supervisord RUNNING state from %s" % (
      args.supervisorApiUrl,))
