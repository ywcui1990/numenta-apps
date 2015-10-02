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

class InstanceViewController: UIViewController, UITableViewDataSource, UITableViewDelegate, UISearchResultsUpdating, UISearchBarDelegate  {

     @IBOutlet var timeSlider: TimeSliderView?
     @IBOutlet weak var instanceTable: UITableView!
    @IBOutlet weak var menuButton:UIBarButtonItem!

    
    var searchController : UISearchController?
    var searchButton : UIBarButtonItem?
    var segment :UIBarButtonItem?
    var searchControllerButton : UIBarButtonItem?
    var logo :UIBarButtonItem?
    
    //
    var _aggregation: AggregationType = TaurusApplication.getAggregation()
    
    var tableData = [InstanceAnomalyChartData]()
   
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.

        // Set up Search bar
        
        searchController = UISearchController(searchResultsController: nil)
        searchController!.searchResultsUpdater = self
        searchController!.dimsBackgroundDuringPresentation = false
        searchController!.searchBar.sizeToFit()
        searchController!.searchBar.delegate = self
        searchController!.hidesNavigationBarDuringPresentation = false
        self.definesPresentationContext = true

        // Add buttons to navigation bar
         searchButton = UIBarButtonItem(barButtonSystemItem: .Search, target: self, action: "showSearch")
        searchButton!.tintColor = UIColor.whiteColor()
        
        let items = ["All", "Favorites"]
        let customSC = UISegmentedControl(items: items)
        customSC.selectedSegmentIndex = 0
        customSC.tintColor = UIColor.whiteColor()

        
        let container = UIView()
        container.addSubview(customSC)
        
        segment = UIBarButtonItem(customView:customSC)
        searchControllerButton = UIBarButtonItem(customView: self.searchController!.searchBar)
        
        searchController?.searchBar.hidden = false
        self.navigationItem.rightBarButtonItems = [searchButton!, segment!]
        
        // Show header icon
        
        let icon = UIImage(named: "grok_header")
        logo = UIBarButtonItem (image: icon,  style: UIBarButtonItemStyle.Plain, target: nil, action: nil)
        
     //sw_rear   self.navigationItem.leftBarButtonItem = logo
        
        // Hook up swipe gesture
        
         let panRec = UIPanGestureRecognizer()
         panRec.addTarget(self, action: "draggedView:")
         timeSlider?.addGestureRecognizer(panRec)
        
        // on iOS 8+ need to make sure table background is clear
        
        instanceTable.backgroundColor = UIColor.clearColor()
        
        //self.syncWithDB()
          syncDBWithServer()

        // Register to listen for sync changes. Reload data when that happens
        NSNotificationCenter.defaultCenter().addObserver(self, selector: "syncWithDB", name: DataSyncService.METRIC_CHANGED_EVENT, object: nil)

        
       if self.revealViewController() != nil {
            menuButton.target = self.revealViewController()
            menuButton.action = "revealToggle:"
            self.view.addGestureRecognizer(self.revealViewController().panGestureRecognizer())
            
            // Uncomment to change the width of menu
           // self.revealViewController().rearViewRevealWidth = 62
        }
        
    }

    /** shows search bar in navigation area
    */
    func showSearch() {

        self.navigationItem.setLeftBarButtonItem(searchControllerButton!, animated: true)
        self.navigationItem.setRightBarButtonItems([], animated: true)
        searchController?.searchBar.becomeFirstResponder()
    }
    
    /** hide search bar*/
    func searchBarCancelButtonClicked(_searchBar: UISearchBar){
        self.navigationItem.setRightBarButtonItems( [searchButton!, segment!], animated: true)
        self.navigationItem.setLeftBarButtonItem(logo, animated: true)
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    /**
        Handle the swipe gesture
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
        
        for cell in cellSet{
            cell.data?.setEndDate (flooredDate)
            cell.data?.load()
            cell.chart.setData(cell.data?.getData())
            cell.setNeedsDisplay()
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
    
    
     func numberOfSectionsInTableView(tableView: UITableView) -> Int {
        return 1
    }
    
     func tableView(tableView: UITableView, titleForHeaderInSection section: Int) -> String?{
       return nil
/*        switch section {
        case 0:
            return "Stock & Twitter"
        case 1:
            return "Stock"
        case 2:
            return "Twitter"
            
            
        default:
            return "No anomalies"
        }*/
        
    }
    
    func tableView(tableView: UITableView!, numberOfRowsInSection section: Int) -> Int{
        
        if (section == 0 ){
            return tableData.count
        }
        return 1    }
    
    var cellSet = Set<InstanceCell>()
    
    
    func tableView(tableView: UITableView!, cellForRowAtIndexPath indexPath: NSIndexPath!) -> UITableViewCell!{
        let cell:InstanceCell? = self.instanceTable.dequeueReusableCellWithIdentifier("InstanceCell") as! InstanceCell?

        cell?.backgroundColor = UIColor.clearColor()
        
        if (indexPath.section==0){
            var chartData = tableData[ indexPath.item]
            
            cell?.ticker.text = chartData.ticker
            cell?.name.text  = chartData.name
            cell?.data = chartData
            cellSet.insert (cell!)
            
            if (chartData.hasData() && !chartData.modified){
                let cv : AnomalyChartView? = cell!.chart
                var valueData = chartData.getData()
                 cv!.setData (valueData)
              // loadChartData (cell!, data: chartData)
            }else{
                loadChartData (cell!, data: chartData)
            }
        }
        else{
            cell?.ticker.text = "IBM"
            cell?.name.text = "International Business Machine"
        }
        
        
        
        return cell
    }
    
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
    }
    
    func tableView(tableView: UITableView, commitEditingStyle editingStyle: UITableViewCellEditingStyle, forRowAtIndexPath indexPath: NSIndexPath)
    {
        
    }
    
   /* func tableView(tableView: UITableView, editActionsForRowAtIndexPath indexPath: NSIndexPath) -> [UITableViewRowAction]?
    {
        let shareAction = UITableViewRowAction(style: .Normal, title: "Favorite" , handler: { (action:UITableViewRowAction, indexPath:NSIndexPath) -> Void in
            
        })
        
        shareAction.backgroundColor = UIColor.blueColor()
        
        return [shareAction]
    }*/

    
    func loadChartData(cell : InstanceCell, data: InstanceAnomalyChartData){
       
        let priority = DISPATCH_QUEUE_PRIORITY_DEFAULT
        dispatch_async(dispatch_get_global_queue(priority, 0)) {
            data.setEndDate( self.timeSlider!.endDate)
            data.load()
            if (data.hasData()){
                dispatch_async(dispatch_get_main_queue()) {
                    cell.chart.setData ( data.getData())
                }
            }
        }
    }
    

    
    func syncWithDB(){
          dispatch_async(dispatch_get_global_queue( QOS_CLASS_USER_INITIATED, 0)) {
            let instanceSet = TaurusApplication.getDatabase().getAllInstances()
            var instanceChartData = [InstanceAnomalyChartData]()
            
            for  instance in instanceSet {
                instanceChartData.append( InstanceAnomalyChartData(instanceId: instance, aggregation: self._aggregation) )
            }
            
            for  chartData in instanceChartData {
                chartData.load()
                      }
            
            instanceChartData.sortInPlace {
                /*   if ($0 == $1)
                {
                return 0
                }
                
                if ( $0 == nil)
                {return 1}
                
                if ($1 == nil){
                return -1
                }
                */
                
                if ($0.getRank() > $1.getRank()){
                    true            }
                
                if ($0.getRank() < $1.getRank()){
                    return  false            }
                
                
                let result = $0.getName().compare ($1.getName())
                
                
                if (result == NSComparisonResult.OrderedAscending) {
                    return true
                }
                return false
                
            }
            
            // Update UI with new data
            dispatch_async(dispatch_get_main_queue()) {
                self.tableData = instanceChartData
                self.timeSlider?.endDate = DataUtils.dateFromTimestamp( TaurusApplication.getDatabase().getLastTimestamp() )
                self.instanceTable?.reloadData()

            }
        }
    }
    
    func updateSearchResultsForSearchController(searchController: UISearchController)
    {
     /*   filteredTableData.removeAll(keepCapacity: false)
        
        let searchPredicate = NSPredicate(format: "SELF CONTAINS[c] %@", searchController.searchBar.text)
        let array = (tableData as NSArray).filteredArrayUsingPredicate(searchPredicate)
        filteredTableData = array as! [String]
        
        self.tableView.reloadData() */
    }
    
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        if segue.identifier == "showInstanceDetail" {
            if let indexPath = self.instanceTable.indexPathForSelectedRow {
                
                let data = self.tableData[indexPath.row]
                
                //   let object = objects[indexPath.row] as! NSDate
                let controller = segue.destinationViewController as! InstanceDetailsViewController
                controller.chartData = data
                //      controller.detailItem = object
              /*  controller.navigationItem.leftBarButtonItem = self.splitViewController?.displayModeButtonItem()
                controller.navigationItem.leftItemsSupplementBackButton = true*/
            }
        }
    }
    
    func syncDBWithServer(){
        
        
        dispatch_async(dispatch_get_global_queue( QOS_CLASS_USER_INITIATED, 0)) { // 1
            
            
            let credentialsProvider = AWSCognitoCredentialsProvider(
                regionType: AWSRegionType.USEast1,
                identityPoolId: AppConfig.identityPoolId)
            
            let client : TaurusClient = TaurusClient( provider : credentialsProvider, region: AWSRegionType.USWest2 )
            
            let metrics = client.getMetrics()
            for metric in metrics{
                TaurusApplication.getDatabase().addMetric(metric)
            }
            
            let oneWeekAgo = NSDate().dateByAddingTimeInterval(Double(-60*60*24*14))
            let now = NSDate()
            let sortAscending = true
            
            client.getAllInstanceData( oneWeekAgo, to: now, ascending: sortAscending, callback: self.handleInstanceData)
            
            let instances = TaurusApplication.getDatabase().getAllInstances()
            
            
            self.syncWithDB()
        }
        
    }
    
    func handleInstanceData (data : InstanceData)->Void?{
        
        // Could batch this up for performance reason
        TaurusApplication.getDatabase().addInstanceDataBatch( [data])
        
        return nil
    }
    


}

