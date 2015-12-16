registerAllPartials();

var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});

var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world',
  requestWaterMask: true
});
viewer.terrainProvider = terrainProvider;

var clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
clickHandler.setInputAction(function(click) {
  var pickedObject = viewer.scene.pick(click.position);
  if (Cesium.defined(pickedObject)) {
    var id = pickedObject.id;
    graph.displayAdjacencies(id.parentTrack);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);


var collectionSet = new CollectionSet("#collections");
collectionSet.getCollections();
var graph = new D3Graph(600, 500, "#chart");
var historySlider = new HistorySlider(-60, 60);
var filter = new Filter("#filters");

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
