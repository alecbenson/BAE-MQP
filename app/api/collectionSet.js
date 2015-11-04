var Collection = require('./collection');
var Graph = require('./Graph');

var fs = require('node-fs');
var rmdir = require('rimraf');
var path = require('path');

function CollectionSet(collections) {
  this.collections = {};
  this.dataDir = "./data/";
  this.sourcesDir = "/sources/";
  this.modelDir = "/model/";
  this.graphDir = "/graph/";
}

/**
 *Creates a new collection and adds it to the set of collections
 * @param collectionName - the name of the collection to create
 * @return the collection object that was created
 */
CollectionSet.prototype.add = function(collectionName) {
  var sanitizedName = collectionName.replace(/\W/g, '');
  if (sanitizedName === "") {
    return undefined;
  }
  this.makeCollectionDirs(sanitizedName);
  var sourcespath = path.join(this.dataDir,sanitizedName,this.sourcesDir);
  var modelpath = path.join(this.dataDir,collectionName,this.modelDir);
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

CollectionSet.prototype.parseData = function(collectionName, file) {
  //This method should contain logic for parsing the sage file if it is uploaded
  if(file.mimetype == 'application/octet-stream'){
    var fullPath = path.join(file.destination, file.filename);
    var graph = Graph.fromSage(fullPath);
    var graphPath = path.join(this.dataDir, collectionName, this.graphDir);
    graph.writeJSON(graphPath);
  }
};

/**
 *Retrieves a collection with the given name
 * @param collectionName - the name of the collection to retrieve
 */
CollectionSet.prototype.get = function(collectionName) {
  if (this.contains(collectionName)) {
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
  this.makeGraphDir(collectionName);
};

/**
 *Creates the sources directory for a collection if it does not exist
 * @param collectionName - the name of the collection to create directories for
 */
CollectionSet.prototype.makeSourcesDir = function(collectionName) {
  //Create the sources directory for the collection
  sourcesDir = path.join(this.dataDir,collectionName,this.sourcesDir);
  fs.mkdir(sourcesDir, 0777, true, function(err) {
    if (err) {
      console.log(err);
    }
  });
};

/**
 *Creates the graph directory for a collection if it does not exist
 * @param collectionName - the name of the collection to create directories for
 */
CollectionSet.prototype.makeGraphDir = function(collectionName) {
  //Create the sources directory for the collection
  graphDir = path.join(this.dataDir,collectionName,this.graphDir);
  fs.mkdir(graphDir, 0777, true, function(err) {
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
  modelDir = path.join(this.dataDir,collectionName,this.modelDir);
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
  collectionPath = path.join(this.dataDir,collectionName);
  rmdir(collectionPath, function(err) {
    if (err) {
      console.log(err);
    }
  });
};

module.exports = {
  collections: function() {
    var collectionSet = new CollectionSet();
    collectionSet.init();
    return collectionSet;
  }
};
