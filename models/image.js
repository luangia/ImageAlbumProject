// models/image.js
const db = require("../db");

var Image = db.model("Image", {
    filename:  String,
    photo_name: String,
    path: String,
    album: String,
    description: String,
    fstop: String,
    sspeed: String,
    iso: String,
    focalLength: String,
    cameraType: String,
    upload_date: { type: Date, default: Date.now },
    owner: String
});

module.exports = Image;