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
# Formula: grok-plumbing.loghandling
#
# Install support for Grok logging, both to S3 and locally on the instance

# Install logwriter credentials so we can upload logs to S3
logwriter_credentials.json:
  file.managed:
    - name: /etc/grok/logwriter_credentials.json
    - source: salt://grok-plumbing/files/loghandling/logwriter_credentials.json
    - user: root
    - group: root
    - mode: 0644
    - require:
      - file: etc-grok

# Rotate grok's logfiles, and upload to S3 if user has enabled it.
shuffle-groklogs:
  file.managed:
    - name: /usr/local/sbin/shuffle_groklogs
    - source: salt://grok-plumbing/files/loghandling/shuffle_groklogs
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: logwriter_credentials.json
  cron.present:
    - name: /usr/local/sbin/lockrun --lockfile=/var/lock/shuffle_groklogs -- /usr/local/sbin/shuffle_groklogs 2>&1 | logger -t gs-shuffle-groklogs
    - identifier: shuffle_groklogs
    - user: root
    - hour: '*'
    - minute: '7'
    - require:
      - file: logwriter_credentials.json
      - file: shuffle-groklogs

# Enforce absence of old logrotate conf file now that we're rotating our logs
# ourselves.
scrub-stale-logrotate-file:
  file.absent:
    - name: /etc/logrotate.d/grok-logs
