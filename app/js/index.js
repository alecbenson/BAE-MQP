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
  bindDeleteSourceButton();
  bindCancelButton();
  bindNewCollectionButton();
  bindSubmitCollectionButton();
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
    addCollectionData(context, sourceName);
  });
}

function addCollectionData(context, sourceName) {
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
/**
 * Uploads a file to the server
 * @param target - an object close to the submission form (typically the button).
 */
function uploadCollectionSource(target) {
  var parentForm = $(target).closest('form');
  console.log(parentForm);
  $(parentForm).ajaxSubmit({
    url: "/collections/upload/data",
    type: "POST",
    dataType: "JSON",
    success: function(data, status) {
      var sourceName = data.file.filename;
      addCollectionData(data.context, sourceName);
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
 * Makes an ajax call to delete a given data source.
 * @param sourceName - the name of the data source to delete
 */
function deleteSource(collectionName, sourceName) {
  $.ajax({
    url: "/collections/" + collectionName + "/" + sourceName,
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
