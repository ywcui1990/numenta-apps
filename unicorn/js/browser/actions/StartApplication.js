// Copyright © 2016, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero Public License version 3 as published by the Free
// Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/

import {ACTIONS} from '../lib/Constants';
import ListFilesAction from '../actions/ListFiles';
import ListMetricsAction from '../actions/ListMetrics';

function _promiseLoadSampleFilesFromDisk(fs) {
  return new Promise((resolve, reject) => {
    // Load sample files
    fs.getSampleFiles((error, files) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
}
function _promiseSaveFilesIntoDB(db, files) {
  return new Promise((resolve, reject) => {
    db.putFileBatch(files, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
}

/**
 * Start Application performing all data initializations when necessary
 * @param  {FluxibleContext} actionContext - The action context
 * @emits {START_APPLICATION}
 * @emits {ListFilesAction}
 * @emits {ListMetricsAction}
 * @returns {Promise} - A Promise to be resolved with return value
 */
export default function (actionContext) {
  let fs = actionContext.getFileClient();
  let db = actionContext.getDatabaseClient();


  return new Promise((resolve, reject) => {
    // Allow stores to initialze
    resolve(actionContext.dispatch(ACTIONS.START_APPLICATION));
  })
  .then(() => {
    // Load all files
    return actionContext.executeAction(ListFilesAction, {});
  })
  .then((files) => {
    if (files.length > 0) {
      return files;
    }
    // On first run, load sample files
    return _promiseLoadSampleFilesFromDisk(fs)
      .then((files) => _promiseSaveFilesIntoDB(db, files))
      .then((files) => {
        // Update store with sample files
        actionContext.dispatch(ACTIONS.LIST_FILES, files);
        return files;
      });
  })
  .then((files) => {
    return actionContext.executeAction(ListMetricsAction, files);
  });
}
