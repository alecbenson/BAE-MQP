var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world',
  requestWaterMask: true
});
viewer.terrainProvider = terrainProvider;

var graph = new D3Graph(500, 500, "#chart");

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

/**
 * Uploads a file to the server
 * @param target - an object close to the submission form (typically the button).
 */
function uploadCollectionModel(target) {
  var parentForm = $(target).closest('form');
  $(parentForm).ajaxSubmit({
    url: "/collections/upload/model",
    type: "POST",
    dataType: "JSON",
    success: function(data, status) {
      var destination = data.file.destination;
      var name = data.file.filename;
      var modelPath = destination + name;
      setCollectionModel(data.collectionName, modelPath);
    },
    error: function(xhr, desc, err) {}
  });
}

function setCollectionModel(collectionName, modelPath) {
  collection = collections[collectionName];
  for (var i in collection) {
    var dataSource = collection[i];
    dataSource.setTrackModel(modelPath);
  }
}

/**
 * Makes an ajax call to delete a given graph source.
 * @param sourceName - the name of the data source to delete
 */
function deleteGraphData(collectionName, graphName) {
  $.ajax({
    url: "/collections/" + collectionName + "/graph/" + graphName,
    type: "DELETE",
    success: function(data, status) {
      graph.unloadGraphEntities(data.graph);

      var collection = collectionSet.getCollection(collectionName);
      var index = collection.graphs.indexOf(graphName);
      delete collection.graphs[index];
      collection.renderSources(data.context);
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
}
