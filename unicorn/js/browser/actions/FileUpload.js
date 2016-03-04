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

import instantiator from 'json-schema-instantiator';
import {DBFileSchema} from '../../database/schema';

import {ACTIONS} from '../lib/Constants';
import {promiseMetricsFromFiles} from '../lib/Unicorn/FileClient';
import {
  promiseSaveFilesIntoDB, promiseSaveMetricsToDB
} from '../lib/Unicorn/DatabaseClient';
import Utils from '../../main/Utils';


/**
 * Upload File Action.
 *  1. Save file metadata {@link FileStore.File}
 *  2. Load metrics from file {@link MetricStore.Metric}
 *  3. Save metrics to DB {@link MetricStore.Metric}
 *
 * @param {FluxibleContext} actionContext FluxibleContext
 * @param {Object} payload  Action payload object
 * @param {string} payload.name File name
 * @param {string} payload.path File full path
 * @emits {UPLOADED_FILE}
 * @emits {LIST_METRICS}
 * @return {Promise}  Promise
 */
export default function (actionContext, payload) {
  let db = actionContext.getDatabaseClient();
  let fs = actionContext.getFileClient();

  return new Promise((resolve, reject) => {
    let file = instantiator.instantiate(DBFileSchema);
    file.filename = payload.path,
    file.name = payload.name,
    file.uid = Utils.generateFileId(payload.path)

    // Save file metadata
    promiseSaveFilesIntoDB(db, [file])
      .then((file) => {
        // Load metrics from file
        return promiseMetricsFromFiles(fs, file)
      }, reject)
      .then((metrics) => {
        // Save metric to database
        return promiseSaveMetricsToDB(db, metrics);
      }, reject)
      .then((metrics) => {
        let tsField = metrics.find((metric) => metric.type === 'date');
        if (!tsField) {
          reject(Utils.trims`This file does not have a column with
                             datetime values.`);
          return;
        }
        if (!tsField.format) {
          reject(Utils.trims`The file that you are trying to
                             upload has a timestamp format that is not
                             supported`);
          return;
        }
        fs.getData(file.filename, {limit: 1}, (error, buffer) => {
          let row = null;
          if (error) {
            throw new Error(error);
          }
          if (buffer) {
            row = JSON.parse(buffer);
            if (!row) {
              throw new Error('This file does not have data.');
            }

            // Update stores
            actionContext.dispatch(ACTIONS.UPLOADED_FILE, file);
            actionContext.dispatch(ACTIONS.LIST_METRICS, metrics);
            resolve(file);
          } // if (buffer)
        }); // fs.getData()
      }, reject);
  });
}
