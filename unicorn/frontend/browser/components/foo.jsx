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
 * React View Component: Foo
 */

// externals

import Material from 'material-ui';
import React from 'react';

// internals

import AddAction from '../actions/add';
import SvgIconContentAdd from 'material-ui/lib/svg-icons/content/add'

let Theme = new Material.Styles.ThemeManager();

let {
  Card, CardText, FloatingActionButton, FontIcon, LeftNav
} = Material;

let menuItems = [
  { text: 'File One' },
  { text: 'File Two' },
  { text: 'File Three' }
];


// MAIN

/**
 *
 */
module.exports = React.createClass({

  contextTypes: {
    executeAction: React.PropTypes.func.isRequired
  },

  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  /**
   *
   */
  getChildContext () {
    return {
      muiTheme: Theme.getCurrentTheme()
    };
  },

  /**
   * Add "+" upload new data/CSV file button onClick event handler
   */
  _onClick () {
    console.log('got clicked! firing AddAction.');
    this.context.executeAction(AddAction, { /*payload*/ });
    console.log('AddAction should have fired.');
  },

  /**
   *
   * @TODO Migrate inline styles on Card
   * @TODO Better + ADD fonticon
   * @TODO Tooltip on + ADD icon - "Upload new CSV file" or something
   */
  render () {
    return (
      <div>
        <Card style={{ marginLeft: '256px' }}>
          <CardText>
            <h1>Welcome</h1>
            <FloatingActionButton onClick={this._onClick}>
              <SvgIconContentAdd />
            </FloatingActionButton>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Donec mattis pretium massa. Aliquam erat volutpat. Nulla facilisi.
              Donec vulputate interdum sollicitudin. Nunc lacinia auctor quam
              sed pellentesque. Aliquam dui mauris, mattis quis lacus id,
              pellentesque lobortis odio.
            </p>
          </CardText>
        </Card>
        <LeftNav menuItems={menuItems} ref="leftNav" />
      </div>
    );
  }

});
