var collections = [];
var dataDiv = "#datasources";

/**
 * given a list of all datasource boxes, render them in the side bar
 * @param files - an array of data source files to render panels for
 */
function renderAllCollections(files) {
  $(dataDiv).empty();

  //Loop through each file to render
  $(files).each(function(index, file) {
    //Append the template to the div
    var context = {
      "file": file
    };
    renderCollection(context);
    loadCollectionIfMissing(file);
  });
}

function renderCollection(context) {
  //Append the template to the div
  getTemplateHTML('dataCollection').done(function(data) {
    var templated = applyTemplate(data, context);
    var target = $(templated).appendTo(dataDiv);
    //Bootstrap toggle the checckboxes
    var checkbox = $(target).find('input:checkbox');
    checkbox.bootstrapToggle();
    bindDataVisibilityToggle(checkbox);
  });
}

function renderNewCollectionForm() {
  getTemplateHTML('newCollection').done(function(data) {
    $(data).appendTo(dataDiv);
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
