// Copyright © 2015, Numenta, Inc. Unless you have purchased from
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
import ModelDataStore from '../stores/ModelDataStore';
import MetricDataStore from '../stores/MetricDataStore';


/**
 *
 * @requries RGBColor
 */
@connectToStores([ModelDataStore, MetricDataStore], () => ({}))
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

    let muiTheme = this.context.muiTheme;

    this._config = this.context.getConfigClient();
    this._displayAnomalyColors = {
      green: muiTheme.rawTheme.palette.safeColor,
      red: muiTheme.rawTheme.palette.dangerColor,
      yellow: muiTheme.rawTheme.palette.warnColor
    };
    this._displayPointCount = this._config.get('chart:points');
    this._anomalyBarWidth = parseInt(this._displayPointCount / 16, 10);
    this._anomalyValueHeight = 1.0;

    this._chartOptions = {
      // dygraphs global chart options
      options: {
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
            strokeWidth: 2,
            color: muiTheme.rawTheme.palette.primary2Color
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
            plotter: this._anomalyBarPlotter.bind(this)
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
  _anomalyBarPlotter(event) {
    let context = event.drawingContext;
    let points = event.points;
    let yBottom = event.dygraph.toDomYCoord(0);

    points.forEach((point) => {
      let height = yBottom - point.canvasy;
      let xCenter = point.canvasx;
      let xStart = (xCenter - this._anomalyBarWidth / 2);
      let xEnd = (xCenter + this._anomalyBarWidth / 2);
      let startColor = new RGBColor(this._mapAnomalyColor(0, yBottom)).toRGB();
      let color, index;

      // every bar has a basic 2px placeholder green line
      this._drawLine(context, xStart, xEnd, yBottom, startColor);
      this._drawLine(context, xStart, xEnd, yBottom-1, startColor);

      // draw vertical bar with several horizontal lines in column
      color = new RGBColor(this._mapAnomalyColor(height, yBottom));
      if (color && 'toRGB' in color) {
        for (index=0; index<height; index++) {
          let y = yBottom - index;
          this._drawLine(context, xStart, xEnd, y, color.toRGB());
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
  _drawLine(context, xStart, xEnd, y, color) {
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(xStart, y);
    context.lineTo(xEnd, y);
    context.stroke();
  }

  /**
   * Map Anomaly value/height to bar color (Red/Yellow/Green)
   * @param {Number} index - Integer for current count of anomaly height
   * @param {Number} total - Integer for max possible anomaly height
   * @returns {String} - String for Color to use
   */
  _mapAnomalyColor(index, total) {
    let color = 'green';
    if (index > (total/4)) {
      color = 'yellow';
    }
    if (index > (total/2)) {
      color = 'red';
    }
    return this._displayAnomalyColors[color];
  }

  render() {
    let metricDataStore = this.context.getStore(MetricDataStore);
    let metricData = metricDataStore.getData(this.props.modelId);
    let {anomaly, options} = this._chartOptions;
    let {axes, labels, series} = this._chartOptions.value;
    let metaData = {length: {metric: 0, model: 0}};
    let data = [];
    let modelData, modelDataStore;

    if (metricData.length) {
      // Copy raw data and timestamp
      data = Array.from(metricData);
      metaData.length.metric = metricData.length;

      // Get model data
      modelDataStore = this.context.getStore(ModelDataStore);
      modelData = modelDataStore.getData(this.props.modelId);
      if (modelData && modelData.data.length > 0) {
        // Initialize Anomaly values to NaN
        data.forEach((item) => item[2] = Number.NaN);
        metaData.length.model = modelData.data.length;
        // Update anomaly values
        modelData.data.forEach((item, rowid) => {
          let score = item[2];
          if (rowid < data.length) {
            data[rowid][2] = score;
          }
        });

        // Format anomaly series
        labels = labels.concat(anomaly.labels);
        Object.assign(axes, anomaly.axes);
        Object.assign(series, anomaly.series);
      }

      Object.assign(options, {axes, labels, series});
    } // if metricData

    return (
      <Chart data={data} metaData={metaData} options={options} />
    );
  }
}
