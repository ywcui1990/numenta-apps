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

  static defaultProps =  {
    zDepth: 1,
    data: [],
    options: {}
  };

  static contextTypes = {
    muiTheme: React.PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {
      chart: null
    };
  }

  componentDidMount() {
    let el = React.findDOMNode(this.refs.chart);
    this.setState({
      chart: new Dygraph(el, this.props.data, this.props.options)
    });
  }
  componentWillUnmount() {
    let chart = this.state.chart;
    if (chart) {
      chart.destroy();
    }
  }

  componentDidUpdate() {
    let chart = this.state.chart;
    if (chart) {
      chart.updateOptions({
        'file': this.props.data
      } );
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
