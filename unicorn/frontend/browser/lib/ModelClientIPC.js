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

import ipc from 'ipc';
import ModelErrorAction from '../actions/ModelError';
import ReceiveDataAction from '../actions/ReceiveData';

const MODEL_SERVER_IPC_CHANNEL = 'MODEL_SERVER_IPC_CHANNEL';


export default class ModelClientIPC {
  constructor() {
    this._context = null;
  }

  start(actionContext) {
    this._context = actionContext;
    ipc.on(MODEL_SERVER_IPC_CHANNEL, this._handleIPCEvent.bind(this));
  }

  createModel(modelId, params) {
    ipc.send(MODEL_SERVER_IPC_CHANNEL, {
      'modelId': modelId,
      'command': 'create',
      'params': JSON.stringify(params)
    });
  }

  removeModel(modelId) {
    ipc.send(MODEL_SERVER_IPC_CHANNEL, {
      'modelId': modelId,
      'command': 'remove',
    });
  }

  sendData(modelId, data) {
    ipc.send(MODEL_SERVER_IPC_CHANNEL, {
      'modelId': modelId,
      'command': 'sendData',
      'params': JSON.stringify(data)
    });
  }

  _handleIPCEvent(modelId, command, payload) {
    if (this._context) {
      if (command === 'data') {
        setTimeout(() => this._handleModelData(modelId, payload));
      } else if (command === 'error') {
        let {error, ipcevent} = payload;
        setTimeout(() => this._handleIPCError(error, ipcevent));
      } else {
        console.error('Unknown command:' + command, payload);
      }
    }
  }

  _handleIPCError(error, ipcevent) {
    let {modelId, command} = ipcevent;
    this._context.executeAction(ModelErrorAction, {
      'command' : command,
      'modelId': modelId,
      'error': error
    });
  }

  _handleModelData(modelId, payload) {
    // Multiple data records are separated by `\n`
    let data = payload.trim().split('\n').map((row) => {
      if (row) {
        return JSON.parse(row);
      }
    });
    this._context.executeAction(ReceiveDataAction, {
      'modelId': modelId,
      'data': data
    });
  }
}
