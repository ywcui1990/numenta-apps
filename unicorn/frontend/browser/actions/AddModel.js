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

/**
 * Add new model
 * @param  {FluxContext} actionContext
 * @param  {Object} payload {
 *                          	modelId: 'id',
 *                            filename: 'file',
 *                            timestampField: 'timestampField',
 *                            metric: 'metric'
 *                          }
 * @return {Promise}
 */
export default (actionContext, payload) => {
  return new Promise(resolve => {
    // TODO: Create new model and persist model reference
    let model = Object.assign({
      active: true
    }, payload);
    actionContext.dispatch('ADD_MODEL_SUCCESS', model);
    resolve(model);
  });
};
