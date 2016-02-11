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

import getPortablePython from './PortablePython';
import childProcess from 'child_process';
import EventEmitter from 'events';
import path from 'path';
import UserError from './UserError';

export const PARAM_FINDER_EVENT_TYPE = 'PARAM_FINDER_EVENT_TYPE';

const PYTHON_EXECUTABLE = getPortablePython();
const PARAM_FINDER_PATH = path.join(
  __dirname, '..', '..', 'py', 'unicorn_backend', 'param_finder_runner.py'
);


/**
 * Thrown when attempting to start more than one param finder process.
 */
export class MaximumConcurrencyError extends UserError {
  constructor() {
    super('Param finder process is already running.');
  }
}


/**
 * Unicorn: ParamFinderService - Respond to a ParamFinderClient over IPC,
 * sharing our access to Unicorn Backend Param Finder Runner python.
 */
export class ParamFinderService extends EventEmitter {
  constructor(...args) {
    super(...args);

    this._paramFinder = null;

  }


  /**
   * Start the param finder.
   * @param  {Object} inputOpt - Input options.
   *  See 'input_opt_schema_param_finder.json'
   * @throws {@link MaximumConcurrencyError}
   */
  startParamFinder(inputOpt) {

    if (this.isRunning()) {
      throw MaximumConcurrencyError
    }

    const params = [PARAM_FINDER_PATH,
      '--input', JSON.stringify(inputOpt)
    ];
    const child = childProcess.spawn(PYTHON_EXECUTABLE, params);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.on('error', (error) => {
      this.emit(PARAM_FINDER_EVENT_TYPE, 'error', error);
    });

    child.stderr.on('data', (error) => {
      this.emit(PARAM_FINDER_EVENT_TYPE, 'error', error);
    });

    child.stdout.on('data', (data) => {
      this.emit(PARAM_FINDER_EVENT_TYPE, 'data', data);
    });

    child.once('close', (code) => {
      this._paramFinder = null;
      this.emit(PARAM_FINDER_EVENT_TYPE, 'close', code);
    });

    this._paramFinder = {inputOpt, child};
  }

  /**
   * Return whether the param finder is running or not.
   * @return {Boolean} - True if param finder is running. False otherwise.
   */
  isRunning() {
    return this._paramFinder !== null;
  }

  /**
   * Return the param finder currently running.
   * @return {Object} - The param finder and its runtime params.
   */
  getParamFinder() {
    return this._paramFinder;
  }

  /**
   * Stop param finder .
   */
  stopParamFinder() {
    if (this.isRunning()) {
      this._paramFinder.child.kill();
      this._paramFinder = null;
      this.removeAllListeners(PARAM_FINDER_EVENT_TYPE);
    }
  }

}
