/* -----------------------------------------------------------------------------
 * Copyright © 2015, Numenta, Inc. Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for
 * more details.
 *
 * You should have received a copy of the GNU Affero Public License along with
 * this program. If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * -------------------------------------------------------------------------- */

import BaseStore from 'fluxible/addons/BaseStore';

/**
  Imbu search store. Used to query and access Imbu search results.
*/
export default class SearchStore extends BaseStore {

  static storeName = 'SearchStore';

  static handlers = {
    SEARCH_RECEIVED_DATA: '_handleReceivedData',
    SEARCH_CLEAR_DATA: '_handleClearData'
  };

  constructor(dispatcher) {
    super(dispatcher);
    // Text used to query
    this.query = null;
    // Model used to query
    this.model = null;
    // Last query results
    this.results = [];
    // Past queries
    this.history = new Map();
  }

  /**
   * Return current query
   */
  getQuery() {
    return this.query;
  }

  /**
   * Return current model
   */
  getModel() {
    return this.model;
  }

  /**
   * Return past queries history
   */
  getHistory() {
    return this.history.values();
  }

  /**
   * Returns current query results
   */
  getResults() {
    return this.results;
  }

  /**
   * Handle new data
   */
  _handleReceivedData(payload) {
    if (payload.query) {
      // Remove whitespaces
      this.query = payload.query.trim();
    } else {
      this.query = '';
    }
    this.model = payload.model;

    // Do not add empty queries to history
    if (this.query) {
      this.history.set(`${this.model}:${this.query}`,
        {query: this.query, model: this.model});
    }
    if (payload.results) {
      // Sort results by score
      this.results = payload.results.sort((a, b) => {
        return a.score - b.score;
      });
    } else {
      // No data
      this.results = [];
    }
    this.emitChange();
  }

  /**
   * Handle clear requests
   */
  _handleClearData() {
    this.query = null;
    this.model = null;
    this.results = [];
    this.history.clear();
    this.emitChange();
  }
}
