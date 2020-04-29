// RESTful API for manipulating application pages.
// Lucas Pham
//

const Page = require("../models/page");
const User = require('../models/user');
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jwt-simple');
const config = require("../configuration/config.json");

const DEBUG = true;

const secret = config.secret;

// create a route to return to a page specified by a page number
// 

router.get('/', (req,res) => {
    if(DEBUG)
        console.log("api/page entered.");
    
    if(!req.headers["x-auth"]) {
        if (DEBUG)
            console.log("No X-Auth header is found." );
        return res.status(401).json({error: "Missing X-Auth header"});
    }

    // authenticate the token
    let token = req.headers["x-auth"];
    if(DEBUG) 
        console.log("Token received: " + token);
    
    let decoded;
    try {
        if (DEBUG) 
            console.log("Decoding token...");
        decoded = jwt.decode(token, secret);
    } catch (ex) {
        if (DEBUG)
            console.log("Invalid JWT: can't decode token.");
        return res.status(401).json({ error: "Invalid JWT"});
    }

    let usr = decoded.uid;

    User.findOne({uid: usr}, (err,user) => {
        if (err) {
            if(DEBUG) 
                console.log("Server Error. Try again later.");
            return res.status(500).json({error: "Server Error: Try again later."});
        }
        
        if (DEBUG) 
            console.log("Getting page: " + req.query.pageId + " for "+ user.uid);
        
        if(user) {
            Page.findOne({pageId: req.query.pageId}, (err, page) => {
                if (err) {
                    if(DEBUG)
                        console.log("Page: " + req.query.pageId + " not found")
                    return res.status(500).json({error: "Server error: Try again later."});
                }
                
                if (page) {
                    let pagePath = path.resolve("pages/"+ page.pageName);
                    console.log(pagePath);
                    return res.status(200).sendFile(pagePath);
                } else {
                    return res.status("404").json({error: "Page not found."});
                }
            });
        } else {
            res.status(401).json({error: "User not authenticated."});
        }
    });


});

module.exports = router;