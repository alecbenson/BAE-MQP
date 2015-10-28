var fs = require('node-fs');

function Collection(sourcespath, modelpath, name, sources) {
  this._sourcespath = sourcespath;
  this._modelpath = modelpath;
  this._name = name;
  this._sources = sources;
}

Object.defineProperties(Collection.prototype, {
  'model': {
    get: function() {
      try {
        fullPath = this.modelpath + "model.gltf";
        stats = fs.lstatSync(fullPath);
        return fullPath;
      } catch (e) {
        return undefined;
      }
    }
  },
  'sourcespath': {
    get: function() {
      return this._sourcespath;
    }
  },
  'modelpath': {
    get: function() {
      return this._modelpath;
    }
  },
  'name': {
    get: function() {
      return this._name;
    }
  },
  'sources': {
    get: function() {
      return this._sources;
    },
    set: function(sources) {
      this._sources = sources;
    }
  }
});

Collection.get = function(dataDir, modelDir, name, sourcesDir) {
  var sourcespath = dataDir + name + sourcesDir;
  var modelpath = dataDir + name + modelDir;

  var sources = fs.readdirSync(sourcespath);
  return new Collection(sourcespath, modelpath, name, sources);
};

Collection.prototype.toJSON = function() {
  return {
    name: this.name,
    modelpath: this.modelpath,
    model: this.model,
    sourcespath: this.sourcespath,
    sources: this.sources,
  };
};

Collection.prototype.update = function() {
  this.sources = fs.readdirSync(this.sourcespath);
  return this;
};

Collection.prototype.deleteSource = function(sourceName) {
  fs.unlinkSync(this.sourcespath + sourceName);
  return this.update();
};

module.exports = Collection;
