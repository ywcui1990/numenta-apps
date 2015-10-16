//
//  TarusDBProtocol.swift
//  taurus
//
//  Created by David Matiskella on 9/11/15.
//  Copyright © 2015 Numenta. All rights reserved.
//

import Foundation

protocol TaurusDBProtocol: CoreDatabase {
    func  getTickerSymbol(instanceId : String)->String?
    func getInstanceData( instanceId : String,  from : Int64,  to : Int64) ->[Int64: AnomalyValue]?
    
}