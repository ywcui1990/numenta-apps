# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero Public License for more details.
#
# You should have received a copy of the GNU Affero Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------
"""
Implements Imbu's web API.
"""

from collections import OrderedDict
import json
import logging
import os
import pkg_resources
import web

from htmresearch.encoders import EncoderTypes
from htmresearch.frameworks.nlp.classify_fingerprint import (
  ClassificationModelFingerprint)
# from htmresearch.frameworks.nlp.classify_htm import ClassificationModelHTM
# from htmresearch.frameworks.nlp.classify_keywords import (
#   ClassificationModelKeywords)
from htmresearch.support.csv_helper import readCSV


g_log = logging.getLogger(__name__)

_NETWORK_JSON = "imbu_tp.json"
_MODEL_MAPPING = {
  "CioWordFingerprint": ClassificationModelFingerprint,
  "CioDocumentFingerprint": ClassificationModelFingerprint
  # "Keywords": ClassificationModelKeywords,
  # "HTMNetwork": ClassificationModelHTM,
}



def addStandardHeaders(contentType="application/json; charset=UTF-8"):
  """
  Add Standard HTTP Headers ("Content-Type", "Server") to the response.

  Here is an example of the headers added by this method using the default
  values::

      Content-Type: application/json; charset=UTF-8
      Server: Imbu x.y.z

  :param content_type: The value for the "Content-Type" header.
                       (default "application/json; charset=UTF-8")
  """
  web.header("Server", "Imbu 1.0.0", True)
  web.header("Content-Type", contentType, True)



def addCORSHeaders():
  """
  Add CORS (http://www.w3.org/TR/cors/) headers
  """
  web.header("Access-Control-Allow-Origin", "*", True)
  web.header("Access-Control-Allow-Headers",
             "accept, access-control-allow-origin, content-type", True)
  web.header("Access-Control-Allow-Credentials", "true", True)
  web.header("Access-Control-Allow-Methods", "POST", True)



def loadJSON(jsonPath):
  try:
    with pkg_resources.resource_filename(__name__, jsonPath) as fin:
      return json.load(fin)
  except IOError as e:
    print "Could not find JSON at \'{}\'.".format(jsonPath)
    raise e



def createModel(modelName, dataPath, csvdata):
  """Return an instantiated model."""
  modelFactory = _MODEL_MAPPING.get(modelName, None)

  if modelFactory is None:
    raise ValueError("Could not instantiate model \'{}\'.".format(modelName))

  # TODO: remove these if blocks and just use the else; either specify the Cio
  # FP type elsewhere, or split Word and Doc into separate classes.

  if modelName == "HTMNetwork":
    networkConfig = loadJSON(_NETWORK_JSON)

    model = modelFactory(retina=os.environ["IMBU_RETINA_ID"],
                         apiKey=os.environ["CORTICAL_API_KEY"],
                         networkConfig=networkConfig,
                         inputFilePath=dataPath,
                         prepData=True,
                         numLabels=0,
                         stripCats=True,
                         retinaScaling=1.0)

    numRecords = (
      sum(model.networkDataGen.getNumberOfTokens(model.networkDataPath))
    )
    model.trainModel(iterations=numRecords)
    model.verbosity = 0
    model.numLabels = 0
    return model

  elif modelName == "CioWordFingerprint":
    model = modelFactory(retina=os.environ["IMBU_RETINA_ID"],
                         apiKey=os.environ["CORTICAL_API_KEY"],
                         fingerprintType=EncoderTypes.word)

  elif modelName == "CioDocumentFingerprint":
    model = modelFactory(retina=os.environ["IMBU_RETINA_ID"],
                         apiKey=os.environ["CORTICAL_API_KEY"],
                         fingerprintType=EncoderTypes.document)

  else:
    model = modelFactory()

  model.verbosity = 0
  model.numLabels = 0
  samples = model.prepData(csvdata, False)
  model.encodeSamples(samples)

  for i in xrange(len(samples)):
    model.trainModel(i)

  return model



class FluentWrapper(object):
  """ Wraps imbu Model """

  def __init__(self, dataPath="data.csv"):
    """
    initializes imbu model with given sample data

    :param str dataPath: Path to sample data file.
                         Must be a CSV file having 'ID and 'Sample' columns
    """
    g_log.info("Initialize imbu model")

    csvdata = readCSV(dataPath, numLabels=0)
    self.samples = OrderedDict()
    for dataID, text in csvdata.iteritems():
      self.samples[dataID] = text


    self.models = {modelName: createModel(modelName, dataPath, csvdata)
      for modelName, modelFactory in _MODEL_MAPPING.iteritems()}


  def query(self, model, text):
    """ Queries fluent model and returns an ordered list of matching documents.

    :param str model: Model to use. Possible values are:
                      CioWordFingerprint, CioDocumentFingerprint,
                      Keywords, HTMNetwork

    :param str text: The text to match.

    :returns: a sequence of matching samples.

    ::
    [
        {"id": "1", "text": "sampleText", "score": "0.75"},
        ...
    ]
    """
    results = []
    if text:
      g_log.info("Query model for : %s", text)
      sortedDistances = self.models[model].queryModel(text, False)
      for sID, dist in sortedDistances:
        results.append({"id": sID,
                        "text": self.samples[sID],
                        "score": dist.item()})

    return results



class DefaultHandler(object):
  def GET(self):  # pylint: disable=R0201,C0103
    addStandardHeaders("text/html; charset=UTF-8")
    return "<html><body><h1>Welcome to Nupic Fluent</h1></body></html>"



class FluentAPIHandler(object):
  """ Handles Fluent API Requests """

  def OPTIONS(self, modelName="CioWordFingerprint"): # pylint: disable=R0201,C0103
    addStandardHeaders()
    addCORSHeaders()
    if modelName not in g_fluent:
      raise web.notfound("%s Model not found" % modelName)


  def POST(self, modelName="CioWordFingerprint"): # pylint: disable=R0201,C0103
    addStandardHeaders()
    addCORSHeaders()

    if modelName not in g_fluent.models:
      raise web.notfound("%s Model not found" % modelName)

    response = []

    data = web.data()
    if data:
      if isinstance(data, basestring):
        response = g_fluent.query(modelName, data)
      else:
        raise web.badrequest("Invalid Data. Query data must be a string")

    else:
      # sample data is missing
      g_log.error("sample data is missing, raising BadRequest exception")
      raise web.badrequest("Sample data is missing")

    return json.dumps(response)



urls = (
  "", "DefaultHandler",
  "/", "DefaultHandler",
  "/fluent", "FluentAPIHandler",
  "/fluent/(.*)", "FluentAPIHandler"
)
app = web.application(urls, globals())

# Create imbu model runner
IMBU_DATA = os.getenv("IMBU_DATA",
                      pkg_resources.resource_filename(__name__, "data.csv"))
g_fluent = FluentWrapper(IMBU_DATA)

# Required by uWSGI per WSGI spec
application = app.wsgifunc()
