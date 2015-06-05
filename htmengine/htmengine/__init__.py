import os
from pkg_resources import get_distribution

distribution = get_distribution(__name__)

__version__ = distribution.version # See setup.py for constant

HTMENGINE_HOME = distribution.location
