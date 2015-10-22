from setuptools import setup, find_packages
from setuptools.command.test import test as TestCommand
import os
import sys



installRequires = []
dependencyLinks = []



with open("requirements.txt", "r") as reqfile:
  for line in reqfile:
    line = line.strip()
    (link, _, package) = line.rpartition("#egg=")
    if link:
      # e.g., "-e https://github.com/vitaly-krugl/haigha/tarball/master#egg=haigha-0.7.4rc100"
      if line.startswith("-e"):
        line = line[2:].strip()

      dependencyLinks.append(line)

      (packageName, _, packageVersion) = package.partition("-")

      package = packageName + "==" + packageVersion

    installRequires.append(package)




class PyTest(TestCommand):
  testsLocation = os.path.abspath(os.path.join(os.path.basename(__file__),
                                               "..", "..", "tests", "py"))
  userOptions = [("pytest-args=", "a", "Arguments to pass to py.test")]


  def initialize_options(self):
    TestCommand.initialize_options(self)
    self.pytestArgs = [self.testsLocation] # pylint: disable=W0201


  def finalize_options(self):
    TestCommand.finalize_options(self)
    self.test_args = []
    self.test_suite = True


  def run_tests(self):
    #import here, cause outside the eggs aren't loaded
    import pytest
    errno = pytest.main(self.pytestArgs)
    sys.exit(errno)



setup(
  name = "unicorn_backend",
  description = "Unicorn backend",
  packages = find_packages(),
  include_package_data=True,
  install_requires = installRequires,
  dependency_links = dependencyLinks,
  tests_require=["mock==1.0.1", "nta.utils>=0.0.0"],
  cmdclass = {"test": PyTest},
)
