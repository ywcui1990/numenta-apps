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
      START_PARAM_FINDER: '_handleStartParamFinder',
      RECEIVE_PARAM_FINDER_DATA: '_handleReceiveParamFinderData'
    }
  }

  _reset() {

    // CreateModelDialog Store
    this.fileName = null;
    this.metricName = null;
    this.open = false;

    // MetricsStore
    this.paramFinderResults = new Map();
    this.inputOpts = new Map();
  }

  constructor(dispatcher) {
    super(dispatcher);
    this._reset();
  }

  _handleStartParamFinder(payload) {
    console.log('DEBUG: MetricStore:_handleStartParamFinder:payload', payload);
    let metricId = payload.metricId;
    let inputOpts = payload.inputOpts;
    this.inputOpts.set(metricId, inputOpts);
    console.log('DEBUG: MetricStore:_handleStartParamFinder:this.inputOpts', this.inputOpts);
    this.emitChange();
  }

  _handleShowCreateModelDialog(payload) {
    this.fileName = payload.fileName;
    this.metricName = payload.metricName;
    this.open = true;
    this.emitChange();
  }

  _handleHideCreateModelDialog() {
    this._reset();
    this.emitChange();
  }

  _handleReceiveParamFinderData(payload) {
    let paramFinderResults = JSON.parse(payload.paramFinderResults);
    let metricId = payload.metricId;
    this.paramFinderResults.set(metricId, paramFinderResults);
    console.log('DEBUG: MetricStore', this.paramFinderResults);
    this.emitChange();
  }
}