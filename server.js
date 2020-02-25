const express = require('express');
const bodyParser = require('body-parser');
const Image = require("./models/image");
const User = require("./models/user");


const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

var router = express.Router();

router.use(bodyParser.json());
router.use("/api/images", require("./api/images"));
router.use("/api", require("./api/users"));

app.use(router);

app.listen(PORT, () => {
    console.log('Listening at ' + PORT );
});