function Position(lat, lon, hae) {
  this._lat = lat;
  this._lon = lon;
  this._hae = hae;
}

Object.defineProperties(Position.prototype, {
  'lat': {
    get: function() {
      return this._lat;
    },
    set: function(lat) {
      this._lat = lat;
    }
  },
  'lon': {
    get: function() {
      return this._lon;
    },
    set: function(lon) {
      this._lon = lon;
    }
  },
  'hae': {
    get: function() {
      return this._hae;
    },
    set: function(hae) {
      this._hae = hae;
    }
  }
});

Position.fromXML = function(data) {
  var lat = data.getAttribute('lat');
  var lon = data.getAttribute('lon');
  var hae = data.getAttribute('hae');
  return new this(lat, lon, hae);
};

module.exports = Position;
