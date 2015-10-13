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


// externals

import csv from 'csv-streamify';
import filesystem from 'fs';
import path from 'path';
import Utils from './Utils';

// internals

const SAMPLES_FILE_PATH = path.join(__dirname, '..', 'samples');


/**
 * Unicorn: FileServer - Respond to a FileClient over IPC, sharing our access to
 *  the Node/io.js layer of filesystem, so client can CRUD files.
 * Must be ES5 for now, Electron's `remote` doesn't seem to like ES6 Classes!
 * @class
 * @module
 */
function FileServer() {
}


/**
 * Reads the entire contents of a file
 * @param {String} filename - The absolute path of the CSV file to load
 * @param {Function} callback - Async callback: function (error,results) {}
 * @returns {Undefined} - undefined
 */
FileServer.prototype.getContents = function (filename, callback) {
  filesystem.readFile(filename, function (error, data) {
    if (error) {
      callback(error, null);
      return;
    }
    callback(null, data);
  });
};

/**
 * Get a list of sample files embedded with the application
 * @param {Function} callback - Async callback: function (error,results) {}
 * @returns {Undefined} - undefined
 */
FileServer.prototype.getSampleFiles = function (callback) {
  filesystem.readdir(SAMPLES_FILE_PATH, function (error, data) {
    var files;
    if (error) {
      callback(error, null);
      return;
    }
    files = data.map((item) => {
      var filename = path.resolve(SAMPLES_FILE_PATH, item);
      return {
        uid: Utils.generateId(filename),
        name: path.basename(item),
        filename: filename,
        type: 'sample'
      };
    });

    callback(null, files);
  });
};

/**
 * Get a list of uploaded files
 * @param {Object} file - File getting uploaded
 * @param {Function} callback - Async callback: function (error,results) {}
 * @returns {Undefined} - undefined
 */
FileServer.prototype.getUploadedFiles = function (file, callback) {
  var formattedFile = {
    name: file.name,
    filename: file.path,
    type: 'uploaded',
    metrics: []
  };

  this.getFields(formattedFile.filename, {}, (error, fields) => {
    if (error) {
      // @TODO throw?
      callback(error);
      return;
    }
    formattedFile.metrics = fields;
    callback(error, formattedFile);
  });
};

/**
 * Get all field definitions for the give file guessing data types based on
 *  first record
 * @param {String} filename: The absolute path of the CSV file
 * @param {Object} options: Optional settings. See #getData()
 * @param {Function} callback Called with an array of field definitions in the
 *  following format:
 *  <code> { name:'fieldName', type:'number', date:'string' } </code>
 * @returns {Undefined} - undefined
 */
FileServer.prototype.getFields = function (filename, options, callback) {
  var fields = [];
  var fieldName, stream;

  // "options" is optional
  if (typeof callback == 'undefined' && typeof options == 'function') {
    callback = options;
    options = {};
  }
  // Update default values
  if (!('columns' in options)) {
    options.columns = true;
  }

  options.objectMode = true;
  stream = filesystem.createReadStream(path.resolve(filename));
  stream.pipe(csv(options))
    .once('data', function (data) {
      if (data) {
        for (fieldName in data) {
          const val = data[fieldName];
          const field = {
            uid: Utils.generateModelId(filename, fieldName),
            file_uid: Utils.generateId(filename),
            name: fieldName,
            type: 'string'
          };
          if (Number.isFinite(Number(val))) {
            field.type = 'number';
          } else if (Number.isFinite(Date.parse(val))) {
            field.type = 'date';
          }
          fields.push(field);
        }
        stream.unpipe();
        stream.destroy();
        callback(null, fields);
        return;
      }
    })
    .once('error', callback)
    .once('end', callback);
};

/**
 * Get data from the given CSV file.
 * @param  {String}   filename: The absolute path of the CSV file to load
 * @param  {Object}   options:  Optional settings
 *                    See https://github.com/klaemo/csv-stream#options
 *                    <code>
 *                     {
 *                       delimiter: ',', // comma, semicolon, whatever
 *                       newline: 'n', // newline character
 *                       quote: '"', // what's considered a quote
 *                       empty: '', // empty fields are replaced by this,
 *
 *                       // if true, emit array of {Object}s
 *                       // instead of array of strings
 *                       objectMode: false,
 *
 *                       // if set to true, uses first row as keys ->
 *                       // [ { column1: value1, column2: value2 , ...]}
 *                       columns: true,
 *                       // Max Number of records to process
 *                       limit: Number.MAX_SAFE_INTEGER
 *                      }
 *                    </code>
 * @param  {Function} callback: This callback to be called on every record.
 *                              <code>function(error, data)</code>
 * @returns {Undefined} - undefined
 */
FileServer.prototype.getData = function (filename, options, callback) {
  var limit, stream;

  // "options" is optional
  if (typeof callback == 'undefined' && typeof options == 'function') {
    callback = options;
    options = {};
  }
  // Update default values
  if (!('columns' in options)) {
    options.columns = true;
  }
  if (!('limit' in options)) {
    options.limit = Number.MAX_SAFE_INTEGER;
  }

  limit = options.limit;
  stream = filesystem.createReadStream(path.resolve(filename));
  stream.pipe(csv(options))
    .on('data', function (data) {
      if (limit > 0) {
        callback(null, data);
        return;
      }
      if (limit === 0) {
        stream.unpipe();
        stream.destroy();
        callback();
        return;
      }
      limit -= 1;
    })
    .once('error', callback)
    .once('close', callback)
    .once('end', callback);
};

/**
 * @param  {String}   filename: The absolute path of the CSV file
 * @param  {Object}   options:  Optional settings
 *                    See https://github.com/klaemo/csv-stream#options
 *                    <code>
 *                     {
 *                       delimiter: ',', // comma, semicolon, whatever
 *                       newline: 'n', // newline character
 *                       quote: '"', // what's considered a quote
 *                       empty: '', // empty fields are replaced by this,
 *
 *                       // if set to true, uses first row as keys ->
 *                       // [ { column1: value1, column2: value2 , ...]}
 *                       columns: true,
 *                       // Max Number of records to process
 *                       limit: Number.MAX_SAFE_INTEGER
 *                      }
 *                    </code>
 * @param  {Function} callback: This callback will be called with the results in
 *                              the following format:
 *                              <code>function(error, stats)</code>
 *                              stats = {
 *                              	fieldName : {
 *                              		min: '0',
 *                              		max: '10'
 *                              	}, ...
 *                              }
 * @returns {Undefined} - undefined
 */
FileServer.prototype.getStatistics = function (filename, options, callback) {
  var field, max, min, val;
  var stats = {};

  // "options" is optional
  if (typeof callback == 'undefined' && typeof options == 'function') {
    callback = options;
    options = {};
  }

  options.objectMode = true;
  this.getData(filename, options, function (error, data) {
    if (error) {
      callback(error);
      return;
    } else if (data) {
      // Update stats on every record
      for (field in data) {
        val = new Number(data[field]);

        if (isNaN(val)) {
          continue;
        } else {
          val = val.valueOf();
        }
        if (!(field in stats)) {
          stats[field] = {
            min: Number.MAX_VALUE,
            max: Number.MIN_VALUE
          };
        }

        min = stats[field].min;
        max = stats[field].max;

        stats[field].min = val < min ? val : min;
        stats[field].max = val > max ? val : max;
      }
    } else {
      // Finished reading data
      callback(null, stats);
      return;
    }
  });
};


// EXPORTS
module.exports = FileServer;
