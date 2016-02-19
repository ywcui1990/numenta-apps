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
import Utils from '../../main/Utils';
import {
  promiseSaveFilesIntoDB, promiseSaveMetricsToDB
} from '../lib/Unicorn/DatabaseClient';
import {promiseMetricsFromFiles} from '../lib/Unicorn/FileClient';
import {TIMESTAMP_FORMATS} from '../lib/Constants';
import moment from 'moment';

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

    let file = {
      uid: Utils.generateFileId(payload.path),
      name: payload.name,
      filename: payload.path,
      type: 'uploaded'
    };

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

        // Set the file timestampFormat value (2 steps)

        // 1. Get the timestamp field
        let timestampField = metrics.find((metric) => {
          return metric.type === 'date';
        });

        // 2. Get 1 row of data to get the timestamp format
        let data = [];
        fs.getData(payload.filename, {limit: 1}, (error, buffer) => {
          if (error) {
            throw new Error(error);
          } else if (buffer) {
            // Guess timestamp format based the first row
            if (timestampField && data.length === 1) {
              file.timestampFormat = TIMESTAMP_FORMATS.find((format) => {
                return moment(data[0][timestampField], format, true).isValid();
              });
            }
            data.push(JSON.parse(buffer));
          }
        });

        console.log('DEBUG: FileUpload:file', file)
        // Update stores
        actionContext.dispatch(ACTIONS.UPLOADED_FILE, file);
        actionContext.dispatch(ACTIONS.LIST_METRICS, metrics);
        resolve(file);

      }, reject);
  });
}
