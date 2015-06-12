import os
from functools import wraps
from pkg_resources import get_distribution
from htmengine.exceptions import ApplicationNotConfiguredError

distribution = get_distribution(__name__)

__version__ = distribution.version # See setup.py for constant

HTMENGINE_HOME = distribution.location

def raiseExceptionOnMissingRequiredApplicationConfigPath(fn):
  @wraps(fn)
  def wrapper(*args, **kwargs):
    if "APPLICATION_CONFIG_PATH" not in os.environ:
      raise ApplicationNotConfiguredError("Required `APPLICATION_CONFIG_PATH` "
                                          "not set in environment.  See %s for"
                                          " details" % os.path.join(
                                            HTMENGINE_HOME, "README.md"))

    return fn(*args, **kwargs)

  return wrapper
