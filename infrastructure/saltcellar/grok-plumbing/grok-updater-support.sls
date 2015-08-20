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
# Formula: grok
#
# Installs grok-updater tooling

# Set up the support directories for the Grok updater
updater-directory:
  file.directory:
    - name: /opt/numenta/products/grok/bin/updaters
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: grok-bin-directory

updater-status-directory:
  file.directory:
    - name: /etc/grok/updater_statuses
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: etc-grok

{% for dirpath in ['/opt/numenta/updater',
                   '/opt/numenta/updater/installed_versions',
                   '/opt/numenta/updater/logs',
                   '/opt/numenta/updater/python',
                   '/opt/numenta/updater/repo_d',
                   '/opt/numenta/updater/updater_manifests'] %}
{{ dirpath }}:
  file.directory:
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: /opt/numenta
{% endfor %}

# Install the grok updater and its dependencies
grok-updater-packages:
  pkg:
    - latest
    - pkgs:
      - createrepo
      - s3cmd

# TODO: TAUR-758 Re-enable installing grok-updater once we have a version that is 1.7-savvy
#      - grok-updater

# Install and enable the grokupdates init script
grokupdates:
  file.managed:
    - name: /etc/init.d/grokupdates
    - source: salt://grok-plumbing/files/updater/grokupdates.initd
    - user: root
    - group: root
    - mode: 0755
    - require:
      - file: ec2user-s3cmd-configuration
      - file: root-s3cmd-configuration
      - pkg: grok-updater-packages
  service.enabled:
    - enable: True
    - require:
      - file: grokupdates
      - file: ec2user-s3cmd-configuration
      - file: root-s3cmd-configuration
      - pkg: grok-updater-packages

# If you don't create a repo in the local directory you're going to tell
# yum is a repo, _before_ you add the repo definition, yum will have a
# conniption and you will be sad.

create-local-cache-repo:
  cmd.run:
    - name: createrepo /opt/numenta/updater/repo_d
    - creates: /opt/numenta/updater/repo_d/repodata/repomd.xml
    - require:
      - file: /opt/numenta/updater/repo_d
      - pkg: grok-updater-packages

updater-local-yum-repo:
  file.managed:
    - name: /etc/yum.repos.d/updater-local.repo
    - source: salt://grok-plumbing/files/updater/updater-local.repo
    - user: root
    - group: root
    - mode: 0644
    - require:
      - cmd: create-local-cache-repo

# Check for Grok updates
check-for-gs-updates-cronjob:
  cron.present:
    - name: lockrun --lockfile=/var/lock/gs-check-for-updates.lock -- /usr/local/sbin/gs-check-for-updates > /dev/null 2>&1
    - identifier: check-for-gs-updates-cronjob
    - user: root
    - hour: '*'
    - minute: '13'
    - require:
      - file: /usr/local/sbin/lockrun
      - pkg: grok-updater-packages

# Check every minute to see if the user has enabled an update run
check-for-grok-update-trigger:
  cron.present:
    - name: lockrun --lockfile=/var/lock/gs-check-update-trigger.lock -- /usr/local/sbin/gs-check-update-trigger > /dev/null 2>&1
    - identifier: check-for-grok-update-trigger
    - user: root
    - hour: '*'
    - minute: '*'
    - require:
      - file: /usr/local/sbin/lockrun
      - pkg: grok-updater-packages

# Make sure we update the updater every night. We want the users running the
# most current grok-updater when they do an update.
check-for-grok-updater-updates:
  cron.present:
    - name: lockrun --lockfile=/var/lock/grok-updater-cronjob.lock -- yum install -y grok-updater 2>&1 | logger -t grok-updater
    - identifier: check-for-grok-updater-updates
    - user: root
    - hour: '23'
    - minute: '45'
    - require:
      - file: /usr/local/sbin/lockrun
      - pkg: grok-updater-packages
