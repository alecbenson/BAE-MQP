function TrackDataSource(name) {
  DataSource.call(this, name);
}
TrackDataSource.prototype = Object.create(DataSource.prototype);
TrackDataSource.prototype.constructor = TrackDataSource;

/**
 * Adds a time and position dependant sample to the data source
 */
TrackDataSource.prototype.addStateEstimate = function(se, time) {

  var kse = se.getElementsByTagNameNS('*', 'kse')[0];
  var p = Collection.parsePos(kse);
  var covariance = kse.getAttribute('covariance');
  var formattedCovariance = this.formatCovariance(covariance);
  var position = Cesium.Cartesian3.fromDegrees(p.lat, p.lon, p.hae);

  var epoch = Cesium.JulianDate.fromIso8601('1970-01-01T00:00:00');
  var set_time = Cesium.JulianDate.addSeconds(epoch, time, new Cesium.JulianDate());

  this._positionProp.addSample(set_time, position);
  this._slideTimeWindow(set_time);
};
