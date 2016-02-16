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


import {ipcRenderer as ipc} from 'electron';

import ParamFinderErrorAction from '../../actions/ParamFinderError';
import StartParamFinderAction from '../../actions/StartParamFinder';

const PARAM_FINDER_IPC_CHANNEL = 'PARAM_FINDER_IPC_CHANNEL';

/**
 * Unicorn: ParamFinderClient - Talk to a ParamFinderService over IPC, gaining
 *  access to the Backend NuPIC Param Finder. Connects via IPC adapter.
 */
export default class ParamFinderClient {
  constructor() {
    this._context = null;
  }

  start(actionContext) {
    this._context = actionContext;
    ipc.on(PARAM_FINDER_IPC_CHANNEL, this._handleIPCEvent.bind(this));
  }

  startParamFinder(params) {
    ipc.send(PARAM_FINDER_IPC_CHANNEL, {
      command: 'start',
      params: JSON.stringify(params)
    });
  }

  _handleIPCEvent(event, modelId, command, payload) {
    if (this._context) {
      if (command === 'data') {
        setTimeout(() => this._handleModelData(modelId, payload));
      } else if (command === 'error') {
        let {error, ipcevent} = payload;
        setTimeout(() => this._handleIPCError(modelId, error, ipcevent));
      } else if (command === 'close') {
        setTimeout(() => this._handleCloseModel(modelId ,payload));
      } else {
        console.error(`Unknown command: ${command} ${payload}`); // eslint-disable-line
      }
    }
  }

}