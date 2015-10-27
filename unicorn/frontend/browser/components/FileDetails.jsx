// Numenta Platform for Intelligent Computing (NuPIC)
// Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero Public License version 3 as
// published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License
// along with this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/

import React from 'react';
import FileStore from '../stores/FileStore';
import ModelStore from '../stores/ModelStore';
import FileDetailsStore from '../stores/FileDetailsStore';
import Material from 'material-ui';
import Utils from '../../lib/Utils';
import FileUpdateAction from '../actions/FileUpdate';
import DeleteModelAction from '../actions/DeleteModel';
import HideFileDetailsAction from '../actions/HideFileDetails';
import AddModelAction from '../actions/AddModel';
import connectToStores from 'fluxible-addons-react/connectToStores';
import fs from 'fs';

const {
  Dialog, TextField, List, ListItem, Checkbox,
  Table, TableHeader, TableRow, TableHeaderColumn, TableBody, TableRowColumn
} = Material;

/**
 * Show file details page. The file must be available from the {FileStore}
 */
 @connectToStores([FileDetailsStore], (context) => ({
   filename: context.getStore(FileDetailsStore).getFileName(),
   visible: context.getStore(FileDetailsStore).isVisible()
 }))
export default class FileDetails extends React.Component {

  static contextTypes = {
    executeAction: React.PropTypes.func,
    getStore: React.PropTypes.func,
    getFileClient: React.PropTypes.func,
    muiTheme: React.PropTypes.object
  };

  constructor(props, context) {
    super(props, context);
    this.state = {file: null, fileSize: 0, data:[], models:[]};
  }

  componentWillReceiveProps(nextProps) {
    let models = [];
    let data = [];
    let file;
    let fileSize = 0;

    if (nextProps.visible && nextProps.filename) {
      // Initialize file
      let fileStore = this.context.getStore(FileStore);
      file = fileStore.getFile(nextProps.filename);

      // Initialize models
      if (file) {
        let modelStore = this.context.getStore(ModelStore);
        models = new Map(file.metrics.map((metric) => {
          let modelId = Utils.generateModelId(file.filename, metric.name);
          let checked = this.state.models && modelStore.getModel(modelId)
                          ? metric.type !== 'date' : false; // eslint-disable-line
          return [modelId, checked];
        }));

        // Load first 20 records
        let fileClient = this.context.getFileClient();
        let options = {limit: 20};
        fileClient.getData(file.filename, options, (error, buffer) => {
          if (buffer) {
            data.push(JSON.parse(buffer));
          }
        });
        // File size in bytes
        let stats = fs.statSync(file.filename);
        fileSize = stats.size;
      }
    }

    // Initialize State
    this.setState({file, fileSize, data, models});
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.visible) {
      this.refs.dialog.show();
    } else {
      this.refs.dialog.dismiss();
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    // Only update if visible
    return nextProps.visible;
  }
  render() {
    let body, title;
    if (this.state.file) {
      title = this.state.file.name;
      body = this._renderBody();
    }
    return (
      <Dialog ref="dialog" title={title} actions={[
          {text: 'Cancel'},
          {text: 'Save', onTouchTap: this._onSave.bind(this), ref: 'submit'}]}
          actionFocus="submit" onDismiss={this._onDismiss.bind(this)}>
        {body}
      </Dialog>)
  }

  _renderBody() {
    let styles = this._getStyles();
    let file = this.state.file;
    let fileSize = this.state.fileSize;

    return (
      <div style={styles.container}>

        <div style={styles.fields}>

          <TextField ref="description"
            name="description"
            multiLine={true} rows={2}
            floatingLabelText="Description"
            value={file.description}
            onChange={this._handleFileInputChange.bind(this)}/>

          <TextField ref="timestampFormat"
            name="timestampFormat"
            floatingLabelText="Timestamp Format"
            value={file.timestampFormat}
            onChange={this._handleFileInputChange.bind(this)}/>

          <TextField ref="fileSize"
            name="fileSize"
            readOnly={true}
            floatingLabelText="File Size (bytes)"
            value={fileSize}/>

          <List subheader="Create Models" height="50px">
            {this._renderMetrics()}
          </List>
        </div>

        <div style={styles.data}>
          {this._renderDataTable()}
        </div>
      </div>
    );
  }

  _renderDataTable() {
    let styles = this._getStyles();

    let data = this.state.data;
    if (data) {
      let columnHeader = Object.keys(data[0]).map((name) => {
        return (<TableHeaderColumn>{name}</TableHeaderColumn>);
      });

      let tableRows = [];
      data.map((row) => {
        let columns = [];
        Object.values(row).map((value) => {
          columns.push(<TableRowColumn>{value}</TableRowColumn>);
        });
        tableRows.push(<TableRow>{columns}</TableRow>);
      });

      return (
        <Table height="300px" selectable={false} fixedHeader={true}
          style={styles.table}>
          <TableHeader adjustForCheckbox={false} displaySelectAll={false}
            enableSelectAll={false}>
            <TableRow>
              {columnHeader}
            </TableRow>
          </TableHeader>
          <TableBody stripedRows={true} displayRowCheckbox={false}>
            {tableRows}
          </TableBody>
        </Table>
      );
    }
  }

  _renderMetrics() {
    let {file, models} = this.state;
    let metrics = file.metrics;
    let timestampField = metrics.find((metric) => {
      return metric.type === 'date';
    });
    if (timestampField) {
      return metrics.map((metric) => {
        if (metric.type !== 'date') {
          let modelId = Utils.generateModelId(file.filename, metric.name);
          let checked = models.get(modelId) ? true : false; // eslint-disable-line
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

  _getStyles() {
    return {
      container: {
        display: 'flex',
        flex: '1 100%',
        'flex-direction': 'row'
      },
      fields: {
        display: 'flex',
        'flex-direction': 'column',
        flexShrink: 0
      },
      data: {
        display: 'flex',
        'flex-direction': 'column',
        flexGrow: 1,
        margin: 'auto',
        marginLeft: 15,
        border: '1px solid gray'
      },
      table: {
        tableLayout: 'auto'
      }
    }
  }

  _handleFileInputChange(e) {
    let name = e.target.name;
    let value = e.target.value;
    let state = this.state;
    state.file[name] = value;
    this.setState(state);
  }

  _onDismiss() {
    this.context.executeAction(HideFileDetailsAction);
  }

  _onSave() {
    let state = this.state;
    // Update File
    if (state.file) {
      this.context.executeAction(FileUpdateAction, state.file);
    }
    // Update models
    let modelStore = this.context.getStore(ModelStore);
    for (let [modelId, modelParams] of state.models) {
      if (modelStore.getModel(modelId)) {
        if (!modelParams) {
          // Delete model
          this.context.executeAction(DeleteModelAction, modelId);
        }
      } else if (modelParams) {
        // Create models
        this.context.executeAction(AddModelAction, modelParams);
      }
    }
    this.refs.dialog.dismiss();
  }

  _onMetricCheck(modelId, filename, timestampField, metric, event, checked) {
    let state = this.state;
    if (checked) {
      state.models.set(modelId, {
        modelId, filename, metric, timestampField
      });
    } else {
      state.models.delete(modelId);
    }
    this.setState(state);
  }
}
