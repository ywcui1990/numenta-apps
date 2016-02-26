// Copyright © 2015, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero Public License version 3 as published by the Free
// Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/

import Dygraph from 'dygraphs';
import Paper from 'material-ui/lib/paper';
import React from 'react';
import ReactDOM from 'react-dom';


/**
 * Chart Widget.
 *  Wraps http://dygraphs.com/ as a React Component.
 * @TODO The local variables (this._chart*) should be refactored to React state.
 *  And, React's `render()` should be overrided with DyGraphs `updateOptions()`,
 *  possibly using Reacts's `shouldComponentUpdate()` method to skip React's
 *  state change => render cycle for DyGraphs to not have it's DOM node reset.
 */
export default class Chart extends React.Component {

  static get propTypes() {
    return {
      data: React.PropTypes.array.isRequired,
      metaData: React.PropTypes.object,
      options: React.PropTypes.object,
      zDepth: React.PropTypes.number
    };
  }

  static get defaultProps() {
    return {
      data: [],
      metaData: {},
      options: {},
      zDepth: 1
    };
  }

  static get contextTypes() {
    return {
      getConfigClient: React.PropTypes.func,
      muiTheme: React.PropTypes.object
    };
  }

  constructor(props, context) {
    super(props, context);
    this._config = this.context.getConfigClient();

    // DyGraphs chart container
    this._dygraph = null;
    this._displayPointCount = this._config.get('chart:points');

    // Chart Range finder values: For Fixed-width-chart & auto-scroll-to-right
    this._chartBusy = null;
    this._chartRange = null;
    this._chartRangeWidth = null;
    this._chartScrollLock = null;

    // dynamic styles
    let muiTheme = this.context.muiTheme;
    this._styles = {
      root: {
        boxShadow: 'none',
        height: muiTheme.rawTheme.spacing.desktopKeylineIncrement * 2.75,
        width: '100%'
      }
    };
  }

  componentDidMount() {
    this._chartBusy = false;
    this._chartRange = [0, 0];
    this._chartRangeWidth = null;
    this._chartScrollLock = true;  // auto-scroll with new model+anomaly data

    if (this.props.data.length) {
      this._chartInitalize();
    }
  }

  componentWillUnmount() {
    if (this._dygraph) {
      this._dygraph.destroy();
      this._dygraph = null;
    }

    this._chartBusy = null;
    this._chartRange = null;
    this._chartRangeWidth = null;
    this._chartScrollLock = null;
  }

  componentDidUpdate() {
    if (this._dygraph) {
      this._chartUpdate();
    } else if (this.props.data.length) {
      this._chartInitalize();
    }
  }

  /**
   * DyGrpahs Chart Initalize and Render
   */
  _chartInitalize() {
    let {data, options} = this.props;
    let element = ReactDOM.findDOMNode(this.refs.chart);
    let first = new Date(data[0][0]).getTime();
    let second = new Date(data[1][0]).getTime();
    let unit = second - first; // each datapoint

    this._chartBusy = true;

    // determine each value datapoint time unit and chart width based on that
    this._chartRangeWidth = Math.round(unit * this._displayPointCount);
    this._chartRange = [first, first + this._chartRangeWidth]; // float left

    // init chart
    options.dateWindow = this._chartRange;
    this._dygraph = new Dygraph(element, data, options);
    this._chartBusy = false;
  }

  /**
   * DyGrpahs Chart Update Logic and Re-Render
   */
  _chartUpdate() {
    let {data, options} = this.props;
    let anomalyCount = Math.abs(this.props.metaData.length.model - 1);
    let first = new Date(data[0][0]).getTime();
    let blockRedraw = anomalyCount % 2 === 0; // filter out some redrawing
    let rangeMax, rangeMin;

    // scroll along with fresh anomaly model data input
    if (!this._chartBusy) {
      rangeMax = new Date(data[anomalyCount][0]).getTime();
      rangeMin = rangeMax - this._chartRangeWidth;
      if (rangeMin < first) {
        rangeMin = first;
        rangeMax = rangeMin + this._chartRangeWidth;
      }
      this._chartRange = [rangeMin, rangeMax];
    }

    this._chartBusy = true;
    options.dateWindow = this._chartRange;
    options.file = data;  // new data
    this._dygraph.updateOptions(options, blockRedraw);
    this._chartBusy = false;
  }

  /**
   * DyGrpahs Chart range finder change/zoom callback function
   * @param {Number} rangeXmin - Minimum X value of chart Range Finder
   * @param {Number} rangeXmax - Maximum X value of chart Range Finder
   * @param {Array} [yRanges] - Extra Y value data (unused currently)
   */
  // _chartZoomCallback(rangeXmin, rangeXmax, yRanges) {
    // lock range finder into fixed-width behavior
    /*
    let [oldMin, oldMax] = this._chartRange;
    let minChange = Math.abs(rangeXmin - oldMin);
    let maxChange = Math.abs(rangeXmax - oldMax);

    if (minChange > maxChange) {
      rangeXmax = rangeXmin + this._chartRangeWidth;
    } else {
      rangeXmin = rangeXmax - this._chartRangeWidth;
    }

    this._chartRange = [rangeXmin, rangeXmax];
    this._chartUpdate();
    */
  // }

  /**
   * React render()
   * @return {Object} - Built React component pseudo-DOM object
   */
  render() {
    return (
      <Paper ref="chart" style={this._styles.root} zDepth={this.props.zDepth}>
        <br/>Loading data...
      </Paper>
    );
  }

}
