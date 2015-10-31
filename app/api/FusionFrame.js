var Position = require('./Position');
var Sensor = require('./Sensor');
var xpath = require('xpath');

function FusionFrame(trackId, sensor, time, pos, covariance) {
  this._trackId = trackId;
  this._sensor = sensor;
  this._time = time;
  this._pos = pos;
  this._covariance = covariance;
}

Object.defineProperties(FusionFrame.prototype, {
  'trackId': {
    get: function() {
      return this._trackId;
    },
    set: function(trackId) {
      this._trackId = trackId;
    }
  },
  'sensor': {
    get: function() {
      return this._sensor;
    },
    set: function(sensor) {
      this._sensor = sensor;
    }
  },
  'time': {
    get: function() {
      return this._time;
    },
    set: function(time) {
      this._time = time;
    }
  },
  'pos': {
    get: function() {
      return this._pos;
    },
    set: function(pos) {
      this._pos = pos;
    }
  },
  'covariance': {
    get: function() {
      return this._covariance;
    },
    set: function(covariance) {
      this._covariance = covariance;
    }
  }
});

FusionFrame.fromXML = function(data) {
  //Get the time from the XML data
  var t = data.getAttribute('time');

  //Get the sensor info from the XML data
  var sensorXML = xpath.select("./*[name()='TAF:sensor']", data)[0];
  var sensor = Sensor.fromXML(sensorXML);

  var stateEstimateXML = xpath.select("./*[name()='TAF:stateEstimate']", data)[0];
  var id = stateEstimateXML.getAttribute('trackId');

  var kseXML = xpath.select("./*[name()='TAF:kse']", stateEstimateXML)[0];
  var cv_str = kseXML.getAttribute('covariance').split(' ');
  var covar = cv_str.map(parseFloat);
  var positionXML = xpath.select("./*[name()='RIVETsCommon:position']", kseXML)[0];
  var pos = Position.fromXML(positionXML);

  return new this(id,sensor,t,pos,covar);
};

module.exports = FusionFrame;
