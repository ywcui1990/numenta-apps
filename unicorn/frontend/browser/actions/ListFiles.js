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

import FileClient from '../lib/FileClient';
/**
 * Get List of files from backend
 */
export default (actionContext) => {
  return new Promise((resolve, reject) => {
    let fileClient = new FileClient();
    fileClient.getSampleFiles((error, files) => {
      if (error) {
        console.log('Error getting files:', error);
        actionContext.dispatch('LIST_FILES_FAILURE', {
          'error': error
        });
        reject(error);
      } else {
        actionContext.dispatch('LIST_FILES_SUCCESS', files);
        resolve(files);
      }
    });
  });
};
