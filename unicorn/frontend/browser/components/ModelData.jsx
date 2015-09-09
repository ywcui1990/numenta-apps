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

'use strict';

import connectToStores from 'fluxible-addons-react/connectToStores';
import React from 'react';
import ModelDataStore from '../stores/ModelDataStore';
import Chart from '../components/Chart';

@connectToStores([ModelDataStore], (context) => ({
  modelStore: context.getStore(ModelDataStore)
}))
export default class ModelData extends React.Component {

  static propTypes = {
    modelId: React.PropTypes.string.isRequired
  };

  constructor(props, context) {
    super(props, context);
    let store = this.props.modelStore;
    this.state = {
      data : store.getData(this.props.modelId)
    };
  }

  componentWillReceiveProps(nextProps) {
    let store = this.props.modelStore;
    this.setState({
      model: store.getData(nextProps.modelId)
    });
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.modelId !== this.props.modelId;
  }

  render() {
    let options = {
      labels: ['Time', 'Value'],
      showRangeSelector: true
    };
    let data = Array.apply(0, Array(500)).map((x, y) => {
      return [y, Math.random()];
    });

    return (
      <Chart data={data} options={options} ref="chart"/>
    );
  }
};
