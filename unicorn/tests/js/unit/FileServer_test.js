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


const assert = require('assert');

import path from 'path';

import FileServer from '../../../frontend/lib/FileServer';


// Contents of 'fixture/file.csv'
const EXPECTED_CONTENT =
`timestamp,metric
2015-08-26T19:46:31+17:00,21
2015-08-26T19:47:31+17:00,17
2015-08-26T19:48:31+17:00,22
2015-08-26T19:49:31+17:00,21
2015-08-26T19:50:31+17:00,16
2015-08-26T19:51:31+17:00,19
`;

// Expected data
const EXPECTED_DATA = [
  {timestamp: '2015-08-26T19:46:31+17:00', metric: '21'},
  {timestamp: '2015-08-26T19:47:31+17:00', metric: '17'},
  {timestamp: '2015-08-26T19:48:31+17:00', metric: '22'},
  {timestamp: '2015-08-26T19:49:31+17:00', metric: '21'},
  {timestamp: '2015-08-26T19:50:31+17:00', metric: '16'},
  {timestamp: '2015-08-26T19:51:31+17:00', metric: '19'},
];

// Expected fields
const EXPECTED_FIELDS = [{
  uid: 'TEST_UID_TS',
  'file_uid': 'TEST_FILE_UID_TS',
  name: 'timestamp',
  type: 'date'
}, {
  uid: 'TEST_UID_METRIC',
  'file_uid': 'TEST_FILE_UID_METRIC',
  name: 'metric',
  type: 'number'
}];
const EXPECTED_FIELDS_VALUE_TESTS = ['name', 'type'];

// Expected statistics for the whole file
const EXPECTED_MIN = 16;
const EXPECTED_MAX = 22;

// Expected statistics for the first 2 lines
const EXPECTED_MIN_PARTIAL = 17;
const EXPECTED_MAX_PARTIAL = 21;

// Keep this list up to date with file names in "frontend/samples"
const EXPECTED_SAMPLE_FILES = ['file1.csv', 'gym.csv'];

const FILENAME = path.resolve(__dirname, 'fixtures/file.csv');


describe('FileServer', () => {
  let server;

  beforeEach(function () {
    server = new FileServer();
  });

  describe('#getSampleFiles()', () => {
    it('List sample files', (done) => {
      server.getSampleFiles((error, files) => {
        assert.ifError(error);
        assert.deepEqual(files.map((f) => {
          return f.name;
        }), EXPECTED_SAMPLE_FILES, 'Got unexpected file names');
        assert(files.every((f) => {
          return f.type === 'sample';
        }), 'Expecting "sample" files only');
        done();
      });
    });
  });

  describe('#getContents', () => {
    it('Get File Contents', (done) => {
      server.getContents(FILENAME, (error, data) => {
        assert.ifError(error);
        assert.equal(data, EXPECTED_CONTENT, 'Got different file content');
        done();
      });
    });
  });

  describe('#getFields', () => {
    it('Get fields using default options', (done) => {
      server.getFields(FILENAME, (error, fields) => {
        assert.ifError(error);
        fields.forEach((field, index) => {
          // match object keys
          assert.deepEqual(
            Object.keys(fields[index]),
            Object.keys(EXPECTED_FIELDS[index]),
            'Got different Fields keys (all)'
          );
          // match certain key-specified values
          EXPECTED_FIELDS_VALUE_TESTS.forEach((valueTestKey) => {
            assert.equal(
              fields[index][valueTestKey],
              EXPECTED_FIELDS[index][valueTestKey],
              'Got different Fields values (specific keys only)'
            );
          });
        });
        done();
      });
    });
  });

  describe('#getData', () => {
    it('Get data using default options', (done) => {
      let i = 0;
      server.getData(FILENAME, (error, data) => {
        assert.ifError(error);
        if (data) {
          let row = JSON.parse(data);
          assert.deepEqual(row, EXPECTED_DATA[i++]);
        } else {
          done();
        }
      });
    });

    it('Get data with limit=1', (done) => {
      server.getData(FILENAME, {limit: 1}, (error, data) => {
        assert.ifError(error);
        if (data) {
          let row = JSON.parse(data);
          assert.deepEqual(row, EXPECTED_DATA[0]);
        } else {
          done();
        }
      });
    });
  });

  describe('#getStatistics', () => {
    it('Get statistics for the whole file', (done) => {
      server.getStatistics(FILENAME, (error, data) => {
        assert.ifError(error);
        assert.equal(data['metric'].min, EXPECTED_MIN);
        assert.equal(data['metric'].max, EXPECTED_MAX);
        done();
      });
    });

    it('Get statistics for some records of the file', (done) => {
      server.getStatistics(FILENAME, {limit: 2}, (error, data) => {
        assert.ifError(error);
        assert.equal(data['metric'].min, EXPECTED_MIN_PARTIAL);
        assert.equal(data['metric'].max, EXPECTED_MAX_PARTIAL);
        done();
      });
    });
  });
});
