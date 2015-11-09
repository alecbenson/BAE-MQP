/**
 * binds a .btn-delete click to the deleteFile method
 */
function bindDeleteButton() {
  $(document).on("click", ".btn-delete", function() {
    deleteCollection($(this).attr('id'));
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
    deleteTrackData(collectionName, sourceName);
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
    uploadCollectionSource(event.target);
    return false;
  });
}

/**
 * binds a .btn-upload-data click to the uploadFile method
 */
function bindUploadModelButton() {
  $(document).on("click", ".btn-upload-model", function(event) {
    uploadCollectionModel(event.target);
    return false;
  });
}

/**
 * binds a .btn-submitCollection click to initialize a new collection
 */
function bindSubmitCollectionButton() {
  $(document).on("click", ".btn-submitCollection", function(event) {
    createNewCollection(event.target);
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

    var sources = collections[collectionName];
    var dataSource = sources[sourceName];
    if (dataSource === undefined) {
      return;
    }
    var entityList = dataSource.entities.values;
    for (var i = 0; i < entityList.length; i++) {
      currentState = entityList[i].show;
      entityList[i].show = !currentState;
    }
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
function toggleNavPane() {
    $("#nav-pane").animate({width:'toggle'},0).promise().done(function(){
      $("#cesiumContainer").width(function(){
        var navWidth;
        if( $("#nav-pane").is(':visible') ){
          navWidth = '400px';
        } else{
          navWidth = '0px';
        }
        return ('calc(100% - ' + navWidth + ')' );
      });
    });
}
