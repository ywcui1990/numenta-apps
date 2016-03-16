// Copyright © 2016, Numenta, Inc.  Unless you have purchased from
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

import CircularProgress from 'material-ui/lib/circular-progress';
import Dygraph from 'dygraphs';
import moment from 'moment';
import Paper from 'material-ui/lib/paper';
import React from 'react';
import ReactDOM from 'react-dom';

import {DATA_FIELD_INDEX} from '../lib/Constants';

const {DATA_INDEX_TIME} = DATA_FIELD_INDEX;

Dygraph.prototype.setSelection = function () {}; // short out unused method


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

    // dynamic styles
    let muiTheme = this.context.muiTheme;
    this._styles = {
      root: {
        boxShadow: 'none',
        height: muiTheme.rawTheme.spacing.desktopKeylineIncrement * 2.75,
        marginTop: '0.25rem',
        width: '100%'
      }
    };
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
    if (this._dygraph && this.props.data.length > 1) {
      this._chartUpdate();
    } else if (this.props.data.length) {
      this._chartInitalize();
    }
  }

  _getChartRange() {
    if (this._dygraph) {
      return this._dygraph.xAxisRange();
    }
  }

  /**
   * DyGrpahs Chart Initalize and Render
   */
  _chartInitalize() {
    let {data, options} = this.props;
    let model = this.props.metaData.model;
    let element = ReactDOM.findDOMNode(this.refs[`chart-${model.modelId}`]);
    let first = moment(data[0][DATA_INDEX_TIME]).valueOf();
    let second = moment(data[1][DATA_INDEX_TIME]).valueOf();
    let unit = second - first; // each datapoint
    let rangeWidth = Math.round(unit * this._displayPointCount);
    let chartRange = [first, first + rangeWidth]; // float left

    // init chart
    options.dateWindow = chartRange;
    this._dygraph = new Dygraph(element, data, options);
  }

  /**
   * DyGrpahs Chart Update Logic and Re-Render
   */
  _chartUpdate() {
    let {data, metaData, options} = this.props;
    let {length, model} = metaData;
    let modelIndex = Math.abs(length.model - 1);
    let first = moment(data[0][DATA_INDEX_TIME]).valueOf();
    let [rangeMin, rangeMax] = this._getChartRange();
    let rangeWidth = Math.round(rangeMax - rangeMin);
    let blockRedraw = modelIndex % 2 === 0; // filter out some redrawing
    let scrollLock = false;

    // If new aggregated data chart: destroy, and it will re-create itself fresh
    if (model.aggregated && modelIndex === 1) {
      return this.componentWillUnmount();
    }

    if (model.active && modelIndex < data.length) {
      scrollLock = true;
    }

    // scroll along with fresh anomaly model data input
    if (scrollLock) {
      rangeMax = moment(data[modelIndex][DATA_INDEX_TIME]).valueOf();
      rangeMin = rangeMax - rangeWidth;
      if (rangeMin < first) {
        rangeMin = first;
        rangeMax = rangeMin + rangeWidth;
      }
    }

    // update chart
    options.dateWindow = [rangeMin, rangeMax];
    options.file = data;  // new data
    this._dygraph.updateOptions(options, blockRedraw);
  }

  /**
   * React render()
   * @return {Object} - Built React component pseudo-DOM object
   */
  render() {
    let model = this.props.metaData.model;

    if (model.aggregated) {
      this._styles.root.marginTop = '0.66rem';
    }

    return (
      <Paper
        className="dygraph-chart"
        ref={`chart-${model.modelId}`}
        style={this._styles.root}
        zDepth={this.props.zDepth}
        >
          <CircularProgress size={0.5} />
          {this._config.get('chart:loading')}
      </Paper>
    );
  }

}
