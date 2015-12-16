// Copyright © 2015, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero Public License version 3 as published by the Free
// Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/

/*eslint-disable*/
/**
 * @external {BaseStore} http://fluxible.io/addons/BaseStore.html
 * @external {FluxibleContext} http://fluxible.io/api/fluxible-context.html
 * @external {React.Component} https://facebook.github.io/react/docs/component-api.html
 */
/*eslint-enable*/

import bunyan from 'bunyan';
import Fluxible from 'fluxible';
import FluxibleReact from 'fluxible-addons-react';
import React from 'react';
import ReactDOM from 'react-dom';
import remote from 'remote';
import tapEventInject from 'react-tap-event-plugin';

import ConfigClient from './lib/Unicorn/ConfigClient';
import DatabaseClient from './lib/Unicorn/DatabaseClient';
import FileClient from './lib/Unicorn/FileClient';
import FileDetailsStore from './stores/FileDetailsStore';
import FileStore from './stores/FileStore';
import ListFilesAction from './actions/ListFiles';
import ListMetricsAction from './actions/ListMetrics';
import loggerConfig from '../config/logger';
import MainComponent from './components/Main';
import MetricDataStore from './stores/MetricDataStore';
import ModelClient from './lib/Unicorn/ModelClient';
import ModelDataStore from './stores/ModelDataStore';
import ModelStore from './stores/ModelStore';
import UnicornPlugin from './lib/Fluxible/Plugins/Unicorn';

// The following Electron .remote() Clients don't work with
//  `babel-plugin-add-module-exports` for some reason, so we must use
//  the long-form `.default` accessor here.
// @see http://stackoverflow.com/questions/33505992/babel-6-changes-how-it-exports-default
// const DatabaseClient = require('./lib/Unicorn/DatabaseClient').default;
// const FileClient = require('./lib/Unicorn/FileClient').default;

const dialog = remote.require('dialog');
const config = new ConfigClient();
const logger = bunyan.createLogger(loggerConfig);

// init Client instances to speak to backend
let databaseClient = new DatabaseClient();
let fileClient = new FileClient();
let modelClient = new ModelClient();


/**
 * Unicorn: Cross-platform Desktop Application to showcase basic HTM features
 *  to a user using their own data stream or files. Main browser web code
 *  Application GUI entry point.
 */
document.addEventListener('DOMContentLoaded', () => {
  let app, context;

  // global uncaught exception handler
  window.onerror = (message, file, line, col, error) => {
    dialog.showErrorBox('Unknown Error', `Unknown Error: ${message}`);
  };

  // verify web target
  if (!(document && ('body' in document))) {
    dialog.showErrorBox('Document Error', 'No document body found');
  }

  // expose React to dev tools
  if (config.get('NODE_ENV') !== 'production') {
    window.React = React; // expose dev tools to browser
  }

  tapEventInject(); // @TODO remove when >= React 1.0

  // init GUI flux/ible app
  app = new Fluxible({
    component: MainComponent,
    stores: [
      FileStore, ModelStore, ModelDataStore, MetricDataStore, FileDetailsStore
    ]
  });

  // Plug Unicorn plugin giving access to Unicorn clients
  app.plug(UnicornPlugin);

  // add context to app
  context = app.createContext({
    configClient: config,
    loggerClient: logger,
    databaseClient,
    fileClient,
    modelClient
  });

  // Start listening for model events
  modelClient.start(context.getActionContext());

  // fire initial app action to load all files
  context.executeAction(ListFilesAction, {})
    .then((files) => {
      return context.executeAction(ListMetricsAction, files);
    })
    .then(() => {
      let contextEl = FluxibleReact.createElementWithContext(context);
      let container = document.getElementById('main');
      ReactDOM.render(contextEl, container);
    })
    .catch((error) => {
      dialog.showErrorBox('Startup Error', `Startup Error: ${error}`);
    });
}); // DOMContentLoaded
