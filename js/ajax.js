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
    callback("Fail");
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
    callback("Fail");
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


function checkIframeUrl(url, callback) {
  $.ajax({
    type: "POST",
    url: "ajax/checkCrossOrigin.php",
    data: { url: url }
  })
  .done(function(d) {
    callback( d );
  })
  .fail(function() {
    callback("Fail");
  });

//   $.getJSON("/path/to/script.php?url="+url_variable, function (data) {
//    if (data.error) { 
//       // code to display pop-up
//    } else { 
//       // code to display iframe
//    }
// });

}