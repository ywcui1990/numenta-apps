// Copyright © 2015, Numenta, Inc. Unless you have purchased from
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

import React from 'react';
import CreateModel from '../actions/CreateModel';
import FlatButton from 'material-ui/lib/flat-button';
import Dialog from 'material-ui/lib/dialog';
import CircularProgress from 'material-ui/lib/circular-progress';

export default class CreateModelDialog extends React.Component {

  static contextTypes = {
    executeAction: React.PropTypes.func
  };

  static propTypes = {
    initialOpenState: React.PropTypes.bool.isRequired
  };

  componentDidMount() {
    setTimeout(() => {
      this.setState(
        {
          paramFinderResults: {
            aggInfo: {
              windowSize: 10
            }
          }
        })
    }, 5000);
  }

  constructor(props, context) {
    super(props, context);
    this.state = {
      paramFinderResults: null,
      fileName: null,
      metricName: null,
      open: props.initialOpenState
    };
  }

  _resetState() {
    this.setState({
      open: false,
      paramFinderResults: null,
      fileName: null,
      metricName: null
    });

  }

  _onOK() {
    this.context.executeAction(CreateModel, {aggregate: true});
    this._resetState()
  }

  _onNO() {
    this.context.executeAction(CreateModel, {aggregate: false});
    this._resetState()
  }

  render() {
    let body = null;
    let actions = [];
    let title = `Create model for ${this.state.fileName} > ${this.state.metricName}`
    if (this.state.paramFinderResults) {
      body = `We determined that you would get the best results with an aggregation window of ${this.state.paramFinderResults.aggInfo.windowSize} s.`
      actions.push(
        <FlatButton
          label="OK"
          onTouchTap={this._onOK.bind(this)}
        />);
      actions.push(
        <a href="#" onClick={this._onNO.bind(this)}>No, use original data.</a>
      );
    } else {

      body = (
        <div><CircularProgress size={0.5}/> Determining the best HTM params.
        </div>)

    }
    return (
      <Dialog
        actions={actions}
        open={this.state.open}
        title={title}
      >
        {body}
      </Dialog>
    );
  }
}