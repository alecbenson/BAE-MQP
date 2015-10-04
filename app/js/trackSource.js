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

//Connects two vertices together
TrackDataSource.prototype.connect = function(first, other) {
  var edgeName = first.id + " " + other.id;
  var orangeOutlined = viewer.entities.add({
    name: 'Edge connecting ' + first.id + " with " + other.id,
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArrayHeights([first.lon, first.lat, first.ele, other.lon, other.lat, other.ele]),
      width: 3,
      material: new Cesium.PolylineOutlineMaterialProperty({
        color: Cesium.Color.BLUE,
      })
    }
  });
}

TrackDataSource.prototype.addSample = function(property, data) {
  var entities = this._entityCollection;
  var position = Cesium.Cartesian3.fromDegrees(data.lon, data.lat, data.ele);
  var time = Cesium.JulianDate.fromIso8601(data.time);
  property.addSample(time, position);

  //Create a point for the sample data
  var entity = entities.add({
    position: position,
    point: {
      pixelSize: 5,
      color: Cesium.Color.BLUE,
      outlineColor: Cesium.Color.CYAN,
      outlineWidth: 2
    }
  });
  return property;
}

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

TrackDataSource.prototype.load = function(data) {
  if (!Cesium.defined(data)) {
    throw new Cesium.DeveloperError('data is required.');
  }
  this._setLoading(true);
  var heightScale = this.heightScale;
  var entities = this._entityCollection;
  entities.suspendEvents();
  entities.removeAll();

  //Iterate through each vertice, and add a sample point
  var position = new Cesium.SampledPositionProperty();

  for (var i = 0; i < data.vertices.length; i++) {
    var trackData = data.vertices[i];
    this.addSample(position, trackData);
  }

  var entity = entities.add({
    position: position,
    point: {
      pixelSize: 20,
      color: Cesium.Color.RED,
      outlineColor: Cesium.Color.CYAN,
      outlineWidth: 2
    }
  });

  this.setTimeWindow(data.vertices);

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

  //Handle appropriate cesium events
  entities.resumeEvents();
  this._changed.raiseEvent(this);
  this._setLoading(false);
};

TrackDataSource.prototype._setLoading = function(isLoading) {
  if (this._isLoading !== isLoading) {
    this._isLoading = isLoading;
    this._loading.raiseEvent(this, isLoading);
  }
};
