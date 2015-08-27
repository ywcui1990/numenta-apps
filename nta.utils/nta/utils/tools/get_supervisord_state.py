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

"""Get state of supervisord"""

from argparse import ArgumentParser
import socket
import sys
import types
from urlparse import urljoin
import xmlrpclib



def main():
  """NOTE: May be called as a setuptools console script"""

  parser = ArgumentParser(
    description=("Get state of supervisord instance. It will be one of: "
                 "FATAL, RUNNING, RESTARTNG, or SHUTDOWN. See getState() in "
                 "http://supervisord.org/api.html\n\n"))

  parser.add_argument(
    "supervisorApiUrl",
    help="URL of supervisord API; e.g., http://localhost:9001")

  args = parser.parse_args()

  server = xmlrpclib.Server(urljoin(args.supervisorApiUrl, "RPC2"))

  try:
    state = server.supervisor.getState()
  except (socket.error, xmlrpclib.Fault) as ex:
    sys.exit("Failed to get supervisord state: %r" % (ex))

  assert isinstance(state, types.DictType), (
    "unexpected result type %s" % type(state))

  print state["statename"],


if __name__ == "__main__":
  main()
