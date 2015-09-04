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
import FileList from '../components/FileList';
import SvgIconContentAdd from 'material-ui/lib/svg-icons/content/add';


const {
  Card, CardText, FloatingActionButton, Styles
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
  _onClick () {
    console.log('got clicked! firing AddAction.');
    this.context.executeAction(AddAction, { /*payload*/ });
    console.log('AddAction should have fired.');
    this.openFileUpload();
  },

  openFileUpload: function () {
    var fileInput = React.findDOMNode(this.refs.fileInput);
    fileInput.value = null;
    fileInput.click();
  },

  onFileSelect: function onFileSelect(e) {
    console.log('processingFile');
    e.preventDefault();

    this.setState({
      isDragActive: false
    });

    var droppedFiles = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    var max = this.props.multiple ? droppedFiles.length : 1;
    var files = [];

    for (var i = 0; i < max; i++) {
      var file = droppedFiles[i];
      file.preview = URL.createObjectURL(file);
      files.push(file);
    }

    if (this.props.onDrop) {
      this.props.onDrop(files, e);
    }
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
            <input type='file' ref='fileInput' style={{display: 'none'}}
              onChange={this.onFileSelect} multiple />
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Donec mattis pretium massa. Aliquam erat volutpat. Nulla facilisi.
              Donec vulputate interdum sollicitudin. Nunc lacinia auctor quam
              sed pellentesque. Aliquam dui mauris, mattis quis lacus id,
              pellentesque lobortis odio.
            </p>
          </CardText>
        </Card>
        <FileList/>
      </div>
    );
  }

});
