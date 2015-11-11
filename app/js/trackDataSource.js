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
  this._entityCollection = new Cesium.EntityCollection();
  this._trackNode = undefined;
  this._position = new Cesium.SampledPositionProperty();
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
  }
});

TrackDataSource.prototype._getXMLPos = function(data) {
  var pos = data.getElementsByTagName('position')[0];
  var lat = Number(pos.getAttribute('lat'));
  var lon = Number(pos.getAttribute('lon'));
  var hae = Number(pos.getAttribute('hae'));
  return {
    "lat": lat,
    "lon": lon,
    "hae": hae
  };
};

TrackDataSource.prototype._setTrackColor = function(name) {
  try {
    var id = parseInt(name);
    var color = trackColor(id);
    return Cesium.Color.fromCssColorString(color);
  } catch (err) {
    console.log(err);
    return Cesium.Color.RED;
  }
};

/**
 * Adds a time and position dependant sample to the data source
 * @param property - the sampled position property to add the sample to
 * @param data - the data to create the sample out of
 */
TrackDataSource.prototype.addStateEstimate = function(se, time) {
  this._setLoadStatus(true);

  var kse = se.getElementsByTagName('kse')[0];
  var p = this._getXMLPos(kse);
  var covariance = kse.getAttribute('covariance');
  var formattedCovariance = formatCovariance(covariance);
  var position = Cesium.Cartesian3.fromDegrees(p.lat, p.lon, p.hae);
  var entities = this._entityCollection;

  var epoch = Cesium.JulianDate.fromIso8601('1970-01-01T00:00:00');
  var set_time = Cesium.JulianDate.addSeconds(epoch, time, new Cesium.JulianDate());
  this._position.addSample(set_time, position);

  //Create a point for the sample data
  var entity = {
    position: position,
    point: {
      pixelSize: 10,
      color: this.color,
      translucencyByDistance: new Cesium.NearFarScalar(1.0e0, 1.0, 1.0e0, 1.0),
    },
    time: set_time,
    ele: p.hae,
    description: formattedCovariance
  };
  entities.add(entity);
  this._slideTimeWindow(set_time);
  this._setLoadStatus(false);
};

/**
 * Draw all sensors on the map
 * @param data - the XML data from which to retrieve vertices from
 **/
TrackDataSource.prototype._addSensorSample = function(sensor) {
  this.setLoadStatus(true);
  var p = this._getXMLPos(sensor);
  var position = Cesium.Cartesian3.fromDegrees(p.lat, p.lon, p.hae);
  var entities = this._entityCollection;

  var entity = {
    position: position,
    billboard: {
      image: '../images/sensor.png',
      scale: 0.04,
      color: this.color,
    },
    ele: p.hae
  };
  entities.add(entity);
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
  var entities = this._entityCollection;

  if (status === true) {
    this._setLoading(true);
    entities.suspendEvents();
  } else {
    entities.resumeEvents();
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
  var entities = this._entityCollection;
  var entity = entities.add({
    position: this._position,
    point: {
      pixelSize: 20,
      color: this.color,
    }
  });

  //Also set the availability of the entity to match our simulation time.
  entity.availability = new Cesium.TimeIntervalCollection();
  entity.availability.addInterval({
    start: this._clock.startTime,
    stop: this._clock.stopTime
  });

  //Set interpolation
  entity.position.setInterpolationOptions({
    interpolationDegree: 5,
    interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
  });
  this._trackNode = entity;
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
  node = this._trackNode;
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
  var entities = this._entityCollection.values;
  for (var i = 0; i < entities.length; i++) {
    var entity = entities[i];
    if (entity.point !== undefined) {
      if (callback(entity) === true) {
        entity.point.outlineColor = Cesium.Color.YELLOW;
        entity.point.outlineWidth = 5;
      } else {
        entity.point.color = Cesium.Color.BLUE;
        entity.point.outlineColor = Cesium.Color.CYAN;
        entity.point.outlineWidth = 2;
      }
    }
  }
};

function formatCovariance(covariance) {
  var valueArray = covariance.split(' ')
  var arrayWidth = Math.sqrt(valueArray.length);
  var formattedCovariance = '<table cellpadding="6px">';
  var value;
  for(var i = 0; i < arrayWidth; i++) {
    formattedCovariance += '<tr>';
    for(var j = 0; j < arrayWidth; j++) {
      formattedCovariance += '<td align="right"> ';
      value = valueArray[arrayWidth * i + j];
      formattedCovariance += parseFloat(value).toFixed(5);
      formattedCovariance += ' </td>';
    }
    formattedCovariance += '</tr>';
  }
  formattedCovariance += '</table>';
  return formattedCovariance;
}
