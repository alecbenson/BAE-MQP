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
  collection.renderCollection();
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

CollectionSet.renderNewCollectionForm = function() {
  getTemplateHTML('newCollection').done(function(data) {
    $(data).prependTo(dataDiv);
  });
};
