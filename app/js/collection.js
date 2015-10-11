var collections = [];
var dataDiv = "#datasources";

/**
 * given a list of all datasource boxes, render them in the side bar
 * @param files - an array of data source files to render panels for
 */
function renderAllCollections(collections) {
  $(dataDiv).empty();

  //Loop through each file to render
  $(collections).each(function(index, collection) {
    //Append the template to the div
    var context = {
      "name": collection
    };
    renderCollection(context);
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
    getCollectionSources(context.name);
  });
}

function renderNewCollectionForm() {
  getTemplateHTML('newCollection').done(function(data) {
    $(data).appendTo(dataDiv);
  });
}

function renderCollectionSources(sources, collectionName) {
  var list = $("#sourceList" + "-" + collectionName);
  getTemplateHTML('sourceList').done(function(data) {
    var context = {
      "sources": sources
    };
    result = applyTemplate(data, context);
    $(list).html(result);
  });
}

/**
 * If the collection has not been rendered in cesium, render it. Otherwise do nothing
 * @param file - the filename of the collection to load
 */
function loadCollectionIfMissing(name) {
  if ((name in collections) === false) {
    loadJSONFile(name);
  }
}
