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

import muiTheme from './MaterialUI/HTMStudioTheme';


/**
 * Generic Javascript functions that can only be used on the `browser` process.
 * These functions can access objects available from the `browser` process but
 * should not depend on node`
 */


/**
 * Map Anomaly value/height to bar color (Red/Yellow/Green)
 * @param {Number} index - Integer for current count of anomaly height
 * @param {Number} total - Integer for max possible anomaly height
 * @returns {String} - String for Color to use
 */
export function mapAnomalyColor(index, total) {
  let color = muiTheme.palette.safeColor;
  if (index > (total/4)) {
    color = muiTheme.palette.warnColor;
  }
  if (index > (total/2)) {
    color = muiTheme.palette.dangerColor;
  }
  return color;
}
