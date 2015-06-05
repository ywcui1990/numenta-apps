Infrastructure
==============

The `infrastructure` directory contains all the infrastructure
related scripts which are used by other products in this repository.

Installation
------------

To package infrastructure directory:

    python setup.py sdist

To install infrastructure:
 
    python setup.py install


`ami-tools`
-----------
This directory contains scripts for creating AMIs.


`saltcellar`
------------
This directory contains salt formulas for installing packages
required for GROK, modifying dot files, user management and
installation of development tools as per requirements.
