//
//  TutorialPageController.swift
//  taurus
//
//  Created by David Matiskella on 10/2/15.
//  Copyright © 2015 Numenta. All rights reserved.
//

import Foundation

class TutorialPageController: UIViewController {
    
    @IBOutlet weak var imageView: UIImageView!
    
    var dataObject: String = ""
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    override func viewWillAppear(animated: Bool) {
        super.viewWillAppear(animated)
        var image =  UIImage(named: dataObject)
        imageView.image = image
       // self.dataLabel!.text = dataObject
    }
    
    
}
