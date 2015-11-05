var fs = require('node-fs');
var os = require('os');
var path = require('path');
var crypto = require('crypto');
var concat = require('concat-stream');
var Graph = require('./Graph');

function getFilename(req, file, cb) {
  crypto.pseudoRandomBytes(16, function(err, raw) {
    cb(err, err ? undefined : raw.toString('hex'));
  });
}

function getDestination(req, file, cb) {
  cb(null, os.tmpdir());
}

function DataStorage(opts) {
  this.getFilename = (opts.filename || getFilename);
  console.log(opts);

  if (typeof opts.destination === 'string') {
    fs.mkdirSync(opts.destination);
    this.getDestination = function($0, $1, cb) {
      cb(null, opts.destination);
    };
  } else {
    this.getDestination = (opts.destination || getDestination);
  }
}

DataStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  var uploadType = req.body.uploadType;

  if (uploadType === 'sage') {
    this._writeSageFile(req, file, cb);
  } else {
    this._writeXMLFile(req, file, cb);
  }
};

DataStorage.prototype._writeSageFile = function(req, file, cb) {
  this.getDestination(req, file, function(err, destination) {
    if (err) return cb(err);

    file.stream.pipe(concat(function(data) {
      var graph = Graph.fromSage(data.toString());
      graph.writeJSON(destination);
      cb(null, {
        destination: destination,
        filename: "graph.json",
        path: path.join(destination, "graph.json"),
      });
    }));
  });
};

DataStorage.prototype._writeXMLFile = function(req, file, cb) {
  var that = this;

  that.getDestination(req, file, function(err, destination) {
    if (err) return cb(err);

    that.getFilename(req, file, function(err, filename) {
      if (err) return cb(err);
      var finalPath = path.join(destination, filename);
      var outStream = fs.createWriteStream(finalPath);
      file.stream.pipe(outStream);
      outStream.on('error', cb);
      outStream.on('finish', function() {
        cb(null, {
          destination: destination,
          filename: filename,
          path: finalPath,
          size: outStream.bytesWritten
        });
      });
    });
  });
};

DataStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  var uploadType = req.body.uploadType;

  if (uploadType === 'sage') {
    delete file.buffer;
    cb(null);
  } else {
    var path = file.path;
    delete file.destination;
    delete file.filename;
    delete file.path;
    fs.unlink(path, cb);
  }
};

module.exports = function(opts) {
  return new DataStorage(opts);
};
