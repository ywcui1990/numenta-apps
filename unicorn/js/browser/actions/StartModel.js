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
 * Start model
 * @param {FluxibleContext} actionContext - Fluxible action context object
 * @param payload
 * @param payload.metricId: Id of the metric against which the model will be run
 * @param payload.inputOpts: input options to start the model
 * @param payload.aggOpts: aggregation options
 * @param payload.modelOpts: model params options
 */
export default function (actionContext, payload) {

  // TODO: store input Opts here

  console.log('DEBUG: StartModel', payload);
  let modelClient = actionContext.getModelClient();
  let metricId = payload.metricId;
  let inputOpts = payload.inputOpts;
  let aggOpts = payload.aggOpts;
  let modelOpts = payload.modelOpts;
  modelClient.createModel(metricId, inputOpts, aggOpts, modelOpts);
  actionContext.dispatch(ACTIONS.START_MODEL, payload);
}
