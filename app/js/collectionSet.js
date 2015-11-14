var collectionSet = new CollectionSet();
var dataDiv = "#collections";

function CollectionSet() {
  this._collections = {};
}

Object.defineProperties(CollectionSet.prototype, {
  'collections': {
    get: function() {
      return this._collections;
    },
    set: function(collections) {
      this._collections = collections;
    }
  }
});

CollectionSet.prototype.populateCollections = function(json) {
  for (var name in json) {
    var c = json[name];
    var collection = new Collection(c, name);
    this.addCollection(collection);
  }
};

CollectionSet.prototype.addCollection = function(collection) {
  this.renderCollection(collection);
  this.collections[collection.name] = collection;
};

CollectionSet.prototype.deleteCollection = function(collection) {
  delete this.collections[collection.name];
};

CollectionSet.prototype.getCollection = function(collectionName) {
  return this.collections[collectionName];
};

CollectionSet.prototype.findTrackByID = function(trackID) {
  var idString = trackID.toString();
  for (var name in this.collections) {
    var collection = this.getCollection(name);
    for (var sourceName in collection.tracks) {
      var sourceTracks = collection.tracks[sourceName];
      if (idString in sourceTracks) {
        return collection.tracks[sourceName][idString];
      }
    }
  }
  return undefined;
};

CollectionSet.prototype.renderAllCollections = function() {
  $(dataDiv).empty();
  //Loop through each file to render
  for (var key in this.collections) {
    var collection = this.collections[key];
    //Append the template to the div
    this.renderCollection(collection);
  }
};

CollectionSet.prototype.renderCollection = function(collection) {
  //Append the template to the div
  var outerScope = this;
  getTemplateHTML('dataCollection').done(function(data) {
    var templated = applyTemplate(data, collection);
    var target = $(templated).prependTo(dataDiv);
    collection.renderSources(collection);
  });
  this.loadCollection(collection);
};

/**
 * Given a data file, create a new data source and draw the result in cesium
 * @param file - an data file to render in cesium
 */
CollectionSet.prototype.loadCollection = function(collection) {
  var collectionName = collection.name;
  var model = collection.model;

  $.each(collection.sources, function(index, sourceName) {
    var sourcespath = collection.sourcespath;
    collection.loadTrackFile(sourcespath + sourceName, sourceName);
  });
  $.each(collection.graphs, function(index, graphName) {
    var graphFilePath = collection.graphpath + graphName;
    graph.loadGraphFile(graphFilePath);
  });
};

CollectionSet.renderNewCollectionForm = function() {
  getTemplateHTML('newCollection').done(function(data) {
    $(data).prependTo(dataDiv);
  });
};
