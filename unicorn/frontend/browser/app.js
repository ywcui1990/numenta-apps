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

import 'babel/polyfill'; // es6/7 polyfill Array.from()

import Fluxible from 'fluxible';
import FluxibleReact from 'fluxible-addons-react';
import React from 'react';
import tapEventInject from 'react-tap-event-plugin';

// internals

// Fluxible.Actions
import ListFilesAction from './actions/ListFiles';
import ListMetricsAction from './actions/ListMetrics';

// Fluxible.Stores
import FileStore from './stores/FileStore';
import ModelStore from './stores/ModelStore';
import ModelDataStore from './stores/ModelDataStore';

// Fluxible.Components (React)
import MainComponent from './components/Main';

// Unicorn Client Libraries
import ConfigClient from './lib/ConfigClient';
import DatabaseClient from './lib/DatabaseClient';
import FileClient from './lib/FileClient';
import ModelClient from './lib/ModelClient';

const config = new ConfigClient();

let databaseClient = new DatabaseClient();
let fileClient = new FileClient();
let modelClient = new ModelClient();

let app;
let context;


// MAIN


// Add model client as plugin
// UnicornPlugin plugin exposing unicorn clients from contexts
// See https://github.com/yahoo/fluxible/blob/master/docs/api/Plugins.md
let UnicornPlugin = {
  name: 'Unicorn',

  plugContext: function (options, context, app) {

    // Get Unicorn options
    let configClient = options.configClient;
    let databaseClient = options.databaseClient;
    let fileClient = options.fileClient;
    let modelClient = options.modelClient;

    return {
      plugComponentContext: function (componentContext, context, app) {
        componentContext.getConfigClient = function () {
          return configClient;
        };
        componentContext.getDatabaseClient = function () {
          return databaseClient;
        };
        componentContext.getFileClient = function () {
          return fileClient;
        };
        componentContext.getModelClient = function () {
          return modelClient;
        };
      },
      plugActionContext: function (actionContext, context, app) {
        actionContext.getConfigClient = function () {
          return configClient;
        };
        actionContext.getDatabaseClient = function () {
          return databaseClient;
        };
        actionContext.getFileClient = function () {
          return fileClient;
        };
        actionContext.getModelClient = function () {
          return modelClient;
        };
      },
      plugStoreContext: function (storeContext, context, app) {
        storeContext.getConfigClient = function () {
          return configClient;
        };
        storeContext.getDatabaseClient = function () {
          return databaseClient;
        };
        storeContext.getFileClient = function () {
          return fileClient;
        };
        storeContext.getModelClient = function () {
          return modelClient;
        };
      }
    };
  }
};


// GUI APP

document.addEventListener('DOMContentLoaded', () => {

  if (config.get('NODE_ENV') !== 'production') {
    window.React = React; // expose to React dev tools
  }

  tapEventInject(); // @TODO remove when >= React 1.0

  // init GUI flux/ible app
  app = new Fluxible({
    component: MainComponent,
    stores: [FileStore, ModelStore, ModelDataStore]
  });

  // Plug Unicorn plugin giving access to Unicorn clients
  app.plug(UnicornPlugin);

  // add context to app
  context = app.createContext({
    configClient: config,
    databaseClient,
    fileClient,
    modelClient
  });

  // Start listening for model events
  modelClient.start(context);

  // fire initial app action to load all files
  context.executeAction(ListFilesAction, {})
    .then((files) => {
      return Promise.all(files.map((file) => {
        return context.executeAction(ListMetricsAction, file.filename);
      }));
    })
    .then(() => {
      let contextEl = FluxibleReact.createElementWithContext(context);
      if (document && ('body' in document)) {
        React.render(contextEl, document.body);
        return;
      }
      throw new Error('React cannot find a DOM document.body to render to');
    })
    .catch((error) => {
      throw new Error('Unable to start Application:', error);
    });

}); // DOMContentLoaded
