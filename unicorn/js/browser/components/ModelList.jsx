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


import connectToStores from 'fluxible-addons-react/connectToStores';
import Paper from 'material-ui/lib/paper';
import React from 'react';

import Model from '../components/Model';
import ModelStore from '../stores/ModelStore';


/**
 * List of Model Charts, React component
 */
@connectToStores([ModelStore], (context) => ({
  models: context.getStore(ModelStore).getModels()
}))
export default class ModelList extends React.Component {

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
      zDepth: React.PropTypes.number
    };
  }

  static get defaultProps() {
    return {
      zDepth: 1
    };
  }

  constructor(props, context) {
    super(props, context);

    this._config = this.context.getConfigClient();

    let muiTheme = this.context.muiTheme;
    this._styles = {
      root: {
        backgroundColor: 'transparent',
        boxShadow: 'none',
        width: '100%'
      },
      none: {
        marginLeft: (0 - (muiTheme.leftNav.width / 2)),
        position: 'fixed',
        textAlign: 'center',
        top: '43%',
        transform: 'translateY(-43%)',
        width: '100%'
      }
    };
  }

  _renderModels() {
    let visibleModels = this.props.models.find((model) => model.visible);
    let emptyMessage = this._config.get('heading:chart:empty');

    if (! visibleModels) {
      return (
        <div style={this._styles.none}>{emptyMessage}</div>
      );
    }

    return this.props.models
      .filter((model) => model.visible)
      .map((model) => {
        return (
          <Model key={model.modelId} modelId={model.modelId} />
        );
      });
  }

  render() {
    return (
      <Paper style={this._styles.root} zDepth={this.props.zDepth}>
        {this._renderModels()}
      </Paper>
    );
  }
}
