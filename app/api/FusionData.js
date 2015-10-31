var fs = require('fs');
var path = require('path');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var FusionFrame = require('./FusionFrame');

function FusionData(filePath) {
  this._filePath = filePath;
  this._frames = [];
  this.getFrames();
}

Object.defineProperties(FusionData.prototype, {
  'filePath': {
    get: function() {
      return this._filePath;
    },
    set: function(filePath) {
      this._filePath = filePath;
    }
  },
  'frames': {
    get: function() {
      return this._frames;
    },
    set: function(frames) {
      this._frames = frames;
    }
  }
});

FusionData.prototype.loadXML = function() {
  data = fs.readFileSync(this._filePath, "utf8");
  var doc = new dom().parseFromString(data);
  return xpath.select("//*[name()='TAF:FusionFrame']", doc);
};

FusionData.prototype.getFrames = function() {
  var xmlFrames = this.loadXML();
  for( var i = 0; i < xmlFrames.length; i++) {
    var el = xmlFrames[i];
    var newFrame = FusionFrame.fromXML(el);
    this._frames.push(newFrame);
  }
};


var filePath = path.join(__dirname, 'FusionFrameExample.xml');
var fusion = new FusionData(filePath);

module.exports = FusionData;
