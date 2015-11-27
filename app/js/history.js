function HistorySlider(start, stop) {
  this._start = start;
  this._stop = stop;
  this._init();
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
  }
});

HistorySlider.prototype._init = function() {
  var outerScope = this;
  getTemplateHTML('history-slider').done(function(data) {
    var templated = applyTemplate(data);
    $(templated).appendTo(document.body);
    outerScope._makeSlider();
  });
}

HistorySlider.prototype._sliderStartStop = function(pct) {
  var diff = this.stop - this.start;
  pct = (pct/100.0);
  var newStart = (diff * pct) - Math.abs(this.stop);
  var newStop = (diff * (1.0 - pct)) - Math.abs(this.start);
  return [newStart, newStop];
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
    format: wNumb({
      decimals: 0,
      postfix: 's'
    })
  });
  slider.noUiSlider.on('set', function() {
    var vals = slider.noUiSlider.get();
    var start = parseInt(vals[0]);
    var stop = parseInt(vals[1]);
  });
}
