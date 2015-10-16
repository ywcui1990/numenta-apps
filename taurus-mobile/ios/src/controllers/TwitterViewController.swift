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


class TwitterEntry{
    var tweets: Int32 = 0
    var data = [Tweet]()
}



class TwitterViewController: UIViewController, UITableViewDataSource, UITableViewDelegate  {
    
    @IBOutlet var timeSlider: TimeSliderView?
    @IBOutlet weak var instanceTable: UITableView!
    @IBOutlet weak var anomalyChartView : AnomalyChartView!
    @IBOutlet weak var metricChartView : LineChartView!
    
    @IBOutlet weak var ticker : UILabel!
    @IBOutlet weak var name : UILabel!
    @IBOutlet weak var date : UILabel!
    @IBOutlet weak var menuButton:UIBarButtonItem!
    @IBOutlet weak var condensedToggle: UISwitch?
    
       
    
    var twittermap = [ Int64 : TwitterEntry]()
    var twitterIndex = [Int64]()
    
    var showCondensed = false
    
    // Serial queue for loading chart data
    let loadQueue = dispatch_queue_create("com.numenta.TwitterController", nil)
    
    var  metricChartData : MetricAnomalyChartData?
    
    var _aggregation: AggregationType = TaurusApplication.getAggregation()

    var chartData: InstanceAnomalyChartData? {
        didSet {
            // Update the view.
            self.configureView()
        }
    }
    
    
    /** handle the UISwitch for condensed tweets
    */
    @IBAction func toggleCondensed(){
        self.showCondensed = (condensedToggle?.on)!
        self.instanceTable.reloadData()
        
        if (self.showCondensed){
            self.instanceTable.separatorColor =  UIColor.blackColor()
        } else{
            self.instanceTable.separatorColor = UIColor.lightGrayColor()
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
        }
        anomalyChartView?.setData (chartData!.getData())
        
        ticker?.text = chartData?.ticker
        name?.text = chartData?.name
        
        if (metricChartData != nil && metricChartData?.rawData != nil ){
            metricChartView?.data  = metricChartData!.rawData!
            metricChartView?.anomalies = metricChartData!.data!
            metricChartView?.updateData()
        }
    }
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.

        timeSlider?.showBottom = false
        timeSlider?.transparentBackground = true
        // on iOS 8+ need to make sure table background is clear
        
        instanceTable.backgroundColor = UIColor.clearColor()
          self.instanceTable.estimatedRowHeight = 80.0
        self.instanceTable.rowHeight = UITableViewAutomaticDimension
        
        if self.revealViewController() != nil {
            let menuIcon = UIImage(named: "menu")
            let b2 = UIBarButtonItem (image: menuIcon,  style: UIBarButtonItemStyle.Plain, target: self.revealViewController(), action: "rightRevealToggle:")
            self.menuButton = b2
            
            self.navigationItem.rightBarButtonItems = [menuButton!]
            
            self.view.addGestureRecognizer(self.revealViewController().panGestureRecognizer())
        }
        
        metricChartView.selectionCallback = self.selection
        condensedToggle?.on = false
        self.instanceTable.separatorColor = UIColor.lightGrayColor()
        configureView()
        
        
        let dayTimePeriodFormatter = NSDateFormatter()
        dayTimePeriodFormatter.dateFormat = "EEE M/d"
        
        let dateString = dayTimePeriodFormatter.stringFromDate( self.timeSlider!.endDate)
        
        self.date?.text = dateString

        
        
        let priority = DISPATCH_QUEUE_PRIORITY_DEFAULT
        dispatch_async(dispatch_get_global_queue(priority, 0)) {
            self.loadTwitterData()
        }
        
    }
    

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    /** Datasource delegate
    - returns : number of sections in table
    */
    func numberOfSectionsInTableView(tableView: UITableView) -> Int {
        return twitterIndex.count

    }
    
    /** header title
    */
   /* func tableView(tableView: UITableView, titleForHeaderInSection section: Int) -> String?{
       
        
        let s = formatter.stringFromDate ( date ) + " tweets: " + String(twitterEntry!.tweets)
        return s
    }*/
    
    
    func tableView(tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
        let  cell = tableView.dequeueReusableCellWithIdentifier("TwitterHeaderCell")
        let headerCell = cell as! TwitterHeaderCell
        
        let ts = twitterIndex [section]
        
        
        let date = DataUtils.dateFromTimestamp(ts)
        
        
        let twitterEntry = twittermap[ts]
        
        let formatter = NSDateFormatter()
        formatter.dateFormat = "h:mma"
        
        headerCell.date.text = formatter.stringFromDate(date)
        headerCell.tweetTotal.text = String(twitterEntry!.tweets)
        return headerCell
    
    }
    
    
    /** Datasource delegate to return number of rows in a cell.
    */
    func tableView(tableView: UITableView!, numberOfRowsInSection section: Int) -> Int{
        let tsIndex = twitterIndex[section]
        let twitterEntry = twittermap[tsIndex]
        
        if (twitterEntry==nil){
            return 0
        }
        let items : [Tweet] = twitterEntry!.data
        
        return items.count
    }
    
    
    /** bind data to cell and return the cell
    */
    func tableView(tableView: UITableView!, cellForRowAtIndexPath indexPath: NSIndexPath!) -> UITableViewCell!{
        
        let cell:TwitterCell? = self.instanceTable.dequeueReusableCellWithIdentifier("TwitterCell") as! TwitterCell?
        
        let section = indexPath.section
        let tsIndex = twitterIndex[section]
        
        let twitterEntry = twittermap[tsIndex]
        
        let items : [Tweet]? = twitterEntry!.data
        let tweet = items![ indexPath.item]
        
        if (showCondensed){
            let attrs = [NSFontAttributeName : UIFont.boldSystemFontOfSize(14.0)]
            let attrStr = NSMutableAttributedString(string: tweet.cannonicalText, attributes:attrs)
            if (tweet.hasLinks){
                let bodyAttrs = [NSFontAttributeName : UIFont.systemFontOfSize(14.0)]
                let tweetText = NSMutableAttributedString(string: " links", attributes:bodyAttrs)
                attrStr.appendAttributedString(tweetText)
            
            }
            cell?.label?.attributedText = attrStr
            
            cell?.retweetCount.hidden = true
            cell?.retweetImage.hidden = true
            cell?.retweetTotal.hidden = true
            
            if (tweet.retweetCount > 1){
                cell?.retweetCount.hidden = false
                cell?.retweetCount.text = String (tweet.retweetCount)
            }else{
                cell?.retweetCount.hidden = true
            }
        }else{
        
            let attrs = [NSFontAttributeName : UIFont.boldSystemFontOfSize(14.0)]
            let attrStr = NSMutableAttributedString(string:"@" + tweet.userName , attributes:attrs)
            
            let bodyAttrs = [NSFontAttributeName : UIFont.systemFontOfSize(14.0)]
               let tweetText = NSMutableAttributedString(string: "\r\n" + tweet.text, attributes:bodyAttrs)
            
            attrStr.appendAttributedString(tweetText)
            
            
      
            cell?.label?.attributedText = attrStr
            
            
            if (tweet.retweetCount > 1){
                cell?.retweetCount.hidden = false
                cell?.retweetCount.text = String (tweet.retweetCount)
            }else{
                cell?.retweetCount.hidden = true
            }
            
            if ( tweet.retweetCount>1 || tweet.retweetTotal > 1){
                cell?.retweetImage.hidden = false
            } else{
                 cell?.retweetImage.hidden = true
            }
            
            if (tweet.retweetTotal > 1){
                cell?.retweetTotal.hidden = false
                cell?.retweetTotal.text = String (tweet.retweetTotal)
            }else{
                cell?.retweetTotal.hidden = true
            }
            
        }
        return cell
    }
    
    /** prompt the user if they want to open the tweet when a row is selected
    */
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        
        let alertView = UIAlertController(title: "Open Twitter", message: "Are you sure you want to open this message using twitter?", preferredStyle: .Alert)


        alertView.addAction(UIAlertAction(title: "Open", style: .Default, handler: { (alertAction) -> Void in
            let section = indexPath.section
            let tsIndex = self.twitterIndex[section]
            
            let twitterEntry = self.twittermap[tsIndex]
            
            let items : [Tweet]? = twitterEntry!.data
            let tweet = items![ indexPath.item]
            
            let uri = "http://twitter.com/" + tweet.userName + "/status/" + tweet.id
            
            UIApplication.sharedApplication().openURL(NSURL(string: uri)!)

        }))
        alertView.addAction(UIAlertAction(title: "Cancel", style: .Cancel, handler: nil))
        presentViewController(alertView, animated: true, completion: nil)
    }
    
    func tableView(tableView: UITableView, commitEditingStyle editingStyle: UITableViewCellEditingStyle, forRowAtIndexPath indexPath: NSIndexPath)
    {
        
    }
    
    
    
    /** load twitter data
        fixme - do the more optimal load
    */
    func loadTwitterData(){
        let client = TaurusApplication.connectToTaurus()
        let metric = metricChartData?.metric
        
        let start = metricChartData!.getStartTimestamp()
        let endTime = metricChartData!.getEndDate()// + DataUtils.MILLIS_PER_HOUR;
        
        client?.getTweets( (metric?.getName())!, from: start, to: endTime! ){ (tweet: Tweet?)in
            if (tweet != nil){
                
                let aggregationTime : Int64 = tweet!.aggregated
                
                var twitterEntry = self.twittermap[aggregationTime]
               
                
                if (twitterEntry == nil){
                    twitterEntry =  TwitterEntry()
                    self.twittermap[aggregationTime] = twitterEntry
                }
            
                if (tweet!.text.hasPrefix("Buy EOG")){
                    print (tweet!.text)
                }
                var dup  = false
                for existingTweet in twitterEntry!.data {
                    if existingTweet.cannonicalText == tweet!.cannonicalText {
                        if (existingTweet.retweetCount == 0){
                            existingTweet.retweetCount = 1
                        }
                        existingTweet.retweetCount += 1
                        dup = true
                        break
                    }
                }
                if ( dup == false){
                    twitterEntry?.data.append(tweet!)
                }
                twitterEntry?.tweets += 1
                
            }
           
            return nil
        }
        
        for twitterEntry  in self.twittermap.values {
            twitterEntry.data.sortInPlace{
                if ( $0.aggregated != $1.aggregated){
                    return $0.aggregated > $1.aggregated
                }
                
                
                if ( $0.retweetCount != $1.retweetCount){
                    return $0.retweetCount > $1.retweetCount
                }
                
                if ( $0.retweetTotal != $1.retweetTotal){
                    return $0.retweetTotal > $1.retweetTotal
                }
                
               
                return  $0.id < $1.id
                
        }
        
        }
        // Update the table to the new data
        dispatch_async(dispatch_get_main_queue()) {
           
            self.twitterIndex = Array(self.twittermap.keys)
            
            self.twitterIndex.sortInPlace {
                return $0 >  $1
            }
            
            // need to sort each bucket
            
            
            
            self.instanceTable?.reloadData()
        }

    }
    
    /** Scroll table to match the selection
        - parameter index:
    */
    func selection( index : Int)->Void{
        let timeStamp = Int64(index) * DataUtils.METRIC_DATA_INTERVAL + DataUtils.timestampFromDate( metricChartData!.getStartTimestamp() )
        
    
        var section = 0
        for val in twitterIndex {
            if ( val < timeStamp)
            {
                break
            }
            section++
            
        }
        let index = NSIndexPath(forRow: 0, inSection: section)
        self.instanceTable?.selectRowAtIndexPath(index, animated: false, scrollPosition: UITableViewScrollPosition.Top)

    }

}

