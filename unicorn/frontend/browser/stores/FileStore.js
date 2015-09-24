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

import BaseStore from 'fluxible/addons/BaseStore';


/**
 * Unicorn File Datasource Store
 */
export default class FileStore extends BaseStore {

  static storeName = 'FileStore';

  static handlers = {
    'UPLOADED_FILE_SUCCESS': '_handleAddFile',
    'LIST_FILES_SUCCESS': '_handleListFiles',
    'LIST_METRICS_SUCCESS': '_handleListMetrics'
  };

  constructor(dispatcher) {
    super(dispatcher);
    this._files = new Map();
  }

  getFiles() {
    return Array.from(this._files.values());
  }

  _handleListFiles(files) {
    if (files) {
      files.forEach((f => {
        f.metrics = [];
        this._files.set(f.filename, f);
      }));
      this.emitChange();
    }
  }

  _handleAddFile(file) {
    this._files.set(file.filename, file);
    this.emitChange();
  }

  _handleListMetrics(payload) {
    let file = this._files.get(payload.filename);
    if (file) {
      file.metrics = payload.metrics;
      this.emitChange();
    }
  }
};
