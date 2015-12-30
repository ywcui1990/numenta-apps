# ----------------------------------------------------------------------
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
from collections import OrderedDict, namedtuple
import json
import logging
from multiprocessing import JoinableQueue, Process
import os
import pkg_resources
import cPickle as pickle
from threading import Thread
import traceback
import web

from uwsgidecorators import postfork, thread

from htmresearch.encoders import EncoderTypes
from htmresearch.frameworks.nlp.classification_model import ClassificationModel
from htmresearch.frameworks.nlp.classify_fingerprint import (
  ClassificationModelFingerprint)
# from htmresearch.frameworks.nlp.classify_htm import ClassificationModelHTM
# from htmresearch.frameworks.nlp.classify_keywords import (
#   ClassificationModelKeywords)
from htmresearch.frameworks.nlp.classify_windows import (
  ClassificationModelWindows)
from htmresearch.support.csv_helper import readCSV



g_log = logging.getLogger(__name__)



_MODEL_MAPPING = {
  "CioWordFingerprint": ClassificationModelFingerprint,
  "CioDocumentFingerprint": ClassificationModelFingerprint,
  "CioWindows": ClassificationModelWindows,
  # "Keywords": ClassificationModelKeywords,
  # "HTMNetwork": ClassificationModelHTM,
}
_DEFAULT_MODEL_NAME = "CioWindows"
_MODEL_CACHE_DIR_PREFIX = os.environ.get("MODEL_CACHE_DIR", os.getcwd())


PrepDataTask = namedtuple("PrepDataTask", "dataDict, preprocess")
EncodeSamplesTask = namedtuple("EncodeSamplesTask", "samples")
TrainModelTask = namedtuple("TrainModelTask", "i")
QueryModelTask = namedtuple("QueryModelTask", "query, preprocess")
SaveModelTask = namedtuple("SaveModelTask", "")



class ModelProcess(Process):
  """ multiprocessing.Process subclass; Executes model operations in separate
  process, communicating over JoinableQueue for synchronous results
  """


  def __init__(self, modelObj, inputQueue, outputQueue):
    """
    :param modelObj: Model
    :param inputQueue: JoinableQueue in which process receives input
    :param outputQueue: JoinableQueue to which process publishes output
    """
    super(ModelProcess, self).__init__()
    self._inputQueue = inputQueue
    self._outputQueue = outputQueue
    self.modelObj = modelObj


  def run(self):
    """ Listen for input, perform task, return results, repeat.  Forever.
    """

    while True:
      try:
        output = None

        # Blocking get
        obj = self._inputQueue.get()

        if isinstance(obj, PrepDataTask):
          output = self.modelObj.prepData(dataDict=obj.dataDict,
                                          preprocess=obj.preprocess)
        elif isinstance(obj, EncodeSamplesTask):
          output = self.modelObj.encodeSamples(samples=obj.samples)
        elif isinstance(obj, TrainModelTask):
          output = self.modelObj.trainModel(i=obj.i)
        elif isinstance(obj, QueryModelTask):
          output = self.modelObj.queryModel(query=obj.query,
                                            preprocess=obj.preprocess)
        elif isinstance(obj, SaveModelTask):
          output = self.modelObj.saveModel()

        # Blocking put
        self._outputQueue.put(output)

      except Exception as err:
        traceback.print_exc(file=open(str(os.getpid()) + ".out", "w"))

        # Blocking put
        self._outputQueue.put(err)

      # Input has been handled
      self._inputQueue.task_done()

      # Output has been handled
      self._outputQueue.join()





class SynchronousBackgroundModelProxy(object):
  """ Executes model process in background, blocks in foreground.

  Instances of SynchronousBackgroundModelProxy serve as proxies in the
  foreground to long-running processes running in the background.  A
  light-weight RPC mechanism is implemented in prepData(), encodeSamples(),
  trainModel(), queryModel(), and more and the internal implementation ensures
  that the RPC calls block in the foreground.  In order to execute RPC calls
  in parallel, you must use threads to execute the functions, as is done in
  setupModelWorkers() to create, prepare, and train the models at startup.
  """


  def __init__(self, modelObj):
    self.inputQueue = JoinableQueue(1)
    self.outputQueue = JoinableQueue(1)
    modelProcess = ModelProcess(modelObj, self.inputQueue, self.outputQueue)
    self._modelProcess = modelProcess
    self._modelProcess.start()


  # Begin RPC definitions.  See handlers in ModelProcess.run()


  def prepData(self, dataDict, preprocess):
    return self._submitTask(PrepDataTask._make([dataDict, preprocess]))


  def encodeSamples(self, samples):
    return self._submitTask(EncodeSamplesTask._make([samples]))


  def trainModel(self, i):
    return self._submitTask(TrainModelTask._make([i]))


  def queryModel(self, query, preprocess):
    return self._submitTask(QueryModelTask._make([query, preprocess]))


  def saveModel(self):
    return self._submitTask(SaveModelTask._make([]))


  # End RPC definitions


  def _submitTask(self, inputValue):
    """
    :param object inputValue: Instance of a class that defines a task that is
      recognized, and handled, by ModelProcess.run().  See *Task namedtuples
      defined in this module.
    """
    # Blocking put
    self.inputQueue.put(inputValue)

    # Wait for input to be handled
    self.inputQueue.join()

    # Blocking get
    outputValue = self.outputQueue.get()

    # Output has been received
    self.outputQueue.task_done()

    if isinstance(outputValue, Exception):
      raise outputValue
    else:
      return outputValue


  @property
  def process(self):
    """ Public accessor method for internal model process
    """
    return self._modelProcess


  def terminateAndCleanup(self):
    self._modelProcess.terminate()


  def __del__(self):
    self.terminateAndCleanup()



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
    with pkg_resources.resource_filename(__name__, jsonPath) as f:
      return json.load(f)
  except IOError as e:
    print "Could not find JSON at '{}'.".format(jsonPath)
    raise e


# Indicates global ready status of all models.  g_ready will transition to
# True when all models have been created, trained, and are ready to handle
# requests
g_ready = False
g_models = {}
g_csvdata = (
  readCSV(
    os.getenv("IMBU_DATA",
              pkg_resources.resource_filename(__name__, "data.csv")),
  numLabels=0)
)

# Get data and order by unique ID
g_samples = OrderedDict(
  (sample[2], sample[0]) for sample in g_csvdata.values()
)



def createModel(modelName, modelFactory):
  """Return an instantiated model."""

  global g_models

  modelDir = os.path.join(_MODEL_CACHE_DIR_PREFIX, modelName)

  try:
    print "Attempting to load from", modelDir
    model = ClassificationModel.loadModel(modelDir)
    modelProxy = SynchronousBackgroundModelProxy(model)
    print "Model loaded from", modelDir

  except IOError:
    print "Model failed to load from", modelDir, "Let's train it from scratch."


    if modelFactory is None:
      raise ValueError("Could not instantiate model '{}'.".format(modelName))

    if modelName == "HTMNetwork":

      raise NotImplementedError()

    elif modelName == "CioWordFingerprint":
      model = modelFactory(retina=os.environ["IMBU_RETINA_ID"],
                           apiKey=os.environ["CORTICAL_API_KEY"],
                           fingerprintType=EncoderTypes.word,
                           modelDir=modelDir)

    elif modelName == "CioDocumentFingerprint":
      model = modelFactory(retina=os.environ["IMBU_RETINA_ID"],
                           apiKey=os.environ["CORTICAL_API_KEY"],
                           fingerprintType=EncoderTypes.document,
                           modelDir=modelDir)

    else:
      model = modelFactory(modelDir=modelDir)

    model.verbosity = 0
    model.numLabels = 0

    modelProxy = SynchronousBackgroundModelProxy(model)

    samples = modelProxy.prepData(g_csvdata, False)

    modelProxy.encodeSamples(samples)

    for i in xrange(len(samples)):
      modelProxy.trainModel(i)

    print "Model trained, save it."

    modelProxy.saveModel()

    print "Model saved"

  g_models[modelName] = modelProxy



@postfork
@thread
def setupModelWorkers():
  """ Create all models.

  This function is decorated by the uwsgi-provided postfork decorator to ensure
  that the model proxy objects (and their queues) are created in the same
  worker process as the request handlers.
  """
  global g_ready

  threads = []

  for modelName, modelFactory in _MODEL_MAPPING.iteritems():
    createAndTrainModelThread = Thread(target=createModel,
                                       args=(modelName, modelFactory))

    createAndTrainModelThread.start()
    threads.append(createAndTrainModelThread)

  print "waiting for models..."

  for thread in threads:
    thread.join()

  g_ready = True

  print "Models ready!"



class FluentWrapper(object):

  def query(self, model, text):
    """
    Queries the model and returns an ordered list of matching samples.

    :param str model: Model to use. Possible values are:
                      CioWordFingerprint, CioDocumentFingerprint, CioWindows,
                      Keywords, HTMNetwork

    :param str text: The text to match.

    :returns: a sequence of matching samples.

    ::
    [
        {"id": "1", "text": "sampleText", "score": "0.75"},
        ...
    ]
    """

    global g_models

    results = []
    if text:
      sortedDistances = g_models[model].queryModel(text, preprocess=False)

      for sID, dist in sortedDistances:
        results.append({"id": sID,
                        "text": g_samples[sID],
                        "score": dist.item()})

    return results



class DefaultHandler(object):
  def GET(self):  # pylint: disable=R0201,C0103
    addStandardHeaders("text/html; charset=UTF-8")
    return "<html><body><h1>Welcome to Nupic Fluent</h1></body></html>"



class FluentAPIHandler(object):
  """Handles API requests"""

  def OPTIONS(self, modelName=_DEFAULT_MODEL_NAME): # pylint: disable=R0201,C0103
    addStandardHeaders()
    addCORSHeaders()
    if modelName not in g_models:
      raise web.notfound("%s Model not found" % modelName)


  def GET(self):
    """ GET global ready status.  Returns "true" when all models have been
    created and are ready for queries.
    """
    addStandardHeaders()
    addCORSHeaders()

    return json.dumps(g_ready)


  def POST(self, modelName=_DEFAULT_MODEL_NAME): # pylint: disable=R0201,C0103
    addStandardHeaders()
    addCORSHeaders()

    response = []

    data = web.data()
    if data:
      if modelName not in g_models:
        raise web.notfound("%s Model not found" % modelName)

      if isinstance(data, basestring):
        response = g_fluent.query(modelName, data)
      else:
        raise web.badrequest("Invalid Data. Query data must be a string")

    else:
      # no sample data, just return all samples
      response = [{"id": item[0], "text": item[1], "score": 0}
        for item in g_samples.items()]

    return json.dumps(response)



urls = (
  "", "DefaultHandler",
  "/", "DefaultHandler",
  "/fluent", "FluentAPIHandler",
  "/fluent/(.*)", "FluentAPIHandler"
)
app = web.application(urls, globals())

# Create Imbu model runner
g_fluent = FluentWrapper()

# Required by uWSGI per WSGI spec
application = app.wsgifunc()
