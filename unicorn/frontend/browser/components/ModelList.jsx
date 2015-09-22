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
import ModelStore from '../stores/ModelStore';
import Material from 'material-ui';
import Model from '../components/Model';
import React from 'react';

const {
  Paper
} = Material;


@connectToStores([ModelStore], (context) => ({
  models: context.getStore(ModelStore).getModels()
}))
export default class ModelList extends React.Component {

  static propTypes = {
    zDepth: React.PropTypes.number
  };
  static defaultProps = {
    zDepth: 1
  };
  static contextTypes = {
    executeAction: React.PropTypes.func,
    getStore: React.PropTypes.func,
    muiTheme: React.PropTypes.object,
  };

  constructor(props, context) {
    super(props, context);
  }

  _getStyles() {
    return {
      root: {
        width: '100%'
      }
    };
  }

  _renderModels() {
    return this.props.models.map(model => {
      return (
        <Model key={model.modelId} modelId={model.modelId} />
      );
    });
  }

  render() {
    let styles = this._getStyles();
    return (
      <Paper style={styles.root} zDepth={this.props.zDepth}>
        {this._renderModels()}
      </Paper>
    );
  }
};
