var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});

var collections = [];

$(function() {
  registerAllPartials();
  getDataSources();
  bindFileSelectionText();
  bindUploadButton();
  bindDeleteButton();

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
      renderDatasourceBoxes(files);
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err);
    },
    complete: function(xhr, status) {
      $("#loading").hide();
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
 * binds a .btn-delete click to the deleteFile method
 * @param target - an object close to the submission form (typically the button).
 */
function bindDeleteButton() {
  $(document).on("click", ".btn-delete", function() {
    deleteFile($(this).attr('id'));
  });
}

/**
 * binds a .btn-upload click to the uploadFile method
 */
function bindUploadButton() {
  $(document).on("click", ".btn-upload", function(event) {
    uploadFile(event.target);
    return false;
  });
}

/**
 * Uploads a file to the server
 * @param target - an object close to the submission form (typically the button).
 */
function uploadFile(target) {
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
 * Makes an ajax call to delete a given data source.
 * Running deleteFile will re-render the collections in the toolbar.
 * @param file - the name of the data source to delete
 */
function deleteFile(file) {
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

/**
 * given a list of all datasource boxes, render them in the side bar
 * @param files - an array of data source files to render panels for
 */
function renderDatasourceBoxes(files) {
  var dataDiv = "#datasources";
  $(dataDiv).empty();

  //Loop through each file to render
  $(files).each(function(index, file) {
    //Append the template to the div
    var context = {
      "file": file
    };
    getTemplate('dataCollection', context).done(function(data) {
      var target = $(data).appendTo(dataDiv);
      //Bootstrap toggle the checckboxes
      var checkbox = $(target).find('input:checkbox');
      checkbox.bootstrapToggle();
      bindDataVisibilityToggle(checkbox);
      loadCollectionIfMissing(file);
    });
  });
}

/**
 * If the collection has not been rendered in cesium, render it. Otherwise do nothing
 * @param file - the filename of the collection to load
 */
function loadCollectionIfMissing(file) {
  if ((file in collections) === false) {
    loadJSONFile(file);
  }
}

/**
 * Binds a file selection box so that choosing a file will update the text field
 * next to it, displaying the name of the selected file
 */
function bindFileSelectionText() {
  $(document).on('change', '.btn-file :file', function() {
    var label = $(this).val().replace(/\\/g, '/').replace(/.*\//, '');
    var input = $(this).parents('.input-group').find(':text');
    input.val(label);
  });
}

/**
 * Binds a checkbox to a data source in cesium so that clicking the checkbox
 * will toggle the visiblity of the source
 * @param checkbox - a checkbox object selection
 */
function bindDataVisibilityToggle(checkbox) {
  $(checkbox).on('change', function() {
    var id = $(this).attr('id');
    var source = collections[id];
    if (source === undefined) {
      return;
    }
    var entityList = source.entities.values;
    for (var i = 0; i < entityList.length; i++) {
      currentState = entityList[i].show;
      entityList[i].show = !currentState;
    }
  });
}
