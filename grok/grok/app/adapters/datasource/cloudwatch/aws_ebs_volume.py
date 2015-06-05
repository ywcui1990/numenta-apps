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
from boto import ec2

from grok.app.adapters.datasource.cloudwatch.aws_base import (
  AWSResourceAdapterBase)
from grok.app.adapters.datasource.cloudwatch.aws_base import ResourceTypeNames



@AWSResourceAdapterBase.registerResourceAdapter
class EBSAdapter(AWSResourceAdapterBase):
  RESOURCE_TYPE = ResourceTypeNames.EBS_VOLUME

  NAMESPACE = "AWS/EBS"

  # Cloudwatch metric dimension combinations supported by all metric adapters on
  # this resource;
  # NOTE: the first dimension name in each group is the dimension that
  # identifies the resource
  DIMENSION_GROUPS = (("VolumeId",),)


  @classmethod
  def describeResources(cls, region):
    """ Describe available SNS Topics in the given region.

    :param region: AWS region

    :returns: description of available EC2 Instances in the given region

    ::

        [
          {   # NOTE: grn = "grok resource name"
              "grn": "aws://us-west-2/Topic/i-4be0d87f",
              "resID": "i-4be0d87f",
              "name": value-of-name-tag-or-empty-str
          },

          ...
        ]
    """
    instanceType = cls.RESOURCE_TYPE[cls.RESOURCE_TYPE.rfind(':') + 1:]

    conn = cls._connectToAWSService(ec2, region)
    volumeList = [{"grn":"aws://%s/%s/%s" %
                         (region ,instanceType, vol.id),
                   "resID":vol.id,
                   "name":""} for vol in conn.get_all_volumes()]
    return volumeList


  def getMetricSummary(self):
    """ Get a short description of the metric

    NOTE: overrides method in base class

    :returns: a short description of the metric
    :rtype: string
    """
    return "%s on Volume %s in %s" % (
      self.METRIC_NAME, self._dimensions["VolumeId"], self._region)



@AWSResourceAdapterBase.registerMetricAdapter
class EBSVolumeQueueLengthMetricAdapter(EBSAdapter):

  METRIC_NAME = "VolumeQueueLength"

  STATISTIC = "Average"

  UNIT = "Count"

  # default min/max from legacy metric template
  MIN = 0
  MAX = None



@AWSResourceAdapterBase.registerMetricAdapter
class EBSVolumeReadBytesMetricAdapter(EBSAdapter):

  METRIC_NAME = "VolumeReadBytes"

  IS_INSTANCE_DEFAULT = True

  STATISTIC = "Average"

  UNIT = "Bytes"

  # default min/max from legacy metric template
  MIN = 0
  MAX = 1000000



@AWSResourceAdapterBase.registerMetricAdapter
class EBSVolumeTotalReadTimeMetricAdapter(EBSAdapter):

  METRIC_NAME = "VolumeTotalReadTime"

  STATISTIC = "Average"

  UNIT = "Seconds"

  # default min/max from legacy metric template
  MIN = 0
  MAX = None



@AWSResourceAdapterBase.registerMetricAdapter
class EBSVolumeTotalWriteTimeMetricAdapter(EBSAdapter):

  METRIC_NAME = "VolumeTotalWriteTime"

  STATISTIC = "Average"

  UNIT = "Seconds"

  # default min/max from legacy metric template
  MIN = 0
  MAX = None



@AWSResourceAdapterBase.registerMetricAdapter
class EBSVolumeWriteBytesMetricAdapter(EBSAdapter):

  METRIC_NAME = "VolumeWriteBytes"

  IS_INSTANCE_DEFAULT = True

  STATISTIC = "Average"

  UNIT = "Bytes"

  # default min/max from legacy metric template
  MIN = 0
  MAX = 1000000
