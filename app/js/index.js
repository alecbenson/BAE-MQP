var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});

$(function() {
  bindSubmission();
  getDataSources();
  bindSubmissionButton();
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
}

function deleteDataSource(fileName) {
  $.ajax({
    url: "/datasources/" + fileName,
    type: "DELETE",
    success: function(data, status) {
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
  var dataDiv = $("#datasources");
  $(dataDiv).empty();
  $.each(files, function(index, file) {
    var del = "<span class='btn-delete' id='" + file + "'><i class='fa fa-trash-o'></i></span>";
    var check = "<div class='checkbox'><label><input type='checkbox'>" + file + "</label> " + del + "</div>";
    $(dataDiv).append(check);
  });
}

function bindFileSelectionText() {
  $(document).on('change', '.btn-file :file', function() {
    var input = $(this);
    var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    $("#file-selection").html(label)
  });
}
