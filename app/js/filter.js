var filterDiv = "#filters";

function addAllFilters() {
  renderTimeFilter();
  renderEleFilter();
}

function renderTimeFilter() {
  //Append the template to the div
  getTemplateHTML('filter-time').done(function(data) {
    var templated = applyTemplate(data, undefined);
    var target = $(templated).prependTo(filterDiv);
    var picker = $(".timepicker").datetimepicker();
    $(picker).on('dp.change', function() {
      applyTimeFilter();
    });
    $('.filter-time-enabled :checkbox').bootstrapToggle();
  });
}

function renderEleFilter() {
  //Append the template to the div
  getTemplateHTML('filter-ele').done(function(data) {
    var templated = applyTemplate(data, undefined);
    var target = $(templated).prependTo(filterDiv);

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
    slider.noUiSlider.on('set', function() {
      var vals = slider.noUiSlider.get();
      var start = parseInt(vals[0]);
      var stop = parseInt(vals[1]);
      applyElevationFilter(start, stop);
    });
    $('.filter-ele-enabled :checkbox').bootstrapToggle();
  });
}

function applyTimeFilter() {
  var start = $("#filter-time-start").data('DateTimePicker').date();
  var stop = $('#filter-time-stop').data('DateTimePicker').date();

  for (var name in collectionSet.collections) {
    var collection = collectionSet.collections[name];
    forEachDataSource(collection, inTimeWindow(start, stop));
  }
}

function applyElevationFilter(start, stop) {
  for (var name in collectionSet.collections) {
    var collection = collectionSet.collections[name];
    forEachDataSource(collection, inElevationWindow(start, stop));
  }
}

function inTimeWindow(start, stop) {
  return function(entity) {
    var time = Cesium.JulianDate.toIso8601(entity.time);
    var parsed = moment(time);
    return parsed.isAfter(start) && parsed.isBefore(stop);
  };
}

function inElevationWindow(start, stop) {
  return function(entity) {
    var ele = entity.ele;
    return ((ele >= start) && (ele <= stop));
  };
}

function forEachDataSource(collection, callback) {
  for (var id in collection.tracks) {
    var dataSource = collection.tracks[id];
    dataSource.highlightOnCondition(callback);
  }
}
