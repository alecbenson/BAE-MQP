function Filter(div) {
  this._div = div;
  this.renderFilter();
}

Object.defineProperties(Filter.prototype, {
  'div': {
    get: function() {
      return this._div;
    },
    set: function(div) {
      this._div = div;
    }
  },
  'eleSlider': {
    get: function() {
      return this._eleSlider;
    },
    set: function(eleSlider) {
      this._eleSlider = eleSlider;
    }
  }
});

Filter.prototype.renderFilter = function() {
  var outerScope = this;
  getTemplateHTML('filter').done(function(data) {
    var templated = applyTemplate(data, undefined);
    var target = $(templated).prependTo(outerScope.div);
    outerScope._renderEleSlider();
  });
  this._bindSearch();
  this._bindReset();
};

Filter.prototype._renderEleSlider = function() {
  var slider = document.getElementById('ele-slider');
  noUiSlider.create(slider, {
    start: [2000, 8000],
    connect: true,
    tooltips: true,
    range: {
      'min': 0,
      'max': 10000
    },
    format: wNumb({
      decimals: 0,
      postfix: 'm'
    })
  });
  this.eleSlider = slider;
};

Filter.prototype._getEleValues = function() {
  var values = this.eleSlider.noUiSlider.get();
  return values.map(function(n) {
    return parseInt(n);
  });
};

Filter.prototype._bindSearch = function() {
  var sourceName, name;
  var outerScope = this;
  $(this.div).on("click", ".btn-search", function() {
    outerScope.applyToAll();
  });
};

Filter.prototype._bindReset = function() {
  var sourceName, name;
  var outerScope = this;
  $(this.div).on("click", ".btn-search-reset", function() {
    outerScope.resetFilter();
  });
};

Filter.prototype.applyToAll = function() {
  var totalMatches = 0;
  var eleValues = this._getEleValues();
  var trackName = $(this.div).find("#filter-name").val();

  for (var name in collectionSet.collections) {
    var collection = collectionSet.getCollection(name);
    totalMatches += this.applyToCollection(collection, {
      'ele': eleValues,
      'trackName': trackName
    });
  }
  this.setResultsValue(totalMatches);
};

Filter.prototype.applyToCollection = function(collection, values) {
  var callback = function(entity) {
    var containsName = entity.parentTrack.indexOf(values.trackName) > -1;
    var pos = entity.position.getValue(viewer.clock.currentTime);
    if (pos === undefined) {
      return containsName;
    }
    var c = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pos);
    var inEleRange = c.height >= values.ele[0] && c.height <= values.ele[1];
    return containsName && inEleRange;
  };

  var matches = 0;
  for (var sourceName in collection.tracks) {
    var sourceTracks = collection.tracks[sourceName];
    for (var id in sourceTracks) {
      var track = sourceTracks[id];
      matches += track.highlightOnCondition(callback);
    }
  }
  return matches;
};

Filter.prototype.setResultsValue = function(matches) {
  var results = $(this.div).find("#search-results");
  results.text(matches.toString());
};

Filter.prototype.resetFilter = function() {
  for (var name in collectionSet.collections) {
    var collection = collectionSet.getCollection(name);
    for (var sourceName in collection.tracks) {
      var sourceTracks = collection.tracks[sourceName];
      for (var id in sourceTracks) {
        var track = sourceTracks[id];
        track.highlightOnCondition(function() {
          return false;
        });
      }
    }
  }
  this.setResultsValue(0);
};
