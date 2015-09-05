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
 * Unicorn: FileServer - Respond to a FileClient over IPC, sharing our access to
 *  the Node/io.js layer of filesystem, so client can CRUD files.
 *
 * Must be ES5 for now, Electron's `remote` doesn't seem to like ES6 Classes!
 */

// externals
import csv from 'csv-streamify';
import fs from 'fs';
import path from 'path';

// internals
// @TODO move path to config
const SAMPLES_FILE_PATH = path.join('frontend', 'samples');


// MAIN

/**
 *
 */
var FileServer = function() {

};


/**
 * Reads the entire contents of a file
 *
 * @param  {String}   filename: The absolute path of the CSV file to load
 */
FileServer.prototype.getContents = function(filename, callback) {
  fs.readFile(filename, function(err, data) {
    if (err) {
      console.error(filename + ':' + err);
    }
    callback(err, data);
  });
};

/**
 * Get a list of sample files embedded with the application
 */
FileServer.prototype.getSampleFiles = function(callback) {
  fs.readdir(SAMPLES_FILE_PATH, function(err, data) {
    var files = [];
    if (data) {
      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var file = {
          name: path.basename(item),
          filename: path.resolve(SAMPLES_FILE_PATH, item),
          type: 'sample'
        };
        files.push(file);
      }
    }
    if (err) {
      console.error(err);
    }
    callback(err, files);
  });
};


/**
 * Get a list of uploaded files
 */
FileServer.prototype.getUploadedFiles = function(file, callback) {

  var formattedFile = {
    name: file.name,
    filename: file.path,
    type: 'uploaded',
    metrics: []
  };

  this.getFields(formattedFile.filename, {}, (error, fields) => {
    if (error) {
      console.log('Error loading metrics for file:', formattedFile, error);
      callback(error);
    } else {
      formattedFile.metrics = fields;
      callback(error, formattedFile);

    }
  });


};

/**
 * Get all field definitions for the give file guessing data types based on
 * first record
 *
 * @param  {String}   filename: The absolute path of the CSV file
 * @param  {Object}   options:  Optional settings. See #getData()
 * @param  {Function} callback Called with an array of field definitions in the
 *                             following format:
 *                             <code>
 *                             {
 *                             	name: 'fieldName',
 *                             	type: 'number', 'date', 'string'],
 *                             }
 *                             </code>
 */
FileServer.prototype.getFields = function(filename, options, callback) {

  // "options" is optional
  if (callback === undefined && typeof options == 'function') {
    callback = options;
    options = {};
  }
  // Update default values
  if (!('columns' in options)) {
    options.columns = true;
  }
  if (!('objectMode' in options)) {
    options.objectMode = true;
  }

  let stream = fs.createReadStream(path.resolve(filename));
  stream.pipe(csv(options))
    .once('data', function(data) {
      if (data) {
        let fields = [];
        for (let fieldName in data) {
          let val = data[fieldName];
          let field = {
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
        callback(null, fields);
        stream.unpipe();
        stream.destroy();
      }
    })
    .on('error', function(error) {
      console.error('Error loading fields: ', error, filename);
      callback(error);
    })
    .on('end', function() {
      callback();
    });
};

/**
 * Get data from the given CSV file.
 *
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
 *                       objectMode: true,
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
 */
FileServer.prototype.getData = function(filename, options, callback) {

  // "options" is optional
  if (callback === undefined && typeof options == 'function') {
    callback = options;
    options = {};
  }
  // Update default values
  if (!('columns' in options)) {
    options.columns = true;
  }
  if (!('objectMode' in options)) {
    options.objectMode = true;
  }
  if (!('limit' in options)) {
    options.limit = Number.MAX_SAFE_INTEGER;
  }

  let limit = options.limit;
  let stream = fs.createReadStream(path.resolve(filename));
  stream.pipe(csv(options))
    .on('data', function(data) {
      if (limit > 0) {
        callback(null, data);
      }
      if (limit === 0) {
        stream.unpipe();
        stream.destroy();
        callback();
      }
      limit -= 1;
    })
    .on('error', function(error) {
      console.error('Error loading file: ', filename, error);
      callback(error);
    })
    .on('close', function() {
      callback();
    })
    .on('end', function() {
      callback();
    });
};

// EXPORTS

module.exports = FileServer;
