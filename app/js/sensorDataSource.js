var SensorDataSource = function(name) {

  this._name = name;
  this._entityCollection = new Cesium.EntityCollection();
  this._changed = new Cesium.Event();
  this._error = new Cesium.Event();
  this._isLoading = false;
  this._loading = new Cesium.Event();
};

Object.defineProperties(SensorDataSource.prototype, {
  name: {
    get: function() {
      return this._name;
    }
  },
  clock: {
    value: undefined,
    writable: false
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
 * Draw all sensors on the map
 * @param data - the XML data
 **/
SensorDataSource.prototype.addSensorSample = function(sensor) {
  this._setLoadStatus(true);
  var p = parsePos(sensor);
  var position = Cesium.Cartesian3.fromDegrees(p.lat, p.lon, p.hae);

  var entity = {
    position: position,
    billboard: {
      image: '../images/sensor.png',
      scale: 0.04,
      color: Cesium.Color.RED,
    },
    ele: p.hae
  };
  this.entities.add(entity);
  this._setLoadStatus(false);
};

/**
 * Loads data into the datasource.
 * @param data - a JSON object with data to fill the TrackDataSource with
 */
SensorDataSource.prototype._setLoadStatus = function(status) {
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
 * Sets the loading status of the data source
 * @param isLoading {bool}
 */
SensorDataSource.prototype._setLoading = function(isLoading) {
  if (this._isLoading !== isLoading) {
    this._isLoading = isLoading;
    this._loading.raiseEvent(this, isLoading);
  }
};
