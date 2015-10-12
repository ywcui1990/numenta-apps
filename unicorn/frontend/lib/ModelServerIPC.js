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
import { ModelServer } from './ModelServer';

export const MODEL_SERVER_IPC_CHANNEL = 'MODEL_SERVER_IPC_CHANNEL';


/**
 * IPC interface to ModelServer
 */
export default class ModelServerIPC {

  constructor() {
    this._webContents = null;
    this._attached = new Set();
    this._server = new ModelServer();
  }

  /**
   * Start listening for IPC events
   */
  start(webContents) {
    // Initialize IPC events
    ipc.on(MODEL_SERVER_IPC_CHANNEL, this._handleIPCEvent.bind(this));
    // Attach to renderer process
    this._webContents = webContents;
  }

  /**
   * Stop listening for IPC Events
   */
  stop() {
    ipc.removeAllListeners(MODEL_SERVER_IPC_CHANNEL);
    this._webContents = null;
  }

  /**
   * Handle IPC calls from renderer process.
   * The supported commands are:
   *  - 'create': Create new HTM model.
   *  						See 'ModelServer#createModel' for 'params' format.
   *  - 'remove': Stops and remove the model
   *  - 'list':   List running models as an Array of IDs in 'returnValue.models'
   *  - 'sendData': Send data to the model. See 'sendData' for 'params' format
   * @param  {Event}  event   IPC Event Object.
   *                          Any error will be returned via 'returnValue.error'
   * @param  {Object} payload Event payload in the following format:
   *                          {
   *                            'modelId': Model Id
   *                            'command': 'create' | 'remove' | 'list'
   *                            				 | 'sendData'
   *                            'params': {Object} // Optional
   *                          }
   */
  _handleIPCEvent(event, payload) {
    let {
      modelId, command
    } = payload;

    try {
      if (command === 'create') {
        this._onCreate(modelId, payload.params) || {};
      } else if (command === 'remove') {
        this._onRemove(modelId) || {};
      } else if (command === 'list') {
        event.returnValue = this._onList() || {};
      } else if (command === 'sendData') {
        this._onSendData(modelId, payload.params) || {};
      } else {
        throw new Error('Unknown model command "' + command + '"');
      }
    } catch (error) {
      if (this._webContents) {
        // Forward error to browser
        this._webContents.send(
          MODEL_SERVER_IPC_CHANNEL,
          modelId,
          'error',
          { error, ipcevent: payload }
        );
      }
    }
  }

  _attach(modelId) {
    if (this._attached.has(modelId)) {
      return ;
    }
    this._attached.add(modelId);
    this._server.on(modelId, (command, payload) => {
      if (!this._attached.has(modelId)) {
        return;
      }
      // forward event to BrowserWindow
      if (this._webContents) {
        this._webContents.send(MODEL_SERVER_IPC_CHANNEL,
                              modelId, command, payload);
      }
    });
  }

  _dettach(modelId) {
    if (this._attached.has(modelId)) {
      this._attached.delete(modelId);
      this._server.removeAllListeners(modelId);
    }
  }

  _onSendData(modelId, data) {
    let input = JSON.parse(data);
    this._server.sendData(modelId, input);
  }

  _onList() {
    return {
      models: this._server.getModels()
    };
  }

  _onCreate(modelId, params) {
    this._attach(modelId);
    this._server.createModel(modelId, params);
  }

  _onRemove(modelId) {
    this._dettach(modelId);
    this._server.removeModel(modelId);
  }
}
