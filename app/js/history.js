function HistorySlider(start, stop) {
  var outerScope = this;

  this._start = start;
  this._stop = stop;
  this._renderSlider();
}

Object.defineProperties(HistorySlider.prototype, {
  'start': {
    get: function() {
      return this._start;
    },
    set: function(start) {
      this._start = start;
    }
  },
  'stop': {
    get: function() {
      return this._stop;
    },
    set: function(stop) {
      this._stop = stop;
    }
  },
  'slider': {
    get: function() {
      return this._slider;
    },
    set: function(slider) {
      this._slider = slider;
    }
  }
});

HistorySlider.prototype._renderSlider = function() {
  var d = $.Deferred();
  var outerScope = this;
  getTemplateHTML('history-slider').done(function(data) {
    var templated = applyTemplate(data);
    $(templated).appendTo(document.body);
    outerScope._makeSlider();
    d.resolve(outerScope);
  });
  return d;
};

HistorySlider.prototype._sliderStartStop = function(pct) {
  var diff = this.stop - this.start;
  pct = (pct / 100.0);
  var newStart = (diff * pct) - Math.abs(this.stop);
  var newStop = (diff * (1.0 - pct)) - Math.abs(this.start);
  return [newStart, newStop];
};

HistorySlider.prototype.getValues = function() {
  var values = this.slider.noUiSlider.get();
  return values.map(function(n) {
    return parseInt(n);
  });
};

HistorySlider.prototype._bindSlider = function() {
  var sourceName, name;
  var outerScope = this;
  this.slider.noUiSlider.on('update', function(values, handle) {
    outerScope.updateAllHistory();
  });
};

HistorySlider.prototype.updateCollectionHistory = function(collection) {
  var values = this.getValues();
  this._updateTracks(collection, values);
  this._updateSensors(collection, values);
};

HistorySlider.prototype.updateAllHistory = function() {
  var values = this.getValues();
  for (var name in collectionSet.collections) {
    var collection = collectionSet.getCollection(name);
    this.updateCollectionHistory(collection);
  }
};

HistorySlider.prototype._updateSensors = function(collection, values) {
  //Loop through all collection sources
  for (var sourceName in collection.sensors) {
    //Loop through all tracks
    var sensors = collection.sensors[sourceName];
    for (var name in sensors) {
      //Update trailing and leadtime time
      var sensor = sensors[name];
      if (sensor.trackNode === undefined) {
        continue;
      }
      sensor.trackNode.path.trailTime = Math.abs(values[0]);
      sensor.trackNode.path.leadTime = Math.abs(values[1]);
    }
  }
};

HistorySlider.prototype._updateTracks = function(collection, values) {
  //Loop through all collection sources
  for (var sourceName in collection.tracks) {
    //Loop through all tracks
    var tracks = collection.tracks[sourceName];
    for (var name in tracks) {
      //Update trailing and leadtime time
      var track = tracks[name];
      if (track.trackNode === undefined) {
        continue;
      }
      track.trackNode.path.trailTime = Math.abs(parseInt(values[0]));
      track.trackNode.path.leadTime = Math.abs(parseInt(values[1]));
    }
  }
};

HistorySlider.prototype._makeSlider = function() {
  var outerScope = this;
  var slider = document.getElementById('history-slider');
  noUiSlider.create(slider, {
    connect: true,
    tooltips: true,
    start: outerScope._sliderStartStop(20),
    range: {
      'min': this.start,
      'max': this.stop
    },
    pips: {
      mode: 'positions',
      values: [0, 25, 50, 75, 100],
      density: 10
    },
    format: wNumb({
      decimals: 0,
      postfix: 'sec'
    })
  });
  this.slider = slider;
  this._setSoftLimits();
  this._bindSlider();
};

HistorySlider.prototype._setSoftLimits = function() {
  var outerScope = this;
  this.slider.noUiSlider.on('update', function(values, handle) {
    if (parseInt(values[0]) > 0) {
      outerScope.slider.noUiSlider.set([0, null]);
    } else if (parseInt(values[1]) < 0) {
      outerScope.slider.noUiSlider.set([null, 0]);
    }
  });
};
