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

import Dygraph from 'dygraphs';
import Material from 'material-ui';
import React from 'react';

const {
  Paper
} = Material;

/**
 * Chart Widget.
 * Wraps http://dygraphs.com/ as a React Component
 */
export default class Chart extends React.Component {

  static propTypes = {
    data: React.PropTypes.array.isRequired,
    options: React.PropTypes.object,
    zDepth: React.PropTypes.number,
  };

  static defaultProps = {
    zDepth: 1,
    data: [],
    options: {}
  };

  static contextTypes = {
    muiTheme: React.PropTypes.object,
  };

  constructor(props, context) {
    super(props, context);
    this._dygraph = null;
  }

  componentDidMount() {
    let el = React.findDOMNode(this.refs.chart);
    if (this.props.data.length) {
      this._dygraph = new Dygraph(el, this.props.data, this.props.options);
    }
  }

  componentWillUnmount() {
    if (this._dygraph) {
      this._dygraph.destroy();
      this._dygraph = null;
    }
  }

  componentDidUpdate() {
    if (this._dygraph) {
      let options = {
        'file': this.props.data
      };
      Object.assign(options, this.props.options);
      this._dygraph.updateOptions(options);
    } else if (this.props.data.length) {
      let el = React.findDOMNode(this.refs.chart);
      this._dygraph = new Dygraph(el, this.props.data, this.props.options);
    }
  }

  _getStyles() {
    return {
      root: {
        width: '100%',
        height: '300px',
      },
    };
  }

  render() {
    let styles = this._getStyles();
    return (
      <Paper zDepth={this.props.zDepth} style={styles.root} ref='chart'/>
    );
  }
};
