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

package com.numenta.taurus.instance;

import com.numenta.core.utils.DataUtils;
import com.numenta.core.utils.Log;
import com.numenta.core.utils.Pair;
import com.numenta.taurus.R;
import com.numenta.taurus.TaurusApplication;
import com.numenta.taurus.chart.TimeSliderView;
import com.numenta.taurus.data.MarketCalendar;
import com.numenta.taurus.metric.MetricListFragment;

import android.app.Fragment;
import android.os.AsyncTask;
import android.os.Bundle;
import android.view.GestureDetector;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CheckBox;
import android.widget.CompoundButton;

import java.util.Date;
import java.util.List;

public class InstanceDetailPageFragment extends Fragment {

    private InstanceAnomalyChartData _chartData;

    private AsyncTask<InstanceAnomalyChartData, Void, Boolean> _instanceLoadTask;

    private MetricListFragment _metricListFrag;

    private InstanceAnomalyChartFragment _instanceChartFrag;

    private TimeSliderView _timeView;

    private CheckBox _marketHoursCheckbox;

    private boolean _scrolling;

    /**
     * Handles date/time scrolling
     */
    final class GestureListener implements GestureDetector.OnGestureListener {

        private final View _view;

        long _initialTimestamp;

        private int _pixelsBerBar;

        public GestureListener(View view) {
            this._view = view;
        }

        @Override
        public boolean onDown(MotionEvent e) {
            _pixelsBerBar = _view.getMeasuredWidth() / TaurusApplication.getTotalBarsOnChart();
            Date endDate = _chartData.getEndDate();
            _initialTimestamp = endDate == null ? TaurusApplication.getDatabase().getLastTimestamp()
                    : endDate.getTime();
            _scrolling = false;
            // Do not scale the chart while scrolling
            _metricListFrag.setRefreshScale(false);
            return false;
        }

        @Override
        public void onShowPress(MotionEvent e) {

        }

        @Override
        public boolean onSingleTapUp(MotionEvent e) {
            return false;
        }

        @Override
        public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
            int distance =  Math.round(distanceX / _pixelsBerBar);
            if (_chartData != null && _chartData.hasData() && distance != 0) {
                // Calculate valid scroll range
                long maxDate = _chartData.getLastDbTimestamp();
                long minDate = maxDate -
                        (TaurusApplication.getNumberOfDaysToSync() - 1) * DataUtils.MILLIS_PER_DAY;

                List<Pair<Long, Float>> bars = _chartData.getData();
                long time;
                if (distance < 0) {
                    // If scrolling backwards, just get the date from the new bar position
                    int pos = Math.max(0, bars.size() + distance - 1);
                    time = bars.get(pos).first;

                    // Check if collapsing market hours
                    if (_marketHoursCheckbox.isChecked()) {
                        MarketCalendar marketHours = TaurusApplication.getMarketCalendar();
                        if (!marketHours.isOpen(time)) {
                            // Find previous open hour
                            List<Pair<Long, Long>> closed = TaurusApplication.getMarketCalendar()
                                    .getClosedHoursForPeriod(time, time);
                            if (closed != null && !closed.isEmpty()) {
                                time = closed.get(0).first;
                            }
                        }
                    }
                    if (time < minDate) {
                        time = minDate;
                    }
                } else {
                    // If scrolling forward, calculate new date from the last bar
                    time = bars.get(bars.size() - 1).first
                            + distance * _chartData.getAggregation().milliseconds();

                    // Check if collapsing market hours
                    if (_marketHoursCheckbox.isChecked()) {
                        MarketCalendar marketHours = TaurusApplication.getMarketCalendar();
                        if (!marketHours.isOpen(time)) {
                            // Find next open hour
                            List<Pair<Long, Long>> closed = TaurusApplication.getMarketCalendar()
                                    .getClosedHoursForPeriod(time, time);
                            if (closed != null && !closed.isEmpty()) {
                                time = closed.get(0).second;
                            }
                        }
                    }
                    // Make sure to not scroll past the end of the data
                    if (time > maxDate) {
                        time = maxDate;
                    }
                }
                _chartData.setEndDate(time);
                reloadChartData();
            }
            _scrolling = distance != 0;
            return _scrolling;
        }


        @Override
        public void onLongPress(MotionEvent e) {

        }

        @Override
        public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
            return false;
        }
    }

    final class TouchListener implements View.OnTouchListener {

        // Attach gesture detector to values chart handling scrolling.
        final GestureDetector _gestureDetector;

        // The current view
        final View _view;

        public TouchListener(View view) {
            _view = view;
            _gestureDetector = new GestureDetector(getActivity(),
                    new GestureListener(_view));
        }

        @Override
        public boolean onTouch(View v, MotionEvent event) {
            switch (event.getAction()) {
                case MotionEvent.ACTION_UP:
                    // Fall through
                case MotionEvent.ACTION_CANCEL:
                    // Done scrolling, refresh the chart scale
                    // Add update request to message queue otherwise the ListView may loose focus
                    // and MetricListFragment#onListItemClick will not be called. See TAUR-685
                    v.post(new Runnable() {
                        @Override
                        public void run() {
                            _metricListFrag.setRefreshScale(true);
                        }
                    });
                    break;
                default:
                    break;
            }

            // Detect scroll gestures on the metric detail chart
            return _gestureDetector.onTouchEvent(event) || _scrolling;
        }
    }

    public void setRowData(InstanceAnomalyChartData row) {
        if (_chartData != null && _chartData.equals(row)) {
            return;
        }
        if (_instanceLoadTask != null) {
            _instanceLoadTask.cancel(true);
            _instanceLoadTask = null;
        }

        _chartData = row;
        reloadChartData();
    }

    void updateServerHeader() {
        if (_chartData == null) {
            return;
        }
        if (_instanceChartFrag == null) {
            return;
        }

        // Update server header
        _instanceChartFrag.setChartData(_chartData);

        // Update time slider
        Date endDate = _chartData.getEndDate();
        long endTime;
        if (endDate == null) {
            endTime = System.currentTimeMillis();
        } else {
            endTime = endDate.getTime();
        }
        _timeView.setAggregation(_chartData.getAggregation());
        _timeView.setEndDate(endTime);
    }

    public void updateRowData() {
        if (_chartData == null) {
            return;
        }
        // Update Metric List
        if (_metricListFrag == null) {
            return;
        }
        _metricListFrag.setChartData(_chartData);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_instance_detail_page, container, false);

        _metricListFrag = (MetricListFragment) getFragmentManager()
                .findFragmentById(R.id.metric_list);
        View metricListView = _metricListFrag.getListView();
        metricListView.setOnTouchListener(new TouchListener(metricListView));

        View instanceChartView = view.findViewById(R.id.instance_anomaly_chart);
        instanceChartView.setOnTouchListener(new TouchListener(instanceChartView));
        _instanceChartFrag = (InstanceAnomalyChartFragment) instanceChartView.getTag();

        _timeView = (TimeSliderView) view.findViewById(R.id.time_slider);
        _timeView.setCollapsed(false);

        _marketHoursCheckbox = (CheckBox) view.findViewById(R.id.market_hours_checkbox);
        _marketHoursCheckbox
                .setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        _timeView.setCollapsed(isChecked);
                        _instanceChartFrag.setCollapsed(isChecked);
                        _metricListFrag.setCollapsed(isChecked);
                    }
                });

        return view;
    }

    private void reloadChartData() {
        if (_instanceLoadTask != null) {
            _instanceLoadTask.cancel(true);
            _instanceLoadTask = null;
        }

        if (_chartData != null) {
            _instanceLoadTask = new AsyncTask<InstanceAnomalyChartData, Void, Boolean>() {
                @Override
                protected Boolean doInBackground(InstanceAnomalyChartData... params) {
                    InstanceAnomalyChartData chartData = params[0];
                    return !isCancelled() && chartData != null && chartData.load();
                }

                @Override
                protected void onPostExecute(Boolean update) {
                    _instanceLoadTask = null;
                    if (update) {
                        updateServerHeader();
                        updateRowData();
                    }
                }
            }.executeOnExecutor(TaurusApplication.getWorkerThreadPool(), _chartData);
        }
    }

    /*
     * (non-Javadoc)
     * @see android.support.v4.app.Fragment#onStop()
     */
    @Override
    public void onStop() {
        super.onStop();
        if (_instanceLoadTask != null) {
            _instanceLoadTask.cancel(true);
            _instanceLoadTask = null;
        }
    }


    /**
     * Get the market closed hours enclosing the given time.
     *
     * @param time The time to check
     * @return The start and close time in milliseconds. It will include the  beginning of the
     * closed period as well as the end of the closed period. Or null if the market is open
     */
    Pair<Long, Long> getClosedHoursForTime(long time) {
        if (!TaurusApplication.getMarketCalendar().isOpen(time)) {
            List<Pair<Long, Long>> hours = TaurusApplication.getMarketCalendar()
                    .getClosedHoursForPeriod(time, time);
            if (hours != null && !hours.isEmpty()) {
                // Assume we only get one result
                return hours.get(0);
            }
        }
        return null;
    }
}
