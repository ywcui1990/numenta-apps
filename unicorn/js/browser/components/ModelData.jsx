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
import RGBColor from 'rgbcolor';

import Chart from '../components/Chart';
import MetricDataStore from '../stores/MetricDataStore';
import ModelDataStore from '../stores/ModelDataStore';
import ModelStore from '../stores/ModelStore';
import RangeSelectorBarChart from '../lib/Dygraphs/RangeSelectorBarChartPlugin';
import Utils from '../../main/Utils';


/**
 * React Component for sending Model Data from Model component to
 *  Chart component.
 */
@connectToStores([MetricDataStore, ModelDataStore, ModelStore], () => ({}))
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
      modelId: React.PropTypes.string.isRequired
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
        plugins: [RangeSelectorBarChart],
        rangeSelectorPlotFillColor: muiTheme.rawTheme.palette.primary1FadeColor,
        rangeSelectorPlotStrokeColor: muiTheme.rawTheme.palette.primary1Color,
        showRangeSelector: true
      },

      // main value data chart line
      value: {
        labels: ['Time', 'Value'],
        axes: {
          x: {drawGrid: false},
          y: {drawGrid: false}
        },
        series: {
          Value: {
            color: muiTheme.rawTheme.palette.primary2Color,
            showInRangeSelector: true,
            strokeWidth: 2
          }
        }
      },

      // anomaly value chart line
      anomaly: {
        labels: ['Anomaly'],
        axes: {
          y2: {
            axisLabelWidth: 0,
            drawGrid: false,
            valueRange: [0.0, this._anomalyValueHeight]
          }
        },
        series: {
          Anomaly: {
            axis: 'y2',
            plotter: this._anomalyBarChartPlotter.bind(this)
          }
        }
      }
    }; // chartOptions
  } // constructor

  /**
   * DyGraphs custom plotter function to draw Anomaly bar charts
   * @param {Object} event - Dygraph event object reference
   * @requires RGBColor
   */
  _anomalyBarChartPlotter(event) {
    let context = event.drawingContext;
    let points = event.points;
    let yBottom = event.dygraph.toDomYCoord(0);

    points.forEach((point) => {
      let height = yBottom - point.canvasy;
      let xCenter = point.canvasx;
      let xStart = (xCenter - this._anomalyBarWidth / 2);
      let xEnd = (xCenter + this._anomalyBarWidth / 2);
      let startColor = new RGBColor(Utils.mapAnomalyColor(0, yBottom)).toRGB();
      let color, index;

      // every bar has a basic 2px placeholder green line
      this._chartDrawLine(context, xStart, xEnd, yBottom, startColor);
      this._chartDrawLine(context, xStart, xEnd, yBottom-1, startColor);

      // draw vertical bar with several horizontal lines in column
      color = new RGBColor(Utils.mapAnomalyColor(height, yBottom));
      if (color && 'toRGB' in color) {
        // @TODO This was originally for anomaly bars that had color gradients
        //  instead of flat bars. It could probably be optimized to use less
        //  calls to the <canvas> actually .stroke()ing.
        for (index=0; index<height; index++) {
          let y = yBottom - index;
          this._chartDrawLine(context, xStart, xEnd, y, color.toRGB());
        }
      }
    });
  }

  /**
   * DyGraph custom Plotter function to draw a simple horizontal line
   * @param {Object} context - DyGraph object context
   * @param {Number} xStart - Starting X coord of line
   * @param {Number} xEnd - Ending X coord of line
   * @param {Number} y - Y coord of line
   * @param {String|Object} color - Color (string or RGBColor object) for line
   */
  _chartDrawLine(context, xStart, xEnd, y, color) {
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(xStart, y);
    context.lineTo(xEnd, y);
    context.stroke();
  }

  render() {
    // load data
    let modelId = this.props.modelId;
    let metricDataStore = this.context.getStore(MetricDataStore);
    let modelDataStore = this.context.getStore(ModelDataStore);
    let modelStore = this.context.getStore(ModelStore);
    let metricData = metricDataStore.getData(modelId);
    let modelData = modelDataStore.getData(modelId);
    let model = modelStore.getModel(modelId);

    // prep data
    let {anomaly, options} = this._chartOptions;
    let {axes, labels, series} = this._chartOptions.value;
    let metaData = {model, length: {metric: 0, model: 0}};
    let anomalySourceIndex = 2;  // source data = [0=ts, 1=val, 2=ANOM!]
    let data = [];  // actual matrix of data to plot w/dygraphs
    let chartSeries = {  // keep track of Display+Data series on the Chart
      // index: Relate chart series indexes to data types (raw,anom,agg).
      //  series 0 = <timestamp, invisible, hidden>
      //  series 1 = dark blue (raw _or_ aggregated)
      //  series 2 = anomaly plotter (anomalies)
      //  series 3 = light numenta blue (raw _and_ aggregated)
      index: {
        aggregated: null,  // model-aggregated metric data, 1 on (raw+agg)
        anomaly: null,  // model anomlay data, usually series 2
        raw: null  // raw metric data, usually series 1. Or, 3 on (raw+agg)
      },
      show: {
        aggregated: false,  // show the Model-Aggregated Data line chart?
        anomaly: false,  // show the Model Anomaly data bar chart?
        raw: false  // show the Raw Metric data line chart?
      },
      total: 0  // # series: 0=none/ts, 1=raw, 2=anom+(raw|agg), 3=anom+raw+agg.
    };

    // Initialize: Chart Series Display+Data state (3 total, 2 has part A and B)
    if (metricData.length && !modelData.data.length) {
      // 1. Metric-provided Raw Data on Series 1, alone by itself
      chartSeries.index.raw = 1;
      chartSeries.show.raw = true;
      chartSeries.total = 1;
    } else if (modelData.data.length) {
      // 2. Model-provided Anomaly Data on Series 2. Series 1 is either now the
      //    Model-provided Aggregated Metric Data, _OR_ is still the
      //    Metric-provided Raw Metric Data as before.
      chartSeries.index.anomaly = 2;
      chartSeries.show.anomaly = true;
      chartSeries.total = 2;
      // (2. Raw or Aggregated data?)
      if (model.aggregated) {
        // 2a. Now the Model-provided Aggregated Metric Data, along w/Anomlies
        chartSeries.index.aggregated = 1;
        chartSeries.show.aggregated = true;
      } else {
        // 2b. still the Metric-provided Raw Metric Data, along with Anomalies
        chartSeries.index.raw = 1;
        chartSeries.show.raw = true;
      }
    } else if (1===2) {
      // 3. Model-provided Aggregated Metric Data on Series 1, and Anomaly Data
      //    on Series 2. Series 3 is now the additional Raw Metric Data.
      chartSeries.index.aggregated = 1;
      chartSeries.index.anomaly = 2;
      chartSeries.index.raw = 3;
      chartSeries.show.anomaly = true;
      chartSeries.show.aggregated = true;
      chartSeries.show.raw = true;
      chartSeries.total = 3;
    }

    // Use Chart Series Data+Display state to prepare data and charts
    if (
      chartSeries.total <= 2 &&
      chartSeries.show.raw &&
      chartSeries.index.raw === 1
    ) {
      // series 1 => Metric-provided Raw Metric Data
      data = Array.from(metricData);
      metaData.length.metric = metricData.length;
    }
    if (
      chartSeries.total > 0 &&
      chartSeries.show.anomaly &&
      chartSeries.index.anomaly === 2
    ) {
      // series 2 => Model-provided Anomaly Data
      if (model.aggregated) {
        // series 1 => New Model-provided Aggregated Metric Data
        data = Array.from(modelData.data);
      } else {
        // series 1 => Overwrite Metric-provided Raw Metric Data
        data.forEach((item) => item[chartSeries.index.anomaly] = Number.NaN);
        // Update anomaly value
        modelData.data.forEach((item, rowid) => {
          if (rowid < data.length) {
            data[rowid][chartSeries.index.anomaly] = item[anomalySourceIndex];
          }
        });
      }
      metaData.length.model = modelData.data.length;

      // Format anomaly series
      labels = labels.concat(anomaly.labels);
      Object.assign(axes, anomaly.axes);
      Object.assign(series, anomaly.series);
    }

    // render chart
    Object.assign(options, {axes, labels, series});
    return (
      <Chart data={data} metaData={metaData} options={options} />
    );
  }

}
