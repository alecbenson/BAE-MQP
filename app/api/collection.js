var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');

var router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

//Bind post to the handler, and catch errors
router.post('/', function(req, res) {
  console.log("Name given is " + req.body.collectionName);
  res.json(req.body);
});

module.exports = router;
