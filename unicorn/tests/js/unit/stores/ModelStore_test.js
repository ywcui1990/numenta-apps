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

import ModelStore from '../../../../js/browser/stores/ModelStore';

// const assert = require('assert');

// const EXPECTED_SINGLE_FILE = [{
//   name: 'file.csv',
//   filename: '../fixtures/file.csv',
//   type: 'uploaded'
// }];
//
// const EXPECTED_MULTIPLE_FILES = [{
//   name: 'file1.csv',
//   filename: 'fixtures/file1.csv',
//   type: 'sample'
// },{
//   name: 'file2.csv',
//   filename: 'fixtures/file2.csv',
//   type: 'sample'
// }];


/**
 * Test ModelStore (FLUXible Store in GUI)
 */
describe('ModelStore', () => {
  let store;

  beforeEach(() => {
    store = new ModelStore();
  });

  it('#_addModels', (done) => {
    store = store;
    done();
    // store._handleSetFile(EXPECTED_SINGLE_FILE[0]);
    // assert.deepEqual(store.getFiles(), EXPECTED_SINGLE_FILE);
  });

  it('#_deleteModel', (done) => {
    done();
    // store._handleListFiles(EXPECTED_MULTIPLE_FILES);
    // assert.deepEqual(store.getFiles(), EXPECTED_MULTIPLE_FILES);
  });

  it('#_handleModelFailed', (done) => {
    done();
  });

  it('#_hideModel', (done) => {
    done();
  });

  it('#_showModel', (done) => {
    done();
  });

  it('#_startModel', (done) => {
    done();
  });

  it('#_stopModel', (done) => {
    done();
  });

  it('#getModel', (done) => {
    done();
  });

  it('#getModels', (done) => {
    done();
  });
});
