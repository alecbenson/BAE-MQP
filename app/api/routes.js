var express = require('express');
var router = express.Router();

var multer = require('multer');
var path = require('path');
var StorageEngine = require('./StorageEngine');
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
  var collectionName = req.params.collectionName.replace(/\W/g, '');
  var collection = collectionSet.get(collectionName);

  if (collection === undefined) {
    res.status(404).send();
  } else {
    res.json(collection);
  }
});

//POST a new collection
router.post('/', function(req, res) {
  var collectionName = req.body.collectionName.replace(/\W/g, '');

  //If the collection exists already
  if (collectionSet.contains(collectionName)) {
    res.status(409).send("A collection with this name already exists.");
    //The collection will be created otherwise
  } else {
    var newCollection = collectionSet.add(collectionName);
    if (newCollection === undefined) {
      res.status(500).send("Failed to create a collection with this name.");
    }
    res.json(newCollection);
  }
});

//DELETE a collection by name
router.delete('/:collectionName', function(req, res) {
  var collectionName = req.params.collectionName.replace(/\W/g, '');
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

//DELETE a collection track by name
router.delete('/:collectionName/track/:sourceName', function(req, res) {
  var collectionName = req.params.collectionName.replace(/\W/g, '');
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
  collection = collection.deleteTrack(sourceName);
  res.json(collection);
});

//DELETE a collection graph by name
router.delete('/:collectionName/graph/:sourceName', function(req, res) {
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
  var graph = collection.deleteGraph(sourceName);
  var response = {
    "context": collection,
    "graph": graph
  };
  res.json(response);
});

//Define rules for storing data sources
var diskStorage = StorageEngine({
  destination: function(req, file, cb) {
    cb(null, getDestination(req, file));
  },
  filename: function(req, file, cb) {
    var parsed = file.originalname.replace(/\.[^/.]+$/, "");
    var count = 0;
    var dest = getDestination(req, file);
    var finalName = parsed;
    while (fs.existsSync(path.join(dest, finalName))) {
      finalName = path.join(parsed + "_" + (++count));
    }
    cb(null, finalName);
  }
});

var getDestination = function(req, file) {
  var fullPath;
  var collectionName = req.body.collectionName.replace(/\W/g, '');
  var uploadType = req.body.uploadType;
  if (uploadType == 'sage') {
    fullPath = path.join(collectionSet.dataDir, collectionName, collectionSet.graphDir);
  } else {
    fullPath = path.join(collectionSet.dataDir, collectionName, collectionSet.sourcesDir);
  }
  return fullPath;
};

//Define a handler for uploading data source files
var datahandler = multer({
  storage: diskStorage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: function(req, file, cb) {
    var accepted = ['text/xml', 'application/octet-stream'];
    if (accepted.indexOf(file.mimetype) !== -1) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
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
    var collectionName = req.body.collectionName.replace(/\W/g, '');
    var collection = collectionSet.get(collectionName);
    var uploadType = req.body.uploadType;

    var uploadInfo = {
      destination: req.file.destination,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      uploadType: uploadType
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
    var collectionName = req.body.collectionName.replace(/\W/g, '');
    cb(null, path.join(collectionSet.dataDir, collectionName, collectionSet.modelDir));
  },
  filename: function(req, file, cb) {
    cb(null, 'model.gltf');
  }
});

//Define a handler for uploading data source files
var modelhandler = multer({
  storage: modelstorage,
  limits: {
    fileSize: 1024 * 1024 * 10
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
    var collectionName = req.body.collectionName.replace(/\W/g, '');
    var collection = collectionSet.get(collectionName);
    collection.model = req.file.destination + req.file.filename;

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
