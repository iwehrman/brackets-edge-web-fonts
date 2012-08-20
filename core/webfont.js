/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, define, Mustache, $ */


define(function (require, exports, module) {
    "use strict";
    
    var apiUrlPrefix = "https://api.typekit.com/muse_v1/";

    var fontsByClass = {};
    var fontsByName = {};
    var fontsBySlug = {};
    var allFonts;
    
    
    var pickerHtml     = require("text!core/htmlContent/ewf-picker.html"),
        resultsHtml = require("text!core/htmlContent/ewf-results.html"),
        Strings        = require("core/strings");
    
    var $picker = null;
    var $results = null;
    
    var fontClassifications = ["serif", "sans-serif", "slab-serif", "script", "blackletter", "monospaced", "handmade", "decorative"];
        
    function _displayResults(families) {
        function fontClickHandler(event) {
            console.log("[ewf]", "clicked a font", $(event.target).attr("data-slug"));
        }

        if ($results) {
            $results.empty();
            $results.html(Mustache.render(resultsHtml, {Strings: Strings, families: families}));
            $(".ewf-font").click(fontClickHandler);
        }
    }
    
    function renderPicker(domElement) {
        var localizedClassifications = [];
        var i;

        function classificationClickHandler(event) {
            var classification = $(event.target).attr("data-classification");
            var families = fontsByClass[classification];
        
            // clear previously selected class
            $('#ewf-tabs a').removeClass("selected");
            // select this class
            $(event.target).addClass("selected");
            
            console.log("[ewf]", "clicked a classification", classification);
        
            _displayResults(families);
        
            // return false because these are anchor tags
            return false;
        }
        
        // map font classifications to their localized names:
        for (i = 0; i < fontClassifications.length; i++) {
            localizedClassifications.push({className: fontClassifications[i], localizedName: Strings[fontClassifications[i]]});
        }
        
        $picker = $(Mustache.render(pickerHtml, {Strings: Strings, localizedClassifications: localizedClassifications}));
        $(domElement).append($picker);

        $('#ewf-tabs a', $picker).click(classificationClickHandler);
        
        $results = $("#ewf-results", $picker);

        $('#ewf-tabs a:first').trigger('click');
    }
        
    function init(newApiUrlPrefix) {
        var d = $.Deferred();
        
        if (newApiUrlPrefix) {
            apiUrlPrefix = newApiUrlPrefix;
        }
    
        function organizeFamilies(families) {
            var f = families.families;
            var i, j;
    
            // we keep _allFonts in alphabetical order by name, so that all other
            // lists will also be in order.
            allFonts = f;
            allFonts.sort(function (a, b) { return (a.name < b.name ? -1 : 1); });
            
            fontsByClass = {};
            fontsByName = {};
            fontsBySlug = {};
            
            for (i = 0; i < f.length; i++) {
                for (j = 0; j < f[i].classifications.length; j++) {
                    if (!fontsByClass.hasOwnProperty(f[i].classifications[j])) {
                        fontsByClass[f[i].classifications[j]] = [];
                    }
                    fontsByClass[f[i].classifications[j]].push(f[i]);
                }
                
                fontsByName[f[i].name] = f[i];
                fontsBySlug[f[i].slug] = f[i];
            }
        }
        
        $.ajax({
            url: apiUrlPrefix + "families",
            dataType: 'json',
            success: function (data) {
                organizeFamilies(data);
                d.resolve();
            },
            error: function () {
                d.reject("XHR request to 'families' API failed");
            }
        });
        
        return d.promise();
                
    }
    
    exports.renderPicker = renderPicker;
    exports.init = init;
    
});