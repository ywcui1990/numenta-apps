#-------------------------------------------------------------------------------
# Copyright (C) 2013-2014 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------
from setuptools import find_packages, setup



def printTerms():
  print("\nBy using the Grok CLI, you agree to terms and conditions\n"
        "outlined in the product End User License Agreement (EULA):\n"
        "https://aws.amazon.com/marketplace/agreement?asin=B00I18SNQ6\n")


def printRegisterHint():
  print("If you haven't already registered, please do so by visiting\n"
        "the URL: GROK_SERVER/grok/register, to help us serve you better.\n")



requirements = map(str.strip, open("requirements.txt").readlines())

version = {}
execfile("grokcli/__version__.py", {}, version)

setup(
  name = "grokcli",
  description = "Grok Command Line Interface",
  classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Environment :: Console",
    "Intended Audience :: Developers",
    "Intended Audience :: Information Technology",
    "License :: OSI Approved :: Apache Software License",
    "Programming Language :: Python :: 2",
    "Topic :: Utilities"],
  keywords = "grok, numenta, anomaly detection, monitoring",
  author = "Austin Marshall, Chetan Surpur",
  author_email = "amarshall@numenta.com, csurpur@numenta.com",
  packages = find_packages(),
  entry_points = {"console_scripts": ["grok = grokcli:main"]},
  install_requires = requirements,
  extras_require = {"docs": ["sphinx"]},
  version = version["__version__"]
)

printTerms()
printRegisterHint()
