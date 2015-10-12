var collections = [];
var dataDiv = "#datasources";

/**
 * given a list of all datasource boxes, render them in the side bar
 * @param files - an array of data source files to render panels for
 */
function renderAllCollections(collections) {
  $(dataDiv).empty();

  //Loop through each file to render
  $(collections).each(function(index, context) {
    //Append the template to the div
    renderCollection(context);
  });
}

function renderCollection(context) {
  //Append the template to the div
  getTemplateHTML('dataCollection').done(function(data) {
    var templated = applyTemplate(data, context);
    var target = $(templated).appendTo(dataDiv);
    renderCollectionSources(context);
  });
  loadCollection(context);
}

function renderNewCollectionForm() {
  getTemplateHTML('newCollection').done(function(data) {
    $(data).appendTo(dataDiv);
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
      var newCollection = new Cesium.DataSourceCollection();
      collections[data.name] = newCollection;
      renderCollection(data);
    },
    error: function(xhr, desc, err) {
      var error = $(parentForm).find('.errorMessage');
      $(error).show().text(xhr.responseText);
    }
  });
}

function renderCollectionSources(context) {
  getTemplateHTML('sourceList').done(function(data) {
    result = applyTemplate(data, context);
    var list = "#sourceList" + "-" + context.name;
    $(list).html(result);
    var checkbox = $(list + " ul li :checkbox");
    checkbox.bootstrapToggle();
    bindDataVisibilityToggle(checkbox);
  });
}
