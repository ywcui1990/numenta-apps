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

import 'babel/polyfill';  // es6/7 polyfill Array.from()

import Fluxible from 'fluxible';
import FluxibleReact from 'fluxible-addons-react';
import React from 'react';
import tapEventInject from 'react-tap-event-plugin';

// internals

import ListFilesAction from './actions/ListFiles';
import ListMetricsAction from './actions/ListMetrics';
import MainComponent from './components/Main';
import FileStore from './stores/FileStore';

import ConfigClient from './lib/ConfigClient';
import DatabaseClient from './lib/DatabaseClient';
import FileClient from './lib/FileClient';
import ModelClient from './lib/ModelClient';

const config = new ConfigClient();

var databaseClient = new DatabaseClient();
var fileClient = new FileClient();
var modelClient = new ModelClient();

let app;
let context;


// MAIN


// CLIENT LIB EXAMPLES

// working example/test of sync ConfigClient/Server
console.log('Config env = ', config.get('env'));
console.log('Config target = ', config.get('target'));

// working example/test of async DatabaseClient/Server
var testVal = {
  "name": "Barack Obamar",
  "address": {
    "lines": [ "1600 Pennsylvania Avenue Northwest" ],
    "zip": "DC 20500",
    "city": "Washington",
    "country": "USA"
  },
  "votes": 123
};
databaseClient.put(testVal.name, testVal, (error) => {
  if (error) {
    throw new Error(error);
  }
  databaseClient.get(testVal.name, (error, data) => {
    if (error) {
      throw new Error(error);
    }
    console.log('get from db ', testVal.name, data);
  });
});


// GUI APP

document.addEventListener('DOMContentLoaded', () => {

  // dev tools @TODO remove for non-dev
  window.React = React;

  tapEventInject(); // @TODO remove when >= React 1.0

  // init GUI flux/ible app
  app = new Fluxible({
    component: MainComponent,
    stores: [FileStore]
  });

  // add context to app
  context = app.createContext();

  // fire initial app action to load all files
  context.executeAction(ListFilesAction, {})
    .then((files) => {
      // Load all metrics
      Promise.all(files.map((file) => {
        return context.executeAction(ListMetricsAction, file.filename);
      })).then(() => {
        let contextEl = FluxibleReact.createElementWithContext(context);
        if (document && ('body' in document)) {
          React.render(contextEl, document.body);
          return;
        }
        throw new Error('React cannot find a DOM document.body to render to.');
      });
    })
    .catch((err) => {
      if (err) {
        throw new Error('Unable to start Application:', err);
      }
    });

}); // DOMContentLoaded
