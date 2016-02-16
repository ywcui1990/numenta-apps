/* -----------------------------------------------------------------------------
 * Copyright © 2016, Numenta, Inc. Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for
 * more details.
 *
 * You should have received a copy of the GNU Affero Public License along with
 * this program. If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * -------------------------------------------------------------------------- */

import {ipcMain as ipc} from 'electron';

import {ParamFinderService, PARAM_FINDER_EVENT_TYPE} from './ParamFinderService';
import UserError from './UserError';

export const PARAM_FINDER_SERVICE_IPC_CHANNEL = 'PARAM_FINDER_SERVICE_IPC_CHANNEL';

/**
 * IPC interface to Param Finder Service.
 */
export default class ParamFinderServiceIPC {

  constructor() {
    this._webContents = null;
    this._service = new ParamFinderService();
  }

  /**
   * Start listening for IPC events.
   * @param {Object} webContents - Electron webContents object for IPC messages.
   */
  start(webContents) {
    // Initialize IPC events
    ipc.on(PARAM_FINDER_SERVICE_IPC_CHANNEL, this._handleIPCEvent.bind(this));
    // Attach to renderer process
    this._webContents = webContents;
  }

  /**
   * Stop listening for IPC Events.
   */
  stop() {
    ipc.removeAllListeners(PARAM_FINDER_SERVICE_IPC_CHANNEL);
    this._webContents = null;
  }


  /**
   * Handle IPC calls from renderer process.
   * The supported commands are:
   *  - 'start': Start the param finder.
   *              See 'ParamFinderService#startParamFinder' for 'params' format.
   *
   * @param {Event} event - IPC Event Object.
   *                        Any error will be returned via 'returnValue.error'
   * @param {Object} payload - Event payload
   * @param {string} command -  'start'
   * @param {Object} [params] - Command parameters
   */
  _handleIPCEvent(event, payload) {
    const {command} = payload;
    try {
      if (command === 'start') {
        this._onStart(payload.params);
      } else {
        throw new UserError(`Unknown param finder command ${command}`);
      }
    } catch (error) {
      if (this._webContents) {
        // Forward error to browser
        this._webContents.send(
          PARAM_FINDER_SERVICE_IPC_CHANNEL,
          'error',
          {error, ipcevent: payload}
        );
      }
    }
  }


  /**
   * Event callback handler for starting the param finder.
   * @param {Object} params - Parameters to pass to run the param finder
   */
  _onStart(params) {
    this._attach();
    this._service.startParamFinder(params);
  }

  /**
   * Start up .
   */
  _attach() {
    if (this._service.isRunning()) {
      return;
    }

    this._service.on(PARAM_FINDER_EVENT_TYPE, (command, payload) => {
      if (this._service.isRunning()) {
        return;
      }
      // forward event to BrowserWindow
      if (this._webContents) {
        if (command === 'error') {
          this._webContents.send(
            PARAM_FINDER_SERVICE_IPC_CHANNEL,
            PARAM_FINDER_EVENT_TYPE,
            'error',
            {error: new UserError(payload)}
          );
        } else {
          this._webContents.send(
            PARAM_FINDER_SERVICE_IPC_CHANNEL,
            PARAM_FINDER_EVENT_TYPE, command, payload
          );
        }
      }
    });
  }
}