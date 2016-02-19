// Copyright © 2015, Numenta, Inc.  Unless you have purchased from
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

import 'roboto-fontface/css/roboto-fontface.css';

import {File} from 'file-api';
import provideContext from 'fluxible-addons-react/provideContext';
import RaisedButton from 'material-ui/lib/raised-button';
import React from 'react';
import {remote} from 'electron';
import ThemeDecorator from 'material-ui/lib/styles/theme-decorator';
import ThemeManager from 'material-ui/lib/styles/theme-manager';

import FileUploadAction from '../actions/FileUpload';
import FileList from '../components/FileList';
import FileDetails from '../components/FileDetails';
import LeftNav from '../components/LeftNav';
import ModelList from '../components/ModelList';
import UnicornTheme from '../lib/MaterialUI/UnicornTheme';

const app = remote.app;
const dialog = remote.require('dialog');

// TODO: remove (DEBUG)
const INPUT_OPTS = {
  csv: '/Users/mleborgne/_git/numenta-apps/unicorn/js/samples/gym.csv',
  datetimeFormat: '%m-%d-%y %H:%M',
  timestampIndex: 0,
  rowOffset: 4,
  valueIndex: 1
};


const AGG_OPTS = {
  windowSize: 14400,
  func: 'mean'
};

const MODEL_OPTS = {
  inferenceArgs: {
    predictionSteps: [
      1
    ],
    predictedField: 'c1',
    inputPredictedField: 'auto'
  },
  modelConfig: {
    aggregationInfo: {
      seconds: 0,
      fields: [

      ],
      months: 0,
      days: 0,
      years: 0,
      hours: 0,
      microseconds: 0,
      weeks: 0,
      minutes: 0,
      milliseconds: 0
    },
    model: 'CLA',
    version: 1,
    predictAheadTime: null,
    modelParams: {
      sensorParams: {
        verbosity: 0,
        encoders: {
          c0_dayOfWeek: {
            dayOfWeek: [
              21,
              3
            ],
            fieldname: 'c0',
            type: 'DateEncoder',
            name: 'c0'
          },
          c0_timeOfDay: {
            fieldname: 'c0',
            timeOfDay: [
              21,
              9
            ],
            type: 'DateEncoder',
            name: 'c0'
          },
          c1: {
            fieldname: 'c1',
            seed: 42,
            resolution: 1.1032878900316,
            name: 'c1',
            type: 'RandomDistributedScalarEncoder'
          },
          c0_weekend: null
        },
        sensorAutoReset: null
      },
      anomalyParams: {
        anomalyCacheRecords: null,
        autoDetectThreshold: null,
        autoDetectWaitRecords: 5030
      },
      spParams: {
        columnCount: 2048,
        synPermInactiveDec: 0.0005,
        maxBoost: 1,
        spatialImp: 'cpp',
        inputWidth: 0,
        spVerbosity: 0,
        synPermConnected: 0.1,
        synPermActiveInc: 0.0015,
        seed: 1956,
        numActiveColumnsPerInhArea: 40,
        globalInhibition: 1,
        potentialPct: 0.8
      },
      trainSPNetOnlyIfRequested: false,
      clParams: {
        alpha: 0.035828933612158,
        regionName: 'CLAClassifierRegion',
        steps: '1',
        clVerbosity: 0
      },
      tpParams: {
        columnCount: 2048,
        activationThreshold: 13,
        pamLength: 3,
        cellsPerColumn: 32,
        permanenceInc: 0.1,
        minThreshold: 10,
        verbosity: 0,
        maxSynapsesPerSegment: 32,
        outputType: 'normal',
        globalDecay: 0,
        initialPerm: 0.21,
        permanenceDec: 0.1,
        seed: 1960,
        maxAge: 0,
        newSynapseCount: 20,
        maxSegmentsPerCell: 128,
        temporalImp: 'cpp',
        inputWidth: 2048
      },
      clEnable: false,
      spEnable: true,
      inferenceType: 'TemporalAnomaly',
      tpEnable: true
    }
  },
  valueFieldName: 'c1',
  timestampFieldName: 'c0'
};


/**
 * React Main View Component
 */
@provideContext({
  getConfigClient: React.PropTypes.func,
  getLoggerClient: React.PropTypes.func,
  getDatabaseClient: React.PropTypes.func,
  getFileClient: React.PropTypes.func,
  getModelClient: React.PropTypes.func,
  getParamFinderClient: React.PropTypes.func
})
@ThemeDecorator(ThemeManager.getMuiTheme(UnicornTheme)) // eslint-disable-line new-cap
export default class Main extends React.Component {

  static get contextTypes() {
    return {
      executeAction: React.PropTypes.func.isRequired,
      getParamFinderClient: React.PropTypes.func,
      getConfigClient: React.PropTypes.func,
      getModelClient: React.PropTypes.func
    };
  }


  constructor(props, context) {
    super(props, context);

    this._config = this.context.getConfigClient();

    this._styles = {
      root: {},
      add: {
        float: 'right',
        marginRight: '0.75rem',
        marginTop: '0.75rem'
      },
      addLabel: {
        fontWeight: 400
      },
      models: {
        marginLeft: 256,
        padding: '1rem'
      }
    };
  }


  _onClickDebug() {
    let pfClient = this.context.getParamFinderClient();
    console.log('DEBUG: Main.jsx:paramFinderInput', INPUT_OPTS);
    pfClient.createParamFinder(1, INPUT_OPTS);

    let modelClient = this.context.getModelClient();
    console.log('DEBUG: Main.jsx:InfoOpts', INPUT_OPTS, AGG_OPTS, MODEL_OPTS);
    modelClient.createModel('!Metric!f0ac44078ffbe4ce!0b8fd68132e02146', INPUT_OPTS, AGG_OPTS, MODEL_OPTS);
  }

  /**
   * Add/Upload new data/CSV file button onClick event handler
   */
  _onClick() {
    let file = {};
    let selected = dialog.showOpenDialog({
      title: this._config.get('dialog:file:add:title'),
      defaultPath: app.getPath('desktop'),
      filters: [
        {name: 'CSV', extensions: ['csv']}
      ],
      properties: ['openFile']
    });
    if (selected && selected.length > 0) {
      file = new File({path: selected[0]});
      this.context.executeAction(FileUploadAction, file);
    }
  }

  /**
   * Render
   * @return {object} Abstracted React/JSX DOM representation to render to HTML
   * @todo refactor to better sub-components with individuated styles
   * @todo check up zIndex and zDepths
   * @TODO Tooltip on + ADD icon - "Upload new CSV file" or something
   */
  render() {
    return (
      <main style={this._styles.root}>
        <LeftNav>
          <RaisedButton
            label={this._config.get('button:add')}
            labelStyle={this._styles.addLabel}
            onClick={this._onClick.bind(this)}
            primary={true}
            style={this._styles.add}
            />
          <FileList/>
        </LeftNav>
        <section style={this._styles.models}>
          <ModelList />
        </section>
        <FileDetails/>
      </main>
    );
  }
}
