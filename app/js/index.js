var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});

var collections = [];

$(function() {
  getDataSources();
  bindUploadButton();
  bindFileSelectionText();
  bindDeleteDataSource();
});

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
      console.log("Failed: " + desc + err)
    },
    complete: function(xhr, status) {
      $("#loading").hide();
    }
  });
};

function loadJSONFile(filename) {
  var path = "/data/" + filename;
  var dataSource = new TrackDataSource();
  dataSource.loadUrl(path);
  viewer.dataSources.add(dataSource)
  collections[filename] = dataSource;
}

function bindDeleteDataSource() {
  $(document).on("click", ".btn-delete", function() {
    deleteFile($(this).attr('id'));
  });
}

function bindUploadButton() {
  $(document).on("click", ".btn-upload", function(event) {
    uploadFile(event.target);
    return false;
  });
}

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

function deleteFile(fileName) {
  $.ajax({
    url: "/datasources/" + fileName,
    type: "DELETE",
    success: function(data, status) {
      source = collections[fileName];
      viewer.dataSources.remove(source, true);
      delete collections[fileName];
      getDataSources();
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err)
    }
  });
}

function submitDataSourceForm(target) {
  var parentForm = $(target).closest('form');
  $(parentForm).ajaxSubmit(function() {
    uploadFile(parentForm);
    return false;
  });
}

function renderDatasourceBoxes(files) {
  var dataDiv = "#datasources";
  $(dataDiv).empty();
  var context = {
    "files": files
  };

  //Insert the template and bind the toolbar entries
  $.when(insertTemplate(dataDiv, "dataCollection.template", context)).done(function() {
    $(dataDiv + " :checkbox").bootstrapToggle();
    //Convert checkboxes to the cool looking ones!
    bindDataToggle(dataDiv);
    //Load all data sources not in the viewer
    loadMissingCollections(files);
  });
}

function loadMissingCollections(files) {
  for (var index in files) {
    if ((files[index] in collections) == false) {
      loadJSONFile(files[index]);
    }
  }
}

function insertTemplate(target, templateName, context) {
  return $.Deferred(function() {
    var self = this;
    var directory = "/templates/";
    var html = $.get(directory + templateName, function(data) {
      var template = Handlebars.compile(data);
      $(target).append(template(context));
    }, 'html').done(this.resolve);
  });
}

function bindFileSelectionText() {
  $(document).on('change', '.btn-file :file', function() {
    var label = $(this).val().replace(/\\/g, '/').replace(/.*\//, '');
    var input = $(this).parents('.input-group').find(':text')
    input.val(label);
  });
}

function bindDataToggle(target) {
  $(target + " :checkbox").on('change', function() {
    var id = $(this).attr('id');
    var source = collections[id];
    if (source == undefined) {
      return;
    }
    var entityList = source.entities.values;
    for (var i = 0; i < entityList.length; i++) {
      currentState = entityList[i].show;
      entityList[i].show = !currentState;
    }
  });
}
