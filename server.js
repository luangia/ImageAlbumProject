const express = require('express');
const bodyParser = require('body-parser');
const Image = require("./models/image");

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

var router = express.Router();

router.use(bodyParser.json());
router.use("/", require("./api/images"));

app.use(router);

app.listen(PORT, () => {
    console.log('Listening at ' + PORT );
});