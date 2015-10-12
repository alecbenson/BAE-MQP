var Collection = require('./collection');
var express = require('express');
var router = express.Router();

var fs = require('node-fs');
var multer = require('multer');
var bodyParser = require('body-parser');
var path = require('path');
var rmdir = require('rimraf');

function CollectionSet(collections) {
  this.collections = {};
  this.dataDir = "./data/";
  this.sourcesDir = "/sources/";
}

CollectionSet.prototype.add = function(collectionName) {
  var sanitizedName = collectionName.replace(/\W/g, '');
  this.makeCollectionDir(sanitizedName);
  var path = this.dataDir + sanitizedName + this.sourcesDir;
  var newCollection = new Collection(path, sanitizedName, {});
  this.collections[sanitizedName] = newCollection;
  return newCollection;
};

CollectionSet.prototype.remove = function(collectionName) {

  delete this.collections[collectionName];
  this.deleteCollectionDir(collectionName);
};

CollectionSet.prototype.get = function(collectionName) {
  var collection = this.collections[collectionName];
  return collection.update();
};

CollectionSet.prototype.contains = function(collectionName) {
  return (collectionName in this.collections);
};

CollectionSet.prototype.init = function() {
  this.checkDataDir();
  collectionNames = fs.readdirSync(this.dataDir);
  for (var index in collectionNames) {
    var name = collectionNames[index];
    var collection = Collection.get(this.dataDir, name, this.sourcesDir);
    this.collections[name] = collection;
  }
};

CollectionSet.prototype.checkDataDir = function(name) {
  try {
    stats = fs.lstatSync(this.dataDir);
    if (!stats.isDirectory()) {
      console.log("./data/ exists but is not a directory");
    }
  } catch (e) {
    console.log("./data/ does not exist. Creating now.");
    fs.mkdirSync(this.dataDir);
  }
};

CollectionSet.prototype.makeCollectionDir = function(name) {
  collectionPath = this.dataDir + name + this.sourcesDir;
  fs.mkdir(collectionPath, 0777, true, function(err) {
    if (err) {
      console.log(err);
    }
  });
};

CollectionSet.prototype.deleteCollectionDir = function(name) {
  collectionPath = this.dataDir + name;
  rmdir(collectionPath, function(err) {
    if (err) {
      console.log(err);
    }
  });
};

var collectionSet = new CollectionSet();
collectionSet.init();

router.use(bodyParser.urlencoded({
  extended: false
}));
router.use(bodyParser.json());

//GET all collections
router.get('/', function(req, res) {
  var result = JSON.stringify(collectionSet.collections);
  res.json(result);
});

//GET a collection with the given name
router.get('/:collectionName', function(req, res) {
  var collectionName = req.params.collectionName;
  var collection = collectionSet.get(collectionName);

  if (collection === undefined) {
    res.status(404).send();
  } else {
    res.json(collection);
  }
});

//POST a new collection
router.post('/', function(req, res) {
  var collectionName = req.body.collectionName;

  //If the collection exists already
  if (collectionSet.contains(collectionName)) {
    res.status(409).send("A collection with this name already exists.");
    //The collection will be created otherwise
  } else {
    var newCollection = collectionSet.add(collectionName);
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
  if (collectionSet.contains(collectionName) === false) {
    res.status(404).send();
    return;
  }
  collectionSet.remove(collectionName);
  res.status(200).send();
});

//Define rules for storing data
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    var collectionName = req.body.collectionName;
    cb(null, collectionSet.dataDir + collectionName + collectionSet.sourcesDir);
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
    var collection = collectionSet.get(collectionName);

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
