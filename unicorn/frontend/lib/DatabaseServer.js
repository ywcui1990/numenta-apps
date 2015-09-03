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
 * Unicorn: DatabaseServer - Respond to a DatabaseClient over IPC, sharing our
 *  access to a file-based Node/io.js database system, for heavy persistence.
 *
 * Must be ES5 for now, Electron's `remote` doesn't seem to like ES6 Classes!
 */

// externals

import jsondown from 'jsondown';
import levelup from 'levelup';
import path from 'path';
import { Validator } from 'jsonschema';

// internals

import AddressSchema from '../database/schema/Address.json';
import PersonSchema from '../database/schema/Person.json';

const DB_FILE_PATH = path.join('frontend', 'database', 'data', 'unicorn.json');


// MAIN

/**
 *
 */
var DatabaseServer = function () {
  this.validator = new Validator();
  this.validator.addSchema(AddressSchema, '/Address');

  this.database = levelup(DB_FILE_PATH, {
    db: jsondown,
    valueEncoding: 'json'
  });
};

/**
 *
 */
DatabaseServer.prototype.get = function (key, callback) {
  this.database.get(key, callback);
};

/**
 *
 */
DatabaseServer.prototype.put = function (key, value, callback) {
  let validation = this.validator.validate(value, PersonSchema);
  if(validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  this.database.put(key, value, callback);
};


// EXPORTS

module.exports = DatabaseServer;
