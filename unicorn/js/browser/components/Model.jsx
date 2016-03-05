// Copyright © 2016, Numenta, Inc.  Unless you have purchased from
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

import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardHeader from 'material-ui/lib/card/card-header';
import CardText from 'material-ui/lib/card/card-text';
import Checkbox from 'material-ui/lib/checkbox';
import CheckboxOutline from 'material-ui/lib/svg-icons/toggle/check-box-outline-blank';
import Colors from 'material-ui/lib/styles/colors';
import connectToStores from 'fluxible-addons-react/connectToStores';
import Dialog from 'material-ui/lib/dialog';
import FlatButton from 'material-ui/lib/flat-button';
import path from 'path';
import React from 'react';
import {remote} from 'electron';

import CreateModelDialog from '../components/CreateModelDialog'
import DeleteModelAction from '../actions/DeleteModel';
import ExportModelResultsAction from '../actions/ExportModelResults';
import FileStore from '../stores/FileStore';
import MetricStore from '../stores/MetricStore';
import ModelData from '../components/ModelData';
import ModelStore from '../stores/ModelStore';
import ShowCreateModelDialogAction from '../actions/ShowCreateModelDialog';
import StartParamFinderAction from '../actions/StartParamFinder';

const dialog = remote.require('dialog');
const MOMENTS_TO_DATETIME =
  require('../../config/momentjs_to_datetime_strptime.json');


/**
 * Model component, contains Chart details, actions, and Chart Graph itself.
 */
@connectToStores([ModelStore, FileStore, MetricStore], (context) => ({
  files: context.getStore(FileStore).getFiles()
}))
export default class Model extends React.Component {

  static get contextTypes() {
    return {
      executeAction: React.PropTypes.func,
      getConfigClient: React.PropTypes.func,
      getStore: React.PropTypes.func,
      muiTheme: React.PropTypes.object
    };
  }

  static get propTypes() {
    return {
      modelId: React.PropTypes.string.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    let store = this.context.getStore(ModelStore);
    let model = store.getModel(this.props.modelId);

    this._config = this.context.getConfigClient();

    // init state
    this.state = Object.assign({
      deleteConfirmDialog: null,
      showNonAgg: false  // show raw data overlay on top of aggregate chart?
    }, model);

    // style
    this._styles = {
      root: {
        marginBottom: '1rem',
        width: '100%'
      },
      title: {
        marginTop: -3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '13rem'
      },
      actions: {
        textAlign: 'right',
        marginRight: 0,
        marginTop: '-5.5rem'
      },
      showNonAgg: {
        root: {
          width: '100%'
        },
        checkbox: {
          marginRight: 7
        }
      }
    };
  }

  componentWillReceiveProps(nextProps) {
    let store = this.context.getStore(ModelStore);
    let model = store.getModel(nextProps.modelId);
    this.setState(Object.assign({}, model));
  }

  /**
   * Opens a modal confirmation dialog
   * @param {String} title - Dialog title
   * @param {String} message - Dialog Message
   * @param {Function} callback - Function to be called on confirmation
   */
  _showDeleteConfirmDialog(title, message, callback) {
    this.setState({
      deleteConfirmDialog: {callback, message, title}
    });
  }

  _dismissDeleteConfirmDialog() {
    this.setState({
      deleteConfirmDialog: null
    });
  }

  _createModel(metricName, metricId, csvPath, rowOffset, timestampIndex,
                valueIndex, datetimeFormat) {
    let inputOpts = {
      csv: csvPath, rowOffset, timestampIndex, valueIndex, datetimeFormat
    };
    this.context.executeAction(ShowCreateModelDialogAction, {
      fileName: path.basename(csvPath),
      metricName
    });
    this.context.executeAction(StartParamFinderAction, {metricId, inputOpts});
  }

  _deleteModel(modelId) {
    this._showDeleteConfirmDialog(
      this._config.get('dialog:model:delete:title'),
      this._config.get('dialog:model:delete:message'),
      () => {
        this.context.executeAction(DeleteModelAction, modelId);
        this._dismissDeleteConfirmDialog();
      }
    );
  }

  _exportModelResults(modelId) {
    dialog.showSaveDialog({
      title: this._config.get('dialog:model:export:title'),
      defaultPath: this._config.get('dialog:model:export:path')
    }, (filename) => {
      if (filename) {
        this.context.executeAction(
          ExportModelResultsAction, {modelId, filename}
        );
      } else {
        // @TODO trigger error about "bad file"
      }
    });
  }

  /**
   * Toggle showing a 3rd series of Raw Metric Data over top of the
   *  already-charted 2-Series Model results (Aggregated Metric and Anomaly).
   */
  _toggleNonAggOverlay() {
    if (this.state.aggregated) {
      this.setState({showNonAgg: !this.state.showNonAgg});
    }
  }

  render() {
    // prep UI
    let muiTheme = this.context.muiTheme;
    let checkboxColor = muiTheme.rawTheme.palette.primary1Color;
    let showNonAgg = this.state.aggregated && this.state.showNonAgg === true;
    let openDialog = this.state.deleteConfirmDialog !== null;
    let deleteConfirmDialog = this.state.deleteConfirmDialog || {};
    let actions, dialogActions, showNonAggAction;

    // load and prep data
    let model = this.state;
    let {modelId, metric: title} = model;
    let filename = path.basename(model.filename);
    let hasModelRun = (model && ('ran' in model) && model.ran);
    let file = this.props.files.find((file) => {
      return file.name === path.basename(model.filename);
    });
    let modelStore = this.context.getStore(MetricStore);
    let metrics = modelStore.getMetricsByFileId(file.uid);
    let tsFormat = file.timestampFormat;
    let datetimeFormatCategory = MOMENTS_TO_DATETIME.find((category) => {
      return category.mappings[tsFormat];
    });
    let datetimeFormat = datetimeFormatCategory.mappings[tsFormat];
    let timestampIndex = 0;
    let valueIndex = 1;
    let rowOffset = 1;  // @TODO should be replaced by user defined selection (if check use first row as headers) at file upload time
    let csvPath, metric, metricName, titleColor; // eslint-disable-line

    for (let [, value] of metrics.entries()) {
      // @TODO UNI-324
      // if (value.type === 'date') {
      //   timestampIndex = index;
      // }
      if (value.name === this.state.metric) {
        // valueIndex = index;
        metric = value
      }
    }
    csvPath = file.filename;
    metricName = metric.name;

    // prep visual sub-components
    dialogActions = [
      <FlatButton
        label={this._config.get('button:cancel')}
        onTouchTap={this._dismissDeleteConfirmDialog.bind(this)}
        />,
      <FlatButton
        keyboardFocused={true}
        label={this._config.get('button:delete')}
        onTouchTap={deleteConfirmDialog.callback}
        primary={true}
        ref="submit"
        />
    ];
    actions = (
      <CardActions style={this._styles.actions}>
        <FlatButton
          disabled={hasModelRun}
          label={this._config.get('button:model:create')}
          labelPosition="after"
          onTouchTap={
            this._createModel.bind(this, metricName, metric.uid, csvPath,
                rowOffset, timestampIndex, valueIndex, datetimeFormat)
          }
          primary={!hasModelRun}
          />
        <FlatButton
          disabled={!hasModelRun}
          label={this._config.get('button:model:delete')}
          labelPosition="after"
          onTouchTap={this._deleteModel.bind(this, modelId)}
          primary={hasModelRun}
          />
        <FlatButton
          disabled={!hasModelRun}
          label={this._config.get('button:model:export')}
          labelPosition="after"
          onTouchTap={this._exportModelResults.bind(this, modelId)}
          primary={hasModelRun}
          />
      </CardActions>
    );
    if (model.aggregated) {
      showNonAggAction = (
        <Checkbox
          checked={showNonAgg}
          defaultChecked={false}
          iconStyle={this._styles.showNonAgg.checkbox}
          label={this._config.get('chart:showNonAgg')}
          onCheck={this._toggleNonAggOverlay.bind(this)}
          style={this._styles.showNonAgg.root}
          unCheckedIcon={<CheckboxOutline color={checkboxColor} />}
          />
      );
    }

    // eror handle
    if (model.error) {
      titleColor = Colors.red400;
      filename = model.error.message;
    }

    // actual render
    return (
      <Card initiallyExpanded={true} style={this._styles.root}>
        <CardHeader
          showExpandableButton={false}
          subtitle={<div style={this._styles.title}>{filename}</div>}
          title={<div style={this._styles.title}>{title}</div>}
          titleColor={titleColor}
          />
        <CardText expandable={false}>
          {actions}
          {showNonAggAction}
          <ModelData modelId={modelId} showNonAgg={showNonAgg} />
        </CardText>
        <Dialog
          actions={dialogActions}
          onRequestClose={this._dismissDeleteConfirmDialog.bind(this)}
          open={openDialog}
          ref="deleteConfirmDialog"
          title={deleteConfirmDialog.title}
          >
            {deleteConfirmDialog.message}
        </Dialog>
        <CreateModelDialog ref="createModelWindow" initialOpenState={false}/>
      </Card>
    );
  }

}
