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
import MetricDataSchema from '../database/schema/MetricData.json';
import ModelSchema from '../database/schema/Model.json';
import ModelDataSchema from '../database/schema/ModelData.json';

const DB_FILE_PATH = path.join('frontend', 'database', 'data', 'unicorn.json');


// MAIN

/**
 *
 */
var DatabaseServer = function() {
  this.validator = new Validator();
  // this.validator.addSchema(AddressSchema, '/Address');

  this.db = sublevel(levelup(DB_FILE_PATH, {
    db: jsondown,
    valueEncoding: 'json'
  }));
};

/**
 * Get a single DB value
 */
DatabaseServer.prototype.get = function(key, callback) {
  this.db.get(key, callback);
};

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
      if (result) {
        results.push(result);
      }
      callback(null, results);
    });
};

/**
 * Get all/queried MetricDatas records
 */
DatabaseServer.prototype.getMetricDatas = function(query, callback) {
  let results = [];
  let table = levelQuery(this.db.sublevel('metricData'));
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
 * Get a single Model
 */
DatabaseServer.prototype.getModel = function(uid, callback) {
  let table = this.db.sublevel('model');
  table.get(uid, callback);
};

/**
 * Get all/queried Models
 */
DatabaseServer.prototype.getModels = function(query, callback) {
  let results = [];
  let table = levelQuery(this.db.sublevel('model'));
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
 * Get all/queried ModelDatas records
 */
DatabaseServer.prototype.getModelDatas = function(query, callback) {
  let results = [];
  let table = levelQuery(this.db.sublevel('modelData'));
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
 * Put a single DB value
 */
DatabaseServer.prototype.put = function(key, value, callback) {
  this.db.put(key, value, callback);
};

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
 * Put a single MetricData record to DB
 */
DatabaseServer.prototype.putMetricData = function(metricData, callback) {
  let table = this.db.sublevel('metricData');
  let validation = this.validator.validate(metricData, MetricDataSchema);

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  table.put(metricData.metric_uid, metricData, callback);
};

/**
 * Put a single Model to DB
 */
DatabaseServer.prototype.putModel = function(model, callback) {
  let table = this.db.sublevel('model');
  let validation = this.validator.validate(model, ModelSchema);

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  table.put(model.uid, model, callback);
};

/**
 * Put a single ModelData record to DB
 */
DatabaseServer.prototype.putModelData = function(modelData, callback) {
  let table = this.db.sublevel('modelData');
  let validation = this.validator.validate(modelData, ModelDataSchema);

  if (validation.errors.length) {
    callback(validation.errors, null);
    return;
  }

  table.put(modelData.model_uid, modelData, callback);
};


// EXPORTS

module.exports = DatabaseServer;
