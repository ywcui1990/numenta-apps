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

import json
import sys
import csv

from unicorn_backend import date_time_utils

with open("nyc.csv", "rU") as f:
  reader = csv.reader(f)
  reader.next()  # skip the header row
  for row in reader:
    dt = date_time_utils.parseDatetime(row[0], '%Y-%m-%d %H:%M:%S')

    message = [int(dt.strftime("%s")), float(row[1])]
    data = "%s\n" % (json.dumps(message))

    sys.stdout.write(data)
    sys.stdout.flush()
