/* -----------------------------------------------------------------------------
 * Copyright © 2015, Numenta, Inc. Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * -------------------------------------------------------------------------- */


/**
 * Unicorn: Cross-platform Desktop Application to showcase basic HTM features
 *  to a user using their own data stream or files.
 *
 * Main browser web code Application GUI entry point.
 */

// externals

import Fluxible       from 'fluxible';
import FluxibleAddons from 'fluxible/addons';
import FluxibleReact  from 'fluxible-addons-react';
import React          from 'react';

// internals

const { createStore } = FluxibleAddons;
const {
  connectToStores,
  createElementWithContext,
  provideContext
} = FluxibleReact;


// FLUX

// Action
const action = (actionContext, payload) => {
  actionContext.dispatch('FOO_ACTION', payload);
};

// Store
const FooStore = createStore({
  storeName: 'FooStore',
  handlers: {
    'FOO_ACTION': 'fooHandler'
  },
  initialize: function () {
    this.foo = null;
  },
  fooHandler: function (payload) {
    this.foo = payload;
  },
  getState: function () {
    return {
      foo: this.foo
    };
  }
});

// Component
class App extends React.Component {
  render () {
    return <span>{this.props.foo}</span>
  }
};
App = provideContext(connectToStores(App, [FooStore], (context, props) => {
  return context.getStore(FooStore).getState();
}));


// MAIN

const app = new Fluxible({
  component:  App,
  stores:     [FooStore]
});

const context = app.createContext();

context.executeAction(action, 'bar', (err) => {
  console.log(React.renderToString(createElementWithContext(context)));
  if(document) document.write(React.renderToString(createElementWithContext(context)));
});
