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
  $(frames).each(function(i, frame) {
    parseFrame(frame);
  }).promise().done(function() {
    addUpdateTrackNodes();
  });
}

function addSensorSample(sensor) {
  var p = parsePos(sensor);
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
}

function parseFrame(frame) {
  var t = parseInt(frame.getAttribute('time'));
  var stateEstimates = frame.getElementsByTagName('stateEstimate');
  $.each(stateEstimates, function(i, se) {
    parseStateEstimate(se, t);
  });

  var sensors = trackData.getElementsByTagName("sensor");
  parseAllSensors(sensors);
}

function parseAllSensors(sensors) {
  $.each(sensors, function(i, sensor) {
    var sensorEnt = addSensorSample(sensor);
    sensors[i] = sensorEnt;
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

function parsePos(kse) {
  var pos = kse.getElementsByTagName('position')[0];
  var lat = Number(pos.getAttribute('lat'));
  var lon = Number(pos.getAttribute('lon'));
  var hae = Number(pos.getAttribute('hae'));
  return {
    "lat": lat,
    "lon": lon,
    "hae": hae
  };
}

function addUpdateTrackNodes() {
  for (var id in tracks) {
    var track = tracks[id];
    track.createTrackNode();
  }
}
