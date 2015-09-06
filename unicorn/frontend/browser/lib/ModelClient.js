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


/**
 * Unicorn: ModelClient - Talk to a ModelServer over IPC or HTTP, gaining
 *  access to the Backend NuPIC Model Runner. Connects via HTTP or IPC adapter.
 *  ModelClientIPC adpater is currently a pseudo-library, using the magic of
 *  Electron's `remote` module.
 */

// externals

import isElectronRenderer from 'is-electron-renderer';

// internals

import ModelClientHTTP from './ModelClientHTTP';

let ModelClient;


// MAIN

if (isElectronRenderer) { // desktop
  let remote;
  try {
    remote = require('remote');
  } catch (error) {}
  ModelClient = remote.require('./lib/ModelServer'); // pseduo-ModelClientIPC
} else { // web
  ModelClient = ModelClientHTTP;
}


// EXPORT

export default ModelClient;
