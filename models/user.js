var db = require("../db");

// Create a user model from the schema
var User = db.model("User", {
    uid: { type: String, required: true},
    password: { type: String, required: true},
    full_name: { type: String, required: true},
    date_created: { type: Date, default: Date.now}
});

module.exports = User;