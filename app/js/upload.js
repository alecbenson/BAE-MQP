var fs = require('fs')
var multer = require('multer');
var express = require('express');
var router = express.Router();

//Define rules for storing data
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'data/')
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
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
      res.status(500).send("Did not upload file")
      return
    }
    //Upload was successful
    res.json({
      destination: req.file.destination,
      filename: req.file.filename,
      mimetype: req.file.mimetype
    });
  });
});

module.exports = router;
