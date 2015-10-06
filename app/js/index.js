var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});

var collections = [];

$(function() {
  bindSubmission();
  getDataSources();

  bindSubmissionButton();

  bindFileSelectionText(document);
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

function bindSubmission() {
  $(document).on("submit", "#uploadform", function(event) {
    event.preventDefault();
    var url = $(this).attr("action");
    $.ajax({
      url: url,
      type: $(this).attr("method"),
      dataType: "JSON",
      data: new FormData(this),
      processData: false,
      contentType: false,
      success: function(data, status) {
        loadJSONFile(data.filename);
        getDataSources();
      },
      error: function(xhr, desc, err) {}
    });
  });
}

function loadKML(filename) {
  //Remove previous KML entities
  viewer.entities.removeAll();
  //Load the KML object
  var path = "/data/" + filename;
  viewer.dataSources.add(Cesium.KmlDataSource.load(path))
    .then(function(kmlData) { //success
        viewer.flyTo(kmlData.entities);
      },
      function(error) { //failure
        errorMsg.innerHTML = error + ': Bad or null KML.';
      }
    );
  getDataSources();
}

function loadJSONFile(filename) {
  var path = "/data/" + filename;
  var dataSource = new TrackDataSource();
  dataSource.loadUrl(path);
  viewer.dataSources.add(dataSource)
  collections[filename] = dataSource;
}

function deleteDataSource(fileName) {
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

function bindDeleteDataSource() {
  $(document).on("click", ".btn-delete", function() {
    deleteDataSource($(this).attr('id'));
  });
}

function bindSubmissionButton() {
  $(document).on("click", ".btn-submit", function() {
    $("#uploadform").submit();
  });
}

function renderDatasourceBoxes(files) {
  var dataDiv = "#datasources";
  $(dataDiv).empty();
  var context = {
    "files": files
  };
  $.when(insertTemplate(dataDiv, "dataCollection.template", context)).done(function() {
    $(dataDiv + " :checkbox").bootstrapToggle();
    bindFileSelectionText(dataDiv);
    bindDataToggle(dataDiv);
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

function bindFileSelectionText(target) {
  $(target).on('change', '.btn-file :file', function() {
    var input = $(this);
    var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    $("#file-selection").html(label)
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
