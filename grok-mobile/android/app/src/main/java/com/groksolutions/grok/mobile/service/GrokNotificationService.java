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

package com.groksolutions.grok.mobile.service;

import com.groksolutions.grok.mobile.GrokApplication;
import com.groksolutions.grok.mobile.data.GrokDatabase;
import com.numenta.core.data.Metric;
import com.numenta.core.data.Notification;
import com.numenta.core.service.AuthenticationException;
import com.numenta.core.service.GrokClient;
import com.numenta.core.service.GrokException;
import com.numenta.core.service.GrokService;
import com.numenta.core.utils.Log;
import com.numenta.core.utils.NotificationUtils;

import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.content.res.Resources;
import android.os.AsyncTask;
import android.preference.PreferenceManager;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static com.groksolutions.grok.mobile.preference.PreferencesConstants.PREF_EMAIL_NOTIFICATIONS_ENABLE;
import static com.groksolutions.grok.mobile.preference.PreferencesConstants.PREF_NOTIFICATIONS_EMAIL;
import static com.groksolutions.grok.mobile.preference.PreferencesConstants.PREF_NOTIFICATIONS_FREQUENCY;
import static com.groksolutions.grok.mobile.preference.PreferencesConstants.PREF_NOTIFICATION_INITIALIZED;
import static com.groksolutions.grok.mobile.preference.PreferencesConstants.PREF_NOTIFICATION_NEED_UPDATE;
import static com.groksolutions.grok.mobile.preference.PreferencesConstants.PREF_PASSWORD;
import static com.groksolutions.grok.mobile.preference.PreferencesConstants.PREF_SERVER_URL;
import static com.numenta.core.preference.PreferencesConstants.PREF_NOTIFICATIONS_ENABLE;

/**
 * This service is managed by {@link com.numenta.core.service.GrokService} and is responsible for
 * creating notifications
 * based on the user's preferences.
 */
public class GrokNotificationService extends com.numenta.core.service.NotificationService {

    private static final String TAG = GrokNotificationService.class.getSimpleName();

    // Handles user preferences changes
    private final OnSharedPreferenceChangeListener _preferenceChangeListener
            = new OnSharedPreferenceChangeListener() {
        @Override
        public void onSharedPreferenceChanged(final SharedPreferences prefs,
                String key) {

            if (key.equals(PREF_PASSWORD)
                    || key.equals(PREF_EMAIL_NOTIFICATIONS_ENABLE)
                    || key.equals(PREF_NOTIFICATIONS_EMAIL)
                    || key.equals(PREF_NOTIFICATIONS_FREQUENCY)) {
                getService().getWorkerThreadPool().submit(new Runnable() {
                    @Override
                    public void run() {
                        // Update Notification settings
                        AsyncTask.execute(new Runnable() {
                            @Override
                            public void run() {
                                updateNotificationSettings(true);
                            }
                        });
                    }
                });
            }

            //if the server url changes, update the old server to remove email notifications
            if (key.equals(PREF_SERVER_URL)) {
                getService().getWorkerThreadPool().submit(new Runnable() {
                    @Override
                    public void run() {
                        AsyncTask.execute(new Runnable() {
                            @Override
                            public void run() {
                                //unsubscribe from old server
                                unsubscribeNotificationEmail();
                            }
                        });
                    }
                });
            }
        }
    };

    public GrokNotificationService(GrokService service) {
        super(service);
    }

    /**
     * Download and fire new notifications from the server
     */
    protected void synchronizeNotifications() throws GrokException, IOException {

        // Try to update notification settings if necessary
        updateNotificationSettings(false);

        final Resources res = GrokApplication.getContext().getResources();

        Metric metric;
        String description;
        float value;
        long localId;
        boolean newNotification = false;
        long notificationCount;
        ArrayList<String> acknowledge = new ArrayList<>();
        final GrokDatabase grokdb = GrokApplication.getDatabase();
        final SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(getService()
                .getApplicationContext());

        // Check if the notifications are enabled
        boolean enable = prefs.getBoolean(PREF_NOTIFICATIONS_ENABLE, true);
        boolean groupNotifications = res
                .getBoolean(com.numenta.core.R.bool.group_notifications);

        // Download pending notifications from the server
        List<Notification> pendingNotifications = getClient().getNotifications();
        if (pendingNotifications == null || pendingNotifications.isEmpty()) {
            return;
        }

        if (groupNotifications) {
            if (enable) {
                for (Notification notification : pendingNotifications) {
                    // Add Notification to local database
                    description = notification.getDescription();
                    if (description == null) {
                        metric = grokdb.getMetric(notification.getMetricId());
                        if (metric != null) {
                            value = grokdb.getMetricValue(metric.getId(),
                                    notification.getTimestamp());
                            description = NotificationUtils
                                    .formatNotificationDescription(metric, value,
                                            notification.getTimestamp());
                            notification.setDescription(description);
                        }
                    }

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
                    value = grokdb.getMetricValue(metric.getId(), notification.getTimestamp());
                    description = NotificationUtils.formatNotificationDescription(metric, value,
                            notification.getTimestamp());
                    notification.setDescription(description);

                    // Add Notification to local database
                    localId = grokdb.addNotification(notification.getNotificationId(),
                            notification.getMetricId(),
                            notification.getTimestamp(),
                            description);
                    if (localId != -1) {
                        // This is a new notification
                        newNotification = true;

                        // Fire OS notification
                        if (enable) {
                            notificationCount = grokdb.getUnreadNotificationCount();
                            NotificationUtils.createOSNotification(description,
                                    notification.getTimestamp(), (int) localId,
                                    notificationCount);

                        }
                        Log.i(TAG, "{TAG:ANDROID.NOTIFICATION.ADD} "
                                + notification.getTimestamp()
                                + " "
                                + notification.getMetricId()
                                + " - "
                                + description);

                    }
                } else {
                    Log.w(TAG, "Notification received for unknown metric: " + notification
                            .getMetricId());
                }
                acknowledge.add(notification.getNotificationId());
            }

            // Acknowledge notifications
            getClient().acknowledgeNotifications(
                    acknowledge.toArray(new String[acknowledge.size()]));
        }

        // Fire notification event
        if (newNotification) {
            fireNotificationChangedEvent(getService());
        }
    }

    /**
     * Unsubscribe notification email from old server
     */
    private void unsubscribeNotificationEmail() {

        try {
            // Try to connect to Grok
            NotificationSettings settings = getClient().getNotificationSettings();
            if (settings == null) {
                // do nothing
                return;
            }

            if (settings.getEmail() != null && !settings.getEmail().isEmpty()) {
                getClient().updateNotifications("", settings.getFrequency());
            }

            //disconnect from the old server
            disconnect();

        } catch (AuthenticationException e) {
            getService().fireAuthenticationFailedEvent();
        } catch (GrokException e) {
            Log.e(TAG, "Error unsubscribing from notification emails on old server", e);
        } catch (IOException e) {
            Log.e(TAG, "Unable to connect to Grok");
        }
    }

    /**
     * Update notification settings
     *
     * @param force Whether or not to force the update
     */
    private void updateNotificationSettings(boolean force) {

        try {
            SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(getService()
                    .getApplicationContext());

            // Check if we need to update the preferences
            boolean needUpdate = force || prefs.getBoolean(PREF_NOTIFICATION_NEED_UPDATE, false);

            // Check if we need to initialize the server notifications
            if (!prefs.getBoolean(PREF_NOTIFICATION_INITIALIZED, false)) {
                // Initialize notification settings with the values from the server or default
                // values
                NotificationSettings settings = getClient().getNotificationSettings();
                if (settings == null) {
                    // Use default values
                    settings = new NotificationSettings("", 3600);
                    // Force update when initializing
                    needUpdate = true;
                }

                Editor editor = prefs.edit();
                editor.putString(PREF_NOTIFICATIONS_EMAIL, settings.getEmail());
                editor.putString(PREF_NOTIFICATIONS_FREQUENCY,
                        Integer.toString(settings.getFrequency()));

                // Mark as initialized
                editor.putBoolean(PREF_NOTIFICATION_INITIALIZED, true);
                editor.apply();
            }

            // Check if we need to update the preferences
            prefs.edit().putBoolean(PREF_NOTIFICATION_NEED_UPDATE, needUpdate).apply();
            if (needUpdate) {
                boolean emailEnabled = prefs.getBoolean(PREF_EMAIL_NOTIFICATIONS_ENABLE, true);
                String email = emailEnabled ? prefs.getString(PREF_NOTIFICATIONS_EMAIL, "") : "";
                // Validate email before updating
                if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                    // Clear invalid email address
                    email = "";
                    prefs.edit().remove(PREF_NOTIFICATIONS_EMAIL).apply();
                }
                int freq = Integer.valueOf(prefs.getString(PREF_NOTIFICATIONS_FREQUENCY, "3600"));
                getClient().updateNotifications(email, freq);
                // Successfully updated the preferences
                prefs.edit().putBoolean(PREF_NOTIFICATION_NEED_UPDATE, false).apply();
            }
        } catch (AuthenticationException e) {
            getService().fireAuthenticationFailedEvent();
        } catch (GrokException e) {
            Log.e(TAG, "Error updating notification settings", e);
        } catch (IOException e) {
            Log.e(TAG, "Unable to connect to Grok");
        }
    }

    /**
     * Returns the API client connection
     */
    @Override
    public GrokClientImpl getClient() throws IOException, GrokException {
        return (GrokClientImpl)super.getClient();
    }

    /**
     * Start the notification service.
     * <p>
     * Should only be called by {@link com.numenta.core.service.GrokService}
     * </p>
     */
    protected void start() {
        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(getService()
                .getApplicationContext());
        prefs.registerOnSharedPreferenceChangeListener(_preferenceChangeListener);
    }

    /**
     * Stop the notification service.
     * <p>
     * Should only be called by {@link com.numenta.core.service.GrokService}
     * </p>
     */
    protected void stop() {
        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(getService()
                .getApplicationContext());
        prefs.unregisterOnSharedPreferenceChangeListener(_preferenceChangeListener);
    }

}
