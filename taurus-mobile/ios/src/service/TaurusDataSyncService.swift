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

import Foundation


public class TaurusDataSyncService: DataSyncService{
    
    /** loads  instance data
    */
    override func loadAllData() {
        
            let db = TaurusApplication.getTaurusDatabase()
            var from = db.getLastTimestamp()
            let now = Int64(NSDate().timeIntervalSince1970*1000)
        
        // The server updates the instance data table into hourly buckets as the models process
        // data. This may leave the last hour with outdated values when the server updates the
        // instance data table after we start loading the new hourly bucket.
        // To make sure the last hour bucket is updated we should get data since last update up to
        // now and on when the time is above a certain threshold (15 minutes) also download the
        // previous hour once.
        
/*        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(context);
        
        // Check if we need to update the previous hour
        long previousHourThreshold = prefs.getLong(PREF_PREVIOUS_HOUR_THRESHOLD, now);
        if (now >= previousHourThreshold) {
            // Download the previous hour
            from -= DataUtils.MILLIS_PER_HOUR;
            
            // Set threshold time to minute 15 of next hour
            Calendar calendar = Calendar.getInstance();
            calendar.setTimeInMillis(now);
            calendar.add(Calendar.HOUR, 1);
            calendar.set(Calendar.MINUTE, 15);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            prefs.edit().putLong(PREF_PREVIOUS_HOUR_THRESHOLD, calendar.getTimeInMillis()).apply();
        }
        */
        
        
        let oldestTimestamp = DataUtils.floorTo60Minutes (  now - TaurusApplication.getNumberOfDaysToSync() * DataUtils.MILLIS_PER_DAY )
        
        // Check if we need to catch up and download old data
        if ( db.firstTimestamp > oldestTimestamp){
            from = oldestTimestamp
        }
        
        // Don't fetch data olders than NUMBER_OF_DAYS_TO_SYNC
        
        from = max ( from, oldestTimestamp)
        
        getClient().getAllInstanceData( NSDate(timeIntervalSinceReferenceDate : Double(from)/1000.0),  to: NSDate(timeIntervalSinceReferenceDate : Double(now)/1000.0),  ascending : false, callback:{
            (instance: InstanceData) in

                // FIXME Batch these up and do the database work on a different thread?
                db.addInstanceDataBatch( [instance] )
                return nil
            }
            
        )
    }
    

    override func loadAllMetrics() -> Int32 {
        return super.loadAllMetrics()
    }
    
    override func loadAllAnnotations() {
        // do nothing<#code#>
    }
    
    
    func getClient()->TaurusClient {
        return client as! TaurusClient;
    }
}