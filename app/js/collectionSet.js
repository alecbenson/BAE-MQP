function CollectionSet(div) {
  this._collections = {};
  this._div = div;
}

Object.defineProperties(CollectionSet.prototype, {
  'collections': {
    get: function() {
      return this._collections;
    },
    set: function(collections) {
      this._collections = collections;
    },
  },
  'div': {
    get: function() {
      return this._div;
    },
    set: function(div) {
      this._div = div;
    }
  }
});

/**
 * Makes a GET request to the server to retrieve all collections
 */
CollectionSet.prototype.getCollections = function() {
  var outerScope = this;
  $.ajax({
    url: "/collections/",
    type: "GET",
    dataType: "JSON",
    processData: false,
    contentType: false,
    success: function(data, status) {
      var results = JSON.parse(data);
      outerScope.populateCollections(results);
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
};

CollectionSet.prototype.populateCollections = function(json) {
  for (var name in json) {
    var c = json[name];
    var collection = new Collection(c, name);
    this.addCollection(collection);
  }
};

CollectionSet.prototype.addCollection = function(collection) {
  collection.renderCollection(this.div);
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

CollectionSet.prototype.renderNewCollectionForm = function() {
  var outerScope = this;
  getTemplateHTML('newCollection').done(function(data) {
    $(data).prependTo(outerScope.div);
  });
};
