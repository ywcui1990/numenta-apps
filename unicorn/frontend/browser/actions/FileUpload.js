// Numenta Platform for Intelligent Computing (NuPIC)
// Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero Public License version 3 as
// published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License
// along with this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/

'use strict';


// externals

import csp from 'js-csp';

// internals

import {ACTIONS} from '../lib/Constants';
import Utils from '../../lib/Utils';


// FUNCTIONS

/**
 *
 */
function getFileFromDB(options) {
  let {actionContext, file} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();
  let fileId = Utils.generateId(file.path);

  databaseClient.getFile(fileId, (error, results) => {
    if (error && (!('notFound' in error))) {
      csp.putAsync(channel, new Error({
        name: 'FileUploadActionDatabaseClientGetFile',
        message: error
      }));
    } else {
      csp.putAsync(channel, results);
    }
  });

  return channel;
}

/**
 *
 */
function getMetricsFromDB(options) {
  let {actionContext, file} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();
  let fileId = Utils.generateId(file.path);

  databaseClient.getMetrics({ 'file_uid': fileId }, (error, results) => {
    if (error && (!('notFound' in error))) {
      csp.putAsync(channel, new Error({
        name: 'FileUploadActionDatabaseClientGetMetrics',
        message: error
      }));
    } else {
      csp.putAsync(channel, results);
    }
  });

  return channel;
}

/**
 *
 */
function putFileIntoDB(options) {
  let {actionContext, file} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();
  let payload = {
    uid: Utils.generateId(file.filename),
    name: file.name,
    filename: file.filename,
    type: file.type
  };

  databaseClient.putFile(payload, (error) => {
    if (error) {
      csp.putAsync(channel, new Error({
        name: 'FileUploadActionDatabaseClientPutFile',
        message: error
      }));
    } else {
      csp.putAsync(channel, true);
    }
  });

  return channel;
}

/**
 *
 */
function putMetricsIntoDB(options) {
  let {actionContext, file} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();
  let payload = file.metrics.map((metric) => {
    return {
      uid: Utils.generateModelId(file.filename, metric.name),
      'file_uid': Utils.generateId(file.filename),
      name: metric.name,
      type: metric.type
    };
  });

  databaseClient.putMetrics(payload, (error) => {
    if (error) {
      csp.putAsync(channel, new Error({
        name: 'FileUploadActionDatabaseClientPutFile',
        message: error
      }));
    } else {
      csp.putAsync(channel, true);
    }
  });

  return channel;
}

/**
 *
 */
function getFileFromUpload(options) {
  let {actionContext, file} = options;
  let channel = csp.chan();
  let fileClient = actionContext.getFileClient();

  fileClient.getUploadedFiles(file, (error, formattedFile) => {
    if (error) {
      csp.putAsync(channel, new Error({
        name: 'FileUploadActionFileClientGetUploadedFiles',
        message: error
      }));
    } else {
      csp.putAsync(channel, formattedFile);
    }
  });

  return channel;
}


// MAIN

/**
 * Get uploaded file
 */
export default (actionContext, file) => {
  return new Promise((resolve, reject) => {
    csp.go(function* () {

      let fileFormatted;
      let fileHandle;
      let fileMetrics;
      let opts = {actionContext, file};
      let result;

      // see if uploaded file is already in DB
      console.log('see if uploaded file is already in DB');
      fileHandle = yield csp.take(getFileFromDB(opts));
      if (fileHandle instanceof Error) {
        reject(fileHandle);
        console.error(fileHandle);
        return;
      }
      if (fileHandle && ('uid' in fileHandle)) {
        // yes file is already in DB, load metrics
        console.log('yes file is already in DB, load metrics');

        fileMetrics = yield csp.take(getMetricsFromDB(opts));
        if (fileMetrics instanceof Error) {
          reject(fileMetrics);
          console.error(fileMetrics);
          return;
        }
        fileFormatted = {
          name: file.name,
          filename: file.path,
          type: 'uploaded',
          metrics: fileMetrics
        };

        // on to UI
        console.log('on to UI');
        actionContext.dispatch(ACTIONS.UPLOADED_FILE_SUCCESS, fileFormatted);
        resolve(fileFormatted);
        return;
      }

      // NO file is not already in DB, get from upload
      console.log('NO file is not already in DB, get from upload');
      fileFormatted = yield csp.take(getFileFromUpload(opts));
      if (fileFormatted instanceof Error) {
        actionContext.dispatch(ACTIONS.UPLOADED_FILE_FAILED, {
          error: fileFormatted,
          filename: fileFormatted
        });
        reject(fileFormatted);
        return;
      }

      // save new File+Metrics to DB
      console.log('save new File+Metrics to DB');
      opts.file = fileFormatted;
      result = yield csp.take(putFileIntoDB(opts));
      if (result instanceof Error) {
        reject(result);
        console.error(result);
        return;
      }
      result = yield csp.take(putMetricsIntoDB(opts));
      if (result instanceof Error) {
        reject(result);
        console.error(result);
        return;
      }

      // on to UI
      console.log('on to UI');
      actionContext.dispatch(ACTIONS.UPLOADED_FILE_SUCCESS, fileFormatted);
      resolve(fileFormatted);

    }); // csp.go
  }); // Promise
}; // export
