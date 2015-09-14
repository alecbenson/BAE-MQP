$(function() {

  var viewer = new Cesium.Viewer('cesiumContainer', {
    animation: true,
    timeline: true
  });

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
      success: function(data, status) {},
      error: function(xhr, desc, err) {}
    });
  });

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
