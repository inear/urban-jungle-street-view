
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
require.register("component-raf/index.js", function(exports, require, module){
/**
 * Expose `requestAnimationFrame()`.
 */

exports = module.exports = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.oRequestAnimationFrame
  || window.msRequestAnimationFrame
  || fallback;

/**
 * Fallback implementation.
 */

var prev = new Date().getTime();
function fallback(fn) {
  var curr = new Date().getTime();
  var ms = Math.max(0, 16 - (curr - prev));
  var req = setTimeout(fn, ms);
  prev = curr;
  return req;
}

/**
 * Cancel.
 */

var cancel = window.cancelAnimationFrame
  || window.webkitCancelAnimationFrame
  || window.mozCancelAnimationFrame
  || window.oCancelAnimationFrame
  || window.msCancelAnimationFrame
  || window.clearTimeout;

exports.cancel = function(id){
  cancel.call(window, id);
};

});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("streetview/nav.js", function(exports, require, module){
module.exports = Nav;

function Nav(){

  this.container = new THREE.Object3D();

  this.markers = [];

  this.createArrows();
}

var p = Nav.prototype;

p.createArrows = function(){

  // create a basic shape
  var shape = new THREE.Shape();
  shape.moveTo(4, 0);
  shape.lineTo(7.8, 6.7);
  shape.lineTo(5.4, 8);
  shape.lineTo(4, 5.6);
  shape.lineTo(2.4, 8);
  shape.lineTo(0, 6.7);
  shape.lineTo(4, 0);

  var arrowGeo = new THREE.ExtrudeGeometry(shape,{amount:0.2, bevelEnabled:true,bevelThickness:0.3,bevelSize:0.1});

  arrowGeo.applyMatrix(new THREE.Matrix4().makeTranslation(-4,-4,0));
  arrowGeo.applyMatrix(new THREE.Matrix4().makeScale(0.3,0.3,0.3));
  arrowGeo.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI*0.5));
  arrowGeo.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI));
  arrowGeo.applyMatrix(new THREE.Matrix4().makeTranslation(0,-2,5));

  var tex = THREE.ImageUtils.loadTexture( 'assets/images/concrete.jpg' );
  tex.repeat.x = tex.repeat.y = 0.1;

  markerGeo = new THREE.SphereGeometry(2,6,6);
  markerGeo.applyMatrix(new THREE.Matrix4().makeTranslation(0,-2,5));

  var marker = new THREE.Mesh( markerGeo, new THREE.MeshBasicMaterial({color:0xff0000,visible:false}));
  var arrow = new THREE.Mesh( arrowGeo,new THREE.MeshLambertMaterial({map: tex, wireframe:false,color:0x666666,ambient:0x333333}));
  arrow.name = 'arrow';
  //shadows
  shadowTex = THREE.ImageUtils.loadTexture( 'assets/images/arrow-shadow.png' );
  var shadow = new THREE.Mesh( new THREE.PlaneGeometry(3,3,1,1), new THREE.MeshBasicMaterial({map:shadowTex,transparent:true}));
  shadow.rotation.x = -Math.PI*0.5;
  shadow.rotation.z = Math.PI;
  shadow.position.y = -2.3;
  shadow.position.z = 5;
  shadow.name = 'shadow';

  arrow.add(shadow);
  marker.add(arrow);

  marker.arrow = arrow;

  for (var i = 0; i < 4; i++) {
    var newMarker = marker.clone();
    newMarker.arrow = newMarker.getObjectByName('arrow');
    newMarker.shadow = newMarker.getObjectByName('shadow');
    //newArrow.rotation.y = Math.PI/4*i*2;
    this.markers.push(newMarker);
  };

}

p.setLinks = function( links, centerHeading ) {

  for (var i = 0; i < 4; i++) {
    if( this.markers[i].parent ) {
      this.container.remove(this.markers[i]);
      this.markers[i].active = false;
    }
  }
  console.log(links)
  for ( i = links.length - 1; i >= 0; i--) {

    this.markers[i].rotation.y = ((links[i].heading-90-centerHeading)*-1)*Math.PI/180;
    this.markers[i].pano = links[i].pano;
    this.markers[i].description = links[i].description;
    this.markers[i].active = true;
    this.container.add(this.markers[i]);

  };

}

});
require.register("streetview/index.js", function(exports, require, module){
var raf = require('raf');
var Emitter = require('emitter');
var Nav = require('./nav');
var detector = require('./utils/detector');

var DEG_TO_RAD = Math.PI/180;
var MAP_WIDTH = 512;
var MAP_HEIGHT = 256;

module.exports = PanoView;

function PanoView(){

  this.container = $('#app')[0];
  this.winSize = {
    width:0,
    height:0
  }
  this.time = 0;
  this.isIntro = true;
  this.isRunning = false;
  this.fadeAmount = 1;

  this.mouse2d = new THREE.Vector2();
  this.isUserInteracting = false;
  this.isUserInteractingTime = 0;
  this.onMouseDownMouseX = 0;
  this.onMouseDownMouseY = 0;
  this.lon = 90;
  this.onMouseDownLon = 0;
  this.lat = 0;
  this.onMouseDownLat = 0;
  this.phi = 0;
  this.theta = 0;
  this.updatedTarget = new THREE.Vector3();
  this.target = new THREE.Vector3();

  this.normalMapCanvas = null;
  this.depthData = null;

  this.render = this.render.bind(this);
  this.onSceneClick = this.onSceneClick.bind(this);

  this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 1, 1100 );

  this.target = new THREE.Vector3( 0, 0, 0 );

  //this.controller = new THREEx.DragPanControls(this.camera)//new THREE.FirstPersonControls(this.camera,this.container);

  // initialize object to perform world/screen calculations
  this.projector = new THREE.Projector();

  this.scene = new THREE.Scene();

  this.scene.add( this.camera );

  this.nav = new Nav();
  this.scene.add(this.nav.container);

  this.mesh = null;
  this.foliageContainer = null

  //this.grassBaseGeo = new THREE.SphereGeometry(2,4,4);
  this.grassBaseGeo = new THREE.PlaneGeometry(2,2,1,1);
  var cracksTex = THREE.ImageUtils.loadTexture('assets/images/cracks.png');

  this.grassBaseMaterial = new THREE.MeshLambertMaterial({ map: cracksTex,side: THREE.DoubleSide,alphaTest: 0.3, opacity:0.7,transparent:true});

  var grassMap = THREE.ImageUtils.loadTexture( 'assets/images/grass_billboard.png' );
  this.grassMaterial = new THREE.MeshLambertMaterial( { map: grassMap, alphaTest: 0.8, side: THREE.DoubleSide } );

  var wallMossMap = THREE.ImageUtils.loadTexture( 'assets/images/wall-moss.png' );
  this.wallMossMaterial = new THREE.MeshBasicMaterial( { map: wallMossMap, transparent:true, depthWrite:false,  side: THREE.DoubleSide } );

  var wallHangMap = THREE.ImageUtils.loadTexture( 'assets/images/leafs.png' );
  this.wallHangMaterial = new THREE.MeshLambertMaterial( { map: wallHangMap, alphaTest:0.9, side: THREE.DoubleSide } );

  var climbingLeafTex = THREE.ImageUtils.loadTexture( 'assets/images/climbing.png' );
  this.climbingPlantLeafMaterial = new THREE.MeshLambertMaterial({map:climbingLeafTex,alphaTest:0.9, side: THREE.DoubleSide});
  this.climbingPlantMaterial = new THREE.MeshLambertMaterial({color:0x3c8644,ambient:0x000000});


  this.hangBillboardGeo = new THREE.PlaneGeometry(5,3,1,1);
  this.climbingBillboardGeo = new THREE.PlaneGeometry(2.6,3.8,1,1);
  this.grassBillboardGeo = new THREE.PlaneGeometry(4,4,1,1);

  this.init3D();

}

var p = PanoView.prototype;

Emitter(p);

p.generateNature = function(){
  this.resetNature();
  this.createEdgeFoliage();
  this.createClimbingFoliages();
  this.createPlants();

  this.tree1.position.z = Math.random()*10-5;
  this.tree2.position.z = Math.random()*10-5;

  if( !this.isIntro ) {
    this.fadeIn();
  }

}

p.start = function() {
  console.log("3d start");

  this.isRunning = true;
  this.render();
  this.fadeIn( function(){
    this.initEvents();
    $('body').addClass('grab');
  }.bind(this));


}

p.transitionOut = function(){
  this.isIntro = true;
  this.isRunning = false;
  this.removeEvents();

  $('body').removeClass('grab');

  this.fadeOut( function(){
    this.emit('transitionOutComplete');
  }.bind(this));

}

p.fadeIn = function( callback ){

  if( !callback ) {
    callback = function(){};
  }

  TweenMax.to(this,2,{fadeAmount:0});

  if( this.isIntro ) {
    this.isIntro = false;
    TweenMax.fromTo(this,5,{lat:82,lon:88},{delay:1,lat:5, lon: -11, onComplete:callback, ease:Sine.easeInOut});
  }

}

p.fadeOut = function( callback ){

  if( !callback ) {
    callback = function(){};
  }

  TweenMax.to(this,1,{fadeAmount:1, onComplete:callback});
}

p.setPano = function( canvas ) {
  this.mesh.material.uniforms.texture0.value.image = canvas;
  this.mesh.material.uniforms.texture0.value.needsUpdate = true;
}

p.setNormalMap = function( canvas ) {
  this.normalMapCanvas = canvas
  this.mesh.material.uniforms.texture1.value.image = canvas;
  this.mesh.material.uniforms.texture1.value.needsUpdate = true;
}

p.setDepthMap = function( canvas ) {
  this.mesh.material.uniforms.texture2.value.image = canvas;
  this.mesh.material.uniforms.texture2.value.needsUpdate = true;
}

p.resetNature = function(){
  var obj;

  for (var i = this.foliageContainer.children.length - 1; i >= 0; i--) {
    obj = this.foliageContainer.children[i];
    this.foliageContainer.remove(obj);
    obj = undefined;
  };
}

p.createPlants = function(){

  var created = false;

  var totalPlants = 200;
  for (var i = 0; i < totalPlants; i++) {
    var point = this.get3DPointFromUV(0.35 + 0.3*Math.random(),1/totalPlants*i);

    var reflectedPoint = point.clone();
    reflectedPoint.z *= -1;

    created = this.plotIn3D(reflectedPoint);

    /*if( created ) {
      this.plotOnTexture(point);
    }*/

  };

  totalPlants = 200;
  for (var i = 0; i < totalPlants; i++) {
    var point = this.get3DPointFromUV(0.55 + 0.3*Math.random(),0.4 + 1/totalPlants*i*0.2);

    var reflectedPoint = point.clone();
    reflectedPoint.z *= -1;

    created = this.plotIn3D(reflectedPoint,false,2);
/*
    if( created ) {
      this.plotOnTexture(point);
    }*/

  };
}


p.createEdgeFoliage = function(){
  var totalPlants = MAP_WIDTH/4;
  var normal = new THREE.Vector3(0,-1,0);
  var created = false;
  for (var i = 0; i < totalPlants; i++) {

    var point = this.get3DPointAtEdge(i*4);
    if( point ){
      var reflectedPoint = point.clone();
      reflectedPoint.z *= -1;
      //reflectedPoint.z *= -1;

      created = this.plotIn3D(reflectedPoint,'ground',normal);

      if( created ) {
        this.plotOnTexture(point);
      }

    }
  };
}

p.createClimbingFoliages = function(){
  var divider = 16;
  var totalPlants = MAP_WIDTH/divider;
  var normal = new THREE.Vector3(0,-1,0);
  var created = false;
  for (var i = 0; i < totalPlants; i++) {

    var point = this.get3DPointAtEdge(i*divider, 50);

    if( point ){
      var reflectedPoint = point.clone();
      reflectedPoint.z *= -1;

      created = this.plotIn3D(reflectedPoint,'climb');

      if( created ) {
        this.plotOnTexture(point);
      }

    }
  };
}

p.init3D = function(){


  this.renderer = new THREE.WebGLRenderer({alpha:true});
  this.renderer.autoClearColor = false;
  this.renderer.setClearColor(0xffffff,1);
  this.renderer.setSize( window.innerWidth, window.innerHeight );
  this.renderer.sortObjects = false;
  this.renderer.autoClear = false;
  //this.renderer.sortElements = true;

  this.composer = new WAGNER.Composer( this.renderer );
  this.blurPass = new WAGNER.FullBoxBlurPass();
  this.bloomPass = new WAGNER.MultiPassBloomPass();

  this.dirtPass = new WAGNER.DirtPass();

  var groundMaskUniforms = {
    texture0: { type: "t", value: new THREE.Texture() },
    texture1: { type: "t", value: new THREE.Texture() },
    texture2: { type: "t", value: new THREE.Texture() }
  };

  var params = {
    uniforms:  groundMaskUniforms,
    vertexShader: require('./streetview_vs.glsl'),
    fragmentShader: require('./streetview_fs.glsl'),
    side: THREE.DoubleSide,
    transparent:true,
    lights: false
  }

  var maskMaterial = new THREE.ShaderMaterial(params);
  //maskMaterial.uniforms.map = new THREE.Texture();

  this.mesh = new THREE.Mesh(
    new THREE.SphereGeometry( 500, 40, 40 ),
    maskMaterial
  );

  //this.mesh.scale.z = -1;


  this.scene.add( this.mesh );

  this.light = new THREE.DirectionalLight(0xffffff,0.8);

  this.scene.add(this.light);

  this.scene.add( new THREE.AmbientLight(0x999999,0.2));

  this.foliageContainer = new THREE.Object3D();
  this.scene.add(this.foliageContainer);

  //ground
  var mossTile = THREE.ImageUtils.loadTexture( 'assets/images/moss-tile.jpg' );
  mossTile.repeat.set(200,200);
  mossTile.wrapS = mossTile.wrapT = THREE.RepeatWrapping;
  mossTile.needsUpdate = true;

  this.ground = new THREE.Mesh( new THREE.PlaneGeometry(4000,4000,1,1), new THREE.MeshLambertMaterial({map:mossTile,ambient:0x000000}));
  this.ground.rotation.x = Math.PI*-0.5;
  this.ground.position.y = -20;
  this.scene.add(this.ground);

  //tree
  var treeTex = THREE.ImageUtils.loadTexture( 'assets/images/tree.png' );
  var tree = new THREE.Mesh( new THREE.PlaneGeometry(12.5,15,1,1), new THREE.MeshBasicMaterial({map:treeTex,side: THREE.DoubleSide,transparent:true}));
  tree.position.set(40,0,5);
  tree.lookAt(this.camera.position.clone());
  this.scene.add(tree);

  this.tree1 = tree;

  //tree2
  var treeTex = THREE.ImageUtils.loadTexture( 'assets/images/tree2.png' );
  var tree = new THREE.Mesh( new THREE.PlaneGeometry(13,20,1,1), new THREE.MeshBasicMaterial({map:treeTex,side: THREE.DoubleSide,transparent:true}));
  tree.position.set(-40,0,0);
  tree.lookAt(this.camera.position.clone());
  this.scene.add(tree);

  this.tree2 = tree;

  //this.controller.handleResize();

  this.container.appendChild( this.renderer.domElement );

}

p.setLinks = function( links, centerHeading ){
  this.nav.setLinks(links, centerHeading);
}

p.initEvents = function(){
  //$(this.renderer.domElement).on('click', this.onSceneClick);

  this.onContainerMouseDown = this.onContainerMouseDown.bind(this);
  this.onContainerMouseMove = this.onContainerMouseMove.bind(this);
  this.onContainerMouseUp = this.onContainerMouseUp.bind(this);
  this.onContainerMouseWheel = this.onContainerMouseWheel.bind(this);

  this.onContainerTouchStart = this.onContainerTouchStart.bind(this);
  this.onContainerTouchEnd = this.onContainerTouchEnd.bind(this);
  this.onContainerTouchMove = this.onContainerTouchMove.bind(this);

  this.container.addEventListener( 'mousedown', this.onContainerMouseDown, false );
  this.container.addEventListener( 'mousemove', this.onContainerMouseMove, false );
  this.container.addEventListener( 'mouseup', this.onContainerMouseUp, false );
  this.container.addEventListener( 'mousewheel', this.onContainerMouseWheel, false );

  this.container.addEventListener( 'touchstart', this.onContainerTouchStart, false );
  this.container.addEventListener( 'touchend', this.onContainerTouchEnd, false );
  this.container.addEventListener( 'touchcancel', this.onContainerTouchEnd, false );
  this.container.addEventListener( 'touchmove', this.onContainerTouchMove, false );
}

p.removeEvents = function(){
  this.container.removeEventListener( 'mousedown', this.onContainerMouseDown );
  this.container.removeEventListener( 'mousemove', this.onContainerMouseMove );
  this.container.removeEventListener( 'mouseup', this.onContainerMouseUp );
  this.container.removeEventListener( 'mousewheel', this.onContainerMouseWheel );

  this.container.removeEventListener( 'touchstart', this.onContainerTouchStart );
  this.container.removeEventListener( 'touchend', this.onContainerTouchEnd );
  this.container.removeEventListener( 'touchcancel', this.onContainerTouchEnd );
  this.container.removeEventListener( 'touchmove', this.onContainerTouchMove );
}

p.onContainerMouseDown = function( event ) {

  event.preventDefault();

  this.isUserInteracting = true;
  this.isUserInteractingTime = Date.now();

  this.onPointerDownPointerX = event.clientX;
  this.onPointerDownPointerY = event.clientY;

  this.onPointerDownLon = this.lon;
  this.onPointerDownLat = this.lat;

  $('body').removeClass('grab').addClass('grabbing');

}

p.onContainerMouseMove = function( event ) {

  event.preventDefault();

  if ( this.isUserInteracting ) {

    this.lon = ( this.onPointerDownPointerX - event.clientX ) * 0.1 + this.onPointerDownLon;
    this.lat = ( event.clientY - this.onPointerDownPointerY ) * 0.1 + this.onPointerDownLat;

  }

  this.mouse2d.x = ( event.clientX / this.winSize.width ) * 2 - 1;
  this.mouse2d.y = - ( event.clientY / this.winSize.height ) * 2 + 1;

  delta = Date.now()-lastTime;
  lastTime = Date.now();
  $('#debug').text( delta );

}

p.onContainerMouseUp = function( event ) {
  this.isUserInteracting = false;

  if( Date.now()- this.isUserInteractingTime  < 300 ) {
    this.onSceneClick(event);
  }

  $('body').removeClass('grabbing').addClass('grab');

}

p.onContainerMouseWheel = function( event ) {
  this.camera.fov -= event.wheelDeltaY * 0.05;

  this.camera.fov = Math.min(80,Math.max(40,this.camera.fov));
  this.camera.updateProjectionMatrix();
}

p.onContainerTouchStart = function( event ) {

  if ( event.touches.length == 1 ) {

    event.preventDefault();

    this.isUserInteractingTime = Date.now();
    this.isUserInteracting = true;

    this.onPointerDownPointerX = event.touches[ 0 ].pageX;
    this.onPointerDownPointerY = event.touches[ 0 ].pageY;

    this.onPointerDownLon = this.lon;
    this.onPointerDownLat = this.lat;

  }

}

p.onContainerTouchEnd = function( event ){
  this.isUserInteracting = false;
  if( Date.now()- this.isUserInteractingTime  < 300 ) {
    this.onSceneClick(event);
  }
}

p.onContainerTouchMove = function( event ) {

  if ( event.touches.length == 1 ) {

    event.preventDefault();

    this.lon = ( this.onPointerDownPointerX - event.touches[0].pageX ) * 0.1 + this.onPointerDownLon;
    this.lat = ( event.touches[0].pageY - this.onPointerDownPointerY ) * 0.1 + this.onPointerDownLat;

    this.mouse2d.x = ( event.touches[0].pageX / this.winSize.width ) * 2 - 1;
    this.mouse2d.y = - ( event.touches[0].pageY / this.winSize.height ) * 2 + 1;

  }

}

p.onSceneClick = function(event){

  var vector = new THREE.Vector3((event.clientX / this.winSize.width) * 2 - 1, -(event.clientY / this.winSize.height) * 2 + 1, 0.5);
  var projector = new THREE.Projector();
  projector.unprojectVector(vector, this.camera);

  var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

//test nav
  var intersects = raycaster.intersectObjects(this.nav.markers);
  if (intersects.length > 0) {
    this.emit('panoLinkClicked', intersects[0].object.pano,intersects[0].object.description );
    return;
  }

  intersects = raycaster.intersectObjects([this.mesh]);
  if (intersects.length > 0) {
    var normalizedPoint = intersects[0].point.clone().normalize();
    var u = Math.atan2(normalizedPoint.x, normalizedPoint.z) / (2 * Math.PI) + 0.5;
    var v = Math.asin(normalizedPoint.y) / Math.PI + 0.5;

    this.plotIn3D(intersects[0].point);
    this.plotOnTexture(intersects[0].point);
    //console.log('intersect: ' + intersects[0].point.x.toFixed(2) + ', ' + intersects[0].point.y.toFixed(2) + ', ' + intersects[0].point.z.toFixed(2) + ')');
  }

}

p.setDepthData = function( data ){
  this.depthData = data;
}


p.setNormalData = function( data ){
  this.normalData = data;
}


p.get3DPointFromUV = function( u, v ){

  var lat = u * 180-90;
  var lon = v * 360-180;
  var r = Math.cos(DEG_TO_RAD *  lat);

  //range between 0-1
  var pos = new THREE.Vector3();
  pos.x = (r * Math.cos(DEG_TO_RAD * lon) );
  pos.y = (Math.sin(DEG_TO_RAD * lat));
  pos.z = (r * Math.sin(DEG_TO_RAD * lon));

  pos.normalize();

  return pos;
};

p.get3DPointAtEdge = function( textureX , heightThreshold ) {

  var canvas = this.normalMapCanvas;
  var ctx = canvas.getContext('2d');
  var data = ctx.getImageData(Math.floor(textureX), 0, 1, 255).data;
  var len = data.length;
  var dist,pixelIndex;

  //ground
  var compareR = 128;
  var compareG = 0;
  var compareB = 126;

  //sky
  /*var compareR = 128;
  var compareG = 128;
  var compareB = 128;*/
  var rangeStartAt = null;
  var pixel = 0;
  var foundColor = false;
  var result;

  for (var py = len-4; py > 0; py-=4) {
    //test pixel
    pixel++;

    if( !foundColor ) {

      dist = Math.abs(colorDistance( compareR,compareG,compareB, data[py],data[py+1],data[py+2]));

      if(dist > 58 ) {

        rangeStartAt = py;

        result = this.get3DPointFromUV((pixel)/MAP_HEIGHT,textureX/MAP_WIDTH);

        //check
        foundColor = true;

      }
    }

  };


  if( foundColor ) {
    if( heightThreshold ) {

      py = rangeStartAt - heightThreshold*4;
      //test at threshold value

      dist = Math.abs(colorDistance( 128,128,128, data[py],data[py+1],data[py+2]));

      if( dist !== 0 ) {
        return result;
      }
    } else  {
      return result;
    }

  }

  function colorDistance(colorRed,colorGreen,colorBlue,pixelRed,pixelGreen,pixelBlue){

    var diffR,diffG,diffB;

    // distance to color
    diffR = ( colorRed - pixelRed );
    diffG = ( colorGreen - pixelGreen );
    diffB = ( colorBlue - pixelBlue );
    return(Math.sqrt(diffR*diffR + diffG*diffG + diffB*diffB));

  }
}

p.plotOnTexture = function(point){

  var normalizedPoint = point.clone().normalize();

  var u = 0.5 + Math.atan2(normalizedPoint.z, normalizedPoint.x) / (2 * Math.PI);
  var v = 0.5 - Math.asin(normalizedPoint.y) / Math.PI;

  //normal
  var canvas = this.mesh.material.uniforms.texture1.value.image;
  var ctx = canvas.getContext('2d');
  var imgd = ctx.getImageData(Math.floor(u*canvas.width), Math.floor(v*canvas.height), 1, 1);
  var pix = imgd.data;
  var normal = new THREE.Vector3(pix[0]/255-0.5,pix[1]/255-0.5,pix[2]/255-0.5);

  var x = Math.floor(u*MAP_WIDTH);
  var y = Math.floor(v*MAP_HEIGHT);

  ctx.fillRect(x,y,1,1);
  //this.mesh.material.uniforms.texture1.value.needsUpdate = true;

}


p.getPointData = function(point){

  var normalizedPoint = point.clone().normalize();

  var u = 0.5 + Math.atan2(normalizedPoint.z, normalizedPoint.x) / (2 * Math.PI);
  var v = 0.5 - Math.asin(normalizedPoint.y) / Math.PI;


  var x = Math.floor((1-u)*MAP_WIDTH);
  var y = Math.floor(v*MAP_HEIGHT);

  var pixelIndex = y*MAP_WIDTH + x;

  var distance = this.depthData[pixelIndex];

  var normal = new THREE.Vector3(
    this.normalData[pixelIndex*3],
    this.normalData[pixelIndex*3+1],
    this.normalData[pixelIndex*3+2]);

 /* if(this.normalData[pixelIndex*3] === 0 && this.normalData[pixelIndex*3+1] === 0 && this.normalData[pixelIndex*3+2] === 0 ) {
    normal = normal.set(0,1,0);
  }
*/
  return {
    distance: distance,
    normal: normal
  }

}

p.plotIn3D = function( point, forceType, extraScale ){

  var plant;

  //get info from normalmap and depthmap
  var pointData = this.getPointData(point);

  var distanceToCamera = pointData.distance;
  var pointInWorld = point.normalize().multiplyScalar(distanceToCamera);
  var normalInWorld = pointData.normal;

  var up = new THREE.Vector3(0,-1,0);

  if( pointData.distance > 140 || pointData.distance < 7) {
    return;
  }

  if( forceType === 'climb' ) {

    plant = this.createClimbingPlant();

  }
  else if( normalInWorld.y < -0.7 || forceType === 'ground') {
    plant = this.createGrass({disableCracks:forceType === 'ground'});

  }
  else {
    plant = this.createWallPlant();

    //make rotation

    var v = plant.position.clone();
    v.add( normalInWorld );
    plant.lookAt(v);
  }

  if( extraScale ) {
    plant.scale.multiplyScalar(extraScale);
  }

  //set position

  plant.position.copy(pointInWorld);

  if(forceType === 'ground') {
    plant.position.y -= 0.4;
  }

  this.foliageContainer.add(plant);

  return plant;

}

p.createWallPlant = function(){
  var plant = new THREE.Mesh(this.hangBillboardGeo, this.wallHangMaterial );

  return plant;
}

p.createGrass = function( opts ){

  var plant;

  if( opts.disableCracks === true ) {
    plant = new THREE.Object3D();
  }
  else {
    plant = new THREE.Mesh(this.grassBaseGeo, this.grassBaseMaterial);
  }

  plant.rotation.x = Math.PI*0.5;
  //grass billboard sprites
  for (var i = 0; i < 3; i++) {
    var billboard = new THREE.Mesh(this.grassBillboardGeo, this.grassMaterial );

    if( i === 0 ) {
      billboard.lookAt(this.camera.position)
    }

    billboard.rotation.x = Math.PI*-0.5;
    billboard.rotation.y = Math.PI*Math.random();

    billboard.position.z =  -1.9;
    //billboard.position.x = Math.random()*2-1;
    //billboard.position.y = Math.random()*2-1;

    plant.add(billboard);
  };

  return plant;
}

p.createClimbingPlant = function(){

  var self = this;

  // smooth my curve over this many points
  var numPoints = 30;
  var path = getPath();
  var spline = new THREE.SplineCurve3(path);

  function getPath() {

    var list = [];
    var even = Math.random()>0.5?-1:1;
    var  pos,x,y,z;

    z = 0;

    list.push( new THREE.Vector3(0,0,0) );

    var totalCurves = 5 + Math.random()*20;

    for (var i =  0; i < totalCurves; i++) {
      x = ((1-i/totalCurves)*Math.random()*0.2 * i) * even ;

      even *= -1;

      y = 0.1 + i/1.3;
      pos = new THREE.Vector3(x,y,z);

      list.push( pos );
    };
    return list;
  }

  //tube = new THREE.TubeGeometry(extrudePath, segments, 2, radiusSegments, closed2, debug);
  var tubeGeo = new THREE.TubeGeometry(spline, 100, 0.1+Math.random()*0.05, 4, false,true);
  var mesh = new THREE.Mesh(tubeGeo, this.climbingPlantMaterial );

  var len = path.length;
  for ( i =  3; i < len; i+= Math.floor(Math.random()*3+2) ) {

    var plant = new THREE.Mesh( self.climbingBillboardGeo, self.climbingPlantLeafMaterial );
    plant.position.copy(path[i]);

    plant.rotation.z = Math.random();
    plant.rotation.y = Math.random();
    plant.scale.set(0.7,0.7,0.7);

    mesh.add(plant);
  }


  return mesh;
}


var lastTime = 0;
var delta;


p.render = function(){


  if( this.isRunning) {

    /*if(this.rafId) {
      raf.cancel( this.rafId);
    }
*/
    this.rafId = raf(this.render);
  }

  this.renderer.autoClearColor = false;

  this.testMouseOverObjects();

  this.renderer.clear();
  this.composer.reset();

  this.mesh.visible = false;
  this.foliageContainer.traverse( this.setVisibleHidden );
  this.ground.visible = true;
  this.composer.render( this.scene, this.camera );

  this.composer.reset();
  this.renderer.clear(false, true, false );
  this.mesh.visible = true;
  this.foliageContainer.traverse( this.setVisibleShown );
  this.ground.visible = false;

  this.composer.render( this.scene, this.camera );

  this.composer.pass( this.dirtPass );

  if( this.fadeAmount ) {
    this.composer.pass( this.blurPass, null, this.fadeAmount*50 );
  }

  this.composer.pass( this.bloomPass );

  this.composer.toScreen();
  //this.renderer.render(this.scene, this.camera);

  //this.lon += 1;

  this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
  this.phi = ( 90 - this.lat ) * Math.PI / 180;
  this.theta = this.lon * Math.PI / 180;

  this.updatedTarget.set(
    500 * Math.sin( this.phi ) * Math.cos( this.theta ),
    500 * Math.cos( this.phi ),
    500 * Math.sin( this.phi ) * Math.sin( this.theta )

  )

  this.target.lerp(this.updatedTarget,1);


  this.target.x += Math.cos(this.time*2)*10;
  this.target.y += Math.cos(this.time*2)*10;

  this.camera.lookAt( this.target );

  this.time += 0.01;


  //console.log(delta);

}

p.testMouseOverObjects = function(){

  var vector = new THREE.Vector3( this.mouse2d.x, this.mouse2d.y, 1 );
  this.projector.unprojectVector( vector, this.camera );
  var ray = new THREE.Raycaster( this.camera.position, vector.sub( this.camera.position ).normalize() );
  var obj;

  // create an array containing all objects in the scene with which the ray intersects
  var intersects = ray.intersectObjects( this.nav.markers );


  // if there is one (or more) intersections
  if ( intersects.length > 0 )
  {
    obj = intersects[0].object;
    obj.arrow.position.y += (0.5 - obj.arrow.position.y)/2;
    obj.arrow.children[0].visible = false;
    this.renderer.domElement.style.cursor = 'pointer';
  }
  else
  {
    for (var i =  this.nav.markers.length - 1; i >= 0; i--) {
      obj = this.nav.markers[i];
      obj.arrow.position.y += (0 - obj.arrow.position.y)/2;
      obj.arrow.children[0].visible = true;
    };
    this.renderer.domElement.style.cursor = '';
  }

}

p.setVisibleHidden = function(child){
  child.visible = false;
}

p.setVisibleShown = function(child){
  child.visible = true;
}

p.onResize  = function( w, h) {

  var s = 1;

  this.winSize.width = w
  this.winSize.height = h

  this.camera.aspect = w / h;
  this.camera.updateProjectionMatrix();

  this.renderer.setSize( s * w, s * h );
  this.composer.setSize( w, h );

  //this.controller.handleResize();

}

});
require.register("streetview/utils/detector.js", function(exports, require, module){
'use strict';

var $html = $('html');
var ua = navigator.userAgent;

function _modernizr(feature) {
  return $html.hasClass(feature);
}

/*
 * CONST
 */

var TYPE_MOBILE = 1;
var TYPE_TOUCH = 2;
var TYPE_DESKTOP = 3;

var TABLET_BREAKPOINT = { width: 645, height: 645 };

/**
 * Detect if the device is a touch device or not.
 *
 * @return {Boolean}
 * @public
 */

var isTouchDevice = !!('ontouchstart' in window) || !!('onmsgesturechange' in window);

/**
 * Detect if it's a mobile/tablet.
 *
 * @return {Boolean}
 * @public
 */

var isMobile = (/android|webos|ip(hone|ad|od)|blackberry|iemobile|windows (ce|phone)|opera mini/i).test(ua.toLowerCase());
var isTablet = isMobile && (window.innerWidth > TABLET_BREAKPOINT.width || window.innerHeight > TABLET_BREAKPOINT.height);


/**
 * Returns the type of the device (TYPE_MOBILE, TYPE_TOUCH, TYPE_DESKTOP).
 *
 * @return {Int} see const (TYPE_MOBILE, TYPE_TOUCH, TYPE_DESKTOP).
 * @public
 */


var getType = (function() {
  if (isMobile) {
    return TYPE_MOBILE;
  }

  if (isTouchDevice) {
    return TYPE_TOUCH;
  }

  return TYPE_DESKTOP;
}());

/**
 * Use modernizr to detect if the "browser" support WebGL.
 * @return {Boolean}
 * @public
 */

var webgl = (function() {
  try {
    return !!window.WebGLRenderingContext && (!!document.createElement('canvas').getContext('experimental-webgl') || !!document.createElement('canvas').getContext('webgl'));
  } catch(e) {
      return false;
  }
}());


/**
 * Detect if we support this browser or not.
 * @return {Boolean}
 * @public
 */

var isBrowserSupported = _modernizr('canvas') && _modernizr('csstransforms') && _modernizr('csstransforms3d') && _modernizr('svg');

var isRetina = window.devicePixelRatio >= 2;

var isNexusPhone = (/nexus\s4|galaxy\snexus/i).test(ua);
var isNexusTablet = (/nexus\s7|nexus\s10/i).test(ua);

var isMozilla = !!~ua.indexOf('Gecko') && !~ua.indexOf('KHTML');
var isIE = (/MSIE (\d+\.\d+);/).test(ua);
var isiOS = (/ip(hone|ad|od)/i).test(ua);

// Quick fix for ipad.
// Use the same layout/perf optimisation as the mobile version
if (isiOS) {
  isMobile = true;
  isTablet = false;
}


var hasPointerEvents = (function() {
  if(navigator.appName == 'Microsoft Internet Explorer')
  {
      var agent = navigator.userAgent;
      if (agent.match(/MSIE ([0-9]{1,}[\.0-9]{0,})/) != null){
          var version = parseFloat( RegExp.$1 );
          if(version < 11)
            return false;
      }
  }
  return true;
}());


/**
 * Expose data.
 */

module.exports = {
  TYPE_MOBILE: TYPE_MOBILE,
  TYPE_TOUCH: TYPE_TOUCH,
  TYPE_DESKTOP: TYPE_DESKTOP,

  isBrowserSupported: isBrowserSupported,
  isTouchDevice: isTouchDevice,
  isMobile: isMobile,
  isTablet: isTablet,
  isDesktop: !isMobile && !isTablet,
  isRetina: isRetina,
  getType: getType,
  webgl: webgl,
  hasPointerEvents: hasPointerEvents,

  isNexusPhone: isNexusPhone,
  isNexusTablet: isNexusTablet,
  isMozilla: isMozilla,
  isIE: isIE,
  isiOS: isiOS,
};

});
require.register("streetview/streetview_vs.glsl", function(exports, require, module){
module.exports = '// switch on high precision floats\nvarying vec4 mPosition;\nvarying vec2 vUv;\nuniform float time;\n\nvoid main() {\n\n  mPosition = modelMatrix * vec4(position,1.0);\n\n  vUv = uv;\n  vec4 mvPosition = viewMatrix * mPosition;\n  gl_Position = projectionMatrix * mvPosition;\n\n}\n';
});
require.register("streetview/streetview_fs.glsl", function(exports, require, module){
module.exports = 'varying vec4 mPosition;\nuniform sampler2D texture0;\nuniform sampler2D texture1;\nuniform sampler2D texture2;\nuniform float time;\nvarying vec2 vUv;\n\nuniform vec3 diffuse;\nuniform vec3 fogColor;\nuniform float fogNear;\nuniform float fogFar;\n\nvoid main() {\n\n  //normal\n  vec3 diffuseTex1 = texture2D( texture1, vUv ).xyz;\n  vec3 normalizedNormal = normalize(diffuseTex1);\n  float DiffuseTerm = 1.0 - clamp(max(0.0, dot(normalizedNormal, vec3(0.0,1.0,0.0))), 0.0, 1.0);\n  DiffuseTerm = 1.0 - step(DiffuseTerm,0.97);\n\n  //diffuse\n  vec3 diffuseTex0 = texture2D( texture0, vUv ).xyz;\n  float grey = 1.0-(diffuseTex0.r + diffuseTex0.g + diffuseTex0.b)/3.0;\n  vec3 finalDiffuse = diffuseTex0*vec3(0.8,0.9,0.8);\n\n\n  //depth\n  vec3 diffuseTex2 = texture2D( texture2, vUv ).xyz;\n\n  float thres = 1.0-step(0.1,diffuseTex1.b);\n  //vec4(diffuseTex1,1.0);\n  gl_FragColor = vec4( finalDiffuse,1.0-DiffuseTerm*(1.0-diffuseTex2.x));\n\n\n  //float depth = gl_FragCoord.z / gl_FragCoord.w;\n  //float fogFactor = smoothstep( fogNear, fogFar, depth );\n  //gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );\n\n}\n';
});
require.register("urbanjungle/static/app/index.js", function(exports, require, module){
'use strict';
var detector = require('./streetview/utils/detector');
var Pano = require('streetview');

var self = {};
var _panoLoader = new GSVPANO.PanoLoader({zoom: 3});
var _depthLoader = new GSVPANO.PanoDepthLoader();

var defaultLatlng = new google.maps.LatLng(40.759101,-73.984406);
var currentPanoLocation = null;
var draggingInstance;
var mouse2d = new google.maps.Point();
var pegmanTimeout;
var depthCanvas;
var normalCanvas;

var TALK_DEFAULT = 'Choose your location<br>and pick me up!';

var $pegman = $('#pegman');
var $pegmanCircle = $('.js-pegman-circle');
var $map = $('#map');
var $intro = $('.js-intro');
var $message = $('.js-message');
var $introContent = $('.js-intro-content');
var $loadingLabel = $('.js-loading-label');
var $dragHideLayers = $('.js-drag-hide');
var $streetviewTile = $('.js-streetview-layer-tile');

var streetviewCanvas = document.createElement('canvas');
var streetViewTileData;
streetviewCanvas.className = 'streetview-layer-tile-canvas';
streetviewCanvas.width = 256;
streetviewCanvas.height = 256;
//document.body.appendChild(streetviewCanvas);

var streetviewTileImg = document.createElement('img');
streetviewTileImg.addEventListener('load',drawStreetViewTileToCanvas.bind(this));

if( !detector.webgl ) {
  location.href='nosupport.html';
  return;
}

var pano = new Pano();

pegmanTalk(TALK_DEFAULT);

$('#backToMap').on('click', function(){

  pegmanTalk(TALK_DEFAULT);

  backToMap();

})

$('#choice-default-1').on('click', function( event ){
  event.preventDefault();
  var to = new google.maps.LatLng(40.759101,-73.984406)
  map.panTo( to );
})

$('#choice-default-2').on('click', function(){
  event.preventDefault();
  var to = new google.maps.LatLng(37.7914908,-122.3977816)
  map.panTo( to );
})


$('#choice-default-3').on('click', function(){
  event.preventDefault();
  var to = new google.maps.LatLng(59.3346806,18.0621834)
  map.panTo( to );
})


$('#choice-location').on('click', function(){
  event.preventDefault();
  navigator.geolocation.getCurrentPosition( geoSuccess, geoError );
})

$('.js-more-info').on('click', function(){
  $('#info').show();
})

$('.js-close-info').on('click', function(){
  $('#info').hide();
})

$('.js-intro').removeClass('inactive');

pano.on('panoLinkClicked', function(id,description){

  $loadingLabel.find('h1').html(description)

  $loadingLabel.removeClass('inactive');
  TweenMax.to($loadingLabel,1,{opacity:1});

  pano.fadeOut( function(){
    _panoLoader.loadId(id);
  });
})

function backToMap() {

  if( pano.isRunning ) {
    pano.once('transitionOutComplete', function(){
      showMap();
    });
    pano.transitionOut();

    TweenLite.set($pegman, {x:0,y:0});
  }
  else {
    showMap();
  }

  function showMap() {
    draggingInstance.enable();
    $map.fadeIn();
    $intro.fadeIn();
    $dragHideLayers.fadeIn();
    $pegman.removeClass('dragging');
    $pegman.removeClass('over-road');
  }

}

draggingInstance = Draggable.create($pegman, {
  type:"x,y",
  edgeResistance:0.5,
  throwProps:true,
  bounds:window,
  onDragStart:onStartDragPegman,
  onDragEnd:onEndDragPegman,
  onDrag:onDragPegman
})[0];


function onDragPegman(event) {

  var offset = $pegman.offset(),
  bounds = map.getBounds(),
  neLatlng = bounds.getNorthEast(),
  swLatlng = bounds.getSouthWest(),
  startLat = neLatlng.lat(),
  endLng = neLatlng.lng(),
  endLat = swLatlng.lat(),
  startLng = swLatlng.lng(),
  x = offset.left + 50,
  y = offset.top + 50

  var lat = startLat + ((y/window.innerHeight) * (endLat - startLat))
  var lng = startLng + ((x/window.innerWidth) * (endLng - startLng));

  var TILE_SIZE = 256;
  var proj = map.getProjection();
  var numTiles = 1 << map.getZoom();
  var worldCoordinate = proj.fromLatLngToPoint( new google.maps.LatLng(lat,lng));

  var pixelCoordinate = new google.maps.Point(
    worldCoordinate.x * numTiles,
    worldCoordinate.y * numTiles);

  var tileCoordinate = new google.maps.Point(
    Math.floor(pixelCoordinate.x / TILE_SIZE),
    Math.floor(pixelCoordinate.y / TILE_SIZE));

  //console.log('TileX:' +tileCoordinate.x+' - TileY:'+tileCoordinate.y);

  var localPixel = new google.maps.Point(pixelCoordinate.x%256,pixelCoordinate.y%256);

  var tileUrl = 'https://mts1.googleapis.com/vt?hl=sv-SE&lyrs=svv|cb_client:apiv3&style=40,18&x='+tileCoordinate.x+'&y='+tileCoordinate.y+'&z=' + map.getZoom();

  if( streetviewTileImg.src !== tileUrl ){
    streetviewTileImg.crossOrigin = '';
    streetviewTileImg.src = tileUrl;

  }
  else {
    if(streetViewTileData && streetViewTileData.length > 0) {
      //get pixel
      var index = (Math.floor(localPixel.y) * 256 + Math.floor(localPixel.x)) * 4;
      var trans = streetViewTileData[index];
      var blue = streetViewTileData[index-1]
      var validColor = false;

      if( trans > 0 && blue === 132 ) {
        validColor = true;
      }
      if( validColor && !$pegman.hasClass('over-road')) {
        $pegman.addClass('over-road');
      }
      else if( !validColor && $pegman.hasClass('over-road')){
        $pegman.removeClass('over-road');
      }
    }
  }
}

function pegmanTalk( msg, timeout ){
  $message.html(msg);

  TweenMax.fromTo($message,0.3,{x:0},{x:10,yoyo:true});

  if( timeout ) {
    if( pegmanTimeout ) {
      clearTimeout(pegmanTimeout);
    }
    pegmanTimeout = setTimeout(function(){
      pegmanTalk(TALK_DEFAULT)
    },timeout*1000)
  }
}

function onStartDragPegman(){

  streetViewLayer.setMap(map);

  $dragHideLayers.fadeOut()
  $pegman.addClass('dragging');

  pegmanTalk('Now drop me somewhere');
}

function onEndDragPegman( event ){

  streetViewLayer.setMap();

  var offset = $pegman.offset(),

  bounds = map.getBounds(),
  neLatlng = bounds.getNorthEast(),
  swLatlng = bounds.getSouthWest(),
  startLat = neLatlng.lat(),
  endLng = neLatlng.lng(),
  endLat = swLatlng.lat(),
  startLng = swLatlng.lng(),
  x = offset.left + 45,
  y = offset.top + 60

  var lat = startLat + ((y/window.innerHeight) * (endLat - startLat))
  var lng = startLng + ((x/window.innerWidth) * (endLng - startLng));

  pegmanTalk('I hope there will be no snakes');

  _panoLoader.load(new google.maps.LatLng(lat,lng));

  draggingInstance.disable();

}

function drawStreetViewTileToCanvas(){
  streetviewCanvas.width = streetviewCanvas.width;
  var ctx = streetviewCanvas.getContext('2d');

  ctx.drawImage(streetviewTileImg,0,0,256,256);
  streetViewTileData = ctx.getImageData(0, 0, 256, 256).data;
}



/*

var el = document.getElementById( 'myLocationButton' );
el.addEventListener( 'click', function( event ) {
  event.preventDefault();
  navigator.geolocation.getCurrentPosition( geoSuccess, geoError );
}, false );

  navigator.pointer = navigator.pointer || navigator.webkitPointer;

  function lockPointer () {
    if( navigator.pointer ) {
      navigator.pointer.lock( container, function() {
        console.log( 'Pointer locked' );
      }, function() {
        console.log( 'No pointer lock' );
      } );
    }
  }

  var el = document.getElementById( 'fullscreenButton' );
  if( el ) {
    el.addEventListener( 'click', function( e ) {
      container.onwebkitfullscreenchange = function(e) {
        lockPointer();
        container.onwebkitfullscreenchange = function() {
        };
      };
      container.onmozfullscreenchange = function(e) {
        lockPointer();
        container.onmozfullscreenchange = function() {
        };
      };
      if( container.webkitRequestFullScreen ) container.webkitRequestFullScreen();
      if( container.mozRequestFullScreen ) container.mozRequestFullScreen();
      e.preventDefault();
    }, false );
  }

  */


function geoSuccess( position ) {
  pegmanTalk('I can see you!',2)
  var currentLocation = new google.maps.LatLng( position.coords.latitude, position.coords.longitude );
  map.panTo( currentLocation );

}

function geoError( message ) {
  pegmanTalk( "I can't see where you are" , 4 );
}

var marker;

var styleArray = [
  {"stylers": [
    { "visibility": "off" },
  ]},
  {
    "featureType": "landscape.man_made",
    "stylers": [
      { "visibility": "on" },
      { "hue": "#00ff11" },
      { "saturation": 53 },
      { "gamma": 0.26 },
      { "lightness": -75 }
    ]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      { "visibility": "simplified" },
      { color: "#065337" }
    ]
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [
      { color: "#126f4d" }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "stylers": [
      { "visibility": "simplified" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      { "visibility": "on" },
      { "color": "#033a26" }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [
      { "visibility": "on" },
      { "color": "#2f4d5f" }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry.fill",
    "stylers": [
      { "visibility": "on" },
      { "color": "#006943" }
    ]
  }
];

var myOptions = {
  zoom: 17,
  center: defaultLatlng,
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  tilt:45,
  disableDefaultUI:true,
  streetViewControl: false,
  styles: styleArray
}
var map = new google.maps.Map( document.getElementById( 'map' ), myOptions );

var streetViewLayer = new google.maps.StreetViewCoverageLayer();

var geocoder = new google.maps.Geocoder();

var el = document.getElementById( 'searchButton' );
el.addEventListener( 'click', function( event ) {
  event.preventDefault();
  findAddress( document.getElementById("address").value );
}, false );


//document.getElementById("address").focus();

function findAddress( address ) {

  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      pegmanTalk("Found the place, let's go!",3);
    } else {
      pegmanTalk("Could not find the location",5);
      //showProgress( false );
    }
  });
}




_panoLoader.onPanoramaLoad = function() {

  pano.setPano(this.canvas);

  _depthLoader.load(this.panoId);
  self.centerHeading = this.centerHeading;
  self.links = this.links;

  if( currentPanoLocation ) {
    var dist = google.maps.geometry.spherical.computeDistanceBetween(currentPanoLocation, this.panoLocation.latLng);

  }

  currentPanoLocation = this.panoLocation.latLng;

};

_panoLoader.onNoPanoramaData = function(){
  pegmanTalk("Snakes! Can't go there. Try another spot",4);
  backToMap();
}

_depthLoader.onDepthError = function() {
  pegmanTalk("Snakes! Can't go there. Try another spot",4);

  backToMap();
}

_depthLoader.onDepthLoad = function( buffers ) {
  var x, y, context, image, w, h, c,pointer;

  if( !depthCanvas ) {
    depthCanvas = document.createElement("canvas");
  }

  context = depthCanvas.getContext('2d');

  w = buffers.width;
  h = buffers.height;

  depthCanvas.setAttribute('width', w);
  depthCanvas.setAttribute('height', h);

  image = context.getImageData(0, 0, w, h);

  for(y=0; y<h; ++y) {
    for(x=0; x<w; ++x) {
      c = buffers.depthMap[y*w + x] / 50 * 255;
      image.data[4*(y*w + x)    ] = c;
      image.data[4*(y*w + x) + 1] = c;
      image.data[4*(y*w + x) + 2] = c;
      image.data[4*(y*w + x) + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);

  //document.body.appendChild(panoCanvas);
  pano.setDepthData(buffers.depthMap);
  pano.setDepthMap(depthCanvas);

  if( !normalCanvas ) {
    normalCanvas = document.createElement("canvas");
    //document.body.appendChild(normalCanvas);
  }

  context = normalCanvas.getContext('2d');

  w = buffers.width;
  h = buffers.height;

  normalCanvas.setAttribute('width', w);
  normalCanvas.setAttribute('height', h);

  image = context.getImageData(0, 0, w, h);
  pointer = 0;

  var pixelIndex;

  for(y=0; y<h; ++y) {
    for(x=0; x<w; ++x) {
      pointer += 3;
      pixelIndex = (y*w + (w-x))*4;
      image.data[ pixelIndex ] = (buffers.normalMap[pointer]+1)/2 * 255;
      image.data[pixelIndex + 1] = (buffers.normalMap[pointer+1]+1)/2 * 255;
      image.data[pixelIndex + 2] = (buffers.normalMap[pointer+2]+1)/2 * 255;
      image.data[pixelIndex + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);

  pano.setNormalData(buffers.normalMap);
  pano.setNormalMap(normalCanvas);

  pano.generateNature();
  pano.start();

  if( !pano.isIntro ) {
    TweenMax.to($loadingLabel,1,{opacity:0});
  }

  $loadingLabel.removeClass('inactive');
  TweenMax.to($loadingLabel,1,{opacity:1});

  $map.fadeOut();
  $intro.fadeOut();
  TweenMax.to($loadingLabel,1,{opacity:0});

  pano.setLinks(self.links, self.centerHeading );

}

window.addEventListener('resize',onResize);
onResize();

 function onResize() {
  var w = window.innerWidth,
    h = window.innerHeight;

    //TweenMax.set($introContent,{y: h*.5 - $introContent.height()*.5 });

    pano.onResize(w,h);

 }



});
require.register("urbanjungle/static/app/streetview/utils/detector.js", function(exports, require, module){
'use strict';

var $html = $('html');
var ua = navigator.userAgent;

function _modernizr(feature) {
  return $html.hasClass(feature);
}

/*
 * CONST
 */

var TYPE_MOBILE = 1;
var TYPE_TOUCH = 2;
var TYPE_DESKTOP = 3;

var TABLET_BREAKPOINT = { width: 645, height: 645 };

/**
 * Detect if the device is a touch device or not.
 *
 * @return {Boolean}
 * @public
 */

var isTouchDevice = !!('ontouchstart' in window) || !!('onmsgesturechange' in window);

/**
 * Detect if it's a mobile/tablet.
 *
 * @return {Boolean}
 * @public
 */

var isMobile = (/android|webos|ip(hone|ad|od)|blackberry|iemobile|windows (ce|phone)|opera mini/i).test(ua.toLowerCase());
var isTablet = isMobile && (window.innerWidth > TABLET_BREAKPOINT.width || window.innerHeight > TABLET_BREAKPOINT.height);


/**
 * Returns the type of the device (TYPE_MOBILE, TYPE_TOUCH, TYPE_DESKTOP).
 *
 * @return {Int} see const (TYPE_MOBILE, TYPE_TOUCH, TYPE_DESKTOP).
 * @public
 */


var getType = (function() {
  if (isMobile) {
    return TYPE_MOBILE;
  }

  if (isTouchDevice) {
    return TYPE_TOUCH;
  }

  return TYPE_DESKTOP;
}());

/**
 * Use modernizr to detect if the "browser" support WebGL.
 * @return {Boolean}
 * @public
 */

var webgl = (function() {
  try {
    return !!window.WebGLRenderingContext && (!!document.createElement('canvas').getContext('experimental-webgl') || !!document.createElement('canvas').getContext('webgl'));
  } catch(e) {
      return false;
  }
}());


/**
 * Detect if we support this browser or not.
 * @return {Boolean}
 * @public
 */

var isBrowserSupported = _modernizr('canvas') && _modernizr('csstransforms') && _modernizr('csstransforms3d') && _modernizr('svg');

var isRetina = window.devicePixelRatio >= 2;

var isNexusPhone = (/nexus\s4|galaxy\snexus/i).test(ua);
var isNexusTablet = (/nexus\s7|nexus\s10/i).test(ua);

var isMozilla = !!~ua.indexOf('Gecko') && !~ua.indexOf('KHTML');
var isIE = (/MSIE (\d+\.\d+);/).test(ua);
var isiOS = (/ip(hone|ad|od)/i).test(ua);

// Quick fix for ipad.
// Use the same layout/perf optimisation as the mobile version
if (isiOS) {
  isMobile = true;
  isTablet = false;
}


var hasPointerEvents = (function() {
  if(navigator.appName == 'Microsoft Internet Explorer')
  {
      var agent = navigator.userAgent;
      if (agent.match(/MSIE ([0-9]{1,}[\.0-9]{0,})/) != null){
          var version = parseFloat( RegExp.$1 );
          if(version < 11)
            return false;
      }
  }
  return true;
}());


/**
 * Expose data.
 */

module.exports = {
  TYPE_MOBILE: TYPE_MOBILE,
  TYPE_TOUCH: TYPE_TOUCH,
  TYPE_DESKTOP: TYPE_DESKTOP,

  isBrowserSupported: isBrowserSupported,
  isTouchDevice: isTouchDevice,
  isMobile: isMobile,
  isTablet: isTablet,
  isDesktop: !isMobile && !isTablet,
  isRetina: isRetina,
  getType: getType,
  webgl: webgl,
  hasPointerEvents: hasPointerEvents,

  isNexusPhone: isNexusPhone,
  isNexusTablet: isNexusTablet,
  isMozilla: isMozilla,
  isIE: isIE,
  isiOS: isiOS,
};

});


require.alias("streetview/nav.js", "urbanjungle/deps/streetview/nav.js");
require.alias("streetview/index.js", "urbanjungle/deps/streetview/index.js");
require.alias("streetview/utils/detector.js", "urbanjungle/deps/streetview/utils/detector.js");
require.alias("streetview/index.js", "urbanjungle/deps/streetview/index.js");
require.alias("streetview/index.js", "streetview/index.js");
require.alias("component-raf/index.js", "streetview/deps/raf/index.js");

require.alias("component-emitter/index.js", "streetview/deps/emitter/index.js");

require.alias("streetview/index.js", "streetview/index.js");
require.alias("urbanjungle/static/app/index.js", "urbanjungle/index.js");