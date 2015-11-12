/**
 * binds a .btn-delete click to the deleteFile method
 */
function bindDeleteButton() {
  $(document).on("click", ".btn-delete", function() {
    var collectionName = $(this).attr('id');
    console.log(collectionName);
    var collection = collectionSet.getCollection(collectionName);
    collection.deleteCollection();
  });
}

/**
 * binds a .btn-delete click to the deleteFile method
 */
function bindCancelButton() {
  $(document).on("click", ".btn-cancelCollection", function() {
    this.closest('.newCollection').remove();
  });
}

/**
 * binds a .btn-newCollection click to the renderNewCollection method
 */
function bindNewCollectionButton() {
  $(document).on("click", ".btn-newCollection", function() {
    renderNewCollectionForm();
  });
}

/**
 * binds a .btn-newCollection click to the renderNewCollection method
 */
function bindDeleteTrackButton() {
  $(document).on("click", ".btn-deleteTrack", function() {
    var sourceName = $(this).attr('data-source');
    var collectionName = $(this).attr('data-collection');
    var collection = collectionSet.collections[collectionName];
    collection.deleteTrackData(sourceName);
  });
}

/**
 * binds a .btn-newCollection click to the renderNewCollection method
 */
function bindDeleteGraphButton() {
  $(document).on("click", ".btn-deleteGraph", function() {
    var sourceName = $(this).attr('data-graph');
    var collectionName = $(this).attr('data-collection');
    deleteGraphData(collectionName, sourceName);
  });
}

/**
 * binds a .btn-upload-data click to the uploadFile method
 */
function bindUploadDataButton() {
  $(document).on("click", ".btn-upload-data", function(event) {
    Collection.uploadCollectionSource(this);
    return false;
  });
}

/**
 * binds a .btn-upload-data click to the uploadFile method
 */
function bindUploadModelButton() {
  $(document).on("click", ".btn-upload-model", function(event) {
    uploadCollectionModel(this);
    return false;
  });
}

/**
 * binds a .btn-submitCollection click to initialize a new collection
 */
function bindSubmitCollectionButton() {
  $(document).on("click", ".btn-submitCollection", function(event) {
    Collection.createNewCollection(this);
    event.preventDefault();
  });
}

/**
 * Binds a checkbox to a data source in cesium so that clicking the checkbox
 * will toggle the visiblity of the source
 * @param checkbox - a checkbox object selection
 */
function bindDataVisibilityToggle(checkbox) {
  $(checkbox).on('change', function() {
    var sourceName = $(this).attr('data-source');
    var collectionName = $(this).attr('data-collection');
    var state = $(this).prop('checked');

    var collection = collectionSet.collections[collectionName];
    collection.setAllTrackVisibility(state);
  });
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
 * Toggles the visibility of the nav-pane
 */
function bindToggleNavPane() {
  $(document).on("click", ".btn-hideControls", function(event) {
    var inner = $(this).children(":first");
    $(inner).toggleClass("fa-chevron-left fa-chevron-right");

    $("#nav-pane").animate({
      width: 'toggle'
    }, 0).promise().done(function() {
      $("#cesiumContainer").width(function() {
        var navWidth;
        if ($("#nav-pane").is(':visible')) {
          navWidth = '400px';
        } else {
          navWidth = '0px';
        }
        return ('calc(100% - ' + navWidth + ')');
      });
    });
  });
}
