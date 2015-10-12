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


// externals

import 'babel/polyfill'; // es6/7 polyfill Array.from()

import bunyan from 'bunyan';
import csp from 'js-csp';
import Fluxible from 'fluxible';
import FluxibleReact from 'fluxible-addons-react';
import React from 'react';
import tapEventInject from 'react-tap-event-plugin';

// internals

import ListFilesAction from './actions/ListFiles';
import ListMetricsAction from './actions/ListMetrics';

import FileStore from './stores/FileStore';
import ModelStore from './stores/ModelStore';
import ModelDataStore from './stores/ModelDataStore';

import MainComponent from './components/Main';

import ConfigClient from './lib/Unicorn/ConfigClient';
import DatabaseClient from './lib/Unicorn/DatabaseClient';
import FileClient from './lib/Unicorn/FileClient';
import ModelClient from './lib/Unicorn/ModelClient';

// setup

const config = new ConfigClient();
const log = bunyan.createLogger({
  name: 'Unicorn:Renderer',
  streams: [{ // @TODO hardcoded to Dev right now, needs Prod mode. Refactor.
    level: 'debug',  // @TODO higher for Production
    stream: {
      write(rec) {
        let name = bunyan.nameFromLevel[rec.level];
        let method = (name === 'debug') ? 'log' : name;
        console[method]('[%s]: %s', name, rec.msg);
      }
    },
    type: 'raw'
  }]
});

let databaseClient = new DatabaseClient();
let fileClient = new FileClient();
let modelClient = new ModelClient();

let app;
let context;


/**
 * Unicorn: Cross-platform Desktop Application to showcase basic HTM features
 *  to a user using their own data stream or files.
 *
 * Main browser web code Application GUI entry point.
 */

// UnicornPlugin plugin exposing unicorn clients from contexts
// See https://github.com/yahoo/fluxible/blob/master/docs/api/Plugins.md
let UnicornPlugin = {
  name: 'Unicorn',
  plugContext: function (options, context, app) {
    let configClient = options.configClient;
    let loggerClient = options.loggerClient;
    let databaseClient = options.databaseClient;
    let fileClient = options.fileClient;
    let modelClient = options.modelClient;
    return {
      plugActionContext: function (actionContext, context, app) {
        actionContext.getConfigClient = function () {
          return configClient;
        };
        actionContext.getLoggerClient = function () {
          return loggerClient;
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
      plugComponentContext: function (componentContext, context, app) {
        componentContext.getConfigClient = function () {
          return configClient;
        };
        componentContext.getLoggerClient = function () {
          return loggerClient;
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
      plugStoreContext: function (storeContext, context, app) {
        storeContext.getConfigClient = function () {
          return configClient;
        };
        storeContext.getLoggerClient = function () {
          return loggerClient;
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
  } // plugContext
}; // UnicornPlugin


// APP BROWSER GUI

document.addEventListener('DOMContentLoaded', () => {
  csp.go(function* () {

    if (!(document && ('body' in document))) {
      throw new Error('React cannot find a DOM document.body to render to');
    }

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
      loggerClient: log,
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
        React.render(contextEl, document.body);
      })
      .catch((error) => {
        throw new Error('Unable to start Application:', error);
      });

  }); // csp.go()
}); // DOMContentLoaded
