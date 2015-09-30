

import Foundation

class LineChartView: UIView {
  //  var label: String = "Stock Price"
    var axisLabels = ["128","137","135", "134"]
    var anomalies = [(Int64, Double)]()
    var data : [Double] = []
    var numYLabels: Int32 = 4
    var axisInterval : Double = 0.0
    var pointWidth = Double( 2.0 )
    var contentArea : CGRect = CGRect()
  //  var prompt :String?  = "tap for details"
    var barWidth : Double = 0.0
    var barMarginLeft = 0.0
    
    var wholeNumbers = true
    var maxValue : Double = 0.0
    var minValue : Double = 0.0
    var paddingBottom : Double = 0.0
    
    var minPadding : Double = 5.0
    
    
    required init?(coder aDecoder: NSCoder) {
        
        super.init(coder: aDecoder)
       // setData()
       
    }
    
    override init( frame : CGRect){
        
        super.init(frame: frame)
     //   setData()
    }
    
    override func drawRect(rect: CGRect) {
      
        self.contentArea = rect
        
        // set the text color to dark gray
        let fieldColor: UIColor = UIColor.whiteColor()
        
         pointWidth = Double(contentArea.width) / Double(data.count)
        
         barWidth = Double( contentArea.width) / Double(TaurusApplication.getTotalBarsOnChart())
        
      //  var i = 0
        var x = 0.0
        
        let width  = Double(rect.width)
        let dx : Double =   10
        
        let fontName = "HelveticaNeue-Bold"
        let helveticaBold = UIFont(name: fontName, size: 16.0)
        
         let promptFont = UIFont(name: fontName, size: 12.0)
        let context = UIGraphicsGetCurrentContext()
        
      CGContextSaveGState( context)
        CGContextAddRect(context, rect)
        CGContextSetFillColorWithColor(context, UIColor(
            red: CGFloat(0.0),
            green: CGFloat(1.0),
            blue: CGFloat(0.0),
            alpha: CGFloat(1.0)
            ).CGColor)
        CGContextFillPath(context)
        
               while (x < width){
         //   let text : NSString = timeStr[i]
            
            //    var cont:CGContextRef = UIGraphicsGetCurrentContext()!
            //    CGContextSetRGBFillColor(cont, 1.0, 1.0, 0.0, 1.0)
            //    CGContextFillRect(cont, CGRectMake(CGFloat(x), 0 ,dx, 16) )
            var barHeight = arc4random_uniform(UInt32(20))+60
            var viewHeight = Double(rect.height)
            let rectangle = CGRect(x: x, y: Double(barHeight), width: dx, height: Double(viewHeight) )
            
            CGContextSaveGState( context)
            
            if (barHeight<25){
                CGContextSetFillColorWithColor(context, UIColor(
                    red: CGFloat(0.9),
                    green: CGFloat(0.9),
                    blue: CGFloat(0.9),
                    alpha: CGFloat(1.0)
                    ).CGColor)
            }else if (barHeight<35){
                CGContextSetFillColorWithColor(context, UIColor(
                    red: CGFloat(0.9),
                    green: CGFloat(0.90),
                    blue: CGFloat(0.2),
                    alpha: CGFloat(1.0)
                    ).CGColor)
            } else{
                CGContextSetFillColorWithColor(context, UIColor(
                    red: CGFloat(0.9),
                    green: CGFloat(0.0),
                    blue: CGFloat(00),
                    alpha: CGFloat(1.0)
                    ).CGColor)
            }
            
            /*    CGContextSetFillColorWithColor(context, UIColor(
            red: CGFloat(0.9),
            green: CGFloat(0.9),
            blue: CGFloat(0.9),
            alpha: CGFloat(1.0)
            ).CGColor)
            
            CGContextSetStrokeColorWithColor(context, UIColor(
            red: CGFloat(0.9),
            green: CGFloat(0.9),
            blue: CGFloat(0.9),
            alpha: CGFloat(1.0)
            ).CGColor)
            */
            
            
            //  CGContextSetLineWidth(context, 10)
          //  CGContextAddRect(context, rectangle)
            
         //   CGContextFillPath(context)
            //   CGContextStrokePath(context)
            
            CGContextRestoreGState( context)
            //   CGContextDrawPath(context, kCGPathFillStroke)
            
            
            
            
            x+=dx+2
           
        }
        
     /*   label.drawAtPoint(CGPointMake(CGFloat(5), 5.0),
            withAttributes: [NSFontAttributeName : helveticaBold!,  NSForegroundColorAttributeName: fieldColor])
        
        prompt?.drawAtPoint(CGPointMake(CGFloat(200), 5.0),
            withAttributes: [NSFontAttributeName : promptFont!,  NSForegroundColorAttributeName: fieldColor])
       */ 
        var y = 28.0
        for  str in axisLabels{
         //   str.drawAtPoint(CGPointMake(CGFloat(5), CGFloat( y)),
          //       withAttributes: [NSFontAttributeName : helveticaBold!,  NSForegroundColorAttributeName: fieldColor])
            y+=20.0
        }
        
        
        drawAnomalies(rect)
      //  drawMarker(rect)
        drawValues( rect)
    //    drawAxes (rect)
        drawYLabels (rect)

        
    }
    
    func drawAnomalies(rect: CGRect ){
         let context = UIGraphicsGetCurrentContext()!
         CGContextSaveGState( context)
        
          var bar : CGRect = CGRect()
        
        
        if (anomalies.count > 0) {
            
            
            let top = contentArea.origin.y + contentArea.size.height / 2;
            let bottom = contentArea.size.height
            
            bar.size.width = CGFloat(barWidth-1)
            bar.origin.y = bottom-5
            
           
            
            for  value in anomalies {
                if (value.0 >= Int64(data.count)) {
                    continue; // Out of range
                }
                
                let left = Double(contentArea.origin.x) + barMarginLeft + pointWidth*Double(value.0)
                
                bar.origin.x =  CGFloat(left)
                CGContextSaveGState( context)
                var color : CGColor
                //  print (value.1)
                
                let level = getLevel(DataUtils.logScale(value.1))
                //   print (level)
                if (level>=9000){
                    color = UIColor.redColor().CGColor
                    bar.size.height = -15.0
                } else if (level>4000){
                    color = UIColor.yellowColor().CGColor
                    bar.size.height = -10.0
                }else {
                    color = UIColor.greenColor().CGColor
                    bar.size.height = -5.0
                }
                
                CGContextSetFillColorWithColor(context, color)
                
              
                
                CGContextAddRect(context, bar)
                
                CGContextFillPath(context)
                CGContextRestoreGState( context)
                
                
                
               
            }
        }
    }
    
    func getLevel(value :Double)->Int{
        if (value.isNaN) {
            return 0
        }
        var intVal : Int  = abs(Int( value * 10000.0))
        if (intVal<500)
        {
            intVal = 500
        }
        return intVal
    }
    
    func drawMarker(rect: CGRect){
    
    }
    
    func drawValues( rect: CGRect){
        let context = UIGraphicsGetCurrentContext()!
        
        CGContextSaveGState( context)
        
        var points = [Double]()
        CGContextSetLineWidth(context, 2.0)
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let components: [CGFloat] = [0.0, 0.0, 1.0, 1.0]
        let color = CGColorCreate(colorSpace, components)
        
        
        
        CGContextSetStrokeColorWithColor(context, color)
        
        var x1,y1,x2,y2,y0 : Double

        if ( data.count == 0 )
        {
            return
        }
        
         points.append( Double(contentArea.origin.x) )
         points.append( (convertToPixel(self.data[0])))
         points.append(  points[0]+pointWidth/2.0)
         points.append(  (convertToPixel(self.data[0])))
        
        CGContextMoveToPoint(context, CGFloat(points[0]), CGFloat(points[1]))
        CGContextAddLineToPoint(context, CGFloat(points[2]),  CGFloat(points[3]))
        
        
        for (var i = 1; i < data.count ; i++){
            x1 = points[ (i-1)*4+2]
            y1 = points[ (i-1)*4+3]

            
            
            x2 =  Double(contentArea.origin.x) +    pointWidth / 2.0 + Double(i) * pointWidth
            y2 = convertToPixel(self.data[i])
            
            if (data[i].isNaN){
                  // Don't move the Y axis. The line will not be drawn, see #convertToPixel
                y1 = y2
            } else if ( data[i-1].isNaN){
                if ( i == 1){
                    y0 = y2
                } else{
                    // Two consecutive missing values
                    if (data[i - 2].isNaN) {
                        y0 = y2;
                    } else {
                        // Get previous data point
                        y0 = points[(i - 2) * 4 + 3]
                    }

                }
                y1 = y0 + (y2-y0) / 2.0
            }
            
            points.append(x1)
            points.append(y1)
            points.append(x2)
            points.append(y2)
            
            print ( (x1,y1, x2,y2 ))
            CGContextMoveToPoint(context, CGFloat(x1 ), CGFloat(y1))
           //  CGContextMoveToPoint(context, CGFloat(x2 ), CGFloat(rect.height))
            CGContextAddLineToPoint(context, CGFloat( x2 ),  CGFloat( y2))
                  }
        
        CGContextStrokePath(context)
        CGContextRestoreGState( context)
    }
    
    func drawAxes( rect: CGRect ){
        
        let context = UIGraphicsGetCurrentContext()
        
        CGContextSaveGState( context)
        
        CGContextSetLineWidth(context, 2.0)
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let components: [CGFloat] = [1.0, 1.0, 1.0, 1.0]
        let color = CGColorCreate(colorSpace, components)
        CGContextSetStrokeColorWithColor(context, color)
        
        
        CGContextMoveToPoint(context, rect.origin.x, 0)
        CGContextAddLineToPoint(context, rect.origin.x, rect.height)
        CGContextAddLineToPoint(context, rect.origin.x+rect.width, rect.height)
        
        CGContextStrokePath(context)
         CGContextRestoreGState( context)
    }
    
    func drawYLabels (rect: CGRect){
        let context = UIGraphicsGetCurrentContext()
        
        let fieldColor: UIColor = UIColor.whiteColor()
        let fontName = "HelveticaNeue-Bold"
        let font = UIFont(name: fontName, size: 12.0)
        
        CGContextSaveGState( context)
        var s: String = "1.0"
        
        var decimals = 0
        if ( axisInterval<1 && axisInterval > 0 ){
            decimals = Int(ceil (-log10(axisInterval)))
        }
        for (var i :Int32 = 0; i <= self.numYLabels; i++){
            let y = self.minValue+self.axisInterval*Double(i)
            
            s = DataUtils.formatDouble ( y, numDecimals: decimals)!
            
            let labelTop = convertToPixel(y) - Double( font!.lineHeight )
            
            s.drawAtPoint(CGPointMake(CGFloat(5), CGFloat( labelTop)),
                withAttributes: [NSFontAttributeName : font!,  NSForegroundColorAttributeName: fieldColor])
            
        }
        
        CGContextRestoreGState( context)


    }
    
    func  convertToPixel( value :Double)->Double {
    
        if value.isNaN{
            // Put invalid numbers outside the content area

            return  Double(contentArea.height+100)
            
        }
        
        if (self.maxValue == self.minValue){
            return Double(contentArea.maxY) - self.paddingBottom
        }

        return Double( Double(contentArea.height) - Double(contentArea.height ) * (value - self.minValue) / (self.maxValue - self.minValue))
    }
    
  
    
    
    func updateData(){
       
        refreshScale()
        self.setNeedsDisplay()
    }
    
    func refreshScale(){
        
        maxValue = -1
        minValue = Double.infinity
        for val in data{
            if (val.isNaN == false ){
           
            if val > maxValue{
                maxValue = val
            }
            if val  < minValue{
                minValue = val
            }
                
            }
        }
        
        if (self.wholeNumbers ){
             axisInterval = ceil((maxValue-minValue)/Double(self.numYLabels))
        } else{
            axisInterval = (maxValue-minValue)/Double(self.numYLabels)
        }
        
        paddingBottom = minValue == 0 ? 0 : minPadding
    }
}
