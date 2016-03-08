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

import Dygraph from 'dygraphs';
import RGBColor from 'rgbcolor';

import Utils from '../../../main/Utils';


/**
 * DyGraphs custom plotter function to draw Anomaly bar charts
 * @param {Object} event - Dygraph event object reference
 * @requires RGBColor
 */
function _anomalyBarChartPlotter(event) {
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
function _chartDrawLine(context, xStart, xEnd, y, color) {
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(xStart, y);
  context.lineTo(xEnd, y);
  context.stroke();
}

_anomalyBarChartPlotter = _anomalyBarChartPlotter;
_chartDrawLine = _chartDrawLine;


/**
 * DyGraph Plugin - AnomalyBarChart Plotter-like Plugin for Model Anomaly Result
 * @requries Dygraphs
 * @see github.com/danvk/dygraphs/blob/master/src/plugins/range-selector.js
 */
export default class {

  /**
   * Construct Dygraphs Plugin object
   */
  constructor() {
    this._dataIndexTimestamp = 0;  // 0 for data timestamp field
    this._dataIndexAnomaly = 2;  // 2 for anomaly score field from model

    this._canvas = null;
    this._canvas_context = null;
    this._canvasRect = null;
    this._dygraph = null;
    this._graphDiv = null;
    this._interfaceCreated = false;
  }

  // --- public Dygraph Plugin API methods ---

  /**
   * Get Dygraphs Plugin info
   * @returns {String} - Plugin text description
   */
  toString() {
    return 'AnomalyBarChart Plugin';
  }

  /**
   * Activate Dygraphs Plugin
   * @param {Object} dygraph - Dygraph object to plug
   * @param {Object} registerer - Dygraph event handler registerer object
   * @returns {Object} - Dygraph Plugin utility hash object
   */
  activate(dygraph, registerer) {
    this._dygraph = dygraph;

    this._createInterface();

    return {
      predraw: this._renderStaticLayer
    };
  }

  /**
   * Destroy Dygraphs Plugin
   */
  destroy() {
    this._canvas = null;
    this._canvas_context = null;
    this._canvasRect = null;
    this._dygraph = null;
    this._graphDiv = null;
    this._interfaceCreated= null;
  }

  // --- private methods ---

  /**
   * Adds the anomaly bar charts to the graph.
   */
  _addToGraph() {
    let graphDiv = this._graphDiv = this._dygraph.graphDiv;
    graphDiv.appendChild(this._canvas);
  }

  /**
   * Creates the background and foreground canvases.
   */
  _createCanvases() {
    this._canvas = Dygraph.createCanvas();
    this._canvas.className = 'dygraph-anomalybarchart-canvas';
    this._canvas.style.position = 'absolute';
    this._canvas.style.zIndex = 50;
    this._canvas_context = Dygraph.getContext(this._canvas);
  }

  /**
   * Creates the anomaly bar chart elements and adds them to the graph.
   */
  _createInterface() {
    this._createCanvases();
    this._interfaceCreated = true;
    this._addToGraph();
  }

  /**
   * Draws a bar on the canvas.
   * @param {Object} context - Dygraph drawing context object
   * @param {Number} x - X Coordinate of bar to draw
   * @param {Number} height - Max height of line
   * @param {String} color - String of color to use for bar draw
   * @param {String} stroke - Bar stroke width
   */
  _drawBar(context, x, height, color, stroke) {
    context.beginPath();
    context.moveTo(x, height - 1);
    context.lineTo(x, 2);
    context.closePath();
    this._canvas_context.lineWidth = stroke;
    this._canvas_context.strokeStyle = new RGBColor(color).toRGB();
    context.stroke();
  }

  /**
   * Draws the plot on the canvas.
   */
  _drawPlot() {
    let modelData = this._getOption('modelData');
    let context = this._canvas_context;
    let xExtremes = this._dygraph.xAxisRange();
    let yRange = 1;
    let margin = 0.5;
    // let canvasWidth = this._canvasRect.w - margin;
    let canvasHeight = this._canvasRect.h - margin;
    let stroke = 1;
    let yFactor = Math.round(canvasHeight / yRange);
    // let xFactor;

    // pull out data for currently visible chart range
    modelData = modelData.filter((data) => {
      let time = data[this._dataIndexTimestamp].getTime();
      if (time >= xExtremes[0] && time <= xExtremes[1]) {
        return true;
      }
      return false;
    });

    // xFactor = Math.round(canvasWidth / modelData.length);

    // draw anom bars for currently visible chart range
    modelData.forEach((data) => {
      let time = data[this._dataIndexTimestamp].getTime();
      let value = data[this._dataIndexAnomaly];
      // let x = this._xValueToPixel(time, xExtremes[0], xFactor);
      let x = this._dygraph.toDomXCoord(time);
      let color, y;

      if (isFinite(x) && (value >= 0.25)) {
        y = this._yValueToPixel(value, yFactor);
        color = Utils.mapAnomalyColor(value, yRange);
        this._drawBar(context, x, y, color, stroke);
        // console.log('drawBar', x, y, color);
      }
    });
  }

  /**
   * Draws the static layer in the background canvas.
   */
  _drawStaticLayer() {
    let context = this._canvas_context;

    if (! this._hasData()) {
      return;
    }

    context.clearRect(0, 0, this._canvasRect.w, this._canvasRect.h);

    try {
      this._drawPlot();
    } catch (error) {
      console.error(error); // eslint-disable-line
    }
  }

  /**
   * Helper shortcut to get options from live Dygraphs chart
   * @param {String} name - Name of dygraph option to get
   * @param {String} series - Filter options for a specific series
   * @returns {Number|Object|String} - Resulting Dygrpah option value
   */
  _getOption(name, series) {
    return this._dygraph.getOption(name, series);
  }

  /**
   * Detect if we have valid data input
   * @returns {Boolean} - Flag if actual data was passed in or not
   */
  _hasData() {
    let data = this._getOption('modelData');
    let hasData = false;
    let first = NaN;

    if (data && data.length && data[0][this._dataIndexAnomaly]) {
      first = data[0][this._dataIndexAnomaly];
    }
    hasData = !isNaN(first);
    return hasData;
  }

  /**
   * Removes the anomaly bar charts from the graph.
   */
  _removeFromGraph() {
    let graphDiv = this._graphDiv;
    graphDiv.removeChild(this._canvas);
    this._graphDiv = null;
  }

  /**
   * Renders the static portion of the anomaly bar charts at predraw.
   * @param {Event} event - Dygraph event fired when time to render our own.
   */
  _renderStaticLayer(event) {
    this._resize();
    this._drawStaticLayer();
  }

  /**
   * Resizes the anomaly bar charts
   */
  _resize() {
    let plotArea = this._dygraph.layout_.getPlotArea();
    let xAxisLabelHeight;

    if (this._dygraph.getOptionForAxis('drawAxis', 'x')) {
      xAxisLabelHeight = this._getOption('xAxisHeight') || 0;
      if (xAxisLabelHeight <= 0) {
        xAxisLabelHeight = (this._getOption('axisLabelFontSize') *
                            this._getOption('axisTickSize')) / 2;
      }
    }
    this._canvasRect = {
      x: plotArea.x,
      y: plotArea.y,
      w: plotArea.w,
      h: plotArea.h
    };
    this._setElementRect(this._canvas, this._canvas_context, this._canvasRect);
  }

  /**
   * Resize/Rescale a DOM element via Dygraphs utils and css
   * @param {Object} canvas - Actual canvas to draw to
   * @param {Object} context - Dygraph context object
   * @param {Object} rect - Rectangle to use as canvas
   */
  _setElementRect(canvas, context, rect) {
    let canvasScale = Dygraph.getContextPixelRatio(context);

    canvas.style.top = `${rect.y}px`;
    canvas.style.left = `${rect.x}px`;
    canvas.width = rect.w * canvasScale;
    canvas.height = rect.h * canvasScale;
    canvas.style.width = `${rect.w}px`;
    canvas.style.height = `${rect.h}px`;

    if (canvasScale !== 1) {
      context.scale(canvasScale, canvasScale);
    }
  }

  /**
   * Convert X value (ts) to X Pixel Coord
   * @param {Number} x - X value to map
   * @param {Number} xMax - Relative X Max value to map against
   * @param {Number} xFactor - Relative X Scaling factor
   * @returns {Number|NaN} - X pixel coordinate
   */
  _xValueToPixel(x, xMax, xFactor) {
    let value = NaN;
    if (x !== null) {
      value = Math.round((x - xMax) * xFactor, 10);
      console.log(x, xMax, xFactor, value);
      console.log('  ', value);
    }
    return value;
  }

  /**
   * Convert Y value (data value) to Y Pixel Coord
   * @param {Number} y - Y value to map
   * @param {Number} yFactor - Relative Y Scaling factor
   * @returns {Number|NaN} - Y pixel coordinate
   */
  _yValueToPixel(y, yFactor) {
    if (y !== null) {
      return Math.round(y * yFactor);
    }
    return NaN;
  }

}
