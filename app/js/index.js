var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});

$(function() {
  registerAllPartials();
  getCollections();
  bindFileSelectionText();
  bindDeleteButton();
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
 * Makes a GET request to the server to retrieve all data sources belonging to the collection
 * @param collectionName - the name of the collection to retrieve datasources for
 */
function getCollectionSources(collectionName) {
  $.ajax({
    url: "/collections/" + collectionName,
    type: "GET",
    dataType: "JSON",
    processData: false,
    contentType: false,
    success: function(data, status) {
      var sources = JSON.parse(data);
      renderCollectionSources(sources, collectionName);
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
function loadJSONFile(filePath) {
  var dataSource = new TrackDataSource();
  dataSource.loadUrl(filePath);
  viewer.dataSources.add(dataSource);
  collections[filePath] = dataSource;
}

/**
 * Uploads a file to the server
 * @param target - an object close to the submission form (typically the button).
 */
function uploadData(target) {
  var parentForm = $(target).closest('form');

  $(parentForm).ajaxSubmit({
    url: "/upload",
    type: "POST",
    dataType: "JSON",
    success: function(data, status) {
      var filePath = data.destination + data.filename;
      loadJSONFile(filePath);
      getCollections();
    },
    error: function(xhr, desc, err) {}
  });
}

/**
 * Creates a new collection on the server
 * @param target - an object close to the submission form (typically the button).
 */
function createNewCollection(target) {
  var parentForm = $(target).closest('form');
  $(parentForm).ajaxSubmit({
    url: "/collections/",
    type: "POST",
    success: function(data, status) {
      //Update the list of collections in the sidebar
      getCollections();
    },
    error: function(xhr, desc, err) {}
  });
}

/**
 * Makes an ajax call to delete a given data source.
 * Running deleteFile will re-render the collections in the toolbar.
 * @param file - the name of the data source to delete
 */
function deleteCollection(collectionName) {
  $.ajax({
    url: "/collections/" + collectionName,
    type: "DELETE",
    success: function(data, status) {
      source = collections[collectionName];
      viewer.dataSources.remove(source, true);
      delete collections[collectionName];
      getCollections();
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
}
