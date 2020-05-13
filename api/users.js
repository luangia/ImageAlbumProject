// RESTful API for user manipulation
// Author: Lucas Pham
//
// Notes:
// 1. Sprint 1 - add POST route to create a user account,
//               api/users - Success return: 201 Created
//                           Fail returns: 409 Conflict (Duplicate Resource)
// 2. Sprint 2 - added route to authenticate a user,
//               api/auth - Success returns: jwt token
//                          Fail returns: 401 bad username/password
// 3. Sprint 3 - api/user POST modified to create a directory for the new user's images.
//               Return: 201 Created - user created
//                       200 Failed to create a subdirectory for user
//                       409 Duplicate resource - user exists
//                       500 Server error - Try later
// 4. Sprint 4 - create a MySQL database and user the database to support functionality for
//               1. Creating a user
//               2. Authenticating a user

// Import necessary libraries
const jwt = require("jwt-simple");
const router = require("express").Router();
const bcrypt = require("bcrypt-nodejs");
const bodyParser = require("body-parser");
const config = require("../configuration/config");
const fs = require('fs');
const crypto = require('crypto');
// Importing secret key
const secret = config.secret;
// Create MySQL connection
const mysql = require("mysql");
const conn = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});

// DEBUG FLAG
const DEBUG = true;

router.use(bodyParser.json())

const errMessage = "Invalid ID or Password";

/* 
    Add a new user to the database
*/
router.post('/user', function (req, res) {
    conn.query("SELECT uid FROM user WHERE uid = ?", [req.body.uid],
        function (err, rows) {
            if (err)
                return res.status(500).json({ error: "Server Error. Try again later." });

            if (rows.length != 0) {
                if (DEBUG)
                    console.log("Duplicate check - Duplicate user found: " + req.body.uid);
                return res.status(409).send("ID's taken.");
            }

            else if (!isEmailValid(req.body.uid)) {
                console.log(req.body.uid)
                return res.status(409).send("Invalid ID.");
            }
            if (DEBUG) {
                console.log("-----USER CREATED----- ")
                console.log("User: " + req.body.uid);
                console.log("Password: " + req.body.password);
                console.log("Full Name: " + req.body.full_name);
            }

            bcrypt.hash(req.body.password, null, null, function (err, hash) {
                var new_user = {
                    uid: req.body.uid,
                    password: hash,
                    full_name: req.body.full_name
                };

                if (DEBUG) {
                    console.log("New user: " + new_user.uid);
                }
                var usrDir = crypto.createHash('sha256').update(new_user.uid).digest("hex");

                if (DEBUG) {
                    console.log("Making dir: " + usrDir + " for user " + new_user.uid);
                }
                let newDir = "pages/images/" + usrDir;
                fs.mkdir(newDir, (err) => {
                    if (err) {
                        if (DEBUG) {
                            console.log("New directory not created. ", err);
                        }
                        return res.status(400).json({ error: "Directory for " + new_user.uid + " not created." });
                    }

                    if (DEBUG) {
                        console.log("Directory created.");
                    }
                    //make the thumbnail directory
                    let subdir = newDir + "/thumbs";
                    if (DEBUG)
                        console.log("Making subdirectory for thumbnails.");

                    fs.mkdir(subdir, (err) => {
                        if (err) {
                            if (DEBUG)
                                console.log("Thumbnails directory not created.");
                            return res.status(400).json({ error: "Thumbnails directory not created." });
                        }

                        if (DEBUG)
                            console.log("Thumbnail directory created.");

                        conn.query("INSERT INTO user SET ?", new_user, (err, result) => {
                            if (err) {
                                if (DEBUG)
                                    console.log("Error inserting data into database:", err);
                                return res.status(500).json({ error: "Server Error. Please Try again" });
                            } else {
                                if (DEBUG)
                                    console.log("Successfully created user.");
                                return res.status(201).json({ success: "User created." });
                            }
                        });
                    });
                });
            });
        })
});
//})

/* 
    Authenticate a user (login)
*/
router.post("/auth", function (req, res) {
    conn.query("SELECT uid, password FROM user WHERE uid = ?", [req.body.uid]
        , function (err, rows) {
            if (DEBUG)
                console.log("Query results:", rows);
            if (err) {
                return res.status(500).json({ error: "Server Error. Try again." });
            } else {

                if (rows.length == 0) {
                    if (DEBUG)
                        console.log("User not in database");
                    return res.status(401).json({ error: errMessage });
                } else {
                    let user = rows[0];

                    bcrypt.compare(req.body.password, user.password, function (err, valid) {
                        if (err) {
                            res.status(400).json({ error: err });
                        } else if (valid) {
                            //Send back a token that contains the user's username
                            var token = jwt.encode({ uid: user.uid }, secret);
                            return res.json({ token: token });
                        } else {
                            if (DEBUG)
                                console.log("Password: " + user.password + " incorrect.");
                            return res.status(401).json({ error: errMessage });
                        }
                    });
                }
            }
        });
});

// Check if an email is in the form abc@def.ghi
function isEmailValid(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}


module.exports = router