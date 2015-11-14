function Collection(obj, name, model) {
  this._tracks = {};
  this._sensors = {};
  this._name = name;
  this._model = model;
  for (var prop in obj) this[prop] = obj[prop];
}

Object.defineProperties(Collection.prototype, {
  'name': {
    get: function() {
      return this._name;
    },
    set: function(name) {
      this._name = name;
    }
  },
  'tracks': {
    get: function() {
      return this._tracks;
    },
    set: function(tracks) {
      this._tracks = tracks;
    }
  },
  'sensors': {
    get: function() {
      return this._sensors;
    },
    set: function(sensors) {
      this._sensors = sensors;
    },
    'model': {
      get: function() {
        return this._model;
      },
      set: function() {
        this._model = model;
      }
    }
  }
});

Collection.prototype.loadTrackFile = function(xmlPath, sourceName) {
  var parser = new DOMParser();
  var outerScope = this;
  $.get(xmlPath, function(data) {
    trackData = parser.parseFromString(data, "text/xml");

    var fusionFrames = trackData.getElementsByTagName('FusionFrame');
    outerScope._parseAllFrames(fusionFrames, sourceName);
  }).promise().done(function() {
    outerScope.applyTrackModel();
    return outerScope;
  });
};

Collection.prototype.setTrackVisibility = function(sourceName, trackID, state) {
  var track = this.tracks[sourceName][trackID];
  var entityList = track.entities.values;
  for (var i = 0; i < entityList.length; i++) {
    entityList[i].show = state;
  }
};

Collection.prototype.setAllTrackVisibility = function(state) {
  for (var sourceName in this.tracks) {
    var sourceTracks = this.tracks[sourceName];
    for (var id in sourceTracks) {
      this.setTrackVisibility(sourceName, id, state);
    }
  }
};

Collection.prototype.setGraphVisibility = function(graphName, state) {
  var fullPath = this.graphpath + graphName;
  if (state) {
    graph.loadGraphFile(fullPath);
  } else {
    $.get(fullPath, function(data) {
      data = JSON.parse(data);
      graph.unloadGraphEntities(data);
    });
  }
};

Collection.prototype._parseAllFrames = function(frames, sourceName) {
  var outerScope = this;
  $(frames).each(function(i, frame) {
    outerScope._parseFrame(frame, sourceName);
  }).promise().done(function() {
    outerScope.addUpdateTrackNodes();
  });
};

Collection.prototype._parseFrame = function(frame, sourceName) {
  var outerScope = this;

  var t = parseInt(frame.getAttribute('time'));
  var stateEstimates = frame.getElementsByTagName('stateEstimate');
  $.each(stateEstimates, function(i, se) {
    outerScope._parseStateEstimate(se, t, sourceName);
  });

  var sensors = frame.getElementsByTagName("sensor");
  this._parseAllSensors(sensors, sourceName);
};

Collection.prototype._addSensorSample = function(sensor, sourceName) {
  var p = Collection.parsePos(sensor);
  var position = Cesium.Cartesian3.fromDegrees(p.lat, p.lon, p.hae);

  var entity = {
    position: position,
    billboard: {
      image: '../images/sensor.png',
      scale: 0.04,
      color: Cesium.Color.ORANGERED,
    },
    ele: p.hae
  };
  viewer.entities.add(entity);
  this.sensors[sourceName].push(entity);
  return entity;
};

Collection.prototype._parseAllSensors = function(sensors, sourceName) {
  var outerScope = this;
  if (this.sensors[sourceName] === undefined) {
    this.sensors[sourceName] = [];
  }
  $.each(sensors, function(i, sensor) {
    outerScope._addSensorSample(sensor, sourceName);
  });
};

Collection.prototype._parseStateEstimate = function(se, time, sourceName) {
  var track;
  var id = "n" + se.getAttribute('trackId');

  if (this.tracks[sourceName] === undefined) {
    this.tracks[sourceName] = [];
  }

  if (id in this.tracks[sourceName]) {
    track = this.tracks[sourceName][id];
  } else {
    track = new TrackDataSource(id);
    this.tracks[sourceName][id] = track;
    //Render the data source
    viewer.dataSources.add(track);
  }
  track.addStateEstimate(se, time);
};

Collection.parsePos = function(kse) {
  var pos = kse.getElementsByTagName('position')[0];
  var lat = Number(pos.getAttribute('lat'));
  var lon = Number(pos.getAttribute('lon'));
  var hae = Number(pos.getAttribute('hae'));
  return {
    "lat": lat,
    "lon": lon,
    "hae": hae
  };
};

Collection.prototype.addUpdateTrackNodes = function() {
  for (var sourceName in this.tracks) {
    var sourceTracks = this.tracks[sourceName];
    for (var id in sourceTracks) {
      var track = sourceTracks[id];
      track.createTrackNode();
    }
  }
};

/**
 * Uploads a file to the server
 * @param target - an object close to the submission form (typically the button).
 */
Collection.prototype.uploadCollectionModel = function(target) {
  var outerScope = this;
  var parentForm = $(target).closest('form');
  $(parentForm).ajaxSubmit({
    url: "/collections/upload/model",
    type: "POST",
    dataType: "JSON",
    success: function(data, status) {
      var destination = data.file.destination;
      var name = data.file.filename;
      var modelPath = destination + name;
      outerScope.model = modelPath;
      outerScope.applyTrackModel();
    },
    error: function(xhr, desc, err) {
      var error = $(parentForm).find('.alert-danger');
      $(error).show().text(xhr.responseText);
    }
  });
};

Collection.prototype.applyTrackModel = function() {
  if (this.model === undefined) {
    return;
  }

  for (var sourceName in this.tracks) {
    var sourceTracks = this.tracks[sourceName];
    for (var id in sourceTracks) {
      var track = this.tracks[sourceName][id];
      track.setTrackModel(this.model);
    }
  }
};

/**
 * Creates a new collection on the server
 * @param target - an object close to the submission form (typically the button).
 */
Collection.createNewCollection = function(target) {
  var parentForm = $(target).closest('form');
  $(parentForm).ajaxSubmit({
    url: "/collections/",
    type: "POST",
    success: function(data, status) {
      //Update the list of collections in the sidebar
      var newCollection = new Collection(data);
      collectionSet.addCollection(newCollection);
      $(parentForm).remove();
    },
    error: function(xhr, desc, err) {
      var error = $(parentForm).find('.alert-danger');
      $(error).show().text(xhr.responseText);
    }
  });
};

/**
 * Makes an ajax call to delete a given data collection.
 * @param collectionName - the name of the collection to delete
 */
Collection.prototype.deleteCollection = function() {
  var outerScope = this;
  $.ajax({
    url: "/collections/" + outerScope.name,
    type: "DELETE",
    success: function(data, status) {
      //Remove all datasources in this collection from the viewer
      for (var sourceName in outerScope.tracks) {
        outerScope.deleteSourceTracks(sourceName);
      }
      for (var i in outerScope.sensors) {
        var sensor = outerScope.sensors[i];
        if (viewer.entities.contains(sensor)) {
          viewer.entities.remove(sensor, true);
        }
      }
      //Delete collection from set
      collectionSet.deleteCollection(outerScope);
      $(".collection-" + outerScope.name).remove();
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
};

Collection.prototype.deleteTrack = function(sourceName, id) {
  var track = this.tracks[sourceName][id];
  if (viewer.dataSources.contains(track)) {
    viewer.dataSources.remove(track, true);
  }
};

Collection.prototype.deleteSourceTracks = function(sourceName) {
  var sourceTracks = this.tracks[sourceName];
  for (var id in sourceTracks) {
    this.deleteTrack(sourceName, id);
  }
};


Collection.prototype.deleteSensor = function(sourceName, index) {
  var sensor = this.sensors[sourceName][index];
  if (viewer.entities.contains(sensor)) {
    viewer.entities.remove(track, true);
  }
};

/**
 * Makes an ajax call to delete a given graph source.
 * @param sourceName - the name of the data source to delete
 */
Collection.prototype.deleteGraphData = function(graphName) {
  var outerScope = this;
  $.ajax({
    url: "/collections/" + outerScope.name + "/graph/" + graphName,
    type: "DELETE",
    success: function(data, status) {
      graph.unloadGraphEntities(data.graph);
      var index = outerScope.graphs.indexOf(graphName);
      delete outerScope.graphs[index];
      outerScope.renderSources(data.context);
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
};

Collection.prototype.deleteSourceSensors = function(sourceName) {
  var sourceSensors = this.sensors[sourceName];
  for (var i = 0; i < sourceSensors.length; i++) {
    this.deleteSensor(sourceName, i);
  }
};

Collection.prototype.renderSources = function() {
  var outerScope = this;
  getTemplateHTML('sourceList').done(function(data) {
    result = applyTemplate(data, outerScope);
    var list = "#sourceList" + "-" + outerScope.name;
    $(list).html(result);
    var checkbox = $(list + " ul li :checkbox");
    checkbox.bootstrapToggle();
    bindDataVisibilityToggle(checkbox);
  });
};

/**
 * Makes an ajax call to delete a given track source.
 * @param sourceName - the name of the data source to delete
 */
Collection.prototype.deleteSourceData = function(sourceName) {
  var outerScope = this;
  $.ajax({
    url: "/collections/" + outerScope.name + "/track/" + sourceName,
    type: "DELETE",
    success: function(data, status) {
      //Delete all tracks
      outerScope.deleteSourceTracks(sourceName);
      delete outerScope.tracks[sourceName];
      outerScope.sources = data.sources;
      outerScope.renderSources(data);
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
};

/**
 * Uploads a file to the server
 * @param target - an object close to the submission form (typically the button).
 */
Collection.prototype.uploadCollectionSource = function(target) {
  var parentForm = $(target).closest('form');
  var outerScope = this;
  $(parentForm).ajaxSubmit({
    url: "/collections/upload/data",
    type: "POST",
    dataType: "JSON",
    success: function(data, status) {
      var context = data.context;
      var uploadType = data.file.uploadType;
      var sourceName = data.file.filename;

      if (uploadType == "xml") {
        //Load XML file
        var xmlFilePath = context.sourcespath + sourceName;
        outerScope.loadTrackFile(xmlFilePath, sourceName);
        outerScope.sources.push(sourceName);
      } else {
        //Load Sage file
        var graphFilePath = context.graphpath + sourceName;
        outerScope.graphs.push(sourceName);
        graph.loadGraphFile(graphFilePath);
      }
      outerScope.renderSources();
    },
    error: function(xhr, desc, err) {
      var error = $(parentForm).find('.alert-danger');
      $(error).show().text(xhr.responseText);
    }
  });
};
