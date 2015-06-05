#!/usr/bin/env python
# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------

"""
unit tests for taurus.metric_collectors.twitterdirect.twitter_direct_agent
"""

from datetime import datetime
import json
import unittest

from mock import Mock

from taurus.metric_collectors.twitterdirect import twitter_direct_agent



class TweetStorerTestCase(unittest.TestCase):


  def testCurentStreamStatsRudimentary(self):
    """ Very rudimentary tests of TweetStorer._CurrentStreamStats
    """
    stats = twitter_direct_agent.TweetStorer._CurrentStreamStats()

    # Make sure that str doesn't crash on stats with default attributes
    str(stats)

    # Change stats and make sure that str doesn't crash
    stats.numTweets = 5
    stats.numUntaggedTweets = 1
    stats.numDeleteStatuses = 2
    stats.numLimitStatuses = 3
    stats.numLimitedTweets = 100
    stats.numDisconnectStatuses = 4
    stats.numWarningStatuses = 5
    stats.numOtherStatuses = 6
    stats.startingDatetime = datetime.utcnow()
    str(stats)


  def testRuntimeStreamingStatsRudimentary(self):
    """ Very rudimentary tests of TweetStorer._RuntimeStreamingStats
    """
    stats = twitter_direct_agent.TweetStorer._RuntimeStreamingStats()

    # Make sure that str doesn't crash on stats with default attributes
    str(stats)

    # Change stats and make sure that str doesn't crash
    stats.numTweets = 5
    stats.numUntaggedTweets = 1
    stats.numDeleteStatuses = 2
    stats.numLimitStatuses = 3
    stats.numLimitedTweets = 100
    stats.numDisconnectStatuses = 4
    stats.numWarningStatuses = 5
    stats.numOtherStatuses = 6
    stats.streamNumber = 7
    str(stats)


  def testReapMessagesEmptySequence(self):
    """ Test handling of empty message sequence by TweetStorer._reapMessages
    """
    storer = twitter_direct_agent.TweetStorer(
      taggingMap=Mock(),
      aggSec=300,
      msgQ=Mock(),
      echoData=False)

    # Test passing empty sequence of messages
    tweets, deletes = storer._reapMessages([])
    self.assertSequenceEqual(tweets, [])
    self.assertSequenceEqual(deletes, [])


  def testReapMessagesWithLimitNotifications(self):
    """ Test handling of "limit" notifications in TweetStorer._reapMessages
    """
    storer = twitter_direct_agent.TweetStorer(
      taggingMap=Mock(),
      aggSec=300,
      msgQ=Mock(),
      echoData=False)

    # Test first connection marker and limit
    tweets, deletes = storer._reapMessages(
      [
        twitter_direct_agent.TwitterStreamListener.ConnectionMarker,
        json.dumps(dict(limit=dict(track=5)))
      ])

    self.assertSequenceEqual(tweets, [])
    self.assertSequenceEqual(deletes, [])

    self.assertEqual(storer._currentStreamStats.numLimitStatuses, 1)
    self.assertEqual(storer._currentStreamStats.numLimitedTweets, 5)
    self.assertEqual(storer._runtimeStreamingStats.numLimitStatuses, 1)
    self.assertEqual(storer._runtimeStreamingStats.numLimitedTweets, 5)
    self.assertEqual(storer._runtimeStreamingStats.streamNumber, 1)

    # Test out-of-order limit: should be counted in numLimitStatuses, but
    # ignored in numLimitedTweets
    tweets, deletes = storer._reapMessages(
      [json.dumps(dict(limit=dict(track=1)))])

    self.assertSequenceEqual(tweets, [])
    self.assertSequenceEqual(deletes, [])

    self.assertEqual(storer._currentStreamStats.numLimitStatuses, 2)
    self.assertEqual(storer._currentStreamStats.numLimitedTweets, 5)
    self.assertEqual(storer._runtimeStreamingStats.numLimitStatuses, 2)
    self.assertEqual(storer._runtimeStreamingStats.numLimitedTweets, 5)

    # Test two more in-order limits
    tweets, deletes = storer._reapMessages(
      [
        json.dumps(dict(limit=dict(track=9))),
        json.dumps(dict(limit=dict(track=12))),
      ])

    self.assertSequenceEqual(tweets, [])
    self.assertSequenceEqual(deletes, [])

    self.assertEqual(storer._currentStreamStats.numLimitStatuses, 4)
    self.assertEqual(storer._currentStreamStats.numLimitedTweets, 12)
    self.assertEqual(storer._runtimeStreamingStats.numLimitStatuses, 4)
    self.assertEqual(storer._runtimeStreamingStats.numLimitedTweets, 12)

    # Test reconnect and one limit notification on the new connection
    tweets, deletes = storer._reapMessages(
      [
        twitter_direct_agent.TwitterStreamListener.ConnectionMarker,
        json.dumps(dict(limit=dict(track=1000))),
      ])

    self.assertSequenceEqual(tweets, [])
    self.assertSequenceEqual(deletes, [])

    self.assertEqual(storer._currentStreamStats.numLimitStatuses, 1)
    self.assertEqual(storer._currentStreamStats.numLimitedTweets, 1000)
    self.assertEqual(storer._runtimeStreamingStats.numLimitStatuses, 5)
    self.assertEqual(storer._runtimeStreamingStats.numLimitedTweets, 1012)
    self.assertEqual(storer._runtimeStreamingStats.streamNumber, 2)



if __name__ == "__main__":
  unittest.main()
