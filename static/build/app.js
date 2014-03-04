
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
\n\
  for ( i = links.length - 1; i >= 0; i--) {\n\
\n\
    this.markers[i].rotation.y = ((links[i].heading-90-centerHeading)*-1)*Math.PI/180;\n\
    this.markers[i].pano = links[i].pano;\n\
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
\n\
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
  this.isIntro = true;\n\
  this.isRunning = false;\n\
  this.fadeAmount = 1;\n\
\n\
  this.mouse2d = new THREE.Vector2();\n\
\n\
  this.normalMapCanvas = null;\n\
  this.depthData = null;\n\
\n\
  this.render = this.render.bind(this);\n\
  this.onSceneClick = this.onSceneClick.bind(this);\n\
  this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);\n\
\n\
  this.canvas = document.createElement( 'canvas' );\n\
  this.context = this.canvas.getContext( '2d' );\n\
\n\
  this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 1, 1100 );\n\
\n\
  this.target = new THREE.Vector3( 0, 0, 0 );\n\
\n\
  this.controller = new THREE.FirstPersonControls(this.camera,document);\n\
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
  this.initEvents();\n\
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
  if( !this.isRunning ) {\n\
    this.isRunning = true;\n\
    this.render();\n\
\n\
    $('.js-start-btn').html('Start');\n\
  }\n\
\n\
  if( !this.isIntro ) {\n\
    this.fadeIn();\n\
  }\n\
\n\
}\n\
\n\
p.start = function() {\n\
  this.isIntro = false;\n\
  this.fadeIn();\n\
}\n\
\n\
p.fadeIn = function( callback ){\n\
\n\
  if( !callback ) {\n\
    callback = function(){};\n\
  }\n\
\n\
  TweenMax.to(this,2,{fadeAmount:0});\n\
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
  this.controller.handleResize();\n\
\n\
  $('#app')[0].appendChild( this.renderer.domElement );\n\
\n\
}\n\
\n\
p.setLinks = function( links, centerHeading ){\n\
  this.nav.setLinks(links, centerHeading);\n\
}\n\
\n\
p.initEvents = function(){\n\
  $(this.renderer.domElement).on('click', this.onSceneClick);\n\
\n\
  document.addEventListener( 'mousemove', this.onDocumentMouseMove, false );\n\
}\n\
\n\
p.onDocumentMouseMove = function(event){\n\
  this.mouse2d.x = ( event.clientX / window.innerWidth ) * 2 - 1;\n\
  this.mouse2d.y = - ( event.clientY / window.innerHeight ) * 2 + 1;\n\
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
//test nav\n\
  var intersects = raycaster.intersectObjects(this.nav.markers);\n\
  if (intersects.length > 0) {\n\
    this.emit('panoLinkClicked', intersects[0].object.pano );\n\
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
p.render = function(){\n\
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
\n\
\n\
  this.composer.toScreen();\n\
  //this.renderer.render(this.scene, this.camera);\n\
  this.controller.update(0.1);\n\
  this.time += 0.01;\n\
\n\
  raf(this.render);\n\
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
  this.camera.aspect = w / h;\n\
  this.camera.updateProjectionMatrix();\n\
\n\
  this.renderer.setSize( s * w, s * h );\n\
  this.composer.setSize( w, h );\n\
\n\
}\n\
//@ sourceURL=streetview/index.js"
));
require.register("streetview/water_vs.glsl", Function("exports, require, module",
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
';//@ sourceURL=streetview/water_vs.glsl"
));
require.register("streetview/water_fs.glsl", Function("exports, require, module",
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
';//@ sourceURL=streetview/water_fs.glsl"
));
require.register("urbanjungle/static/app/index.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Pano = require('streetview');\n\
\n\
var self = {};\n\
var _panoLoader = new GSVPANO.PanoLoader({zoom: 1});\n\
var _depthLoader = new GSVPANO.PanoDepthLoader();\n\
\n\
var currentPanoLocation = null;\n\
\n\
var depthCanvas;\n\
var normalCanvas;\n\
\n\
var $introContent = $('.js-intro-content');\n\
\n\
$('.js-intro').removeClass('inactive');\n\
\n\
var pano = new Pano();\n\
\n\
$('.js-start-btn').on('click touchstart', function(){\n\
  $('.js-intro').fadeOut();\n\
  pano.start();\n\
});\n\
\n\
pano.on('panoLinkClicked', function(id){\n\
  pano.fadeOut( function(){\n\
    _panoLoader.loadId(id);\n\
  });\n\
})\n\
\n\
//this.onResize = this.onResize.bind(this);\n\
window.addEventListener('resize',onResize);\n\
\n\
onResize();\n\
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
    console.log(dist);\n\
  }\n\
\n\
  currentPanoLocation = this.panoLocation.latLng;\n\
\n\
};\n\
\n\
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
\n\
  pano.setLinks(self.links, self.centerHeading );\n\
\n\
}\n\
\n\
\n\
 _panoLoader.setZoom(3);\n\
 _panoLoader.load(new google.maps.LatLng(40.759101,-73.984406));\n\
 //_panoLoader.load(new google.maps.LatLng(40.726786,-73.991728));\n\
\n\
 //_panoLoader.load(new google.maps.LatLng(57.642814,18.296309));\n\
\n\
 //_panoLoader.load(new google.maps.LatLng(40.736952,-73.99806));\n\
 //_panoLoader.load(new google.maps.LatLng(40.759984,-73.972059));\n\
 //_panoLoader.load(new google.maps.LatLng(40.760277,-73.983897));\n\
 //_panoLoader.load(new google.maps.LatLng(40.759846, -73.984197));\n\
 //_panoLoader.load(new google.maps.LatLng(59.334429,18.061984));\n\
 //_panoLoader.load(new google.maps.LatLng(40.6849,-73.894615));\n\
\n\
 function onResize() {\n\
  var w = window.innerWidth,\n\
    h = window.innerHeight;\n\
\n\
    TweenMax.set($introContent,{y: h*.5 - $introContent.height()*.5 });\n\
\n\
    pano.onResize(w,h);\n\
\n\
 }\n\
\n\
//@ sourceURL=urbanjungle/static/app/index.js"
));


require.alias("streetview/nav.js", "urbanjungle/deps/streetview/nav.js");
require.alias("streetview/index.js", "urbanjungle/deps/streetview/index.js");
require.alias("streetview/index.js", "urbanjungle/deps/streetview/index.js");
require.alias("streetview/index.js", "streetview/index.js");
require.alias("component-raf/index.js", "streetview/deps/raf/index.js");

require.alias("component-emitter/index.js", "streetview/deps/emitter/index.js");

require.alias("streetview/index.js", "streetview/index.js");
require.alias("urbanjungle/static/app/index.js", "urbanjungle/index.js");