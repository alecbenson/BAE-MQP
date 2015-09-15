var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});

$(function() {
  bindSubmission();
  getDataSources();
  bindSubmissionButton();
  bindFileSelectionText();
  bindAjaxSpinner();
});


function bindAjaxSpinner() {
  $(document).ajaxStart(function() {
    $("#loading").fadeIn();
  }).ajaxStop(function() {
    $("#loading").fadeOut();
  });
}

function getDataSources() {
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
        //Remove previous KML entities
        viewer.entities.removeAll();
        //Load the KML object
        var path = "/data/" + data.filename;
        viewer.dataSources.add(Cesium.KmlDataSource.load(path))
          .then(function(kmlData) { //success
              viewer.flyTo(kmlData.entities);
            },
            function(error) { //failure
              errorMsg.innerHTML = error + ': Bad or null KML.';
            }
          );
        getDataSources();
      },
      error: function(xhr, desc, err) {}
    });
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
    var check = "<div class='checkbox'><label><input type='checkbox'>" + file + "</label></div>";
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
