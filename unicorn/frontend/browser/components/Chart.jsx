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

const {Paper} = Material;

const CHART_DEFAULT_RANGE = 200; // chart range finder static 200 datapoints


// MAIN

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

    this.state = {
      // Chart Range finder values: For Fixed-width-chart & auto-scroll-to-right
      chartBusy: false,
      chartRange: [0, CHART_DEFAULT_RANGE],
      chartRangeWidth: CHART_DEFAULT_RANGE,
      chartScrollLock: true // if chart far-right, stay floated right
    };

    // DyGraphs chart container
    this._dygraph = null;
  }

  componentDidMount() {
    if (this.props.data.length) {
      this._chartInitalize();
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
      this._chartUpdate();
    } else if (this.props.data.length) {
      this._chartInitalize();
    }
  }

  render() {
    let styles = this._getStyles();
    return (
      <Paper zDepth={this.props.zDepth} style={styles.root} ref="chart" />
    );
  }


  _getStyles() {
    return {
      root: {
        width: '100%',
        height: '300px',
      },
    };
  }

  /**
   * DyGrpahs Chart Initalize and Render
   */
  _chartInitalize() {
    let options = {
      clickCallback: this._chartClickCallback.bind(this),
      zoomCallback: this._chartZoomCallback.bind(this)
    };
    let el = React.findDOMNode(this.refs.chart);
    let selector;

    Object.assign(options, this.props.options);
    this._dygraph = new Dygraph(el, this.props.data, options);

    // range selector custom events
    selector = el.getElementsByClassName('dygraph-rangesel-fgcanvas')[0];
    selector.addEventListener('mousedown', this._rangeMouseDownCallback.bind(this));
    selector.addEventListener('mouseup', this._rangeMouseUpCallback.bind(this));
  }

  /**
   * DyGrpahs Chart Update and Re-Render
   */
  _chartUpdate() {
    let options = {};
    let graphXmin, graphXmax;
    let chartRange = this.state.chartRange;

    if(this.state.chartScrollLock && !this.state.chartBusy) {
      // if range scroll is locked, we're far right, so stay far right on chart
      [ graphXmin, graphXmax ] = this._dygraph.xAxisExtremes();
      chartRange = [(graphXmax - this.state.chartRangeWidth), graphXmax];
    }

    // update chart
    options.dateWindow = chartRange;
    options.file = this.props.data; // new data
    Object.assign(options, this.props.options);
    this._dygraph.updateOptions(options);

    this.setState({ chartRange });
  }

  /**
   * DyGrpahs Chart click callback function
   */
  _chartClickCallback() {
    // user touched chart: turn off far-right scroll lock for now
    this.setState({ chartScrollLock: false });
  }

  /**
   * DyGrpahs Chart range finder change/zoom callback function
   */
  _chartZoomCallback(rangeXmin, rangeXmax, yRanges) {
    // chart range finder, far-right scroll lock
    let [ graphXmin, graphXmax ] = this._dygraph.xAxisExtremes();
    let graphXrange = graphXmax - graphXmin;
    let graphXdiff = graphXmax - rangeXmax;

    // if range slider is moved far to the right, re-enable auto scroll
    this.setState({
      chartScrollLock: this._isScrollLockActive(graphXdiff, graphXrange)
    });
  }

  /**
   * DyGrpahs Chart RangeSelector mousedown callback function
   */
  _rangeMouseDownCallback(event) {
    this.setState({ chartBusy: true });
  }

  /**
   * DyGrpahs Chart RangeSelector mouseup callback function
   */
  _rangeMouseUpCallback(event) {
    let [graphXmin, graphXmax] = this._dygraph.xAxisExtremes();
    let graphXrange = graphXmax - graphXmin;
    let graphXdiff = graphXmax - this.state.chartRange[1];

    // if range slider is moved far to the right, re-enable auto scroll
    this.setState({
      chartBusy: false,
      chartScrollLock: this._isScrollLockActive(graphXdiff, graphXrange)
    });
  }

  /**
   * Should scroll lock be turned on? (Is chart range slider far-to-the-right?)
   */
  _isScrollLockActive(xDiff, xRange) {
    return (xDiff < (xRange * 0.1));  // near right edge ~10%
  }

}
