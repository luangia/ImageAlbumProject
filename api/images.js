const Image = require("../models/image")
const router = require("express").Router();
const multer = require('multer');
const path = require('path');

console.log("hey");
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

console.log("hey");
//Upload an image and store it in a database
router.post("/upload", upload.single("photo"), function(req, res) {
    
    var image = new Image({
        filename: req.file.filename,
        photo_name: req.body.photoName,
        album: req.body.album,
        upload_date: new Date()
    });
    console.log("hey");

    image.save(function(err, image) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.redirect("/home.html");
        }
    });
});


//Retrieve all images from the database
router.get("/getImages", function(req, res) {
    console.log("hey");
    Image.find(function(err, images) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.json(images);
        }
    });
});

module.exports = router;
