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

/*
 class holds references to a bunch of statics factories and data
*/
class TaurusApplication : GrokApplication{
    
    static var dataFactory : TaurusDataFactory!
    static var marketCalendar : MarketCalendar = MarketCalendar()
    static var client : TaurusClient?
   
    
    static func getTaurusDatabase()->TaurusDatabase{
        return GrokApplication.database as! TaurusDatabase
    }
    
    static func getYellowBarFloor()->Double{
        return 10.0
    }
    
    static func setup(){
        dataFactory = TaurusDataFactory()
        database = TaurusDatabase( dataFactory : dataFactory)
    }
    
    static func getAggregation()->AggregationType{
        return AggregationType.Day
   }
    
    static func getTotalBarsOnChart()->Int{
        return 24
    }
    
    static func getNumberofDaysToSync()->Int{
        return 7
    }
    
    static func connectToTaurus()->TaurusClient?{
        return client
    }
    
}