// RESTful API for manipulating application pages.
// Lucas Pham
//
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jwt-simple');
const config = require("../configuration/config.json");

const DEBUG = true;

const secret = config.secret;

//TOGLE NoSQL and MySQL
// const Page = require("../models/page");
// const User = require('../models/user');
const mysql = require("mysql");
const conn = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});

// create a route to return to a page specified by a page number
/* router.get('/', (req,res) => {
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
            return res.status(401).json({error: "User not authenticated."});
        }
    });
}); */

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

    conn.connect((err) => {
        if(err) {
            if(DEBUG)
                console.log("Error connecting to MySQL:", err);
            return res.status(500).json({error: "Server Error. Try again later."});
        }

        if(DEBUG)
            console.log("Connection established.");

        conn.query("SELECT * FROM user WHERE uid = ?", [usr], 
        function(err, rows) {
            if (err) {
                if(DEBUG)
                    console.log(err);
                return res.status(500).json({error: "Server Error: Try again later."});
            }



            if (rows.length == 0) {
                if (DEBUG)
                    console.log("User not found");
                return res.status(400).json({error: "User not authenticated."});
            }

            let user = rows[0];

            if (DEBUG) 
                console.log("Getting page: " + req.query.pageId + " for "+ user.uid);
            
            conn.query("SELECT * FROM page WHERE pageId = ?", req.query.pageId, 
            function(err, rows) {
                if (err) {
                    if(DEBUG)
                        console.log("Page: " + req.query.pageId + " not found")
                    return res.status(500).json({error: "Server error: Try again later."});
                }

                if(DEBUG)
                    console.log("Connection ended");
                conn.end();

                if (rows.length == 0) {
                    if (DEBUG)
                        console.log("Page not found");
                    return res.status(404).json({error: "Page not found"});
                }

                let page = rows[0];
                let pagePath = path.resolve("pages/"+ page.pageName);
                console.log(pagePath);
                return res.status(200).sendFile(pagePath);

            })
        })
    });


});

module.exports = router;