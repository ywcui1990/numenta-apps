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

import ReactDOM from 'react-dom';
import React from 'react';
import Material from 'material-ui';
import connectToStores from 'fluxible-addons-react/connectToStores';
import SearchStore from '../stores/search';
import SearchQueryAction from '../actions/search-query';

const {
  RaisedButton, TextField, Styles, ClearFix
} = Material;

const {
  Spacing
} = Styles;

@connectToStores([SearchStore], (context) => ({
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

  componentDidUpdate() {
    const el = ReactDOM.findDOMNode(this.refs.query);
    this.refs.query.setValue(this.props.query);
    if (this.props.model) {
      this.refs.model.value = this.props.model;
    }
    el.focus();
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
      }
    };
  }

  render() {
    let styles = this._getStyles();
    return (
      <ClearFix style={styles.content}>
        <TextField floatingLabelText="Enter query:" fullWidth={true}
                  id="query" name="query"
                  onEnterKeyDown={this._search.bind(this)} ref="query"/>

          <select height={styles.modelsMenu.height}
                  defaultValue="CioWindows"
                  ref="model" name="model"
                  style={styles.modelsMenu}>
            <option value="CioWindows">CioWindows</option>
            <option value="CioDocumentFingerprint">CioDocumentFingerprint</option>
            <option value="CioWordFingerprint">CioWordFingerprint</option>
          </select>

          <RaisedButton label="Search" onTouchTap={this._search.bind(this)}
                        role="search" secondary={true}/>
      </ClearFix>
    );
  }
}
