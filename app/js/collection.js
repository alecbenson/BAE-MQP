function Collection(obj, name) {
  this._tracks = {};
  this._sensors = {};
  this._name = name;
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
    }
  }
});

Collection.prototype.loadTrackFile = function(xmlPath) {
  var parser = new DOMParser();
  var outerScope = this;
  $.get(xmlPath, function(data) {
    trackData = parser.parseFromString(data, "text/xml");

    var fusionFrames = trackData.getElementsByTagName('FusionFrame');
    outerScope._parseAllFrames(fusionFrames);
  }).promise().done(function() {
    return outerScope;
  });
};

Collection.prototype.setTrackVisibility = function(trackID, state) {
  var track = this.tracks[trackID];
  var entityList = track.entities.values;
  for (var i = 0; i < entityList.length; i++) {
    entityList[i].show = state;
  }
};

Collection.prototype.setAllTrackVisibility = function(state) {
  for (var trackID in this.tracks) {
    this.setTrackVisibility(trackID, state);
  }
};

Collection.prototype._parseAllFrames = function(frames) {
  var outerScope = this;
  $(frames).each(function(i, frame) {
    outerScope._parseFrame(frame);
  }).promise().done(function() {
    outerScope.addUpdateTrackNodes();
  });
};

Collection.prototype._addSensorSample = function(sensor) {
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
  return entity;
};

Collection.prototype._parseFrame = function(frame) {
  var outerScope = this;

  var t = parseInt(frame.getAttribute('time'));
  var stateEstimates = frame.getElementsByTagName('stateEstimate');
  $.each(stateEstimates, function(i, se) {
    outerScope._parseStateEstimate(se, t);
  });

  var sensors = trackData.getElementsByTagName("sensor");
  this._parseAllSensors(sensors);
};

Collection.prototype._parseAllSensors = function(sensors) {
  var outerScope = this;

  $.each(sensors, function(i, sensor) {
    var sensorEnt = outerScope._addSensorSample(sensor);
    outerScope.sensors[i] = sensorEnt;
  });
};

Collection.prototype._parseStateEstimate = function(se, time) {
  var track;
  var id = se.getAttribute('trackId');

  if (id in this.tracks) {
    track = this.tracks[id];
  } else {
    track = new TrackDataSource(id);
    this.tracks[id] = track;
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
  for (var id in this.tracks) {
    var track = this.tracks[id];
    track.createTrackNode();
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
      var error = $(parentForm).find('.errorMessage');
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
      for (var trackID in outerScope.tracks) {
        var track = outerScope.tracks[trackID];
        if (viewer.dataSources.contains(track)) {
          viewer.dataSources.remove(track, true);
        }
      }
      for (var i in outerScope.sensors) {
        var sensor = outerScope.sensors[i];
        if (viewer.entities.contains(sensor)){
          viewer.entities.remove(sensor, true);
        }
      }
      collectionSet.deleteCollection(outerScope);
      $(".collection-" + outerScope.name).remove();
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
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
      var ds = outerScope.tracks[sourceName];
      if (viewer.dataSources.contains(ds)) {
        viewer.dataSources.remove(ds, true);
      }
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
Collection.uploadCollectionSource = function(target) {
  var parentForm = $(target).closest('form');
  var outerScope = this;
  $(parentForm).ajaxSubmit({
    url: "/collections/upload/data",
    type: "POST",
    dataType: "JSON",
    success: function(data, status) {
      var context = data.context;
      var collectionName = data.context.name;
      var uploadType = data.file.uploadType;
      var sourceName = data.file.filename;
      var collection = collectionSet.collections[collectionName];

      if (uploadType == "xml") {
        //Load XML file
        var xmlFilePath = context.sourcespath + sourceName;
        collection.loadTrackFile(xmlFilePath);
        collection.sources.push(sourceName);
      } else {
        //Load Sage file
        var graphFilePath = context.graphpath + sourceName;
        collection.graphs.push(sourceName);
        graph.loadGraphFile(graphFilePath);
      }
      collection.renderSources();
    },
    error: function(xhr, desc, err) {}
  });
};
