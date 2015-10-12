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
 * binds a .btn-upload click to the uploadFile method
 */
function bindUploadButton() {
  $(document).on("click", ".btn-upload", function(event) {
    uploadCollectionSource(event.target);
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
