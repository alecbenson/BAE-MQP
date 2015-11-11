var tracks = {};
var sensors = {};

function loadTrackFile(xmlPath) {
  parser = new DOMParser();
  $.get(xmlPath, function(data) {
    trackData = parser.parseFromString(data, "text/xml");

    var fusionFrames = trackData.getElementsByTagName('FusionFrame');
    parseAllFrames(fusionFrames);
  });
}

function parseAllFrames(frames) {
  var sensors = trackData.getElementsByTagName("sensor");
  parseAllSensors(sensors);

  $(frames).each(function(i, frame) {
    parseFrame(frame);
  }).promise().done(function(){
    addUpdateTrackNodes();
  });
}

function parseAllSensors(sensors) {
  $(sensors).each(function(i, sensor){
    console.log("Decide what to do with this sensor");
  });
}

function parseFrame(frame) {
  var t = parseInt(frame.getAttribute('time'));
  var stateEstimates = frame.getElementsByTagName('stateEstimate');
  $.each(stateEstimates, function(i, se) {
    parseStateEstimate(se, t);
  });
}

function parseStateEstimate(se, time) {
  var track;
  var id = se.getAttribute('trackId');

  if (id in tracks) {
    track = tracks[id];
  } else {
    track = new TrackDataSource(id);
    tracks[id] = track;
    //Render the data source
    viewer.dataSources.add(track);
  }
  track.addStateEstimate(se, time);
}

function addUpdateTrackNodes() {
  for(var id in tracks){
    var track = tracks[id];
    track.createTrackNode();
  }
}
