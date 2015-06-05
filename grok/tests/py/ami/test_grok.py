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
AMI unit tests for base grok tooling
"""
import agamotto
import os
import unittest


GROK_PACKAGES = [
  "grok-saltcellar",
  "nta-git",
  "nta-products-grok",
  "numenta-infrastructure-python"
]

GROK_SCRIPTS = [
  "/usr/local/bin/run-grok-tests",
  "/usr/local/sbin/update-motd"
]

GROK_CONFIG_FILES = [
  "/opt/numenta/products/grok/conf/grok-api.conf",
  "/opt/numenta/products/grok/conf/application.conf",
  "/opt/numenta/products/nta.utils/conf/logging.conf",
  "/opt/numenta/products/grok/conf/model-swapper.conf",
  "/opt/numenta/products/grok/conf/nginx-maint.conf",
  "/opt/numenta/products/grok/conf/product.conf",
  "/opt/numenta/products/grok/conf/quota.conf",
  "/opt/numenta/products/nta.utils/conf/rabbitmq.conf",
  "/opt/numenta/products/grok/conf/supervisord.conf"
]

GROK_PYDIR_BASE = "/opt/numenta/products/grok/grok"

class TestGrokInstallation(unittest.TestCase):


  def testNoGitInOptNumenta(self):
    self.assertFalse(agamotto.file.isDirectory("/opt/numenta/products/.git"),
                     "git directory found in /opt/numenta/products/.git!")


  def testGrokConfigurationFilesPresent(self):
    for confFile in GROK_CONFIG_FILES:
      self.assertTrue(agamotto.file.exists(confFile), "%s missing" % confFile)


  def testGrokDirectories(self):
    self.assertTrue(agamotto.file.isDirectory("/etc/grok"))


  def testGrokCronjobs(self):
    self.assertTrue(agamotto.cron.entry(
      "7 * * * * /usr/local/sbin/lockrun --lockfile=/var/lock/shuffle_groklogs -- /usr/local/sbin/shuffle_groklogs 2>&1 | logger -t gs-shuffle-groklogs"))


  def testGrokPackagesAreInstalled(self):
    for packageName in GROK_PACKAGES:
      self.assertTrue(agamotto.package.installed(packageName),
                      "Package %s not installed" % packageName)


  def testLogwriterCredentialFilePresent(self):
    self.assertTrue(agamotto.file.exists(
                    "/etc/grok/logwriter_credentials.json"))


  def testMetricCollectorIsRunning(self):
    self.assertTrue(agamotto.process.running(
                    "python -m grok.app.runtime.metric_collector"))


  def testAnomalyServiceIsRunning(self):
    self.assertTrue(agamotto.process.running(
                    "python -m htmengine.runtime.anomaly_service"))


  def testModelSchedulerIsRunning(self):
    self.assertTrue(agamotto.process.running(
      "python -m htmengine.model_swapper.model_scheduler_service"))


  def testGrokScriptsAreInstalled(self):
    for scriptName in GROK_SCRIPTS:
      self.assertTrue(agamotto.file.exists(scriptName),
                      "%s is missing" % scriptName)
      self.assertTrue(agamotto.file.mode(scriptName) == "755")


  def testNginxServiceEnabled(self):
    self.assertTrue(agamotto.service.enabled("grok-preload"))


  def testGrokServicesEnabled(self):
    self.assertTrue(agamotto.service.enabled("grokservices"))


  def testGrokupdates(self):
    self.assertTrue(agamotto.service.enabled("grokupdates"))


  def testSupervisordListening(self):
    self.assertTrue(agamotto.network.isListening(9001))


  def testSupervisordConfiguration(self):
    self.assertTrue(agamotto.file.exists("/etc/grok/supervisord.vars"))
    self.assertTrue(agamotto.file.exists("/etc/init.d/grokservices"))


  def testSupervisordInitscript(self):
    self.assertTrue(agamotto.file.contains("/etc/init.d/grokservices",
                    'su ec2-user -c "${supervisor_helper} start"'))
    self.assertTrue(agamotto.file.contains("/etc/init.d/grokservices",
                    'supervisor_helper="${NUMENTA}/supervisord-helper"'))


  def testGrokDatabaseExists(self):
    mysqlPasswordFile = "/etc/grok/mysql_password"
    sqlPrefix = "mysql -u root --silent "
    if os.path.isfile(mysqlPasswordFile):
      with open(mysqlPasswordFile) as passwordFile:
        mysqlPassword = passwordFile.read().strip()
        sqlPrefix = sqlPrefix + " --password=" + "'" + mysqlPassword + "' "
    raw = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'grok';"
    sqlQuery = sqlPrefix + '--execute "' + raw + '"' + "|grep '^grok$'"
    self.assertTrue(agamotto.process.stdoutContains(sqlQuery, 'grok'),
                    "grok database missing")



if __name__ == "__main__":
  unittest.main()
