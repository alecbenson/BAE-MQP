var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});

function readFile(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var name = file.name;
  var size = file.size;
  var type = file.type;
}

//Run when the data source changes
$(function() {
  $("#datasource").change(readFile);
});
