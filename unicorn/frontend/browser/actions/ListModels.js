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
 * Get List of models
 */
export default (actionContext) => {
  return new Promise(resolve => {
    // TODO: Load persisted model references
    let list = [
      {modelId: 'id1', filename: 'filename1', metric: 'metric1'},
      {modelId: 'id2', filename: 'filename2', metric: 'metric2'},
      {modelId: 'id3', filename: 'filename3', metric: 'metric3'}
    ];
    actionContext.dispatch('LIST_MODELS_SUCCESS', list);
    resolve(list);
  });
};
