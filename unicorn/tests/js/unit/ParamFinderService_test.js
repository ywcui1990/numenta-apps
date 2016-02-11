/* -----------------------------------------------------------------------------
 * Copyright © 2016, Numenta, Inc. Unless you have purchased from
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

import path from 'path';
import {
  ParamFinderService, PARAM_FINDER_EVENT_TYPE
} from '../../../js/main/ParamFinderService';
const assert = require('assert');

const PARAM_FINDER_RUNNER_INPUT = require('./fixtures/param_finder_input.json');
PARAM_FINDER_RUNNER_INPUT['csv'] = path.join(__dirname, 'fixtures',
  'rec-center.csv');
const PARAM_FINDER_OUTPUT = require('./fixtures/param_finder_output.json');

/* eslint-disable max-nested-callbacks */

describe('ParamFinderService', () => {

  let service = new ParamFinderService();
  let inputOpt = PARAM_FINDER_RUNNER_INPUT;
  beforeEach(() => {
    service.startParamFinder(inputOpt);
  });

  afterEach(() => {
    try {
      service.stopParamFinder();
    } catch (ignore) {
      /* It may be closed by the test itself */
    }
  });

  describe('#isRunning()', () => {
    it('Should return true', (done) => {
      let paramFinderIsRunning = service.isRunning();
      assert(paramFinderIsRunning, 'Param Finder is not running');
      done();
    });

  });

  describe('#getParamFinder()', () => {
    it('Should return a non-null value', (done) => {
      let paramFinder = service.getParamFinder();
      assert.notEqual(paramFinder, null,
        'Param finder process was not started');
      done();
    });
  });

  describe('Param Finder Events', () => {

    it('Should read data from Param Finder', (done) => {
      service.on(PARAM_FINDER_EVENT_TYPE, (type, data) => {

        assert.notEqual(type, 'error', 'Event type should be data');
        if (type === 'data') {
          assert.deepEqual(JSON.parse(data), PARAM_FINDER_OUTPUT,
            'Param finder is not retuning the right result.');
          service.removeAllListeners(PARAM_FINDER_EVENT_TYPE);
          done();
        }
      });
    });
  });


  describe('Param Finder concurrency', () => {
    it('Should not start another param finder process', (done) => {
      assert.throws(() => {
        service.startParamFinder(PARAM_FINDER_RUNNER_INPUT);
      }, /Param finder process is already running./);
      done();
    });
  });

});
