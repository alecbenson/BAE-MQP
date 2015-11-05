var fs = require('node-fs');
var path = require('path');

function Collection(sourcespath, modelpath, graphpath, name, sources, graphs) {
  this._sourcespath = sourcespath;
  this._modelpath = modelpath;
  this._graphpath = graphpath;
  this._name = name;
  this._sources = sources;
  this._graphs = graphs;
  this._model = undefined;
}

Object.defineProperties(Collection.prototype, {
  'model': {
    get: function() {
      try {
        var fullPath = path.join(this.modelpath, "model.gltf");
        stats = fs.lstatSync(fullPath);
        return fullPath;
      } catch (e) {
        return undefined;
      }
    },
    set: function(model) {
      this._model = model;
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
  'graphpath': {
    get: function() {
      return this._graphpath;
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
  },
  'graphs': {
    get: function() {
      return this._graphs;
    },
    set: function(graphs) {
      this._graphs = graphs;
    }
  }
});

Collection.get = function(dataDir, modelDir, name, sourcesDir, graphDir) {
  var sourcespath = path.join(dataDir, name, sourcesDir);
  var graphpath = path.join(dataDir, name, graphDir);
  var modelpath = path.join(dataDir, name, modelDir);

  var sources = fs.readdirSync(sourcespath);
  var graphs = fs.readdirSync(graphpath);
  return new Collection(sourcespath, modelpath, graphpath, name, sources, graphs);
};

Collection.prototype.toJSON = function() {
  return {
    name: this.name,
    modelpath: this.modelpath,
    model: this.model,
    sourcespath: this.sourcespath,
    sources: this.sources,
    graphs: this.graphs,
    graphpath: this.graphpath
  };
};

Collection.prototype.update = function() {
  this.sources = fs.readdirSync(this.sourcespath);
  this.graphs = fs.readdirSync(this.graphpath);
  return this;
};

Collection.prototype.deleteTrack = function(trackName) {
  var trackPath = path.join(this.sourcespath, trackName);
  fs.unlinkSync(trackPath);
  return this.update();
};

Collection.prototype.deleteGraph = function(graphName) {
  var trackPath = path.join(this.graphpath, graphName);
  var contents = fs.readFileSync(trackPath, 'utf8');
  fs.unlinkSync(trackPath);
  this.update();
  return JSON.parse(contents);
};

module.exports = Collection;
