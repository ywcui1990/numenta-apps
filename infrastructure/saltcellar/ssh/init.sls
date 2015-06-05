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
# Module: ssh

# Ensure SSHD has our configuration requirements in place.

# Restart SSH if the configuration changes
sshd:
  service:
    - running
    - enable: True
    - watch:
      - file: reset-password-in-sshd-config
      - file: add-password-disable-if-missing

# Reconfigure SSH to only allow access using key-based authentication

# If password auth has been enabled, turn it off.
reset-password-in-sshd-config:
  file.sed:
    - name: /etc/ssh/sshd_config
    - before: "PasswordAuthentication yes"
    - after: "PasswordAuthentication no"

# Explicitly disable password authentication if the command is missing.
add-password-disable-if-missing:
  file.append:
    - name: /etc/ssh/sshd_config
    - require:
      - file: reset-password-in-sshd-config
    - text:
      - "PasswordAuthentication no"
