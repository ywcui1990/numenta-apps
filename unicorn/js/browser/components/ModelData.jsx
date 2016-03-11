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
import Chart from '../components/Chart';
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
  (context, props) => ({
    metricData: context.getStore(MetricDataStore).getData(props.modelId),
    modelData: context.getStore(ModelDataStore).getData(props.modelId),
    model: context.getStore(ModelStore).getModel(props.modelId)
  }))
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
        highlightCircleSize: 0,
        plugins: [RangeSelectorBarChart],
        rangeSelectorPlotFillColor: muiTheme.rawTheme.palette.primary1FadeColor,
        rangeSelectorPlotStrokeColor: muiTheme.rawTheme.palette.primary1Color,
        showLabelsOnHighlight: false,
        showRangeSelector: true,
        underlayCallback: AnomalyBarChart.bind(null, this)
      },

      // main value data chart line (could be either Raw OR Aggregated data)
      value: {
        labels: ['Time', 'Value'],
        axes: {
          x: {drawGrid: false},
          y: {drawGrid: false}
        },
        series: {
          Value: {
            axis: 'y',
            color: muiTheme.rawTheme.palette.primary2Color,  // dark blue
            showInRangeSelector: true,  // plot alone in range selector
            strokeWidth: 2
          }
        }
      },

      // non-aggregated line chart overlay on top of aggregated data line chart
      raw: {
        labels: ['NonAggregated'],
        axes: {
          y2: {drawGrid: false}
        },
        series: {
          NonAggregated: {
            axis: 'y2',
            color: muiTheme.rawTheme.palette.primary1Color,  // light blue
            showInRangeSelector: false,
            strokeWidth: 2
          }
        }
      }
    }; // chartOptions
  } // constructor

  render() {
    // load data
    let {modelId, showNonAgg} = this.props;
    let metricDataStore = this.context.getStore(MetricDataStore);
    let modelDataStore = this.context.getStore(ModelDataStore);
    let modelStore = this.context.getStore(ModelStore);
    let metricData = metricDataStore.getData(modelId);
    let modelData = modelDataStore.getData(modelId);
    let model = modelStore.getModel(modelId);

    // prep data
    let {options, raw, value} = this._chartOptions;
    let {axes, labels, series} = value;
    let metaData = {model, length: {metric: 0, model: 0}};
    let data = [];  // actual matrix of data to plot w/dygraphs

    // --- keep track of Display+Data series on the Chart ---
    let chartSeries = {
      // index: Relate chart series indexes to data types (raw,anom,agg).
      //  series 1 = dark blue (raw _or_ aggregated)
      //  series 2 = light numenta blue (raw _and_ aggregated)
      //  plugin = anomaly bar charts underlay
      index: {
        timestamp: 0,
        aggregated: null,  // model-aggregated metric data, series 1.
        raw: null  // raw metric data, series 2.
      },
      show: {
        aggregated: false,  // show the Model-Aggregated Data line chart?
        anomaly: false,  // show the Model Anomaly data bar chart?
        raw: false  // show the Raw Metric data line chart?
      },
      total: 0  // # series: 0=none/ts, 1=raw|agg, 2=raw-overlay
    };

    // --- Init Chart Series Display+Data state (3 total states, #2 w/parts) ---
    if (metricData.length && !modelData.data.length) {
      // 1. Metric-provided Raw Data on Series 1, alone by itself.
      chartSeries.index.raw = 1;
      chartSeries.show.raw = true;
      chartSeries.total = 1;
    } else if (modelData.data.length && !showNonAgg) {
      // 2. Model-provided Anomaly Data goes into custom Dygraphs Plugin.
      //    Series 1 is either still the Metric-provided Raw Metric Data, or may
      //    become the Model-provided Aggregated Metric Data below.
      chartSeries.show.anomaly = true;
      chartSeries.total = 1;
      //  (2. Raw or Aggregated data?)
      if (model.aggregated) {
        // 2a. Now the Model-provided Aggregated Metric Data, along w/Anomlies
        chartSeries.index.aggregated = 1;
        chartSeries.show.aggregated = true;
      } else {
        // 2b. still the Metric-provided Raw Metric Data, along with Anomalies
        chartSeries.index.raw = 1;
        chartSeries.show.raw = true;
      }
    } else if (modelData.data.length && showNonAgg) {
      // 3. Model-provided Aggregated Metric Data on Series 1, and now the
      //    additional Raw Metric Data goes on to Series 2.
      chartSeries.index.aggregated = 1;
      chartSeries.index.raw = 2;
      chartSeries.show.anomaly = true;
      chartSeries.show.aggregated = true;
      chartSeries.show.raw = true;
      chartSeries.total = 2;
    }

    // --- Use Chart Series Data+Display state to prepare data and charts ---
    // * Series 1 => Metric-provided Raw Metric Data
    if (
      chartSeries.total > 0 &&
      chartSeries.show.raw &&
      chartSeries.index.raw === 1
    ) {
      data = Array.from(metricData);
      metaData.length.metric = metricData.length;
    }
    // * Plugin => Model-provided Anomaly Data
    if (
      chartSeries.total > 0 &&
      chartSeries.show.anomaly
    ) {
      // reinit Anomaly Bars plugin bound to fresh model data
      options.modelData = modelData.data;
      metaData.length.model = modelData.data.length;

      if (model.aggregated) {
        // series 1 => New Model-provided Aggregated Metric Data
        data = Array.from(modelData.data);
      }
    }
    // * Series 2 => Metric-provided Raw Data overlay over top of Agg data chart
    if (
      chartSeries.total === 2 &&
      chartSeries.show.raw &&
      chartSeries.index.raw === 2
    ) {
      // Merge data[] + metricData[], that is, merge Raw Non-Aggregated Metric
      //  Data with Aggregated Metric Data into output Chart Data grid.
      let newData = [];
      let dataId = 0;
      let dataStamp = data[dataId][DATA_INDEX_TIME].getTime();
      metricData.forEach((item, rowid) => { // increment pointer to metricData[]
        let metricStamp = item[DATA_INDEX_TIME].getTime();
        if (metricStamp < dataStamp) {
          // merge in raw metric data record
          newData.push([
            metricStamp,
            null,
            item[DATA_INDEX_VALUE]
          ]);
        } else {
          // merge in agg+anom data record
          newData.push([
            dataStamp,
            data[dataId][chartSeries.index.aggregated],
            null
          ]);

          if (dataId < data.length - 1) {
            dataId++; // increment pointer to data[]
            dataStamp = data[dataId][DATA_INDEX_TIME].getTime();
          }
        }
      });
      data = newData; // switch to use merged array

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
