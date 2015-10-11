var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});

$(function() {
  registerAllPartials();
  getDataSources();
  bindFileSelectionText();
  bindDeleteButton();
  bindCancelButton();
  bindNewCollectionButton();
  bindSubmitCollectionButton();
  bindUploadButton();
});

/**
 * Makes a GET request to the server to retrieve all data sources
 */
function getDataSources() {
  $("#loading").show();
  $.ajax({
    url: "/datasources",
    type: "GET",
    dataType: "JSON",
    processData: false,
    contentType: false,
    success: function(data, status) {
      var files = JSON.parse(data);
      renderAllCollections(files);
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
function loadJSONFile(file) {
  var path = "/data/" + file;
  var dataSource = new TrackDataSource();
  dataSource.loadUrl(path);
  viewer.dataSources.add(dataSource);
  collections[file] = dataSource;
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
      loadJSONFile(data.filename);
      getDataSources();
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
    url: "/datasources/",
    type: "POST",
    success: function(data, status) {
      getDataSources();
    },
    error: function(xhr, desc, err) {}
  });
}

/**
 * Makes an ajax call to delete a given data source.
 * Running deleteFile will re-render the collections in the toolbar.
 * @param file - the name of the data source to delete
 */
function deleteData(file) {
  $.ajax({
    url: "/datasources/" + file,
    type: "DELETE",
    success: function(data, status) {
      source = collections[file];
      viewer.dataSources.remove(source, true);
      delete collections[file];
      getDataSources();
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    }
  });
}
