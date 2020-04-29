// RESTful API for image manipulation
// Author: Lucas Pham
// Notes:

const Image = require("../models/image");
const User = require("../models/user");
const router = require("express").Router();
const multer = require('multer');
const path = require('path');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require("jwt-simple");
const config = require("../configuration/config.json");
const DEBUG = true;

const secret = config.secret;


// SET STORAGE
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'upload')
    },
    filename: function (req, file, cb) {
      cb(null,  file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  });

// set upload object to store pictures to correct location
var upload = multer({ storage: storage })

//Upload an image and store it in a database
router.post("/", upload.single("photo"), function(req, res) {
    console.log(req.body);
    if (req.file) {
        console.log("File: " + req.body.photoName + " saved on.");
    } else {
        if(DEBUG) 
            console.log({error: "Could not upload image."});
        return res.status(507).json({error: "Could not store image."});
    }

    // get auth token from X-Auth header
    // See if there's X-Auth header
    if (!req.headers["x-auth"]) {
        if(DEBUG)
            console.log("Auth error from api/images: no X-Auth header");
        return res.status(401).json({error: "Missing X-Auth header"});
    }

    //Get token from X-Auth
    let token =  req.headers["x-auth"];
    if(DEBUG) 
        console.log("Token: " + token);

    let decoded;
    try {
        if(DEBUG) 
            console.log("Decoding token...");
        decoded = jwt.decode(token, secret);
    } catch {
        if(DEBUG) 
            console.log("Invalid JWT: can't decode token.");
        return res.status(401).json({error: "Invalid JWT"});
    }

    // decode token to get user name
    if (DEBUG) 
        console.log("Image belongs to user: " + decoded.uid);

    let usr = decoded.uid;
    User.findOne({uid: usr}, (err, user) => {
        if (err) {
            if (DEBUG)
                console.log("Invalid JWT: user not found");
            return res.status(400).json({error: "Invalid JWT"});
        }

        if(DEBUG) 
            console.log("Generating the image subdirectory for: " + user.uid);
        
        // Generate the path with sha256 of usr.uid
        let userSubdir = crypto.createHash('sha256').update(user.uid).digest("hex");
        if (DEBUG)
            console.log("User Image Directory: " + userSubdir);

        // copy the mage from ./upload to ./pages/images/imagePath
        let from = "upload/" +req.file.filename;
        let to = "pages/images/" + userSubdir + "/" + req.file.filename;
        fs.rename(from, to, (err) => {
            if(err) {
                if(DEBUG)
                    console.log("Unable to move image to " + to + ".");
                return res.status(507).json({error: "Unable to upload image",
                                            errMsg: err});
            }
        });

        if(DEBUG)
            console.log("Making thumbnail for image...");
        
        let thumb = "pages/images/" + userSubdir + "/thumbs/"+ req.file.filename;

        if(DEBUG)
            console.log("Thumbnail image at: " + thumb);
        
        imageThumbnail(to)
            .then(thumbnail => { fs.writeFile(thumb, thumbnail, (err)=> {
                if (err)
                    console.log(err);
                console.log("Thumbnail created.");
            });
            }).catch(err => console.error(err));
        
        if(DEBUG)
            console.log("Image copied to subdirectory");
        

        //create new image to save in the database
        var image = new Image({
            filename: req.file.filename,
            photo_name: req.body.photoName,
            path: userSubdir,
            album: req.body.album,
            description: req.body.description,
            fstop: req.body.fstop,
            sspeed: req.body.sspeed,
            iso: req.body.iso,
            focalLength: req.body.focalLength,
            cameraType: req.body.cameraType,
            upload_date: new Date(),
            owner: user.uid
        });

        image.save(function(err, image) {
            if (err) {
                res.status(400).send(err);
            } else {
                res.status(201).json({success: "Image uploaded."});
            }
        });
    });



    
});


//Retrieve all images from the database
router.get("/", function(req, res) {
    //get the user's token
    let token = req.query.token;

    //decode the token and authenticate the user
    let decoded;
    try {
        if(DEBUG)
            console.log("Decoding the token...");
        decoded = jwt.decode(token, secret);
    } catch (ex) {
        if (DEBUG)
            console.log("Can't decode token.");
        return res.status(401).json({ error: "Invalid JWT"});
    }

    let usr = decoded.uid;
    User.findOne({uid: usr}, (err, user) => {
        if (err) {
            if (DEBUG)
                console.log("Can't find user.");
            return res.status(500).json({error: "Server error."});
        }

        if (DEBUG)
            console.log("Get images for: " + user.uid);
        
        if(user) {
            Image.find({owner: user.uid}, function(err, images) {
                if (err) {
                    res.status(400).send(err);
                } else {
                    res.status(201).json(images);
                }
            });
        } else {
            res.status(404).json({error: "User not found."})
        }
    })

    
});

module.exports = router;

