var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var fs = require('fs');
var dataDir = "./data/"

router.use(bodyParser.urlencoded({
  extended: false
}));
router.use(bodyParser.json());

//Bind get to retrieve data contents
router.get('/', function(req, res) {
  var files = getContents();
  res.json(files);
});

//Post function for creating a new collection
router.post('/', function(req, res) {
  dataDirectoryExists();

  var collectionName = req.body.collectionName;
  newCollection(collectionName);
  res.json(req.body);
});

router.delete('/:deleteSource', function(req, res) {
  var deleteSource = req.params.deleteSource;
  if (deleteSource === undefined) {
    res.status(404).send();
    return;
  }

  deleteCollection(deleteSource);
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
function deleteCollection(collectionName) {
  var path = dataDir + collectionName;
  console.log(path);
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      console.log(curPath);
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteCollection(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

function dataDirectoryExists() {
  try {
    stats = fs.lstatSync("./data/");
    if (!stats.isDirectory()) {
      console.log("./data/ exists but is not a directory");
    }
  } catch (e) {
    console.log("./data/ does not exist. Creating now.");
    fs.mkdirSync(dataDir);
  }
}

function newCollection(name) {
  collectionPath = dataDir + name;
  try {
    stats = fs.lstatSync(collectionPath);
  } catch (e) {
    //Collection directory does not exist
    fs.mkdirSync(collectionPath)
  }
}

module.exports = router;
