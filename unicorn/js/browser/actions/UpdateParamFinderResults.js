// Copyright © 2015, Numenta, Inc. Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero Public License version 3 as published by the
// Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program. If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/

import {ACTIONS} from '../lib/Constants';

/**
 * Update Param Finder results.
 * @param  {FluxibleContext} actionContext - The action context
 * @param  {string} paramFinderResults - Param finder results.
 */
export default function (actionContext, paramFinderResults) {
  return new Promise((resolve, reject) => {
    let databaseClient = actionContext.getDatabaseClient();

    let metricId = paramFinderResults.metricId;
    let inputInfo = paramFinderResults.inputInfo;
    let aggInfo = paramFinderResults.aggInfo;
    let modelInfo = paramFinderResults.modelInfo;

    console.log(paramFinderResults);
    databaseClient.setMetricAggregationOptions(metricId, aggInfo, (error) => {
      console.log(aggInfo);
      if (error) {
        // TODO: do something to handle the error. Something like:
        // actionContext.dispatch(ACTIONS.SAVE_METRIC_AGG_OPTS_FAILURE, new
        // DatabaseGetError(error));
        reject(error);
      } else {

        databaseClient.setMetricModelOptions(metricId, modelInfo, (error) => {
          console.log(modelInfo);

          if (error) {
            // TODO: do something to handle the error. Something like:
            // actionContext.dispatch(ACTIONS.SAVE_METRIC_MODEL_OPTS_FAILURE, new
            // DatabaseGetError(error));
            reject(error);
          } else {

            databaseClient.setMetricInputOptions(metricId, inputInfo, (error) => {
              console.log(inputInfo);
              if (error) {
                // TODO: do something to handle the error. Something like:
                // actionContext.dispatch(ACTIONS.SAVE_METRIC_INPUT_OPTS_FAILURE, new
                // DatabaseGetError(error));
                reject(error);
              } else {
                actionContext.dispatch(ACTIONS.UPDATE_PARAM_FINDER_RESULTS, paramFinderResults);
                resolve(paramFinderResults);
              }
            }); // databaseClient.setMetricInputOptions()
          }
        });// databaseClient.setMetricModelOptions()
      }
    });// databaseClient.setMetricAggregationOptions()
  });
}