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
import ModelData from '../components/ModelData';
import ModelStore from '../stores/ModelStore';

const {
  Card, CardHeader, CardText, CardActions, FlatButton, Avatar, Styles
} = Material;
const {Colors} = Styles;

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
    getStore: React.PropTypes.func
  };

  constructor(props, context) {
    super(props, context);
    let store = this.context.getStore(ModelStore);
    let model = store.getModel(this.props.modelId);
    this.state = Object.assign({}, model);
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
        width: '80%',
        padding: '10px',
        marginLeft: '256px'
      }
    };
  }

  render() {
    let styles = this._getStyles();
    let model = this.state;
    let actions;
    let avatar;
    let title;
    let titleColor;
    if (model.active) {
      actions = (
        <CardActions  expandable={true}>
          <FlatButton label="Stop"
            onClick={this._onStopButtonClick.bind(this)}/>
        </CardActions>);
    }
    if (model.error) {
      avatar = (<Avatar backgroundColor={Colors.red500}>E</Avatar>);
      title = model.metric + ': ' + model.error.message;
      titleColor = Colors.red500;
    } else {
      avatar = (<Avatar backgroundColor={Colors.green500}></Avatar>);
      title = model.metric;
      titleColor = Colors.darkBlack;
    }
    return (
      <Card initiallyExpanded={true} style={styles.root}>
        <CardHeader showExpandableButton={true}
          subtitle={model.filename}
          avatar={avatar}
          title={title}
          titleColor={titleColor} />
        {actions}
        <CardText expandable={true}>
          <ModelData modelId={model.modelId} />
        </CardText>
      </Card>
    );
  }
};
