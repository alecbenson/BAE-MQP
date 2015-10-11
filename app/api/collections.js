var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var fs = require('node-fs');
var path = require('path');
var rmdir = require('rimraf');

var dataDir = "./data/";
var sourcesDir = "/sources/";

router.use(bodyParser.urlencoded({
  extended: false
}));
router.use(bodyParser.json());

//Bind get to retrieve data contents
router.get('/:collectionName', function(req, res) {

  var collectionName = req.params.collectionName;
  var sources = getCollectionSources(collectionName);
  res.json(sources);
});

//Bind get to retrieve data contents
router.get('/', function(req, res) {
  var collections = getCollections();
  res.json(collections);
});

//Post function for creating a new collection
router.post('/', function(req, res) {
  dataDirectoryExists();

  var collectionName = req.body.collectionName;
  newCollection(collectionName);
  res.json(req.body);
});

//Delete function for removing a collection
router.delete('/:collectionName', function(req, res) {
  var collectionName = req.params.collectionName;
  if (collectionName === undefined) {
    res.status(404).send();
    return;
  }

  var path = dataDir + collectionName;
  rmdir(path, function(err) {
    if (err) {
      res.status(500).send("Failed to delete collection.");
      return;
    }
  });
  res.status(200).send();
});

//Get all sources belonging to the collection
function getCollectionSources(collectionName) {
  dataDirectoryExists();

  //If the collection does not exist, return a 404.
  if (!collectionExists(collectionName)) {
    res.status(404).send();
  }

  var sourcePath = dataDir + collectionName + sourcesDir;
  sources = fs.readdirSync(sourcePath);
  return JSON.stringify(sources);
}

//Get all sources belonging to the collection
function getCollections() {
  dataDirectoryExists();
  collections = fs.readdirSync(dataDir);
  return JSON.stringify(collections);
}

function dataDirectoryExists() {
  try {
    stats = fs.lstatSync(dataDir);
    if (!stats.isDirectory()) {
      console.log("./data/ exists but is not a directory");
    }
  } catch (e) {
    console.log("./data/ does not exist. Creating now.");
    fs.mkdirSync(dataDir);
  }
}

function collectionExists(collectionName) {
  var collectionPath = dataDir + collectionName;
  try {
    stats = fs.lstatSync(collectionPath);
    if (!stats.isDirectory()) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
  return true;
}

function newCollection(name) {
  collectionPath = dataDir + name + sourcesDir;
  fs.mkdir(collectionPath, 0777, true, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

module.exports = router;
