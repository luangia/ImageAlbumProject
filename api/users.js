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
//                       400 Failed to create a subdirectory for user
//                       409 Duplicate resource - user exists
//                       500 Server error - Try later
// 4. Sprint 4 - create a MySQL database and user the database to support functionality for
//               1. Creating a user
//               2. Authenticating a user
// 5. Sprint 5 - api/user/change - Changing password
//                                 Return: 200 Modified Successfully
//                                         400 Failed to change password
//             - api/user/delete - Delete user

// Import necessary libraries
const jwt = require("jwt-simple");
const router = require("express").Router();
const bcrypt = require("bcrypt-nodejs");
const bodyParser = require("body-parser");
const config = require("../configuration/config");
const fs = require('fs');
const fs_extra = require('fs-extra');
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
                                return res.status(201).json({ success: "User created."});
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
    if (DEBUG)
        console.log("Enter api/auth");
    conn.query("SELECT uid, password FROM user WHERE uid = ?", [req.body.uid]
        , function (err, rows) {
            // if (DEBUG)
            //     console.log("Query results:", rows);
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
                            if (DEBUG)
                                console.log("BCrypt Error.");
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

router.post("/user/change", function (req, res) {
    if (DEBUG)
        console.log("Enter api/user/change");
    //get the user's token
    let token = req.headers["x-auth"];

    //decode the token and authenticate the user
    let decoded;
    try {
        if (DEBUG)
            console.log("Decoding the token...");
        decoded = jwt.decode(token, secret);
    } catch (ex) {
        if (DEBUG)
            console.log("Can't decode token.");
        return res.status(401).json({ error: "Invalid JWT" });
    }

    let usr = decoded.uid;

    // Verify user in MySQL database
    conn.query("SELECT uid,password FROM user WHERE uid = ?", usr,
        function (err, rows) {
            if (err) {
                if (DEBUG)
                    console.log("Error while querying.");
                return res.status(500).json({ error: "Server Error. Please try again." });
            }

            if (rows.length == 0) {
                if (DEBUG)
                    console.log("User not in database");
                return res.status(401).json({ error: errMessage });
            }

            let user = rows[0].uid;
            let pass = rows[0].password;

            if (DEBUG)
                console.log("Changing password for: " + user);

            // Check if new password is same as old password
            bcrypt.compare(req.body.password, pass, function (err, valid) {
                if (err) {
                    if (DEBUG)
                        console.log("BCrypt Error.");
                    res.status(400).json({ error: err });
                } else if (valid) {
                    return res.status(304).json({ error: "Password is the same as the old one." });
                } else {
                    bcrypt.hash(req.body.password, null, null, function (err, hash) {

                        // Get all image from a particular user
                        conn.query("UPDATE user SET password=?  WHERE uid = ?", [hash, user],
                            function (err, result) {
                                if (err) {
                                    if (DEBUG) {
                                        console.log(err);
                                        console.log("Error changing passwords for users.");
                                    }
                                    return res.status(400).send(err);
                                }
                                return res.status(200).json({ success: "Password successfully updated." });
                            });
                    })
                }
            });


        });
});

// Delete account
router.get("/user/delete", function (req, res) {
    if (DEBUG)
        console.log("Enter api/user/delete");
    //get the user's token
    let token = req.query.token;

    //decode the token and authenticate the user
    let decoded;
    try {
        if (DEBUG)
            console.log("Decoding the token...");
        decoded = jwt.decode(token, secret);
    } catch (ex) {
        if (DEBUG)
            console.log("Can't decode token.");
        return res.status(401).json({ error: "Invalid JWT" });
    }

    let usr = decoded.uid;
    if(DEBUG)
        console.log("Deleting user:", usr);

    conn.query("DELETE FROM user WHERE uid=?", [usr], function(err, result) {
        if (err) {
            if (DEBUG)
                console.log("Error deleting user from database.");
            return res.status(400).send(err);
        } else {
            // Remove image directory
            if(DEBUG)
                console.log("Removing image directory...");
            var usrDir = crypto.createHash('sha256').update(usr).digest("hex");
            var newDir = 'pages/images/'+usrDir;
            fs_extra.remove(newDir, err => {
                if (err) {
                    if (DEBUG)
                        console.log("Error removing directory.");
                    return res.status(400).json({error: err});
                }

                if (DEBUG)
                    console.log("Successfully delete image folder.");
            });

            if (DEBUG) 
                console.log("Successfully deleted user.");
            return res.status(200).json({success: "User deleted successfully."});
        }
    })
});




module.exports = router