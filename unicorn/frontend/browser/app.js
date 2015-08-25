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
 * Main browser web code Application GUI entry point.
 */

// externals

import Fluxible from 'fluxible';
import FluxibleReact from 'fluxible-addons-react';
import ipc from 'ipc';
import IPCStream from 'electron-ipc-stream';
import React from 'react';
import tapEventInject from 'react-tap-event-plugin';

// internals

import FooAction from './actions/foo';
import FooComponent from './components/foo';
import FooStore from './stores/foo';

// duplex IPC channels on pipe between this renderer process and main process
let ipcDatabase = new IPCStream('database');
let ipcFile = new IPCStream('file');
let ipcModel = new IPCStream('model');

let app;
let context;
let FooView;


// MAIN

document.addEventListener('DOMContentLoaded', () => {

  // IPC stream examples: -------------------
  ipcFile.on('data', (chunk) => {
    console.log('chunk', chunk);
  });
  ipcFile.on('end', () => {});
  // ipcFile.write({ test: 'from-renderer-to-main' });
  // ipcFile.end();
    // ReadableStream.pipe(WriteableStream);
    // FaucetAbove.pipe(DownDrain);


  // GUI APP

  window.React = React; // dev tools @TODO remove for non-dev

  tapEventInject(); // @TODO remove when >= React 1.0

  // prepare inital gui context
  FooView = FluxibleReact.provideContext(
    FluxibleReact.connectToStores(
      FooComponent,
      [ FooStore ],
      (context, props) => {
        return context.getStore(FooStore).getState();
      }
    )
  );

  // init GUI flux/ible app
  app = new Fluxible({
    component: FooComponent,
    stores: [ FooStore ]
  });

  // add context to app
  context = app.createContext();

  // fire initial app action
  context.executeAction(FooAction, 'bar', (err) => {
    let output = React.renderToString(
      FluxibleReact.createElementWithContext(context)
    );

    console.log(output);
    if(document) document.write(output); // @TODO the right way.
  });

}); // DOMContentLoaded
