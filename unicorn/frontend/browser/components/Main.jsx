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

import csp from 'js-csp';
import React from 'react';

import AppBar from 'material-ui/lib/app-bar';
import applyMaterialTheme from 'material-ui/lib/styles/theme-decorator';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import MenuItem from 'material-ui/lib/menus/menu-item';
import SvgIconContentAdd from 'material-ui/lib/svg-icons/content/add';
import ThemeManager from 'material-ui/lib/styles/theme-manager';

// internals

import '../stylesheets/Main.scss';

import FileAddAction from '../actions/FileAdd';
import FileList from '../components/FileList';
import FileUploadAction from '../actions/FileUpload';
import LeftNav from '../components/LeftNav';
import ModelList from '../components/ModelList';
import UnicornTheme from '../lib/MaterialUI/UnicornTheme';

const ThemeDecorator = ThemeManager.getMuiTheme(UnicornTheme);


/**
 * React Main View Component
 * @class
 * @extends React.Component
 * @module
 * @public
 * @this MainComponent
 */
@applyMaterialTheme(ThemeDecorator)
export default class MainComponent extends React.Component {

  static contextTypes = {
    executeAction: React.PropTypes.func.isRequired
  };

  constructor(props, context) {
    super(props, context);
  }

  /**
   * Add "+" upload new data/CSV file button onClick event handler
   */
  _onClick() {
    this.context.executeAction(FileAddAction, {});

    /* open file upload window */
    let fileInput = React.findDOMNode(this.refs.fileInput);
    fileInput.value = null;
    fileInput.click();
  }

  _onFileSelect(e) {
    let selectedFiles = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    let max = this.props.multiple ? selectedFiles.length : 1;
    let files = [];
    let file;

    e.preventDefault();

    for (let i = 0; i < max; i++) {
      let file = selectedFiles[i];
      file.preview = URL.createObjectURL(file);
      files.push(file);
    }

    if (this.props._onFileSelect) {
      this.props._onFileSelect(files, e);
    }

    /* The file input is limited to 1 file only, so files.length is always 1 */
    file = files[0];
    this.context.executeAction(FileUploadAction, file);
  }

  /**
   * Render
   * @method
   * @public
   * @returns {object} Abstracted React/JSX DOM representation to render to HTML
   * @this MainComponent
   * @TODO Better + ADD fonticon
   * @TODO Tooltip on + ADD icon - "Upload new CSV file" or something
   */
  render() {
    let style = {zIndex: 4};
    return (
      <main>
        <AppBar title="Unicorn" zDepth={4} style={style} />
        <LeftNav />
        <nav>
          <ModelList />
          <FileList />
        </nav>
        <section>
          <h1>Unicorn</h1>
          <FloatingActionButton onClick={this._onClick.bind(this)} zDepth={6}>
            <SvgIconContentAdd/>
          </FloatingActionButton>
          <input onChange={this._onFileSelect.bind(this)} ref="fileInput"
                 type="file" />
        </section>
      </main>
    );
  }

}
