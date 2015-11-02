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
Unittest of taurus/monitoring/supervisord_monitor/supervisord_monitor.py
"""
from mock import Mock, patch
import unittest
import os

#from nta.utils.config import Config
from nta.utils.test_utils import patch_helpers

from taurus.monitoring.supervisord_monitor.supervisord_monitor import (
  SupervisorChecker
)
from taurus.monitoring.supervisord_monitor import (
  taurus_collector_supervisord_monitor,
  taurus_server_supervisord_monitor
)


# Absolute path to directory in which test.conf configuration file may be found
_CONF_DIR = os.path.dirname(os.path.abspath(__file__))
_TEST_CONF_FILEPATH = os.path.join(_CONF_DIR, "test.conf")



class SupervisorCheckerTest(unittest.TestCase):

  # Mock command line arguments, specifying test config file and ommitting
  # serverUrl
  @patch_helpers.patchCLIArgs("taurus-server-supervisor-monitor",
                              "--monitorConfPath",
                              _TEST_CONF_FILEPATH,
                              "--serverUrl",
                              "http://127.0.0.1:9001")
  @patch("taurus.monitoring.supervisord_monitor.supervisord_monitor"
         ".SupervisorClient", autospec=True)
  # Prevent notifications from being dispatched
  @patch("taurus.monitoring.supervisord_monitor.supervisord_monitor"
         ".SupervisorChecker.dispatchNotification")
  # Disable pylint warning re: unused dispatchNotificationMock argument
  # pylint: disable=W0613
  def testCheckAll(self, dispatchNotificationMock, supervisorClientMock):
    runningState = {"statename": "RUNNING"}
    getStateMock = Mock(return_value=runningState)
    getAllProcessInfoMock = Mock(return_value=[runningState])

    supervisorClientMock.return_value = Mock(
      supervisor=Mock(
        getState=getStateMock,
        getAllProcessInfo=getAllProcessInfoMock))

    SupervisorChecker().checkAll()

    getStateMock.assert_any_call()
    getAllProcessInfoMock.assert_any_call()
    self.assertFalse(dispatchNotificationMock.called,
                     "An error would have been reported when all states are "
                     "'RUNNING'")


  # Mock command line arguments, specifying test config file and ommitting
  # serverUrl
  @patch_helpers.patchCLIArgs("taurus-server-supervisor-monitor",
                              "--monitorConfPath",
                              _TEST_CONF_FILEPATH,
                              "--serverUrl",
                              "http://127.0.0.1:9001")
  @patch("taurus.monitoring.supervisord_monitor.supervisord_monitor"
         ".SupervisorClient", autospec=True)
  # Prevent notifications from being dispatched
  @patch("taurus.monitoring.supervisord_monitor.supervisord_monitor"
         ".SupervisorChecker.dispatchNotification")
  # Disable pylint warning re: unused dispatchNotificationMock argument
  # pylint: disable=W0613
  def testCheckAllNotifiesOnSupervisorClientFailure(self,
                                                    dispatchNotificationMock,
                                                    supervisorClientMock):
    noneState = None
    getStateMock = Mock(return_value=noneState)
    getAllProcessInfoMock = Mock(return_value=[noneState])

    supervisorClientMock.return_value = Mock(
      supervisor=Mock(
        getState=getStateMock,
        getAllProcessInfo=getAllProcessInfoMock))

    SupervisorChecker().checkAll()

    getStateMock.assert_any_call()
    getAllProcessInfoMock.assert_any_call()
    self.assertEqual(dispatchNotificationMock.call_count, 2)


  # Mock command line arguments, specifying test config file and ommitting
  # serverUrl
  @patch_helpers.patchCLIArgs("taurus-server-supervisor-monitor",
                              "--monitorConfPath",
                              _TEST_CONF_FILEPATH,
                              "--serverUrl",
                              "http://127.0.0.1:9001")
  @patch("taurus.monitoring.supervisord_monitor.supervisord_monitor"
         ".SupervisorClient", autospec=True)
  # Prevent notifications from being dispatched
  @patch("taurus.monitoring.supervisord_monitor.supervisord_monitor"
         ".SupervisorChecker.dispatchNotification")
  # Disable pylint warning re: unused dispatchNotificationMock argument
  # pylint: disable=W0613
  def testCheckAllNotifiesOnSupervisorNotInRunningState(
      self,
      dispatchNotificationMock,
      supervisorClientMock):

    getStateMock = Mock(return_value={"statename": "FATAL"})
    getAllProcessInfoMock = Mock(return_value=[None])

    supervisorClientMock.return_value = Mock(
      supervisor=Mock(
        getState=getStateMock,
        getAllProcessInfo=getAllProcessInfoMock))

    SupervisorChecker().checkAll()

    getStateMock.assert_any_call()
    getAllProcessInfoMock.assert_any_call()
    self.assertEqual(dispatchNotificationMock.call_count, 2)


  # Mock command line arguments, specifying test config file and ommitting
  # serverUrl
  @patch_helpers.patchCLIArgs("taurus-server-supervisor-monitor",
                              "--monitorConfPath",
                              _TEST_CONF_FILEPATH,
                              "--serverUrl",
                              "http://127.0.0.1:9001")
  @patch("taurus.monitoring.supervisord_monitor.supervisord_monitor"
         ".SupervisorClient", autospec=True)
  # Prevent notifications from being dispatched
  @patch("taurus.monitoring.supervisord_monitor.supervisord_monitor"
         ".SupervisorChecker.dispatchNotification")
  # Disable pylint warning re: unused dispatchNotificationMock argument
  # pylint: disable=W0613
  def testCheckAllNotifiesOnGetAllProcessInfoFailure(self,
                                                     dispatchNotificationMock,
                                                     supervisorClientMock):
    getStateMock = Mock(return_value={"statename": "RUNNING"})
    getAllProcessInfoMock = Mock(return_value=[None])

    supervisorClientMock.return_value = Mock(
      supervisor=Mock(
        getState=getStateMock,
        getAllProcessInfo=getAllProcessInfoMock))

    SupervisorChecker().checkAll()

    getStateMock.assert_any_call()
    getAllProcessInfoMock.assert_any_call()
    self.assertEqual(dispatchNotificationMock.call_count, 1)


  # Mock command line arguments, specifying test config file and ommitting
  # serverUrl
  @patch_helpers.patchCLIArgs("taurus-server-supervisor-monitor",
                              "--monitorConfPath",
                              _TEST_CONF_FILEPATH,
                              "--serverUrl",
                              "http://127.0.0.1:9001")
  @patch("taurus.monitoring.supervisord_monitor.supervisord_monitor"
         ".SupervisorClient", autospec=True)
  # Prevent notifications from being dispatched
  @patch("taurus.monitoring.supervisord_monitor.supervisord_monitor"
         ".SupervisorChecker.dispatchNotification")
  # Disable pylint warning re: unused dispatchNotificationMock argument
  # pylint: disable=W0613
  def testCheckAllNotifiesOnFatalProcess(self, dispatchNotificationMock,
                                         supervisorClientMock):

    getStateMock = Mock(return_value={"statename": "RUNNING"})
    getAllProcessInfoMock = Mock(return_value=[{"statename": "FATAL"}])

    supervisorClientMock.return_value = Mock(
      supervisor=Mock(
        getState=getStateMock,
        getAllProcessInfo=getAllProcessInfoMock))

    SupervisorChecker().checkAll()

    getStateMock.assert_any_call()
    getAllProcessInfoMock.assert_any_call()
    self.assertEqual(dispatchNotificationMock.call_count, 1)


  # Mock command line arguments, specifying test config file and ommitting
  # serverUrl
  @patch_helpers.patchCLIArgs("taurus-server-supervisor-monitor",
                              "--monitorConfPath",
                              _TEST_CONF_FILEPATH)
  # Prevent notifications from being dispatched
  @patch("taurus.monitoring.supervisord_monitor.supervisord_monitor"
         ".SupervisorChecker.dispatchNotification")
  # Disable pylint warning re: unused dispatchNotificationMock argument
  # pylint: disable=W0613
  def testMissingServerUrlArgRaisesParserError(self, dispatchNotificationMock):

    # Assert that not specifying a required --serverUrl option will result in
    # a parser error, and consequently a sys.exit(), as indicated by the
    # SystemExit exception
    with self.assertRaises(SystemExit):
      SupervisorChecker().checkAll()


  @staticmethod
  # Prevent SupervisorChecker from actually being instantiated
  @patch("taurus.monitoring.supervisord_monitor."
         "taurus_collector_supervisord_monitor.SupervisorChecker",
         autospec=True)
  def testTaurusCollectorSupervisordMonitorMain(supervisorCheckerMock):
    taurus_collector_supervisord_monitor.main()
    supervisorCheckerMock.assert_called_once_with()
    supervisorCheckerMock.return_value.checkAll.assert_called_once_with()


  @staticmethod
  # Prevent SupervisorChecker from actually being instantiated
  @patch("taurus.monitoring.supervisord_monitor."
         "taurus_server_supervisord_monitor.SupervisorChecker",
         autospec=True)
  def testTaurusServerSupervisordMonitorMain(supervisorCheckerMock):
    taurus_server_supervisord_monitor.main()
    supervisorCheckerMock.assert_called_once_with()
    supervisorCheckerMock.return_value.checkAll.assert_called_once_with()



if __name__ == "__main__":
  raise NotImplementedError("Test not meant to be run directly.")
