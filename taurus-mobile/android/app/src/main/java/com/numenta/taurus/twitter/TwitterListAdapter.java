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

package com.numenta.taurus.twitter;

import com.numenta.taurus.R;
import com.numenta.taurus.data.Tweet;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;

public class TwitterListAdapter extends ArrayAdapter<Tweet> {

    static class ViewHolder {

        View groupHeader;
        TextView date;
        TextView tweetCount;

        View tweetHeader;
        TextView user;
        TextView retweetTotal;
        ImageView _retweetIcon;
        TextView retweetCount;

        TextView tweetText;
    }
    private final LayoutInflater _inflater;

    public TwitterListAdapter(Context context) {
        super(context, R.layout.twitter_item);
        _inflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {

        View view;
        if (convertView == null) {
            view = _inflater.inflate(R.layout.twitter_item, parent, false);

            // Cache views
            ViewHolder holder = new ViewHolder();
            holder.groupHeader = view.findViewById(R.id.group_header);
            holder.date = (TextView) holder.groupHeader.findViewById(R.id.date);
            holder.tweetCount = (TextView) holder.groupHeader.findViewById(R.id.tweet_count);

            holder.tweetHeader = view.findViewById(R.id.tweet_header);
            holder.user = (TextView) holder.tweetHeader.findViewById(R.id.user);
            holder.retweetTotal = (TextView) holder.tweetHeader.findViewById(R.id.retweet_total);
            holder.retweetCount = (TextView) holder.tweetHeader.findViewById(R.id.retweet_count);
            holder._retweetIcon = (ImageView) holder.tweetHeader.findViewById(R.id.retweet_icon);

            holder.tweetText = (TextView) view.findViewById(R.id.tweet_text);

            view.setTag(holder);
        } else {
            view = convertView;
        }
        // Bind view
        if (parent.isShown()) {
            bindView(view, position);
        }

        return view;
    }

    private void updateGroupHeader(ViewHolder holder, Tweet tweet) {
        // Make sure it is visible
        if (holder.groupHeader.getVisibility() != View.VISIBLE) {
            holder.groupHeader.setVisibility(View.VISIBLE);
        }

        holder.date.setText(String.format("%1$tl:%1$tM%1$tp", tweet.getAggregated()));
        holder.tweetCount.setText(Integer.toString(tweet.getAggregatedCount()));
    }

    private void bindView(View view, int position) {

        ViewHolder holder = (ViewHolder) view.getTag();
        Tweet tweet = getItem(position);

        // Update tweet headers
        if (position == 0) {
            // First tweet
            updateGroupHeader(holder, tweet);
        } else {
            // Only show if crossing the bucket boundary
            Tweet prev = getItem(position - 1);
            if (prev.getAggregated() != tweet.getAggregated()) {
                updateGroupHeader(holder, tweet);
            } else {
                // Within the same bucket. Hide header
                holder.groupHeader.setVisibility(View.GONE);
            }
        }
        updateTweetHeader(holder, tweet);

        // Update tweet text
        holder.tweetText.setText(tweet.getText());
    }

    private void updateTweetHeader(ViewHolder holder, Tweet tweet) {
        // Make sure it is visible
        if (holder.tweetHeader.getVisibility() != View.VISIBLE) {
            holder.tweetHeader.setVisibility(View.VISIBLE);
        }
        holder.user.setText("@" + tweet.getUserName());
        int retweetCount = tweet.getRetweetCount();
        int retweetTotal = tweet.getRetweetTotal();

        holder.retweetCount.setText(retweetCount > 1 ? Integer.toString(retweetCount) : "");
        holder.retweetTotal.setText(retweetTotal > 1 ? Integer.toString(retweetTotal) : "");
        if (retweetCount > 1 || retweetTotal > 1) {
            holder._retweetIcon.setVisibility(View.VISIBLE);
        } else {
            holder._retweetIcon.setVisibility(View.GONE);
        }
    }

    /**
     * Returns the position of the item with the maximum aggregation count whose timestamp is
     * within the given range based on the timestamp value and a tolerance value.
     * The time range to search for the max value is [timestamp-tolerance, timestamp+tolerance].
     *
     * @param timestamp The timestamp to check (unix time)
     * @param tolerance The extra tolerance in milliseconds
     * @return The position of the first item or -1 if not found
     */
    public int getPositionByTimestamp(long timestamp, long tolerance) {
        int count = getCount();
        Tweet item;
        long lowerBound = timestamp - tolerance;
        long upperBound = timestamp + tolerance;
        int pos = -1;
        int maxValue = -1;
        for (int i = 0; i < count; i++) {
            item = getItem(i);
            if (item != null && item.getAggregated() >= lowerBound
                    && item.getAggregated() <= upperBound) {
                // Look for max value
                if (item.getAggregatedCount() > maxValue) {
                    maxValue = item.getAggregatedCount();
                    pos = i;
                }
            }
        }
        return pos;
    }
}
