#!/usr/bin/env python
# ----------------------------------------------------------------------
# Copyright (C) 2015 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc. No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
# ----------------------------------------------------------------------

"""
Integration tests for the nta.utils.amqp.SynchronousAmqpClient module
"""

import logging
import requests
import unittest
from random import randint

from nta.utils.error_handling import retry
from nta.utils.amqp import (
  AmqpChannelError,
  Consumer,
  Message,
  QueueDeclarationResult,
  UnroutableError)
from nta.utils.amqp import (
  getRabbitmqConnectionParameters,
  RabbitmqManagementConnectionParams)
from nta.utils.amqp import SynchronousAmqpClient
from nta.utils.logging_support_raw import LoggingSupport
from nta.utils.test_utils import amqp_test_utils

_LOGGER = logging.getLogger("integration.synchronous_amqp_client_test")

def setUpModule():
  LoggingSupport.initTestApp()

_RETRY_ON_ASSERTION_ERROR = retry(timeoutSec=10, initialRetryDelaySec=0.5,
                               maxRetryDelaySec=2,
                               retryExceptions=(AssertionError,),
                               logger=_LOGGER)



@amqp_test_utils.RabbitmqVirtualHostPatch(
  clientLabel="testingAmqpClient",
  logger=_LOGGER)
class SynchronousAmqpClientTest(unittest.TestCase):
  """ Test for nta.utils.amqp.SynchronousAmqpClient """

  def __init__(self, *args, **kwargs):
    super(SynchronousAmqpClientTest, self).__init__(*args, **kwargs)
    self.connParams = None
    self.client = None


  def _connectToClient(self):
    """
    Setup method to run at beginning of test. Since tests are wrapped with the
    amqp_test_utils.RabbitmqVirtualHostPatch, connection parameters for the
    SynchronousAmqpClient MUST be checked during the test AND NOT during the
    usual setUp() method of unittest.TestCase, since the patch only applies to
    functions with the prefix specified in
    amqp_test_utils.RabbitmqVirtualHostPatch (test).
    """
    self.connParams = RabbitmqManagementConnectionParams()
    self.client = SynchronousAmqpClient(getRabbitmqConnectionParameters())
    self.addCleanup(self.client.close)
    self.assertTrue(self.client.isOpen())


  def assertRaisesCode(self, excClass, excCode, callableObj=None,
                           *args, **kwargs):
    """
    Asserts that an Exception with a particular "code" is raised.

    :param Exception excClass: class of Exception to be raised
    :param int excCode: Exception.code to assert the exception contains
    """
    try:
      callableObj(*args, **kwargs)
    except excClass, e:
      self.assertEqual(type(e), excClass)
      self.assertEqual(e.code, excCode)
      return

    raise self.failureException("%s not raised" % (excClass.__name__,))

  @_RETRY_ON_ASSERTION_ERROR
  def _verifyDeletedExchange(self, exchangeName):
    """
    Verifies that a given exchange does not exist.

    :param str exchangeName: Exchange name
    """
    response = requests.get(
        url="http://%s:%s/api/exchanges/%s/%s" % (
            self.connParams.host,
            self.connParams.port,
            self.connParams.vhost,
            exchangeName),
        auth=(self.connParams.username,
              self.connParams.password))
    self.assertEqual(response.status_code, 404,
                     "Exchange didn't properly delete")


  @_RETRY_ON_ASSERTION_ERROR
  def _verifyQueue(self, testQueueName, testConsumerCount=0,
                   testMessageCount=0):
    """
    Verifies that a given queue exists, with optional verification of message
    and consumer counts.

    :param str testQueueName: Queue name
    :param int testConsumerCount: (optional)
    :param int testMessageCount: (optional)
    """
    queue = requests.get(
      url="http://%s:%s/api/queues/%s/%s" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost,
        testQueueName),
      auth=(self.connParams.username,
            self.connParams.password)
    ).json()
    self.assertEqual(queue["name"], testQueueName)
    self.assertEqual(queue["consumers"], testConsumerCount)
    self.assertEqual(queue["messages"], testMessageCount)


  @_RETRY_ON_ASSERTION_ERROR
  def _verifyDeletedQueue(self, queueName):
    """
    Verifies that a given queue does not exist.

    :param queueName: Queue name
    """
    response = requests.get(
      url="http://%s:%s/api/queues/%s/%s" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost,
        queueName),
      auth=(self.connParams.username,
            self.connParams.password))
    self.assertEqual(response.status_code, 404, "Queue didn't properly delete")


  def testDeclareAndDeleteDirectExchange(self):
    """  Test creating and deleting a new exchange (type = direct) """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"

    self.assertRaisesCode(AmqpChannelError,
                          404,
                          self.client.declareExchange,
                          exchangeName,
                          exchangeType,
                          passive=True)


    self.client.declareExchange(exchangeName, exchangeType)
    exchange = requests.get(
      url="http://%s:%s/api/exchanges/%s/%s" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost,
        exchangeName),
      auth=(self.connParams.username,
            self.connParams.password)
    ).json()
    self.assertEqual(exchange["name"], exchangeName)
    self.assertEqual(exchange["type"], exchangeType)

    try:
      self.client.declareExchange(exchangeName, exchangeType, passive=True)
    except AmqpChannelError:
      self.fail("Failed to passively declare existing exchange.")


    self.client.deleteExchange(exchangeName)
    self._verifyDeletedExchange(exchangeName)


  def testDeclareAndDeleteFanoutExchange(self):
    """  Test creating and deleting a new exchange (type = fanout) """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "fanout"

    self.assertRaisesCode(AmqpChannelError,
                          404,
                          self.client.declareExchange,
                          exchangeName,
                          exchangeType,
                          passive=True)


    self.client.declareExchange(exchangeName, exchangeType)
    exchange = requests.get(
      url="http://%s:%s/api/exchanges/%s/%s" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost,
        exchangeName),
      auth=(self.connParams.username,
            self.connParams.password)
    ).json()
    self.assertEqual(exchange["name"], exchangeName)
    self.assertEqual(exchange["type"], exchangeType)

    try:
      self.client.declareExchange(exchangeName, exchangeType, passive=True)
    except AmqpChannelError:
      self.fail("Failed to passively declare existing exchange.")


    self.client.deleteExchange(exchangeName)
    self._verifyDeletedExchange(exchangeName)


  def testDeclareAndDeleteTopicExchange(self):
    """  Test creating and deleting a new exchange (type = topic) """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "topic"

    self.assertRaisesCode(AmqpChannelError,
                          404,
                          self.client.declareExchange,
                          exchangeName,
                          exchangeType,
                          passive=True)


    self.client.declareExchange(exchangeName, exchangeType)
    exchange = requests.get(
      url="http://%s:%s/api/exchanges/%s/%s" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost,
        exchangeName),
      auth=(self.connParams.username,
            self.connParams.password)
    ).json()
    self.assertEqual(exchange["name"], exchangeName)
    self.assertEqual(exchange["type"], exchangeType)

    try:
      self.client.declareExchange(exchangeName, exchangeType, passive=True)
    except AmqpChannelError:
      self.fail("Failed to passively declare existing exchange.")


    self.client.deleteExchange(exchangeName)
    self._verifyDeletedExchange(exchangeName)


  def testDeclareAndDeleteQueue(self):
    """ Test the declareQueue and deleteQueue methods """
    self._connectToClient()
    queueName = "testQueue"

    self.assertRaisesCode(AmqpChannelError,
                              404,
                              self.client.declareQueue,
                              queueName,
                              passive=True)

    self.assertIsInstance(self.client.declareQueue(queueName),
                          QueueDeclarationResult)
    self._verifyQueue(queueName)
    self.assertIsInstance(self.client.declareQueue(queueName, passive=True),
                          QueueDeclarationResult)
    self._verifyQueue(queueName)

    self.client.deleteQueue(queueName)
    self._verifyDeletedQueue(queueName)


  def testBindUnbindQueue(self):
    """ Test binding and unbinding queues to exchanges """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName = "testQueue"
    routingKey = "testKey"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName)

    self.client.bindQueue(queueName, exchangeName, routingKey)
    queueBindings = requests.get(
      url="http://%s:%s/api/queues/%s/%s/bindings" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost,
        queueName),
      auth=(self.connParams.username, self.connParams.password)
    ).json()
    self.assertTrue([bind for bind in queueBindings
                     if bind["source"] == exchangeName])
    self.assertEqual([bind for bind in queueBindings
                      if bind["source"] == exchangeName][0]["routing_key"],
                     routingKey)
    exchangeBindings = requests.get(
      url="http://%s:%s/api/exchanges/%s/%s/bindings/source" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost,
        exchangeName),
      auth=(self.connParams.username, self.connParams.password)
    ).json()
    self.assertTrue([bind for bind in exchangeBindings
                     if bind["destination"] == queueName])
                    # Tests that the binding actually exists
    self.assertEqual([bind for bind in exchangeBindings
                      if bind["destination"] == queueName][0]["routing_key"],
                     routingKey)
    bindings = requests.get(
      url="http://%s:%s/api/bindings/%s/e/%s/q/%s" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost,
        exchangeName,
        queueName),
      auth=(self.connParams.username, self.connParams.password)
    ).json()
    self.assertTrue([bind for bind in bindings
                     if bind["routing_key"] == routingKey])

    self.client.unbindQueue(queueName, exchangeName, routingKey)
    queueBindings = requests.get(
      url="http://%s:%s/api/queues/%s/%s/bindings" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost,
        queueName),
      auth=(self.connParams.username, self.connParams.password)
    ).json()
    self.assertFalse([bind for bind in queueBindings
                     if bind["source"] == exchangeName])
    exchangeBindings = requests.get(
      url="http://%s:%s/api/exchanges/%s/%s/bindings/source" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost,
        exchangeName),
      auth=(self.connParams.username, self.connParams.password)
    ).json()
    self.assertFalse([bind for bind in exchangeBindings
                     if bind["destination"] == queueName])
    bindings = requests.get(
      url="http://%s:%s/api/bindings/%s/e/%s/q/%s" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost,
        exchangeName,
        queueName),
      auth=(self.connParams.username, self.connParams.password)
    ).json()
    self.assertFalse([bind for bind in bindings
                     if bind["routing_key"] == routingKey])


  def testPublishMessage(self):
    """ Test that published messages reach their specified queues"""
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName = "testQueue"
    routingKey = "testKey"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName)
    self.client.bindQueue(queueName, exchangeName, routingKey)

    # Test message publishing
    numTestMessages = randint(1,5)
    for i in range(0, numTestMessages):
      # Test random numbers of messages sent to the queue
      self.client.publish(Message("test-msg-%d" % (i)),
                          exchangeName,
                          routingKey)

    self._verifyQueue(queueName, testMessageCount=numTestMessages)


  def testPublishAndPurgeOnMultipleQueues(self):
    """ Test that queues are properly purged"""
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName1 = "testQueue1"
    queueName2 = "testQueue2"
    routingKey1 = "testKey1"
    routingKey2 = "testKey2"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName1)
    self.client.declareQueue(queueName2)
    self.client.bindQueue(queueName1, exchangeName, routingKey1)
    self.client.bindQueue(queueName2, exchangeName, routingKey2)

    numTestMessages1 = randint(1,5)
    numTestMessages2 = randint(1,5)
    for i in range(0, numTestMessages1):
      # Test random numbers of messages sent to the queue
      self.client.publish(Message("test-msg-%d-queue1" % (i)),
                          exchangeName,
                          routingKey1)
    for i in range(0, numTestMessages2):
      # Test random numbers of messages sent to the queue
      self.client.publish(Message("test-msg-%d-queue2" % (i)),
                          exchangeName,
                          routingKey2)

    self._verifyQueue(queueName1, testMessageCount=numTestMessages1)
    self._verifyQueue(queueName2, testMessageCount=numTestMessages2)
    self.client.purgeQueue(queueName1)
    self._verifyQueue(queueName1, testMessageCount=0)
    self._verifyQueue(queueName2, testMessageCount=numTestMessages2)
    self.client.purgeQueue(queueName2)
    self._verifyQueue(queueName2, testMessageCount=0)


  def testAckAllMessages(self):
    """ Tests acking all messages"""
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName = "testQueue"
    routingKey = "testKey"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName)
    self.client.bindQueue(queueName, exchangeName, routingKey)

    numTestMessages = randint(1,5)
    for i in range(0, numTestMessages):
      # Test random numbers of messages sent to the queue
      self.client.publish(Message("test-msg-%d" % (i)),
                          exchangeName,
                          routingKey)
    self._verifyQueue(queueName, testMessageCount=numTestMessages)


    @_RETRY_ON_ASSERTION_ERROR
    def _verifyReadyMessages():
      queue = requests.get(
        url="http://%s:%s/api/queues/%s/%s" % (
          self.connParams.host,
          self.connParams.port,
          self.connParams.vhost,
          queueName),
        auth=(self.connParams.username, self.connParams.password)
      ).json()
      self.assertEqual(queue["messages_ready"], numTestMessages)
    _verifyReadyMessages()

    self.client.createConsumer(queueName)
    @_RETRY_ON_ASSERTION_ERROR
    def _verifyUnacknowledgedMessages():
      queue = requests.get(
        url="http://%s:%s/api/queues/%s/%s" % (
          self.connParams.host,
          self.connParams.port,
          self.connParams.vhost,
          queueName),
        auth=(self.connParams.username, self.connParams.password)
      ).json()
      self.assertEqual(queue["messages_unacknowledged"], numTestMessages)
    _verifyUnacknowledgedMessages()

    self.client.ackAll()
    @_RETRY_ON_ASSERTION_ERROR
    def _verifyAcknowledgedMessages():
      queue = requests.get(
        url="http://%s:%s/api/queues/%s/%s" % (
          self.connParams.host,
          self.connParams.port,
          self.connParams.vhost,
          queueName),
        auth=(self.connParams.username, self.connParams.password)
      ).json()
      self.assertEqual(queue["messages"], 0)
      self.assertIn("ack", queue["message_stats"])
      self.assertEqual(queue["message_stats"]["ack"], numTestMessages)
    _verifyAcknowledgedMessages()


  def testNackAllMessages(self):
    """ Tests nacking all messages """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName = "testQueue"
    routingKey = "testKey"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName)
    self.client.bindQueue(queueName, exchangeName, routingKey)

    numTestMessages = randint(1,5)
    for i in range(0, numTestMessages):
      # Test random numbers of messages sent to the queue
      self.client.publish(Message("test-msg-%d" % (i)),
                          exchangeName,
                          routingKey)
    self._verifyQueue(queueName, testMessageCount=numTestMessages)


    @_RETRY_ON_ASSERTION_ERROR
    def _verifyReadyMessages():
      """
      Verifies that messages are ready on server in nested function to
      use the _RETRY_ON_ASSERTION_ERROR decorator.
      """
      queue = requests.get(
        url="http://%s:%s/api/queues/%s/%s" % (
          self.connParams.host,
          self.connParams.port,
          self.connParams.vhost,
          queueName),
        auth=(self.connParams.username, self.connParams.password)
      ).json()
      self.assertEqual(queue["messages_ready"], numTestMessages)
    _verifyReadyMessages()

    self.client.createConsumer(queueName)
    @_RETRY_ON_ASSERTION_ERROR
    def _verifyUnacknowledgedMessages():
      """
      Verifies that messages are unacknowledged on server in nested function to
      use the _RETRY_ON_ASSERTION_ERROR decorator.
      """
      queue = requests.get(
        url="http://%s:%s/api/queues/%s/%s" % (
          self.connParams.host,
          self.connParams.port,
          self.connParams.vhost,
          queueName),
        auth=(self.connParams.username, self.connParams.password)
      ).json()
      self.assertEqual(queue["messages_unacknowledged"], numTestMessages)
    _verifyUnacknowledgedMessages()

    self.client.nackAll()
    @_RETRY_ON_ASSERTION_ERROR
    def _verifyNackedMessages():
      """
      Verifies that messages are gone from server in nested function to
      use the _RETRY_ON_ASSERTION_ERROR decorator.
      """
      queue = requests.get(
        url="http://%s:%s/api/queues/%s/%s" % (
          self.connParams.host,
          self.connParams.port,
          self.connParams.vhost,
          queueName),
        auth=(self.connParams.username, self.connParams.password)
      ).json()
      self.assertEqual(queue["messages"], 0)
      self.assertEqual(queue["messages_unacknowledged"], 0)
    _verifyNackedMessages()


  def testGetOneMessage(self):
    """ Tests getting messages using getOneMessage. """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName = "testQueue"
    routingKey = "testKey"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName)
    self.client.bindQueue(queueName, exchangeName, routingKey)

    numTestMessages = randint(1,5)
    for i in range(0, numTestMessages):
      # Test random numbers of messages sent to the queue
      self.client.publish(Message("test-msg-%d" % (i)),
                          exchangeName,
                          routingKey)
    self._verifyQueue(queueName, testMessageCount=numTestMessages)

    for i in range(0, numTestMessages):
      self.assertEqual(self.client.getOneMessage(queueName).body,
                       "test-msg-%d" % (i))


  def testEnablePublisherAcks(self):
    """
    Tests enabling publisher acknowledgements after an unroutable message has
    already been sent.
    """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName = "testQueue"
    routingKey = "testKey"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName)
    self.client.bindQueue(queueName, exchangeName, routingKey)

    self.client.publish(Message("test-msg"), exchangeName, "fakeKey")

    self.assertRaises(UnroutableError, self.client.enablePublisherAcks())


  def testPublishMandatoryMessage(self):
    """
    Tests sending an unroutable message after enabling publisher
    acknowledgements.
    """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName = "testQueue"
    routingKey = "testKey"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName)
    self.client.bindQueue(queueName, exchangeName, routingKey)

    self.client.enablePublisherAcks()

    self.assertRaises(UnroutableError, self.client.publish,
                      Message("test-msg"), exchangeName, "fakeKey",
                      mandatory=True)


  def testCreateCloseConsumer(self):
    """ Tests creation and close of a consumer. """
    self._connectToClient()
    queueName = "testQueue"

    self.client.declareQueue(queueName)

    # Test creation of consumer
    consumer = self.client.createConsumer(queueName)
    self.assertIsInstance(consumer, Consumer)
    consumers = requests.get(
      url="http://%s:%s/api/consumers/%s" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost),
      auth=(self.connParams.username, self.connParams.password)
    ).json()
    self.assertTrue([c for c in consumers if c["queue"]["name"] == queueName])

    consumer.cancel()
    consumers = requests.get(
      url="http://%s:%s/api/consumers/%s" % (
        self.connParams.host,
        self.connParams.port,
        self.connParams.vhost),
      auth=(self.connParams.username, self.connParams.password)
    ).json()
    self.assertFalse([c for c in consumers if c["queue"]["name"] == queueName])


  def testConsumerGetNextEvent(self):
    """ Tests getting messages using a consumer and GetNextEvent(). """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName = "testQueue"
    routingKey = "testKey"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName)
    self.client.bindQueue(queueName, exchangeName, routingKey)

    numTestMessages = randint(1,5)
    for i in range(0, numTestMessages):
      # Test random numbers of messages sent to the queue
      self.client.publish(Message("test-msg-%d" % (i)),
                          exchangeName,
                          routingKey)
    self._verifyQueue(queueName, testMessageCount=numTestMessages)

    self.client.createConsumer(queueName)
    self.assertTrue(self.client.hasEvent())

    for i in range(0, numTestMessages):
      self.assertEqual(self.client.getNextEvent().body,
                       "test-msg-%d" % (i))


  def testRecoverUnackedMessages(self):
    """ Tests getting messages using a consumer and GetNextEvent(). """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName = "testQueue"
    routingKey = "testKey"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName)
    self.client.bindQueue(queueName, exchangeName, routingKey)

    numTestMessages = randint(1,5)
    for i in range(0, numTestMessages):
      # Test random numbers of messages sent to the queue
      self.client.publish(Message("test-msg-%d" % (i)),
                          exchangeName,
                          routingKey)
    self._verifyQueue(queueName, testMessageCount=numTestMessages)

    self.client.createConsumer(queueName)
    self.assertTrue(self.client.hasEvent())

    for i in range(0, numTestMessages):
      self.assertEqual(self.client.getNextEvent().body,
                       "test-msg-%d" % (i))

    @_RETRY_ON_ASSERTION_ERROR
    def _verifyUnacknowledgedMessages():
      """
      Verifies that messages are unacknowledged on server in nested function to
      use the _RETRY_ON_ASSERTION_ERROR decorator.
      """
      queue = requests.get(
        url="http://%s:%s/api/queues/%s/%s" % (
          self.connParams.host,
          self.connParams.port,
          self.connParams.vhost,
          queueName),
        auth=(self.connParams.username, self.connParams.password)
      ).json()
      self.assertEqual(queue["messages_unacknowledged"], numTestMessages)
    _verifyUnacknowledgedMessages()

    self.client.recover(requeue=True)

    @_RETRY_ON_ASSERTION_ERROR
    def _verifyRecoveredMessages():
      """
      Verifies that messages are unacknowledged on server in nested function to
      use the _RETRY_ON_ASSERTION_ERROR decorator.
      """
      queue = requests.get(
        url="http://%s:%s/api/queues/%s/%s" % (
          self.connParams.host,
          self.connParams.port,
          self.connParams.vhost,
          queueName),
        auth=(self.connParams.username, self.connParams.password)
      ).json()
      self.assertIn("redeliver", queue["message_stats"])
      self.assertEqual(queue["message_stats"]["redeliver"], numTestMessages)
    _verifyRecoveredMessages()

    for i in range(0, numTestMessages):
      self.assertEqual(self.client.getNextEvent().body,
                       "test-msg-%d" % (i))


  def testAckingMessages(self):
    """ Tests acking messages """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName = "testQueue"
    routingKey = "testKey"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName)
    self.client.bindQueue(queueName, exchangeName, routingKey)

    numTestMessages = randint(1,5)
    for i in range(0, numTestMessages):
      # Test random numbers of messages sent to the queue
      self.client.publish(Message("test-msg-%d" % (i)),
                          exchangeName,
                          routingKey)
    self._verifyQueue(queueName, testMessageCount=numTestMessages)

    self.client.createConsumer(queueName)
    self.assertTrue(self.client.hasEvent())

    for i in range(0, numTestMessages):
      self.client.getNextEvent().ack()

    @_RETRY_ON_ASSERTION_ERROR
    def _verifyAcknowledgedMessages():
      """
      Verifies that messages are acked on server in nested function to
      use the _RETRY_ON_ASSERTION_ERROR decorator.
      """
      queue = requests.get(
        url="http://%s:%s/api/queues/%s/%s" % (
          self.connParams.host,
          self.connParams.port,
          self.connParams.vhost,
          queueName),
        auth=(self.connParams.username, self.connParams.password)
      ).json()
      self.assertEqual(queue["messages"], 0)
      self.assertIn("ack", queue["message_stats"])
      self.assertEqual(queue["message_stats"]["ack"], numTestMessages)
    _verifyAcknowledgedMessages()


  def testNackingMessages(self):
    """Tests nacking messages """
    self._connectToClient()
    exchangeName = "testExchange"
    exchangeType = "direct"
    queueName = "testQueue"
    routingKey = "testKey"

    self.client.declareExchange(exchangeName, exchangeType)
    self.client.declareQueue(queueName)
    self.client.bindQueue(queueName, exchangeName, routingKey)

    numTestMessages = randint(1,5)
    for i in range(0, numTestMessages):
      # Test random numbers of messages sent to the queue
      self.client.publish(Message("test-msg-%d" % (i)),
                          exchangeName,
                          routingKey)
    self._verifyQueue(queueName, testMessageCount=numTestMessages)

    self.client.createConsumer(queueName)
    self.assertTrue(self.client.hasEvent())

    for i in range(0, numTestMessages):
      self.client.getNextEvent().nack()

    @_RETRY_ON_ASSERTION_ERROR
    def _verifyNackedMessages():
      """
      Verifies that messages are unacknowledged on server in nested function to
      use the _RETRY_ON_ASSERTION_ERROR decorator.
      """
      queue = requests.get(
        url="http://%s:%s/api/queues/%s/%s" % (
          self.connParams.host,
          self.connParams.port,
          self.connParams.vhost,
          queueName),
        auth=(self.connParams.username, self.connParams.password)
      ).json()
      self.assertEqual(queue["messages"], 0)
      self.assertEqual(queue["messages_unacknowledged"], 0)
    _verifyNackedMessages()




if __name__ == "__main__":
  unittest.main()
