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


// externals

import connectToStores from 'fluxible-addons-react/connectToStores';
import Paper from 'material-ui/lib/paper';
import React from 'react';

// internals

import Model from '../components/Model';
import ModelStore from '../stores/ModelStore';

const StoreDecorator = (context) => ({
  models: context.getStore(ModelStore).getModels()
});


/**
 * @module
 * @class
 * @public
 * @exports
 * @extends React.Component
 * @this ModelList
 */
@connectToStores([ModelStore], StoreDecorator)
export default class ModelList extends React.Component {

  static contextTypes = {
    executeAction: React.PropTypes.func,
    getStore: React.PropTypes.func
  };
  static propTypes = {
    zDepth: React.PropTypes.number
  };
  static defaultProps = {
    zDepth: 1
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

}
