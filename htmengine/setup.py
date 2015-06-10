import os
import sys

from setuptools import setup, find_packages

from infrastructure.utilities.cli import runWithOutput



# Install NuPIC from the right place; do NuPIC version locking in 
if "linux" in sys.platform:
  runWithOutput(("pip install "
                 "https://s3-us-west-2.amazonaws.com/artifacts.numenta.org/numenta/nupic/releases/nupic-0.2.3-cp27-none-linux_x86_64.whl"),
                env=os.environ)
elif "darwin" in sys.platform:
  runWithOutput("pip install nupic==0.2.3", env=os.environ)

requirements = map(str.strip, open("requirements.txt").readlines())

setup(
  name = "htmengine",
  description = "HTM Engine",
  packages = find_packages(),
  include_package_data=True,
  install_requires = requirements
)
