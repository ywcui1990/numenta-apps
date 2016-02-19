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
 * Dispatches model errors
 * @param  {FluxActionContext} actionContext [description]
 * @param  {object} payload       [description]
 * @emits {START_MODEL_FAILED}
 * @emits {STOP_MODEL_FAILED}
 * @emits {UNKNOWN_MODEL_FAILURE}
 * @return {Promise}               [description]
 */
export default function (actionContext, payload) {
  console.log('DEBUG: ModelErrorAction:payload', payload);

  let {command, modelId, error} = payload;

  if (command === 'create') {
    return actionContext.dispatch(ACTIONS.START_MODEL_FAILED, {
      modelId, error
    });
  } else if (command === 'remove') {
    return actionContext.dispatch(ACTIONS.STOP_MODEL_FAILED, {
      modelId, error
    });
  }
  return actionContext.dispatch(ACTIONS.UNKNOWN_MODEL_FAILURE, {
    modelId, error
  });
}
