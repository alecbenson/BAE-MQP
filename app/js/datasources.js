var express = require('express');
var router = express.Router();
var fs = require('fs');

//Bind get to retrieve data contents
router.get('/', function(req, res) {
  var files = getContents()
  res.json(files);
});

router.delete('/:deleteSource', function(req, res) {
  var deleteSource = req.params.deleteSource;
  if (deleteSource == undefined) {
    res.status(404).send();
    return;
  }
  deleteDataSource(deleteSource);
  res.status(200).send();
});

//Get the contents of the directory
function getContents() {
  var directory = "./data/";
  dataDirectoryExists();
  files = fs.readdirSync(directory);
  return JSON.stringify(files);
}

//Delete the data Source provided by 'file'.
function deleteDataSource(file) {
  var path = "./data/" + file;
  deleted = fs.unlinkSync(path)
}

function dataDirectoryExists() {
  try {
    stats = fs.lstatSync("./data/");
    if(!stats.isDirectory()) {
      console.log("./data/ exists but is not a directory");
    }
  }
  catch(e) {
    console.log("./data/ does not exist. Creating now.");
    fs.mkdirSync("./data/");
  }
}

module.exports = router;
