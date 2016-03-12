// Copyright © 2016, Numenta, Inc. Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero Public License version 3 as published by the
// Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program. If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/


// import Checkbox from 'material-ui/lib/checkbox'; // @FIXME: UNI-323

import connectToStores from 'fluxible-addons-react/connectToStores';
import Dialog from 'material-ui/lib/dialog';
import FlatButton from 'material-ui/lib/flat-button';
import fs from 'fs';
import React from 'react';
import Table from 'material-ui/lib/table/table';
import TableBody from 'material-ui/lib/table/table-body';
import TableHeader from 'material-ui/lib/table/table-header';
import TableHeaderColumn from 'material-ui/lib/table/table-header-column';
import TableRow from 'material-ui/lib/table/table-row';
import TableRowColumn from 'material-ui/lib/table/table-row-column';
import TextField from 'material-ui/lib/text-field';
import Colors from 'material-ui/lib/styles/colors';

import FileDetailsStore from '../stores/FileDetailsStore';
import FileUploadAction from '../actions/FileUpload';
import HideFileDetailsAction from '../actions/HideFileDetails';

const STYLES = {
  dialog: {
    margin: '1rem'
  },
  error: {
    color: Colors.red500
  },
  container: {
    display: 'flex',
    flex: '1 100%',
    flexDirection: 'column'
  },
  fields: {
    display: 'flex',
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0
  },
  data: {
    display: 'flex',
    flexDirection: 'row',
    flexGrow: 1,
    margin: 'auto',
    border: '1px solid gray'
  },
  tableRow: {
    height: '2rem'
  },
  tableHeader: {
    overflow: 'hidden',
    height: '2rem',
    textOverflow: 'ellipsis'
  },
  tableColumn: {
    overflow: 'hidden',
    height: '2rem',
    textOverflow: 'ellipsis'
  }
};

/**
 * Show file details page. The file must be available from the {@link FileStore}
 */
@connectToStores([FileDetailsStore], (context) => ({
  file: context.getStore(FileDetailsStore).getFile(),
  error: context.getStore(FileDetailsStore).getError(),
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
      fileSize: 0,
      data: []
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.visible && nextProps.file) {
      let file = nextProps.file;
      // File size in bytes
      let stats = fs.statSync(file.filename); // eslint-disable-line no-sync
      let fileSize = stats.size;

      // Load first 20 records
      let data = [];
      let fileClient = this.context.getFileClient();
      fileClient.getData(file.filename, {limit: 20}, (error, buffer) => {
        if (error) {
          throw new Error(error);
        } else if (buffer) {
          data.push(JSON.parse(buffer));
        } else {
          // Initialize State
          this.setState({fileSize, data});
        }
      });
    }
  }

  _onRequestClose() {
    this.context.executeAction(HideFileDetailsAction);
  }

  _onSave() {
    let file = this.props.file;
    if (file) {
      this.context.executeAction(FileUploadAction, file.filename);
    }
    this.context.executeAction(HideFileDetailsAction);
  }

  _renderDataTable() {
    let columnHeader;
    let data = this.state.data;
    let tableRows = [];
    let tableHeight = this.props.error ? 200 : 250;

    if (data.length > 0) {
      columnHeader = Object.keys(data[0]).map((name, idx) => {
        return (
          <TableHeaderColumn key={idx} style={STYLES.tableHeader}>
            {name}
          </TableHeaderColumn>
        );
      });

      data.forEach((row, rowIdx) => {
        let columns = [];
        Object.values(row).map((value, colIdx) => {
          columns.push(<TableRowColumn key={colIdx}
            style={STYLES.tableColumn}>{value}</TableRowColumn>);
        });
        tableRows.push(<TableRow style={STYLES.tableRow}
          key={rowIdx}>{columns}</TableRow>);
      });

      return (
        <Table selectable={false} fixedHeader={true} height={tableHeight}>
          <TableHeader adjustForCheckbox={false} displaySelectAll={false}
                       enableSelectAll={false}>
            <TableRow style={STYLES.tableRow}>
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

  _renderBody() {
    let file = this.props.file;
    // File Size in KB
    let fileSize = (this.state.fileSize / 1024).toFixed();
    let error;
    if (this.props.error) {
      error =  (<p style={STYLES.error}>{this.props.error}</p>);
    }
    return (
      <div style={STYLES.container}>
        {error}
        <div style={STYLES.fields}>
          <TextField
            floatingLabelText="File Size"
            underlineFocusStyle={{display:'none'}}
            underlineStyle={{display:'none'}}
            readOnly={true}
            tabIndex={-1}
            name="fileSize"
            ref="fileSize"
            value={`${fileSize} KB`}/>
          <TextField
            floatingLabelText="Number of rows"
            name="numOfRows"
            readOnly={true}
            ref="numOfRows"
            tabIndex={-1}
            underlineFocusStyle={{display:'none'}}
            underlineStyle={{display:'none'}}
            value={file.records.toString()}/>
        </div>
        <div style={STYLES.data}>
          {this._renderDataTable()}
        </div>
      </div>
    );
  }

  _renderActions() {
    if (this.props.newFile) {
      return [
        <FlatButton label="Cancel"
                    onRequestClose={this._onRequestClose.bind(this)}
                    onTouchTap={this._onRequestClose.bind(this)}/>,

        <FlatButton label="Add File" primary={true} ref="submit"
                    disabled={this.props.error}
                    onRequestClose={this._onRequestClose.bind(this)}
                    onTouchTap={this._onSave.bind(this)}/>
      ];
    }
    return(<FlatButton label="Close" primary={true}
                       onRequestClose={this._onRequestClose.bind(this)}
                       onTouchTap={this._onRequestClose.bind(this)}/>);
  }

  render() {
    let body, title;
    let file = this.props.file;
    if (file) {
      title = file.name;
      body = this._renderBody();
    }
    let actions = this._renderActions();
    return (
      <Dialog actions={actions} title={title} open={this.props.visible}
              style={STYLES.dialog}
              onRequestClose={this._onRequestClose.bind(this)}>
        {body}
      </Dialog>
    );
  }
}
