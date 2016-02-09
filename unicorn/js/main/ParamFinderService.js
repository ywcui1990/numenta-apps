// Copyright © 2016, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero Public License version 3 as published by the Free
// Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/

import childProcess from 'child_process';
import EventEmitter from 'events';
import path from 'path';
import system from 'os';
import UserError from './UserError';

// @todo https://bitbucket.org/anthony_tuininga/cx_freeze/issues/161
const MODEL_RUNNER_PATH = path.join(
    __dirname, '..', '..', 'py', 'unicorn_backend', 'mock_param_finder.py'
);

/**
 * Unicorn: ParamFinderService - Respond to a ParamFinderClient over IPC, sharing our access
 * to Unicorn Backend Param Finder Runner python.
 */
export class ParamFinderService extends EventEmitter {
    constructor(...args) {
        super(...args);
    }

}