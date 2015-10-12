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
      var resp = JSON.parse(data);
      renderAllCollections(resp);
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
function loadDataSource(dest, filename) {
  var dataSource = new TrackDataSource();
  var filePath = dest + filename;
  dataSource.loadUrl(filePath);
  viewer.dataSources.add(dataSource);
  return dataSource;
}

/**
 * Given a data file, create a new data source and draw the result in cesium
 * @param file - an data file to render in cesium
 */
function loadCollection(context) {
  var collection = new Cesium.DataSourceCollection();
  $.each(context.sources, function(index, source){
    loadDataSource(context.location, source);
  });
  collections[context.name] = collection;
}

/**
 * Uploads a file to the server
 * @param target - an object close to the submission form (typically the button).
 */
function uploadCollectionSource(target) {
  var parentForm = $(target).closest('form');

  $(parentForm).ajaxSubmit({
    url: "/upload",
    type: "POST",
    dataType: "JSON",
    success: function(data, status) {
      renderCollectionSources(data);
      loadDataSource(data.destination, data.filename);
    },
    error: function(xhr, desc, err) {}
  });
}

/**
 * Makes an ajax call to delete a given data collection.
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
