#-------------------------------------------------------------------------------
# Copyright (C) 2013-2014 Numenta Inc. All rights reserved.
#
# The information and source code contained herein is the
# exclusive property of Numenta Inc.  No part of this software
# may be used, reproduced, stored or distributed in any form,
# without explicit written authorization from Numenta Inc.
#-------------------------------------------------------------------------------
""" `grok cloudwatch` CLI integration tests.
"""
import yaml
import os
import unittest2 as unittest
import re
from subprocess import (
  call,
  PIPE,
  Popen
)



CMD_ADD_METRIC = """
  grok cloudwatch add $GROK_API_HOST $GROK_API_KEY \
    --region=%s \
    --namespace=%s \
    --metric=%s \
    --dimensions %s %s
  """
CMD_CREDENTIALS = "grok credentials $GROK_API_HOST"
CMD_DELETE_MODEL = "grok DELETE $GROK_API_HOST/_models/%s $GROK_API_KEY"
CMD_GET_AVAILABLE_METRICS = \
  "grok GET $GROK_API_HOST/_metrics/cloudwatch/regions/%s $GROK_API_KEY"
CMD_GET_MODEL = "grok GET $GROK_API_HOST/_models/%s $GROK_API_KEY"
CMD_GET_REGIONS = "grok GET $GROK_API_HOST/_metrics/cloudwatch $GROK_API_KEY"



class TestCloudWatch(unittest.TestCase):
  """ Test `grok cloudwatch` command """

  def _executeGrokCLI(self, cmd):
    """ Helper method for executing Grok CLI command using Popen() """
    result = Popen(
      [cmd],
      shell=True,
      env=dict(os.environ.items() + self.env.items()),
      stdout=PIPE,
      stderr=PIPE)
    result.wait()
    (stdout, stderr) = result.communicate()
    self.assertFalse(result.returncode, """`%s` returned non-zero exit code.

      STDOUT: %s
      STDERR: %s""" % (cmd, stdout, stderr))
    return stdout.strip()


  def setUp(self):
    self.env = {"GROK_API_HOST": "https://localhost"}

    # Save AWS credentials, get API key
    self.env["GROK_API_KEY"] = self._executeGrokCLI(CMD_CREDENTIALS)


  def testCreate(self):
    """ Grok CLI can create cloudwatch models """

    # Get list of regions
    cloudwatch = yaml.load(self._executeGrokCLI(CMD_GET_REGIONS))

    # We'll attempt to create three models for three different metric
    # namespaces in the available regions

    count = 0
    namespaces = set()
    for region in cloudwatch["regions"]:
      # Get available metrics for region
      metrics = \
        yaml.load(self._executeGrokCLI(CMD_GET_AVAILABLE_METRICS % region))

      for metric in metrics:
        if metric["namespace"] in namespaces:
          # Skip.  Already created a model in this namespace
          continue

        # Construct `grok cloudwatch add` command

        (dimension, value) = next(iter(metric["dimensions"].items()))
        dimensionValue = next(iter(value))
        cmd = re.sub(" +", " ", CMD_ADD_METRIC.strip()) % (
          region,
          metric["namespace"],
          metric["metric"],
          dimension,
          dimensionValue)

        # Run `grok cloudwatch add` command
        uid = self._executeGrokCLI(cmd)

        # Compare result to original metric returned by the cloudwatch api
        model = yaml.load(self._executeGrokCLI(CMD_GET_MODEL % uid))
        params = yaml.load(model["parameters"])

        self.assertEqual(uid, model["uid"])
        self.assertEqual(metric["region"], region)
        self.assertEqual(metric["region"], model["location"])
        self.assertEqual(metric["identifier"], model["server"])

        self.addCleanup(self._executeGrokCLI,CMD_DELETE_MODEL % uid)

        namespaces.add(metric["namespace"])
        count += 1
        if count > 2:
          break

      else:
        self.fail("Unable to create enough models")

      if count > 2:
        break
    else:
      self.fail("Unable to create enough models")



