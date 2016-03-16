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

import connectToStores from 'fluxible-addons-react/connectToStores';
import IconCheckbox from 'material-ui/lib/svg-icons/toggle/check-box';
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
      empty: {
        marginLeft: (0 - (muiTheme.leftNav.width / 2)) - 33,
        position: 'fixed',
        textAlign: 'center',
        top: '43%',
        transform: 'translateY(-43%)',
        width: '100%'
      },
      emptyMessage: {
        color: muiTheme.rawTheme.palette.accent4Color,
        fontWeight: muiTheme.rawTheme.font.weight.normal,
        left: 8,
        position: 'relative',
        top: -5
      }
    };
  }

  _renderModels() {
    let emptyMessage = this._config.get('heading:chart:empty');
    let checkboxColor = this.context.muiTheme.rawTheme.palette.primary1Color;
    let visibleModels = false;
    let renderModels = [ // start with empty messaging by default
      <div key="emptyMessage" style={this._styles.empty}>
        <IconCheckbox color={checkboxColor} />
        <span style={this._styles.emptyMessage}>{emptyMessage}</span>
      </div>
    ];

    // push visible AND hidden model markup
    this.props.models.forEach((model) => {
      renderModels.push(
        <Model key={model.modelId} modelId={model.modelId} />
      );
      if (model.visible && !visibleModels) {
        visibleModels = true;
      }
    });

    // if no visible, show empty messaging
    if (visibleModels) {
      renderModels.shift(); // visible models = remove empty messaging
    }

    return renderModels;
  }

  render() {
    return (
      <Paper style={this._styles.root} zDepth={this.props.zDepth}>
        {this._renderModels()}
      </Paper>
    );
  }
}
