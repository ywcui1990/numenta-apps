#!/bin/sh
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

if [ -e /usr/local/bin/uwsgi ]
then
  UWSGI=/usr/local/bin/uwsgi
elif [ -e /usr/bin/uwsgi ]
then
  UWSGI=/usr/bin/uwsgi
elif [ -e /System/Library/Frameworks/Python.framework/Versions/Current/bin/uwsgi ]
then
 UWSGI=/System/Library/Frameworks/Python.framework/Versions/Current/bin/uwsgi
elif [ -e ~/nta/webstack/bin/uwsgi ]
then
 UWSGI=~/nta/webstack/bin/uwsgi
else
  echo "Cannot find uWSGI"
fi

GROK_API_SERVER_HOME="$( cd "$( dirname $0 )" && pwd )"
GROK_API_SERVER_PIDFILE=$GROK_API_SERVER_HOME/grok_api_server.pid
GROK_API_SERVER_LOG=$GROK_API_SERVER_HOME/logs/grok_api_server.log
UWSGI_SOCKET=0.0.0.0:19002
UWSGI_PROCESSES=1
UWSGI_MODULE=grok.webservices.webapp
UWSGI_IDLE=300
mkdir -p $GROK_API_SERVER_HOME/logs

echo "Starting uWSGI..."

`$UWSGI \
  -s $UWSGI_SOCKET \
  -d $GROK_API_SERVER_LOG \
  -M \
  --pidfile $GROK_API_SERVER_PIDFILE \
  --vacuum \
  --idle $UWSGI_IDLE \
  -p $UWSGI_PROCESSES \
  --chdir $GROK_API_SERVER_HOME \
  --module $UWSGI_MODULE` && echo "uWSGI started: $UWSGI_PROCESSES workers on $UWSGI_SOCKET"

