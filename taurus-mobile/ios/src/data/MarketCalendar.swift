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

/**
* Represent Stock market open hours and holidays
*/
public class MarketCalendar {

    var workweek = [ false,true, true, true, true, true, false]
    /** FIXME right now just assume the market is open 9-4
    */
    public func isOpen (date : NSDate)->Bool {
        let calendar = NSCalendar.currentCalendar()
        
        // check day of week
        let dayOfWeek = calendar.components( (NSCalendarUnit.NSWeekdayCalendarUnit), fromDate: date)
        
        if ( workweek[ dayOfWeek.weekday - 1 ]==false){
            return false
        }
        
        let comp = calendar.components((NSCalendarUnit.NSHourCalendarUnit), fromDate: date)
        let hour = comp.hour
        if (hour>=9 && hour<=16)
        {
            return true
        }
        
        return false
    }
    
    public func isOpen (date : Int64)->Bool {
        let time = NSDate(timeIntervalSince1970: Double(date)/1000.0)
        return isOpen(time)
    }
    

}
