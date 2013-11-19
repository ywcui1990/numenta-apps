import sys
from setuptools import setup

requirements = map(str.strip, open('requirements.txt').readlines())

setup(
  name = 'Grok Command Line Interface',
  classifiers = \
    [
      'Intended Audience :: Developers',
      'License :: OSI Approved :: MIT License',
      'Programming Language :: Python',
      'Programming Language :: Python :: 2',
      'Topic :: Software Development :: Libraries',
    ],
  keywords = 'grok',
  author = 'Austin Marshall',
  author_email = 'amarshall@groksolutions.com',
  namespace_packages = ['grokcli'],
  packages = ['grokcli'],
  entry_points = \
    {
      'console_scripts': \
        [
          'grok = grokcli:main'
        ]
    },
  install_requires = requirements
)
