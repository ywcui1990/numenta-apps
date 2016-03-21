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

import ChartUpdateViewpoint from '../actions/ChartUpdateViewpoint';
import {DATA_FIELD_INDEX} from '../lib/Constants';

const {DATA_INDEX_TIME} = DATA_FIELD_INDEX;

Dygraph.prototype.setSelection = function () {}; // short out unused method


/**
 * Chart Widget. Wraps as a React Component.
 * @see http://dygraphs.com/
 */
export default class Chart extends React.Component {

  static get contextTypes() {
    return {
      executeAction: React.PropTypes.func,
      getConfigClient: React.PropTypes.func,
      muiTheme: React.PropTypes.object
    };
  }

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
    let {model} = this.props.metaData;
    let element = ReactDOM.findDOMNode(this.refs[`chart-${model.modelId}`]);

    if (this._dygraph) {
      Dygraph.removeEvent(element, 'mouseup', this._handleMouseUp.bind(this));
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

  /**
   * DyGrpahs Chart Initalize and Render
   */
  _chartInitalize() {
    let {data, metaData, options} = this.props;
    let {metric, model} = metaData;
    let element = ReactDOM.findDOMNode(this.refs[`chart-${model.modelId}`]);
    let first = moment(data[0][DATA_INDEX_TIME]).valueOf();
    let second = moment(data[1][DATA_INDEX_TIME]).valueOf();
    let unit = second - first; // each datapoint
    let rangeWidth = unit * this._displayPointCount;
    let chartRange = [first, first + rangeWidth]; // float left

    // move chart back to last valid display position from previous viewing?
    if ('viewpoint' in metric && metric.viewpoint) {
      chartRange = [metric.viewpoint, metric.viewpoint + rangeWidth];
    }

    // init chart
    options.dateWindow = chartRange;
    this._dygraph = new Dygraph(element, data, options);

    // track chart viewport position on chart/rangeselector mouseup event
    Dygraph.addEvent(element, 'mouseup', this._handleMouseUp.bind(this));
  }

  /**
   * DyGrpahs Chart Update Logic and Re-Render
   */
  _chartUpdate() {
    let {data, metaData, options} = this.props;
    let {model} = metaData;
    let modelIndex = Math.abs(model.dataSize - 1);
    let first = moment(data[0][DATA_INDEX_TIME]).valueOf();
    let [rangeMin, rangeMax] = this._dygraph.xAxisRange();
    let rangeWidth = rangeMax - rangeMin;
    let blockRedraw = modelIndex % 2 === 0; // filter out some redrawing
    let scrollLock = false;

    // If new aggregated data chart: destroy, and it will re-create itself fresh
    if (model.aggregated && modelIndex === 1) {
      this.componentWillUnmount();
      return;
    }

    // should we scroll along with incoming model data?
    if (model.active && modelIndex < data.length) {
      scrollLock = true;
    }

    // scroll along with fresh anomaly model data input.
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
   * Overlay default Dygraphs mouseup event handler to also store the current
   *  chart viewpoint (viewport starting UTC date stamp). This is used for
   *  both the Main Chart and the Range Selector.
   * @param {Object} event - DOM `mouseup` event object
   */
  _handleMouseUp(event) {
    if (this._dygraph) {
      let range = this._dygraph.xAxisRange();
      this.context.executeAction(ChartUpdateViewpoint, {
        metricId: this.props.metaData.model.modelId,
        viewpoint: range[0] || null
      });
    }
  }

  /**
   * React render()
   * @return {Object} - Built React component pseudo-DOM object
   */
  render() {
    let {model} = this.props.metaData;

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
