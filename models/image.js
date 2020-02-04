// models/image.js
const db = require("../db");

var Image = db.model("Image", {
    filename:  String,
    photo_name: String,
    album: String,
    upload_date: { type: Date, default: Date.now }
});

module.exports = Image;