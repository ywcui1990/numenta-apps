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

package com.numenta.taurus.data;

import com.numenta.core.utils.DataUtils;

import java.io.Serializable;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Helper class representing one "tweet" record
 */
public class Tweet implements Serializable {

    private String _id;

    private long _created;

    private long _aggregated;

    private String _userId;

    private String _userName;

    private String _text;

    // Regex used to filter duplicate tweets. The current logic removes optional "RT " from the
    // beginning of the text and optional URL from the end of the text.
    //
    // For example:
    //   RT @Company: Watch it again:  the story of John Doe.\nhttps://t.co/yWd0iW3GdJ
    //   RT @Company: Watch it again:  the story of John Doe.\nhttps://t.co/sdSADsSDfs
    //   @Company: Watch it again:  the story of John Doe.\nhttps://t.co/yWd0iW3GdJ
    //   @Company: Watch it again:  the story of John Doe.\nhttps://t.co/yWd0Ed0WAC
    //
    // All translate to:
    //   @Company: Watch it again:  the story of John Doe.
    //
    private static final Pattern TWEET_TEXT_FILTER = Pattern.compile("(?:^RT\\s+)?(.+?)(?:\\s+https?:\\/\\/\\S+\\s*)*$");

    // FIXME: Optimize storage for these Runtime values.
    private int _aggregatedCount;

    private int _retweetCount;

    private int _retweetTotal;

    public Tweet(String id, long aggregated, long created, String userId, String userName,
            String text, int retweetTotal) {
        _text = text;
        _userName = userName;
        _userId = userId;
        _created = created;
        // Make sure aggregated values are rounded to closest 5 minute interval
        _aggregated = DataUtils.floorTo5minutes(aggregated);
        _id = id;
        _retweetTotal = retweetTotal;
    }

    /**
     * Return twitter text without retweets (RT) and other decorators
     */
    public String getCanonicalText() {
        Matcher result = TWEET_TEXT_FILTER.matcher(_text);
        if (result.matches() && result.groupCount() == 1) {
            return result.group(1);
        }
        return _text;
    }

    public String getId() {
        return _id;
    }

    public long getAggregated() {
        return _aggregated;
    }

    public long getCreated() {
        return _created;
    }

    public String getUserId() {
        return _userId;
    }

    public String getUserName() {
        return _userName;
    }

    public String getText() {
        return _text;
    }

    public void setText(String text) {
        _text = text;
    }

    public int getAggregatedCount() {
        return _aggregatedCount;
    }

    public void setAggregatedCount(int aggregatedCount) {
        _aggregatedCount = aggregatedCount;
    }

    public int getRetweetCount() {
        return _retweetCount;
    }

    public void setRetweetCount(int count) {
        _retweetCount = count;
    }

    public int getRetweetTotal() {
        return _retweetTotal;
    }
}
