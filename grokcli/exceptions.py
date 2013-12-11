class GrokCLIError(Exception):
  pass


class InvalidGrokHostError(GrokCLIError):
  pass


class InvalidCredentialsError(GrokCLIError):
  pass
