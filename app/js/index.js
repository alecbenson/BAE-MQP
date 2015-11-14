var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world',
  requestWaterMask: true
});
viewer.terrainProvider = terrainProvider;

var graph = new D3Graph(600, 500, "#chart");
//viewer.screenSpaceEventHandler.setInputAction(p, Cesium.ScreenSpaceEventType.LEFT_CLICK);

var clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
clickHandler.setInputAction(function(click) {
  var pickedObject = viewer.scene.pick(click.position);
  if (Cesium.defined(pickedObject)) {
    var id = pickedObject.id;
    graph.displayAdjacencies(id.parentTrack);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

$(function() {
  registerAllPartials();
  addAllFilters();
  getCollections();
  bindFileSelectionText();
  bindDeleteButton();
  bindDeleteSourceButton();
  bindDeleteGraphButton();
  bindCancelButton();
  bindNewCollectionButton();
  bindSubmitCollectionButton();
  bindToggleNavPane();
  bindUploadDataButton();
  bindUploadModelButton();

});

/**
 * Makes a GET request to the server to retrieve all collections
 */
function getCollections() {
  $.ajax({
    url: "/collections/",
    type: "GET",
    dataType: "JSON",
    processData: false,
    contentType: false,
    success: function(data, status) {
      var results = JSON.parse(data);
      collectionSet.populateCollections(results);
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
}
