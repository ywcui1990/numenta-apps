// Numenta Platform for Intelligent Computing (NuPIC)
// Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero Public License version 3 as
// published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License
// along with this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/

import DatabaseService from '../../../js/main/DatabaseService';
import FileSchema from '../../../js/database/schema/File.json';
import fs from 'fs';
import MetricDataSchema from '../../../js/database/schema/MetricData.json'; // eslint-disable-line
import MetricSchema from '../../../js/database/schema/Metric.json';
import os from 'os';
import path from 'path';

const assert = require('assert');

const EXPECTED_FILE = {
  uid: 'id.1',
  name: 'file.1',
  filename: '/tmp/file.1',
  type: 'uploaded'
};
const EXPECTED_METRIC = {
  uid: 'id.1',
  file_uid: 'file.id.1',
  model_uid: 'model.id.1',
  name: 'file.1',
  type: 'date',
  min: 0,
  max: 100
};
const EXPECTED_METRIC_DATA = {
  uid: 'id.1',
  metric_uid: 'metric.id.1',
  rowid: 1,
  timestamp: '2015-01-01 00:00:00Z',
  metric_value: 1,
  display_value: 1,
  anomaly_score: 1,
  anomaly_likelihood: 1
};

const EXPECTED_EXPORTED_RESULTS =
`timestamp,metric_value,anomaly_likelihood
2015-01-01 00:00:00Z,1,1
2015-01-01 00:00:00Z,1,1
2015-01-01 00:00:00Z,1,1
2015-01-01 00:00:00Z,1,1`;

describe('DatabaseService', () => {
  let service;
  const TEMP_DIR = path.join(os.tmpDir(), 'unicorn_db');
  const FILENAME = path.join(TEMP_DIR, 'file.csv');

  before(() => {
    service = new DatabaseService(TEMP_DIR);
  });
  after(() => {
    service.close((err) => assert.ifError(err));
    service.destroy((err) => assert.ifError(err));
    fs.unlinkSync(FILENAME); // eslint-disable-line
  });

  describe('Schema', () => {
    it('should validate "File"', (done) => {
      let results = service.validator.validate(EXPECTED_FILE, FileSchema);
      assert(results.errors.length === 0, JSON.stringify(results.errors));
      done();
    });

    it('should validate "Metric"', (done) => {
      let results = service.validator.validate(EXPECTED_METRIC, MetricSchema);
      assert(results.errors.length === 0, JSON.stringify(results.errors));
      done();
    });

    it('should validate "MetricData"', (done) => {
      let results = service.validator.validate(EXPECTED_METRIC_DATA, MetricDataSchema); // eslint-disable-line
      assert(results.errors.length === 0, JSON.stringify(results.errors));
      done();
    });
  });

  /* eslint-disable max-nested-callbacks */
  describe('File Table', () => {
    it('should add a single file to the database', (done) => {
      service.putFile(EXPECTED_FILE, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should not add invalid file to the database', (done) => {
      let invalid = Object.assign({}, EXPECTED_FILE);
      delete invalid.uid; // eslint-disable-line
      service.putFile(invalid, (error) => {
        assert.ifError(!error);
        done();
      });
    });
    it('should add multiple files to the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_FILE, {uid});
      });
      service.putFileBatch(batch, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should load a single file from the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_FILE, {uid});
      });
      service.putFileBatch(batch, (error) => {
        assert.ifError(error);
        service.getFile(batch[0].uid, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch[0]);
          done();
        });
      });
    });
    it('should load multiple files from the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_FILE, {uid});
      });
      service.putFileBatch(batch, (error) => {
        assert.ifError(error);
        service.queryFile({}, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch);
          done();
        });
      });
    });
  });

  describe('Metric Table', () => {
    it('should add a single metric to the database', (done) => {
      service.putMetric(EXPECTED_METRIC, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should not add invalid metric to the database', (done) => {
      let invalid = Object.assign({}, EXPECTED_METRIC);
      delete invalid.uid; // eslint-disable-line
      service.putMetric(invalid, (error) => {
        assert.ifError(!error);
        done();
      });
    });
    it('should add multiple metrics to the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_METRIC, {uid});
      });
      service.putMetricBatch(batch, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should load a single metric from the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_METRIC, {uid});
      });
      service.putMetricBatch(batch, (error) => {
        assert.ifError(error);
        service.getMetric(batch[0].uid, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch[0]);
          done();
        });
      });
    });
    it('should load multiple metrics from the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_METRIC, {uid});
      });
      service.putMetricBatch(batch, (error) => {
        assert.ifError(error);
        service.queryMetric({}, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch);
          done();
        });
      });
    });
  });

  describe('MetricData Table', () => {
    it('should add a single MetricData record to the database', (done) => {
      service.putMetricData(EXPECTED_METRIC_DATA, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should not add invalid MetricData record to the database', (done) => {
      let invalid = Object.assign({}, EXPECTED_METRIC_DATA);
      delete invalid.uid; // eslint-disable-line
      service.putMetricData(invalid, (error) => {
        assert.ifError(!error);
        done();
      });
    });
    it('should add multiple MetricData records to the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid) => {
        return Object.assign({}, EXPECTED_METRIC_DATA, {uid, metric_uid: uid});
      });
      service.putMetricDataBatch(batch, (error) => {
        assert.ifError(error);
        done();
      });
    });
    it('should load multiple MetricData records from the database', (done) => {
      let batch = Array.from(['id.1', 'id.2'], (uid, idx) => {
        return Object.assign({}, EXPECTED_METRIC_DATA, {uid, rowid: idx});
      });
      service.putMetricDataBatch(batch, (error) => {
        assert.ifError(error);
        service.queryMetricData({}, (error, actual) => {
          assert.ifError(error);
          assert.deepStrictEqual(actual, batch);
          done();
        });
      });
    });
    it('should export MetricData from the database', (done) => {
      let batch = Array.from(['id.1', 'id.2', 'id.3', 'id.4'], (uid, idx) => {
        return Object.assign({}, EXPECTED_METRIC_DATA, {uid, rowid: idx});
      });
      service.putMetricDataBatch(batch, (error) => {
        assert.ifError(error);
        service.exportMetricData(
          EXPECTED_METRIC_DATA.metric_uid,
          FILENAME,
          (error, res) => {
            assert.ifError(error);
            fs.readFile(FILENAME, 'utf8', (error, data) => {
              assert.ifError(error);
              assert.equal(data, EXPECTED_EXPORTED_RESULTS);
              done();
            });
          }
        );
      });
    });
  });
});
