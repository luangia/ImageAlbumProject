const jwt = require("jwt-simple");
const User = require("../models/user");
const router = require("express").Router();
const bcrypt = require("bcrypt-nodejs");

const errMessage = "Invalid ID or Password";


//PLEASE PUT THIS INTO THE CONFIG FILE, THIS IS NOT SAFE!!!
const secret = "supersecret";

// Add a new user to the database
router.post("/user", function (req, res) {
    //hashing the password
    console.log(req.body);
    bcrypt.hash(req.body.password, null, null, function(err, hash) {
        console.log(req.body.uid);
        var new_user = new User({
            uid: req.body.uid,
            password: hash,
            full_name: req.body.full_name,
            date_created: new Date()
        });

        User.findOne({ uid: new_user.uid }, function (err, user) {
            if (user) {
                res.status(409).send("ID's taken.");
            } 
    
            //Check if ID is a valid email
            else if (!isEmailValid(new_user.uid)) {
                res.status(409).send("Invalid ID.");
            }
            
            //If ID is not taken and is valid
            else {
                new_user.save(function (err, new_user) {
                    if (err) {
                        res.status(400).send(err);
                    } else {
                        res.status(201);
                        //REDIRECT MAYBE????!!!
                        res.redirect("/home.html");
                    }
                });
            }
        });
    });
});


router.post("/auth", function(req, res) {
    //Get user from the database
    User.findOne({uid: req.body.uid}, function(err, user) {
        if (err) throw err;

        if(!user) {
            //Username not in the database
            res.status(401).json({error: errMessage});
        } else {
            //Does the given password hash match the database password hash?
            bcrypt.compare(req.body.password, user.password, function(err, valid) {
                if (err) {
                    res.status(400).json({error: err});
                } else if (valid) {
                    //Send back a token that contains the user's username
                    var token = jwt.encode({uid: user.uid}, secret);
                    res.json({token: token});
                } else {
                    res.status(401).json({error: errMessage});
                }
            });
        }
    });
});



function isEmailValid(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}


module.exports = router