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


import React from 'react';
import connectToStores from 'fluxible-addons-react/connectToStores';

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

    this._chartOptions = {
      // dygraphs global chart options
      options: {
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
            valueRange: [0, 4]
          }
        },
        series: {
          Anomaly: {
            axis: 'y2',
            color: 'red',
            fillGraph: true,
            stepPlot: true,
            strokeWidth: 2
          }
        }
      }
    }; // chartOptions
  } // constructor

  render() {
    let metricDataStore = this.context.getStore(MetricDataStore);
    let metricData = metricDataStore.getData(this.props.modelId);
    let {anomaly, options} = this._chartOptions;
    let {axes, labels, series} = this._chartOptions.value;
    let data = [];
    let modelData, modelDataStore;

    if (metricData.length) {
      // Copy raw data and timestamp
      data = Array.from(metricData);

      // Get model data
      modelDataStore = this.context.getStore(ModelDataStore);
      modelData = modelDataStore.getData(this.props.modelId);
      if (modelData && modelData.data.length > 0) {
        // Initialize Anomaly values to NaN
        data.forEach((item) => item[2] = Number.NaN);

        // Update anomaly values
        modelData.data.forEach((item) => {
          let [rowid, score] = item;
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
      <Chart data={data} options={options} />
    );
  }
}
