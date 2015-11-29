var TrackDataSource = function(name) {

  this._name = name;
  this._entityCollection = new Cesium.EntityCollection();

  this._clock = new Cesium.DataSourceClock();
  this._clock.startTime = viewer.clock.startTime;
  this._clock.currentTime = viewer.clock.currentTime;
  this._clock.stopTime = viewer.clock.stopTime;
  this._clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  this._clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
  this._clock.multiplier = 1;

  this._changed = new Cesium.Event();
  this._error = new Cesium.Event();
  this._isLoading = false;
  this._loading = new Cesium.Event();
  this._trackNode = undefined;
  this._positionProp = new Cesium.SampledPositionProperty();
  this._color = this._setTrackColor(name);
};

Object.defineProperties(TrackDataSource.prototype, {
  name: {
    get: function() {
      return this._name;
    }
  },
  clock: {
    get: function() {
      return this._clock;
    }
  },
  color: {
    get: function() {
      return this._color;
    },
    set: function(color) {
      this._color = color;
    }
  },
  entities: {
    get: function() {
      return this._entityCollection;
    }
  },
  isLoading: {
    get: function() {
      return this._isLoading;
    }
  },
  changedEvent: {
    get: function() {
      return this._changed;
    }
  },
  errorEvent: {
    get: function() {
      return this._error;
    }
  },
  loadingEvent: {
    get: function() {
      return this._loading;
    }
  },
  trackNode: {
    get: function() {
      return this._trackNode;
    }
  },
  positionProp: {
    get: function() {
      return this._positionProp;
    },
    set: function(positionProp) {
      this._positionProp = positionProp;
    }
  }
});

TrackDataSource.prototype._setTrackColor = function(name) {
  try {
    var color = D3Graph.trackColor(this.name);
    return Cesium.Color.fromCssColorString(color);
  } catch (err) {
    console.log(err);
    return Cesium.Color.RED;
  }
};

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

TrackDataSource.prototype.getCovarArray = function(covariance) {
  var resultArray = [];
  var valueArray = covariance.split(' ');
  for (var i = 0; i < valueArray.length; i++) {
    var covVal = parseFloat(valueArray[i]);
    resultArray.push(covVal);
  }
  return resultArray;
};

/**
 * Draw all sensors on the map
 * @param data - the XML data from which to retrieve vertices from
 **/
TrackDataSource.prototype._addSensorSample = function(sensor) {
  this.setLoadStatus(true);
  var p = Collection.parsePos(sensor);
  var position = Cesium.Cartesian3.fromDegrees(p.lat, p.lon, p.hae);

  var entity = {
    position: position,
    billboard: {
      image: '../images/sensor.png',
      scale: 0.04,
      color: this.color,
    },
    ele: p.hae,
  };
  this.entities.add(entity);
  this.setLoadStatus(false);
};

/**
 * Reads through the data and determines the start and end times of the data clock
 * @param vertices - the set of vertices to scan through
 */
TrackDataSource.prototype._slideTimeWindow = function(new_time) {

  if (viewer.clock.earliest === undefined) {
    viewer.clock.earliest = new_time;
  }
  if (viewer.clock.latest === undefined) {
    viewer.clock.latest = new_time;
  }
  if (Cesium.JulianDate.compare(viewer.clock.earliest, new_time) > 0) {
    viewer.clock.earliest = new_time;
  }
  if (Cesium.JulianDate.compare(viewer.clock.latest, new_time) < 0) {
    viewer.clock.latest = new_time;
  }

  this._clock.startTime = viewer.clock.earliest;
  this._clock.stopTime = viewer.clock.latest;
};

/**
 * Loads data into the datasource.
 * @param data - a JSON object with data to fill the TrackDataSource with
 */
TrackDataSource.prototype._setLoadStatus = function(status) {
  if (status === true) {
    this._setLoading(true);
    this.entities.suspendEvents();
  } else {
    this.entities.resumeEvents();
    this._changed.raiseEvent(this);
    this._setLoading(false);
  }
};


/**
 * Creates an entity that follows the track within the data source
 * @param position - the SampledPositionProperty to create the tracking node with
 */
TrackDataSource.prototype.createTrackNode = function() {
  this._setLoadStatus(true);
  var entity = this.entities.add({
    position: this.positionProp,
    point: {
      pixelSize: 25,
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
    start: this._clock.startTime,
    stop: this._clock.stopTime
  });

  //Set interpolation
  entity.position.setInterpolationOptions({
    interpolationDegree: 5,
    interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
  });
  this._trackNode = entity;
  entity.description = this.formatTrackNodeDesc();
  this._setLoadStatus(false);
};

/**
 * Sets the loading status of the data source
 * @param isLoading {bool}
 */
TrackDataSource.prototype._setLoading = function(isLoading) {
  if (this._isLoading !== isLoading) {
    this._isLoading = isLoading;
    this._loading.raiseEvent(this, isLoading);
  }
};

/**
 * Sets the loading status of the data source
 * @param isLoading {bool}
 */
TrackDataSource.prototype.setTrackModel = function(location) {
  node = this.trackNode;
  if (node !== undefined) {
    node.point.show = false;
    node.model = {
      uri: location,
      minimumPixelSize: 64
    };
    node.orientation = this.orientTrackNode();
  }
};

TrackDataSource.prototype.orientTrackNode = function() {
  var node = this._trackNode;
  return new Cesium.CallbackProperty(function(time, result) {
    var currentPos = node.position.getValue(time);
    var nextSecond = Cesium.JulianDate.addSeconds(time, 1, new Cesium.JulianDate());
    var nextPos = node.position.getValue(nextSecond);

    if (!Cesium.defined(currentPos) || !Cesium.defined(nextPos)) {
      return result;
    }

    var normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(currentPos);
    var direction = Cesium.Cartesian3.subtract(nextPos, currentPos, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(direction, direction);
    var right = Cesium.Cartesian3.cross(direction, normal, new Cesium.Cartesian3());
    var up = Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3());
    Cesium.Cartesian3.cross(direction, up, right);

    var basis = new Cesium.Matrix3();
    Cesium.Matrix3.setColumn(basis, 1, Cesium.Cartesian3.negate(right, right), basis);
    Cesium.Matrix3.setColumn(basis, 0, direction, basis);
    Cesium.Matrix3.setColumn(basis, 2, up, basis);

    return Cesium.Quaternion.fromRotationMatrix(basis);
  }, false);
};

/**
 * Sets the loading status of the data source
 * @param isLoading {bool}
 */
TrackDataSource.prototype.highlightOnCondition = function(callback) {
  var entities = this.entities.values;
  for (var i = 0; i < entities.length; i++) {
    var entity = entities[i];
    if (entity.point !== undefined) {
      if (callback(entity) === true) {
        entity.point.outlineColor = Cesium.Color.YELLOW;
        entity.point.outlineWidth = 5;
      } else {
        entity.point.color = this.color;
        entity.point.outlineWidth = 0;
      }
    }
  }
};

TrackDataSource.prototype.formatCovariance = function(covariance) {
  var valueArray = covariance.split(' ');
  var arrayWidth = Math.sqrt(valueArray.length);
  var formattedCovariance = '<table cellpadding="6px">';
  formattedCovariance += '<tr><h2>Covariance</h2></tr>';
  var value;
  for (var i = 0; i < arrayWidth; i++) {
    formattedCovariance += '<tr>';
    for (var j = 0; j < arrayWidth; j++) {
      formattedCovariance += '<td align="right"> ';
      value = valueArray[arrayWidth * i + j];
      formattedCovariance += parseFloat(value).toFixed(5);
      formattedCovariance += ' </td>';
    }
    formattedCovariance += '</tr>';
  }
  formattedCovariance += '</table>';
  return formattedCovariance;
};

TrackDataSource.prototype.formatTrackNodeDesc = function() {
  var outerScope = this;
  var node = this._trackNode;
  return new Cesium.CallbackProperty(function(time, result) {
    var pos = node.position.getValue(time);
    if (pos === undefined) {
      return "Error getting position data";
    }
    var c = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pos);
    return "<div><h3>Latitude</h3>" + c.latitude +
      "<h3>Longitude</h3>" + c.longitude +
      "<h3>Elevation</h3>" + c.height +
      "</div>";
  });
};
