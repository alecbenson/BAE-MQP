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
  }
});

/**
 * loads data into the data source from the given url
 * @param url - the url to load the data from
 */
TrackDataSource.prototype.loadUrl = function(url) {
  if (!Cesium.defined(url)) {
    throw new Cesium.DeveloperError('url is required.');
  }

  var name = Cesium.getFilenameFromUri(url);

  if (this._name !== name) {
    this._name = name;
    this._changed.raiseEvent(this);
  }

  var that = this;
  return Cesium.when(Cesium.loadXML(url), function(xml) {
    return that.load(xml, url);

  }).otherwise(function(error) {
    console.log(error);
    this._setLoading(false);
    that._error.raiseEvent(that, error);
    return Cesium.when.reject(error);
  });
};

TrackDataSource.prototype._getXMLPos = function(data) {
  var pos = data.getElementsByTagName('position')[0];
  var lat = Number(pos.getAttribute('lat'));
  var lon = Number(pos.getAttribute('lon'));
  var hae = Number(pos.getAttribute('hae'));
  return {"lat": lat, "lon": lon, "hae": hae};
};

/**
 * Adds a time and position dependant sample to the data source
 * @param property - the sampled position property to add the sample to
 * @param data - the data to create the sample out of
 */
TrackDataSource.prototype._addTrackSample = function(property, data) {
  var kse = data.getElementsByTagName('kse')[0];
  var p = this._getXMLPos(kse);
  var position = Cesium.Cartesian3.fromDegrees(p.lat, p.lon, p.hae);
  var t = parseInt(data.getAttribute('time'));

  var entities = this._entityCollection;
  //Epoch time
  var epoch = Cesium.JulianDate.fromIso8601('1970-01-01T00:00:00');
  var time = Cesium.JulianDate.addSeconds(epoch, t, new Cesium.JulianDate());
  property.addSample(time, position);

  //Create a point for the sample data
  var entity = {
    position: position,
    point: {
      pixelSize: 5,
      color: Cesium.Color.BLUE,
      outlineColor: Cesium.Color.CYAN,
      outlineWidth: 2,
      translucencyByDistance: new Cesium.NearFarScalar(1.0e0, 1.0, 1.0e0, 1.0)
    },
    time: time,
    ele: p.hae
  };
  entities.add(entity);
  return property;
};

/**
 * Draw all sensors on the map
 * @param data - the XML data from which to retrieve vertices from
 **/
TrackDataSource.prototype._addSensorSample = function(property, sensor) {
  var p = this._getXMLPos(sensor);
  var position = Cesium.Cartesian3.fromDegrees(p.lat, p.lon, p.hae);
  var entities = this._entityCollection;

  var entity = {
    position: position,
    point: {
      pixelSize: 15,
      color: Cesium.Color.GREEN,
      translucencyByDistance: new Cesium.NearFarScalar(1.0e0, 1.0, 1.0e0, 1.0)
    },
    ele: p.hae
  };
  entities.add(entity);
  return property;
};

/**
 * Reads through the data and determines the start and end times of the data clock
 * @param vertices - the set of vertices to scan through
 */
TrackDataSource.prototype.setTimeWindow = function() {
  var vertices = this._entityCollection.values;

  for (var i = 0; i < vertices.length; i++) {
    var time = vertices[i].time;
    if (time === undefined) {
      continue;
    }
    if (viewer.clock.earliest === undefined) {
      viewer.clock.earliest = time;
    }
    if (viewer.clock.latest === undefined) {
      viewer.clock.latest = time;
    }
    if (Cesium.JulianDate.compare(viewer.clock.earliest, time) > 0) {
      viewer.clock.earliest = time;
    }
    if (Cesium.JulianDate.compare(viewer.clock.latest, time) < 0) {
      viewer.clock.latest = time;
    }
  }
  this._clock.startTime = viewer.clock.earliest;
  this._clock.stopTime = viewer.clock.latest;
};

/**
 * Draw all vertices on the map
 * @param data - the XML data from which to retrieve vertices from
 **/
TrackDataSource.prototype.drawEntities = function(position, data) {
  var fusionFrames = data.getElementsByTagName('FusionFrame');
  var sensors = data.getElementsByTagName('sensor');

  for (var i = 0; i < sensors.length; i++) {
    var sensor = sensors[i];
    this._addSensorSample(position, sensor);
  }

  for (var j = 0; j < fusionFrames.length; j++) {
    var frame = fusionFrames[j];
    this._addTrackSample(position, frame);
  }
};

/**
 * Loads data into the datasource.
 * @param data - a JSON object with data to fill the TrackDataSource with
 */
TrackDataSource.prototype.load = function(data) {
  if (!Cesium.defined(data)) {
    throw new Cesium.DeveloperError('data is required.');
  }
  this._setLoading(true);
  var entities = this._entityCollection;
  entities.suspendEvents();
  entities.removeAll();

  //Draw all and vertices
  var position = new Cesium.SampledPositionProperty();
  this.drawEntities(position, data);

  //Set the time window of the data
  this.setTimeWindow();
  //Create a track node that follows the data track
  this.createTrackNode(position);

  //Handle appropriate cesium events
  entities.resumeEvents();
  this._changed.raiseEvent(this);
  this._setLoading(false);
};

/**
 * Creates an entity that follows the track within the data source
 * @param position - the SampledPositionProperty to create the tracking node with
 */
TrackDataSource.prototype.createTrackNode = function(position) {
  var entities = this._entityCollection;
  var entity = entities.add({
    position: position,
    point: {
      pixelSize: 20,
      color: Cesium.Color.RED,
      outlineColor: Cesium.Color.CYAN,
      outlineWidth: 2,
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
