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

'use strict';

import connectToStores from 'fluxible-addons-react/connectToStores';
import Material from 'material-ui';
import React from 'react';
import StopModelAction from '../actions/StopModel';
import ReceiveDataAction from '../actions/ReceiveData';
import ModelData from '../components/ModelData';
import ModelStore from '../stores/ModelStore';

const {
  Card, CardHeader, CardText, CardActions, FlatButton
} = Material;

@connectToStores([ModelStore], () => ({
}))
export default class Model extends React.Component {

  static propTypes = {
    zDepth: React.PropTypes.number,
    modelId: React.PropTypes.string.isRequired
  };
  static defaultProps = {
    zDepth: 1
  };
  static contextTypes = {
    executeAction: React.PropTypes.func,
    getStore: React.PropTypes.func,
    muiTheme: React.PropTypes.object
  };

  constructor(props, context) {
    super(props, context);
    let store = this.context.getStore(ModelStore);
    let model = store.getModel(this.props.modelId);
    this.state = Object.assign({}, model);

    //TODO: Use real data
    let addData = () => {
      let data = [new Date(), Math.random()];
      this.context.executeAction(ReceiveDataAction, {
        modelId: this.state.modelId,
        data: data
      });
      if (this.state.active) {
        setTimeout(addData, 1000);
      }
    }.bind(this);
    setTimeout(addData, 1000);
  }

  componentWillReceiveProps(nextProps) {
    let store = this.context.getStore(ModelStore);
    let model = store.getModel(nextProps.modelId);
    this.setState(Object.assign({}, model));
  }

  _onStopButtonClick() {
    this.context.executeAction(StopModelAction, this.props.modelId);
  }

  _getStyles() {
    return {
      root: {
        width: '100%',
        padding: '10px',
        marginLeft: '256px'
      }
    };
  }

  render() {
    let styles = this._getStyles();
    let model = this.state;
    let actions;
    if (model.active) {
      actions = (
        <CardActions  expandable={true}>
          <FlatButton label="Stop"
            onClick={this._onStopButtonClick.bind(this)}/>
        </CardActions>);
    }

    return (
      <Card initiallyExpanded={true} style={styles.root}>
        <CardHeader showExpandableButton={true}
          subtitle={model.filename}
          title={model.metric} />
        {actions}
        <CardText expandable={true}>
          <ModelData modelId={model.modelId} />
        </CardText>
      </Card>
    );
  }
};
