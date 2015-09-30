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

BASE_DIR = "/opt/numenta/products/numenta-apps/unicorn"



def generate_zip_includes(base_path, directory_name):
  skip_count = len(base_path.split("/"))
  zip_includes = [(base_path, directory_name)]
  for root, sub_folders, files in os.walk(base_path):
    for file_in_root in files:
      zip_includes.append(
        ("{}".format(os.path.join(root, file_in_root)),
         "{}".format(
           os.path.join(directory_name, "/".join(root.split("/")[skip_count:]),
                        file_in_root))
         )
      )
  return zip_includes



zipIncludes = generate_zip_includes("%s/backend/unicorn_backend/nupic/nupic" 
                                    % BASE_DIR, "nupic")

includeFiles = [(pyproj.pyproj_datadir, os.path.join("pyproj", "data"))]

executables = [cx_Freeze.Executable("model_runner.py", targetName="mr")]

freezer = cx_Freeze.Freezer(executables,
                            namespacePackages=["nupic",
                                               "prettytable"],
                            zipIncludes=zipIncludes,
                            includeFiles=includeFiles,
                            silent=True)

freezer.Freeze()
