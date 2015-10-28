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
  this.modelDir = "/model/";
}

/**
*Creates a new collection and adds it to the set of collections
* @param collectionName - the name of the collection to create
* @return the collection object that was created
*/
CollectionSet.prototype.add = function(collectionName) {
  var sanitizedName = collectionName.replace(/\W/g, '');
  if(sanitizedName === ""){
    return undefined;
  }
  this.makeCollectionDirs(sanitizedName);
  var sourcespath = this.dataDir + sanitizedName + this.sourcesDir;
  var modelpath = this.dataDir + this.modelpath;
  var newCollection = new Collection(sourcespath, modelpath, sanitizedName, []);
  this.collections[sanitizedName] = newCollection;
  return newCollection;
};

/**
*deletes a collection and removes it from the set of collections
* @param collectionName - the name of the collection to create
*/
CollectionSet.prototype.remove = function(collectionName) {
  delete this.collections[collectionName];
  this.deleteCollectionDir(collectionName);
};

/**
*Retrieves a collection with the given name
* @param collectionName - the name of the collection to retrieve
*/
CollectionSet.prototype.get = function(collectionName) {
  if(this.contains(collectionName)) {
    var collection = this.collections[collectionName];
    return collection.update();
  }
  return undefined;
};

/**
*Creates a new collection and adds it to the set of collections
* @param collectionName - the name of the collection to create
* @return the collection object that was created
*/
CollectionSet.prototype.contains = function(collectionName) {
  return (collectionName in this.collections);
};

/**
* Run at server startup - populates the list of collections
*/
CollectionSet.prototype.init = function() {
  this.checkDataDir();
  collectionNames = fs.readdirSync(this.dataDir);
  for (var index in collectionNames) {
    var name = collectionNames[index];
    var collection = Collection.get(this.dataDir, this.modelDir, name, this.sourcesDir);
    this.collections[name] = collection;
  }
};

/**
* Ensures that the data directory exists
* If it does not, it is created
*/
CollectionSet.prototype.checkDataDir = function() {
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

/**
*Creates all of the directories for a collection if they do not exist
* @param collectionName - the name of the collection to create directories for
*/
CollectionSet.prototype.makeCollectionDirs = function(collectionName) {
  //Create the sources directory for the collection
  this.makeSourcesDir(collectionName);
  this.makeModelDir(collectionName);
};

/**
*Creates the sources directory for a collection if it does not exist
* @param collectionName - the name of the collection to create directories for
*/
CollectionSet.prototype.makeSourcesDir = function(collectionName) {
  //Create the sources directory for the collection
  sourcesDir = this.dataDir + collectionName + this.sourcesDir;
  fs.mkdir(sourcesDir, 0777, true, function(err) {
    if (err) {
      console.log(err);
    }
  });
};

/**
*Creates the model directory for a collection if it does not exist
* @param collectionName - the name of the collection to create directories for
*/
CollectionSet.prototype.makeModelDir = function(collectionName) {
  //Create the model directory for the collection
  modelDir = this.dataDir + collectionName + this.modelDir;
  fs.mkdir(modelDir, 0777, true, function(err) {
    if (err) {
      console.log(err);
    }
  });
};

/**
* Deletes the collection directories that belong to the
* collection with the given name
* @param collectionName - the name of the collection to delete directories for
*/
CollectionSet.prototype.deleteCollectionDir = function(collectionName) {
  collectionPath = this.dataDir + collectionName;
  rmdir(collectionPath, function(err) {
    if (err) {
      console.log(err);
    }
  });
};

//Create a new set of collections and populate the list
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
    if(newCollection === undefined){
      res.status(500).send("Failed to create a collection with this name.");
    }
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

//DELETE a collection by name
router.delete('/:collectionName/:sourceName', function(req, res) {
  var collectionName = req.params.collectionName;
  var sourceName = req.params.sourceName;
  if (collectionName === undefined || sourceName === undefined) {
    res.status(404).send();
    return;
  }
  if (collectionSet.contains(collectionName) === false) {
    res.status(404).send();
    return;
  }
  var collection = collectionSet.get(collectionName);
  collection = collection.deleteSource(sourceName);
  res.json(collection);
});

//Define rules for storing data
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    var collectionName = req.body.collectionName;
    cb(null, collectionSet.dataDir + collectionName + collectionSet.sourcesDir);
  },
  filename: function(req, file, cb) {
    var parsed = file.originalname.replace(/\.[^/.]+$/, "");

    //Increment name if duplicates exist
    var count = 0;
    var collectionName = req.body.collectionName;
    var dest = collectionSet.dataDir + collectionName + collectionSet.sourcesDir;
    var finalName = parsed;
    while( fs.existsSync(dest + finalName) ) {
      finalName = path.join(parsed + "_" + (++count));
    }
    cb(null, finalName);
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
