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

'use strict';

import FileStore from '../../../frontend/browser/stores/FileStore';

const assert = require('assert');

const EXPECTED_SINGLE_FILE = [{
  name: 'file.csv',
  filename: 'fixtures/file.csv',
  type: 'upload'
}];
const EXPECTED_MULTIPLE_FILES = [{
  name: 'file1.csv',
  filename: 'fixtures/file1.csv',
  type: 'sample'
},{
  name: 'file2.csv',
  filename: 'fixtures/file2.csv',
  type: 'sample'
}];
const EXPECTED_METRICS = [
  {name: 'timestamp', type: 'date'},
  {name: 'metric', type: 'number'},
];

describe('FileStore', () => {

  let store;

  beforeEach(function () {
    store = new FileStore();
  });

  it('#_handleAddFile', (done) => {
    store._handleAddFile(EXPECTED_SINGLE_FILE[0]);
    assert.deepEqual(store.getFiles(), EXPECTED_SINGLE_FILE);
    done();
  });
  it('#_handleListFiles', (done) => {
    store._handleListFiles(EXPECTED_MULTIPLE_FILES);
    assert.deepEqual(store.getFiles(), EXPECTED_MULTIPLE_FILES);
    done();
  });
  it('#_handleListMetrics', (done) => {
    store._handleListFiles(EXPECTED_MULTIPLE_FILES);
    let filename = EXPECTED_MULTIPLE_FILES[0].filename;
    store._handleListMetrics({filename: filename, metrics: EXPECTED_METRICS});
    let files = store.getFiles();
    assert.deepEqual(files[0].metrics, EXPECTED_METRICS);
    done();
  });
});
