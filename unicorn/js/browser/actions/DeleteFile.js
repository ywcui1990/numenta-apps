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

import {ACTIONS} from '../lib/Constants';

/**
 * Delete file and its models from the database
 * @param  {FluxibleContext} actionContext -
 * @param  {string} filename - The name of the file to delete.
 *                             Must be in the {@link FileStore}
 * @todo UNI-238 Implement delete file and its models
 */
export default function (actionContext, filename) {
  actionContext.dispatch(ACTIONS.DELETE_FILE, filename);
}
