/*
 * Numenta Platform for Intelligent Computing (NuPIC)
 * Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero Public License for more details.
 *
 * You should have received a copy of the GNU Affero Public License
 * along with this program.  If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 *
 */

package com.numenta.core.service;

import com.numenta.core.R;
import com.numenta.core.app.GrokApplication;
import com.numenta.core.data.CoreDatabase;
import com.numenta.core.data.Metric;
import com.numenta.core.data.Notification;
import com.numenta.core.utils.Log;
import com.numenta.core.utils.NotificationUtils;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Resources;
import android.preference.PreferenceManager;
import android.support.v4.content.LocalBroadcastManager;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static com.numenta.core.preference.PreferencesConstants.PREF_NOTIFICATIONS_ENABLE;

/**
 * This service is managed by {@link GrokService} and is responsible for creating notifications
 * based on the user's preferences.
 */
public class NotificationService {

    /**
     * This Event is fired on new notifications
     */
    public static final String NOTIFICATION_CHANGED_EVENT
            = "com.numenta.core.data.NotificationChangedEvent";

    private static final String TAG = NotificationService.class.getSimpleName();

    private final GrokService _service;

    // Grok API Helper
    private GrokClient _grokCli;

    public NotificationService(GrokService service) {
        this._service = service;
    }

    /**
     * Fire {@link #NOTIFICATION_CHANGED_EVENT}
     */
    protected static void fireNotificationChangedEvent(Context context) {
        Log.i(TAG, "{TAG:ANDROID.NOTIFICATION.FIRE} Notification changed");
        Intent intent = new Intent(NOTIFICATION_CHANGED_EVENT);
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent);
    }

    /**
     * Delete all notifications and Broadcast {@link #NOTIFICATION_CHANGED_EVENT} if any
     * notification
     * was deleted
     *
     * @return number of notifications deleted
     */
    public static long deleteAllNotifications() {
        long deleted = GrokApplication.getDatabase().deleteAllNotifications();
        if (deleted > 0) {
            fireNotificationChangedEvent(GrokApplication.getContext());
        }
        return deleted;
    }

    /**
     * Delete the notification by id.
     *
     * @param notificationId The notification id to delete
     * @return number of notifications deleted (1 or 0)
     */
    public static long deleteNotification(int notificationId) {
        long deleted = GrokApplication.getDatabase().deleteNotification(notificationId);
        if (deleted > 0) {
            fireNotificationChangedEvent(GrokApplication.getContext());
        }
        return deleted;
    }

    /**
     * Download and fire new notifications from the server
     */
    protected void synchronizeNotifications() throws GrokException, IOException {
        final Resources res = GrokApplication.getContext().getResources();

        // Try to connect to Grok
        if (_grokCli == null) {
            _grokCli = _service.connectToServer();
        }
        if (_grokCli == null) {
            throw new IOException("Unable to connect to server");
        }

        Metric metric;
        long localId;
        boolean newNotification = false;
        long notificationCount;
        ArrayList<String> acknowledge = new ArrayList<String>();
        final CoreDatabase grokdb = GrokApplication.getDatabase();
        final SharedPreferences prefs =
                PreferenceManager.getDefaultSharedPreferences(_service.getApplicationContext());

        // Check if the notifications are enabled
        boolean enable = prefs.getBoolean(PREF_NOTIFICATIONS_ENABLE, true);
        boolean groupNotifications = res.getBoolean(R.bool.group_notifications);

        // Download pending notifications from the server
        List<Notification> pendingNotifications = _grokCli.getNotifications();
        if (pendingNotifications == null || pendingNotifications.isEmpty()) {
            return;
        }

        if (groupNotifications) {
            if (enable) {
                for (Notification notification : pendingNotifications) {
                    // Add Notification to local database
                    localId = grokdb.addNotification(notification.getNotificationId(),
                            notification.getMetricId(),
                            notification.getTimestamp(),
                            notification.getDescription());
                    if (localId != -1) {
                        newNotification = true;
                    }
                }
                NotificationUtils.createGroupedOsNotification(pendingNotifications);
            }
        } else {
            for (Notification notification : pendingNotifications) {
                // Update notification description;
                metric = grokdb.getMetric(notification.getMetricId());
                if (metric != null) {
                    // Add Notification to local database
                    localId = grokdb.addNotification(notification.getNotificationId(),
                            notification.getMetricId(),
                            notification.getTimestamp(),
                            notification.getDescription());
                    if (localId != -1) {
                        // This is a new notification
                        newNotification = true;

                        // Fire OS notification
                        if (enable) {
                            notificationCount = grokdb.getUnreadNotificationCount();
                            NotificationUtils.createOSNotification(notification.getDescription(),
                                    notification.getTimestamp(), (int) localId, notificationCount);
                        }
                        Log.i(TAG, "{TAG:ANDROID.NOTIFICATION.ADD} "
                                + notification.getTimestamp()
                                + " "
                                + notification.getMetricId()
                                + " - "
                                + notification.getDescription());

                    }
                } else {
                    Log.w(TAG, "Notification received for unknown metric: " + notification
                            .getMetricId());
                }
                acknowledge.add(notification.getNotificationId());
            }

            // Acknowledge notifications
            _grokCli.acknowledgeNotifications(acknowledge.toArray(new String[acknowledge.size()]));
        }

        // Fire notification event
        if (newNotification) {
            fireNotificationChangedEvent(_service);
        }
    }

    /**
     * Return the background service object
     */
    public GrokService getService() {
        return _service;
    }

    /**
     * Returns the API client connection
     */
    public GrokClient getClient() throws IOException, GrokException {
        if (_grokCli == null) {
            _grokCli = _service.connectToServer();
        }
        if (_grokCli == null) {
            throw new IOException("Unable to connect to server");
        }
        return _grokCli;
    }

    /**
     * Close Client API connection forcing the service to reopen a new connection upon request
     */
    public void disconnect() {
        _grokCli = null;
    }

    /**
     * Start the notification service.
     * <p>
     * Should only be called by {@link GrokService}
     * </p>
     */
    protected void start() {
    }

    /**
     * Stop the notification service.
     * <p>
     * Should only be called by {@link GrokService}
     * </p>
     */
    protected void stop() {
    }
}
