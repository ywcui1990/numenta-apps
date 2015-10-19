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


  import Foundation
  
  
  /** Holds the date for the chart
  */
  class MetricAnomalyChartData : AnomalyChartData {
        var  metric : Metric
        var endDate : Int64 = 0
        var lastTimestamp :Int64 = 0
        var data :[(Int64, Double)]?
        var rawData : [Double]?
        var allRawData:[Double]?
        var collapsed: Bool = false
        var collapsedData : [Double]?

        var allAnomalies : [(Int64, Double )] = [(Int64, Double )]()
        var anomalies : [(Int64, Double )] = [(Int64, Double )]()
    
    
    
        var BAR_INTERVAL = TaurusApplication.getAggregation().milliseconds()
    
    init (metric: Metric, endDate : Int64){
        self.metric = metric
        self.endDate    = endDate
    }
    
    func getId()->String{
        return metric.getId()
    }
    
    func getName()->String{
        return metric.getUserInfo("metricTypeName")
    }
    
    func  getAggregation()->AggregationType{
        return TaurusApplication.getAggregation()
    }
    
    func getData()->[(Int64, Double)]? {
        return self.data
    }
    
    func getAnomalies()->[(Int64, Double)]?{
        return nil
    }
    
    
    func getRawData()->[Float]?{
        return nil
    }
    
    func hasData()->Bool{
        if (data != nil && data!.count>0){
            return true
        }
        return false
    }
    
    func clear(){
         data = nil
         rawData = nil
         collapsedData = nil
     //    collaspedAnomalies = nil
    }
    
    func setCollapsed (collapsed: Bool){
        
    }
    
    func getEndDate()->NSDate?{
        return DataUtils.dateFromTimestamp(endDate)
    }
    
    func setEndDate(endDate: NSDate) {
        self.endDate = DataUtils.timestampFromDate (endDate)
    }
    
    func load()->Bool{
        
        let client : TaurusClient  = TaurusApplication.connectToTaurus()!
        if (client.isOnline() == false){
            return false
        }
        let numOfDays = TaurusApplication.getNumberOfDaysToSync()
        let size = numOfDays * DataUtils.MILLIS_PER_DAY / DataUtils.METRIC_DATA_INTERVAL
        var newRawData = [Double](count: Int(size), repeatedValue: Double.NaN)
      //  var allAnomalies = [(Int64, Float)]()
        var aggregated  = [Int64 : Float]()
        
        
        lastTimestamp = TaurusApplication.getDatabase().getLastTimestamp()
        let to = DataUtils.dateFromTimestamp(lastTimestamp)
        let fromTime = lastTimestamp - numOfDays * DataUtils.MILLIS_PER_DAY
        let from = DataUtils.dateFromTimestamp(fromTime)
        
        print (to)
        print (from)
        
        client.getMetricsValues (getId(),  from: from, to: to,ascending: true ){( metricId: String,  timestamp: Int64,  value: Float,  anomaly: Float) in
            
            // Calculate data index based on timestamp
            var idx = Int((timestamp - fromTime) / DataUtils.METRIC_DATA_INTERVAL)
            if (idx >=  Int(newRawData.count)) {
                idx = newRawData.count - 1;
            }
            
            if (idx<0){
                print (DataUtils.dateFromTimestamp(timestamp) )
                return nil
            }

            newRawData[idx] = Double(value)
         
            let hour = DataUtils.floorTo60Minutes(timestamp)
            let score = aggregated[hour]
            if (score == nil || score < anomaly) {
                aggregated[hour] = anomaly
            }
            

            return nil
        }
        
        
        var newAnomalies = [(Int64, Double)]()
        
        // Populate anomaly array for all scrollable period
        for  var time = fromTime; time < lastTimestamp; time += DataUtils.MILLIS_PER_HOUR {
            var value  = 0.0
            let  anomalyValue : Float? = aggregated[time]
            if (anomalyValue != nil){
                value = Double (anomalyValue!)
            }
            newAnomalies.append((time,value))
        }
        
        
        self.allRawData = newRawData
        self.rawData = newRawData
        self.allAnomalies = newAnomalies
        
        refreshData()
        
        /*
        // Populate anomaly array for all scrollable period
        for (long time = from; time < to; time += MILLIS_PER_HOUR) {
            _allAnomalies.add(new Pair<Long, Float>(time, aggregated.get(time)));
        }
        
        // Refresh data
       // refreshData()
        
        
        */
        
        return false
        }
    

    func getStartTimestamp()->NSDate{
        let startStamp =  endDate - ( TaurusApplication.getNumberOfDaysToSync() * DataUtils.MILLIS_PER_DAY )
        return DataUtils.dateFromTimestamp(startStamp)
    }
    
    func computeDataForCurrentPeriod(){
        
        if (self.lastTimestamp==0){
            return
        }
        
        if (self.endDate == 0){
            self.endDate = self.lastTimestamp
        }
        
        print (self.getEndDate())
        print (self.getStartTimestamp())
        
        var end: Int = allRawData!.count
        let bars = TaurusApplication.getTotalBarsOnChart()
        var size = (Int64(bars) * BAR_INTERVAL / DataUtils.METRIC_DATA_INTERVAL)
        
        end = max(Int64(self.allRawData!.count) - (self.lastTimestamp - self.endDate) / DataUtils.METRIC_DATA_INTERVAL , 0)
        
        var start: Int = end - Int(size)
        if (start < 0){
            start = 0
        }
        
        let slice = allRawData![Range<Int>(start: start, end: end)]
        
        self.rawData = Array(slice)
        
        // Anomalies
        size = Int64( allAnomalies.count)
        start = max(size - (lastTimestamp - endDate) / BAR_INTERVAL - bars, 0)
        end =  min ( start+bars, Int(size))

        let anomalySlice = self.allAnomalies[Range<Int>(start: start, end: end)]
        self.anomalies = Array(anomalySlice)
    }
    
    
    func getType() -> Character {
        return "M"
    }
    
    func getUnit() -> String? {
        return metric.getUnit()
    }
    
    func getAnnotations() -> [Int64]? {
        return nil
    }
    
    func getRank()->Double{
        return 0
    }
    
    func refreshData(){
        
       
        computeDataForCurrentPeriod()
        computeAnomalies()
        
        if (self.collapsed){
            computeCollapsed()
            self.rawData = self.collapsedData
            
        }
    }
    
    func computeAnomalies(){
        
        if (anomalies.count<=0){
            return
        }
        var result = [(Int64, Double)]()
        let startTime = anomalies[0].0
        for item in anomalies {
            let value = DataUtils.logScale( item.1)
            let index = (item.0 - startTime) / DataUtils.METRIC_DATA_INTERVAL
            result.append ( (index, value))
        }
        self.data = result
    }
    
    /**
     Compute and set the data for the compressed view
    */
    func computeCollapsed(){
        var bars = Int64(TaurusApplication.getTotalBarsOnChart())
        
        let size = (Int64(bars) * BAR_INTERVAL / DataUtils.METRIC_DATA_INTERVAL)
        let interval = AggregationType(period:60).milliseconds()
        
        var time :Int64 = (endDate/interval)*interval
        let intervalsPerBar = size/bars
        print (endDate)
        
         var results = [Double](count: Int(size), repeatedValue: Double.NaN)
        
        let emptyValue = (Int64(0), Double.NaN)
        var collapsedAnomalies : [(Int64, Double )] = [(Int64,Double)](count: Int(bars), repeatedValue: emptyValue )
        
        let startTime = DataUtils.timestampFromDate( self.getStartTimestamp())
        
        let anomalySize = Int64( allAnomalies.count)
        let anomalyStart = max(anomalySize - (lastTimestamp - endDate) / BAR_INTERVAL - bars, 0)
        let anomalyEnd =  min ( Int(anomalyStart+bars), Int(anomalySize))
        
        var barIndex = anomalyEnd - 1
        // get 24 bars worth of data
        while (bars>0){
            
            let open = TaurusApplication.marketCalendar.isOpen(time + DataUtils.METRIC_DATA_INTERVAL)
            
            let endIndex = max(Int64(self.allRawData!.count) - (self.lastTimestamp - time) / DataUtils.METRIC_DATA_INTERVAL , size)
           
            
            if (open){
                // Copy over values for time period
                for (var i : Int64 = 0; i < intervalsPerBar; i++){
                    let index = Int((bars-1) * intervalsPerBar + i  )
                    let srcIndex  = endIndex - (intervalsPerBar - i )
                    results[ index ] = allRawData![ Int(srcIndex) ]

                    
                }
                
                // copy over anomalies
                collapsedAnomalies[bars-1] = ( (bars-1)*intervalsPerBar , self.allAnomalies[barIndex].1 )
                
            }else{
                
                var newTime  = time
                
                // loop until we find a time when the market is open again
                while ( open == false ) {
                    newTime  -= interval
                    let marketOpen = TaurusApplication.marketCalendar.isOpen(newTime + DataUtils.METRIC_DATA_INTERVAL)
                    
                    if (marketOpen)
                    {
                        
                        break
                    }
                    
                    time -= interval
                    barIndex--
                }
            }
            time -= interval
            bars--
            barIndex--
            
        
            // stop if we get to the time before we have data
            if (time < startTime){
                break
            }
            
            if (barIndex<0){
                barIndex = 0
            }
            
            
        }
        
        self.collapsedData = results
        self.data = collapsedAnomalies
    }

    
    
    
    
  
  }