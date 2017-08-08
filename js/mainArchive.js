var p = {
  content: {
    path: {
      base: "content",
      cur: ""
    },
    curFolder: "",
    sel: ".articleWrapper article",
    inital: "index.md",
    type: "md"
  },
  nav: {
    sel: "nav #list"
  },
  idleTime: 15 // in minutes
};

var fileList;



$(document).ready(function() {
  p.content.path.cur = p.content.path.base;
  // listUpdate(p.content.path.base);

  getFileList(p.content.path.base, function(list) {
    fileList = list;
    buildFullList(list, $(p.nav.sel), '');
  });


  getMarkDownFile(p.content.path.base+"/"+p.content.inital, function(ret) {
      $(p.content.sel).html(ret);
  });


  idleTimeInit();
});



function buildFullList(list, elem, parent) {
  var text = '';
  $.each(list, function(key, val) {
    // Only process objects
    if ($.type(val) == "object") {
      // If node is a folder
      if (val.folder) {
        var node = $("<ul></ul>");
        node.attr("data-name", val.n);
      }
      else {
        var split = parent.split("/");

        var node = $("<li></li>");
        if (split[ split.length-1 ] == val.n)
          node.addClass("hidden");
      }

      // Pass some data to DOM element
      node.attr("data-id", val.i);
      node.attr("data-path", parent);

      // Make the clickable element
      var textWrapper = $("<p></p>");
      textWrapper.html(val.n);
      textWrapper.click(function() {
        navClickhandler( $(this).parent() );
      });
      textWrapper.appendTo(node);


      // If node is a folder
      if (val.folder) {
        var sub = $("<div></div>");
        sub.appendTo(node);
        node.appendTo(elem);
        buildFullList(list[val.i], node.children("div")[0], parent+"/"+val.n);
      }
      else {
        node.prependTo(elem);
      }
    }
  });
}



function listUpdate(path) {
  var elem = $(p.nav.sel);
  p.content.path.cur = path;
  path = path.split("/");
  p.content.curFolder = path[ path.length-1 ];

  getFileList(p.content.path.cur, function(list) {
    elem.html(""); // Empty list

    var text = '';
    $.each(list, function(key, val) {
      if (val['n'] != p.content.inital.split(".")[0]) {
        // Construct a clickable object for each item in current list depth
        var container = $("<li></li>");
        container.attr("data-id", key);
        if (p.content.curFolder == val['n']) {
          container.addClass('current');
        }
        container.html(val['n']);
        container.click(function() {
          navClickhandler($(this));
        });

        container.appendTo(elem);
      }
    });

    fileList = list; // Make fileList global
  });
}





function navClickhandler(elem) {
  var node = getObjects(fileList, 'i', $(elem).attr("data-id"))[0];

  // Define current folder
  var split = $(elem).attr("data-path").split("/");
  p.content.curFolder = split[ split.length - 1 ];

  // Build file path
  var path = $(elem).attr("data-path")+"/"+node.n;
  if (node.folder) path += "/"+node.n; // If clicked on folder load [folderName]/[folderName].md
  path += "."+p.content.type;

  // Retrieve file
  articleUpdate(path);
}



function reset() {
  p.content.path.cur = p.content.path.base;

  // listUpdate(p.content.path.cur);

  articleUpdate(p.content.inital);
}





function articleUpdate(path) {
  getMarkDownFile(p.content.path.base+"/"+path, function(ret) {
    $(p.content.sel).html(ret);

    $('pre code').each(function(i, block) {
      hljs.highlightBlock(block);
    });
  });
}




function removeLastFromPath(path) {
  path = path.split('/');

  if (path.length > 1) {
    var ret = '';
    $.each(path, function(key, val) {
      if (key != (path.length-1)) {
        ret += val+"/";
      }
    });
    ret = ret.substring(0, ret.length-1); // Remove trailing "/"

    return ret;
  }
  return p.content.path.base;
}

function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else if (i == key && obj[key] == val) {
            objects.push(obj);
        }
    }
    return objects;
}



function idleTimeInit() {
  //Increment the idle time counter every minute.
  var idleInterval = setInterval(idleTimeIncrement, 60000); // Every minute

  //Zero the idle timer on mouse movement.
  $(this).mousemove(function (e) {
      idleTime = 0;
  });
  $(this).mousedown(function (e) {
      idleTime = 0;
  });
  $(this).keypress(function (e) {
      idleTime = 0;
  });
}

function idleTimeIncrement() {
  idleTime++;
  console.log(idleTime);
  if (idleTime >= p.idleTime)
      reset();
}
