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

'use strict';


// externals

import React from 'react';

import applyMaterialTheme from 'material-ui/lib/styles/theme-decorator';
import MuiLeftNav from 'material-ui/lib/left-nav';
import ThemeManager from 'material-ui/lib/styles/theme-manager';

// internals

import '../stylesheets/LeftNav.scss';

import UnicornTheme from '../lib/MaterialUI/UnicornTheme';

const ThemeDecorator = ThemeManager.getMuiTheme(UnicornTheme);


/**
 * LeftNav custom View Component
 * @class
 * @extends React.Component
 * @module
 * @public
 * @this LeftNav
 */
@applyMaterialTheme(ThemeDecorator)
export default class LeftNav extends React.Component {

  constructor(props, context) {
    super(props, context);
  }

  /**
   * Render
   * @method
   * @public
   * @returns {object} Abstracted React/JSX DOM representation to render to HTML
   * @this LeftNav
   */
  render() {
    let menuItems = {};
    return (
      <MuiLeftNav className="LeftNav" menuItems={menuItems} title="Unicorn" zDepth={16} />
    );
  }

}
