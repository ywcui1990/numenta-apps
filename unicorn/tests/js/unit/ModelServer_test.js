/* -----------------------------------------------------------------------------
 * Copyright © 2015, Numenta, Inc. Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for
 * more details.
 *
 * You should have received a copy of the GNU Affero Public License along with
 * this program. If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * -------------------------------------------------------------------------- */

'use strict';

import ModelServer from '../../../frontend/lib/ModelServer';
const assert = require('assert');

const STATS = '{"min": 0, "max": 10}';
const MODEL_ID = '1';
const INPUT_DATA = [1438649711, 835.93679];
const EXPECTED_RESULTS = '[0, 0.5]\n';

describe('ModelServer', () => {
  let server = new ModelServer();;

  beforeEach(() => {
    assert(server.createModel(MODEL_ID, STATS));
  });
  afterEach(() => {
    server.removeModel(MODEL_ID);
  });

  describe('makeSureModelExists', () => {
    it('Check model', (done) => {
      let models = server.getModels();
      assert(models.find(id => id === MODEL_ID), 'Model not found');
      done();
    });
  });

  describe('#sendData()', () => {
    it('Send data to child process stdin', (done) => {
      assert(server.sendData(MODEL_ID, INPUT_DATA));
      done();
    });
  });

  describe('Model Events', () => {
    it('Read data from child process', (done) => {
      server.on(MODEL_ID, (type, data) => {
        assert(type !== 'error', data);
        if (type === 'data') {
          assert.equal(data, EXPECTED_RESULTS);
          done();
        }
      });
      assert(server.sendData(MODEL_ID, INPUT_DATA));
    });

    it('Send bad data from child process', (done) => {
      server.on(MODEL_ID, (type, data) => {
        if (type === 'close') {
          return;
        } else if (type === 'error') {
          done();
        } else {
          assert.fail(type, 'error', 'Expecting "error" got "' + type
                          + ': ' + data + '"');
        }
      });
      assert(server.sendData(MODEL_ID, [0xbadbeef]));
    });
  });
});
