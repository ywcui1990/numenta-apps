/* -----------------------------------------------------------------------------
 * Copyright © 2015, Numenta, Inc. Unless you have purchased from
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

'use strict';


/**
 * Unicorn: Cross-platform Desktop Application to showcase basic HTM features
 *  to a user using their own data stream or files.
 *
 * Main Electron code Application entry point, initializes browser app.
 */

// externals

import app from 'app';
import BrowserWindow  from 'browser-window';
import crashReporter  from 'crash-reporter';
import ipc from 'ipc';
import IPCStream from 'electron-ipc-stream';

// internals

let mainWindow = null; // global reference to keep window object from JS GC


// MAIN

crashReporter.start({
  product_name: 'Unicorn',
  company_name: 'Numenta'
});

app.on('window-all-closed', () => {
  // OS X apps stay active until the user quits explicitly Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// Electron finished init and ready to create browser window
app.on('ready', () => {
  let ipcDatabase;
  let ipcFile;
  let ipcModel;

  mainWindow = new BrowserWindow({
    width:  1200,
    height: 720
    // @TODO fill out options
    //  https://github.com/atom/electron/blob/master/docs/api/browser-window.md
  });

  // duplex IPC channels on pipe between this main process and renderer process
  ipcDatabase = new IPCStream('database', mainWindow);
  ipcFile = new IPCStream('file', mainWindow);
  ipcModel = new IPCStream('model', mainWindow);

  mainWindow.loadUrl('file://' + __dirname + '/browser/index.html');
  mainWindow.openDevTools();
  mainWindow.on('closed', () => {
    mainWindow = null; // dereference single main window object
  });
  mainWindow.webContents.on('dom-ready', (event) => {

    // IPC stream examples: -------------------
    ipcFile.on('data', (chunk) => {
      console.log('chunk', chunk);
    });
    ipcFile.on('end', () => {});
    ipcFile.write({ test: 'from-main-to-renderer' });
    // ipcFile.end();
      // ReadableStream.pipe(WriteableStream);
      // FaucetAbove.pipe(DownDrain);

  });
});
