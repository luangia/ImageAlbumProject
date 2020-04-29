const db = require("../db");

var Page = db.model("Page", {
    pageId: Number,
    pageName: String,
    date_created: { type: Date, default: Date.now}
});

module.exports = Page;