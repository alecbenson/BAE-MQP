var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});

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
  bindUploadButton();

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
    var collectionName = context.name;
    var destination = context.path;
    addCollectionData(collectionName, sourceName, destination);
  });
}

function addCollectionData(collectionName, sourceName, destination) {
  var dataSource = new TrackDataSource();
  dataSource.loadUrl(destination + sourceName);

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
  $(parentForm).ajaxSubmit({
    url: "/collections/upload/",
    type: "POST",
    dataType: "JSON",
    success: function(data, status) {
      var collectionName = data.context.name;
      var sourceName = data.file.filename;
      var destination = data.file.destination;
      addCollectionData(collectionName, sourceName, destination);
      renderCollectionSources(data.context);
    },
    error: function(xhr, desc, err) {}
  });
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
