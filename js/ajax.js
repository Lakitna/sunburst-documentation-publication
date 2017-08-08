function getFileList(folder, extention, callback) {
  $.ajax({
    type: "POST",
    url: "ajax/getFileList.php",
    data: { "folder": folder, "ext": extention }
  })
  .done(function(d) {
    // console.log(d);
    d = $.parseJSON(d);
    callback(d);
  })
  .fail(function() {
    callback("fail");
  });
}


function getMarkDownFile(file, callback) {
  $.ajax({
    type: "POST",
    url: "ajax/getMarkDownFile.php",
    data: { "file": file }
  })
  .done(function(d) {
    // d = $.parseJSON(d);
    callback(d);
  })
  .fail(function() {
    callback("fail");
  });
}


function getCodeFile(url, callback) {
  $.ajax({
    type: "GET",
    url: url,
    dataType: "text"
  })
  .done(function(d) {
    callback( d );
  })
  .fail(function() {
    callback("Failed to get code from "+url);
  });
}