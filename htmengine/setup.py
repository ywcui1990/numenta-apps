import sys

from setuptools import setup, find_packages

requirements = map(str.strip, open("requirements.txt").readlines())

depLinks = ["https://pypi.numenta.com/pypi", ] if "linux" in sys.platform else []

setup(
  name = "htmengine",
  description = "HTM Engine",
  packages = find_packages(),
  include_package_data=True,
  install_requires = requirements,
  dependency_links = depLinks
)
