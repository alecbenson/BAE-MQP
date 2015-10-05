var TrackDataSource = function(name) {

  this._name = name;
  this._entityCollection = new Cesium.EntityCollection;
  this._clock = new Cesium.DataSourceClock();
  this._clock.startTime = Cesium.JulianDate.fromIso8601("2015-10-03");
  this._clock.stopTime = Cesium.JulianDate.fromIso8601("2015-10-04");
  this._clock.currentTime = Cesium.JulianDate.fromIso8601("2015-10-03");
  this._clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  this._clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
  this._clock.multiplier = 1;
  this._changed = new Cesium.Event();
  this._error = new Cesium.Event();
  this._isLoading = false;
  this._loading = new Cesium.Event();
  this._entityCollection = new Cesium.EntityCollection();
  this._heightScale = 100;
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
  },
  heightScale: {
    get: function() {
      return this._heightScale;
    },
    set: function(value) {
      if (value > 0) {
        throw new Cesium.DeveloperError('value must be greater than 0');
      }
      this._heightScale = value;
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
  return Cesium.when(Cesium.loadJson(url), function(json) {
    return that.load(json, url);

  }).otherwise(function(error) {

    console.log(error);
    this._setLoading(false);
    that._error.raiseEvent(that, error);
    return Cesium.when.reject(error);

  });
};

/**
 * Draws an edge with connecting the two vertexes specified in the edge object
 * @param edge - the edge object to read from
 */
TrackDataSource.prototype.connect = function(edge) {
  var entities = this._entityCollection;
  var first = edge.id_a;
  var other = edge.id_b;


  var v1 = entities.getById(first);
  var v2 = entities.getById(other);

  var newEdge = entities.add({
    name: 'Edge connecting ' + first + " with " + other,
    polyline: {
      positions: [v1.position.getValue(), v2.position.getValue()],
      width: edge.weight,
      material: new Cesium.PolylineOutlineMaterialProperty({
        color: Cesium.Color.BLUE,
      })
    }
  });
}

/**
 * Adds a time and position dependant sample to the data source
 * @param property - the sampled position property to add the sample to
 * @param data - the data to create the sample out of
 */
TrackDataSource.prototype.addSample = function(property, data) {
  var entities = this._entityCollection;
  var position = Cesium.Cartesian3.fromDegrees(data.lon, data.lat, data.ele);
  var time = Cesium.JulianDate.fromIso8601(data.time);
  property.addSample(time, position);

  //Create a point for the sample data
  var entity = entities.add({
    id: data.id,
    name: "Point " + data.id,
    position: position,
    point: {
      pixelSize: 5,
      color: Cesium.Color.BLUE,
      outlineColor: Cesium.Color.CYAN,
      outlineWidth: 2,
    }
  });
  return property;
}

/**
 * Reads through the data and determines the start and end times of the data clock
 * @param vertices - the set of vertices to scan through
 */
TrackDataSource.prototype.setTimeWindow = function(vertices) {
  currentStart = undefined;
  currentStop = undefined;

  for (var i = 0; i < vertices.length; i++) {
    var time = Cesium.JulianDate.fromIso8601(vertices[i].time);
    if (currentStart == undefined) {
      currentStart = time
      continue;
    }
    if (currentStop == undefined) {
      currentStop = time
      continue;
    }

    if (Cesium.JulianDate.compare(currentStart, time) > 0) {
      currentStart = time
    }

    if (Cesium.JulianDate.compare(currentStart, time) < 0) {
      currentStop = time
    }
  }

  this._clock.startTime = currentStart;
  this._clock.stopTime = currentStop;
  this._clock.clockRange = Cesium.ClockRange.LOOP_STOP;
}

/**
 * Loads data into the datasource.
 * @param data - a JSON object with data to fill the TrackDataSource with
 */
TrackDataSource.prototype.load = function(data) {
  if (!Cesium.defined(data)) {
    throw new Cesium.DeveloperError('data is required.');
  }
  this._setLoading(true);
  var heightScale = this.heightScale;
  var entities = this._entityCollection;
  entities.suspendEvents();
  entities.removeAll();

  var position = new Cesium.SampledPositionProperty();

  //Draw all vertices on the map
  for (var i = 0; i < data.vertices.length; i++) {
    var trackData = data.vertices[i];
    this.addSample(position, trackData);
  }

  //Draw all edges on the map
  for (var i = 0; i < data.edges.length; i++) {
    var edgeData = data.edges[i];
    this.connect(edgeData);
  }

  //Set the time window of the data
  this.setTimeWindow(data.vertices);
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
      outlineWidth: 2
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
}

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
