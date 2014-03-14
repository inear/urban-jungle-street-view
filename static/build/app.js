
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
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("streetview/nav.js", Function("exports, require, module",
"module.exports = Nav;\n\
\n\
function Nav(){\n\
\n\
  this.container = new THREE.Object3D();\n\
\n\
  this.markers = [];\n\
\n\
  this.createArrows();\n\
}\n\
\n\
var p = Nav.prototype;\n\
\n\
p.createArrows = function(){\n\
\n\
  // create a basic shape\n\
  var shape = new THREE.Shape();\n\
  shape.moveTo(4, 0);\n\
  shape.lineTo(7.8, 6.7);\n\
  shape.lineTo(5.4, 8);\n\
  shape.lineTo(4, 5.6);\n\
  shape.lineTo(2.4, 8);\n\
  shape.lineTo(0, 6.7);\n\
  shape.lineTo(4, 0);\n\
\n\
  var arrowGeo = new THREE.ExtrudeGeometry(shape,{amount:0.2, bevelEnabled:true,bevelThickness:0.3,bevelSize:0.1});\n\
\n\
  arrowGeo.applyMatrix(new THREE.Matrix4().makeTranslation(-4,-4,0));\n\
  arrowGeo.applyMatrix(new THREE.Matrix4().makeScale(0.3,0.3,0.3));\n\
  arrowGeo.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI*0.5));\n\
  arrowGeo.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI));\n\
  arrowGeo.applyMatrix(new THREE.Matrix4().makeTranslation(0,-2,5));\n\
\n\
  var tex = THREE.ImageUtils.loadTexture( 'assets/images/concrete.jpg' );\n\
  tex.repeat.x = tex.repeat.y = 0.1;\n\
\n\
  markerGeo = new THREE.SphereGeometry(2,6,6);\n\
  markerGeo.applyMatrix(new THREE.Matrix4().makeTranslation(0,-2,5));\n\
\n\
  var marker = new THREE.Mesh( markerGeo, new THREE.MeshBasicMaterial({color:0xff0000,visible:false}));\n\
  var arrow = new THREE.Mesh( arrowGeo,new THREE.MeshLambertMaterial({map: tex, wireframe:false,color:0x666666,ambient:0x333333}));\n\
  arrow.name = 'arrow';\n\
  //shadows\n\
  shadowTex = THREE.ImageUtils.loadTexture( 'assets/images/arrow-shadow.png' );\n\
  var shadow = new THREE.Mesh( new THREE.PlaneGeometry(3,3,1,1), new THREE.MeshBasicMaterial({map:shadowTex,transparent:true}));\n\
  shadow.rotation.x = -Math.PI*0.5;\n\
  shadow.rotation.z = Math.PI;\n\
  shadow.position.y = -2.3;\n\
  shadow.position.z = 5;\n\
  shadow.name = 'shadow';\n\
\n\
  arrow.add(shadow);\n\
  marker.add(arrow);\n\
\n\
  marker.arrow = arrow;\n\
\n\
  for (var i = 0; i < 4; i++) {\n\
    var newMarker = marker.clone();\n\
    newMarker.arrow = newMarker.getObjectByName('arrow');\n\
    newMarker.shadow = newMarker.getObjectByName('shadow');\n\
    //newArrow.rotation.y = Math.PI/4*i*2;\n\
    this.markers.push(newMarker);\n\
  };\n\
\n\
}\n\
\n\
p.setLinks = function( links, centerHeading ) {\n\
\n\
  for (var i = 0; i < 4; i++) {\n\
    if( this.markers[i].parent ) {\n\
      this.container.remove(this.markers[i]);\n\
      this.markers[i].active = false;\n\
    }\n\
  }\n\
  console.log(links)\n\
  for ( i = links.length - 1; i >= 0; i--) {\n\
\n\
    this.markers[i].rotation.y = ((links[i].heading-90-centerHeading)*-1)*Math.PI/180;\n\
    this.markers[i].pano = links[i].pano;\n\
    this.markers[i].description = links[i].description;\n\
    this.markers[i].active = true;\n\
    this.container.add(this.markers[i]);\n\
\n\
  };\n\
\n\
}\n\
//@ sourceURL=streetview/nav.js"
));
require.register("streetview/index.js", Function("exports, require, module",
"var raf = require('raf');\n\
var Emitter = require('emitter');\n\
var Nav = require('./nav');\n\
var detector = require('./utils/detector');\n\
\n\
var DEG_TO_RAD = Math.PI/180;\n\
var MAP_WIDTH = 512;\n\
var MAP_HEIGHT = 256;\n\
\n\
module.exports = PanoView;\n\
\n\
function PanoView(){\n\
\n\
  this.container = $('#app')[0];\n\
  this.winSize = {\n\
    width:0,\n\
    height:0\n\
  }\n\
  this.time = 0;\n\
  this.isIntro = true;\n\
  this.isRunning = false;\n\
  this.fadeAmount = 1;\n\
\n\
  this.mouse2d = new THREE.Vector2();\n\
  this.isUserInteracting = false;\n\
  this.isUserInteractingTime = 0;\n\
  this.onMouseDownMouseX = 0;\n\
  this.onMouseDownMouseY = 0;\n\
  this.lon = 90;\n\
  this.onMouseDownLon = 0;\n\
  this.lat = 0;\n\
  this.onMouseDownLat = 0;\n\
  this.phi = 0;\n\
  this.theta = 0;\n\
  this.updatedTarget = new THREE.Vector3();\n\
  this.target = new THREE.Vector3();\n\
\n\
  this.normalMapCanvas = null;\n\
  this.depthData = null;\n\
\n\
  this.render = this.render.bind(this);\n\
  this.onSceneClick = this.onSceneClick.bind(this);\n\
\n\
  this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 1, 1100 );\n\
\n\
  this.target = new THREE.Vector3( 0, 0, 0 );\n\
\n\
  //this.controller = new THREEx.DragPanControls(this.camera)//new THREE.FirstPersonControls(this.camera,this.container);\n\
\n\
  // initialize object to perform world/screen calculations\n\
  this.projector = new THREE.Projector();\n\
\n\
  this.scene = new THREE.Scene();\n\
\n\
  this.scene.add( this.camera );\n\
\n\
  this.nav = new Nav();\n\
  this.scene.add(this.nav.container);\n\
\n\
  this.mesh = null;\n\
  this.foliageContainer = null\n\
\n\
  //this.grassBaseGeo = new THREE.SphereGeometry(2,4,4);\n\
  this.grassBaseGeo = new THREE.PlaneGeometry(2,2,1,1);\n\
  var cracksTex = THREE.ImageUtils.loadTexture('assets/images/cracks.png');\n\
\n\
  this.grassBaseMaterial = new THREE.MeshLambertMaterial({ map: cracksTex,side: THREE.DoubleSide,alphaTest: 0.3, opacity:0.7,transparent:true});\n\
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
  this.grassBillboardGeo = new THREE.PlaneGeometry(4,4,1,1);\n\
\n\
  this.init3D();\n\
\n\
}\n\
\n\
var p = PanoView.prototype;\n\
\n\
Emitter(p);\n\
\n\
p.generateNature = function(){\n\
  this.resetNature();\n\
  this.createEdgeFoliage();\n\
  this.createClimbingFoliages();\n\
  this.createPlants();\n\
\n\
  this.tree1.position.z = Math.random()*10-5;\n\
  this.tree2.position.z = Math.random()*10-5;\n\
\n\
  if( !this.isIntro ) {\n\
    this.fadeIn();\n\
  }\n\
\n\
}\n\
\n\
p.start = function() {\n\
  console.log(\"3d start\");\n\
\n\
  this.isRunning = true;\n\
  this.render();\n\
  this.fadeIn( function(){\n\
    this.initEvents();\n\
    $('body').addClass('grab');\n\
  }.bind(this));\n\
\n\
\n\
}\n\
\n\
p.transitionOut = function(){\n\
  this.isIntro = true;\n\
  this.isRunning = false;\n\
  this.removeEvents();\n\
\n\
  $('body').removeClass('grab');\n\
\n\
  this.fadeOut( function(){\n\
    this.emit('transitionOutComplete');\n\
  }.bind(this));\n\
\n\
}\n\
\n\
p.fadeIn = function( callback ){\n\
\n\
  if( !callback ) {\n\
    callback = function(){};\n\
  }\n\
\n\
  TweenMax.to(this,2,{fadeAmount:0});\n\
\n\
  if( this.isIntro ) {\n\
    this.isIntro = false;\n\
    TweenMax.fromTo(this,5,{lat:82,lon:88},{delay:1,lat:5, lon: -11, onComplete:callback, ease:Sine.easeInOut});\n\
  }\n\
\n\
}\n\
\n\
p.fadeOut = function( callback ){\n\
\n\
  if( !callback ) {\n\
    callback = function(){};\n\
  }\n\
\n\
  TweenMax.to(this,1,{fadeAmount:1, onComplete:callback});\n\
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
p.resetNature = function(){\n\
  var obj;\n\
\n\
  for (var i = this.foliageContainer.children.length - 1; i >= 0; i--) {\n\
    obj = this.foliageContainer.children[i];\n\
    this.foliageContainer.remove(obj);\n\
    obj = undefined;\n\
  };\n\
}\n\
\n\
p.createPlants = function(){\n\
\n\
  var created = false;\n\
\n\
  var totalPlants = 200;\n\
  for (var i = 0; i < totalPlants; i++) {\n\
    var point = this.get3DPointFromUV(0.35 + 0.3*Math.random(),1/totalPlants*i);\n\
\n\
    var reflectedPoint = point.clone();\n\
    reflectedPoint.z *= -1;\n\
\n\
    created = this.plotIn3D(reflectedPoint);\n\
\n\
    /*if( created ) {\n\
      this.plotOnTexture(point);\n\
    }*/\n\
\n\
  };\n\
\n\
  totalPlants = 200;\n\
  for (var i = 0; i < totalPlants; i++) {\n\
    var point = this.get3DPointFromUV(0.55 + 0.3*Math.random(),0.4 + 1/totalPlants*i*0.2);\n\
\n\
    var reflectedPoint = point.clone();\n\
    reflectedPoint.z *= -1;\n\
\n\
    created = this.plotIn3D(reflectedPoint,false,2);\n\
/*\n\
    if( created ) {\n\
      this.plotOnTexture(point);\n\
    }*/\n\
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
  var divider = 16;\n\
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
\n\
  this.renderer = new THREE.WebGLRenderer({alpha:true});\n\
  this.renderer.autoClearColor = false;\n\
  this.renderer.setClearColor(0xffffff,1);\n\
  this.renderer.setSize( window.innerWidth, window.innerHeight );\n\
  this.renderer.sortObjects = false;\n\
  this.renderer.autoClear = false;\n\
  //this.renderer.sortElements = true;\n\
\n\
  this.composer = new WAGNER.Composer( this.renderer );\n\
  this.blurPass = new WAGNER.FullBoxBlurPass();\n\
  this.bloomPass = new WAGNER.MultiPassBloomPass();\n\
\n\
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
    vertexShader: require('./streetview_vs.glsl'),\n\
    fragmentShader: require('./streetview_fs.glsl'),\n\
    side: THREE.DoubleSide,\n\
    transparent:true,\n\
    lights: false\n\
  }\n\
\n\
  var maskMaterial = new THREE.ShaderMaterial(params);\n\
  //maskMaterial.uniforms.map = new THREE.Texture();\n\
\n\
  this.mesh = new THREE.Mesh(\n\
    new THREE.SphereGeometry( 500, 40, 40 ),\n\
    maskMaterial\n\
  );\n\
\n\
  //this.mesh.scale.z = -1;\n\
\n\
\n\
  this.scene.add( this.mesh );\n\
\n\
  this.light = new THREE.DirectionalLight(0xffffff,0.8);\n\
\n\
  this.scene.add(this.light);\n\
\n\
  this.scene.add( new THREE.AmbientLight(0x999999,0.2));\n\
\n\
  this.foliageContainer = new THREE.Object3D();\n\
  this.scene.add(this.foliageContainer);\n\
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
  tree.position.set(40,0,5);\n\
  tree.lookAt(this.camera.position.clone());\n\
  this.scene.add(tree);\n\
\n\
  this.tree1 = tree;\n\
\n\
  //tree2\n\
  var treeTex = THREE.ImageUtils.loadTexture( 'assets/images/tree2.png' );\n\
  var tree = new THREE.Mesh( new THREE.PlaneGeometry(13,20,1,1), new THREE.MeshBasicMaterial({map:treeTex,side: THREE.DoubleSide,transparent:true}));\n\
  tree.position.set(-40,0,0);\n\
  tree.lookAt(this.camera.position.clone());\n\
  this.scene.add(tree);\n\
\n\
  this.tree2 = tree;\n\
\n\
  //this.controller.handleResize();\n\
\n\
  this.container.appendChild( this.renderer.domElement );\n\
\n\
}\n\
\n\
p.setLinks = function( links, centerHeading ){\n\
  this.nav.setLinks(links, centerHeading);\n\
}\n\
\n\
p.initEvents = function(){\n\
  //$(this.renderer.domElement).on('click', this.onSceneClick);\n\
\n\
  this.onContainerMouseDown = this.onContainerMouseDown.bind(this);\n\
  this.onContainerMouseMove = this.onContainerMouseMove.bind(this);\n\
  this.onContainerMouseUp = this.onContainerMouseUp.bind(this);\n\
  this.onContainerMouseWheel = this.onContainerMouseWheel.bind(this);\n\
\n\
  this.onContainerTouchStart = this.onContainerTouchStart.bind(this);\n\
  this.onContainerTouchEnd = this.onContainerTouchEnd.bind(this);\n\
  this.onContainerTouchMove = this.onContainerTouchMove.bind(this);\n\
\n\
  this.container.addEventListener( 'mousedown', this.onContainerMouseDown, false );\n\
  this.container.addEventListener( 'mousemove', this.onContainerMouseMove, false );\n\
  this.container.addEventListener( 'mouseup', this.onContainerMouseUp, false );\n\
  this.container.addEventListener( 'mousewheel', this.onContainerMouseWheel, false );\n\
\n\
  this.container.addEventListener( 'touchstart', this.onContainerTouchStart, false );\n\
  this.container.addEventListener( 'touchend', this.onContainerTouchEnd, false );\n\
  //this.container.addEventListener( 'touchcancel', this.onContainerTouchEnd, false );\n\
  this.container.addEventListener( 'touchmove', this.onContainerTouchMove, false );\n\
}\n\
\n\
p.removeEvents = function(){\n\
  this.container.removeEventListener( 'mousedown', this.onContainerMouseDown );\n\
  this.container.removeEventListener( 'mousemove', this.onContainerMouseMove );\n\
  this.container.removeEventListener( 'mouseup', this.onContainerMouseUp );\n\
  this.container.removeEventListener( 'mousewheel', this.onContainerMouseWheel );\n\
\n\
  this.container.removeEventListener( 'touchstart', this.onContainerTouchStart );\n\
  this.container.removeEventListener( 'touchend', this.onContainerTouchEnd );\n\
  //this.container.removeEventListener( 'touchcancel', this.onContainerTouchEnd );\n\
  this.container.removeEventListener( 'touchmove', this.onContainerTouchMove );\n\
}\n\
\n\
p.onContainerMouseDown = function( event ) {\n\
\n\
  event.preventDefault();\n\
\n\
  this.isUserInteracting = true;\n\
  this.isUserInteractingTime = Date.now();\n\
\n\
  this.onPointerDownPointerX = event.clientX;\n\
  this.onPointerDownPointerY = event.clientY;\n\
\n\
  this.onPointerDownLon = this.lon;\n\
  this.onPointerDownLat = this.lat;\n\
\n\
  this.mouse2d.x = ( event.clientX / this.winSize.width ) * 2 - 1;\n\
  this.mouse2d.y = - ( event.clientY / this.winSize.height ) * 2 + 1;\n\
\n\
  $('body').removeClass('grab').addClass('grabbing');\n\
\n\
}\n\
\n\
p.onContainerMouseMove = function( event ) {\n\
\n\
  event.preventDefault();\n\
\n\
  if ( this.isUserInteracting ) {\n\
\n\
    this.lon = ( this.onPointerDownPointerX - event.clientX ) * 0.1 + this.onPointerDownLon;\n\
    this.lat = ( event.clientY - this.onPointerDownPointerY ) * 0.1 + this.onPointerDownLat;\n\
\n\
  }\n\
\n\
  this.mouse2d.x = ( event.clientX / this.winSize.width ) * 2 - 1;\n\
  this.mouse2d.y = - ( event.clientY / this.winSize.height ) * 2 + 1;\n\
/*\n\
  delta = Date.now()-lastTime;\n\
  lastTime = Date.now();\n\
  $('#debug').text( delta );\n\
*/\n\
}\n\
\n\
p.onContainerMouseUp = function( event ) {\n\
  this.isUserInteracting = false;\n\
\n\
  if( Date.now()- this.isUserInteractingTime  < 300 ) {\n\
    this.onSceneClick(this.mouse2d.x,this.mouse2d.y);\n\
  }\n\
\n\
  $('body').removeClass('grabbing').addClass('grab');\n\
\n\
}\n\
\n\
p.onContainerMouseWheel = function( event ) {\n\
  this.camera.fov -= event.wheelDeltaY * 0.05;\n\
\n\
  this.camera.fov = Math.min(80,Math.max(40,this.camera.fov));\n\
  this.camera.updateProjectionMatrix();\n\
}\n\
\n\
p.onContainerTouchStart = function( event ) {\n\
\n\
  if ( event.touches.length == 1 ) {\n\
\n\
    event.preventDefault();\n\
\n\
    this.isUserInteractingTime = Date.now();\n\
    this.isUserInteracting = true;\n\
\n\
    this.onPointerDownPointerX = event.touches[ 0 ].pageX;\n\
    this.onPointerDownPointerY = event.touches[ 0 ].pageY;\n\
\n\
    this.mouse2d.x = ( event.touches[0].pageX / this.winSize.width ) * 2 - 1;\n\
    this.mouse2d.y = - ( event.touches[0].pageY / this.winSize.height ) * 2 + 1;\n\
\n\
    this.onPointerDownLon = this.lon;\n\
    this.onPointerDownLat = this.lat;\n\
\n\
  }\n\
\n\
}\n\
\n\
p.onContainerTouchEnd = function( event ){\n\
\n\
  //event.preventDefault();\n\
\n\
  this.isUserInteracting = false;\n\
  if( Date.now()- this.isUserInteractingTime  < 300 ) {\n\
    this.onSceneClick(this.mouse2d.x,this.mouse2d.y);\n\
  }\n\
}\n\
\n\
p.onContainerTouchMove = function( event ) {\n\
\n\
  if ( event.touches.length == 1 ) {\n\
\n\
    event.preventDefault();\n\
\n\
    this.lon = ( this.onPointerDownPointerX - event.touches[0].pageX ) * 0.1 + this.onPointerDownLon;\n\
    this.lat = ( event.touches[0].pageY - this.onPointerDownPointerY ) * 0.1 + this.onPointerDownLat;\n\
\n\
    this.mouse2d.x = ( event.touches[0].pageX / this.winSize.width ) * 2 - 1;\n\
    this.mouse2d.y = - ( event.touches[0].pageY / this.winSize.height ) * 2 + 1;\n\
\n\
\n\
  }\n\
\n\
}\n\
\n\
p.onSceneClick = function(x,y){\n\
\n\
  var vector = new THREE.Vector3(x, y, 0.5);\n\
  var projector = new THREE.Projector();\n\
  projector.unprojectVector(vector, this.camera);\n\
\n\
  var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());\n\
\n\
//test nav\n\
  var intersects = raycaster.intersectObjects(this.nav.markers);\n\
  if (intersects.length > 0) {\n\
    this.emit('panoLinkClicked', intersects[0].object.pano,intersects[0].object.description );\n\
    return;\n\
  }\n\
\n\
  intersects = raycaster.intersectObjects([this.mesh]);\n\
  if (intersects.length > 0) {\n\
    var normalizedPoint = intersects[0].point.clone().normalize();\n\
    var u = Math.atan2(normalizedPoint.x, normalizedPoint.z) / (2 * Math.PI) + 0.5;\n\
    var v = Math.asin(normalizedPoint.y) / Math.PI + 0.5;\n\
\n\
    this.plotIn3D(intersects[0].point);\n\
    this.plotOnTexture(intersects[0].point);\n\
    //console.log('intersect: ' + intersects[0].point.x.toFixed(2) + ', ' + intersects[0].point.y.toFixed(2) + ', ' + intersects[0].point.z.toFixed(2) + ')');\n\
  }\n\
\n\
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
p.plotIn3D = function( point, forceType, extraScale ){\n\
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
  if( pointData.distance > 140 || pointData.distance < 7) {\n\
    return;\n\
  }\n\
\n\
  if( forceType === 'climb' ) {\n\
\n\
    plant = this.createClimbingPlant();\n\
\n\
  }\n\
  else if( normalInWorld.y < -0.7 || forceType === 'ground') {\n\
    plant = this.createGrass({disableCracks:forceType === 'ground'});\n\
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
  if( extraScale ) {\n\
    plant.scale.multiplyScalar(extraScale);\n\
  }\n\
\n\
  //set position\n\
\n\
  plant.position.copy(pointInWorld);\n\
\n\
  if(forceType === 'ground') {\n\
    plant.position.y -= 0.4;\n\
  }\n\
\n\
  this.foliageContainer.add(plant);\n\
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
  if( opts.disableCracks === true ) {\n\
    plant = new THREE.Object3D();\n\
  }\n\
  else {\n\
    plant = new THREE.Mesh(this.grassBaseGeo, this.grassBaseMaterial);\n\
  }\n\
\n\
  plant.rotation.x = Math.PI*0.5;\n\
  //grass billboard sprites\n\
  for (var i = 0; i < 3; i++) {\n\
    var billboard = new THREE.Mesh(this.grassBillboardGeo, this.grassMaterial );\n\
\n\
    if( i === 0 ) {\n\
      billboard.lookAt(this.camera.position)\n\
    }\n\
\n\
    billboard.rotation.x = Math.PI*-0.5;\n\
    billboard.rotation.y = Math.PI*Math.random();\n\
\n\
    billboard.position.z =  -1.9;\n\
    //billboard.position.x = Math.random()*2-1;\n\
    //billboard.position.y = Math.random()*2-1;\n\
\n\
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
\n\
var lastTime = 0;\n\
var delta;\n\
\n\
\n\
p.render = function(){\n\
\n\
\n\
  if( this.isRunning) {\n\
\n\
    /*if(this.rafId) {\n\
      raf.cancel( this.rafId);\n\
    }\n\
*/\n\
    this.rafId = raf(this.render);\n\
  }\n\
\n\
  this.renderer.autoClearColor = false;\n\
\n\
  this.testMouseOverObjects();\n\
\n\
  this.renderer.clear();\n\
  this.composer.reset();\n\
\n\
  this.mesh.visible = false;\n\
  this.foliageContainer.traverse( this.setVisibleHidden );\n\
  this.ground.visible = true;\n\
  this.composer.render( this.scene, this.camera );\n\
\n\
  this.composer.reset();\n\
  this.renderer.clear(false, true, false );\n\
  this.mesh.visible = true;\n\
  this.foliageContainer.traverse( this.setVisibleShown );\n\
  this.ground.visible = false;\n\
\n\
  this.composer.render( this.scene, this.camera );\n\
\n\
  this.composer.pass( this.dirtPass );\n\
\n\
  if( this.fadeAmount ) {\n\
    this.composer.pass( this.blurPass, null, this.fadeAmount*50 );\n\
  }\n\
\n\
  this.composer.pass( this.bloomPass );\n\
\n\
  this.composer.toScreen();\n\
  //this.renderer.render(this.scene, this.camera);\n\
\n\
  //this.lon += 1;\n\
\n\
  this.lat = Math.max( - 85, Math.min( 85, this.lat ) );\n\
  this.phi = ( 90 - this.lat ) * Math.PI / 180;\n\
  this.theta = this.lon * Math.PI / 180;\n\
\n\
  this.updatedTarget.set(\n\
    500 * Math.sin( this.phi ) * Math.cos( this.theta ),\n\
    500 * Math.cos( this.phi ),\n\
    500 * Math.sin( this.phi ) * Math.sin( this.theta )\n\
\n\
  )\n\
\n\
  this.target.lerp(this.updatedTarget,1);\n\
\n\
\n\
  this.target.x += Math.cos(this.time*2)*10;\n\
  this.target.y += Math.cos(this.time*2)*10;\n\
\n\
  this.camera.lookAt( this.target );\n\
\n\
  this.time += 0.01;\n\
\n\
\n\
  //console.log(delta);\n\
\n\
}\n\
\n\
p.testMouseOverObjects = function(){\n\
\n\
  var vector = new THREE.Vector3( this.mouse2d.x, this.mouse2d.y, 1 );\n\
  this.projector.unprojectVector( vector, this.camera );\n\
  var ray = new THREE.Raycaster( this.camera.position, vector.sub( this.camera.position ).normalize() );\n\
  var obj;\n\
\n\
  // create an array containing all objects in the scene with which the ray intersects\n\
  var intersects = ray.intersectObjects( this.nav.markers );\n\
\n\
\n\
  // if there is one (or more) intersections\n\
  if ( intersects.length > 0 )\n\
  {\n\
    obj = intersects[0].object;\n\
    obj.arrow.position.y += (0.5 - obj.arrow.position.y)/2;\n\
    obj.arrow.children[0].visible = false;\n\
    this.renderer.domElement.style.cursor = 'pointer';\n\
  }\n\
  else\n\
  {\n\
    for (var i =  this.nav.markers.length - 1; i >= 0; i--) {\n\
      obj = this.nav.markers[i];\n\
      obj.arrow.position.y += (0 - obj.arrow.position.y)/2;\n\
      obj.arrow.children[0].visible = true;\n\
    };\n\
    this.renderer.domElement.style.cursor = '';\n\
  }\n\
\n\
}\n\
\n\
p.setVisibleHidden = function(child){\n\
  child.visible = false;\n\
}\n\
\n\
p.setVisibleShown = function(child){\n\
  child.visible = true;\n\
}\n\
\n\
p.onResize  = function( w, h) {\n\
\n\
  var s = 1;\n\
\n\
  this.winSize.width = w\n\
  this.winSize.height = h\n\
\n\
  this.camera.aspect = w / h;\n\
  this.camera.updateProjectionMatrix();\n\
\n\
  this.renderer.setSize( s * w, s * h );\n\
  this.composer.setSize( w, h );\n\
\n\
  //this.controller.handleResize();\n\
\n\
}\n\
//@ sourceURL=streetview/index.js"
));
require.register("streetview/utils/detector.js", Function("exports, require, module",
"'use strict';\n\
\n\
var $html = $('html');\n\
var ua = navigator.userAgent;\n\
\n\
function _modernizr(feature) {\n\
  return $html.hasClass(feature);\n\
}\n\
\n\
/*\n\
 * CONST\n\
 */\n\
\n\
var TYPE_MOBILE = 1;\n\
var TYPE_TOUCH = 2;\n\
var TYPE_DESKTOP = 3;\n\
\n\
var TABLET_BREAKPOINT = { width: 645, height: 645 };\n\
\n\
/**\n\
 * Detect if the device is a touch device or not.\n\
 *\n\
 * @return {Boolean}\n\
 * @public\n\
 */\n\
\n\
var isTouchDevice = !!('ontouchstart' in window) || !!('onmsgesturechange' in window);\n\
\n\
/**\n\
 * Detect if it's a mobile/tablet.\n\
 *\n\
 * @return {Boolean}\n\
 * @public\n\
 */\n\
\n\
var isMobile = (/android|webos|ip(hone|ad|od)|blackberry|iemobile|windows (ce|phone)|opera mini/i).test(ua.toLowerCase());\n\
var isTablet = isMobile && (window.innerWidth > TABLET_BREAKPOINT.width || window.innerHeight > TABLET_BREAKPOINT.height);\n\
\n\
\n\
/**\n\
 * Returns the type of the device (TYPE_MOBILE, TYPE_TOUCH, TYPE_DESKTOP).\n\
 *\n\
 * @return {Int} see const (TYPE_MOBILE, TYPE_TOUCH, TYPE_DESKTOP).\n\
 * @public\n\
 */\n\
\n\
\n\
var getType = (function() {\n\
  if (isMobile) {\n\
    return TYPE_MOBILE;\n\
  }\n\
\n\
  if (isTouchDevice) {\n\
    return TYPE_TOUCH;\n\
  }\n\
\n\
  return TYPE_DESKTOP;\n\
}());\n\
\n\
/**\n\
 * Use modernizr to detect if the \"browser\" support WebGL.\n\
 * @return {Boolean}\n\
 * @public\n\
 */\n\
\n\
var webgl = (function() {\n\
  try {\n\
    return !!window.WebGLRenderingContext && (!!document.createElement('canvas').getContext('experimental-webgl') || !!document.createElement('canvas').getContext('webgl'));\n\
  } catch(e) {\n\
      return false;\n\
  }\n\
}());\n\
\n\
\n\
/**\n\
 * Detect if we support this browser or not.\n\
 * @return {Boolean}\n\
 * @public\n\
 */\n\
\n\
var isBrowserSupported = _modernizr('canvas') && _modernizr('csstransforms') && _modernizr('csstransforms3d') && _modernizr('svg');\n\
\n\
var isRetina = window.devicePixelRatio >= 2;\n\
\n\
var isNexusPhone = (/nexus\\s4|galaxy\\snexus/i).test(ua);\n\
var isNexusTablet = (/nexus\\s7|nexus\\s10/i).test(ua);\n\
\n\
var isMozilla = !!~ua.indexOf('Gecko') && !~ua.indexOf('KHTML');\n\
var isIE = (/MSIE (\\d+\\.\\d+);/).test(ua);\n\
var isiOS = (/ip(hone|ad|od)/i).test(ua);\n\
\n\
// Quick fix for ipad.\n\
// Use the same layout/perf optimisation as the mobile version\n\
if (isiOS) {\n\
  isMobile = true;\n\
  isTablet = false;\n\
}\n\
\n\
\n\
var hasPointerEvents = (function() {\n\
  if(navigator.appName == 'Microsoft Internet Explorer')\n\
  {\n\
      var agent = navigator.userAgent;\n\
      if (agent.match(/MSIE ([0-9]{1,}[\\.0-9]{0,})/) != null){\n\
          var version = parseFloat( RegExp.$1 );\n\
          if(version < 11)\n\
            return false;\n\
      }\n\
  }\n\
  return true;\n\
}());\n\
\n\
\n\
/**\n\
 * Expose data.\n\
 */\n\
\n\
module.exports = {\n\
  TYPE_MOBILE: TYPE_MOBILE,\n\
  TYPE_TOUCH: TYPE_TOUCH,\n\
  TYPE_DESKTOP: TYPE_DESKTOP,\n\
\n\
  isBrowserSupported: isBrowserSupported,\n\
  isTouchDevice: isTouchDevice,\n\
  isMobile: isMobile,\n\
  isTablet: isTablet,\n\
  isDesktop: !isMobile && !isTablet,\n\
  isRetina: isRetina,\n\
  getType: getType,\n\
  webgl: webgl,\n\
  hasPointerEvents: hasPointerEvents,\n\
\n\
  isNexusPhone: isNexusPhone,\n\
  isNexusTablet: isNexusTablet,\n\
  isMozilla: isMozilla,\n\
  isIE: isIE,\n\
  isiOS: isiOS,\n\
};\n\
//@ sourceURL=streetview/utils/detector.js"
));
require.register("streetview/streetview_vs.glsl", Function("exports, require, module",
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
';//@ sourceURL=streetview/streetview_vs.glsl"
));
require.register("streetview/streetview_fs.glsl", Function("exports, require, module",
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
  vec3 finalDiffuse = diffuseTex0*vec3(0.8,0.9,0.8);\\n\
\\n\
\\n\
  //depth\\n\
  vec3 diffuseTex2 = texture2D( texture2, vUv ).xyz;\\n\
\\n\
  float thres = 1.0-step(0.1,diffuseTex1.b);\\n\
  //vec4(diffuseTex1,1.0);\\n\
  gl_FragColor = vec4( finalDiffuse,1.0-DiffuseTerm*(1.0-diffuseTex2.x));\\n\
\\n\
\\n\
  //float depth = gl_FragCoord.z / gl_FragCoord.w;\\n\
  //float fogFactor = smoothstep( fogNear, fogFar, depth );\\n\
  //gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );\\n\
\\n\
}\\n\
';//@ sourceURL=streetview/streetview_fs.glsl"
));
require.register("urbanjungle/static/app/index.js", Function("exports, require, module",
"'use strict';\n\
var detector = require('./streetview/utils/detector');\n\
var Pano = require('streetview');\n\
\n\
var self = {};\n\
var _panoLoader = new GSVPANO.PanoLoader({zoom: 3});\n\
var _depthLoader = new GSVPANO.PanoDepthLoader();\n\
\n\
var defaultLatlng = new google.maps.LatLng(40.759101,-73.984406);\n\
var currentPanoLocation = null;\n\
var draggingInstance;\n\
var mouse2d = new google.maps.Point();\n\
var pegmanTimeout;\n\
var depthCanvas;\n\
var normalCanvas;\n\
\n\
var TALK_DEFAULT = 'Choose your location, pan around, and then pick me up!';\n\
\n\
var $streetview = $('.streetview');\n\
var $pegman = $('#pegman');\n\
var $pegmanCircle = $('.js-pegman-circle');\n\
var $map = $('#map');\n\
var $intro = $('.js-intro');\n\
var $message = $('.js-message');\n\
var $introContent = $('.js-intro-content');\n\
var $loadingLabel = $('.js-loading-label');\n\
var $dragHideLayers = $('.js-drag-hide');\n\
var $streetviewTile = $('.js-streetview-layer-tile');\n\
\n\
var streetviewCanvas = document.createElement('canvas');\n\
var streetViewTileData;\n\
streetviewCanvas.className = 'streetview-layer-tile-canvas';\n\
streetviewCanvas.width = 256;\n\
streetviewCanvas.height = 256;\n\
//document.body.appendChild(streetviewCanvas);\n\
\n\
var streetviewTileImg = document.createElement('img');\n\
streetviewTileImg.addEventListener('load',drawStreetViewTileToCanvas.bind(this));\n\
\n\
if( !detector.webgl ) {\n\
  location.href='nosupport.html';\n\
  return;\n\
}\n\
\n\
var pano = new Pano();\n\
\n\
pegmanTalk(TALK_DEFAULT);\n\
\n\
$('#backToMap').on('click', function(){\n\
\n\
  pegmanTalk(TALK_DEFAULT);\n\
\n\
  backToMap();\n\
\n\
})\n\
\n\
$('#choice-default-1').on('click', function( event ){\n\
  event.preventDefault();\n\
  var to = new google.maps.LatLng(40.759101,-73.984406)\n\
  map.panTo( to );\n\
})\n\
\n\
$('#choice-default-2').on('click', function(){\n\
  event.preventDefault();\n\
  var to = new google.maps.LatLng(37.7914908,-122.3977816)\n\
  map.panTo( to );\n\
})\n\
\n\
\n\
$('#choice-default-3').on('click', function(){\n\
  event.preventDefault();\n\
  var to = new google.maps.LatLng(59.3346806,18.0621834)\n\
  map.panTo( to );\n\
})\n\
\n\
\n\
$('#choice-location').on('click', function(){\n\
  event.preventDefault();\n\
  navigator.geolocation.getCurrentPosition( geoSuccess, geoError );\n\
})\n\
\n\
$('.js-more-info').on('click', function(){\n\
  $('#info').show();\n\
})\n\
\n\
$('.js-close-info').on('click', function(){\n\
  $('#info').hide();\n\
})\n\
\n\
$('.js-intro').removeClass('inactive');\n\
\n\
pano.on('panoLinkClicked', function(id,description){\n\
\n\
  $loadingLabel.find('h1').html(description)\n\
\n\
  $loadingLabel.removeClass('inactive');\n\
  TweenMax.to($loadingLabel,1,{opacity:1});\n\
\n\
  pano.fadeOut( function(){\n\
    _panoLoader.loadId(id);\n\
  });\n\
})\n\
\n\
function backToMap() {\n\
\n\
  if( pano.isRunning ) {\n\
    pano.once('transitionOutComplete', function(){\n\
      showMap();\n\
    });\n\
    pano.transitionOut();\n\
\n\
    TweenLite.set($pegman, {x:0,y:0});\n\
  }\n\
  else {\n\
    showMap();\n\
  }\n\
\n\
  function showMap() {\n\
    $streetview.addClass('inactive');\n\
    draggingInstance.enable();\n\
    $map.fadeIn();\n\
    $intro.fadeIn();\n\
    $dragHideLayers.fadeIn();\n\
    $pegman.removeClass('dragging');\n\
    $pegman.removeClass('over-road');\n\
  }\n\
\n\
}\n\
\n\
draggingInstance = Draggable.create($pegman, {\n\
  type:\"x,y\",\n\
  edgeResistance:0.5,\n\
  throwProps:true,\n\
  bounds:window,\n\
  onDragStart:onStartDragPegman,\n\
  onDragEnd:onEndDragPegman,\n\
  onDrag:onDragPegman\n\
})[0];\n\
\n\
\n\
function onDragPegman(event) {\n\
\n\
  var offset = $pegman.offset(),\n\
  bounds = map.getBounds(),\n\
  neLatlng = bounds.getNorthEast(),\n\
  swLatlng = bounds.getSouthWest(),\n\
  startLat = neLatlng.lat(),\n\
  endLng = neLatlng.lng(),\n\
  endLat = swLatlng.lat(),\n\
  startLng = swLatlng.lng(),\n\
  x = offset.left + 50,\n\
  y = offset.top + 50\n\
\n\
  var lat = startLat + ((y/window.innerHeight) * (endLat - startLat))\n\
  var lng = startLng + ((x/window.innerWidth) * (endLng - startLng));\n\
\n\
  var TILE_SIZE = 256;\n\
  var proj = map.getProjection();\n\
  var numTiles = 1 << map.getZoom();\n\
  var worldCoordinate = proj.fromLatLngToPoint( new google.maps.LatLng(lat,lng));\n\
\n\
  var pixelCoordinate = new google.maps.Point(\n\
    worldCoordinate.x * numTiles,\n\
    worldCoordinate.y * numTiles);\n\
\n\
  var tileCoordinate = new google.maps.Point(\n\
    Math.floor(pixelCoordinate.x / TILE_SIZE),\n\
    Math.floor(pixelCoordinate.y / TILE_SIZE));\n\
\n\
  //console.log('TileX:' +tileCoordinate.x+' - TileY:'+tileCoordinate.y);\n\
\n\
  var localPixel = new google.maps.Point(pixelCoordinate.x%256,pixelCoordinate.y%256);\n\
\n\
  var tileUrl = 'https://mts1.googleapis.com/vt?hl=sv-SE&lyrs=svv|cb_client:apiv3&style=40,18&x='+tileCoordinate.x+'&y='+tileCoordinate.y+'&z=' + map.getZoom();\n\
\n\
  if( streetviewTileImg.src !== tileUrl ){\n\
    streetviewTileImg.crossOrigin = '';\n\
    streetviewTileImg.src = tileUrl;\n\
\n\
  }\n\
  else {\n\
    if(streetViewTileData && streetViewTileData.length > 0) {\n\
      //get pixel\n\
      var index = (Math.floor(localPixel.y) * 256 + Math.floor(localPixel.x)) * 4;\n\
      var trans = streetViewTileData[index];\n\
      var blue = streetViewTileData[index-1]\n\
      var validColor = false;\n\
\n\
      if( trans > 0 && blue === 132 ) {\n\
        validColor = true;\n\
      }\n\
      if( validColor && !$pegman.hasClass('over-road')) {\n\
        $pegman.addClass('over-road');\n\
      }\n\
      else if( !validColor && $pegman.hasClass('over-road')){\n\
        $pegman.removeClass('over-road');\n\
      }\n\
    }\n\
  }\n\
}\n\
\n\
function pegmanTalk( msg, timeout ){\n\
  $message.html(msg);\n\
\n\
  TweenMax.fromTo($message,0.3,{x:0},{x:10,yoyo:true});\n\
\n\
  if( timeout ) {\n\
    if( pegmanTimeout ) {\n\
      clearTimeout(pegmanTimeout);\n\
    }\n\
    pegmanTimeout = setTimeout(function(){\n\
      pegmanTalk(TALK_DEFAULT)\n\
    },timeout*1000)\n\
  }\n\
}\n\
\n\
function onStartDragPegman(){\n\
\n\
  streetViewLayer.setMap(map);\n\
\n\
  $dragHideLayers.fadeOut()\n\
  $pegman.addClass('dragging');\n\
\n\
  pegmanTalk('Now drop me somewhere');\n\
}\n\
\n\
function onEndDragPegman( event ){\n\
\n\
  streetViewLayer.setMap();\n\
\n\
  var offset = $pegman.offset(),\n\
\n\
  bounds = map.getBounds(),\n\
  neLatlng = bounds.getNorthEast(),\n\
  swLatlng = bounds.getSouthWest(),\n\
  startLat = neLatlng.lat(),\n\
  endLng = neLatlng.lng(),\n\
  endLat = swLatlng.lat(),\n\
  startLng = swLatlng.lng(),\n\
  x = offset.left + 45,\n\
  y = offset.top + 60\n\
\n\
  var lat = startLat + ((y/window.innerHeight) * (endLat - startLat))\n\
  var lng = startLng + ((x/window.innerWidth) * (endLng - startLng));\n\
\n\
  pegmanTalk('I hope there will be no snakes');\n\
\n\
  _panoLoader.load(new google.maps.LatLng(lat,lng));\n\
\n\
  draggingInstance.disable();\n\
\n\
}\n\
\n\
function drawStreetViewTileToCanvas(){\n\
  streetviewCanvas.width = streetviewCanvas.width;\n\
  var ctx = streetviewCanvas.getContext('2d');\n\
\n\
  ctx.drawImage(streetviewTileImg,0,0,256,256);\n\
  streetViewTileData = ctx.getImageData(0, 0, 256, 256).data;\n\
}\n\
\n\
\n\
\n\
/*\n\
\n\
var el = document.getElementById( 'myLocationButton' );\n\
el.addEventListener( 'click', function( event ) {\n\
  event.preventDefault();\n\
  navigator.geolocation.getCurrentPosition( geoSuccess, geoError );\n\
}, false );\n\
\n\
  navigator.pointer = navigator.pointer || navigator.webkitPointer;\n\
\n\
  function lockPointer () {\n\
    if( navigator.pointer ) {\n\
      navigator.pointer.lock( container, function() {\n\
        console.log( 'Pointer locked' );\n\
      }, function() {\n\
        console.log( 'No pointer lock' );\n\
      } );\n\
    }\n\
  }\n\
\n\
  var el = document.getElementById( 'fullscreenButton' );\n\
  if( el ) {\n\
    el.addEventListener( 'click', function( e ) {\n\
      container.onwebkitfullscreenchange = function(e) {\n\
        lockPointer();\n\
        container.onwebkitfullscreenchange = function() {\n\
        };\n\
      };\n\
      container.onmozfullscreenchange = function(e) {\n\
        lockPointer();\n\
        container.onmozfullscreenchange = function() {\n\
        };\n\
      };\n\
      if( container.webkitRequestFullScreen ) container.webkitRequestFullScreen();\n\
      if( container.mozRequestFullScreen ) container.mozRequestFullScreen();\n\
      e.preventDefault();\n\
    }, false );\n\
  }\n\
\n\
  */\n\
\n\
\n\
function geoSuccess( position ) {\n\
  pegmanTalk('I can see you!',2)\n\
  var currentLocation = new google.maps.LatLng( position.coords.latitude, position.coords.longitude );\n\
  map.panTo( currentLocation );\n\
\n\
}\n\
\n\
function geoError( message ) {\n\
  pegmanTalk( \"I can't see where you are\" , 4 );\n\
}\n\
\n\
var marker;\n\
\n\
var styleArray = [\n\
  {\"stylers\": [\n\
    { \"visibility\": \"off\" },\n\
  ]},\n\
  {\n\
    \"featureType\": \"landscape.man_made\",\n\
    \"stylers\": [\n\
      { \"visibility\": \"on\" },\n\
      { \"hue\": \"#00ff11\" },\n\
      { \"saturation\": 53 },\n\
      { \"gamma\": 0.26 },\n\
      { \"lightness\": -75 }\n\
    ]\n\
  },\n\
  {\n\
    featureType: \"road\",\n\
    elementType: \"geometry\",\n\
    stylers: [\n\
      { \"visibility\": \"simplified\" },\n\
      { color: \"#065337\" }\n\
    ]\n\
  },\n\
  {\n\
    featureType: \"landscape.natural\",\n\
    elementType: \"geometry\",\n\
    stylers: [\n\
      { color: \"#126f4d\" }\n\
    ]\n\
  },\n\
  {\n\
    \"featureType\": \"landscape.man_made\",\n\
    \"stylers\": [\n\
      { \"visibility\": \"simplified\" }\n\
    ]\n\
  },\n\
  {\n\
    \"featureType\": \"road\",\n\
    \"elementType\": \"labels.text.fill\",\n\
    \"stylers\": [\n\
      { \"visibility\": \"on\" },\n\
      { \"color\": \"#033a26\" }\n\
    ]\n\
  },\n\
  {\n\
    \"featureType\": \"water\",\n\
    \"elementType\": \"geometry.fill\",\n\
    \"stylers\": [\n\
      { \"visibility\": \"on\" },\n\
      { \"color\": \"#2f4d5f\" }\n\
    ]\n\
  },\n\
  {\n\
    \"featureType\": \"landscape.natural\",\n\
    \"elementType\": \"geometry.fill\",\n\
    \"stylers\": [\n\
      { \"visibility\": \"on\" },\n\
      { \"color\": \"#006943\" }\n\
    ]\n\
  }\n\
];\n\
\n\
var myOptions = {\n\
  zoom: 17,\n\
  center: defaultLatlng,\n\
  mapTypeId: google.maps.MapTypeId.ROADMAP,\n\
  tilt:45,\n\
  disableDefaultUI:true,\n\
  streetViewControl: false,\n\
  styles: styleArray\n\
}\n\
var map = new google.maps.Map( document.getElementById( 'map' ), myOptions );\n\
\n\
var streetViewLayer = new google.maps.StreetViewCoverageLayer();\n\
\n\
var geocoder = new google.maps.Geocoder();\n\
\n\
var el = document.getElementById( 'searchButton' );\n\
el.addEventListener( 'click', function( event ) {\n\
  event.preventDefault();\n\
  findAddress( document.getElementById(\"address\").value );\n\
}, false );\n\
\n\
\n\
//document.getElementById(\"address\").focus();\n\
\n\
function findAddress( address ) {\n\
\n\
  geocoder.geocode( { 'address': address}, function(results, status) {\n\
    if (status == google.maps.GeocoderStatus.OK) {\n\
      map.setCenter(results[0].geometry.location);\n\
      pegmanTalk(\"Found the place, let's go!\",3);\n\
    } else {\n\
      pegmanTalk(\"Could not find the location\",5);\n\
      //showProgress( false );\n\
    }\n\
  });\n\
}\n\
\n\
\n\
\n\
\n\
_panoLoader.onPanoramaLoad = function() {\n\
\n\
  pano.setPano(this.canvas);\n\
\n\
  _depthLoader.load(this.panoId);\n\
  self.centerHeading = this.centerHeading;\n\
  self.links = this.links;\n\
\n\
  if( currentPanoLocation ) {\n\
    var dist = google.maps.geometry.spherical.computeDistanceBetween(currentPanoLocation, this.panoLocation.latLng);\n\
\n\
  }\n\
\n\
  currentPanoLocation = this.panoLocation.latLng;\n\
\n\
};\n\
\n\
_panoLoader.onNoPanoramaData = function(){\n\
  pegmanTalk(\"Snakes! Can't go there. Try another spot\",4);\n\
  backToMap();\n\
}\n\
\n\
_depthLoader.onDepthError = function() {\n\
  pegmanTalk(\"Snakes! Can't go there. Try another spot\",4);\n\
\n\
  backToMap();\n\
}\n\
\n\
_depthLoader.onDepthLoad = function( buffers ) {\n\
  var x, y, context, image, w, h, c,pointer;\n\
\n\
  if( !depthCanvas ) {\n\
    depthCanvas = document.createElement(\"canvas\");\n\
  }\n\
\n\
  context = depthCanvas.getContext('2d');\n\
\n\
  w = buffers.width;\n\
  h = buffers.height;\n\
\n\
  depthCanvas.setAttribute('width', w);\n\
  depthCanvas.setAttribute('height', h);\n\
\n\
  image = context.getImageData(0, 0, w, h);\n\
\n\
  for(y=0; y<h; ++y) {\n\
    for(x=0; x<w; ++x) {\n\
      c = buffers.depthMap[y*w + x] / 50 * 255;\n\
      image.data[4*(y*w + x)    ] = c;\n\
      image.data[4*(y*w + x) + 1] = c;\n\
      image.data[4*(y*w + x) + 2] = c;\n\
      image.data[4*(y*w + x) + 3] = 255;\n\
    }\n\
  }\n\
\n\
  context.putImageData(image, 0, 0);\n\
\n\
  //document.body.appendChild(panoCanvas);\n\
  pano.setDepthData(buffers.depthMap);\n\
  pano.setDepthMap(depthCanvas);\n\
\n\
  if( !normalCanvas ) {\n\
    normalCanvas = document.createElement(\"canvas\");\n\
    //document.body.appendChild(normalCanvas);\n\
  }\n\
\n\
  context = normalCanvas.getContext('2d');\n\
\n\
  w = buffers.width;\n\
  h = buffers.height;\n\
\n\
  normalCanvas.setAttribute('width', w);\n\
  normalCanvas.setAttribute('height', h);\n\
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
      image.data[ pixelIndex ] = (buffers.normalMap[pointer]+1)/2 * 255;\n\
      image.data[pixelIndex + 1] = (buffers.normalMap[pointer+1]+1)/2 * 255;\n\
      image.data[pixelIndex + 2] = (buffers.normalMap[pointer+2]+1)/2 * 255;\n\
      image.data[pixelIndex + 3] = 255;\n\
    }\n\
  }\n\
\n\
  context.putImageData(image, 0, 0);\n\
\n\
  pano.setNormalData(buffers.normalMap);\n\
  pano.setNormalMap(normalCanvas);\n\
\n\
  pano.generateNature();\n\
  pano.start();\n\
  $streetview.removeClass('inactive');\n\
\n\
  if( !pano.isIntro ) {\n\
    TweenMax.to($loadingLabel,1,{opacity:0});\n\
  }\n\
\n\
  $loadingLabel.removeClass('inactive');\n\
  TweenMax.to($loadingLabel,1,{opacity:1});\n\
\n\
  $map.fadeOut();\n\
  $intro.fadeOut();\n\
  TweenMax.to($loadingLabel,1,{opacity:0});\n\
\n\
  pano.setLinks(self.links, self.centerHeading );\n\
\n\
}\n\
\n\
window.addEventListener('resize',onResize);\n\
onResize();\n\
\n\
 function onResize() {\n\
  var w = window.innerWidth,\n\
    h = window.innerHeight;\n\
\n\
    //TweenMax.set($introContent,{y: h*.5 - $introContent.height()*.5 });\n\
\n\
    pano.onResize(w,h);\n\
\n\
 }\n\
\n\
\n\
//@ sourceURL=urbanjungle/static/app/index.js"
));
require.register("urbanjungle/static/app/streetview/utils/detector.js", Function("exports, require, module",
"'use strict';\n\
\n\
var $html = $('html');\n\
var ua = navigator.userAgent;\n\
\n\
function _modernizr(feature) {\n\
  return $html.hasClass(feature);\n\
}\n\
\n\
/*\n\
 * CONST\n\
 */\n\
\n\
var TYPE_MOBILE = 1;\n\
var TYPE_TOUCH = 2;\n\
var TYPE_DESKTOP = 3;\n\
\n\
var TABLET_BREAKPOINT = { width: 645, height: 645 };\n\
\n\
/**\n\
 * Detect if the device is a touch device or not.\n\
 *\n\
 * @return {Boolean}\n\
 * @public\n\
 */\n\
\n\
var isTouchDevice = !!('ontouchstart' in window) || !!('onmsgesturechange' in window);\n\
\n\
/**\n\
 * Detect if it's a mobile/tablet.\n\
 *\n\
 * @return {Boolean}\n\
 * @public\n\
 */\n\
\n\
var isMobile = (/android|webos|ip(hone|ad|od)|blackberry|iemobile|windows (ce|phone)|opera mini/i).test(ua.toLowerCase());\n\
var isTablet = isMobile && (window.innerWidth > TABLET_BREAKPOINT.width || window.innerHeight > TABLET_BREAKPOINT.height);\n\
\n\
\n\
/**\n\
 * Returns the type of the device (TYPE_MOBILE, TYPE_TOUCH, TYPE_DESKTOP).\n\
 *\n\
 * @return {Int} see const (TYPE_MOBILE, TYPE_TOUCH, TYPE_DESKTOP).\n\
 * @public\n\
 */\n\
\n\
\n\
var getType = (function() {\n\
  if (isMobile) {\n\
    return TYPE_MOBILE;\n\
  }\n\
\n\
  if (isTouchDevice) {\n\
    return TYPE_TOUCH;\n\
  }\n\
\n\
  return TYPE_DESKTOP;\n\
}());\n\
\n\
/**\n\
 * Use modernizr to detect if the \"browser\" support WebGL.\n\
 * @return {Boolean}\n\
 * @public\n\
 */\n\
\n\
var webgl = (function() {\n\
  try {\n\
    return !!window.WebGLRenderingContext && (!!document.createElement('canvas').getContext('experimental-webgl') || !!document.createElement('canvas').getContext('webgl'));\n\
  } catch(e) {\n\
      return false;\n\
  }\n\
}());\n\
\n\
\n\
/**\n\
 * Detect if we support this browser or not.\n\
 * @return {Boolean}\n\
 * @public\n\
 */\n\
\n\
var isBrowserSupported = _modernizr('canvas') && _modernizr('csstransforms') && _modernizr('csstransforms3d') && _modernizr('svg');\n\
\n\
var isRetina = window.devicePixelRatio >= 2;\n\
\n\
var isNexusPhone = (/nexus\\s4|galaxy\\snexus/i).test(ua);\n\
var isNexusTablet = (/nexus\\s7|nexus\\s10/i).test(ua);\n\
\n\
var isMozilla = !!~ua.indexOf('Gecko') && !~ua.indexOf('KHTML');\n\
var isIE = (/MSIE (\\d+\\.\\d+);/).test(ua);\n\
var isiOS = (/ip(hone|ad|od)/i).test(ua);\n\
\n\
// Quick fix for ipad.\n\
// Use the same layout/perf optimisation as the mobile version\n\
if (isiOS) {\n\
  isMobile = true;\n\
  isTablet = false;\n\
}\n\
\n\
\n\
var hasPointerEvents = (function() {\n\
  if(navigator.appName == 'Microsoft Internet Explorer')\n\
  {\n\
      var agent = navigator.userAgent;\n\
      if (agent.match(/MSIE ([0-9]{1,}[\\.0-9]{0,})/) != null){\n\
          var version = parseFloat( RegExp.$1 );\n\
          if(version < 11)\n\
            return false;\n\
      }\n\
  }\n\
  return true;\n\
}());\n\
\n\
\n\
/**\n\
 * Expose data.\n\
 */\n\
\n\
module.exports = {\n\
  TYPE_MOBILE: TYPE_MOBILE,\n\
  TYPE_TOUCH: TYPE_TOUCH,\n\
  TYPE_DESKTOP: TYPE_DESKTOP,\n\
\n\
  isBrowserSupported: isBrowserSupported,\n\
  isTouchDevice: isTouchDevice,\n\
  isMobile: isMobile,\n\
  isTablet: isTablet,\n\
  isDesktop: !isMobile && !isTablet,\n\
  isRetina: isRetina,\n\
  getType: getType,\n\
  webgl: webgl,\n\
  hasPointerEvents: hasPointerEvents,\n\
\n\
  isNexusPhone: isNexusPhone,\n\
  isNexusTablet: isNexusTablet,\n\
  isMozilla: isMozilla,\n\
  isIE: isIE,\n\
  isiOS: isiOS,\n\
};\n\
//@ sourceURL=urbanjungle/static/app/streetview/utils/detector.js"
));


require.alias("streetview/nav.js", "urbanjungle/deps/streetview/nav.js");
require.alias("streetview/index.js", "urbanjungle/deps/streetview/index.js");
require.alias("streetview/utils/detector.js", "urbanjungle/deps/streetview/utils/detector.js");
require.alias("streetview/index.js", "urbanjungle/deps/streetview/index.js");
require.alias("streetview/index.js", "streetview/index.js");
require.alias("component-raf/index.js", "streetview/deps/raf/index.js");

require.alias("component-emitter/index.js", "streetview/deps/emitter/index.js");

require.alias("streetview/index.js", "streetview/index.js");
require.alias("urbanjungle/static/app/index.js", "urbanjungle/index.js");