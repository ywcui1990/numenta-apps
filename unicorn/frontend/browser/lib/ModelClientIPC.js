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
import ReceiveDataAction from '../actions/ReceiveData';

const MODEL_SERVER_IPC_CHANNEL = 'MODEL_SERVER_IPC_CHANNEL';

export default class ModelClientIPC {
  constructor() {
    this._context = null;
  }

  start(context) {
    this._context = context;
    ipc.on(MODEL_SERVER_IPC_CHANNEL, this._handleIPCEvent.bind(this));
  }

  _handleIPCEvent(modelId, command, payload) {
    if (this._context) {
      if (command === 'data') {
        this._context.executeAction(ReceiveDataAction, {
          'modelId': modelId,
          'data': JSON.parse(payload)
        });
      }
    }
  }

  createModel(modelId, params, callback) {
    let res = ipc.sendSync(MODEL_SERVER_IPC_CHANNEL, {
      'modelId': modelId,
      'command': 'create',
      'params': JSON.stringify(params)
    });
    if ('error' in res) {
      callback(res['error']);
    } else {
      callback(null, {
        'modelId': modelId
      });
    }
  }

  removeModel(modelId, callback) {
    let res = ipc.sendSync(MODEL_SERVER_IPC_CHANNEL, {
      'modelId': modelId,
      'command': 'remove',
    });
    if ('error' in res) {
      callback(res['error']);
    } else {
      callback(null, {
        'modelId': modelId
      });
    }
  }

  sendData(modelId, data, callback) {
    let res = ipc.sendSync(MODEL_SERVER_IPC_CHANNEL, {
      'modelId': modelId,
      'command': 'data',
      'params': JSON.stringify(data)
    });
    if ('error' in res) {
      callback(res['error']);
    } else {
      callback(null, data);
    }
  }
}
