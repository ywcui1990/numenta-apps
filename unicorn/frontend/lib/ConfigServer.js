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
 * Unicorn: ConfigServer - Respond to a ConfigClient over IPC, sharing our
 *  access to the Node/io.js-layer config settings.
 *
 * Must be ES5 for now, Electron's `remote` doesn't seem to like ES6 Classes!
 */

// externals

import nconf from 'nconf';
import path from 'path';

// internals

const CONFIG_FILE = 'default.json';
const CONFIG_PATH = path.join('frontend', 'config');

let Defaults = {
  NODE_ENV: 'development',
  UNICORN_TARGET: 'desktop',
  TEST_HOST: 'http://localhost',
  TEST_PATH: '',
  TEST_PORT: 8008
};


// MAIN

/**
 *
 */
var ConfigServer = function () {
  let config = nconf.env().argv().defaults(Defaults);

  config.file(path.join(CONFIG_PATH, CONFIG_FILE));
  config.file(
    'environment',
    path.join(CONFIG_PATH, 'environment.' + config.get('NODE_ENV') + '.json')
  );
  config.file(
    'target',
    path.join(CONFIG_PATH, 'target.' + config.get('UNICORN_TARGET') + '.json')
  );

  return config;
};


// EXPORTS

module.exports = ConfigServer;
