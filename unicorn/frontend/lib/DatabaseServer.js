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
import jsonQuery from 'jsonquery-engine';
import levelQuery from 'level-queryengine';
import levelup from 'levelup';
import path from 'path';
import sublevel from 'level-sublevel';
import { Validator } from 'jsonschema';


// internals

import FileSchema from '../database/schema/File.json';
import MetricSchema from '../database/schema/Metric.json';

const DB_FILE_PATH = path.join('frontend', 'database', 'data', 'unicorn.json');


// MAIN

/**
 *
 */
var DatabaseServer = function () {
  this.validator = new Validator();
  // this.validator.addSchema(AddressSchema, '/Address');

  this.db = sublevel(levelup(DB_FILE_PATH, {
    db: jsondown,
    valueEncoding: 'json'
  }));
};

/**
 *
 */
DatabaseServer.prototype.get = function (key, callback) {
  this.db.get(key, callback);
};

/**
 *
 */
DatabaseServer.prototype.put = function (key, value, callback) {
  this.db.put(key, value, callback);
};

/**
 *
 */
DatabaseServer.prototype.putMetric = function (metric, callback) {
  let table = this.db.sublevel('metric');
  let validation = this.validator.validate(metric, MetricSchema);

  if(validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  table.put(metric.uid, metric, callback);
};

/**
 *
 */
DatabaseServer.prototype.getMetrics = function (query, callback) {
  let results = [];
  let table = levelQuery(this.db.sublevel('metric'));
  table.query.use(jsonQuery());
  // table.ensureIndex('last_rowid');
  table.query(query)
    .on('stats', () => {})
    .on('error', (error) => {
      callback(error, null);
    })
    .on('data', (result) => {
      results.push(result);
    })
    .on('end', (result) => {
      if(result) {
        results.push(result);
      }
      callback(null, results);
    });
};


// EXPORTS

module.exports = DatabaseServer;
