import os
from functools import wraps
from htmengine.exceptions import ApplicationNotConfiguredError

def raiseExceptionOnMissingRequiredApplicationConfigPath(fn):
  """ Decorator to explicitly raise an ApplicationNotConfiguredError exception
  in the event that the required APPLICATION_CONFIG_PATH environment variable
  is not set.
  :param fn: Function
  :returns: Wrapped function
  """
  @wraps(fn)
  def wrapper(*args, **kwargs):
    if "APPLICATION_CONFIG_PATH" not in os.environ:
      raise ApplicationNotConfiguredError("Required `APPLICATION_CONFIG_PATH` "
                                          "not set in environment.")

    return fn(*args, **kwargs)

  return wrapper
