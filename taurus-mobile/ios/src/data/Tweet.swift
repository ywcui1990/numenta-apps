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


/**
* Represent one tweet
*/
class Tweet  {
    var id: String!
    var created: Int64
    var aggregated: Int64
    var userId: String!
    var userName: String!
    var text: String!
    var hasLinks: Bool
    var cannonicalText: String!
  
    var aggregatedCount: Int32
    var retweetCount: Int32
    var retweetTotal: Int32
    
    
    //  // Match "RT @tags" from the beginning of the text.
    let RT_REGEX: String = "^\\s*RT\\s+(@[a-zA-Z][_a-zA-Z0-9]*\\s*)*"
    //  // From left side – Match @, #, $ up to colon symbol
    let LEFT_HASHTAG_UP_TO_COLON_REGEX: String! = "^\\s*([@#$][a-zA-Z][_a-zA-Z0-9]*\\s?)*:\\s*"
    //  // From left side – Match @, #, $ up to last
    let LEFT_HASHTAG_UP_TO_LAST_REGEX : String =  "^\\s*([@#$][a-zA-Z][_a-zA-Z0-9]*\\s*){2,}"
    //  // From right side – Match @, #, $ when followed by letter, not a number
    let RIGHT_HASHTAG_REGEX: String = "\\s*([@#$][a-zA-Z][_a-zA-Z0-9]*\\s*)+\\s*$"
    //  // Match "http" or "https" URLs
    let LINKS_REGEX: String = "\\s*https?:\\/\\/\\S+\\s*"
    //  // Match "..." at the end of the text
    let DOT_DOT_DOT_REGEX: String = "\\s*\\.{2,}\\s*$"
    //  // Match 2 or more spaces
    let TWO_OR_MORE_SPACES_REGEX: String = "\\s+"
    

    init(id: String!, aggregated: Int64, created: Int64, userId: String!, userName: String!, text: String!, retweetTotal: Int32) {
        self.userName = userName
        self.userId = userId
        self.created = created
        //  // Make sure aggregated values are rounded to closest 5 minute interval
        self.aggregated = DataUtils.floorTo5minutes(aggregated)
        self.id = id
        self.retweetTotal = retweetTotal
        
        self.text = text;
        self.cannonicalText = text
        self.hasLinks = false
        self.aggregatedCount = 0
        self.retweetCount = 0
        /* FIXME  do all this clean up
        //  // Clean up HTML encoded text
        _text = text.replaceAll("&amp;", "&").replaceAll("&quot;", "\"").replaceAll("&lt;", "<").replaceAll("&gt;", ">")
        //  // Remove duplicate tweets using specific set of rules. See "getCannonicalText" for rules
        var rawText: String! = _text
        //  // Remove "..."
        rawText = DOT_DOT_DOT_REGEX.matcher(rawText).replaceAll("")
        //  // Remove all links
        var matcher: Matcher! = LINKS_REGEX.matcher(rawText)
        _hasLinks = matcher.find()
        if _hasLinks {
            rawText = matcher.replaceAll(" ")
        }
        //  // Remove "RT" re-tweets
        rawText = RT_REGEX.matcher(rawText).replaceAll(" ")
        //  // Remove Hash and dollar tags from the left
        matcher = LEFT_HASHTAG_UP_TO_COLON_REGEX.matcher(rawText)
        if matcher.find() {
            //  // Remove everything up to the colon
            rawText = matcher.replaceAll(" ")
        }
        else {
            //  // Keep last hash tag
            rawText = LEFT_HASHTAG_UP_TO_LAST_REGEX.matcher(rawText).replaceAll("$1")
        }
        //  // Remove hash tags from the right
        rawText = RIGHT_HASHTAG_REGEX.matcher(rawText).replaceAll(" ")
        //  // Remove line feeds and extra spaces
        rawText = TWO_OR_MORE_SPACES_REGEX.matcher(rawText).replaceAll(" ")
        _cannonicalText = rawText.replaceAll("\\n|\\r", "").trim()
        */
    }




}
