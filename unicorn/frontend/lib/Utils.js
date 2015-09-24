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

import crypto from 'crypto';


export default {

  /**
   * Genereate unique model id based on seed string using 1-way hash algo (SHA1)
   * @param  {string} seed - Seed string to hash
   * @return {string} Unique id
   */
  generateId (seed) {
    let hash = crypto.createHash('sha1');
    return hash.update(seed).digest('hex');
  },

  /**
   * Genereate unique file id based on the file name using hashing
   * @param  {string} filename - The absolute path
   * @return {string} Unique id
   */
  generateFileId (filename) {
    return this.generateId(filename + '#');
  },

  /**
   * Genereate unique model id based on the filename and metric name via hashing
   * @param  {string} filename - The absolute path
   * @param  {string} metric - Metric name
   * @return {string} Unique id
   */
  generateModelId (filename, metric) {
    return this.generateId(filename + '#' + metric);
  }

};
