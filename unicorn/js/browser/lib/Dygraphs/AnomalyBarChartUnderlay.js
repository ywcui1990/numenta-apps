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

import RGBColor from 'rgbcolor';

import {DATA_FIELD_INDEX} from '../Constants';
import Utils from '../../../main/Utils';

const {DATA_INDEX_TIME, DATA_INDEX_ANOMALY} = DATA_FIELD_INDEX;


/**
 * DyGraph Custom Chart Underlay: AnomalyBarChart Plotter-like callback, for
 *  HTM Model Anomaly Result. Instead of using the Dygraph Chart Series rawData
 *  (which is already used and full), we send model data to the chart via
 *  customzing Dygraph's Underlay Callback. This is a much better simulation
 *  of a y3 axes, instead of a full custom plugin. Model Result data is forced
 *  in via the Dygraph.option with the key "modelData".
 * @param {Object} context - ModelData.jsx component context w/settings.
 * @param {Object} canvas - DOM Canvas object to draw with, from Dygraphs.
 * @param {Object} area - Canvas drawing area metadata, Width x Height info etc.
 * @param {Object} dygraph - Instantiated Dygraph library object itself.
 * @requries Dygraphs
 * @see view-source:http://dygraphs.com/tests/underlay-callback.html
 */
export default function (context, canvas, area, dygraph) {
  let modelData = dygraph.getOption('modelData') || [];
  let xAxisRange = dygraph.xAxisRange();
  let anomalyMax = context._anomalyValueHeight;
  let barWidth = context._anomalyBarWidth;
  let safeColor = context.context.muiTheme.rawTheme.palette.safeColor;
  let yFactor = Math.round(area.h / anomalyMax);
  let halfBarWidth = Math.round(barWidth / 2);

  if (!(modelData.length)) {
    return;  // no anomaly data, no draw bars.
  }

  for (let index=0; index<modelData.length; index++) {
    (function (i) {  // help data survive loop closure
      let time = modelData[i][DATA_INDEX_TIME].getTime();
      let color, value, x, y;

      if (time < xAxisRange[0] || time > xAxisRange[1]) {
        return;  // filter out if not inside the current date range
      }

      value = modelData[i][DATA_INDEX_ANOMALY];
      x = Math.round(dygraph.toDomXCoord(time) - halfBarWidth);

      // draw: every point has small green marker "bar" by default
      canvas.fillStyle = new RGBColor(safeColor).toRGB();
      canvas.fillRect(x, area.h, barWidth, -2);

      if (isFinite(x) && (value >= 0)) {
        // draw: real anomaly bar
        y = 0 - Math.round(value * yFactor) || NaN;
        color = Utils.mapAnomalyColor(value, anomalyMax);
        canvas.fillStyle = new RGBColor(color).toRGB();
        canvas.fillRect(x, area.h, barWidth, y);
      }
    }(index));  // help data survive loop closure
  }  // for loop modelData
}
