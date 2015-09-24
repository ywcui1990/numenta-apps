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

import StopModelAction from '../actions/StopModel';
import SendDataAction from '../actions/SendData';
import ModelStore from '../stores/ModelStore';
import {ACTIONS} from '../lib/Constants';

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
 * Start streaming data records to the model and emit results
 */
function streamData(actionContext, modelId) {

  let fileClient = actionContext.getFileClient();
  let modelStore = actionContext.getStore(ModelStore);
  let model = modelStore.getModel(modelId);

  return new Promise((resolve, reject) => {
    // Stream file data
    fileClient.getData(model.filename, (error, data) => {
      if (error) {
        actionContext.executeAction(StopModelAction, model.modelId);
        reject(error);
      } else if (data) {
        try {
          let row = JSON.parse(data);
          actionContext.executeAction(SendDataAction, {
            'modelId': model.modelId,
            'data': [
              new Date(row[model.timestampField]).getTime() / 1000,
              new Number(row[model.metric]).valueOf()
            ]});
        } catch (ex) {
          reject(error);
        }
      } else {
        // End of data
        resolve(model.modelId);
      }
    });
  });
};

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
