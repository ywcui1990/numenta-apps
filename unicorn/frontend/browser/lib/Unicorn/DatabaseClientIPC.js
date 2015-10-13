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


import ipc from 'ipc';
import ModelErrorAction from '../actions/ModelError';

const DATABASE_SERVER_IPC_CHANNEL = 'DATABASE_SERVER_IPC_CHANNEL';


/**
 *
 */
export default class DatabaseClientIPC {

  /**
   *
   */
  constructor() {
    this._context = null;
  }

  /**
   *
   */
  start(actionContext) {
    this._context = actionContext;
    ipc.on(DATABASE_SERVER_IPC_CHANNEL, this._handleIPCEvent.bind(this));
  }

  /**
   *
   */
  getFile(uid, callback) {
    let params = { uid, callback };
    ipc.send(DATABASE_SERVER_IPC_CHANNEL, {
      command: 'getFile',
      params: JSON.stringify(params)
    });
  }

  /**
   *
   */
  getFiles(query, callback) {
    let params = { query, callback };
    ipc.send(DATABASE_SERVER_IPC_CHANNEL, {
      command: 'getFiles',
      params: JSON.stringify(params)
    });
  }

  /**
   *
   */
  putFile(file, callback) {
    let params = { file, callback };
    ipc.send(DATABASE_SERVER_IPC_CHANNEL, {
      command: 'putFile',
      params: JSON.stringify(params)
    });
  }

  /**
   *
   */
  putFiles(files, callback) {
    let params = { files, callback };
    ipc.send(DATABASE_SERVER_IPC_CHANNEL, {
      command: 'putFiles',
      params: JSON.stringify(params)
    });
  }

  /**
   *
   */
  _handleIPCEvent(command, payload) {
    if (this._context) {
      if (command === 'data') {
        setTimeout(() => this._handleData(payload));
      } else if (command === 'error') {
        let {error, ipcevent} = payload;
        setTimeout(() => this._handleIPCError(error, ipcevent));
      } else {
        console.error('Unknown command:' + command, payload);
      }
    }
  }

  /**
   *
   */
  _handleIPCError(error, ipcevent) {
    let {command} = ipcevent;
    this._context.executeAction(ModelErrorAction, { command, error });
  }

  /**
   *
   */
  _handleData(payload) {
    // this._context.executeAction(ReceiveDataAction, { 'data': data });
  }

}
