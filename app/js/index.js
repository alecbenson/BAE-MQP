var viewer = new Cesium.Viewer('cesiumContainer', {
  animation: true,
  timeline: true
});

$(function() {
  //Handle form submission events
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
        var path = "/data/" + data.filename;

        //Remove previous KML entities
        viewer.entities.removeAll();

        //Load the KML object
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

  getDataSources();

  //Bind submit button to form submission
  $(document).on("click", ".btn-submit", function() {
    $("#uploadform").submit();
  });

  //When a file is selected, get the selection
  $(document).on('change', '.btn-file :file', function() {
    var input = $(this),
      numFiles = input.get(0).files ? input.get(0).files.length : 1,
      label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
  });

  //Result of file selection
  $('.btn-file :file').on('fileselect', function(event, numFiles, label) {
    $("#file-selection").html(label)
  });

  //Show/hide ajax spinner when uploading a file
  $(document).ajaxStart(function() {
    $("#loading").fadeIn();
  }).ajaxStop(function() {
    $("#loading").fadeOut();
  });
});

function getDataSources() {
  $.ajax({
    url: "/datasources",
    type: "GET",
    dataType: "JSON",
    processData: false,
    contentType: false,
    success: function(data, status) {
      console.log("Data:" + data)
      var files = JSON.parse(data);
      renderDatasourceBoxes(files);
    },
    error: function(xhr, desc, err) {
      console.log("Failed: " + desc + err)
    }
  });
};

function renderDatasourceBoxes(files) {
  $("#datasources").empty();
  var dataDiv = $("#datasources");
  $.each(files, function(index, file) {
    var check = "<div class='checkbox'><label><input type='checkbox'>" + file + "</label></div>";
    $(dataDiv).append(check);
  });
}
