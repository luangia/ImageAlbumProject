// db.js
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/imageDB",  {useUnifiedTopology: true, useNewUrlParser: true});
module.exports = mongoose;