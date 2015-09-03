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

const CONFIG_PATH = path.join('frontend', 'config');
const NODE_ENV = process.env.NODE_ENV || 'development';
const UNICORN_TARGET = process.env.UNICORN_TARGET || 'desktop';


// MAIN

/**
 *
 */
var ConfigServer = function () {
  // init config
  return nconf.defaults({ NODE_ENV, UNICORN_TARGET })
    .file(path.join(CONFIG_PATH, 'default.json'))
    .file('environment', path.join(CONFIG_PATH, 'environment.' + NODE_ENV + '.json'))
    .file('target', path.join(CONFIG_PATH, 'target.' + UNICORN_TARGET + '.json'));
};


// EXPORTS

module.exports = ConfigServer;
