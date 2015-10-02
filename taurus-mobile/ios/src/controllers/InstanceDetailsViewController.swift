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


import UIKit

class InstanceDetailsViewController: UIViewController, UITableViewDataSource, UITableViewDelegate  {

    @IBOutlet var timeSlider: TimeSliderView?
    @IBOutlet weak var instanceTable: UITableView!
    @IBOutlet weak var anomalyChartView : AnomalyChartView!
    
    @IBOutlet weak var ticker : UILabel!
    @IBOutlet weak var name : UILabel!
    @IBOutlet weak var date : UILabel!
    
    // Serial queue for loading chart data
    let loadQueue = dispatch_queue_create("com.numenta.InstanceDetailsController", nil)
    var cellSet = Set<MetricCell>()
    
    var  metricChartData  = [MetricAnomalyChartData]()
    
    //
    var _aggregation: AggregationType = TaurusApplication.getAggregation()

    
  //  var tableData = [InstanceAnomalyChartData]()
   
    
    var chartData: InstanceAnomalyChartData? {
        didSet {
            // Update the view.
            self.configureView()
        }
    }
    
    /** bind data to view
    */
    func configureView() {
        if (chartData == nil){
            return
        }
        
        if ( chartData?.getEndDate() != nil){
            timeSlider?.endDate = (chartData?.getEndDate()!)!
            timeSlider?.setNeedsDisplay()
        }
        
        timeSlider?.disableTouches = true
        
        anomalyChartView?.setData (chartData!.getData())
        
        ticker?.text = chartData?.ticker
        name?.text = chartData?.name
        
        metricChartData.removeAll()
        for metric in chartData!.metrics! {
           metricChartData.append( MetricAnomalyChartData (metric: metric, endDate :0))
        }
        
        metricChartData.sortInPlace {
            let left = MetricType.enumForKey($0.metric.getUserInfo("metricType")).rawValue
            let right = MetricType.enumForKey($1.metric.getUserInfo("metricType")).rawValue
            
            return left < right
        }
    
    }

    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.

      
        // Hook up swipe gesture
        
         let panRec = UIPanGestureRecognizer()
         panRec.addTarget(self, action: "draggedView:")
         timeSlider?.addGestureRecognizer(panRec)
         timeSlider?.showBottom = false
            timeSlider?.transparentBackground = true
        // on iOS 8+ need to make sure table background is clear
        
        instanceTable.backgroundColor = UIColor.clearColor()
        
        instanceTable.tableFooterView = UIView(frame:CGRectZero)
        instanceTable.separatorColor = UIColor.clearColor()

        
         configureView()
    }

    

    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    /**
        Handle the swipe gesture. Updates the time slider, anomalychart, and the metric table
        - parameter sender:
    */
    func draggedView(sender:UIPanGestureRecognizer){
      //  self.view.bringSubviewToFront(sender.view)
        let translation = sender.translationInView(self.view)
      //  print (translation)
        if (abs(translation.y) > abs(translation.x))
        {
            return
        }
        let distance = getDistance( Double( translation.x) * -1.0 )
        
      
        let newTime:NSDate? =  timeSlider?.endDate.dateByAddingTimeInterval(distance)
     //   print ((timeSlider?.endDate,newTime))
        
        var flooredDate = DataUtils.floorTo5Mins (newTime!)
        let endDateInd = Int64(flooredDate.timeIntervalSince1970 * 1000)
        
        let maxDate = DataUtils.floorTo5minutes(TaurusApplication.getDatabase().getLastTimestamp());
        let minDate = maxDate - (Int64(TaurusApplication.getNumberOfDaysToSync() - 1)) * DataUtils.MILLIS_PER_DAY;
        // Check max date and no date
        if (endDateInd > maxDate) {
            flooredDate =  NSDate(timeIntervalSince1970: Double(maxDate)/1000.0 )
        }
        // Check min date
        if (endDateInd < minDate) {
            flooredDate =  NSDate(timeIntervalSince1970: Double(minDate)/1000.0 )
        }
        
       // print (distance/(60*60))
     //   print ((timeSlider?.endDate,flooredDate))
        timeSlider?.endDate =  flooredDate
        timeSlider?.setNeedsDisplay()
        
        chartData?.setEndDate(flooredDate)
        chartData?.load()
        anomalyChartView?.setData (chartData!.getData())
        
        
        // FIXME can I use indexPathsForVisibleRows instead?
        for cell in cellSet {
            
            if (cell.data != nil){
                cell.data?.setEndDate (flooredDate)
                cell.data?.refreshData()

                cell.chart.data  = cell.data!.rawData!
                cell.chart.anomalies = cell.data!.data!
                cell.chart.updateData()
                cell.setNeedsDisplay()
            }
        }
       }
    
    
    /** get the amount of time to shift
        -parameter distance: length of swipe
    */
     func getDistance(distance : Double)->Double {
        let width =  self.view.frame.size.width
        let pixels = Double(Double(width) / (Double)(TaurusApplication.getTotalBarsOnChart()))
        let scrolledBars = Double(Int64 (distance / pixels))
        // Scroll date by aggregation interval
        let interval = Double(TaurusApplication.getAggregation().milliseconds())/1000.0
        let timeDistance = Double(interval * scrolledBars)*(1.0)
     //   print ((pixels, scrolledBars, timeDistance))
        return timeDistance
    }
    
    
    /** Datasource delegate 
        - returns : number of sections in table
    */
    func numberOfSectionsInTableView(tableView: UITableView) -> Int {
        return 1
    }
    
    /** header title
    */
     func tableView(tableView: UITableView, titleForHeaderInSection section: Int) -> String?{
       return nil
    }
    
    /** Datasource delegate to return number of rows in a cell.
    */
    func tableView(tableView: UITableView!, numberOfRowsInSection section: Int) -> Int{
        return metricChartData.count
    }
    
    
    /** bind data to cell and return the cell
    */
    func tableView(tableView: UITableView!, cellForRowAtIndexPath indexPath: NSIndexPath!) -> UITableViewCell!{
        let cell = self.instanceTable.dequeueReusableCellWithIdentifier("metricCell")
        
        
        let metricCell =  cell    as! MetricCell?

        if ( metricCell == nil ){
          return metricCell
        }
        
        metricCell?.backgroundColor = UIColor.clearColor()
    //    metricCell?.selectionStyle =   UITableViewCellSelectionStyle.Blue
    //    metricCell?.userInteractionEnabled = true
        
        cellSet.insert(metricCell!)
        let cellData =  metricChartData[ indexPath.item]
        
        metricCell?.label.text = cellData.getName()
        
        if (MetricType.enumForKey(cellData.metric.getUserInfo("metricType")) == MetricType.StockPrice){
             metricCell?.chart?.wholeNumbers = false
        }else{
            metricCell?.chart?.wholeNumbers = true
        }
        
        
        loadChartData( metricCell!, data: cellData)
        return cell
    }

 /*   func tableView(tableView: UITableView, willSelectRowAtIndexPath indexPath: NSIndexPath)->NSIndexPath {
        
        let cellData =  metricChartData[ indexPath.item]
        
        if (MetricType.enumForKey(cellData.metric.getUserInfo("metricType")) == MetricType.TwitterVolume){
     //       performSegueWithIdentifier("twitterSegue", sender: nil)
        }
        return indexPath
        
    }*/
    
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        
         let cellData =  metricChartData[ indexPath.item]
        
        if (MetricType.enumForKey(cellData.metric.getUserInfo("metricType")) == MetricType.TwitterVolume){
            performSegueWithIdentifier("twitterSegue", sender: nil)
        }
        
    }
    
    func tableView(tableView: UITableView, commitEditingStyle editingStyle: UITableViewCellEditingStyle, forRowAtIndexPath indexPath: NSIndexPath)
    {
    }
    
   

    /** load teh chart data and then update the table cell
        - parameter cell: table cell to update
        - parameter data: Metric chart data to load
    */
    func loadChartData(cell : MetricCell, data: MetricAnomalyChartData){
       
        dispatch_async(loadQueue) {
            
            data.load()
            if (data.rawData != nil){
                dispatch_async(dispatch_get_main_queue()) {
                    
                    data.setEndDate(  (self.timeSlider?.endDate)!)
                    data.refreshData()
                    cell.chart.data  = data.rawData!
                    cell.chart.anomalies = data.data!
                    cell.chart.updateData()
                    cell.data = data
                                   }
            }
        }
    }
    

    /** load twitter view
    */
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        if segue.identifier == "twitterSegue" {
            if let indexPath = self.instanceTable.indexPathForSelectedRow {
                
              //  let data = self.tableData[indexPath.row]
                
                //   let object = objects[indexPath.row] as! NSDate
                let controller = segue.destinationViewController as! TwitterViewController
                
                controller.metricChartData = self.metricChartData[indexPath.row]
              
                controller.chartData = self.chartData
                
                //      controller.detailItem = object
                /*  controller.navigationItem.leftBarButtonItem = self.splitViewController?.displayModeButtonItem()
                controller.navigationItem.leftItemsSupplementBackButton = true*/
            }
        }
    }
    
  


}

