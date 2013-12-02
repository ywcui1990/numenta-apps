#-------------------------------------------------------------------------------
# Copyright (C) 2013 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------
import json
from requests.sessions import Session
from requests.models import Request


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


  def verifyCredentials(self, aws_access_key_id, aws_secret_access_key, **kwargs):
    data = {
      "aws_access_key_id": aws_access_key_id,
      "aws_secret_access_key": aws_secret_access_key,
    }

    response = self.request(
      method="POST",
      url=self.server + "/_auth",
      data=json.dumps(data),
      **kwargs)

    if response.status_code == 200:
      result = json.loads(response.text)
      if result["result"] == "success":
        return result["apikey"]

    raise Exception("Unable to verify credentials.")


  def updateSettings(self, settings, section=None, **kwargs):

    url = self.server + "/_settings"

    if section is not None:
      url += "/" + section

    response = self.request(
      method="POST",
      url=url,
      data=json.dumps(settings),
      auth=self.auth,
      **kwargs)

    if response.status_code == 204:
      return

    raise Exception("Unable to update settings.")


  def listModels(self, **kwargs):

    response = self.request(
      method="GET",
      url=self.server + "/_models",
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)


  def exportModels(self, **kwargs):

    response = self.request(
      method="GET",
      url=self.server + "/_models/export",
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)


  def exportModel(self, modelId, **kwargs):

    response = self.request(
      method="GET",
      url=self.server + "/_models/" + modelId + "/export",
      auth=self.auth,
      **kwargs)

    if response.status_code == 200:
      return json.loads(response.text)

