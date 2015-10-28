var fs = require('node-fs');

function Collection(sourcespath, modelpath, name, sources) {
  this.sourcespath = sourcespath;
  this.modelpath = modelpath;
  this.name = name;
  this.sources = sources;
}

Collection.get = function(dataDir, modelDir, name, sourcesDir) {
  var sourcespath = dataDir + name + sourcesDir;
  var modelpath = dataDir + name + modelDir;

  var sources = fs.readdirSync(sourcespath);
  return new Collection(sourcespath, modelpath, name, sources);
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
