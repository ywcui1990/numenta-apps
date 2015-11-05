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

export const ACTIONS = Object.freeze({
  ADD_MODEL_SUCCESS: 'ADD_MODEL_SUCCESS',
  ADD_MODEL_FAILED: 'ADD_MODEL_FAILED',

  DELETE_MODEL_SUCCESS: 'DELETE_MODEL_SUCCESS',
  DELETE_MODEL_FAILED: 'DELETE_MODEL_FAILED',

  RECEIVE_DATA_SUCCESS: 'RECEIVE_DATA_SUCCESS',
  RECEIVE_DATA_FAILED: 'RECEIVE_DATA_FAILED',

  SEND_DATA_SUCCESS: 'SEND_DATA_SUCCESS',
  SEND_DATA_FAILED: 'SEND_DATA_FAILED',

  START_MODEL_SUCCESS: 'START_MODEL_SUCCESS',
  START_MODEL_FAILED: 'START_MODEL_FAILED',

  STOP_MODEL_SUCCESS: 'STOP_MODEL_SUCCESS',
  STOP_MODEL_FAILED: 'STOP_MODEL_FAILED',

  UPLOADED_FILE_SUCCESS: 'UPLOADED_FILE_SUCCESS',
  UPLOADED_FILE_FAILED: 'UPLOADED_FILE_FAILED',

  UPDATE_FILE_SUCCESS: 'UPDATE_FILE_SUCCESS',
  UPDATE_FILE_FAILED: 'UPDATE_FILE_FAILED',

  LIST_FILES_SUCCESS: 'LIST_FILES_SUCCESS',
  LIST_FILES_FAILURE: 'LIST_FILES_FAILURE',

  LIST_METRICS_SUCCESS: 'LIST_METRICS_SUCCESS',
  LIST_METRICS_FAILURE: 'LIST_METRICS_FAILURE',

  SHOW_FILE_DETAILS: 'SHOW_FILE_DETAILS',
  HIDE_FILE_DETAILS: 'HIDE_FILE_DETAILS',

  UNKNOWN_MODEL_FAILURE: 'UNKNOWN_MODEL_FAILURE'
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
