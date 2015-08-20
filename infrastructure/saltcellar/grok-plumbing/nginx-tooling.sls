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
# Formula: grok-plumbing.nginx-tooling

# Install our customized nginx tooling for running Grok. We can't use
# the standard nginx init script.

pregrok-html:
  file.managed:
    - name: /usr/share/nginx/html/pregrok.html
    - source: salt://grok-plumbing/files/nginx/pregrok.html
    - user: root
    - group: root
    - mode: 0644
    - require:
      - pkg: nginx

# Put in our grok-preload init script
grok-preload-init-script:
  file.managed:
    - name: /etc/init.d/grok-preload
    - source: salt://grok-plumbing/files/nginx/grok-preload.initd
    - user: root
    - group: root
    - mode: 0755
    - require:
      - pkg: nginx
      - file: pregrok-html

# Make sure our grokservices init script is set to run at boot
grok-preload-service:
  service.enabled:
    - name: grok-preload
    - require:
      - file: grok-preload-init-script

# Install nginx, but disable the service since we're going to use our own
# init script
nginx:
  pkg.installed:
    - version: 1.4.4-1.el6.ngx
  service.disabled:
    - require:
      - pkg: nginx

# Put in our nginx init script
nginx-init-script:
  file.managed:
    - name: /etc/init.d/nginx
    - source: salt://grok-plumbing/files/nginx/nginx.initd
    - user: root
    - group: root
    - mode: 0755
    - require:
      - pkg: nginx
