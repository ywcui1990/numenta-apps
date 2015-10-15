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


import React from 'react';


/**
 * Logo custom View Component
 * @class
 * @extends React.Component
 * @module
 * @public
 * @this Logo
 */
export default class Logo extends React.Component {

  constructor(props, context) {
    super(props, context);

    this._style = {
      backgroundColor: '#29aae2', // @todo refactor
      color: '#fff', // @todo refactor
      height: '64px', // @todo refactor
      margin: 0,
      padding: '1rem', // @todo refactor
      width: '100%'
    };
  }

  /**
   * Render
   * @method
   * @public
   * @returns {object} Abstracted React/JSX DOM representation to render to HTML
   * @this Logo
   */
  render() {
    return (
      <h1 style={this._style}>Unicorn</h1>
    );
  }

}
