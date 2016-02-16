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


import BaseStore from 'fluxible/addons/BaseStore';

export default class MetricStore extends BaseStore {

  static get storeName() {
    return 'MetricStore';
  }

  static get handlers() {
    return {
      SHOW_CREATE_MODEL_DIALOG: '_handleShowCreateModelDialog',
      HIDE_CREATE_MODEL_DIALOG: '_handleHideCreateModelDialog',
      UPDATE_PARAM_FINDER_RESULTS: '_handleUpdateParamFinderResults'
    }
  }

  constructor(dispatcher) {
    super(dispatcher);
    this._reset();
  }

  _handleShowCreateModelDialog(payload) {
    console.log(payload);
    this.fileName = payload.fileName;
    this.metricName = payload.metricName;
    this.open = true;
    this.emitChange();
  }

  _handleHideCreateModelDialog() {
    this._reset();
    this.emitChange();
  }

  _handleUpdateParamFinderResults(paramFinderResults) {
    this.paramFinderResults = paramFinderResults;
    this.emitChange();
  }

  _reset() {
    this.paramFinderResults = null;
    this.fileName = null;
    this.metricName = null;
    this.open = false;
  }
}