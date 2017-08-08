var p = {
  file: {
    index: {},                  // The file index links file ID as primary key to file path & data.
    path: {
      base: "Documentatie",     // Base filepath
      cur: "Documentatie"       // Init as base
    },
  },
  content: {
    curFile: 0,                 // Current file id
    sel: ".articleWrapper article", // Article container
    type: "md"                  // Content file extention
  },
  nav: {
    sel: "nav",                 // Navigation container
    breadcrumbs: "#breadcrumbs",// Breadcrumbs container
    scope: [],                  // Current navigation scope
    tooltip: false              // Bind tooltip to partitions?
  },
  modal: {
    sel: "#modal-iframe"
  },
  idleTime: {
    lim: 15,                    // Reset time in minutes
    cur: 0                      // Current idle time in minutes
  }
};


//Qtip settings
var qtipContentAttr = "data-name";
var qconfig = {
    show: { delay: 0, solo: true, effect: false },
    hide: { when: 'mouseout', delay: 50, effect: false },
    position: { my: 'bottom right', at: 'top left', target: 'mouse' },
    style: { classes: 'qtip-dark' }
  };

//iziModal settings
var iziConfig = {
    iframe: true,
    iframeHeight: $(window).height() * 0.9,
    width:        $(window).width()  * 0.75,
    timeout: true
}

hljs.configure({
  tabReplace: '  '
})


var d3d;


$(document).ready(function() {
  $(p.nav.sel).height( $(window).height() );

  $(p.modal.sel).iziModal(iziConfig);

  // Initialise breadcrumbs
  getFileList(p.file.path.base, p.content.type, function(list) {
    // Make reference arrays global
    p.file.index = buildFileIndex(list);
    // console.log(p.file.index);

    // Build the sunburst diagram and make the used data globally available
    d3d = buildSunBurst(list, p.nav.sel);

    // Build breadcrumbs
    breadcrumbUpdate(p.file.index[0]);
    // Update article column
    articleUpdate(p.file.index[0]);
  });

  idleTimeInit();
});


// Setup functions
////////////////////
// The file index links file ID as primary key to file path & data. It's a computed lookup table.
function buildFileIndex(obj, ret={}, path="") {
  $.each(obj, function(key, val) {
    // Only act when an ID is found
    if (key == 'i') {
      // Determine file path
      path += "/"+obj["n"];

      // Build upon return object
      ret[val] = { 'path': path, "obj": obj };

      // If there is a subfolder
      if (typeof(obj['children']) == "object") {
        $.each(obj['children'], function(k, v) {
          // Calling itself makes things recursive
          buildFileIndex(obj['children'][k], ret, path);
        });
      }
    }
  });

  return ret;
}


// Build the sunburst diagram used for navigation
function buildSunBurst(list, elem) {
  // Sunburst settings
  var partition = d3.select(elem).append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .chart("partition.arc")
      .value("s")
      // .value("_COUNT_")
      // .diameter(800)
      // .zoomable([1, 5])
      .collapsible()
      .duration(500)
      .colors( ['#8dd3c7','#f6f6b3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'] )
      .sortable("_ASC_")
      .name("n")
      ;

  // Build sunburst
  partition.draw(list);



  // Every SVG element
  $.each($("nav svg g").children(), function(key, val) {
    elem = $(val);

    // Add click event
    elem.click(function(event) {
      navClickhandler( $(this) );
    });

    // Add tooltip
    if (p.nav.tooltip)
      elem.qtip( $.extend(true, qconfig, { content: { attr: qtipContentAttr } } ) );
  });


  updateSunburst(0);

  return partition;
}


// Update the sunburst diagram
function updateSunburst(id) {
  getNavScope(p.file.index[id]);

  // Every SVG element
  $.each($("nav svg g").children(), function(key, val) {
    elem = $(val);

    // Identify current node
    if (elem.attr('id') == id) elem.addClass("current");
    else                       elem.removeClass("current");

    // If elem is a label
    if (elem.is("text")) {
      var i = elem.attr('id');

      // Show every label
      elem.attr("style", "display: block");

      // Hide specific labels
      if ($.inArray(i, p.nav.scope) < 0) { // If it's not in navScope
        if (i != id)                    // If it's not the current node
          elem.attr("style", "display: none");
      }
    }
  });
}


// Navscope grabs the IDs of files in current and (current+1) depth
function getNavScope(index) {
  p.nav.scope = [];

  // Prep path to achieve uniformity
  var path = index.path;
  path = path.replace(/^\//, '');
  path = path.replace(/\/$/, '');
  path = "/"+ path.replace("."+p.content.type, '') +"/";
  path = path.replace("/", "\/");

  if (index.obj.isLeaf) // Remove two folders from path
    path = path.replace(/[\w\s]+\/[\w\s\-]+\/$/g, '');

  // Folder depth
  var pathNodes = path.split("/").length;

  // Match every relevant file
  var pattern = new RegExp("^"+path, "");

  $.each(p.file.index, function(key, val) {
    // Get everything in current folder
    if ( pattern.test(val['path']) ) {
      // Count current nodes folder depth
      var pathSplit = val['path'].split("/");

      // Everything that's not in a subfolder OR
      // Everything that's no deeper than 1 subfolder if clicked node is a leaf
      if (pathSplit.length == pathNodes ||
         (index.obj.isLeaf && pathSplit.length == (pathNodes+1))) {

        // Exclude self-named file
        if (pathSplit[ pathSplit.length-1 ] != "_"+pathSplit[ pathSplit.length-2 ]) {
          p.nav.scope.push(key);
        }
      }
    }
  });

  return p.nav.scope;
}








// Usage functions
////////////////////
// Do full reset
function reset() {
  // Lazy but effective reset
  location.reload();
}

// Function handles click events from the navigation column
function navClickhandler(elem, raise=false) {
  var id = $(elem).attr("id");

  // Get element information from fileIndex
  var node = p.file.index[id];

  // Build file path
  var path = node.path +"."+ p.content.type;

  // Raise the D3 click event
  if (raise) {
    d3d._events["click:path"][0].callback( p.file.index[id]['obj'] );
  }


  // Update article column
  articleUpdate(p.file.index[id]);
  // Update breadcrumbs in nav column
  breadcrumbUpdate(p.file.index[id]);
  // Update sunburst Labels etc
  updateSunburst(id)
}


// Update the current article
function articleUpdate(index) {
  console.log(index.path);

  // Store current file id globally
  p.content.curFile = index['obj']['i'];

  // Strip exces '/' from path
  var path = index['path'].replace(/^\//, '');

  // Add file extention to path
  path += "."+p.content.type;

  // Define current path globally
  p.file.path.cur = path;

  getMarkDownFile(path, function(ret) {
    // Replace some keywords
    ret = extraMarkdown(ret);

    // Show article
    $(p.content.sel).html(ret);

    // Highlight code
    $('code').each(function(i, block) {
      var path = $(block).html();

      if (path.substr(0, 4) == "http") {
        if (path.length < 200) {

          getCodeFile(path, function(code) {
            $(block).text(code);
            hljs.highlightBlock(block);
          });

        }
      }
      else if (path.substr(0,5) == "sunb:") {
        path = p.file.path.cur.replace(/[\w\s\-\.\_]+$/, '')+path.replace(/^sunb\:/, '');

        getCodeFile(path, function(code) {
          $(block).text(code);
          hljs.highlightBlock(block);
        });
      }
      else {
        hljs.highlightBlock(block);
      }
    });

    // Scroll to top
    window.scrollTo(0, 0);

    // Catch external links to modal
    $("a[href^=http]").click(function(event) {
      event.preventDefault();
      $(p.modal.sel).iziModal('open', event);
    });

    // Catch internal links
    var link = $("a[href^=sunb]").click(function(event) {
      event.preventDefault();
      var path = $(this)
        .attr("href")             // Get href attribute
        .replace(/^sunb:/, '')    // Remove identifier prefix
        .replace(/(%20)/g, " ");  // Decode spaces

      $.each(p.file.index, function(key, val) {
        if (p.file.index[key].path == path) {
          navClickhandler($("#"+p.file.index[key].obj.i), true);
        }
      });
    });
  });
}




// Build the breadcrumbs
function breadcrumbUpdate(index) {
  // Start with clean slate
  $(p.nav.breadcrumbs).html("");

  // Strip exces '/' & file extention from path
  var path = index['path'].replace("."+p.content.type, '');
  path = path.replace(/^\/|\/$/, '');

  // Iterate every folder in path
  var list = path.split("/");
  $.each(list, function(key, val) {
    // Find id through parent node of index
    var dif = list.length - key - 1;
    var parent = index['obj'];
    for (var i=0; i<dif; i++) {
      parent = parent['parent'];
    }
    var id = parent['i'];

    // Build HTML
    var span = $("<span></span>")
      .attr("id", id)
      .click(function() { navClickhandler(this, true); })
      .text(val.replace(/^-/, ''))
      .appendTo($(p.nav.breadcrumbs));

    // Add devider if applicable
    if (key != (list.length-1)) {
      var span = $("<span></span>")
        .addClass('devider')
        .html("&#x25BA;")
        .appendTo($(p.nav.breadcrumbs))
    }
  });
}


function getHTMLFileList(path) {
  // Build the list in HTML using navScope
  var ul = $("<ul></ul>")
    .addClass('fileList');

  $.each(p.nav.scope, function(key, id) {
    var li = $("<li></li>")
      .attr("id", id)
      .text(p.file.index[id]['obj']['n'].replace(/^\-/, ''))
      .attr( "onClick", "navClickhandler(this, true)" ) // Oldschool inline event listner :(
      .appendTo(ul);
  });
  ul = ul.prop('outerHTML');

  return ul;
}




// Auto reset functions
/////////////////////////
function idleTimeInit() {
  //Increment the idle time counter every minute.
  var idleInterval = setInterval(idleTimeIncrement, 60000); // Every minute

  //Zero the idle timer on mouse movement.
  $(this).mousemove(function (e) { p.idleTime.cur = 0; });
  $(this).mousedown(function (e) { p.idleTime.cur = 0; });
  $(this).keypress (function (e) { p.idleTime.cur = 0; });
}

function idleTimeIncrement() {
  p.idleTime.cur++;
  // If time has passed
  if (p.idleTime.cur >= p.idleTime.lim) {
    p.idleTime.cur = 0;
    // If not already showing root
    if (p.file.path.cur != p.file.path.base+"."+p.content.type)
      reset();
  }
}





// Extend Markdown capabilities
/////////////////////////////////
function extraMarkdown(input) {
  var index = p.file.index[ p.content.curFile ]

  // Show list of current navScope with links
  var ret = input.replace(/\{filelist\}/g, getHTMLFileList(path));

  // Give current articles relative filepath, used to link to images
  var path = index.path.replace(/^\//, "");
  if (index.obj.isLeaf)
    path = path.replace(/\/[\w\s\-]+$/g, "");

  ret = ret.replace(/\{path\}/g, path);

  return ret
}





