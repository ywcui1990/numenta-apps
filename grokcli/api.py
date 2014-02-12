#-------------------------------------------------------------------------------
# Copyright (C) 2013-2014 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------
import json
from requests.sessions import Session
from requests.models import Request, Response
from requests.exceptions import (
  ConnectionError,
  InvalidURL,
  MissingSchema)
import socket
from grokcli.exceptions import (
  GrokCLIError,
  InvalidGrokHostError,
  InvalidCredentialsError)



class GrokSession(Session):
  server = "https://localhost"


  @property
  def apikey(self):
    if self.auth:
      return self.auth[0]


  @apikey.setter
  def apikey(self, value):
    self.auth = (value, None)


  def __init__(self, server=None, apikey=None, *args, **kwargs):
    super(GrokSession, self).__init__(*args, **kwargs)

    if server is not None:
      self.server = server

    if apikey is not None:
      self.apikey = apikey

    self.verify = False


  def _request(self, *args, **kwargs):
    try:
      return self.request(*args, **kwargs)
    except ConnectionError as e:
      if hasattr(e.args[0], "reason"):
        if isinstance(e.args[0].reason, socket.gaierror):
          if e.args[0].reason.args[0] == socket.EAI_NONAME:
            raise InvalidGrokHostError("Invalid hostname")
    except (InvalidURL, MissingSchema) as e:
      raise InvalidGrokHostError("Invalid hostname")


  def verifyCredentials(self, aws_access_key_id, aws_secret_access_key, **kwargs):
    data = {
      "aws_access_key_id": aws_access_key_id,
      "aws_secret_access_key": aws_secret_access_key,
    }

    response = self._request(
      method="POST",
      url=self.server + "/_auth",
      data=json.dumps(data),
      allow_redirects=False,
      **kwargs)

    if response.status_code == 200:
      result = json.loads(response.text)
      if result["result"] == "success":
        return result["apikey"]
    elif 300 <= response.status_code < 400:
      raise InvalidGrokHostError("Invalid protocol")

    raise InvalidCredentialsError("Unable to verify credentials.")


  def updateSettings(self, settings, section=None, **kwargs):

    url = self.server + "/_settings"

    if section is not None:
      url += "/" + section

    response = self._request(
      method="POST",
      url=url,
      data=json.dumps(settings),
      auth=self.auth,
      **kwargs)

    if response.status_code == 204:
      return

    raise GrokCLIError("Unable to update settings.")


  def listMetricDatasources(self, **kwargs):

    response = self._request(
      method="GET",
      url=self.server + "/_metrics",
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)


  def listMetrics(self, datasource, **kwargs):

    response = self._request(
      method="GET",
      url=self.server + "/_metrics/" + datasource,
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)


  def listCloudwatchMetrics(self, region, namespace=None, metric=None,
      **kwargs):

    url = self.server + "/_metrics/cloudwatch/"
    if namespace:
      url += region + "/" + namespace
      if metric:
        url += "/" + metric
    else:
      url += "regions/" + region

    response = self._request(
      method="GET",
      url=url,
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)


  def listModels(self, **kwargs):

    response = self._request(
      method="GET",
      url=self.server + "/_models",
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)


  def listInstances(self, **kwargs):

    response = self._request(
      method="GET",
      url=self.server + "/_instances",
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)


  def exportModels(self, **kwargs):

    response = self._request(
      method="GET",
      url=self.server + "/_models/export",
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)


  def exportModel(self, modelId, **kwargs):

    response = self._request(
      method="GET",
      url=self.server + "/_models/" + modelId + "/export",
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)


  def createModels(self, nativeMetric, **kwargs):

    url = self.server + "/_models"

    response = self._request(
      method="POST",
      url=url,
      data=json.dumps(nativeMetric),
      auth=self.auth,
      **kwargs)

    if response.status_code == 201:
      return json.loads(response.text)

    raise GrokCLIError("Unable to create models")


  def createModel(self, nativeMetric, **kwargs):
    url = self.server + "/_models"

    response = self._request(
      method="POST",
      url=url,
      data=json.dumps(nativeMetric),
      auth=self.auth,
      **kwargs)

    if response.status_code == 201:
      return json.loads(response.text)

    raise GrokCLIError("Unable to create model")


  def deleteModel(self, metricID, **kwargs):
    url = self.server + "/_models/" + metricID

    response = self._request(
      method="DELETE",
      url=url,
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)

    raise GrokCLIError("Unable to delete model")


  def deleteInstance(self, serverName, **kwargs):
    url = self.server + "/_instances"

    response = self._request(
      method="DELETE",
      url=url,
      data=json.dumps([serverName]),
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)

    raise GrokCLIError("Unable to delete instance")



__all__ = [
  "GrokCLIError",
  "GrokSession",
  "InvalidGrokHostError",
  "InvalidCredentialsError"]
