#!/bin/bash
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
#
# This script configures a pair of taurus server and metric collector
# instances in which the taurus services are not already running.  For example,
# use this to kick off taurus on a fresh instance started with internal numenta
# tooling.

set -o errexit
set -o pipefail
set -o nounset
set -o verbose

SCRIPT=`which $0`
REPOPATH=`dirname "${SCRIPT}"`/../../..

pushd "${REPOPATH}"

  # Sync git histories with taurus server
  git push --force "${TAURUS_SERVER_USER}"@"${TAURUS_SERVER_HOST}":/opt/numenta/products `git rev-parse --abbrev-ref HEAD`

  # Reset server state
  ssh -v -t "${TAURUS_SERVER_USER}"@"${TAURUS_SERVER_HOST}" \
    "cd /opt/numenta/products &&
     git reset --hard ${COMMIT_SHA}"

  # /opt/numenta/products/taurus/conf/ssl must exist before we attempt to
  # upload our self-signed cert required for nginx later
  ssh -v -t "${TAURUS_SERVER_USER}"@"${TAURUS_SERVER_HOST}" mkdir -p /opt/numenta/products/taurus/conf/ssl

  # Copy manual overrides, including ssl self-signed cert
  scp -r taurus/pipeline/scripts/overrides/taurus/conf/* "${TAURUS_SERVER_USER}"@"${TAURUS_SERVER_HOST}":/opt/numenta/products/taurus/conf/

  # Configure, start Taurus services
  ssh -v -t "${TAURUS_SERVER_USER}"@"${TAURUS_SERVER_HOST}" \
    "cd /opt/numenta/products &&
     ./install-taurus.sh /opt/numenta/anaconda/lib/python2.7/site-packages /opt/numenta/anaconda/bin &&
     taurus-set-rabbitmq --host=${RABBITMQ_HOST} --user=${RABBITMQ_USER} --password=${RABBITMQ_PASSWD} &&
     taurus-set-sql-login --host=${MYSQL_HOST} --user=${MYSQL_USER} --password=${MYSQL_PASSWD} &&
     taurus-create-db --host=${MYSQL_HOST} --user=${MYSQL_USER} --password=${MYSQL_PASSWD} --suppress-prompt-and-continue-with-deletion &&
     taurus-set-dynamodb --host= --port= --table-suffix=.\`curl http://169.254.169.254/latest/meta-data/instance-id\` &&
     cd /opt/numenta/products/taurus/taurus/engine/repository &&
     python migrate.py &&
     cd /opt/numenta/products/taurus &&
     sudo /usr/sbin/nginx -p . -c conf/nginx-taurus.conf &&
     mkdir -p logs &&
     supervisord -c conf/supervisord.conf"

  # Sync git histories with collector
  git push --force "${TAURUS_COLLECTOR_USER}"@"${TAURUS_COLLECTOR_HOST}":/opt/numenta/products `git rev-parse --abbrev-ref HEAD`

  # Reset metric collector state, apply database schema updates
  ssh -v -t "${TAURUS_COLLECTOR_USER}"@"${TAURUS_COLLECTOR_HOST}" \
    "cd /opt/numenta/products &&
     git reset --hard ${COMMIT_SHA} &&
     ./install-taurus-metric-collectors.sh /opt/numenta/anaconda/lib/python2.7/site-packages /opt/numenta/anaconda/bin &&
     taurus-set-collectorsdb-login --host=${MYSQL_HOST} --user=${MYSQL_USER} --password=${MYSQL_PASSWD} &&
     taurus-collectors-set-rabbitmq --host=${RABBITMQ_HOST} --user=${RABBITMQ_USER} --password=${RABBITMQ_PASSWD} &&
     taurus-reset-collectorsdb --suppress-prompt-and-obliterate-database &&
     cd /opt/numenta/products/taurus.metric_collectors/taurus/metric_collectors/collectorsdb &&
     python migrate.py &&
     taurus-collectors-set-opmode active &&
     cd /opt/numenta/products/taurus.metric_collectors &&
     supervisord -c conf/supervisord.conf"

popd
