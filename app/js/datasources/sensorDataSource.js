function SensorDataSource(name) {
  DataSource.call(this, name);
}

SensorDataSource.prototype = Object.create(DataSource.prototype);
SensorDataSource.prototype.constructor = SensorDataSource;

/**
 * Adds a time and position dependant sample to the data source
 */
SensorDataSource.prototype.addSensorSample = function(s, time) {
  var p = Collection.parsePos(s);
  if(p === undefined){
    return;
  }
  var position = Cesium.Cartesian3.fromDegrees(p.lat, p.lon, p.hae);
  var epoch = Cesium.JulianDate.fromIso8601('1970-01-01T00:00:00');
  var set_time = Cesium.JulianDate.addSeconds(epoch, time, new Cesium.JulianDate());

  this._positionProp.addSample(set_time, position);
  this._slideTimeWindow(set_time);
};

/**
 * Creates an entity that follows the track within the data source
 * @param position - the SampledPositionProperty to create the tracking node with
 */
SensorDataSource.prototype.createTrackNode = function() {
  this._setLoadStatus(true);
  var entity = this.entities.add({
    position: this.positionProp,
    billboard: {
      image: '../images/sensor.png',
      scale: 0.04,
      color: this.color,
    },
    path: {
      resolution: 1,
      material: this.color,
      width: 5,
      leadTime: 5,
      trailTime: 5,
    },
    parentTrack: this.name,
  });

  //Also set the availability of the entity to match our simulation time.
  this.entities.availability = new Cesium.TimeIntervalCollection();
  this.entities.availability.addInterval({
    start: this.clock.startTime,
    stop: this.clock.stopTime
  });

  //Set interpolation
  entity.position.setInterpolationOptions({
    interpolationDegree: 5,
    interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
  });
  this.trackNode = entity;
  this._setLoadStatus(false);
};
