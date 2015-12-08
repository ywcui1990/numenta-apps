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
import SearchStore from '../stores/search';

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
@connectToStores([SearchStore], (context) => ({
  results: context.getStore(SearchStore).getResults()
}))
export default class SearchResultsComponent extends React.Component {

  static contextTypes = {
    getStore: React.PropTypes.func
  };

  constructor(props) {
    super(props);
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
        margin: '0 auto'
      },
      table: {
        height: '500px'
      }
    };
  }

  render() {
    if (this.props.results.length > 0) {
      let styles = this._getStyles();

      // Convert SearchStore results to Table rows
      let rows = this.props.results.map((result, idx) => {
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
        <Paper style={styles.content}>
          <Table selectable={false} fixedHeader={true}
            height={styles.table.height} ref="results" style={styles.table}>
            <TableHeader  adjustForCheckbox={false} displaySelectAll={false}
                enableSelectAll={false}>
              <TableRow>
                <TableHeaderColumn key={0} style={styles.column.summary}>
                  Match
                </TableHeaderColumn>
                <TableHeaderColumn key={1} style={styles.column.score}>
                  Overlap
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
    // Nothing to show
    return (
      <p/>
    );
  }
}
