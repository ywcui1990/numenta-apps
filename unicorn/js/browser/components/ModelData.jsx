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
import React from 'react';

import AnomalyBarChart from '../lib/Dygraphs/AnomalyBarChartUnderlay';
import Chart from './Chart';
import {DATA_FIELD_INDEX} from '../lib/Constants';
import MetricDataStore from '../stores/MetricDataStore';
import ModelDataStore from '../stores/ModelDataStore';
import ModelStore from '../stores/ModelStore';
import RangeSelectorBarChart from '../lib/Dygraphs/RangeSelectorBarChartPlugin';

const {DATA_INDEX_TIME, DATA_INDEX_VALUE} = DATA_FIELD_INDEX;


/**
 * React Component for sending Model Data from Model component to
 *  Chart component.
 */
@connectToStores([MetricDataStore, ModelDataStore, ModelStore],
  (context, props) => {
    let metricData = context.getStore(MetricDataStore).getData(props.modelId);
    let modelData = context.getStore(ModelDataStore).getData(props.modelId);
    let model = context.getStore(ModelStore).getModel(props.modelId);
    return {metricData, modelData, model};
  }
)
export default class ModelData extends React.Component {

  static get contextTypes() {
    return {
      getConfigClient: React.PropTypes.func,
      getStore: React.PropTypes.func,
      muiTheme: React.PropTypes.object
    };
  }

  static get propTypes() {
    return {
      modelId: React.PropTypes.string.isRequired,
      showNonAgg: React.PropTypes.bool
    };
  }

  constructor(props, context) {
    super(props, context);
    this._config = this.context.getConfigClient();

    let muiTheme = this.context.muiTheme;
    let displayPointCount = this._config.get('chart:points');

    this._anomalyBarWidth = Math.round(displayPointCount / 16, 10);
    this._anomalyValueHeight = 1.0;

    this._chartOptions = {
      // dygraphs global chart options
      options: {
        connectSeparatedPoints: true,  // required for raw+agg overlay
        includeZero: true,
        plugins: [RangeSelectorBarChart],
        rangeSelectorPlotFillColor: muiTheme.rawTheme.palette.primary1FadeColor,
        rangeSelectorPlotStrokeColor: muiTheme.rawTheme.palette.primary1Color,
        showRangeSelector: true,
        underlayCallback: AnomalyBarChart.bind(null, this),
        yRangePad: 0
      },

      // main value data chart line (could be either Raw OR Aggregated data)
      value: {
        labels: ['Time', 'Value'],
        axes: {
          x: {drawGrid: false},
          y: {
            axisLabelWidth: 0,
            drawGrid: false
          }
        },
        series: {
          Value: {
            axis: 'y',
            color: muiTheme.rawTheme.palette.primary2Color,  // dark blue
            independentTicks: true,
            showInRangeSelector: true,  // plot alone in range selector
            strokeWidth: 2
          }
        }
      },

      // non-aggregated line chart overlay on top of aggregated data line chart
      raw: {
        labels: ['NonAggregated'],
        axes: {
          y2: {
            axisLabelWidth: 0,
            drawGrid: false,
            drawAxis: false
          }
        },
        series: {
          NonAggregated: {
            axis: 'y2',
            color: muiTheme.rawTheme.palette.primary1Color,  // light blue
            independentTicks: false,
            showInRangeSelector: null,
            strokeWidth: 2
          }
        }
      }
    }; // chartOptions
  } // constructor

  /**
   * Transform two indepdent time-series datasets into a single Dygraphs
   *  data matrix, overlaid on top of each other.
   * @param {Array} dataSeries - Input Dygraph data series matrix for overlay.
   * @param {Array} metricData - Input data record list, raw metric data.
   * @returns {Array} - Output Dygraph Multi-dimensional array matrix Data
   *                    Series for charting: data[ts][series].
   * @see http://dygraphs.com/tests/independent-series.html
   */
  _overlayDataSeries(dataSeries, metricData) {
    let dataId = 0;
    let dataStamp = dataSeries[dataId][DATA_INDEX_TIME];
    let newData = [];

    metricData.forEach((item, rowid) => {
      let metricStamp = item[DATA_INDEX_TIME];
      if (metricStamp.getTime() < dataStamp.getTime()) {
        // merge in raw metric data record
        newData.push([metricStamp, null, item[DATA_INDEX_VALUE]]);
      } else {
        // merge in agg+anom data record
        let aggregate = dataSeries[dataId][DATA_INDEX_VALUE];
        newData.push([dataStamp, aggregate, null]);
        if (dataId < dataSeries.length - 1) {
          dataId++; // increment pointer to data[]
          dataStamp = dataSeries[dataId][DATA_INDEX_TIME];
        }
      }
    });
    return newData;
  }

  shouldComponentUpdate(nextProps, nextState) {
    // allow chart to switch between "show non-agg data" toggle states
    if (this.props.showNonAgg !== nextProps.showNonAgg) {
      return true;
    }

    // Only updates if the model data has changed
    if (this.props.modelData.data.length) {
      return this.props.modelData.modified !== nextProps.modelData.modified;
    }

    return true;
  }

  render() {
    let {metricData, model, modelData, showNonAgg} = this.props;
    let {options, raw, value} = this._chartOptions;
    let {axes, labels, series} = value;
    let metaData = {model, length: {metric: 0, model: 0}};
    let data = [];  // actual matrix of data to plot w/dygraphs

    // 1. Raw metric data on Series 1
    if (metricData.length) {
      data = Array.from(metricData);
      metaData.length.metric = metricData.length;
    }
    // 2. Model anomaly data on Underlay
    if (modelData.data.length) {
      options.modelData = modelData.data;
      metaData.length.model = modelData.data.length;

      // 2a. Aggregated Model metric data on Series 1
      if (model.aggregated) {
        data = Array.from(modelData.data).map((item) => item.slice(0, 2));
      }
    }
    // 3. Overlay: Aggregated on Series 1. Raw on Series 2.
    if (modelData.data.length && showNonAgg) {
      // switch to use merged array
      data = this._overlayDataSeries(data, metricData);

      // Format non-aggregated overlay series
      labels = labels.concat(raw.labels);
      Object.assign(axes, raw.axes);
      Object.assign(series, raw.series);
    }

    // RENDER
    Object.assign(options, {axes, labels, series});
    return (
      <Chart data={data} metaData={metaData} options={options} />
    );
  }

}
