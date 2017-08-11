// To do:
/////////////////////
// Add permalinks
// Add history
// Add max breadcrumb depth
/////////////////////
// Written by Lakitna 2017
// Code released via Github https://github.com/Lakitna/sunburst-documentation-publication
// MIT License
/////////////////////


/////////////////
// Preferences //
/////////////////
var p = {
  file: {
    type: "md",                 // Content file extention
    path: "Content",            // Base filepath
    footer: {
      name: "+footer.md",       // Footer filename
      path: ""                  // Empty for base path
    }
  },
  content: {
    sel: ".articleWrapper article", // Article container
    modal: {
      sel: "#modal-iframe"      // Modal selector
    },
    abbr: {
      show: false,              // Show styling for abbreviations
      tooltip: {
        active: false,          // Activate abbreviation tooltips
        attr: "title"           // Attribute to dictate tooltip content
      }
    }
  },
  nav: {
    sel: "nav",                 // Navigation container
    breadcrumbs: {
      sel: "#breadcrumbs",      // Breadcrumbs container
      max: 0                    // Maximum breadcrumb depth. 0 = infinite
    },
    tooltip: {
      active: false,            // Activate sunburst partition tooltips
      attr: "data-name"         // Attribute to dictate tooltip content
    }
  },
  reset: {
    active: true,               // Active resetTimer
    time: 15                    // Reset time in minutes
  },
  analytics: {
    active: true,               // Activate analytics
    key: "XXXXXXXXXXXXX"        // Google analytics key
  }
};

//Qtip settings
var qconfig = {
    show: { delay: 0, effect: false },
    hide: { delay: 0, effect: false },
    position: { my: 'bottom left', at: 'top right', target: 'mouse' },
    style: { classes: 'qtip-dark' }
  };

//iziModal settings
var iziConfig = {
    iframe: true,                             // Is modal content iFrame
    iframeHeight: $(window).height() * 0.9,   // Height of modal in px
    width:        $(window).width()  * 0.75,  // Width of modal in px
    timeout: true                             // Can it time out?
}

// Highlight settings
hljs.configure({
    tabReplace: '  ' // Replace tabs with x spaces
})




// Global vars
var g = {
  file: {
    index: {},                  // The file index links file ID as primary key to file path & data.
    curPath: p.file.path,       // Current file path, inits as base path
    curId: 0,                   // Current file id
  },
  nav: {
    scope: []                   // Current navigation scope
  },
  reset: {
    cur: 0                      // Current idle time in minutes
  },
  d3d: {}                       // The D3 data object from the sunburst diagram
};


/////////////////////
// On document load
/////////////////////
$(document).ready(function() {
  if (p.file.footer.path == "") p.file.footer.path = p.file.path;

  $(p.nav.sel).height( $(window).height() ); // Init nav wrapper height as window height

  $(p.content.modal.sel).iziModal(iziConfig); // Init iziModal

  // Build filelist via Ajax call
  getFileList(p.file.path, p.file.type, function(list) {
    // Build file index and make it global
    g.file.index = buildFileIndex(list);
    // console.log(g.file.index);

    // Build the sunburst diagram and make the used data globally available
    g.d3d = buildSunBurst(list, p.nav.sel);

    breadcrumbUpdate( g.file.index[0] ); // Build breadcrumbs
    articleUpdate   ( g.file.index[0] ); // Update article column
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
    if (p.nav.tooltip.active) {
      elem.children(".shape")
          .qtip( $.extend(true, qconfig, { content: { attr: p.nav.tooltip.attr } } ) );
    }
  });

  updateSunburst(0);

  return partition;
}


// Update the sunburst diagram
function updateSunburst(id) {
  getNavScope(g.file.index[id]);

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
      if ($.inArray(i, g.nav.scope) < 0) { // If it's not in navScope
        if (i != id)                       // If it's not the current node
          elem.attr("style", "display: none");
      }
    }
  });
}


// Function handles click events from the sunburst diagram
function navClickhandler(elem, raise=false) {
  if (typeof(elem) == "object")
    var id = $(elem).attr("id");
  else
    var id = elem;

  // Raise the D3 click event
  if (raise) {
    g.d3d._events["click:path"][0].callback( g.file.index[id]['obj'] );
  }

  // Update article column
  articleUpdate(g.file.index[id]);
  // Update breadcrumbs in nav column
  breadcrumbUpdate(g.file.index[id]);
  // Update sunburst Labels etc
  updateSunburst(id)
}


// Build the breadcrumbs
function breadcrumbUpdate(index) {
  // Start with clean slate
  $(p.nav.breadcrumbs.sel).html("");

  // Strip exces '/' & file extention from path
  var path = index['path'].replace("."+p.file.type, '');
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
      .appendTo($(p.nav.breadcrumbs.sel));

    // Add devider if applicable
    if (key != (list.length-1)) {
      var span = $("<span></span>")
        .addClass('devider')
        .html("&#x25BA;")
        .appendTo($(p.nav.breadcrumbs.sel))
    }
  });
}


// Build {filelist}
function getHTMLFileList(path) {
  // Make the list wrapper
  var ul = $("<ul></ul>")
    .addClass('fileList');

  // Build the list items in HTML using navScope
  $.each(g.nav.scope, function(key, id) {
    var li = $("<li></li>")
      .attr("id", id)
      .text(g.file.index[id]['obj']['n'].replace(/^\-/, ''))
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
  g.nav.scope = [];

  // Prep path to achieve uniformity
  var path = index.path;
  path = path.replace(/^\//, '');
  path = path.replace(/\/$/, '');
  path = "/"+ path.replace("."+p.file.type, '') +"/";
  path = path.replace("/", "\/");

  if (index.obj.isLeaf) // Remove two folders from path
    path = path.replace(/[\w\s]+\/[\w\s\-]+\/$/g, '');

  // Folder depth
  var pathNodes = path.split("/").length;

  // Match every relevant file
  var pattern = new RegExp("^"+path, "");

  $.each(g.file.index, function(key, val) {
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
          g.nav.scope.push(key);
        }
      }
    }
  });
  return g.nav.scope;
}







//////////////////////
// Article functions
//////////////////////
// Update the current article
function articleUpdate(index) {
  console.log(index.path);                     // Show current path in console

  g.file.curId = index['obj']['i'];       // Store current file id globally
  var path = index['path'].replace(/^\//, ''); // Strip exces '/' from path
  path += "."+p.file.type;                  // Add file extention to path
  g.file.curPath = path;                      // Define current path globally

  getMarkDownFile(path, p.file.footer.path +"/"+ p.file.footer.name, function(ret) {
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
      $.each(g.file.index, function(key, val) {
        if (g.file.index[key].path == path) {
          // Raise click event based on file id
          navClickhandler($("#"+g.file.index[key].obj.i), true);
        }
      });
    });

    // Handle abbreviations according to preferences
    if (!p.content.abbr.show)
      $("abbr").addClass("plain").attr("title", "");
    if (p.content.abbr.tooltip.active)
      $("abbr[title]").qtip( $.extend(true, qconfig, { content: { attr: p.content.abbr.tooltip.attr } } ) );

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
    path = g.file.curPath.replace(/[\w\s\-\.\_]+$/, '') + path.replace(/^sunb\:/, '');

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
  var index = g.file.index[ g.file.curId ];

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
    $(this).mousemove(function (e) { g.reset.cur = 0; });
    $(this).mousedown(function (e) { g.reset.cur = 0; });
    $(this).keypress (function (e) { g.reset.cur = 0; });
  }
}

function resetTimerIncrement() {
  g.reset.cur++;
  // If time has passed
  if (g.reset.cur >= p.reset.time) {
    g.reset.cur = 0;
    // If not already showing root
    if (g.file.curPath != p.file.path+"."+p.file.type)
      reset();
  }
}

// Do full reset
function reset() {
  navClickhandler(0, true);
}
