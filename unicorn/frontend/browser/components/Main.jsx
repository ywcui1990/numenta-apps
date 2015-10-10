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
import Material from 'material-ui';
import React from 'react';
import SvgIconContentAdd from 'material-ui/lib/svg-icons/content/add';
import ThemeManager from 'material-ui/lib/styles/theme-manager';

// internals

import '../stylesheets/Main.scss';

import FileAddAction from '../actions/FileAdd';
import FileList from '../components/FileList';
import FileUploadAction from '../actions/FileUpload';
import ModelList from '../components/ModelList';
import UnicornTheme from '../lib/MaterialUI/UnicornTheme';

const {FloatingActionButton} = Material;


/**
 * React Main View Component
 */
export default class MainComponent extends React.Component {

  static contextTypes = {
    executeAction: React.PropTypes.func.isRequired
  };

  static childContextTypes = {
    muiTheme: React.PropTypes.object
  };

  constructor(props, context) {
    super(props, context);
  }

  getChildContext() {
    return {
      muiTheme: ThemeManager.getMuiTheme(UnicornTheme)
    };
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
   * @TODO Better + ADD fonticon
   * @TODO Tooltip on + ADD icon - "Upload new CSV file" or something
   */
  render() {
    return (
      <div>
        <nav>
          <ModelList/>
          <FileList/>
        </nav>
        <main>
          <h1>Unicorn</h1>
          <FloatingActionButton onClick={this._onClick.bind(this)}>
            <SvgIconContentAdd/>
          </FloatingActionButton>
          <input onChange={this._onFileSelect.bind(this)} ref="fileInput" type="file" />
        </main>
      </div>
    );
  }

}
