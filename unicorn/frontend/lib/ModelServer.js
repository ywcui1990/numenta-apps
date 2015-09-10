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
 * Unicorn: ModelServer - Respond to a ModelClient over IPC, sharing our access
 *  to Unicorn Backend Model Runner python and NuPIC processes.
 *
 * Must be ES5 for now, Electron's `remote` doesn't seem to like ES6 Classes!
 */

var childProcess = require('child_process');
var path = require('path');

const MODEL_RUNNER_PATH = path.join(__dirname, '..', '..',
  'backend', 'unicorn_backend', 'model_runner.py');

// MAIN

/**
 *
 */
var ModelServer = function() {
  this.models = {};
};

/**
 * Create a new HTM model
 * @param  {String}   modelId  Unique identifier for the model
 * @param  {Object}   stats    HTM Model parameters. See model_runner.py
 * @param  {Function} callback On success called with the model id
 */
ModelServer.prototype.createModel = function(modelId, stats, callback) {

  // spawn() NuPIC process
  var child = childProcess.spawn('python', [MODEL_RUNNER_PATH,
    '--model', modelId, '--stats', stats]);
  if (child) {
    child.on('error', function (error) {
      console.log('Failed to start child process: ' + error);
      callback('Failed to start child process: ' + error);
    });
    child.stderr.on('data', function(error) {
      callback('Failed to start child process: ' + error);
    });
    var _this = this;
    child.on('close', function (code) {
      console.log('child process exited with code ' + code);
      delete _this.models[modelId];
      callback('child process for model ' + modelId
              + ' exited with code ' + code);
    });
    if (child.stdin) {
      child.stdout.setEncoding('utf8');
      child.stdin.setDefaultEncoding('utf8');
      child.stderr.setEncoding('utf8');
      this.models[modelId] = child;
      callback(null, {modelId: modelId});
    }
  } else {
    console.log('Failed to create model ' + modelId);
  }
};

ModelServer.prototype.addData = function(modelId, inputData, callback) {
  var child = this.models[modelId];
  if (child && child.stdin) {
    child.stdin.write(inputData);
    child.on('error', function (error) {
      console.log('Failed to write to stdin for child process with ID: '
                  + modelId + '. Error: ' + error);
    });
    callback(null, {modleId: modelId, input: inputData});
  } else {
    console.log('Failed to get stdin for model ' + modelId);
    callback('Failed to get stdin for model ' + modelId );
  }
};

ModelServer.prototype.onData = function(modelId, callback) {
  var child = this.models[modelId];
  if (child && child.stdout) {
    child.stdout.on('data', function(data) {
      callback(null, {modelId: modelId, output: data});
    });
    child.on('error', function (error) {
      console.log('Failed to write to stdin for child process with ID: '
                  + modelId + '. Error: ' + error);
    });
  } else {
    callback('Failed to get stdout for model ' + modelId);
  }
};

/**
 *
 */
ModelServer.prototype.getModels = function(callback) {
  // callback(error, null);
  callback(null, {
    models: this.models
  });
};

/**
 *
 */
ModelServer.prototype.getModel = function(modelId, callback) {
  if (modelIs in thi.models) {
    callback(null, {
      model: this.models[modelId]
    });
  } else {
    callback('Model ' + modelId + ' was not found');
  }
};

/**
 *
 */
ModelServer.prototype.removeModel = function(modelId, callback) {
  var child = this.models[modelId];
  if (child) {
    child.kill();
    delete this.models[modelId];
    callback(null, {
      modelId: modelId
    });
  } else {
    callback('Model ' + modelId + ' was not found');
  }
};

// EXPORTS

module.exports = ModelServer;
