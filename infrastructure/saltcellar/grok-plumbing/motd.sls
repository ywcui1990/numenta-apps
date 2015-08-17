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
# Formula: grok-plumbing.motd

# Installs Grok's motd fragment scripts so /etc/motd shows grok version,
# rpms, and whether updates are available for Grok.

/etc/update-motd.d/10-show-grok-version:
  file.managed:
    - source: salt://grok-plumbing/files/motd/show-grok-version
    - user: root
    - group: root
    - mode: 0755

/etc/update-motd.d/40-show-grok-rpms:
  file.managed:
    - source: salt://grok-plumbing/files/motd/show-grok-rpms
    - user: root
    - group: root
    - mode: 0755

/etc/update-motd.d/50-show-available-updates:
  file.managed:
    - source: salt://grok-plumbing/files/motd/show-available-updates
    - user: root
    - group: root
    - mode: 0755

# Set up convenience scripts

show-grok-info:
  file.symlink:
    - target: /etc/update-motd.d/40-show-grok-rpms
    - name: /usr/local/sbin/show-grok-info
    - require:
      - file: /etc/update-motd.d/40-show-grok-rpms

show-grok-version:
  file.symlink:
    - target: /etc/update-motd.d/10-show-grok-version
    - name: /usr/local/sbin/show-grok-version
    - require:
      - file: /etc/update-motd.d/10-show-grok-version

