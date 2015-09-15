var express = require('express');
var router = express.Router();
var fs = require('fs');

//Bind get to retrieve data contents
router.get('/', function(req, res) {
  var files = getContents()
  res.json(files);
});

router.delete('/', function(req, res) {
  var deleteSource = req.params.file;
  if (deleteSource == undefined) {
    res.status(404).send()
    return;
  }
  var del = deleteDataSource(deleteDataSource)
  req.json(del);
});

//Get the contents of the directory
function getContents() {
  var directory = "./data/";
  files = fs.readdirSync(directory);
  return JSON.stringify(files);
}

//Delete the data Source
function deleteDataSource(file) {
  var path = "./data/" + file;
  deleted = fs.unlinkSync(file)
  return JSON.stringify(file)
}

module.exports = router;
