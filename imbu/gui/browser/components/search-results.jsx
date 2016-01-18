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

import React from 'react';
import Material from 'material-ui';
import connectToStores from 'fluxible-addons-react/connectToStores';
import SearchQueryAction from '../actions/search-query';
import SearchStore from '../stores/search';
import ServerStatusStore from '../stores/server-status';

const {
  Styles, Paper,
  Table, TableHeader, TableRow, TableHeaderColumn, TableBody, TableRowColumn
} = Material;

const {
  Spacing
} = Styles;


/**
 * Display Search Results on a Material UI Table
 */
@connectToStores([SearchStore, ServerStatusStore], (context, props) => ({
  ready: context.getStore(ServerStatusStore).isReady(),
  query:  context.getStore(SearchStore).getQuery()
}))
export default class SearchResultsComponent extends React.Component {

  static contextTypes = {
    getStore: React.PropTypes.func,
    executeAction: React.PropTypes.func
  };

  static propTypes = {
    model: React.PropTypes.string.isRequired
  };

  constructor(props, context) {
    super(props);
    let model = props.model;
    let results = context.getStore(SearchStore).getResults(model);
    this.state = {model, results};
  }

  _getStyles() {
    return {
      header: {
        score: {
          width: '50px'
        }
      },
      column: {
        summary: {
          whiteSpace: 'normal',
          overflow: 'auto'
        },
        score: {
          width: '50px'
        }
      },
      content: {
        paddingLeft: `${Spacing.desktopGutterMini}px`,
        maxWidth: '1200px',
        margin: '1 auto'
      },
      modelsMenu: {
        height: '36px',
        fontSize: '12pt',
        border: '1px solid lightgray'
      },
      table: {
        height: '500px'
      }
    };
  }

  _modelChanged(event) {
    let model = event.target.value;
    this.setState({model});
    this._search(this.props.query, model);
  }

  _search(query, model) {
    this.context.executeAction(SearchQueryAction, {query, model});
  }

  componentDidMount() {
    this._search(this.props.query, this.state.model);
  }

  componentWillReceiveProps(nextProps) {
    let model = this.state.model;
    let results = this.context.getStore(SearchStore).getResults(model);
    if (results.length === 0) {
      this._search(nextProps.query, this.state.model);
    } else {
      this.setState({model, results});
    }
  }

  render() {
    console.log(this.state);
    let styles = this._getStyles();
    let ready = this.props.ready;

    // Convert SearchStore results to Table rows
    let rows = this.state.results.map((result, idx) => {
      return (
        <TableRow key={idx}>
          <TableRowColumn key={0} style={styles.column.summary}>
            {result.text}
          </TableRowColumn>
          <TableRowColumn key={1} style={styles.column.score}>
            {result.score.toFixed(4)}
          </TableRowColumn>
        </TableRow>);
    });

    return (
      <Paper style={styles.content} depth={1}>

        <select height={styles.modelsMenu.height}
                disabled={!ready}
                onChange={this._modelChanged.bind(this)}
                value={this.state.model}
                style={styles.modelsMenu}>
          <option value="CioDocumentFingerprint">Cortical.io document-level fingerprints</option>
          <option value="CioWordFingerprint">Cortical.io word-level fingerprints</option>
          <option value="Keywords">Keywords (random encodings)</option>
        </select>

        <Table selectable={false} fixedHeader={true}
          height={styles.table.height} ref="results" style={styles.table}>
          <TableHeader  adjustForCheckbox={false} displaySelectAll={false}>
            <TableRow>
              <TableHeaderColumn key={0} style={styles.column.summary}>
                Match
              </TableHeaderColumn>
              <TableHeaderColumn key={1} style={styles.column.score}>
                Percent Overlap of Query
              </TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false}>
            {rows}
          </TableBody>
        </Table>
      </Paper>
    );
  }
}
