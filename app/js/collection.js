var collections = {};
var dataDiv = "#collections";

/**
 * given a list of all datasource boxes, render them in the side bar
 * @param files - an array of data source files to render panels for
 */
function renderAllCollections(collections) {
  $(dataDiv).empty();
  //Loop through each file to render
  for (var key in collections) {
    var collection = collections[key];
    //Append the template to the div
    renderCollection(collection);
  }
}

function renderCollection(context) {
  //Append the template to the div
  console.log(context);
  getTemplateHTML('dataCollection').done(function(data) {
    var templated = applyTemplate(data, context);
    var target = $(templated).prependTo(dataDiv);
    renderCollectionSources(context);
  });
  loadCollection(context);
}

function renderNewCollectionForm() {
  getTemplateHTML('newCollection').done(function(data) {
    $(data).prependTo(dataDiv);
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
      console.log(data);
      collections[data.name] = {};
      renderCollection(data);
      $(parentForm).remove();
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
