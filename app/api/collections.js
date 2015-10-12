var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var fs = require('node-fs');
var path = require('path');
var rmdir = require('rimraf');
var multer = require('multer');


var dataDir = "./data/";
var sourcesDir = "/sources/";

function Collection(name, sources) {
  this.name = name;
  this.sources = sources;
  this.location = dataDir + name + sourcesDir;
}

Collection.get = function(collectionName) {
  if (!this.exists(collectionName)) {
    return new Collection(collectionName, []);
  }
  var sourcePath = dataDir + collectionName + sourcesDir;
  var sources = fs.readdirSync(sourcePath);

  return new Collection(collectionName, sources);
};

//Get all sources belonging to the collection
Collection.getAll = function() {
  dataDirectoryExists();
  collections = [];

  //Read all folders in the data directory
  collectionNames = fs.readdirSync(dataDir);
  for (var index in collectionNames) {
    var name = collectionNames[index];
    var collection = this.get(name);
    collections.push(collection);
  }
  return collections;
};

Collection.exists = function(collectionName) {
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
};

Collection.makeCollectionDir = function(name) {
  collectionPath = dataDir + name + sourcesDir;
  fs.mkdir(collectionPath, 0777, true, function(err) {
    if (err) {
      console.log(err);
    }
  });
};

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

router.use(bodyParser.urlencoded({
  extended: false
}));
router.use(bodyParser.json());

//GET a collection with the given name
router.get('/:collectionName', function(req, res) {
  var collectionName = req.params.collectionName;
  var collection = Collection.get(collectionName);
  res.json(collection);
});

//GET all collections
router.get('/', function(req, res) {
  var collections = Collection.getAll();
  res.json(JSON.stringify(collections));
});

//POST a new collection
router.post('/', function(req, res) {
  dataDirectoryExists();
  var collectionName = req.body.collectionName;

  if (Collection.exists(collectionName)) {
    res.status(409).send("A collection with this name already exists.");
  } else {
    Collection.makeCollectionDir(collectionName);
    var newCollection = new Collection(collectionName, []);
    res.json(newCollection);
  }
});

//DELETE a collection by name
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
router.post('/upload', function(req, res) {
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
    var collectionName = req.body.collectionName;
    var collection = Collection.get(collectionName);

    var uploadInfo = {
      destination: req.file.destination,
      filename: req.file.filename,
      mimetype: req.file.mimetype
    };

    res.json({
      context: collection,
      file: uploadInfo
    });
    
  });
});

module.exports = router;
