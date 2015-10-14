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


// externals

import React from 'react';

import applyMaterialTheme from 'material-ui/lib/styles/theme-decorator';
import connectToStores from 'fluxible-addons-react/connectToStores';

import Checkbox from 'material-ui/lib/checkbox';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import Paper from 'material-ui/lib/paper';
import ThemeManager from 'material-ui/lib/styles/theme-manager';

// internals

import AddModelAction from '../actions/AddModel';
import DeleteModelAction from '../actions/DeleteModel';
import FileStore from '../stores/FileStore';
import ModelStore from '../stores/ModelStore';
import UnicornTheme from '../lib/MaterialUI/UnicornTheme';
import Utils from '../../lib/Utils';

const StoreDecorator = (context) => ({
  files: context.getStore(FileStore).getFiles()
});
const ThemeDecorator = ThemeManager.getMuiTheme(UnicornTheme);


/**
 * @module
 * @exports
 * @class
 * @public
 * @extends React.Component
 */
@applyMaterialTheme(ThemeDecorator)
@connectToStores([FileStore, ModelStore], StoreDecorator)
export default class FileList extends React.Component {

  static get contextTypes() {
    return {
      executeAction: React.PropTypes.func,
      getStore: React.PropTypes.func,
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
  }

  componentWillReceiveProps(nextProps) {
    this.setState(Object.assign({}, this.state, nextProps));
  }

  _getStyles() {
    let leftNavStyle = this.context.muiTheme.leftNav;
    return {
      root: {
        position: 'fixed',
        height: '100%',
        width: leftNavStyle.width,
        top: 0,
        left: 0,
        zIndex: 10,
        backgroundColor: leftNavStyle.color
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
          let modelId = Utils.generateModelId(file.filename, metric.name);
          let modelStore = this.context.getStore(ModelStore);
          let checked = modelStore.getModel(modelId) ? true : false;
          return (
            <ListItem key={modelId}
              leftCheckbox={<Checkbox name={modelId}
              checked={checked}
              onCheck={this._onMetricCheck.bind(this, modelId, file.filename,
                timestampField.name, metric.name)}/>}
              primaryText={metric.name} />
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
      <Paper style={styles.root} zDepth={this.props.zDepth}>
        <List subheader="Sample Data">
          {this._renderFiles('sample')}
        </List>
        <List subheader="Your Data">
          {this._renderFiles('uploaded')}
        </List>
      </Paper>
    );
  }

}
