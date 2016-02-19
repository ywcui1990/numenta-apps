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
      green: new RGBColor(muiTheme.rawTheme.palette.safeColor),
      red: new RGBColor(muiTheme.rawTheme.palette.dangerColor),
      yellow: new RGBColor(muiTheme.rawTheme.palette.warnColor)
    };
    this._displayPointCount = this._config.get('chart:points');
    this._anomalyBarHeight = 30; // @TODO calc?
    this._anomalyBarWidth = this._displayPointCount / 14;

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
            valueRange: [0.0, 1.0]
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
    */
  _anomalyBarPlotter(event) {
    let context = event.drawingContext;
    let points = event.points;
    let yBottom = event.dygraph.toDomYCoord(0);
    let colors = this._displayAnomalyColors;
    let gradient = [colors.red, colors.yellow, colors.green];
    let gradientMap = this._mapColorsGradient(this._anomalyBarHeight, gradient);

    points.forEach((point) => {
      let height = yBottom - point.canvasy;
      let xCenter = point.canvasx;
      let xStart = (xCenter - this._anomalyBarWidth / 2);
      let xEnd = (xCenter + this._anomalyBarWidth / 2);
      let index;

      // every bar has a basic 2px placeholder green line
      this._drawLine(context, xStart, xEnd, yBottom, gradientMap[0].toRGB());
      this._drawLine(context, xStart, xEnd, yBottom-1, gradientMap[0].toRGB());

      // draw vertical bar with several horizontal lines in column
      for (index=0; index<height-1; index++) {
        let y = yBottom - index;
        let color = gradientMap[index];
        if (color && 'toRGB' in color) {
          this._drawLine(context, xStart, xEnd, y, color.toRGB());
        }
      }
    });
  }

  // carryover? see line 236
  _applyLogScale(value) {
    if (value > 0.99999) {
      return 1;
    }
    return (
      Math.log(1.0000000001 - value) / Math.log(1.0 - 0.9999999999)
    );
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
   * Make an Anomaly Bar Chart gradient map after passing in # of slots.
   * @param {Number} slots - Integer for number of vertical slots/pixels to use.
   * @param {Array} colors - List of RGBColor objects, i.e.:
   *  [ {RGBColor}, {RGBColor}, ... ]
   *  These colors will be spread over and merged with each other in basic
   *  order across the # of slots provided.
   * @requries RGBColor
   * @returns {Array} - List of RGBColor objects, list has "slots" length,
   *  and contains "colors", with calculated colors in between each, spread
   *  across slots evenly.
   */
  _mapColorsGradient(slots, colors) {
    let colorMap = [];
    let colorDivider = Math.abs(colors.length - 2); // kill first+last
    let colorIndexDelta = parseInt(slots / (colorDivider + 1), 10);
    let colorCount = 0;
    let i, j;

    // first
    colorMap[0] = colors[colorCount];
    // middles
    for (i=colorIndexDelta; i<slots; i+=colorIndexDelta) {
      colorMap[i] = colors[++colorCount];
    }
    // last
    colorMap[slots] = colors[colors.length - 1];

    // fill in gaps inbetween first/middle/last
    for (i=0; i<slots; i+=colorIndexDelta) {
      let current = colorMap[i];
      let target = colorMap[i + colorIndexDelta];
      let deltaRed = Math.round((target.r - current.r) / colorIndexDelta);
      let deltaGreen = Math.round((target.g - current.g) / colorIndexDelta);
      let deltaBlue = Math.round((target.b - current.b) / colorIndexDelta);

      for (j=i; j<(i+colorIndexDelta); j++) {
        if (! colorMap[j]) {
          let r = colorMap[j-1].r + deltaRed;
          let g = colorMap[j-1].g + deltaGreen;
          let b = colorMap[j-1].b + deltaBlue;
          let colorDef = `rgb(${r},${g},${b})`;
          colorMap[j] = new RGBColor(colorDef);
        }
      }
    }

    return colorMap.reverse();
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
        modelData.data.forEach((item) => {
          let [rowid, score] = item;
          if (rowid < data.length) {
            // data[rowid][2] = this._applyLogScale(score);  // see line 135
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
