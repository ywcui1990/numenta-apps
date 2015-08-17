/*
 * Numenta Platform for Intelligent Computing (NuPIC)
 * Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero Public License for more details.
 *
 * You should have received a copy of the GNU Affero Public License
 * along with this program.  If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 *
 */

package com.groksolutions.grok.mobile.test.unit;

import com.groksolutions.grok.mobile.GrokApplication;
import com.groksolutions.grok.mobile.SortOrder;
import com.groksolutions.grok.mobile.service.GrokClientImpl;
import com.numenta.core.utils.mock.MockGrokClient;
import com.numenta.core.utils.mock.MockGrokClientFactory;

import android.test.ApplicationTestCase;
import android.test.suitebuilder.annotation.SmallTest;

/**
 * TODO Document
 */
public class GrokApplicationTest extends ApplicationTestCase<GrokApplication> {

    public GrokApplicationTest() {
        super(GrokApplication.class);
    }

    @Override
    protected void setUp() throws Exception {
        super.setUp();
        createApplication();
        GrokApplication.getInstance().setGrokClientFactory(new MockGrokClientFactory(new MockGrokClient(
                GrokClientImpl.GROK_SERVER_LATEST)));
        GrokApplication.stopServices();
    }

    @Override
    protected void tearDown() throws Exception {
        super.tearDown();
    }

    /**
     * Test method for {@link com.groksolutions.grok.mobile.GrokApplication#getSort()}.
     */
    @SmallTest
    public final void testGetSort() {
        GrokApplication.setSort(SortOrder.Name);
        assertEquals(SortOrder.Name, GrokApplication.getSort());
    }

    /**
     * Test method for
     * {@link com.groksolutions.grok.mobile.GrokApplication#getMetricUnit(String)}.
     */
    @SmallTest
    public final void testGetMetricUnit() {
        assertEquals("Count", GrokApplication.getMetricUnit("AWS/AutoScaling/GroupTotalInstances"));
        assertEquals("Count",
                GrokApplication.getMetricUnit("AWS/DynamoDB/ConsumedReadCapacityUnits"));
        assertEquals("Count",
                GrokApplication.getMetricUnit("AWS/DynamoDB/ConsumedWriteCapacityUnits"));
        assertEquals("Count", GrokApplication.getMetricUnit("AWS/DynamoDB/ReturnedItemCount"));
        assertEquals("Milliseconds",
                GrokApplication.getMetricUnit("AWS/DynamoDB/SuccessfulRequestLatency"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/EBS/VolumeQueueLength"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/EBS/VolumeReadBytes"));
        assertEquals("Seconds", GrokApplication.getMetricUnit("AWS/EBS/VolumeTotalReadTime"));
        assertEquals("Seconds", GrokApplication.getMetricUnit("AWS/EBS/VolumeTotalWriteTime"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/EBS/VolumeWriteBytes"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/EC2/CPUUtilization"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/EC2/DiskReadBytes"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/EC2/DiskWriteBytes"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/EC2/NetworkIn"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/EC2/NetworkOut"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/ElastiCache/CPUUtilization"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/ElastiCache/NetworkBytesIn"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/ElastiCache/NetworkBytesOut"));
        assertEquals("Seconds", GrokApplication.getMetricUnit("AWS/ELB/Latency"));
        assertEquals("Count", GrokApplication.getMetricUnit("AWS/ELB/RequestCount"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/OpsWorks/cpu/idle"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/OpsWorks/cpu/nice"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/OpsWorks/cpu/system"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/OpsWorks/cpu/user"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/OpsWorks/cpu/waitio"));
        assertEquals("None", GrokApplication.getMetricUnit("AWS/OpsWorks/load/5"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/OpsWorks/memory/buffers"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/OpsWorks/memory/cached"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/OpsWorks/memory/free"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/OpsWorks/memory/swap"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/OpsWorks/memory/total"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/OpsWorks/memory/used"));
        assertEquals("None", GrokApplication.getMetricUnit("AWS/OpsWorks/procs"));
        assertEquals("Percent", GrokApplication.getMetricUnit("AWS/RDS/CPUUtilization"));
        assertEquals("Count", GrokApplication.getMetricUnit("AWS/RDS/DatabaseConnections"));
        assertEquals("Count", GrokApplication.getMetricUnit("AWS/RDS/DiskQueueDepth"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/RDS/FreeableMemory"));
        assertEquals("Count/Second", GrokApplication.getMetricUnit("AWS/RDS/ReadIOPS"));
        assertEquals("Seconds", GrokApplication.getMetricUnit("AWS/RDS/ReadLatency"));
        assertEquals("Bytes/Second", GrokApplication.getMetricUnit("AWS/RDS/ReadThroughput"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/RDS/SwapUsage"));
        assertEquals("Count/Second", GrokApplication.getMetricUnit("AWS/RDS/WriteIOPS"));
        assertEquals("Seconds", GrokApplication.getMetricUnit("AWS/RDS/WriteLatency"));
        assertEquals("Bytes/Second", GrokApplication.getMetricUnit("AWS/RDS/WriteThroughput"));
        assertEquals("Count", GrokApplication.getMetricUnit("AWS/Redshift/DatabaseConnections"));
        assertEquals("Count", GrokApplication.getMetricUnit("AWS/SNS/NumberOfMessagesPublished"));
        assertEquals("Count", GrokApplication.getMetricUnit("AWS/SQS/NumberOfEmptyReceives"));
        assertEquals("Count", GrokApplication.getMetricUnit("AWS/SQS/NumberOfMessagesDeleted"));
        assertEquals("Count", GrokApplication.getMetricUnit("AWS/SQS/NumberOfMessagesSent"));
        assertEquals("Count", GrokApplication.getMetricUnit("AWS/SQS/NumberOfMessagesReceived"));
        assertEquals("Bytes", GrokApplication.getMetricUnit("AWS/SQS/SentMessageSize"));
    }
}
