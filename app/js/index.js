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
function loadCollection(context) {
  var collection = new Cesium.DataSourceCollection();

  $.each(context.sources, function(index, source) {
    var dataPath = context.location + source;
    addCollectionData(collection, dataPath);
  });
  collections[context.name] = collection;
}

function addCollectionData(collection, dataPath) {
  var dataSource = new TrackDataSource();
  dataSource.loadUrl(dataPath);
  collection.add(dataSource);
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
      var dataPath = data.file.destination + data.file.filename;
      renderCollectionSources(data.context);
      var collectionName = data.context.name;
      var collection = collections[collectionName];
      addCollectionData(collection, dataPath);
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
      var collection = collections[collectionName];

      //Remove all datasources in this collection from the viewer
      for(var i = 0; i < collection.length; i++){
        var ds = collection.get(i);
        if(viewer.dataSources.contains(ds)){
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
