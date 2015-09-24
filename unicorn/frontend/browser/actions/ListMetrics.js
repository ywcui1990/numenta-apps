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

import DatabaseClient from '../lib/DatabaseClient';
import FileClient from '../lib/FileClient';


/**
 * List all available metrics of the given file
 */
export default (actionContext, file) => {
  return new Promise((resolve, reject) => {
    let databaseClient = new DatabaseClient();
    let fileClient = new FileClient();
    let payload;

    // load existing metrics from db, from previous runs
    databaseClient.getMetrics({}, (error, metrics) => {
      if (error) {
        actionContext.dispatch('FAILURE', new Error({
          name: 'DatabaseClientGetMetricsFailure',
          message: error
        }));
        reject(error);
      }

      if (metrics.length) {
        // metrics in db already, not first run, skip loading from fs, send to UI
        payload = {
          filename: file,
          metrics
        };
        console.log('ALPHA^', payload);
        actionContext.dispatch('LIST_METRICS_SUCCESS', payload);
        resolve(payload);
        return;
      }

      // no metrics in db, first run, so load them and save to db
      fileClient.getFields(file, (error, fields) => {
        if (error) {
          actionContext.dispatch('FAILURE', new Error({
            'name': 'FileClientGetFieldsFailure',
            'message': error
          });
          reject(error);
          return;
        }

        // got file list from fs, saving to db for next runs
        databaseClient.putMetrics(fields, (error) => {
          if (error) {
            actionContext.dispatch('FAILURE', new Error({
              name: 'DatabaseClientPutMetricsFailure',
              message: error
            });
            reject(error);
          }
        }); // databaseClient.putMetrics()

        // send to UI
        payload = {
          filename: file,
          metrics
        };
        console.log('BETHA^', payload);
        actionContext.dispatch('LIST_METRICS_SUCCESS', payload);
        resolve(payload);
      }); // fileClient.getFields()
    }); // databaseClient.getMetrics()

  }); // Promise
};
