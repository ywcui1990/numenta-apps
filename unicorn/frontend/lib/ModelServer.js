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

 var child_process = require('child_process');
 var uuid = require('uuid');
 var path = require("path");

// MAIN

/**
 *
 */
 var ModelServer = function () {
  this.models = {};
};

/**
 *
 */
 ModelServer.prototype.addModel = function (stats, callback) {

  var modelId = uuid.v1();

  // spawn() NuPIC process 
  var modelRunnerPath = path.join(__dirname, '..', '..', 'backend', 'unicorn_backend', 'model_runner.py');
  var child = child_process.spawn('python', [modelRunnerPath, '--model', modelId, '--stats', stats]);
  var modelInfo = {
    stdio: child.stdio,
    stdin : child.stdin,
    stdout : child.stdout,
    stderr: child.stderr
  };

  this.models[modelId] = modelInfo;
  callback(null, {modelId: modelId});
};

ModelServer.prototype.addData = function(modelId, data, callback) {
  var modelStdinStream = this.models[modelId].stdin;
  modelStdinStream.write(data);  // write to model stdin
  callback(null, {inputData: data});
};

ModelServer.prototype.getData = function(modelId, callback) {
  var modelStdoutStream = this.models[modelId].stdout;
  var data = modelStdoutStream.read();  // read from model stdout
  callback(null, {outputData: data});
};

/**
 *
 */
 ModelServer.prototype.getModels = function (callback) {
  // callback(error, null);
  callback(null, {models: this.models});
};

/**
 *
 */
 ModelServer.prototype.getModel = function (modelId, callback) {
  // callback(error, null);
  callback(null, { model: this.models[modelId] });
};

/**
 *
 */
 ModelServer.prototype.removeModel = function (modelId, callback) {
  // kill spawn() of NuPIC process here
  delete this.models[modelId];
  // callback(error, null);
  callback(null, { modelId: modelId});
};


// EXPORTS

module.exports = ModelServer;
