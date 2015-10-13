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

import jsonQuery from 'jsonquery-engine';
import levelQuery from 'level-queryengine';
import levelup from 'levelup';
import leveldown from 'leveldown';
import path from 'path';
import sublevel from 'level-sublevel';
import { Validator } from 'jsonschema';

// internals

import FileSchema from '../database/schema/File.json';
import MetricSchema from '../database/schema/Metric.json';
import MetricDataSchema from '../database/schema/MetricData.json';

const DB_FILE_PATH = path.join('frontend', 'database', 'data');


// MAIN

/**
 * Unicorn DatabaseServer
 * @class
 * @module
 * @param  {[string]} path database location (optional)
 * @returns {object} this
 * @this DatabaseServer
 */
var DatabaseServer = function(path) {
  this.validator = new Validator();
  // this.validator.addSchema(AddressSchema, '/Address');

  let location = path || DB_FILE_PATH;
  this.levelup = levelup(location, {
    valueEncoding: 'json'
  });
  this.db = sublevel(this.levelup);
};


// GETTERS

/**
 * Get a single File
 */
DatabaseServer.prototype.getFile = function(uid, callback) {
  let table = this.db.sublevel('file');
  table.get(uid, callback);
};

/**
 * Get all/queried Files
 */
DatabaseServer.prototype.getFiles = function(query, callback) {
  let results = [];
  let table = levelQuery(this.db.sublevel('file'));
  table.query.use(jsonQuery());
  table.query(query)
    .on('stats', () => {})
    .on('error', (error) => {
      callback(error, null);
    })
    .on('data', (result) => {
      results.push(result);
    })
    .on('end', (result) => {
      if (result) {
        results.push(result);
      }
      callback(null, results);
    });
};

/**
 * Get a single Metric
 */
DatabaseServer.prototype.getMetric = function(uid, callback) {
  let table = this.db.sublevel('metric');
  table.get(uid, callback);
};

/**
 * Get all/queried Metrics
 */
DatabaseServer.prototype.getMetrics = function(query, callback) {
  let results = [];
  let table = levelQuery(this.db.sublevel('metric'));
  table.query.use(jsonQuery());
  table.ensureIndex('file_uid');
  table.query(query)
    .on('stats', () => {})
    .on('error', (error) => {
      callback(error, null);
    })
    .on('data', (result) => {
      results.push(result);
    })
    .on('end', (result) => {
      if (result) {
        results.push(result);
      }
      callback(null, results);
    });
};

/**
 * Get all/queried MetricDatas records
 * @callback
 * @method
 * @param {object} query - DB Query filter object (jsonquery-engine),
 *  empty object "{}" for all results.
 * @param {function} [callback] - Async callback: function (error, results) {}
 * @public
 * @this DatabaseServer
 */
DatabaseServer.prototype.getMetricDatas = function(query, callback) {
  let results = [];
  let table = levelQuery(this.db.sublevel('metricData'));
  table.query.use(jsonQuery());
  table.ensureIndex('metric_uid');
  table.query(query)
    .on('stats', () => {})
    .on('error', (error) => {
      callback(error, null);
    })
    .on('data', (result) => {
      results.push(result);
    })
    .on('end', (result) => {
      if (result) {
        results.push(result);
      }

      // sort by uid, metric_uid, rowid
      results.sort((a, b) => {
        if (a.metric_uid === b.metric_uid) {
          if (a.uid === b.uid) {
            if (a.rowid > b.rowid) {
              return 1;
            }
            if (a.rowid < b.rowid) {
              return -1;
            }
            return 0;
          } else {
            return a.metric_uid.localeCompare(b.metric_uid);
          }
        } else {
          return a.uid.localeCompare(b.uid);
        }
      });

      callback(null, results);
    });
};


// SETTERS

/**
 * Put a single File to DB
 */
DatabaseServer.prototype.putFile = function(file, callback) {
  let table = this.db.sublevel('file');
  let validation = this.validator.validate(file, FileSchema);

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  table.put(file.uid, file, callback);
};

/**
 * Put multiple Files into DB
 * @callback
 * @method
 * @param {array} files - List of File objects to insert
 * @param {function} callback - Async result handler: function (error, results)
 * @public
 * @this DatabaseServer
 */
DatabaseServer.prototype.putFiles = function (files, callback) {
  let ops = [];
  let table = this.db.sublevel('file');

  // validate
  files.forEach((file) => {
    let validation = this.validator.validate(file, FileSchema);
    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }
  });

  // prepare
  ops = files.map((file) => {
    return {
      type: 'put',
      key: file.uid,
      value: file
    };
  });

  // execute
  table.batch(ops, callback);
};

/**
 * Put a single Metric to DB
 */
DatabaseServer.prototype.putMetric = function(metric, callback) {
  let table = this.db.sublevel('metric');
  let validation = this.validator.validate(metric, MetricSchema);

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  table.put(metric.uid, metric, callback);
};

/**
 * Put multiple Metrics into DB
 */
DatabaseServer.prototype.putMetrics = function(metrics, callback) {
  let ops = [];
  let table = this.db.sublevel('metric');

  // validate
  metrics.forEach((metric) => {
    let validation = this.validator.validate(metric, MetricSchema);
    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }
  });

  // prepare
  ops = metrics.map((metric) => {
    return {
      type: 'put',
      key: metric.uid,
      value: metric
    };
  });

  // execute
  table.batch(ops, callback);
};

/**
 * Put a single MetricData record to DB
 */
DatabaseServer.prototype.putMetricData = function(metricData, callback) {
  let table = this.db.sublevel('metricData');
  let validation = this.validator.validate(metricData, MetricDataSchema);

  if (typeof metricDatas === 'string') {
    // JSONify here to get around Electron IPC remote() memory leaks
    metricData = JSON.parse(metricData);
  }

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  table.put(metricData.uid, metricData, callback);
};

/**
 * Put multiple MetricData records into DB
 */
DatabaseServer.prototype.putMetricDatas = function(metricDatas, callback) {
  let ops = [];
  let table = this.db.sublevel('metricData');

  if (typeof metricDatas === 'string') {
    // JSONify here to get around Electron IPC remote() memory leaks
    metricDatas = JSON.parse(metricDatas);
  }

  // validate
  metricDatas.forEach((metricData) => {
    let validation = this.validator.validate(metricData, MetricDataSchema);
    if (validation.errors.length) {
      callback(validation.errors, null);
      return;
    }
  });

  // prepare
  ops = metricDatas.map((metricData) => {
    return {
      type: 'put',
      key: metricData.uid,
      value: metricData
    };
  });

  // execute
  table.batch(ops, callback);
};

/**
 * Completely remove an existing database directory.
 * @param  {Function} callback called when the destroy operation is complete,
 *                             with a possible error argument
 */
DatabaseServer.prototype.destroy = function(callback) {
  leveldown.destroy(this.levelup.location, callback);
};


/**
 * closes the underlying LevelDB store
 * @param  {Function} callback receive any error encountered during closing as
 *                             the first argument
 */
DatabaseServer.prototype.close = function(callback) {
  this.levelup.db.close(callback);
};
// EXPORTS

module.exports = DatabaseServer;
