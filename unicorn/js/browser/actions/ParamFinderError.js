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

export default function (actionContext, payload) {

  console.log('DEBUG: ParamFinderErrorAction', payload);
  let {command, metricId, error} = payload;


  if (command === 'create') {
    return actionContext.dispatch(ACTIONS.START_PARAM_FINDER_FAILED, {
      metricId, error
    });
  } else if (command === 'remove') {
    return actionContext.dispatch(ACTIONS.STOP_PARAM_FINDER_FAILED, {
      metricId, error
    });
  }

  return actionContext.dispatch(ACTIONS.UNKNOWN_PARAM_FINDER_FAILURE, {
    metricId, error
  });
}
