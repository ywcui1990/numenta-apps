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

import cx_Freeze
import pyproj
import os

import htmengine



zipIncludes = []

includeFiles = [(pyproj.pyproj_datadir, os.path.join("pyproj", "data")),
                ("/".join(htmengine.__file__.split("/")[:-1]) +
                 "/algorithms/modelSelection/anomaly_params_random_encoder"
                 "/paramOrder.csv",
                 "htmengine/algorithms/modelSelection"
                 "/anomaly_params_random_encoder/paramOrder.csv")]

executables = [cx_Freeze.Executable("model_runner.py", targetName="mr")]

freezer = cx_Freeze.Freezer(executables,
                            namespacePackages=["nupic", "htmengine",
                                               "prettytable"],
                            zipIncludes=zipIncludes,
                            includeFiles=includeFiles)

freezer.Freeze()
