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
import ModelStore from '../stores/ModelStore';
import SendDataAction from '../actions/SendData';
import StopModelAction from '../actions/StopModel';
import Utils from '../../lib/Utils';


/**
 * Promise to return the file statistics. See FileServer#getStatistics
 */
function promiseFileStats(actionContext, filename) {
  return new Promise((resolve, reject) => {
    let fileClient = actionContext.getFileClient();
    fileClient.getStatistics(filename, (error, stats) => {
      if (error) {
        reject(error);
      } else {
        resolve(stats);
      }
    });
  });
};

/**
 * Check database for previously saved Metric Data
 */
function getMetricDataFromDatabase(options) {
  let {actionContext, model} = options;
  let channel = csp.chan();
  let databaseClient = actionContext.getDatabaseClient();

  databaseClient.getMetricDatas(
    { 'metric_uid': Utils.generateModelId(model.filename, model.metric) },
    (error, results) => {
      if (error) {
        csp.putAsync(channel, new Error({
          name: 'StartModelActionDatabaseClientGetMetricDatas',
          message: error
        }));
      } else {
        csp.putAsync(channel, results);
      }
    }
  );

  return channel;
}

/**
 * Start streaming data records to the model and emit results
 */
function streamData(actionContext, modelId) {
  let databaseClient = actionContext.getDatabaseClient();
  let fileClient = actionContext.getFileClient();
  let modelStore = actionContext.getStore(ModelStore);
  let model = modelStore.getModel(modelId);
  let rowId = 0;
  let rows = [];

  return new Promise((resolve, reject) => {
    csp.go(function* () {

      // see if metric data is already saved in DB first
      let metricData = yield csp.take(
        getMetricDataFromDatabase({actionContext, model})
      );
      if (metricData instanceof Error) {
        reject(metricData);
        return;
      }
      if (metricData.length > 0) {
        // yes metric data is already in DB, use it
        metricData.forEach((row) => {
          actionContext.executeAction(SendDataAction, {
            'modelId': model.modelId,
            'data': [
              new Date(row[model.timestampField]).getTime() / 1000,
              new Number(row[model.metric]).valueOf()
            ]});
        });
        // on to UI
        resolve(model.modelId);
        return;
      }

      // No metric data in DB, load direct from filesystem and save to DB
      // @TODO refactor async flow to CSP
      fileClient.getData(model.filename, (error, data) => {
        let row;
        let timestamp;
        let value;

        if (error) {
          actionContext.executeAction(StopModelAction, model.modelId);
          reject(error);
        } else if (data) {
          // validate new data row
          try {
            row = JSON.parse(data);
          } catch (error) {
            reject(error);
          }

          // queue for DB
          timestamp = new Date(row[model.timestampField]);
          value = new Number(row[model.metric]).valueOf();
          rows.push({
            uid: Utils.generateDataId(model.filename, model.metric, timestamp),
            'metric_uid': Utils.generateModelId(model.filename, model.metric),
            rowid: rowId,
            timestamp: timestamp.toISOString(),
            'metric_value': value,
            'display_value': value
          });
          rowId++;

          // send row to UI
          actionContext.executeAction(SendDataAction, {
            'modelId': model.modelId,
            'data': [(timestamp.getTime() / 1000), value]
          });
        } else {
          // End of data - Save to DB for future runs.
          databaseClient.putMetricDatas(rows, (error) => {
            if (error) {
              reject(error);
            } else {
              // on to UI
              resolve(model.modelId);
            }
          });
        }
      }); // fileClient.getData

    }); // csp.go
  }); // Promise
};


// MAIN

/**
 * Action used to Start streaming data to the nupic model. The file will be
 * streamed one record at the time. 'ReceiveData' Action will be fired as
 * results become available
 * @param  {[type]} actionContext
 * @param  {String} model         The model to start
 */
export default (actionContext, modelId) => {
  let modelStore = actionContext.getStore(ModelStore);
  let model = modelStore.getModel(modelId);
  let { metric, filename } = model;

  return promiseFileStats(actionContext, filename)
    .then((stats) => {
      let modelClient = actionContext.getModelClient();
      actionContext.dispatch(ACTIONS.START_MODEL_SUCCESS, modelId);
      modelClient.createModel(modelId, stats[metric]);
      return streamData(actionContext, modelId);
    });
};
