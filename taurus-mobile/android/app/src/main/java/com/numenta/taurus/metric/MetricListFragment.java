/*
 * Numenta Platform for Intelligent Computing (NuPIC)
 * Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 *
 */

package com.numenta.taurus.metric;

import com.numenta.core.data.Metric;
import com.numenta.core.ui.chart.LineChartView;
import com.numenta.core.utils.DataUtils;
import com.numenta.taurus.R;
import com.numenta.taurus.TaurusBaseActivity;
import com.numenta.taurus.instance.InstanceAnomalyChartData;
import com.numenta.taurus.twitter.TwitterDetailActivity;

import android.app.Activity;
import android.app.ListFragment;
import android.content.Intent;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.ListView;

import java.util.Date;
import java.util.List;

/**
 * This Fragment is responsible for displaying the metric list.
 */
public class MetricListFragment extends ListFragment {

    MetricListAdapter _adapter;

    private Date _endDate;

    private boolean _collapsed;

    private InstanceAnomalyChartData _chartData;

    /**
     * {@inheritDoc}
     *
     *
     * <p><b>Event handler:</b></p>
     * <li>When the user clicks on the "Twitter Volume" metric open the
     * {@link com.numenta.taurus.twitter.TwitterDetailActivity} </li>
     */
    @Override
    public void onListItemClick(ListView l, View v, int position, long id) {
        MetricAnomalyChartData item = _adapter.getItem(position);

        // Open "Twitter Detail" activity if the user clicks on the "Twitter Volume" metric
        Metric metric = item.getMetric();
        if (MetricType.valueOf(metric) == MetricType.TwitterVolume) {
            // Check for network connection before opening twitter detail screen
            Activity activity = getActivity();
            if (activity instanceof TaurusBaseActivity &&
                    !((TaurusBaseActivity) activity).checkNetworkConnection()) {
                return;
            }

            Intent twitterIntent = new Intent(getActivity(), TwitterDetailActivity.class);
            twitterIntent.setFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION);
            twitterIntent.putExtra(TwitterDetailActivity.METRIC_ID_ARG, metric.getId());
            twitterIntent
                    .putExtra(TwitterDetailActivity.TIMESTAMP_ARG, item.getEndDate().getTime());
            LineChartView lineChart = (LineChartView) v.findViewById(R.id.line_chart_view);
            int selection = lineChart.getSelection();
            if (selection != -1) {
                long selectedTimestamp = item.getStartTimestamp()
                        + DataUtils.METRIC_DATA_INTERVAL * selection;
                twitterIntent.putExtra(TwitterDetailActivity.SELECTED_TIMESTAMP_ARG,
                        selectedTimestamp);
                // Clear selection
                lineChart.setSelection(-1);
            }
            startActivity(twitterIntent);
        }
    }

    @Override
    public void onActivityCreated(Bundle savedInstanceState) {
        super.onActivityCreated(savedInstanceState);
        // Create metric list adapter and refresh its contents from the database
        _adapter = new MetricListAdapter(getActivity());
        _adapter.setEndDate(_endDate);
        ListView lv = getListView();
        Resources r = getResources();
        float height = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 1,
                r.getDisplayMetrics());
        lv.setDivider(new ColorDrawable(Color.WHITE));
        lv.setDividerHeight((int) height);
        lv.setFooterDividersEnabled(true);
        setListAdapter(_adapter);
        updateMetricList();
    }

    /**
     * Refresh Metric List with contents from the database
     */
    public void updateMetricList() {
        if (_adapter != null && _chartData != null) {
            List<Metric> metrics = _chartData.getMetrics();
            if (metrics != null) {
                _adapter.clear();
                if (!metrics.isEmpty()) {
                    MetricAnomalyChartData values[] = new MetricAnomalyChartData[metrics.size()];
                    for (int i = 0; i < metrics.size(); i++) {
                        Metric metric = metrics.get(i);
                        values[i] = new MetricAnomalyChartData(metric,
                                _adapter.getEndDate().getTime());
                    }
                    _adapter.addAll(values);
                }
            }
        }
    }

    public void setEndDate(Date endDate) {
        this._endDate = endDate;
        if (_adapter != null) {
            _adapter.setEndDate(endDate);
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        if (_adapter != null) {
            _adapter.stop();
            _adapter.notifyDataSetChanged();
        }
    }

    /**
     * Set whether or not to collapse the time for this view. If {@code true} the view will
     * collapse the the time based on the current market calendar.
     *
     * @see com.numenta.taurus.TaurusApplication#getMarketCalendar()
     */
    public void setCollapsed(boolean collapsed) {
        if (_collapsed != collapsed) {
            _collapsed = collapsed;
            if (_adapter != null) {
                _adapter.setCollapsed(collapsed);
            }
        }
    }

    public void setChartData(InstanceAnomalyChartData chartData) {
        _chartData = chartData;
        if (_chartData != null) {
            if (_adapter.isEmpty()) {
                setEndDate(_chartData.getEndDate());
                updateMetricList();
            } else {
                setEndDate(_chartData.getEndDate());
            }
        }
    }

    public void setRefreshScale(boolean refresh) {
        if (_adapter != null) {
            _adapter.setRefreshScale(refresh);
        }
    }
}
