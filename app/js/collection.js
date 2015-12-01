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
  var d = $.Deferred();
  var outerScope = this;
  $.get(xmlPath, function(data) {
    trackData = parser.parseFromString(data, "text/xml");

    var fusionFrames = trackData.getElementsByTagNameNS('*', 'FusionFrame');
    outerScope._parseAllFrames(fusionFrames, sourceName);
  }).promise().done(function() {
    outerScope.applyTrackModel();
    d.resolve(outerScope);
  });
  return d;
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
  async.each(frames, this._parseFrame.bind(this, sourceName));
  this.addUpdateTrackNodes();
};

Collection.prototype._parseFrame = function(sourceName, frame) {
  var outerScope = this;

  var t = parseInt(frame.getAttribute('time'));
  var stateEstimates = frame.getElementsByTagNameNS('*', 'stateEstimate');
  var sensors = frame.getElementsByTagNameNS('*', 'sensor');

  //Parse all state estimates
  $.each(stateEstimates, function(i, se) {
    outerScope._parseStateEstimate(t, sourceName, se);
  });

  //Parse all sensors
  $.each(sensors, function(i, s) {
    outerScope._parseSensor(t, sourceName, s);
  });
};

Collection.prototype._parseSensor = function(time, sourceName, s) {
  var sensor;
  var id = s.getAttribute('sensorType');

  if (this.sensors[sourceName] === undefined) {
    this.sensors[sourceName] = {};
  }

  if (id in this.sensors[sourceName]) {
    sensor = this.sensors[sourceName][id];
  } else {
    sensor = new SensorDataSource(id);
    this.sensors[sourceName][id] = sensor;
    viewer.dataSources.add(sensor);
  }
  sensor.addSensorSample(s, time);
};

Collection.prototype._parseStateEstimate = function(time, sourceName, se) {
  var track;
  var id = "n" + se.getAttribute('trackId');

  if (this.tracks[sourceName] === undefined) {
    this.tracks[sourceName] = {};
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

Collection.parsePos = function(xml) {
  var pos = xml.getElementsByTagNameNS('*', 'position')[0];
  if(pos === undefined){
      return undefined;
  }
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
  var id, sourceName;

  for (sourceName in this.tracks) {
    var sourceTracks = this.tracks[sourceName];
    for (id in sourceTracks) {
      var track = sourceTracks[id];
      track.createTrackNode();
    }
  }

  for (sourceName in this.sensors) {
    var sourceSensors = this.sensors[sourceName];
    for (id in sourceSensors) {
      var sensor = sourceSensors[id];
      sensor.createTrackNode();
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

Collection.prototype.deleteSourceSensors = function(sourceName) {
  var sourceSensors = this.sensors[sourceName];
  for (var i = 0; i < sourceSensors.length; i++) {
    this.deleteSensor(sourceName, i);
  }
};

Collection.prototype.renderCollection = function() {
  //Append the template to the div
  var outerScope = this;
  getTemplateHTML('dataCollection').done(function(data) {
    var templated = applyTemplate(data, outerScope);
    var target = $(templated).prependTo(dataDiv);
  });
  this.loadCollection();
};

Collection.prototype.renderSources = function() {
  var outerScope = this;
  getTemplateHTML('collectionList').done(function(data) {
    result = applyTemplate(data, outerScope);
    var list = "#collectionList" + "-" + outerScope.name;
    $(list).html(result);
    var checkbox = $(list).find("input[type='checkbox']");
    checkbox.bootstrapToggle();
    bindDataVisibilityToggle(checkbox);
  });
};

/**
 * Loads all of the files within a collection into the viewer
 */
Collection.prototype.loadCollection = function() {
  var outerScope = this;
  var model = this.model;
  var promises = [];
  $.each(this.sources, function(index, sourceName) {
    var sourcespath = outerScope.sourcespath;
    var p = outerScope.loadTrackFile(sourcespath + sourceName, sourceName);
    promises.push(p);
  });
  $.each(this.graphs, function(index, graphName) {
    var graphFilePath = outerScope.graphpath + graphName;
    var p = graph.loadGraphFile(graphFilePath);
    promises.push(p);
  });
  //This will wait for all of the promises to return
  //Before the sources are rendered
  $.when.apply(null, promises).done(function() {
    outerScope.renderSources();
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
      var promise;

      if (uploadType == "xml") {
        //Load XML file
        var xmlFilePath = context.sourcespath + sourceName;
        outerScope.sources.push(sourceName);
        promise = outerScope.loadTrackFile(xmlFilePath, sourceName);
      } else {
        //Load Sage file
        var graphFilePath = context.graphpath + sourceName;
        outerScope.graphs.push(sourceName);
        promise = graph.loadGraphFile(graphFilePath);
      }

      $.when(promise).done(function() {
        outerScope.renderSources();
      });
    },
    error: function(xhr, desc, err) {
      var error = $(parentForm).find('.alert-danger');
      $(error).show().text(xhr.responseText);
    }
  });
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
