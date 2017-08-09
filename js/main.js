// To do:
/////////////////////
// Add permalinks
// Add history
//
/////////////////////
// Written by Lakitna 2017
// Code released via Github https://github.com/Lakitna/sunburst-documentation-publication
// MIT License
//

var p = {
  file: {
    index: {},                  // The file index links file ID as primary key to file path & data.
    path: {
      base: "Documentatie",     // Base filepath
      cur: ""                   // Inits as base
    },
  },
  content: {
    curFile: 0,                 // Current file id
    sel: ".articleWrapper article", // Article container
    type: "md",                 // Content file extention
    modal: {
      sel: "#modal-iframe"      // Modal selector
    },
  },
  nav: {
    sel: "nav",                 // Navigation container
    breadcrumbs: "#breadcrumbs",// Breadcrumbs container
    scope: [],                  // Current navigation scope
    tooltip: false              // Bind tooltip to partitions?
  },
  reset: {
    active: true,               // Active resetTimer
    lim: 15,                    // Reset time in minutes
    cur: 0                      // Current idle time in minutes
  },
  analytics: {
    key: "XXX",       // Google analytics key
    active: true                // Activate analytics
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

// Highlight settings
hljs.configure({
  tabReplace: '  '
})


var d3d;


/////////////////////
// On document load
/////////////////////
$(document).ready(function() {
  p.file.path.cur = p.file.path.base; // Init current path as base path
  $(p.nav.sel).height( $(window).height() ); // Init nav wrapper height as window height

  $(p.content.modal.sel).iziModal(iziConfig); // Init iziModal

  // Build filelist via Ajax call
  getFileList(p.file.path.base, p.content.type, function(list) {
    // Build file index and make it global
    p.file.index = buildFileIndex(list);
    // console.log(p.file.index);

    // Build the sunburst diagram and make the used data globally available
    d3d = buildSunBurst(list, p.nav.sel);

    breadcrumbUpdate( p.file.index[0] ); // Build breadcrumbs
    articleUpdate   ( p.file.index[0] ); // Update article column
  });

  resetTimerInit();
});


//////////////////
// On modal open
//////////////////
$(document).on('opened', p.content.modal.sel, function (e) {
  // Select the iframe within the modal
  var elem = $(this).children('div').children('div').children('iframe');
  var url = elem.attr("src");

  checkIframeUrl(url, function(d) { // Ajax: Check if url can be loaded in a frame
    if ($.parseJSON(d).error)       // If it can't be loaded > load fallback page
      elem.attr("src", "ajax/crossOriginError.php?url="+url);
  });
});






/////////////////////////
// Navigation functions
/////////////////////////
// Build the sunburst diagram used for navigation
function buildSunBurst(list, elem) {
  // Sunburst settings
  var partition = d3.select(elem).append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .chart("partition.arc")
      .value("s")
      // .value("_COUNT_")
      .collapsible()
      .duration(500)
      .colors( ['#8dd3c7','#f6f6b3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'] )
      .sortable("_ASC_")
      .name("n")
      ;

  // Build sunburst
  partition.draw(list);
  /////////////////////

  // Every SVG element
  $.each($("nav svg > g").children(), function(key, val) {
    elem = $(val);

    // Add click event
    elem.click(function(event) {
      navClickhandler( $(this) );
    });
    // Add tooltip if applicable
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
        if (i != id)                       // If it's not the current node
          elem.attr("style", "display: none");
      }
    }
  });
}


// Function handles click events from the sunburst diagram
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


// Build {filelist}
function getHTMLFileList(path) {
  // Make the list wrapper
  var ul = $("<ul></ul>")
    .addClass('fileList');

  // Build the list items in HTML using navScope
  $.each(p.nav.scope, function(key, id) {
    var li = $("<li></li>")
      .attr("id", id)
      .text(p.file.index[id]['obj']['n'].replace(/^\-/, ''))
      .attr( "onClick", "navClickhandler(this, true)" ) // Oldschool inline event listner :(
      .appendTo(ul);
  });
  ul = ul.prop('outerHTML'); // Object to raw HTML

  return ul;
}






////////////////////////////
// File managing functions
////////////////////////////
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







//////////////////////
// Article functions
//////////////////////
// Update the current article
function articleUpdate(index) {
  console.log(index.path);                     // Show current path in console

  p.content.curFile = index['obj']['i'];       // Store current file id globally
  var path = index['path'].replace(/^\//, ''); // Strip exces '/' from path
  path += "."+p.content.type;                  // Add file extention to path
  p.file.path.cur = path;                      // Define current path globally

  getMarkDownFile(path, function(ret) {
    ret = extraMarkdown(ret);   // Add some extra markdown capabilities
    $(p.content.sel).html(ret); // Show article
    window.scrollTo(0, 0);      // Scroll to top

    // Highlight code blocks
    $('code').each(function(i, block) {
      // Get code from (block content | url | file)
      getCode(block, function(block) {
        hljs.highlightBlock( block );
      });
    });

    // Restyle links that contain images
    $("a:has(img)").addClass("img");

    // Catch external links to modal
    $("a[href^=http]").click(function(event) {
      event.preventDefault();
      $(p.content.modal.sel).iziModal('open', event);
    });

    // Catch internal links
    var link = $("a[href^=sunb]").click(function(event) {
      event.preventDefault();
      var path = $(this)
        .attr("href")            // Get href attribute
        .replace(/^sunb:/, '')   // Remove identifier prefix
        .replace(/(%20)/g, ' '); // Decode spaces

      // Get file id based on path
      $.each(p.file.index, function(key, val) {
        if (p.file.index[key].path == path) {
          // Raise click event based on file id
          navClickhandler($("#"+p.file.index[key].obj.i), true);
        }
      });
    });

    // Trigger pageview
    analyticsPageview();
  });
}


// Get code from (block content | url | file)
function getCode(block, callback) {
  var path = $(block).html();

  if (path.substr(0, 4) == "http") { // If block content starts with http for external links
    if (path.length < 200) {         // If block only contains a url based on character count

      getCodeFile(path, function(code) { // Ajax call to url
        $(block).text(code);             // Replace block content with ajax call return
        callback(block);                 // Fire callback
      });
    }
  }
  else if (path.substr(0,5) == "sunb:") { // If block content starts with sunb: for internal links
    // Current folder path + file link
    path = p.file.path.cur.replace(/[\w\s\-\.\_]+$/, '') + path.replace(/^sunb\:/, '');

    getCodeFile(path, function(code) { // Ajax call to url
      $(block).text(code);             // Replace block content with ajax call return
      callback(block);                 // Fire callback
    });
  }
  else { // Else no external file reference
    callback(block);
  }
}


// Extend Markdown capabilities
function extraMarkdown(input) {
  var index = p.file.index[ p.content.curFile ];

  // Show list of current navScope with links
  var ret = input.replace(/\{filelist\}/g, getHTMLFileList(path));

  // Give current articles relative filepath, used to link to images
  var path = index.path.replace(/^\//, "");
  if (index.obj.isLeaf) { path = path.replace(/\/[\w\s\-]+$/g, ""); }
  ret = ret.replace(/\{path\}/g, path);

  return ret
}







function analyticsPageview() {
  if (p.analytics.active) {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', p.analytics.key, 'auto');
    ga('send', 'pageview');
  }
}





/////////////////////////
// Auto reset functions
/////////////////////////
function resetTimerInit() {
  // Only activate if settings dicate so
  if (p.reset.active) {
    //Increment the idle time counter every minute.
    var idleInterval = setInterval(resetTimerIncrement, 60000); // Every minute

    //Zero the idle timer on mouse movement.
    $(this).mousemove(function (e) { p.reset.cur = 0; });
    $(this).mousedown(function (e) { p.reset.cur = 0; });
    $(this).keypress (function (e) { p.reset.cur = 0; });
  }
}

function resetTimerIncrement() {
  p.reset.cur++;
  // If time has passed
  if (p.reset.cur >= p.reset.lim) {
    p.reset.cur = 0;
    // If not already showing root
    if (p.file.path.cur != p.file.path.base+"."+p.content.type)
      reset();
  }
}

// Do full reset
function reset() {
  // Lazy but effective reset
  location.reload();
}
