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

from optparse import OptionGroup, OptionParser
import re

import requests

from nta.utils.amqp.connection import ConnectionParams, PlainCredentials
from nta.utils.amqp.synchronous_amqp_client import SynchronousAmqpClient



parser = OptionParser(description=("Copy queues from one rabbitmq instance to"
                                   " another."))

destinationGroup = OptionGroup(parser, "Destination")
destinationGroup.add_option("--destination-host", metavar="HOST")
destinationGroup.add_option("--destination-user", metavar="USER")
destinationGroup.add_option("--destination-passwd", metavar="PASSWD")
parser.add_option_group(destinationGroup)

sourceGroup = OptionGroup(parser, "Source")
sourceGroup.add_option("--source-host", metavar="HOST")
sourceGroup.add_option("--source-user", metavar="USER")
sourceGroup.add_option("--source-passwd", metavar="PASSWD")
sourceGroup.add_option("--source-port", metavar="PORT", default=15672,
                       help="RabbitMQ Administration port (for http API)")
parser.add_option_group(sourceGroup)

parser.add_option("--queue-regex", metavar="PATTERN", default=".*",
                  help=("Queues with names that match this pattern will be"
                        " copied from source into destination.  If not"
                        " specified, the default pattern '.*' will be used to"
                        " copy all queues."))



def _getClient(host, user, passwd, _cache={}):
  """
  :param str host: RabbitMQ host
  :param str user: RabbitMQ user
  :param str passwd: RabbitMQ passwd
  """
  if (host, user, passwd) not in _cache:
    connParams = ConnectionParams(host=host,
                                  credentials=PlainCredentials(user, passwd))
    _cache[(host, user, passwd)] = SynchronousAmqpClient(connParams)

  return _cache[(host, user, passwd)]


def _listSourceQueues(host, user, passwd, port):
  """
  :param str host: Source rabbitmq host
  :param str user: Source rabbitmq user
  :param str passwd: Source rabbitmq passwd
  :param int port: Source rabbitmq administration port (e.g. 15672)
  :returns: Iterable of dicts from rabbitmq /api/queues http endpoint
  :rtype: Generator
  """
  resp = requests.get(url="http://{host}:{port}/api/queues".format(host=host,
                                                                   port=port),
                      auth=(user, passwd))
  return iter(resp.json())



def _replicateQueueInDestination(queue, host, user, passwd):
  """
  :param dict queue: Queue details for a single queue as returned by the
    administration /api/queues endpoint.  Requires 'name', 'durable', and
    'auto_delete' keys.
  :param str host: Destination rabbitmq host
  :param str user: Destination rabbitmq user
  :param str passwd: Destination rabbitmq passwd
  """
  destinationClient = _getClient(host=host, user=user, passwd=passwd)
  destinationClient.declareQueue(queue=queue["name"],
                                 durable=queue["durable"],
                                 autoDelete=queue["auto_delete"])
  print "{name} created.".format(**queue)


def main():

  (options, args) = parser.parse_args()

  if args:
    parser.error(("Unexpected positional arguments.  See `{} --help` for full"
                  " set of command-line arguments"
                  .format(parser.get_prog_name())))

  if not options.destination_host:
    parser.error("Required `--destination-host` host not specified.")

  if not options.source_host:
    parser.error("Required `--source-host` host not specified.")

  pattern = re.compile(options.queue_regex)

  for queue in _listSourceQueues(host=options.source_host,
                                 user=options.source_user,
                                 passwd=options.source_passwd,
                                 port=options.source_port):
    if pattern.search(queue["name"]):
      _replicateQueueInDestination(queue,
                                   host=options.destination_host,
                                   user=options.destination_user,
                                   passwd=options.destination_passwd)



if __name__ == "__main__":
  main()
