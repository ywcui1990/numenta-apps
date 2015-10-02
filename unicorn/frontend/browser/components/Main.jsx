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

import csp from 'js-csp';
import Material from 'material-ui';
import React from 'react';

// internals

import FileAddAction from '../actions/FileAdd';
import FileList from '../components/FileList';
import FileUploadAction from '../actions/FileUpload';
import ModelList from '../components/ModelList';
import SvgIconContentAdd from 'material-ui/lib/svg-icons/content/add';

const {
  FloatingActionButton, Styles
} = Material;

const ThemeManager = new Styles.ThemeManager();


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
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },

  /**
   * Add "+" upload new data/CSV file button onClick event handler
   */
  _onClick() {
    this.context.executeAction(FileAddAction, {});

    /* open file upload window */
    let fileInput = React.findDOMNode(this.refs.fileInput);
    fileInput.value = null;
    fileInput.click();
  },

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
        <div style={{marginLeft: '256px'}}>
          <h1>Unicorn</h1>
          <FloatingActionButton onClick={this._onClick}>
            <SvgIconContentAdd/>
          </FloatingActionButton>
          <input onChange={this._onFileSelect} ref="fileInput"
            style={{display: 'none'}} type="file"/>
        </div>
        <ModelList/>
        <FileList/>
      </div>
    );
  }
});
