// RESTful API for image manipulation
// Author: Lucas Pham
// Notes:

// Importing Libraries
const router = require("express").Router();
const multer = require('multer');
const path = require('path');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require("jwt-simple");
const config = require("../configuration/config.json");
// Debug
const DEBUG = true;
// Secret Key
const secret = config.secret;
// MySQL connection
const mysql = require("mysql");
const conn = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});

// SET STORAGE
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

// set upload object to store pictures to correct location
var upload = multer({ storage: storage })


/*
    Upload an image and store it in a database
    POSTing a photo
*/
router.post("/", upload.single("photo"), function (req, res) {
    if (req.file) {
        console.log("File: " + req.body.photoName + " saved on.");
    } else {
        if (DEBUG)
            console.log({ error: "Could not upload image." });
        return res.status(507).json({ error: "Could not store image." });
    }

    // get auth token from X-Auth header
    // See if there's X-Auth header
    if (!req.headers["x-auth"]) {
        if (DEBUG)
            console.log("Auth error from api/images: no X-Auth header");
        return res.status(401).json({ error: "Missing X-Auth header" });
    }

    //Get token from X-Auth
    let token = req.headers["x-auth"];
    if (DEBUG)
        console.log("Token: " + token);

    // decode token to get user name
    let decoded;
    try {
        if (DEBUG)
            console.log("Decoding token...");
        decoded = jwt.decode(token, secret);
    } catch {
        if (DEBUG)
            console.log("Invalid JWT: can't decode token.");
        return res.status(401).json({ error: "Invalid JWT" });
    }


    if (DEBUG)
        console.log("Image belongs to user: " + decoded.uid);

    let usr = decoded.uid;

    // MySQL query to verify users
    conn.query("SELECT * from user WHERE uid = ?", [usr],
        function (err, rows) {
            if (err)
                return res.status(400).json({ error: "Server Error. Try again later." });

            if (rows.length == 0) {
                if (DEBUG)
                    console.log("User not found");
                return res.status(400).json({ error: "Invalid JWT" });
            }


            const user = rows[0];
            if (DEBUG)
                console.log("Generating the image subdirectory for: " + user.uid);

            // Generate the path with sha256 of usr.uid
            let userSubdir = crypto.createHash('sha256').update(user.uid).digest("hex");
            if (DEBUG)
                console.log("User Image Directory: " + userSubdir);

            // copy the mage from ./upload to ./pages/images/imagePath
            let from = "upload/" + req.file.filename;
            let to = "pages/images/" + userSubdir + "/" + req.file.filename;
            fs.rename(from, to, (err) => {
                if (err) {
                    if (DEBUG)
                        console.log("Unable to move image to " + to + ".");
                    return res.status(507).json({
                        error: "Unable to upload image",
                        errMsg: err
                    });
                }
            });

            // Making thumbnails
            if (DEBUG)
                console.log("Making thumbnail for image...");

            let thumb = "pages/images/" + userSubdir + "/thumbs/" + req.file.filename;

            if (DEBUG)
                console.log("Thumbnail image at: " + thumb);

            imageThumbnail(to)
                .then(thumbnail => {
                    fs.writeFile(thumb, thumbnail, (err) => {
                        if (err)
                            console.log(err);
                        console.log("Thumbnail created.");
                    });
                }).catch(err => console.error(err));

            if (DEBUG)
                console.log("Image copied to subdirectory");

            //create new image to save in the database
            let image = {
                filename: req.file.filename,
                photo_name: req.body.photoName,
                path: userSubdir,
                album: req.body.album,
                description: req.body.description,
                f_stop: req.body.fstop,
                s_speed: req.body.sspeed,
                iso: req.body.iso,
                focus_len: req.body.focalLength,
                camera: req.body.cameraType,
                upload_date: new Date(),
                owner: user.userId
            }

            // Uploading image into database
            conn.query("INSERT INTO image SET ?", image, (err, result) => {
                if (err) {
                    if (DEBUG)
                        console.log("Error inserting image into database:", err);
                    return res.status(400).json({ error: "Server Error. Please Try again" });
                }

                if (DEBUG)
                    console.log("Successfully added image.");

                return res.status(201).json({ success: "Image uploaded." });
            })
        });
});


/* 
    Retrieve all images from the database
    GET all images
*/
router.get("/", function (req, res) {
    //get the user's token
    let token = req.query.token;

    //decode the token and authenticate the user
    let decoded;
    try {
        if (DEBUG)
            console.log("Decoding the token...");
        decoded = jwt.decode(token, secret);
        console.log("User:", decoded);
    } catch (ex) {
        if (DEBUG)
            console.log("Can't decode token.");
        return res.status(401).json({ error: "Invalid JWT" });
    }

    let usr = decoded.uid;

    // Verify user in MySQL database
    conn.query("SELECT uid FROM user WHERE uid = ?", usr,
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

            if (DEBUG)
                console.log("Get images for: " + user);

            // Get all image from a particular user
            conn.query("SELECT * FROM image JOIN user ON owner = userId  WHERE uid = ?", [user],
                function (err, rows) {
                    if (err) {
                        if (DEBUG) {
                            console.log(err);
                            console.log("Error getting image for users.");
                        }

                        return res.status(400).send(err);
                    }

                    return res.status(201).json(rows);
                })
        })
});

module.exports = router;

