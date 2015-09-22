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

import AddModelAction from '../actions/AddModel';
import DeleteModelAction from '../actions/DeleteModel';
import connectToStores from 'fluxible-addons-react/connectToStores';
import ModelStore from '../stores/ModelStore';
import FileStore from '../stores/FileStore';
import Material from 'material-ui';
import React from 'react';

var ModelUtils = require('../lib/ModelUtils');

const {
  List, ListItem, Checkbox, Paper
} = Material;

@connectToStores([ FileStore, ModelStore ], (context) => ({
  files: context.getStore(FileStore).getFiles()
}))
export default class FileList extends React.Component {

  static contextTypes = {
    executeAction: React.PropTypes.func,
    getStore: React.PropTypes.func,
    muiTheme: React.PropTypes.object,
  };

  constructor(props, context) {
    super(props, context);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(Object.assign({}, this.state, nextProps));
  }

  _getStyles() {
    let leftNavStyle = this.context.muiTheme.component.leftNav;
    return {
      root: {
        position: 'fixed',
        height: '100%',
        width: leftNavStyle.width,
        top: 0,
        left: 0,
        zIndex: 10,
        backgroundColor: leftNavStyle.color,
      }
    };
  }

  _onMetricCheck(modelId, filename, timestampField, metric, event, checked) {
    if (checked) {
      this.context.executeAction(AddModelAction, {
        modelId: modelId,
        filename: filename,
        metric: metric,
        timestampField: timestampField
      });
    } else {
      this.context.executeAction(DeleteModelAction, modelId);
    }
  }

  _renderMetrics(file) {
    let timestampField = file.metrics.find((metric) => {
      return metric.type === 'date';
    });
    if (timestampField) {
      return file.metrics.map(metric => {
        if (metric.type !== 'date') {
          let modelId = ModelUtils.generateModelId(file.filename, metric.name);
          let modelStore = this.context.getStore(ModelStore);
          let checked = modelStore.getModel(modelId)
            ? true
            : false;
          return (
            <ListItem key={modelId}
              leftCheckbox={<Checkbox name={modelId}
              checked={checked}
              onCheck={this._onMetricCheck.bind(this, modelId, file.filename,
                timestampField.name, metric.name)}/>}
              primaryText={metric.name}/>
          );
        }
      });
    }
  }

  _renderFiles(filetype) {
    return this.props.files.map(file => {
      if (file.type === filetype) {
        return (
          <ListItem initiallyOpen={true}
            key={file.name}
            nestedItems={this._renderMetrics(file)}
            primaryText={file.name}/>
        );
      }
    });
  }

  render() {
    let styles = this._getStyles();
    return (
      <Paper style={styles.root} zDepth={2}>
        <List subheader='Sample Data'>
          {this._renderFiles('sample')}
        </List>
        <List subheader='Your Data'>
          {this._renderFiles('uploaded')}
        </List>
      </Paper>
    );
  }
};
