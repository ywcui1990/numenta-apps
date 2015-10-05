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
 
  /** dictionary wrapper to allow passing of dictionarys by reference instead of value
  */
  class InstanceCacheEntry{
    var data = Dictionary<Int64, AnomalyValue>()
  }
  
class TaurusDatabase: CoreDatabaseImpl,TaurusDBProtocol {
    let TAURUS_DATABASE_VERSION: Int32 = 32
    var firstTimestamp : Int64 = 0
    var lastUpdated: Int64 = 0
    
    var  instanceDataCache = [String :  InstanceCacheEntry ] ()
  
    /**
        - parameter dataFactory: used to creat DB objects
    */
    override init(dataFactory : CoreDataFactory){
        super.init(dataFactory : dataFactory)
        
        // Load instance data
        // FIXME Do we want to be lazy about this? Loading the 6 or 7 rows when required is probably a heck of a lot faster
     //   dispatch_async(dispatch_get_global_queue( QOS_CLASS_USER_INITIATED, 0)) {

            self.loadAllInstanceData()
   //     }
    }
    
    /** loads all the instance data
    */
    func loadAllInstanceData(){
        var to:Int64 = Int64(NSDate().timeIntervalSince1970*1000)
        var from =  to-DataUtils.SECONDS_IN_DAY*1000
      
        //lastTimestamp = 0
        var oldestTimeStamp = to
        for ( var i = 0; i < TaurusApplication.getNumberofDaysToSync(); i++){
            let whereClause:String? = nil // "timestamp >= ? AND timestamp <= ?"
            let columns = ["instance_id", "timestamp", "anomaly_score"/*, "aggregation"*/, "metric_mask"]
            let cursor = sqlHelper.query(InstanceData.TABLE_NAME, columns: columns,
            whereClause: whereClause, whereArgs: [NSNumber(longLong:from), NSNumber(longLong:to)], sortBy: nil)
        
     
            if (cursor == nil){
             //   print (sqlHelper.database.lastError())
            }
            
            let instaceIdColumn = cursor.columnIndexForName("instance_id")
            let timestampColumn = cursor.columnIndexForName("timestamp")
            let anomalyColumn = cursor.columnIndexForName("anomaly_score")
            let metricMaskColumn = cursor.columnIndexForName("metric_mask")
            while cursor.next(){
            //    let object = dataFactory.createInstanceData(cursor)
                
              //  let taurusInstance =  object as! TaurusInstanceData
                
                let instanceId = cursor.stringForColumnIndex(instaceIdColumn)
                let  timestamp = cursor.longLongIntForColumnIndex(timestampColumn)
                let anomalyScore = Float(cursor.doubleForColumnIndex(anomalyColumn))

                
                
               
                var metricMask = MetricType()
                metricMask.rawValue = Int(cursor.intForColumnIndex(metricMaskColumn))
                
              
                
                let anomalyValue = AnomalyValue( anomaly: anomalyScore, metricMask: metricMask)
                var cacheEntry = instanceDataCache[instanceId]
                if ( cacheEntry == nil){
                    cacheEntry = InstanceCacheEntry()
                    instanceDataCache[instanceId] = cacheEntry
                }
                
                cacheEntry!.data[timestamp] =  anomalyValue
                
                
             //   let ts = NSDate(timeIntervalSince1970: Double(object.timestamp)/1000.0)
             //   print (ts)
               // var value = getInstanceCacheValues (instanceData.instanceId)
                if (timestamp > lastTimestamp){
                    lastTimestamp = timestamp
                }
                
                if (timestamp<oldestTimeStamp){
                    oldestTimeStamp = timestamp
                }
     
            }
            // Get previous day
            from -= DataUtils.SECONDS_IN_DAY*1000
            to -= DataUtils.SECONDS_IN_DAY*1000
        }
  
        self.firstTimestamp = oldestTimeStamp
    }
    
    /** get Ticker symbol for the given instance ID
        - paramter intanceId: id to find symbol of
        - returns: ticker symbol, nil if the instanceId couldn't be found
    */
    func getTickerSymbol( instanceId: String)->String?{
        var metrics = getMetricsByInstanceId(instanceId)
        var symbol: String? = nil
        if (metrics?.isEmpty == false ) {
            // FIXME: TAUR-817: Create taurus specific instance table
            symbol = metrics[0].getUserInfo("symbol");
        }
        return symbol;
    }

    /** update instance data
        -parameter data: instance date to update
        -result: true if update suceeded
    */
    func updateInstanceData(data:InstanceData)->Bool{
        if (updateInstanceDataCache(data)) {
            // Update database
            return super.updateInstanceData(data);
        }
        return false
    }
    
    
    /** Add a batch of data
        -parameter batcj: array of data to add
        -result: true if update suceeded

    */
    func addInstanceDataBatch (batch :[InstanceData])->Bool{
        var modified = false;
        for  data : InstanceData in batch {
            if (updateInstanceDataCache(data)) {
                modified = true;
            }
        }
        if (modified) {
            // Update database only if data was modified
            return super.addInstanceDataBatch(batch);
        }
        return false
    }
    
    
    /** delete instance
        -parameter instanceId: instance to delete
    */
    func deleteInstance(instanceId: String){
        instanceDataCache.removeValueForKey(instanceId)
        lastUpdated = Int64(NSDate().timeIntervalSince1970*1000.0)
        super.deleteInstance(instanceId)
    }
    
    
    /** delete all data
    */
    override func deleteAll(){
        instanceDataCache = [:]
        lastUpdated = Int64(NSDate().timeIntervalSince1970*1000.0)
        super.deleteAll()

    }
    
    /** update instance cacha
    */
    func updateInstanceDataCache(data: InstanceData )->Bool {
        return false;
    }
    
    /** retreive id from cache
        - parameter instanceId:
    */
    func  getInstanceCachedValues( instanceId: String) ->InstanceCacheEntry?{
        let cacheEntry = instanceDataCache[instanceId]
        return cacheEntry
    }
    
    
    /** Retrives the instance data from the cache
        - parameter instanceId : id to get data for
        - parameter from : start time
        - parameter to: end time
        - returns: dictionary of timestamps and AnomalyValue
    */
    func getInstanceData( instanceId : String,  from : Int64,  to : Int64) ->[Int64: AnomalyValue]?{
        var endTime = to
        if (endTime <= 0 ) {
            // Use current time as upper limit
            endTime = Int64(NSDate().timeIntervalSince1970*1000)
        }

        // Get instance cached values
        let cached  = getInstanceCachedValues(instanceId)
        if cached  == nil {
            return nil
        }
        
        var submap = [Int64: AnomalyValue]()
        for (key,value) in cached!.data {
            if (key >= from && key < endTime+1){
                submap[key] = value
            }
        }
        return submap
    }
}
