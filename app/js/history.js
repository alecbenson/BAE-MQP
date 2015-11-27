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
}

HistorySlider.prototype._sliderStartStop = function(pct) {
  var diff = this.stop - this.start;
  pct = (pct / 100.0);
  var newStart = (diff * pct) - Math.abs(this.stop);
  var newStop = (diff * (1.0 - pct)) - Math.abs(this.start);
  return [newStart, newStop];
}

HistorySlider.prototype.getValues = function() {
  return this.slider.get();
}

HistorySLider.prototype._updateTrackHistory = function() {
  this.slider.noUiSlider.on('change', function(values, handle) {};
  }
}

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
}

HistorySlider.prototype._setSoftLimits = function() {
  var outerScope = this;
  this.slider.noUiSlider.on('change', function(values, handle) {
    if (parseInt(values[0]) > 0) {
      outerScope.slider.noUiSlider.set([0, null]);
    } else if (parseInt(values[1]) < 0) {
      outerScope.slider.noUiSlider.set([null, 0]);
    }
  });
}
