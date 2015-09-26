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
import Utils from '../../lib/Utils';


/**
 * List all available metrics of the given file
 */
export default (actionContext, files) => {
  return new Promise((resolve, reject) => {

    let databaseClient = new DatabaseClient();
    let fileClient = new FileClient();
    let payload = [];

    // load existing metrics from db, from previous runs
    console.log('load existing metrics from db, from previous runs');
    databaseClient.getMetrics({}, (error, metrics) => {
      if (error) {
        actionContext.dispatch(ACTIONS.LIST_METRICS_FAILURE, new Error({
          name: 'DatabaseClientGetMetricsFailure',
          message: error
        }));
        reject(error);
      } else if (metrics.length) {
        // metrics in db already, not first run, skip loading from fs. to UI.
        console.log('metrics in db already, not first run, skip loading from fs. to UI.');
        files.forEach((file) => {
          payload.push({
            filename: file.filename,
            metrics: metrics.filter((value) => {
              return value['file_uid'] === Utils.generateId(file.filename);
            })
          });
        });

        // DB already had Metrics, now to UI
        console.log('DB already had Metrics, now to UI');
        actionContext.dispatch(ACTIONS.LIST_METRICS_SUCCESS, payload);
        resolve(payload);
      } else {
        // no metrics in db, is first run, so load them from fs
        console.log('no metrics in db, is first run, so load them from fs');
        let fieldsFileMap = {};
        let fieldsList = [];
        let fileCount = 0;

        files.forEach((file) => {
          fileClient.getFields(file.filename, (error, fields) => {
            if (error) {
              actionContext.dispatch(ACTIONS.LIST_METRICS_FAILURE, new Error({
                'name': 'FileClientGetFieldsFailure',
                'message': error
              }));
              reject(error);
            } else {
              fieldsFileMap[file.filename] = fields;
              fieldsList = fieldsList.concat(fields);

              // @TODO better async flow than "poor persons parallel"
              fileCount++;
              if (fileCount >= files.length) {

                // got files from fs, saving to db for next runs
                console.log('got files from fs, saving to db for next runs');
                databaseClient.putMetrics(fieldsList, (error) => {
                  if (error) {
                    actionContext.dispatch(
                      ACTIONS.LIST_METRICS_FAILURE,
                      new Error({
                        name: 'DatabaseClientPutMetricsFailure',
                        message: error
                      })
                    );
                    reject(error);
                  } else {
                    // DB has Metrics, now to UI
                    console.log('DB has Metrics, now to UI');
                    Object.keys(fieldsFileMap).forEach((file) => {
                      payload.push({
                        filename: file,
                        metrics: fieldsFileMap[file]
                      });
                    });
                    actionContext.dispatch(
                      ACTIONS.LIST_METRICS_SUCCESS,
                      payload
                    );
                    resolve(payload);
                  }
                }); // databaseClient.putMetrics()

              } // fileCount
            }
          }); // fileClient.getFields()
        }); // files.forEach()
      }
    }); // databaseClient.getMetrics()

  }); // Promise
};
