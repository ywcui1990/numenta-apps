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
var uuid = require('uuid');
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
 *
 */
ModelServer.prototype.addModel = function(stats, callback) {

  var modelId = uuid.v1();
  // spawn() NuPIC process
  var child = childProcess.spawn('python', [MODEL_RUNNER_PATH,
    '--model', modelId, '--stats', stats]);

  child.on('error', function (error) {
    console.log('Failed to start child process: ' + error);
  });

  this.models[modelId] = child;
  callback(null, {modelId: modelId});
};

ModelServer.prototype.addData = function(modelId, inputData, callback) {
  var child = this.models[modelId];
  console.log(child.connected);
  if (child.connected){
    child.stdin.write(inputData);
    child.on('error', function (error) {
      console.log('Failed to write to stdin for child process with ID: '
      + modelId + '. Error: ' + error);
    });
  }
  callback(null, {inputData: inputData});
};

ModelServer.prototype.onData = function(modelId, callback) {
  var child = this.models[modelId];
  var outputData;
  if (child.connected) {
    child.stdout.on('data', function(data) {
      outputData = data;
    });
    child.on('error', function (error) {
      console.log('Failed to write to stdin for child process with ID: '
      + modelId + '. Error: ' + error);
    });
  }
  callback(null, {outputData: outputData});
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
  // callback(error, null);
  callback(null, {
    model: this.models[modelId]
  });
};

/**
 *
 */
ModelServer.prototype.removeModel = function(modelId, callback) {
  // kill spawn() of NuPIC process here
  delete this.models[modelId];
  // callback(error, null);
  callback(null, {
    modelId: modelId
  });
};

// EXPORTS

module.exports = ModelServer;
