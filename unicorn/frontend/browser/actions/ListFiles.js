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

import {ACTIONS} from '../lib/Constants';
import DatabaseClient from '../lib/DatabaseClient';
import FileClient from '../lib/FileClient';


/**
 * Get List of files from backend
 */
export default (actionContext) => {
  return new Promise((resolve, reject) => {

    let databaseClient = new DatabaseClient();
    let fileClient = new FileClient();

    // load existing files from db, from previous runs
    console.log('load existing files from db, from previous runs');
    databaseClient.getFiles({}, (error, files) => {
      if (error) {
        actionContext.dispatch(ACTIONS.LIST_FILES_FAILURE, new Error({
          name: 'DatabaseClientGetFilesFailure',
          message: error
        }));
        reject(error);
      } else if (files.length) {
        // files in db already, not first run, straight to UI
        console.log('files in db already, not first run, straight to UI');
        actionContext.dispatch(ACTIONS.LIST_FILES_SUCCESS, files);
        resolve(files);
      } else {
        // no files in db, first run, so load them from fs
        console.log('no files in db, first run, so load them from fs');
        fileClient.getSampleFiles((error, files) => {
          if (error) {
            actionContext.dispatch(ACTIONS.LIST_FILES_FAILURE, new Error({
              name: 'FileClientGetSampleFilesFailure',
              message: error
            }));
            reject(error);
          } else {
            // got file list from fs, saving to db for next runs
            console.log('got file list from fs, saving to db for next runs');
            databaseClient.putFiles(files, (error) => {
              if (error) {
                actionContext.dispatch(ACTIONS.LIST_FILES_FAILURE, new Error({
                  name: 'DatabaseClientPutFilesFailure',
                  message: error
                }));
                reject(error);
              } else {
                // DB now has Files, on to UI.
                console.log('DB now has Files, on to UI.');
                actionContext.dispatch(ACTIONS.LIST_FILES_SUCCESS, files);
                resolve(files);
              }
            }); // databaseClient.putFiles()
          }
        }); // fileClient.getSampleFiles()
      }
    }); // databaseClient.getFiles()

  }); // Promise
};
