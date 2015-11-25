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

import Colors from 'material-ui/lib/styles/colors';
import connectToStores from 'fluxible-addons-react/connectToStores';
import IconClose from 'material-ui/lib/svg-icons/navigation/arrow-drop-down';
import IconMore from 'material-ui/lib/svg-icons/navigation/more-vert';
import IconOpen from 'material-ui/lib/svg-icons/navigation/arrow-drop-up';
import Material from 'material-ui';
import React from 'react';
import remote from 'remote';

// internals

import CreateModelAction from '../actions/CreateModel';
import DeleteFileAction from '../actions/DeleteFile';
import DeleteModelAction from '../actions/DeleteModel';
import ExportModelResultsAction from '../actions/ExportModelResults';
import FileStore from '../stores/FileStore';
import HideModelAction from '../actions/HideModel';
import ModelStore from '../stores/ModelStore';
import ShowFileDetailsAction from '../actions/ShowFileDetails';
import ShowMetricDetailsAction from '../actions/ShowMetricDetails';
import ShowModelAction from '../actions/ShowModel';
import Utils from '../../main/Utils';

// locals

const dialog = remote.require('dialog');

const {
  Checkbox, Dialog, IconButton, IconMenu, List, ListItem, MenuItem
} = Material;

const DIALOG_STRINGS = {
  model: {
    title: 'Delete Model',
    message: 'Deleting this model will delete the associated model results.' +
              ' Are you sure you want to delete this model?'
  },
  file: {
    title: 'Delete File',
    message: 'Deleting this dataset will delete the associated models.' +
              ' Are you sure you want to delete this file?'
  }
}


/**
 * Component used to display a list of files
 */
@connectToStores([FileStore, ModelStore], (context) => ({
  files: context.getStore(FileStore).getFiles(),
  models: context.getStore(ModelStore).getModels()
}))
export default class FileList extends React.Component {

  static get contextTypes() {
    return {
      executeAction: React.PropTypes.func,
      getStore: React.PropTypes.func,
      muiTheme: React.PropTypes.object
    };
  }

  constructor(props, context) {
    super(props, context);

    let showNested = {};

    // prep visibility toggle nested file contents
    props.files.forEach((file) => {
      showNested[file.uid] = true;
    });

    // init state
    this.state = Object.assign({
      confirmDialog: null,
      showNested
    }, props);
  }

  /**
   * Opens a modal confirmation dialog
   * @param  {string}   title    Dialog title
   * @param  {string}   message  Dialog Message
   * @param  {Function} callback Function to be called on confirmation
   */
  _confirmDialog(title, message, callback) {
    this.setState({
      confirmDialog: {
        message, title, callback
      }
    });
  }

  _dismissDialog() {
    this.setState({
      confirmDialog: null
    });
  }

  _onMetricCheck(modelId, event, checked) {
    if (checked) {
      this.context.executeAction(ShowModelAction, modelId);
    } else {
      this.context.executeAction(HideModelAction, modelId);
    }
  }

  _exportModelResults(modelId) {
    dialog.showSaveDialog({
      title: 'Export Model Results',
      defaultPath: 'Untitled.csv'
    }, (filename) => {
      this.context.executeAction(ExportModelResultsAction, {modelId, filename});
    })
  }

  _handleFileToggle(fileId, event) {
    let ref = this.refs[`file-toggle-${fileId}`];
    let showNested = this.state.showNested;

    // custom icon toggle
    showNested[fileId] = !showNested[fileId];
    this.setState({showNested});

    // piggyback on default MaterialUI nested show/hide
    ref.setState({open: !ref.state.open});
  }

  _handleFileContextMenu(filename, event, action) {
    if (action === 'detail') {
      this.context.executeAction(ShowFileDetailsAction, filename);
    } else if (action === 'delete') {
      this._confirmDialog(
        DIALOG_STRINGS.file.title,
        DIALOG_STRINGS.file.message,
        () => {
          this.context.executeAction(DeleteFileAction, filename);
          this._dismissDialog();
        }
      );
    }
  }

  _handleMetricContextMenu(
    modelId, filename, timestampField, metric, event, action
  ) {
    if (action === 'details') {
      this.context.executeAction(ShowMetricDetailsAction, modelId);
    } else if (action === 'create') {
      this.context.executeAction(CreateModelAction, {
        modelId, filename, metric, timestampField
      });
    } else if (action === 'delete') {
      this._confirmDialog(
        DIALOG_STRINGS.model.title,
        DIALOG_STRINGS.model.message,
        () => {
          this.context.executeAction(DeleteModelAction, modelId);
          this._dismissDialog();
        }
      );
    } else if (action === 'export') {
      this._exportModelResults(modelId);
    }
  }

  _renderMetrics(file) {
    let timestampField = file.metrics.find((metric) => {
      return metric.type === 'date';
    });
    if (timestampField) {
      return file.metrics.map((metric) => {
        if (metric.type !== 'date') {
          let modelId = Utils.generateModelId(file.filename, metric.name);
          let models = this.props.models;
          let model = models.find((m) => m.modelId === modelId);
          let hasModel = false;
          if (model) {
            hasModel = true;
          }
          let contextMenu = (
            <IconMenu
              className="context-menu-icon"
              style={{whiteSpace: 'nowrap'}}
              onChange={
                this._handleMetricContextMenu.bind(
                  this, modelId, file.filename, timestampField.name, metric.name
                )
              }
              iconButtonElement={
                <IconButton>
                  <IconMore color={Colors.grey500} />
                </IconButton>
              }
            >
              <MenuItem index={1} value="details">
                Metric Details
              </MenuItem>
              <MenuItem index={2} value="create" disabled={hasModel}>
                Create Model
              </MenuItem>
              <MenuItem index={3} value="delete" disabled={!hasModel}>
                Delete Model
              </MenuItem>
              <MenuItem index={4} value="export" disabled={!hasModel}>
                Export Results
              </MenuItem>
            </IconMenu>
          );
          let isModelVisible = hasModel && model && model.visible;

          return (
            <ListItem key={modelId}
              className="context-menu-item"
              leftCheckbox={<Checkbox name={modelId} ref={`${modelId}-checkbox`}
              checked={isModelVisible}
              disabled={!hasModel}
              onCheck={this._onMetricCheck.bind(this, modelId)}/>}
              rightIconButton={contextMenu}
              primaryText={metric.name} />
          );
        }
      });
    }
  }

  _renderFiles(filetype) {
    return this.props.files.map((file) => {
      if (file.type === filetype) {
        let fileId = file.uid;
        let filename = file.filename;
        let toggleIcon;
        let contextMenu = (
          <IconMenu
            iconButtonElement={
              <IconButton>
                <IconMore color={Colors.grey500} />
              </IconButton>
            }
            onChange={this._handleFileContextMenu.bind(this, filename)}
            style={{whiteSpace: 'nowrap'}}
          >
            <MenuItem index={1} disabled={filetype === 'sample'} value="delete">
              Delete
            </MenuItem>
            <MenuItem index={2} value="detail">
              Details
            </MenuItem>
          </IconMenu>
        );

        // choose file visibility toggle icon
        if (this.state.showNested[fileId]) {
          toggleIcon = (<IconClose />);
        } else {
          toggleIcon = (<IconOpen />);
        }

        return (
          <ListItem
            initiallyOpen={true}
            key={file.name}
            leftIcon={
              <IconButton onTouchTap={
                this._handleFileToggle.bind(this, fileId)
              }>
                {toggleIcon}
              </IconButton>
            }
            nestedItems={this._renderMetrics(file)}
            primaryText={file.name}
            ref={`file-toggle-${fileId}`}
            rightIconButton={contextMenu} />
        );
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.confirmDialog !== null) {
      this.refs.confirmDialog.show();
    } else if (prevState.confirmDialog !== null) {
      this.refs.confirmDialog.dismiss();
    }
  }

  render() {
    let confirmDialog = this.state.confirmDialog || {};
    let dialogActions = [
       {text: 'Cancel'},
       {text: 'Delete', onTouchTap: confirmDialog.callback, ref: 'submit'}
    ];

    return (
      <nav>
        <List subheader="Sample Data">
          {this._renderFiles('sample')}
        </List>
        <List subheader="Your Data">
          {this._renderFiles('uploaded')}
        </List>
        <Dialog title={confirmDialog.title}
          ref="confirmDialog"
          modal={true}
          actions={dialogActions}
          onDismiss={this._dismissDialog.bind(this)}
          actionFocus="submit">
          {confirmDialog.message}
        </Dialog>
      </nav>
    );
  }
}
