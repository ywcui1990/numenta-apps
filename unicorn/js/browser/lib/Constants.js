// Numenta Platform for Intelligent Computing (NuPIC)
// Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero Public License version 3 as
// published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License
// along with this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/

/**
 * - ADD_MODEL : {@link CreateModel}
 * - DELETE_MODEL : {@link DeleteModel}
 * - EXPORT_MODEL_RESULTS : {@link ExportModelResults}
 * - HIDE_FILE_DETAILS : {@link HideFileDetails}
 * - HIDE_METRIC_DETAILS : {@link HideMetricDetails}
 * - HIDE_MODEL : {@link HideModel}
 * - LIST_FILES : {@link ListFiles}
 * - LIST_FILES_FAILURE : {@link ListFiles}
 * - LIST_METRICS : {@link ListMetrics}
 * - LIST_METRICS_FAILURE : {@link ListMetrics}
 * - RECEIVE_DATA : {@link ReceiveData}
 * - SEND_DATA : {@link SendData}
 * - SEND_DATA_FAILED : {@link ModelError}
 * - SHOW_FILE_DETAILS : {@link ShowFileDetails}
 * - SHOW_METRIC_DETAILS : {@link ShowMetricDetails}
 * - SHOW_MODEL : {@linl ShowModel}
 * - START_MODEL_FAILED : {@link ModelError}
 * - START_MODEL: {@link StartModel}
 * - STOP_MODEL : {@link StopModel}
 * - STOP_MODEL_FAILED : {@link ModelError}
 * - UNKNOWN_MODEL_FAILURE : {@link ModelError}
 * - UPDATE_FILE : {@link FileUpdate}
 * - UPDATE_FILE_FAILED : {@link FileUpdate}
 * - UPLOADED_FILE : {@link FileUpload}
 * - UPLOADED_FILE_FAILED : {@link FileUpload}
 */
export const ACTIONS = Object.freeze({
  ADD_MODEL: 'ADD_MODEL',
  DELETE_FILE: 'DELETE_FILE',
  DELETE_MODEL: 'DELETE_MODEL',
  EXPORT_MODEL_RESULTS: 'EXPORT_MODEL_RESULTS',
  HIDE_FILE_DETAILS: 'HIDE_FILE_DETAILS',
  HIDE_METRIC_DETAILS: 'HIDE_METRIC_DETAILS',
  HIDE_MODEL: 'HIDE_MODEL',
  LIST_FILES_FAILURE: 'LIST_FILES_FAILURE',
  LIST_FILES: 'LIST_FILES',
  LIST_METRICS_FAILURE: 'LIST_METRICS_FAILURE',
  LIST_METRICS: 'LIST_METRICS',
  RECEIVE_DATA: 'RECEIVE_DATA',
  SEND_DATA_FAILED: 'SEND_DATA_FAILED',
  SEND_DATA: 'SEND_DATA',
  SHOW_FILE_DETAILS: 'SHOW_FILE_DETAILS',
  SHOW_METRIC_DETAILS: 'SHOW_METRIC_DETAILS',
  SHOW_MODEL: 'SHOW_MODEL',
  START_MODEL_FAILED: 'START_MODEL_FAILED',
  START_MODEL: 'START_MODEL',
  STOP_MODEL_FAILED: 'STOP_MODEL_FAILED',
  STOP_MODEL: 'STOP_MODEL',
  UNKNOWN_MODEL_FAILURE: 'UNKNOWN_MODEL_FAILURE',
  UPDATE_FILE_FAILED: 'UPDATE_FILE_FAILED',
  UPDATE_FILE: 'UPDATE_FILE',
  UPLOADED_FILE_FAILED: 'UPLOADED_FILE_FAILED',
  UPLOADED_FILE: 'UPLOADED_FILE'
});

/**
 * Supported timestamp formats
 * @type {Array}
 */
export const TIMESTAMP_FORMATS = [
  // ISO 8601
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'YYYY-MM-DDTHH:mm:ss.SSZ',
  'YYYY-MM-DDTHH:mm:ss.SS',
  'YYYY-MM-DDTHH:mm:ss.SZ',
  'YYYY-MM-DDTHH:mm:ss.S',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DDTHH:mmZ',
  'YYYY-MM-DDTHH:mm',

  // ISO 8601 no 'T'
  'YYYY-MM-DD HH:mm:ss.SSSZ',
  'YYYY-MM-DD HH:mm:ss.SSS',
  'YYYY-MM-DD HH:mm:ss.SSZ',
  'YYYY-MM-DD HH:mm:ss.SS',
  'YYYY-MM-DD HH:mm:ss.SZ',
  'YYYY-MM-DD HH:mm:ss.S',
  'YYYY-MM-DD HH:mm:ssZ',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mmZ',
  'YYYY-MM-DD HH:mm',
  'YYYY-MM-DD',

  // US Date, 12h AM/PM time
  'MM-DD-YYYY hh:mm:ss.SSS A',
  'MM-DD-YYYY HH:mm:ss.SS A',
  'MM-DD-YYYY HH:mm:ss.S A',
  'MM-DD-YYYY hh:mm:ss A',
  'MM-DD-YYYY hh:mm A',

  // US Date, 24h time
  'MM-DD-YYYY HH:mm:ss.SSS',
  'MM-DD-YYYY HH:mm:ss.SS',
  'MM-DD-YYYY HH:mm:ss.S',
  'MM-DD-YYYY HH:mm:ss',
  'MM-DD-YYYY HH:mm',

  // US Date
  'MM-DD-YYYY',
  'MM-DD-YY',

  // EU Date and time
  'DD-MM-YYYY HH:mm:ss.SSS',
  'DD-MM-YYYY HH:mm:ss.SS',
  'DD-MM-YYYY HH:mm:ss.S',
  'DD-MM-YYYY HH:mm:ss',
  'DD-MM-YYYY HH:mm',

  // EU Date
  'DD-MM-YYYY',
  'DD-MM-YY',

  // US 12h AM/PM time
  'hh:mm:ss.SSS A',
  'hh:mm:ss.SS A',
  'hh:mm:ss.S A',
  'hh:mm:ss A',
  'hh:mm A',

  // EU 24h
  'HH:mm:ss.SSS',
  'HH:mm:ss.SS',
  'HH:mm:ss.S',
  'HH:mm:ss',
  'HH:mm'
];
