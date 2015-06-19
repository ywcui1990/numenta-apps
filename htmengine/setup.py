import platform
import sys

from setuptools import setup, find_packages

requirements = map(str.strip, open("requirements.txt").readlines())

depLinks = []
if "linux" in sys.platform and platform.linux_distribution()[0] == "CentOS":
  depLinks = [ "https://pypi.numenta.com/pypi#egg=nupic==0.2.3", ]

setup(
  name = "htmengine",
  description = "HTM Engine",
  packages = find_packages(),
  include_package_data=True,
  install_requires = requirements,
  dependency_links = depLinks,
)
