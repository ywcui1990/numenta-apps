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

import CircularProgress from 'material-ui/lib/circular-progress';
import connectToStores from 'fluxible-addons-react/connectToStores';
import Dialog from 'material-ui/lib/dialog';
import RaisedButton from 'material-ui/lib/raised-button';
import path from 'path';
import React from 'react';

import HideCreateModelDialogAction from '../actions/HideCreateModelDialog';
import CreateModelStore from '../stores/CreateModelStore';
import StartModelAction from '../actions/StartModel';
import {trims} from '../../common/common-utils';


const STYLES = {
  raw: {
    fontSize: 11
  }
};

/**
 * "Create Model" Dialog
 */
@connectToStores([CreateModelStore], (context) => ({
  fileName: context.getStore(CreateModelStore).fileName,
  inputOpts: context.getStore(CreateModelStore).inputOpts,
  metricId: context.getStore(CreateModelStore).metricId,
  metricName: context.getStore(CreateModelStore).metricName,
  open: context.getStore(CreateModelStore).open,
  paramFinderResults: context.getStore(CreateModelStore).paramFinderResults
}))
export default class CreateModelDialog extends React.Component {

  static contextTypes = {
    executeAction: React.PropTypes.func,
    getConfigClient: React.PropTypes.func,
    getStore: React.PropTypes.func,
    muiTheme: React.PropTypes.object
  };

  constructor(props, context) {
    super(props, context);
    this._config = this.context.getConfigClient();
    this.state = {progress: true};
  }

  _onClick(modelPayload) {
    this.context.executeAction(HideCreateModelDialogAction);
    this.context.executeAction(StartModelAction, modelPayload);
  }

  componentDidMount() {
    // Show progress for at least 3 secs
    setTimeout(() => this.setState({progress: false}), 3000);
  }

  render() {
    let {
      fileName, inputOpts, metricId,
      metricName, paramFinderResults
    } = this.props;

    let body = null;
    let actions = [];
    let title = trims`Create model for ${metricName}
                  (${path.basename(fileName)})`;

    if (paramFinderResults && !this.state.progress) {
      let rawPayload = {
        metricId,
        inputOpts,
        modelOpts: paramFinderResults.modelInfo,
        aggOpts: {}
      };
      let aggregatePayload = Object.assign({}, rawPayload, {
        aggOpts: paramFinderResults.aggInfo
      });

      body = trims`We determined that you will get the best results if
              we aggregate your data to
              ${paramFinderResults.aggInfo.windowSize} seconds intervals.`;

      actions.push(
        <RaisedButton
          label={this._config.get('button:okay')}
          onTouchTap={this._onClick.bind(this, aggregatePayload)}
          primary={true}/>
      );
      actions.push(
        <a href="#" styles={STYLES.raw}
          onClick={this._onClick.bind(this, rawPayload)}>
            {this._config.get('dialog:model:create:raw')}
        </a>
      );
    } else {
      body = (
        <div>
          <CircularProgress size={0.5} />
          {this._config.get('dialog:model:create:loading')}
        </div>
      );
    }
    return (
      <Dialog actions={actions} open={this.props.open} title={title}>
        {body}
      </Dialog>
    );
  }
}
