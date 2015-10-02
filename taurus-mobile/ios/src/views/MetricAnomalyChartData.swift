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
        var collapsedData : [Float]?

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
        let from = DataUtils.dateFromTimestamp(lastTimestamp - numOfDays * DataUtils.MILLIS_PER_DAY)
        
        
        client.getMetricsValues (getId(),  from: from, to: to,ascending: true ){( metricId: String,  timestamp: Int64,  value: Float,  anomaly: Float) in
            
            // Calculate data index based on timestamp
            var idx = Int((timestamp - fromTime) / DataUtils.METRIC_DATA_INTERVAL)
            if (idx >=  Int(newRawData.count)) {
                idx = newRawData.count - 1;
            }

            newRawData[idx] = Double(value)
            
            if (  newRawData[idx] == 0){
                print ( newRawData[idx])
            }
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
        let startStamp =  endDate - ( 1 * DataUtils.MILLIS_PER_DAY )
        return DataUtils.dateFromTimestamp(startStamp)
    }
    
    func computeDataForCurrentPeriod(){
        var end: Int = allRawData!.count
        let bars = TaurusApplication.getTotalBarsOnChart()
        var size = (Int64(bars) * BAR_INTERVAL / DataUtils.METRIC_DATA_INTERVAL)
        
        end = max(Int64(self.allRawData!.count) - (self.lastTimestamp - self.endDate) / BAR_INTERVAL - bars, 0)
        
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
    }
    
    func computeAnomalies(){
        var result = [(Int64, Double)]()
        let startTime = anomalies[0].0
        for item in anomalies {
            let value = DataUtils.logScale( item.1)
            let index = (item.0 - startTime) / DataUtils.METRIC_DATA_INTERVAL
            result.append ( (index, value))
        }
        self.data = result
    }
    
  }