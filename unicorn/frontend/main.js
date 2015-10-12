// Copyright © 2015, Numenta, Inc. Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it
// under the terms of the GNU Affero Public License version 3 as published by
// the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for
// more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program. If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/


// externals

import app from 'app';
import bunyan from 'bunyan';
import BrowserWindow from 'browser-window';
import crashReporter from 'crash-reporter';
import path from 'path';

// internals

import Config from './lib/ConfigServer';
import ModelServerIPC from './lib/ModelServerIPC';

const config = new Config();
const log = bunyan.createLogger({
  name: 'Unicorn:Main',
  level: 'debug'  // @TODO higher for Production
});
const initialPage = path.join(__dirname, '/browser/index.html');

let mainWindow = null; // global ref to keep window object from JS GC
let modelServer = null;


/**
 * Unicorn: Cross-platform Desktop Application to showcase basic HTM features
 *  to a user using their own data stream or files.
 *
 * Main Electron code Application entry point, initializes browser app.
 */

// electron crash reporting
crashReporter.start({
  product_name: config.get('title'),
  company_name: config.get('company')
});

// app events
app.on('window-all-closed', () => {
  // OS X apps stay active until the user quits explicitly Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// MAIN

// Electron finished init and ready to create browser window
app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 720
    // @TODO fill out options
    //  https://github.com/atom/electron/blob/master/docs/api/browser-window.md
  });
  mainWindow.loadUrl(`file://${initialPage}`);
  mainWindow.openDevTools();
  mainWindow.on('closed', () => {
    mainWindow = null; // dereference single main window object
  });
  mainWindow.webContents.on('dom-ready', () => {
    log.debug('Electron Main/Renderer + Chrome DOM = Ready to rock.');
  });

  // Handle IPC commuication for the ModelServer
  modelServer = new ModelServerIPC();
  modelServer.start(mainWindow.webContents);
});
