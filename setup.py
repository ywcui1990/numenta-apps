#-------------------------------------------------------------------------------
# Copyright (C) 2013 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------
from setuptools import find_packages, setup



requirements = map(str.strip, open("requirements.txt").readlines())

version = {}
execfile("grokcli/__version__.py", {}, version)

setup(
  name = "grokcli",
  description = "Grok Command Line Interface",
  classifiers = [
    "Intended Audience :: Developers",
    "Programming Language :: Python",
    "Programming Language :: Python :: 2",
    "Topic :: Software Development :: Libraries"],
  keywords = "grok",
  author = "Austin Marshall",
  author_email = "amarshall@groksolutions.com",
  packages = find_packages(),
  entry_points = {"console_scripts": ["grok = grokcli:main"]},
  install_requires = requirements,
  extras_require = {"docs": ["sphinx"]},
  version = version["__version__"]
)
