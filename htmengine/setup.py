from setuptools import setup, find_packages

requirements = map(str.strip, open("requirements.txt").readlines())

setup(
  name = "htmengine",
  description = "HTM Engine",
  packages = find_packages(),
  include_package_data=True,
  install_requires = requirements
)
