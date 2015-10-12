var fs = require('node-fs');

function Collection(path, name, sources) {
  this.path = path;
  this.name = name;
  this.sources = sources;
}

Collection.get = function(dataDir, name, sourcesDir) {
  var path = dataDir + name + sourcesDir;
  var sources = fs.readdirSync(path);
  return new Collection(path, name, sources);
};

Collection.prototype.update = function() {
  this.sources = fs.readdirSync(this.path);
  return this;
};

Collection.prototype.deleteSource = function(sourceName) {
  fs.unlinkSync(this.path + sourceName);
  return this.update();
};

module.exports = Collection;
