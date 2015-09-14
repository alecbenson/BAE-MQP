var express = require('express');
var router = express.Router();
var fs = require('fs');

//Bind get to retrieve data contents
router.get('/', function(req, res) {
  var files = getContents()
  res.json(files);
});

//Get the contents of the directory
function getContents() {
  var directory = "./data";
  files = fs.readdirSync(directory);
  return JSON.stringify(files);
}

module.exports = router;
