var Position = require('./Position');
var xpath = require('xpath');

function Sensor(pos) {
  this._pos = pos;
}

Object.defineProperties(Sensor.prototype, {
  'pos': {
    get: function() {
      return this._pos;
    },
    set: function(pos) {
      this._pos = pos;
    }
  }
});

Sensor.fromXML = function(data) {
  var posXML = xpath.select("./*[name()='TAF:position']", data)[0];
  var lat = posXML.getAttribute('lat');
  var lon = posXML.getAttribute('lon');
  var hae = posXML.getAttribute('hae');

  var pos = new Position(lat, lon, hae);
  return new this(pos);
};

module.exports = Sensor;
