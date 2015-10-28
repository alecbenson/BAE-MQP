var express = require('express');
var router = express.Router();

var multer = require('multer');
var path = require('path');
var fs = require('node-fs');
var bodyParser = require('body-parser');
var collectionSet = require('./collectionSet').collections();


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

//DELETE a collection source by name
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

//Define rules for storing data sources
var datastorage = multer.diskStorage({
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

//Define a handler for uploading data source files
var datahandler = multer({
  storage: datastorage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
}).single('file');

//Bind post to the handler, and catch errors
router.post('/upload/data', function(req, res) {
  datahandler(req, res, function(err) {
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

//Define rules for storing data
var modelstorage = multer.diskStorage({
  destination: function(req, file, cb) {
    var collectionName = req.body.collectionName;
    cb(null, collectionSet.dataDir + collectionName + collectionSet.modelDir);
  },
  filename: function(req, file, cb) {
    cb(null, 'model.gltf');
  }
});

//Define a handler for uploading data source files
var modelhandler = multer({
  storage: modelstorage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
}).single('file');

//Bind post to the handler, and catch errors
router.post('/upload/model', function(req, res) {
  modelhandler(req, res, function(err) {
    //Something went wrong
    if (err) {
      res.status(500).send("Failed to upload model: " + err);
      return;
    }
    //Upload was successful
    if (req.file === undefined) {
      res.status(500).send("No model file specified.");
      return;
    }
    var collectionName = req.body.collectionName;
    var uploadInfo = {
      destination: req.file.destination,
      filename: req.file.filename,
      mimetype: req.file.mimetype
    };

    res.json({
      collectionName: collectionName,
      file: uploadInfo
    });
  });
});

module.exports = router;
