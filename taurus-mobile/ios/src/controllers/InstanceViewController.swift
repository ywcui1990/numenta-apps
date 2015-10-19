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


import UIKit

class InstanceViewController: UIViewController, UITableViewDataSource, UITableViewDelegate, UISearchResultsUpdating, UISearchBarDelegate  {

    @IBOutlet var timeSlider: TimeSliderView?
    @IBOutlet var instanceTable: UITableView!
    @IBOutlet var menuButton:UIBarButtonItem?

    
    var searchController : UISearchController?
    var searchButton : UIBarButtonItem?
    var segment :UIBarButtonItem?
    var searchControllerButton : UIBarButtonItem?
    var logo :UIBarButtonItem?
    
    //
    var _aggregation: AggregationType = TaurusApplication.getAggregation()
    
    var tableData = [Int : [InstanceAnomalyChartData]]() // Data to show, after filtering
    var currentData = [Int : [InstanceAnomalyChartData]]() // data before filtering
    var allData = [Int : [InstanceAnomalyChartData]]() // all data
   
  //  var tableData: [MetricType : [InstanceAnomalyChartData] ]
    
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
        
        
        
        let menuIcon = UIImage(named: "menu")
        let b2 = UIBarButtonItem (image: menuIcon,  style: UIBarButtonItemStyle.Plain, target: self.revealViewController(), action: "rightRevealToggle:")
        self.menuButton = b2
        
        self.navigationItem.rightBarButtonItems = [menuButton!, searchButton!, segment!]
        
        // Show header icon
        
        let icon = UIImage(named: "grok_header")
        logo = UIBarButtonItem (image: icon,  style: UIBarButtonItemStyle.Plain, target: nil, action: nil)
        
        
     //
        self.navigationItem.leftBarButtonItems = [  logo!]
        
        // Hook up swipe gesture
        
         let panRec = UIPanGestureRecognizer()
         panRec.addTarget(self, action: "draggedView:")
         timeSlider?.addGestureRecognizer(panRec)
        
        // on iOS 8+ need to make sure table background is clear
        
        instanceTable.backgroundColor = UIColor.clearColor()
        
        self.syncWithDB()

        NSNotificationCenter.defaultCenter().addObserverForName(TaurusDatabase.INSTANCEDATALOADED, object: nil, queue: nil, usingBlock: {
            [unowned self] note in
                self.syncWithDB()
            })
        
        
       if self.revealViewController() != nil {
            menuButton!.target = self.revealViewController()
            menuButton!.action = "rightRevealToggle:"
            self.view.addGestureRecognizer(self.revealViewController().panGestureRecognizer())
            self.self.revealViewController().rightViewRevealWidth = 160
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
        self.navigationItem.setRightBarButtonItems( [menuButton!,searchButton!, segment!], animated: true)
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
        let visibleCells = self.instanceTable.visibleCells
        for cell in visibleCells{
            let instanceCell = cell as! InstanceCell
            instanceCell.data?.setEndDate (flooredDate)
            instanceCell.data?.load()
            instanceCell.chart.setData(instanceCell.data?.getData())
            instanceCell.setNeedsDisplay()
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
        return 4
    }

    
    func tableView(tableView: UITableView!, numberOfRowsInSection section: Int) -> Int{
        
        let data = tableData[section]
        if (data != nil){
            return tableData[section]!.count
        }
        return 0
    }
    
    func tableView(tableView: UITableView!, cellForRowAtIndexPath indexPath: NSIndexPath!) -> UITableViewCell!{
        let cell:InstanceCell? = self.instanceTable.dequeueReusableCellWithIdentifier("InstanceCell") as! InstanceCell?

        cell?.backgroundColor = UIColor.clearColor()
        let data = tableData[indexPath.section]
        
        if (data != nil ){
            let chartData = data![ indexPath.item]
            
            cell?.ticker.text = chartData.ticker
            cell?.name.text  = chartData.name
            cell?.data = chartData
               if (chartData.hasData() && !chartData.modified){
                let cv : AnomalyChartView? = cell!.chart
                let valueData = chartData.getData()
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
        
        
        
        return cell!
    }
    
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
    }
    
    func tableView(tableView: UITableView, commitEditingStyle editingStyle: UITableViewCellEditingStyle, forRowAtIndexPath indexPath: NSIndexPath)
    {
        
    }
    
     func tableView(tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
        let tableViewWidth = self.instanceTable.bounds
        
        let headerView = UILabel(frame: CGRectMake(0, 0, tableViewWidth.size.width, self.instanceTable.sectionHeaderHeight))
        headerView.backgroundColor = UIColor.init(red: 0.9, green: 0.9, blue: 0.9, alpha: 1.0)
        
        headerView.font  = UIFont.boldSystemFontOfSize( 14.0)
        
        switch section {
            case 0:
                headerView.text =  "Stock & Twitter"
            case 1:
                  headerView.text =  "Stock"
            case 2:
                  headerView.text =  "Twitter"
                
                
            default:
                  headerView.text =  "No anomalies"
        }
        return headerView
    }
    
  /*  func tableView(tableView: UITableView, editActionsForRowAtIndexPath indexPath: NSIndexPath) -> [UITableViewRowAction]?
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
            var   listData = [Int:[InstanceAnomalyChartData]]()
            
            for var i = 0; i<4; i++ {
                listData[i] = [InstanceAnomalyChartData]()
            }
            for  instance in instanceSet {
                
                let instanceChartData = InstanceAnomalyChartData(instanceId: instance, aggregation: self._aggregation)
                
                instanceChartData.load()
                
                let metrics = instanceChartData.anomalousMetrics
                var index  = 3
                let hasStock = metrics.contains (MetricType.StockPrice) || metrics.contains(MetricType.StockVolume)
                let hasTwitter = metrics.contains(MetricType.TwitterVolume)
                
                if (hasTwitter && hasStock){
                    index = 0
                } else if (hasStock){
                    index = 1
                } else if (hasTwitter)
                {
                    index  = 2
                }
                
                var instanceArray = listData[index]
                instanceArray!.append ( instanceChartData)
                listData[index] = instanceArray

            }
        
            for var i = 0; i<4; i++ {
               var data =  listData[i]
                data!.sortInPlace {
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
                listData[i] = data
            }

            // Update UI with new data
            dispatch_async(dispatch_get_main_queue()) {
                self.allData = listData
              //   self.currentData = listData
                self.tableData = self.allData
                self.timeSlider?.endDate = DataUtils.dateFromTimestamp( TaurusApplication.getDatabase().getLastTimestamp() )
                self.instanceTable?.reloadData()

            }
        }
    }
    
    func updateSearchResultsForSearchController(searchController: UISearchController)
    {
        let text = searchController.searchBar.text
        
        if ( text!.isEmpty ){
            self.tableData = self.allData
            
            self.instanceTable.reloadData()
            return
        }
        let searchPredicate = NSPredicate(format: "SELF CONTAINS[c] %@", text!)
       
       
        var   listData = [Int:[InstanceAnomalyChartData]]()
        
        for var i = 0; i<4; i++ {
            listData[i] = [InstanceAnomalyChartData]()
            let sectionData = self.allData[i]!
            for val : InstanceAnomalyChartData in  sectionData {
                if ( searchPredicate.evaluateWithObject ( val.ticker ) ||
                    searchPredicate.evaluateWithObject ( val.getName())
                ){
                    listData[i]?.append(val)
                }
            
            }
        }
    
        self.tableData = listData

        self.instanceTable.reloadData()
    }
    
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        if segue.identifier == "showInstanceDetail" {
            if let indexPath = self.instanceTable.indexPathForSelectedRow {
                let controller = segue.destinationViewController as! InstanceDetailsViewController
                
                let data = tableData[indexPath.section]
                
                if (data != nil ){
                    controller.chartData = data![ indexPath.item]
                }

                
                    
             //   controller.chartData = data[indexPath
                //      controller.detailItem = object
              /*  controller.navigationItem.leftBarButtonItem = self.splitViewController?.displayModeButtonItem()
                controller.navigationItem.leftItemsSupplementBackButton = true*/
            }
        }
    }
    

}

