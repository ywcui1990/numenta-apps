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

import connectToStores from 'fluxible-addons-react/connectToStores';
import ReactDOM from 'react-dom';
import React from 'react';
import Material from 'material-ui';

import CheckServerStatusAction from '../actions/server-status';
import SearchQueryAction from '../actions/search-query';
import SearchStore from '../stores/search';
import ServerStatusStore from '../stores/server-status';

const {
  RaisedButton, TextField, Styles, ClearFix, LinearProgress
} = Material;

const {
  Spacing, Colors
} = Styles;

@connectToStores([SearchStore, ServerStatusStore], (context) => ({
  ready: context.getStore(ServerStatusStore).isReady(),
  query: context.getStore(SearchStore).getQuery(),
  model: context.getStore(SearchStore).getModel()
}))
export default class SearchComponent extends React.Component {

  static contextTypes = {
    executeAction: React.PropTypes.func,
    getStore: React.PropTypes.func
  };

  constructor() {
    super();
  }

  componentDidMount() {
    // Check server status
    this._checkServerStatus();
  }

  componentDidUpdate() {
    const el = ReactDOM.findDOMNode(this.refs.query);
    this.refs.query.setValue(this.props.query);
    if (this.props.model) {
      this.refs.model.value = this.props.model;
    }
    el.focus();
  }

  /**
   * Pool server until all models are ready
   */
  _checkServerStatus() {
    if (!this.props.ready) {
      this.context.executeAction(CheckServerStatusAction);
      // Wait 5 seconds before next poll
      setTimeout(() =>  this._checkServerStatus(), 5000);
    }
  }

  _search() {
    let query = this.refs.query.getValue();
    let model = this.refs.model.value;
    this.context.executeAction(SearchQueryAction, {query, model});
  }

  _getStyles() {
    return {
      content: {
        padding: `${Spacing.desktopGutterMini}px`,
        maxWidth: '1200px',
        margin: '0 auto',
        boxSizing: 'border-box'
      },
      modelsMenu: {
        height: '36px',
        fontSize: '12pt',
        border: '1px solid lightgray'
      },
      progress: {
        color: Colors.red500
      }
    };
  }

  render() {
    let styles = this._getStyles();
    let progress;
    let ready = this.props.ready;
    if (!ready) {
      progress = (
        <ClearFix>
          <h3 height={styles.modelsMenu.height} style={styles.progress}>
            Please wait while models are being built
          </h3>
          <p/>
          <LinearProgress mode="indeterminate"/>
        </ClearFix>);
    }
    return (

      <ClearFix style={styles.content}>
        {progress}
        <TextField floatingLabelText="Enter query:"
                   fullWidth={true}
                   id="query" name="query"
                   disabled={!ready}
                   onEnterKeyDown={this._search.bind(this)}
                   ref="query"/>
        <select height={styles.modelsMenu.height}
                disabled={!ready}
                onChange={this._search.bind(this)}
                defaultValue="CioWindows"
                ref="model" name="model"
                style={styles.modelsMenu}>
          <option value="CioWindows">Cortical.io windows</option>
          <option value="CioDocumentFingerprint">Cortical.io document-level fingerprints</option>
          <option value="CioWordFingerprint">Cortical.io word-level fingerprints</option>
        </select>
        <RaisedButton label="Search" onTouchTap={this._search.bind(this)}
                      disabled={!ready}
                      role="search" secondary={true}/>
    </ClearFix>
    );
  }
}
