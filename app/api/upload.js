var fs = require('fs');
var multer = require('multer');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var dataDir = "./data/";
var sourcesDir = "/sources/";

router.use(bodyParser.urlencoded({
  extended: false
}));
router.use(bodyParser.json());

//Define rules for storing data
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    var collectionName = req.body.collectionName;
    cb(null, dataDir + collectionName + sourcesDir);
  },
  filename: function(req, file, cb) {
    var parsed = file.originalname.replace(/\.[^/.]+$/, "");
    cb(null, parsed + '-' + Date.now());
  }
});

//Define a handler for uploading files
var handler = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
}).single('file');

//Bind post to the handler, and catch errors
router.post('/', function(req, res) {
  handler(req, res, function(err) {
    //Something went wrong
    if (err) {
      res.status(500).send("Failed to upload file: " + err);
      return;
    }
    //Upload was successful
    if (req.file === undefined) {
      res.status(500).send("No file specified.");
      return;
    }
    res.json({
      destination: req.file.destination,
      filename: req.file.filename,
      mimetype: req.file.mimetype
    });
  });
});

module.exports = router;
