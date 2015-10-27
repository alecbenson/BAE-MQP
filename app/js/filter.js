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
    $("[name='quantity']").on('change', function() {
      applyElevationFilter();
    });
    $('.filter-ele-enabled :checkbox').bootstrapToggle();
  });
}

function applyTimeFilter() {
  var start = $("#filter-time-start").data('DateTimePicker').date();
  var stop = $('#filter-time-stop').data('DateTimePicker').date();

  for (var i in collections) {
    var collection = collections[i];
    forEachDataSource(collection, inTimeWindow(start, stop));
  }
}

function applyElevationFilter() {
  var start = $("#filter-ele-start").val();
  var stop = $('#filter-ele-stop').val();

  for (var i in collections) {
    var collection = collections[i];
    forEachDataSource(collection, inElevationWindow(start, stop));
  }
}

function inTimeWindow(start, stop) {
  return function(entity) {
    var time = entity.time;
    var parsed = moment(time);
    return parsed.isAfter(start) && parsed.isBefore(stop);
  };
}

function inElevationWindow(start, stop) {
  return function(entity) {
    var ele = entity.ele;
    return ele >= start && ele <= stop;
  };
}

function forEachDataSource(collection, callback) {
  for (var i in collection) {
    var dataSource = collection[i];
    dataSource.highlightOnCondition(callback);
  }
}
