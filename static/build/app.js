
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("visionmedia-page.js/index.js", Function("exports, require, module",
"\n\
;(function(){\n\
\n\
  /**\n\
   * Perform initial dispatch.\n\
   */\n\
\n\
  var dispatch = true;\n\
\n\
  /**\n\
   * Base path.\n\
   */\n\
\n\
  var base = '';\n\
\n\
  /**\n\
   * Running flag.\n\
   */\n\
\n\
  var running;\n\
\n\
  /**\n\
   * Register `path` with callback `fn()`,\n\
   * or route `path`, or `page.start()`.\n\
   *\n\
   *   page(fn);\n\
   *   page('*', fn);\n\
   *   page('/user/:id', load, user);\n\
   *   page('/user/' + user.id, { some: 'thing' });\n\
   *   page('/user/' + user.id);\n\
   *   page();\n\
   *\n\
   * @param {String|Function} path\n\
   * @param {Function} fn...\n\
   * @api public\n\
   */\n\
\n\
  function page(path, fn) {\n\
    // <callback>\n\
    if ('function' == typeof path) {\n\
      return page('*', path);\n\
    }\n\
\n\
    // route <path> to <callback ...>\n\
    if ('function' == typeof fn) {\n\
      var route = new Route(path);\n\
      for (var i = 1; i < arguments.length; ++i) {\n\
        page.callbacks.push(route.middleware(arguments[i]));\n\
      }\n\
    // show <path> with [state]\n\
    } else if ('string' == typeof path) {\n\
      page.show(path, fn);\n\
    // start [options]\n\
    } else {\n\
      page.start(path);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Callback functions.\n\
   */\n\
\n\
  page.callbacks = [];\n\
\n\
  /**\n\
   * Get or set basepath to `path`.\n\
   *\n\
   * @param {String} path\n\
   * @api public\n\
   */\n\
\n\
  page.base = function(path){\n\
    if (0 == arguments.length) return base;\n\
    base = path;\n\
  };\n\
\n\
  /**\n\
   * Bind with the given `options`.\n\
   *\n\
   * Options:\n\
   *\n\
   *    - `click` bind to click events [true]\n\
   *    - `popstate` bind to popstate [true]\n\
   *    - `dispatch` perform initial dispatch [true]\n\
   *\n\
   * @param {Object} options\n\
   * @api public\n\
   */\n\
\n\
  page.start = function(options){\n\
    options = options || {};\n\
    if (running) return;\n\
    running = true;\n\
    if (false === options.dispatch) dispatch = false;\n\
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);\n\
    if (false !== options.click) window.addEventListener('click', onclick, false);\n\
    if (!dispatch) return;\n\
    var url = location.pathname + location.search + location.hash;\n\
    page.replace(url, null, true, dispatch);\n\
  };\n\
\n\
  /**\n\
   * Unbind click and popstate event handlers.\n\
   *\n\
   * @api public\n\
   */\n\
\n\
  page.stop = function(){\n\
    running = false;\n\
    removeEventListener('click', onclick, false);\n\
    removeEventListener('popstate', onpopstate, false);\n\
  };\n\
\n\
  /**\n\
   * Show `path` with optional `state` object.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @param {Boolean} dispatch\n\
   * @return {Context}\n\
   * @api public\n\
   */\n\
\n\
  page.show = function(path, state, dispatch){\n\
    var ctx = new Context(path, state);\n\
    if (false !== dispatch) page.dispatch(ctx);\n\
    if (!ctx.unhandled) ctx.pushState();\n\
    return ctx;\n\
  };\n\
\n\
  /**\n\
   * Replace `path` with optional `state` object.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @return {Context}\n\
   * @api public\n\
   */\n\
\n\
  page.replace = function(path, state, init, dispatch){\n\
    var ctx = new Context(path, state);\n\
    ctx.init = init;\n\
    if (null == dispatch) dispatch = true;\n\
    if (dispatch) page.dispatch(ctx);\n\
    ctx.save();\n\
    return ctx;\n\
  };\n\
\n\
  /**\n\
   * Dispatch the given `ctx`.\n\
   *\n\
   * @param {Object} ctx\n\
   * @api private\n\
   */\n\
\n\
  page.dispatch = function(ctx){\n\
    var i = 0;\n\
\n\
    function next() {\n\
      var fn = page.callbacks[i++];\n\
      if (!fn) return unhandled(ctx);\n\
      fn(ctx, next);\n\
    }\n\
\n\
    next();\n\
  };\n\
\n\
  /**\n\
   * Unhandled `ctx`. When it's not the initial\n\
   * popstate then redirect. If you wish to handle\n\
   * 404s on your own use `page('*', callback)`.\n\
   *\n\
   * @param {Context} ctx\n\
   * @api private\n\
   */\n\
\n\
  function unhandled(ctx) {\n\
    var current = window.location.pathname + window.location.search;\n\
    if (current == ctx.canonicalPath) return;\n\
    page.stop();\n\
    ctx.unhandled = true;\n\
    window.location = ctx.canonicalPath;\n\
  }\n\
\n\
  /**\n\
   * Initialize a new \"request\" `Context`\n\
   * with the given `path` and optional initial `state`.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @api public\n\
   */\n\
\n\
  function Context(path, state) {\n\
    if ('/' == path[0] && 0 != path.indexOf(base)) path = base + path;\n\
    var i = path.indexOf('?');\n\
\n\
    this.canonicalPath = path;\n\
    this.path = path.replace(base, '') || '/';\n\
\n\
    this.title = document.title;\n\
    this.state = state || {};\n\
    this.state.path = path;\n\
    this.querystring = ~i ? path.slice(i + 1) : '';\n\
    this.pathname = ~i ? path.slice(0, i) : path;\n\
    this.params = [];\n\
\n\
    // fragment\n\
    this.hash = '';\n\
    if (!~this.path.indexOf('#')) return;\n\
    var parts = this.path.split('#');\n\
    this.path = parts[0];\n\
    this.hash = parts[1] || '';\n\
    this.querystring = this.querystring.split('#')[0];\n\
  }\n\
\n\
  /**\n\
   * Expose `Context`.\n\
   */\n\
\n\
  page.Context = Context;\n\
\n\
  /**\n\
   * Push state.\n\
   *\n\
   * @api private\n\
   */\n\
\n\
  Context.prototype.pushState = function(){\n\
    history.pushState(this.state, this.title, this.canonicalPath);\n\
  };\n\
\n\
  /**\n\
   * Save the context state.\n\
   *\n\
   * @api public\n\
   */\n\
\n\
  Context.prototype.save = function(){\n\
    history.replaceState(this.state, this.title, this.canonicalPath);\n\
  };\n\
\n\
  /**\n\
   * Initialize `Route` with the given HTTP `path`,\n\
   * and an array of `callbacks` and `options`.\n\
   *\n\
   * Options:\n\
   *\n\
   *   - `sensitive`    enable case-sensitive routes\n\
   *   - `strict`       enable strict matching for trailing slashes\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} options.\n\
   * @api private\n\
   */\n\
\n\
  function Route(path, options) {\n\
    options = options || {};\n\
    this.path = path;\n\
    this.method = 'GET';\n\
    this.regexp = pathtoRegexp(path\n\
      , this.keys = []\n\
      , options.sensitive\n\
      , options.strict);\n\
  }\n\
\n\
  /**\n\
   * Expose `Route`.\n\
   */\n\
\n\
  page.Route = Route;\n\
\n\
  /**\n\
   * Return route middleware with\n\
   * the given callback `fn()`.\n\
   *\n\
   * @param {Function} fn\n\
   * @return {Function}\n\
   * @api public\n\
   */\n\
\n\
  Route.prototype.middleware = function(fn){\n\
    var self = this;\n\
    return function(ctx, next){\n\
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);\n\
      next();\n\
    };\n\
  };\n\
\n\
  /**\n\
   * Check if this route matches `path`, if so\n\
   * populate `params`.\n\
   *\n\
   * @param {String} path\n\
   * @param {Array} params\n\
   * @return {Boolean}\n\
   * @api private\n\
   */\n\
\n\
  Route.prototype.match = function(path, params){\n\
    var keys = this.keys\n\
      , qsIndex = path.indexOf('?')\n\
      , pathname = ~qsIndex ? path.slice(0, qsIndex) : path\n\
      , m = this.regexp.exec(pathname);\n\
\n\
    if (!m) return false;\n\
\n\
    for (var i = 1, len = m.length; i < len; ++i) {\n\
      var key = keys[i - 1];\n\
\n\
      var val = 'string' == typeof m[i]\n\
        ? decodeURIComponent(m[i])\n\
        : m[i];\n\
\n\
      if (key) {\n\
        params[key.name] = undefined !== params[key.name]\n\
          ? params[key.name]\n\
          : val;\n\
      } else {\n\
        params.push(val);\n\
      }\n\
    }\n\
\n\
    return true;\n\
  };\n\
\n\
  /**\n\
   * Normalize the given path string,\n\
   * returning a regular expression.\n\
   *\n\
   * An empty array should be passed,\n\
   * which will contain the placeholder\n\
   * key names. For example \"/user/:id\" will\n\
   * then contain [\"id\"].\n\
   *\n\
   * @param  {String|RegExp|Array} path\n\
   * @param  {Array} keys\n\
   * @param  {Boolean} sensitive\n\
   * @param  {Boolean} strict\n\
   * @return {RegExp}\n\
   * @api private\n\
   */\n\
\n\
  function pathtoRegexp(path, keys, sensitive, strict) {\n\
    if (path instanceof RegExp) return path;\n\
    if (path instanceof Array) path = '(' + path.join('|') + ')';\n\
    path = path\n\
      .concat(strict ? '' : '/?')\n\
      .replace(/\\/\\(/g, '(?:/')\n\
      .replace(/(\\/)?(\\.)?:(\\w+)(?:(\\(.*?\\)))?(\\?)?/g, function(_, slash, format, key, capture, optional){\n\
        keys.push({ name: key, optional: !! optional });\n\
        slash = slash || '';\n\
        return ''\n\
          + (optional ? '' : slash)\n\
          + '(?:'\n\
          + (optional ? slash : '')\n\
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'\n\
          + (optional || '');\n\
      })\n\
      .replace(/([\\/.])/g, '\\\\$1')\n\
      .replace(/\\*/g, '(.*)');\n\
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');\n\
  }\n\
\n\
  /**\n\
   * Handle \"populate\" events.\n\
   */\n\
\n\
  function onpopstate(e) {\n\
    if (e.state) {\n\
      var path = e.state.path;\n\
      page.replace(path, e.state);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Handle \"click\" events.\n\
   */\n\
\n\
  function onclick(e) {\n\
    if (1 != which(e)) return;\n\
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;\n\
    if (e.defaultPrevented) return;\n\
\n\
    // ensure link\n\
    var el = e.target;\n\
    while (el && 'A' != el.nodeName) el = el.parentNode;\n\
    if (!el || 'A' != el.nodeName) return;\n\
\n\
    // ensure non-hash for the same path\n\
    var link = el.getAttribute('href');\n\
    if (el.pathname == location.pathname && (el.hash || '#' == link)) return;\n\
\n\
    // check target\n\
    if (el.target) return;\n\
\n\
    // x-origin\n\
    if (!sameOrigin(el.href)) return;\n\
\n\
    // rebuild path\n\
    var path = el.pathname + el.search + (el.hash || '');\n\
\n\
    // same page\n\
    var orig = path + el.hash;\n\
\n\
    path = path.replace(base, '');\n\
    if (base && orig == path) return;\n\
\n\
    e.preventDefault();\n\
    page.show(orig);\n\
  }\n\
\n\
  /**\n\
   * Event button.\n\
   */\n\
\n\
  function which(e) {\n\
    e = e || window.event;\n\
    return null == e.which\n\
      ? e.button\n\
      : e.which;\n\
  }\n\
\n\
  /**\n\
   * Check if `href` is the same origin.\n\
   */\n\
\n\
  function sameOrigin(href) {\n\
    var origin = location.protocol + '//' + location.hostname;\n\
    if (location.port) origin += ':' + location.port;\n\
    return 0 == href.indexOf(origin);\n\
  }\n\
\n\
  /**\n\
   * Expose `page`.\n\
   */\n\
\n\
  if ('undefined' == typeof module) {\n\
    window.page = page;\n\
  } else {\n\
    module.exports = page;\n\
  }\n\
\n\
})();\n\
//@ sourceURL=visionmedia-page.js/index.js"
));

require.register("home/index.js", Function("exports, require, module",
"//@ sourceURL=home/index.js"
));
require.register("credits/index.js", Function("exports, require, module",
"//@ sourceURL=credits/index.js"
));
require.register("component-raf/index.js", Function("exports, require, module",
"/**\n\
 * Expose `requestAnimationFrame()`.\n\
 */\n\
\n\
exports = module.exports = window.requestAnimationFrame\n\
  || window.webkitRequestAnimationFrame\n\
  || window.mozRequestAnimationFrame\n\
  || window.oRequestAnimationFrame\n\
  || window.msRequestAnimationFrame\n\
  || fallback;\n\
\n\
/**\n\
 * Fallback implementation.\n\
 */\n\
\n\
var prev = new Date().getTime();\n\
function fallback(fn) {\n\
  var curr = new Date().getTime();\n\
  var ms = Math.max(0, 16 - (curr - prev));\n\
  var req = setTimeout(fn, ms);\n\
  prev = curr;\n\
  return req;\n\
}\n\
\n\
/**\n\
 * Cancel.\n\
 */\n\
\n\
var cancel = window.cancelAnimationFrame\n\
  || window.webkitCancelAnimationFrame\n\
  || window.mozCancelAnimationFrame\n\
  || window.oCancelAnimationFrame\n\
  || window.msCancelAnimationFrame\n\
  || window.clearTimeout;\n\
\n\
exports.cancel = function(id){\n\
  cancel.call(window, id);\n\
};\n\
//@ sourceURL=component-raf/index.js"
));
require.register("map/index.js", Function("exports, require, module",
"var raf = require('raf');\n\
var DEG_TO_RAD = Math.PI/180;\n\
var MAP_WIDTH = 512;\n\
var MAP_HEIGHT = 256;\n\
\n\
module.exports = PanoView;\n\
\n\
var isWebGL = function () {\n\
  try {\n\
    return !! window.WebGLRenderingContext\n\
            && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' );\n\
  } catch(e) {\n\
    console.log('WebGL not available starting with CanvasRenderer');\n\
    return false;\n\
  }\n\
};\n\
\n\
function PanoView(){\n\
\n\
  this.time = 0;\n\
\n\
  this.normalMapCanvas = null;\n\
  this.depthData = null;\n\
\n\
  this.render = this.render.bind(this);\n\
  this.onSceneClick = this.onSceneClick.bind(this);\n\
\n\
  this.canvas = document.createElement( 'canvas' );\n\
  this.context = this.canvas.getContext( '2d' );\n\
\n\
  this.camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, 1, 1100 );\n\
\n\
  this.target = new THREE.Vector3( 0, 0, 0 );\n\
\n\
  this.controller = new THREE.FirstPersonControls(this.camera,document);\n\
\n\
  this.scene = new THREE.Scene();\n\
  this.scene.add( this.camera );\n\
\n\
  this.mesh = null;\n\
\n\
  //this.markerGeo = new THREE.SphereGeometry(2,4,4);\n\
  this.markerGeo = new THREE.PlaneGeometry(2,2,1,1);\n\
  var tex = THREE.ImageUtils.loadTexture('assets/images/cracks.png');\n\
\n\
  this.markerMaterial = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: tex,alphaTest: 0.8 });\n\
\n\
  var grassMap = THREE.ImageUtils.loadTexture( 'assets/images/grass_billboard.png' );\n\
  this.grassMaterial = new THREE.MeshLambertMaterial( { map: grassMap, alphaTest: 0.8, side: THREE.DoubleSide } );\n\
\n\
  var wallMossMap = THREE.ImageUtils.loadTexture( 'assets/images/wall-moss.png' );\n\
  this.wallMossMaterial = new THREE.MeshBasicMaterial( { map: wallMossMap, transparent:true, depthWrite:false,  side: THREE.DoubleSide } );\n\
\n\
  var wallHangMap = THREE.ImageUtils.loadTexture( 'assets/images/leafs.png' );\n\
  this.wallHangMaterial = new THREE.MeshLambertMaterial( { map: wallHangMap, alphaTest:0.9, side: THREE.DoubleSide } );\n\
\n\
  var climbingLeafTex = THREE.ImageUtils.loadTexture( 'assets/images/climbing.png' );\n\
  this.climbingPlantLeafMaterial = new THREE.MeshLambertMaterial({map:climbingLeafTex,alphaTest:0.9, side: THREE.DoubleSide});\n\
  this.climbingPlantMaterial = new THREE.MeshLambertMaterial({color:0x3c8644,ambient:0x000000});\n\
\n\
\n\
  this.hangBillboardGeo = new THREE.PlaneGeometry(5,3,1,1);\n\
  this.climbingBillboardGeo = new THREE.PlaneGeometry(2.6,3.8,1,1);\n\
  this.grassBillboardGeo = new THREE.PlaneGeometry(2,4,1,1);\n\
\n\
  this.init3D();\n\
  this.initEvents();\n\
}\n\
\n\
var p = PanoView.prototype;\n\
\n\
p.ready = function(){\n\
  this.createEdgeFoliage();\n\
  this.createPlants();\n\
  this.createClimbingFoliages();\n\
  this.render();\n\
\n\
}\n\
\n\
p.setPano = function( canvas ) {\n\
  this.mesh.material.uniforms.texture0.value.image = canvas;\n\
  this.mesh.material.uniforms.texture0.value.needsUpdate = true;\n\
}\n\
\n\
p.setNormalMap = function( canvas ) {\n\
  this.normalMapCanvas = canvas\n\
  this.mesh.material.uniforms.texture1.value.image = canvas;\n\
  this.mesh.material.uniforms.texture1.value.needsUpdate = true;\n\
}\n\
\n\
p.setDepthMap = function( canvas ) {\n\
  this.mesh.material.uniforms.texture2.value.image = canvas;\n\
  this.mesh.material.uniforms.texture2.value.needsUpdate = true;\n\
}\n\
\n\
p.createPlants = function(){\n\
  var totalPlants = 200;\n\
  var created = false;\n\
  for (var i = 0; i < totalPlants; i++) {\n\
    var point = this.get3DPointFromUV(0.35 + 0.3*Math.random(),1/totalPlants*i);\n\
\n\
\n\
    var reflectedPoint = point.clone();\n\
    reflectedPoint.z *= -1;\n\
\n\
    created = this.plotIn3D(reflectedPoint);\n\
\n\
    if( created ) {\n\
      this.plotOnTexture(point);\n\
    }\n\
\n\
  };\n\
}\n\
\n\
\n\
p.createEdgeFoliage = function(){\n\
  var totalPlants = MAP_WIDTH/4;\n\
  var normal = new THREE.Vector3(0,-1,0);\n\
  var created = false;\n\
  for (var i = 0; i < totalPlants; i++) {\n\
\n\
    var point = this.get3DPointAtEdge(i*4);\n\
    if( point ){\n\
      var reflectedPoint = point.clone();\n\
      reflectedPoint.z *= -1;\n\
      //reflectedPoint.z *= -1;\n\
\n\
      created = this.plotIn3D(reflectedPoint,'ground',normal);\n\
\n\
      if( created ) {\n\
        this.plotOnTexture(point);\n\
      }\n\
\n\
    }\n\
  };\n\
}\n\
\n\
p.createClimbingFoliages = function(){\n\
  var divider = 32;\n\
  var totalPlants = MAP_WIDTH/divider;\n\
  var normal = new THREE.Vector3(0,-1,0);\n\
  var created = false;\n\
  for (var i = 0; i < totalPlants; i++) {\n\
\n\
    var point = this.get3DPointAtEdge(i*divider, 50);\n\
\n\
    if( point ){\n\
      var reflectedPoint = point.clone();\n\
      reflectedPoint.z *= -1;\n\
\n\
      created = this.plotIn3D(reflectedPoint,'climb');\n\
\n\
      if( created ) {\n\
        this.plotOnTexture(point);\n\
      }\n\
\n\
    }\n\
  };\n\
}\n\
\n\
p.init3D = function(){\n\
\n\
  this.renderer = isWebGL() ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();\n\
  this.renderer.autoClearColor = false;\n\
  this.renderer.setClearColor(0xffffff,1);\n\
  this.renderer.setSize( window.innerWidth, window.innerHeight );\n\
  this.renderer.sortObjects = false;\n\
  this.renderer.autoClear = false;\n\
  //this.renderer.sortElements = true;\n\
\n\
  this.composer = new WAGNER.Composer( this.renderer );\n\
  this.vignettePass = new WAGNER.VignettePass();\n\
  this.bloomPass = new WAGNER.MultiPassBloomPass();\n\
  this.noisePass = new WAGNER.NoisePass();\n\
  this.dirtPass = new WAGNER.DirtPass();\n\
\n\
  var groundMaskUniforms = {\n\
    texture0: { type: \"t\", value: new THREE.Texture() },\n\
    texture1: { type: \"t\", value: new THREE.Texture() },\n\
    texture2: { type: \"t\", value: new THREE.Texture() }\n\
  };\n\
\n\
  var params = {\n\
    uniforms:  groundMaskUniforms,\n\
    vertexShader: require('./water_vs.glsl'),\n\
    fragmentShader: require('./water_fs.glsl'),\n\
    side: THREE.DoubleSide,\n\
    transparent:true,\n\
    lights: false\n\
  }\n\
\n\
  var maskMaterial = new THREE.ShaderMaterial(params);\n\
  //maskMaterial.uniforms.map = new THREE.Texture();\n\
\n\
  this.mesh = new THREE.Mesh(\n\
    new THREE.SphereGeometry( 500, 60, 140 ),\n\
    maskMaterial\n\
  );\n\
\n\
  //this.mesh.scale.z = -1;\n\
\n\
  this.scene.add( this.mesh );\n\
\n\
  this.light = new THREE.DirectionalLight(0xffffff,0.8);\n\
\n\
  this.scene.add(this.light);\n\
\n\
  this.scene.add( new THREE.AmbientLight(0x999999,0.2));\n\
\n\
\n\
  //ground\n\
  var mossTile = THREE.ImageUtils.loadTexture( 'assets/images/moss-tile.jpg' );\n\
  mossTile.repeat.set(200,200);\n\
  mossTile.wrapS = mossTile.wrapT = THREE.RepeatWrapping;\n\
  mossTile.needsUpdate = true;\n\
\n\
  this.ground = new THREE.Mesh( new THREE.PlaneGeometry(4000,4000,1,1), new THREE.MeshLambertMaterial({map:mossTile,ambient:0x000000}));\n\
  this.ground.rotation.x = Math.PI*-0.5;\n\
  this.ground.position.y = -20;\n\
  this.scene.add(this.ground);\n\
\n\
  //tree\n\
  var treeTex = THREE.ImageUtils.loadTexture( 'assets/images/tree.png' );\n\
  var tree = new THREE.Mesh( new THREE.PlaneGeometry(12.5,15,1,1), new THREE.MeshBasicMaterial({map:treeTex,side: THREE.DoubleSide,transparent:true}));\n\
  tree.position.set(30,0,5);\n\
  tree.lookAt(this.camera.position.clone());\n\
  this.scene.add(tree);\n\
\n\
  //tree2\n\
  var treeTex = THREE.ImageUtils.loadTexture( 'assets/images/tree2.png' );\n\
  var tree = new THREE.Mesh( new THREE.PlaneGeometry(13,20,1,1), new THREE.MeshBasicMaterial({map:treeTex,side: THREE.DoubleSide,transparent:true}));\n\
  tree.position.set(-20,0,0);\n\
  tree.lookAt(this.camera.position.clone());\n\
  this.scene.add(tree);\n\
\n\
  this.controller.handleResize();\n\
\n\
  $('#app')[0].appendChild( this.renderer.domElement );\n\
\n\
  window.addEventListener('resize',this.onWindowResize.bind(this));\n\
  this.onWindowResize();\n\
}\n\
\n\
p.initEvents = function(){\n\
  $(this.renderer.domElement).on('click', this.onSceneClick);\n\
}\n\
\n\
p.onSceneClick = function(event){\n\
\n\
  var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);\n\
  var projector = new THREE.Projector();\n\
  projector.unprojectVector(vector, this.camera);\n\
\n\
  var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());\n\
\n\
  var intersects = raycaster.intersectObjects([this.mesh]);\n\
\n\
  if (intersects.length > 0) {\n\
\n\
    var normalizedPoint = intersects[0].point.clone().normalize();\n\
    var u = Math.atan2(normalizedPoint.x, normalizedPoint.z) / (2 * Math.PI) + 0.5;\n\
    var v = Math.asin(normalizedPoint.y) / Math.PI + 0.5;\n\
\n\
    this.plotIn3D(intersects[0].point);\n\
    this.plotOnTexture(intersects[0].point);\n\
    //console.log('intersect: ' + intersects[0].point.x.toFixed(2) + ', ' + intersects[0].point.y.toFixed(2) + ', ' + intersects[0].point.z.toFixed(2) + ')');\n\
  }\n\
  else {\n\
      console.log('no intersect');\n\
  }\n\
}\n\
\n\
p.setDepthData = function( data ){\n\
  this.depthData = data;\n\
}\n\
\n\
\n\
p.setNormalData = function( data ){\n\
  this.normalData = data;\n\
}\n\
\n\
\n\
p.get3DPointFromUV = function( u, v ){\n\
\n\
  var lat = u * 180-90;\n\
  var lon = v * 360-180;\n\
  var r = Math.cos(DEG_TO_RAD *  lat);\n\
\n\
  //range between 0-1\n\
  var pos = new THREE.Vector3();\n\
  pos.x = (r * Math.cos(DEG_TO_RAD * lon) );\n\
  pos.y = (Math.sin(DEG_TO_RAD * lat));\n\
  pos.z = (r * Math.sin(DEG_TO_RAD * lon));\n\
\n\
  pos.normalize();\n\
\n\
  return pos;\n\
};\n\
\n\
p.get3DPointAtEdge = function( textureX , heightThreshold ) {\n\
\n\
  var canvas = this.normalMapCanvas;\n\
  var ctx = canvas.getContext('2d');\n\
  var data = ctx.getImageData(Math.floor(textureX), 0, 1, 255).data;\n\
  var len = data.length;\n\
  var dist,pixelIndex;\n\
\n\
  //ground\n\
  var compareR = 128;\n\
  var compareG = 0;\n\
  var compareB = 126;\n\
\n\
  //sky\n\
  /*var compareR = 128;\n\
  var compareG = 128;\n\
  var compareB = 128;*/\n\
  var rangeStartAt = null;\n\
  var pixel = 0;\n\
  var foundColor = false;\n\
  var result;\n\
\n\
  for (var py = len-4; py > 0; py-=4) {\n\
    //test pixel\n\
    pixel++;\n\
\n\
    if( !foundColor ) {\n\
\n\
      dist = Math.abs(colorDistance( compareR,compareG,compareB, data[py],data[py+1],data[py+2]));\n\
\n\
      if(dist > 58 ) {\n\
\n\
        rangeStartAt = py;\n\
\n\
        result = this.get3DPointFromUV((pixel)/MAP_HEIGHT,textureX/MAP_WIDTH);\n\
\n\
        //check\n\
        foundColor = true;\n\
\n\
      }\n\
    }\n\
\n\
  };\n\
\n\
\n\
  if( foundColor ) {\n\
    if( heightThreshold ) {\n\
\n\
      py = rangeStartAt - heightThreshold*4;\n\
      //test at threshold value\n\
\n\
      dist = Math.abs(colorDistance( 128,128,128, data[py],data[py+1],data[py+2]));\n\
\n\
      if( dist !== 0 ) {\n\
        return result;\n\
      }\n\
    } else  {\n\
      return result;\n\
    }\n\
\n\
  }\n\
\n\
  function colorDistance(colorRed,colorGreen,colorBlue,pixelRed,pixelGreen,pixelBlue){\n\
\n\
    var diffR,diffG,diffB;\n\
\n\
    // distance to color\n\
    diffR = ( colorRed - pixelRed );\n\
    diffG = ( colorGreen - pixelGreen );\n\
    diffB = ( colorBlue - pixelBlue );\n\
    return(Math.sqrt(diffR*diffR + diffG*diffG + diffB*diffB));\n\
\n\
  }\n\
}\n\
\n\
p.plotOnTexture = function(point){\n\
\n\
  var normalizedPoint = point.clone().normalize();\n\
\n\
  var u = 0.5 + Math.atan2(normalizedPoint.z, normalizedPoint.x) / (2 * Math.PI);\n\
  var v = 0.5 - Math.asin(normalizedPoint.y) / Math.PI;\n\
\n\
  //normal\n\
  var canvas = this.mesh.material.uniforms.texture1.value.image;\n\
  var ctx = canvas.getContext('2d');\n\
  var imgd = ctx.getImageData(Math.floor(u*canvas.width), Math.floor(v*canvas.height), 1, 1);\n\
  var pix = imgd.data;\n\
  var normal = new THREE.Vector3(pix[0]/255-0.5,pix[1]/255-0.5,pix[2]/255-0.5);\n\
\n\
  var x = Math.floor(u*MAP_WIDTH);\n\
  var y = Math.floor(v*MAP_HEIGHT);\n\
\n\
  ctx.fillRect(x,y,1,1);\n\
  //this.mesh.material.uniforms.texture1.value.needsUpdate = true;\n\
\n\
}\n\
\n\
\n\
p.getPointData = function(point){\n\
\n\
  var normalizedPoint = point.clone().normalize();\n\
\n\
  var u = 0.5 + Math.atan2(normalizedPoint.z, normalizedPoint.x) / (2 * Math.PI);\n\
  var v = 0.5 - Math.asin(normalizedPoint.y) / Math.PI;\n\
\n\
\n\
  var x = Math.floor((1-u)*MAP_WIDTH);\n\
  var y = Math.floor(v*MAP_HEIGHT);\n\
\n\
  var pixelIndex = y*MAP_WIDTH + x;\n\
\n\
  var distance = this.depthData[pixelIndex];\n\
\n\
  var normal = new THREE.Vector3(\n\
    this.normalData[pixelIndex*3],\n\
    this.normalData[pixelIndex*3+1],\n\
    this.normalData[pixelIndex*3+2]);\n\
\n\
 /* if(this.normalData[pixelIndex*3] === 0 && this.normalData[pixelIndex*3+1] === 0 && this.normalData[pixelIndex*3+2] === 0 ) {\n\
    normal = normal.set(0,1,0);\n\
  }\n\
*/\n\
  return {\n\
    distance: distance,\n\
    normal: normal\n\
  }\n\
\n\
}\n\
\n\
p.plotIn3D = function( point, forceType ){\n\
\n\
  var plant;\n\
\n\
  //get info from normalmap and depthmap\n\
  var pointData = this.getPointData(point);\n\
\n\
  var distanceToCamera = pointData.distance;\n\
  var pointInWorld = point.normalize().multiplyScalar(distanceToCamera);\n\
  var normalInWorld = pointData.normal;\n\
\n\
  var up = new THREE.Vector3(0,-1,0);\n\
\n\
  if( pointData.distance > 140 ) {\n\
    return;\n\
  }\n\
\n\
  if( forceType === 'climb' ) {\n\
\n\
    plant = this.createClimbingPlant();\n\
\n\
  }\n\
  else if( normalInWorld.y < -0.7 || forceType === 'ground') {\n\
    plant = this.createGrass({disableCracks:true});\n\
    //plant.rotation.x = Math.PI*0.5;\n\
    //make rotation\n\
    /*var v = plant.position.clone();\n\
    v.add( up );\n\
    plant.lookAt(v);*/\n\
\n\
  }\n\
  else {\n\
    plant = this.createWallPlant();\n\
\n\
    //make rotation\n\
\n\
    var v = plant.position.clone();\n\
    v.add( normalInWorld );\n\
    plant.lookAt(v);\n\
  }\n\
\n\
  //set position\n\
\n\
  plant.position.copy(pointInWorld);\n\
\n\
  this.scene.add(plant);\n\
\n\
  return plant;\n\
\n\
}\n\
\n\
p.createWallPlant = function(){\n\
  var plant = new THREE.Mesh(this.hangBillboardGeo, this.wallHangMaterial );\n\
\n\
  return plant;\n\
}\n\
\n\
p.createGrass = function( opts ){\n\
\n\
  var plant;\n\
\n\
  if( opts.disableCracks ) {\n\
    plant = new THREE.Object3D();\n\
  }\n\
  else {\n\
    plant = new THREE.Mesh(this.markerGeo, this.markerMaterial);\n\
  }\n\
  plant.rotation.x = Math.PI*0.5;\n\
  //grass billboard sprites\n\
  for (var i = 0; i < 3; i++) {\n\
    var billboard = new THREE.Mesh(this.grassBillboardGeo, this.grassMaterial );\n\
    billboard.rotation.x = Math.PI*-0.5;\n\
    billboard.rotation.y = Math.PI*Math.random();\n\
\n\
    billboard.position.z =  -1;\n\
    billboard.position.x = Math.random()*2-1;\n\
    billboard.position.y = Math.random()*2-1;\n\
\n\
    //billboard.scale.y = 2;\n\
    plant.add(billboard);\n\
  };\n\
\n\
  return plant;\n\
}\n\
\n\
p.createClimbingPlant = function(){\n\
\n\
  var self = this;\n\
\n\
  // smooth my curve over this many points\n\
  var numPoints = 30;\n\
  var path = getPath();\n\
  var spline = new THREE.SplineCurve3(path);\n\
\n\
  function getPath() {\n\
\n\
    var list = [];\n\
    var even = Math.random()>0.5?-1:1;\n\
    var  pos,x,y,z;\n\
\n\
    z = 0;\n\
\n\
    list.push( new THREE.Vector3(0,0,0) );\n\
\n\
    var totalCurves = 5 + Math.random()*20;\n\
\n\
    for (var i =  0; i < totalCurves; i++) {\n\
      x = ((1-i/totalCurves)*Math.random()*0.2 * i) * even ;\n\
\n\
      even *= -1;\n\
\n\
      y = 0.1 + i/1.3;\n\
      pos = new THREE.Vector3(x,y,z);\n\
\n\
      list.push( pos );\n\
    };\n\
    return list;\n\
  }\n\
\n\
  //tube = new THREE.TubeGeometry(extrudePath, segments, 2, radiusSegments, closed2, debug);\n\
  var tubeGeo = new THREE.TubeGeometry(spline, 100, 0.1+Math.random()*0.05, 4, false,true);\n\
  var mesh = new THREE.Mesh(tubeGeo, this.climbingPlantMaterial );\n\
  //var line = new THREE.Line(geometry, material);\n\
\n\
  var len = path.length;\n\
  for ( i =  3; i < len; i+= Math.floor(Math.random()*3+2) ) {\n\
\n\
    var plant = new THREE.Mesh( self.climbingBillboardGeo, self.climbingPlantLeafMaterial );\n\
    plant.position.copy(path[i]);\n\
\n\
    plant.rotation.z = Math.random();\n\
    plant.rotation.y = Math.random();\n\
    plant.scale.set(0.7,0.7,0.7);\n\
\n\
    mesh.add(plant);\n\
  }\n\
\n\
\n\
  return mesh;\n\
}\n\
\n\
p.render = function(){\n\
\n\
  this.renderer.autoClearColor = false;\n\
\n\
  this.renderer.clear();\n\
  this.composer.reset();\n\
\n\
  this.mesh.visible = false;\n\
  this.ground.visible = true;\n\
  this.composer.render( this.scene, this.camera );\n\
\n\
  this.composer.reset();\n\
  this.renderer.clear(false, true, false );\n\
  this.mesh.visible = true;\n\
  this.ground.visible = false;\n\
\n\
  this.composer.render( this.scene, this.camera );\n\
\n\
  this.composer.pass( this.dirtPass );\n\
  this.composer.pass( this.bloomPass );\n\
\n\
  this.composer.toScreen();\n\
\n\
  this.controller.update(0.1);\n\
  this.time += 0.01;\n\
\n\
  raf(this.render);\n\
}\n\
\n\
p.onWindowResize  = function() {\n\
\n\
  var s = 1,\n\
    w = window.innerWidth,\n\
    h = window.innerHeight;\n\
\n\
  this.renderer.setSize( s * w, s * h );\n\
  this.composer.setSize( w, h );\n\
\n\
}\n\
//@ sourceURL=map/index.js"
));
require.register("map/water_vs.glsl", Function("exports, require, module",
"module.exports = '// switch on high precision floats\\n\
varying vec4 mPosition;\\n\
varying vec2 vUv;\\n\
uniform float time;\\n\
\\n\
void main() {\\n\
\\n\
  mPosition = modelMatrix * vec4(position,1.0);\\n\
\\n\
  vUv = uv;\\n\
  vec4 mvPosition = viewMatrix * mPosition;\\n\
  gl_Position = projectionMatrix * mvPosition;\\n\
\\n\
}\\n\
';//@ sourceURL=map/water_vs.glsl"
));
require.register("map/water_fs.glsl", Function("exports, require, module",
"module.exports = 'varying vec4 mPosition;\\n\
uniform sampler2D texture0;\\n\
uniform sampler2D texture1;\\n\
uniform sampler2D texture2;\\n\
uniform float time;\\n\
varying vec2 vUv;\\n\
\\n\
uniform vec3 diffuse;\\n\
uniform vec3 fogColor;\\n\
uniform float fogNear;\\n\
uniform float fogFar;\\n\
\\n\
void main() {\\n\
\\n\
  //normal\\n\
  vec3 diffuseTex1 = texture2D( texture1, vUv ).xyz;\\n\
  vec3 normalizedNormal = normalize(diffuseTex1);\\n\
  float DiffuseTerm = 1.0 - clamp(max(0.0, dot(normalizedNormal, vec3(0.0,1.0,0.0))), 0.0, 1.0);\\n\
  DiffuseTerm = 1.0 - step(DiffuseTerm,0.97);\\n\
\\n\
  //diffuse\\n\
  vec3 diffuseTex0 = texture2D( texture0, vUv ).xyz;\\n\
  float grey = 1.0-(diffuseTex0.r + diffuseTex0.g + diffuseTex0.b)/3.0;\\n\
  vec3 finalDiffuse = mix(diffuseTex0,vec3(0.0),grey);\\n\
\\n\
\\n\
  //depth\\n\
  vec3 diffuseTex2 = texture2D( texture2, vUv ).xyz;\\n\
\\n\
  float thres = 1.0-step(0.1,diffuseTex1.b);\\n\
  //vec4(diffuseTex1,1.0);\\n\
  gl_FragColor = vec4( mix(finalDiffuse,diffuseTex2,0.2),1.0-DiffuseTerm*(1.0-diffuseTex2.x));\\n\
\\n\
\\n\
  //float depth = gl_FragCoord.z / gl_FragCoord.w;\\n\
  //float fogFactor = smoothstep( fogNear, fogFar, depth );\\n\
  //gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );\\n\
\\n\
}\\n\
';//@ sourceURL=map/water_fs.glsl"
));
require.register("boot/index.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Pano = require('map');\n\
\n\
function init() {\n\
  var self = this;\n\
  var _panoLoader = new GSVPANO.PanoLoader({zoom: 1});\n\
  var _depthLoader = new GSVPANO.PanoDepthLoader();\n\
\n\
  var pano = new Pano();\n\
\n\
  _depthLoader.onDepthLoad = function() {\n\
    var x, y, canvas, context, image, w, h, c,pointer;\n\
\n\
    canvas = document.createElement(\"canvas\");\n\
    context = canvas.getContext('2d');\n\
\n\
    w = this.depthMap.width;\n\
    h = this.depthMap.height;\n\
\n\
    canvas.setAttribute('width', w);\n\
    canvas.setAttribute('height', h);\n\
\n\
    image = context.getImageData(0, 0, w, h);\n\
\n\
    for(y=0; y<h; ++y) {\n\
      for(x=0; x<w; ++x) {\n\
        c = this.depthMap.depthMap[y*w + x] / 50 * 255;\n\
        image.data[4*(y*w + x)    ] = c;\n\
        image.data[4*(y*w + x) + 1] = c;\n\
        image.data[4*(y*w + x) + 2] = c;\n\
        image.data[4*(y*w + x) + 3] = 255;\n\
      }\n\
    }\n\
\n\
    context.putImageData(image, 0, 0);\n\
\n\
    //document.body.appendChild(canvas);\n\
    pano.setDepthData(this.depthMap.depthMap);\n\
    pano.setDepthMap(canvas);\n\
\n\
\n\
    canvas = document.createElement(\"canvas\");\n\
    context = canvas.getContext('2d');\n\
\n\
    w = this.depthMap.width;\n\
    h = this.depthMap.height;\n\
\n\
    canvas.setAttribute('width', w);\n\
    canvas.setAttribute('height', h);\n\
\n\
    image = context.getImageData(0, 0, w, h);\n\
    pointer = 0;\n\
\n\
    var pixelIndex;\n\
\n\
    for(y=0; y<h; ++y) {\n\
      for(x=0; x<w; ++x) {\n\
        pointer += 3;\n\
        pixelIndex = (y*w + (w-x))*4;\n\
        image.data[ pixelIndex ] = (this.normalMap.normalMap[pointer]+1)/2 * 255;\n\
        image.data[pixelIndex + 1] = (this.normalMap.normalMap[pointer+1]+1)/2 * 255;\n\
        image.data[pixelIndex + 2] = (this.normalMap.normalMap[pointer+2]+1)/2 * 255;\n\
        image.data[pixelIndex + 3] = 255;\n\
      }\n\
    }\n\
\n\
    pano.setNormalData(this.normalMap.normalMap);\n\
\n\
    context.putImageData(image, 0, 0);\n\
\n\
    document.body.appendChild(canvas);\n\
\n\
    pano.setNormalMap(canvas);\n\
\n\
    pano.ready();\n\
\n\
  }\n\
\n\
  _panoLoader.onPanoramaLoad = function() {\n\
    //document.body.appendChild(this.canvas);\n\
\n\
    pano.setPano(this.canvas);\n\
\n\
    //pano.markerMaterial.envMap.image = this.canvas;\n\
    //pano.markerMaterial.envMap.needsUpdate = true;\n\
\n\
    _depthLoader.load(this.panoId);\n\
  };\n\
\n\
\n\
\n\
/*\n\
  if (navigator.geolocation) {\n\
    navigator.geolocation.getCurrentPosition(successFunction, errorFunction);\n\
  }\n\
  else {\n\
    _panoLoader.load(new google.maps.LatLng(42.345601, -71.098348));\n\
  }\n\
\n\
  function successFunction(position)\n\
  {\n\
      var lat = position.coords.latitude;\n\
      var lon = position.coords.longitude;\n\
      _panoLoader.load(new google.maps.LatLng(lat,lon));\n\
  }\n\
\n\
  function errorFunction(position)\n\
  {\n\
\n\
    _panoLoader.load(new google.maps.LatLng(40.759101,-73.984406));\n\
  }*/\n\
   _panoLoader.setZoom(1);\n\
   _panoLoader.load(new google.maps.LatLng(40.759101,-73.984406));\n\
   //_panoLoader.load(new google.maps.LatLng(40.726786,-73.991728));\n\
\n\
   //_panoLoader.load(new google.maps.LatLng(57.642814,18.296309));\n\
\n\
   //_panoLoader.load(new google.maps.LatLng(40.736952,-73.99806));\n\
   //_panoLoader.load(new google.maps.LatLng(40.759984,-73.972059));\n\
   //_panoLoader.load(new google.maps.LatLng(40.760277,-73.983897));\n\
   //_panoLoader.load(new google.maps.LatLng(59.334429,18.061984));\n\
   //_panoLoader.load(new google.maps.LatLng(40.6849,-73.894615));\n\
\n\
\n\
}\n\
\n\
init();\n\
//@ sourceURL=boot/index.js"
));









require.register("home/template.html", Function("exports, require, module",
"module.exports = '<div id=\"home\" class=\"home\">\\n\
  <div class=\"home-header\">\\n\
    <h1 class=\"home-header-title\">Home</h1>\\n\
  </div>\\n\
</div>\\n\
';//@ sourceURL=home/template.html"
));
require.register("credits/template.html", Function("exports, require, module",
"module.exports = '';//@ sourceURL=credits/template.html"
));

require.register("map/template.html", Function("exports, require, module",
"module.exports = '';//@ sourceURL=map/template.html"
));
require.alias("boot/index.js", "mapsdepth/deps/boot/index.js");
require.alias("boot/index.js", "mapsdepth/deps/boot/index.js");
require.alias("boot/index.js", "boot/index.js");

require.alias("visionmedia-page.js/index.js", "boot/deps/page/index.js");


require.alias("home/index.js", "boot/deps/home/index.js");
require.alias("home/index.js", "boot/deps/home/index.js");
require.alias("home/index.js", "home/index.js");
require.alias("credits/index.js", "boot/deps/credits/index.js");
require.alias("credits/index.js", "boot/deps/credits/index.js");
require.alias("credits/index.js", "credits/index.js");
require.alias("map/index.js", "boot/deps/map/index.js");
require.alias("map/index.js", "boot/deps/map/index.js");
require.alias("component-raf/index.js", "map/deps/raf/index.js");

require.alias("map/index.js", "map/index.js");
require.alias("boot/index.js", "boot/index.js");