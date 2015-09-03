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

import connectToStores from 'fluxible-addons-react/connectToStores';
import FileStore from '../stores/FileStore';
import Material from 'material-ui';
import React from 'react';

const {
  List, ListItem, Styles, Checkbox, Paper
} = Material;

const ThemeManager = new Styles.ThemeManager();

@connectToStores([FileStore], (context) => ({
  files: context.getStore(FileStore).getFiles()
}))
class FileListComponent extends React.Component {

  static childContextTypes = {
    muiTheme: React.PropTypes.object
  };

  static contextTypes = {
    executeAction: React.PropTypes.func,
    getStore: React.PropTypes.func
  };

  constructor(props) {
    super(props);
  }

  getChildContext() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  }

  _getMetricItems(file) {
    return file.metrics.map(metric => {
      return (
        <ListItem leftCheckbox={<Checkbox />} primaryText={metric.name}/>
      );
    });
  }

  _getStyles() {
    return {
      root: {
        position: 'fixed',
        height: '100%',
        top: 0,
        left: 0
      }
    };
  }
  _getFileItems() {
    return this.props.files.map(file => {
      return (
        <ListItem initiallyOpen={true} nestedItems={this._getMetricItems(file)}
          primaryText={file.name}/>
      );
    });
  }

  render() {
    let styles = this._getStyles();
    return (
      <Paper style={styles.root}>
        <List subheader="Data Sources">
          {this._getFileItems()}
        </List>
      </Paper>
    );
  }
};

export default FileListComponent;
