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


// externals

import applyMaterialTheme from 'material-ui/lib/styles/theme-decorator';
import Paper from 'material-ui/lib/paper';
import React from 'react';
import ThemeManager from 'material-ui/lib/styles/theme-manager';

// internals

import FileList from '../components/FileList';
import Logo from '../components/Logo';
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

  static get contextTypes() {
    return {
      muiTheme: React.PropTypes.object
    };
  }

  static get propTypes() {
    return {
      zDepth: React.PropTypes.number
    };
  }

  static get defaultProps() {
    return {
      zDepth: 1
    };
  }

  constructor(props, context) {
    super(props, context);

    let muiTheme = this.context.muiTheme;
    this._style = {
      backgroundColor: muiTheme.leftNav.color,
      height: '100%',
      left: 0,
      position: 'fixed',
      top: 0,
      width: muiTheme.leftNav.width
    };
  }

  /**
   * Render
   * @method
   * @public
   * @returns {object} Abstracted React/JSX DOM representation to render to HTML
   * @this LeftNav
   */
  render() {
    return (
      <Paper style={this._style} zDepth={this.props.zDepth}>
        <Logo />
        <FileList />
      </Paper>
    );
  }

}
