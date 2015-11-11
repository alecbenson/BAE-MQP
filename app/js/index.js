var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world',
  requestWaterMask: true
});
viewer.terrainProvider = terrainProvider;

$(function() {
  registerAllPartials();
  addAllFilters();
  getCollections();
  bindFileSelectionText();
  bindDeleteButton();
  bindDeleteTrackButton();
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
      var collections = JSON.parse(data);
      renderAllCollections(collections);
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
}

/**
 * Given a data file, create a new data source and draw the result in cesium
 * @param file - an data file to render in cesium
 */
function loadCollection(context) {
  $.each(context.sources, function(index, sourceName) {
    addTrackData(context, sourceName);
  });
  $.each(context.graphs, function(index, graphName) {
    addGraphData(context, graphName);
  });
}

function addTrackData(context, sourceName) {
  var collectionName = context.name;
  var model = context.model;
  var sourcespath = context.sourcespath;

  var dataSource = new TrackDataSource();
  Cesium.when(dataSource.loadUrl(sourcespath + sourceName), function() {
    if (model !== undefined) {
      dataSource.setTrackModel(model);
    }
  });

  if (collections[collectionName] === undefined) {
    collections[collectionName] = {};
  }
  collections[collectionName][sourceName] = dataSource;
  viewer.dataSources.add(dataSource);
}

function addGraphData(context, graphName) {
  var graphFilePath = context.graphpath + graphName;
  loadGraphFile(graphFilePath);
}
/**
 * Uploads a file to the server
 * @param target - an object close to the submission form (typically the button).
 */
function uploadCollectionSource(target) {
  var parentForm = $(target).closest('form');
  $(parentForm).ajaxSubmit({
    url: "/collections/upload/data",
    type: "POST",
    dataType: "JSON",
    success: function(data, status) {
      var uploadType = data.file.uploadType;
      var sourceName = data.file.filename;
      if (uploadType == "xml") {
        addTrackData(data.context, sourceName);
      } else {
        addGraphData(data.context, sourceName);
      }
      renderCollectionSources(data.context);
    },
    error: function(xhr, desc, err) {}
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
 * Makes an ajax call to delete a given data collection.
 * @param collectionName - the name of the collection to delete
 */
function deleteCollection(collectionName) {
  $.ajax({
    url: "/collections/" + collectionName,
    type: "DELETE",
    success: function(data, status) {
      var collection = collections[collectionName];

      //Remove all datasources in this collection from the viewer
      for (var index in collection) {
        var ds = collection[index];
        if (viewer.dataSources.contains(ds)) {
          viewer.dataSources.remove(ds, true);
        }
      }
      delete collections[collectionName];
      $(".collection-" + collectionName).remove();
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
}

/**
 * Makes an ajax call to delete a given track source.
 * @param sourceName - the name of the data source to delete
 */
function deleteTrackData(collectionName, sourceName) {
  $.ajax({
    url: "/collections/" + collectionName + "/track/" + sourceName,
    type: "DELETE",
    success: function(data, status) {
      var ds = collections[collectionName][sourceName];
      if (viewer.dataSources.contains(ds)) {
        viewer.dataSources.remove(ds, true);
      }
      delete collections[collectionName][sourceName];
      renderCollectionSources(data);
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
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
      unloadGraphEntities(data.graph);
      console.log(nodes);
      renderCollectionSources(data.context);
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
}
