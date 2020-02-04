const Image = require("../models/image")
const router = require("express").Router();
const multer = require('multer');
const path = require('path');

// SET STORAGE
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images')
    },
    filename: function (req, file, cb) {
      cb(null,  file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  });

// set upload object to store pictures to correct location
var upload = multer({ storage: storage })

//Upload an image and store it in a database
router.post("/", upload.single("photo"), function(req, res) {
    if (req.file) {
        console.log("File: " + req.body.photoName + " saved on.");
    } else throw 'error';

    var image = new Image({
        filename: req.file.filename,
        photo_name: req.body.photoName,
        album: req.body.album,
        upload_date: new Date()
    });

    image.save(function(err, image) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.redirect("/home.html");
        }
    });
});


//Retrieve all images from the database
router.get("/", function(req, res) {
    Image.find(function(err, images) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.json(images);
        }
    });
});

module.exports = router;

