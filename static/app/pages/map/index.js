var raf = require('raf');

module.exports = PanoView;

var isWebGL = function () {
  try {
    return !! window.WebGLRenderingContext
            && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' );
  } catch(e) {
    console.log('WebGL not available starting with CanvasRenderer');
    return false;
  }
};

function PanoView(){

  this.render = this.render.bind(this);

  this.canvas = document.createElement( 'canvas' );
  this.context = this.canvas.getContext( '2d' );

  this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 1100 );
  this.target = new THREE.Vector3( 0, 0, 0 );

  this.controller = new THREE.FirstPersonControls(this.camera,document);

  this.scene = new THREE.Scene();
  this.scene.add( this.camera );

  this.mesh = null;

  this.init3D();
}

var p = PanoView.prototype;

p.init3D = function(){
  this.renderer = isWebGL() ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
  this.renderer.autoClearColor = false;
  this.renderer.setSize( window.innerWidth, window.innerHeight );


  this.mesh = new THREE.Mesh(
    new THREE.SphereGeometry( 500, 60, 40 ),
    new THREE.MeshPhongMaterial( { map: new THREE.Texture(), normalMap:new THREE.Texture(), side: THREE.DoubleSide, overdraw: true } )
  );

  this.scene.add( this.mesh );


  var light = new THREE.DirectionalLight();
  this.scene.add(light);

  this.controller.handleResize();

  $('#app')[0].appendChild( this.renderer.domElement );
}

p.render = function(){
  this.renderer.render( this.scene, this.camera );
  this.controller.update(0.1);
  raf(this.render);
}