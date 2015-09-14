var multer = require('multer');
var express = require('express');
var router = express.Router();

//Code to handle uploading of data files to the server
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'data/')
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
});

router.use(multer({
  storage: storage
}).single('file'));

router.post('/', function(req, res) {
  res.status(204).end()
});

module.exports = router
