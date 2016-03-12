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
import FlatButton from 'material-ui/lib/flat-button';
import RaisedButton from 'material-ui/lib/raised-button';
import path from 'path';
import React from 'react';

import HideCreateModelDialogAction from '../actions/HideCreateModelDialog';
import MetricStore from '../stores/MetricStore';
import StartModelAction from '../actions/StartModel';
import {trims} from '../../common/common-utils';


/**
 * "Create Model" Dialog
 */
@connectToStores([MetricStore], (context) => ({
  fileName: context.getStore(MetricStore).fileName,
  metricName: context.getStore(MetricStore).metricName,
  open: context.getStore(MetricStore).open,
  paramFinderResults: context.getStore(MetricStore).paramFinderResults
}))
export default class CreateModelDialog extends React.Component {

  static contextTypes = {
    executeAction: React.PropTypes.func,
    getConfigClient: React.PropTypes.func,
    getStore: React.PropTypes.func,
    muiTheme: React.PropTypes.object
  };

  static propTypes = {
    initialOpenState: React.PropTypes.bool.isRequired
  };

  constructor(props, context) {
    super(props, context);
    this._config = this.context.getConfigClient();

    this.state = Object.assign({}, this.props);

    let muiTheme = this.context.muiTheme;
    this._styles = {
      agg: {
        marginRight: '1rem'
      },
      raw: {
        color: muiTheme.rawTheme.palette.accent4Color,
        fontSize: 13,
        fontWeight: muiTheme.rawTheme.font.weight.normal,
        marginRight: '0.5rem',
        textDecoration: 'underline',
        textTransform: 'none'
      }
    };
  }

  componentWillReceiveProps(nextProps) {
    this.state = Object.assign({}, nextProps);
  }

  _resetState() {
    this.setState({
      open: false,
      fileName: null,
      metricName: null
    });
  }

  _onClick(modelPayload) {
    this.context.executeAction(HideCreateModelDialogAction);
    this.context.executeAction(StartModelAction, modelPayload);
    this._resetState()
  }

  render() {
    let body = null;
    let actions = [];
    let title = trims`Create model for ${this.state.metricName}
                  (${path.basename(this.state.fileName)})`;

    if (this.state.fileName && this.state.metricName) {
      let metricStore = this.context.getStore(MetricStore);
      let metrics = metricStore.getMetrics();
      let metricId = null;
      for (let metric of metrics.values()) {
        if (metric.name === this.state.metricName) {
          metricId = metric.uid;
        }
      }

      let inputOpts = metricStore.getInputOpts(metricId);
      let paramFinderResults = metricStore.getParamFinderResults(metricId);
      if (paramFinderResults) {
        let rawPayload = {
          metricId,
          inputOpts,
          modelOpts: paramFinderResults.modelInfo,
          aggOpts: {}
        };
        let aggregatePayload = Object.assign({}, rawPayload, {
          aggOpts: paramFinderResults.aggInfo
        });

        body = (
          <div>
            We determined that you will get the best results if we aggregate
            your data to {paramFinderResults.aggInfo.windowSize} seconds
            intervals.
          </div>
        );

        actions.push(
          <RaisedButton
            label={this._config.get('button:okay')}
            onTouchTap={this._onClick.bind(this, aggregatePayload)}
            primary={true}
            style={this._styles.agg}
            />
        );
        actions.push(
          <FlatButton
            label={this._config.get('dialog:model:create:raw')}
            onTouchTap={this._onClick.bind(this, rawPayload)}
            labelStyle={this._styles.raw}
            />
        );
      } else {
        body = (
          <div>
            <CircularProgress size={0.5} />
            {this._config.get('dialog:model:create:loading')}
          </div>
        );
      }
    }
    return (
      <Dialog actions={actions} open={this.state.open} title={title}>
        {body}
      </Dialog>
    );
  }

}
