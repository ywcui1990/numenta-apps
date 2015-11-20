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

import connectToStores from 'fluxible-addons-react/connectToStores';
import fs from 'fs';
import Material from 'material-ui';
import moment from 'moment';
import React from 'react';

import FileStore from '../stores/FileStore';
import FileDetailsStore from '../stores/FileDetailsStore';
import FileDetailsSaveAction from '../actions/FileDetailsSave';
import HideFileDetailsAction from '../actions/HideFileDetails';
import Utils from '../../main/Utils';
import {TIMESTAMP_FORMATS} from '../lib/Constants';

const {
  Dialog, TextField, List, ListItem, Checkbox,
  Table, TableHeader, TableRow, TableHeaderColumn, TableBody, TableRowColumn
} = Material;

/**
 * Show file details page. The file must be available from the {@link FileStore}
 */
 @connectToStores([FileDetailsStore], (context) => ({
   filename: context.getStore(FileDetailsStore).getFileName(),
   visible: context.getStore(FileDetailsStore).isVisible(),
   newFile: context.getStore(FileDetailsStore).isNewFile()
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
    this.state = {
      file: null,
      fileSize: 0,
      data: [],
      metrics: new Map()
    };
  }

  componentWillReceiveProps(nextProps) {
    let file, timestampField;
    let metrics = new Map();
    let data = [];
    let fileSize = 0;

    if (nextProps.visible && nextProps.filename) {
      // Initialize file
      let fileStore = this.context.getStore(FileStore);
      file = fileStore.getFile(nextProps.filename);

      // Initialize metrics
      if (file) {
        file.metrics.forEach((metric) => {
          if (metric.type !== 'date') {
            let modelId = Utils.generateModelId(file.filename, metric.name);
            metrics.set(modelId, null);
          } else {
            timestampField = metric.name;
          }
        });

        // Load first 20 records
        let fileClient = this.context.getFileClient();
        let options = {limit: 20};
        fileClient.getData(file.filename, options, (error, buffer) => {
          if (buffer) {
            data.push(JSON.parse(buffer));
            // Guess timestamp format based the first row
            if (timestampField && data.length === 1) {
              file.timestampFormat = TIMESTAMP_FORMATS.find((format) => {
                return moment(data[0][timestampField], format, true).isValid();
              });
            }
          }
        });
        // File size in bytes
        let stats = fs.statSync(file.filename); // eslint-disable-line no-sync
        fileSize = stats.size;
      }
    }

    // Initialize State
    this.setState({file, fileSize, data, metrics});
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
            multiLine={true}
            rowsMax={2}
            floatingLabelText="Description"
            value={file.description}
            onChange={this._handleFileInputChange.bind(this)}/>

          <TextField ref="fileSize"
            name="fileSize"
            readOnly={true}
            tabIndex={-1}
            underlineFocusStyle={{display:'none'}}
            floatingLabelText="File Size (bytes)"
            value={fileSize}/>

          {this._renderMetrics()}
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
    if (data.length > 0) {
      let columnHeader = Object.keys(data[0]).map((name, idx) => {
        return (<TableHeaderColumn key={idx}>{name}</TableHeaderColumn>);
      });

      let tableRows = [];
      data.map((row, rowIdx) => {
        let columns = [];
        Object.values(row).map((value, colIdx) => {
          columns.push(<TableRowColumn key={colIdx}>{value}</TableRowColumn>);
        });
        tableRows.push(<TableRow key={rowIdx}>{columns}</TableRow>);
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
    if (this.props.newFile) {
      let {file, metrics} = this.state;
      let timestampField = file.metrics.find((metric) => {
        return metric.type === 'date';
      });
      if (timestampField) {
        let items = file.metrics.map((metric) => {
          if (metric.type !== 'date') {
            let modelId = Utils.generateModelId(file.filename, metric.name);
            let checked = metrics.get(modelId) ? true : false; // eslint-disable-line
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
        return (
          <List subheader="Create Models" height="50px">
            {items}
          </List>
        );
      }
    }
  }

  _getStyles() {
    return {
      container: {
        display: 'flex',
        flex: '1 100%',
        flexDirection: 'row'
      },
      fields: {
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      },
      data: {
        display: 'flex',
        flexDirection: 'column',
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
    let {file, metrics} = this.state;
    if (file) {
      // Update File
      this.context.executeAction(FileDetailsSaveAction, {file, metrics});
    }
    this.refs.dialog.dismiss();
  }

  _onMetricCheck(modelId, filename, timestampField, metric, event, checked) {
    let state = this.state;
    if (checked) {
      state.metrics.set(modelId, {
        modelId, filename, metric, timestampField
      });
    } else {
      state.metrics.delete(modelId);
    }
    this.setState(state);
  }
}
