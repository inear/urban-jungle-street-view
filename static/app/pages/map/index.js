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

  this.time = 0;

  this.depthData = null;

  this.render = this.render.bind(this);
  this.onSceneClick = this.onSceneClick.bind(this);

  this.canvas = document.createElement( 'canvas' );
  this.context = this.canvas.getContext( '2d' );

  this.camera = new THREE.PerspectiveCamera(80, window.innerWidth/window.innerHeight, 1, 1100 );
  this.target = new THREE.Vector3( 0, 0, 0 );

  this.controller = new THREE.FirstPersonControls(this.camera,document);

  this.scene = new THREE.Scene();
  this.scene.add( this.camera );

  this.mesh = null;

  this.markerGeo = new THREE.SphereGeometry(2,4,4);
  this.markerMaterial = new THREE.MeshBasicMaterial({color:0xff0000});

  this.init3D();
  this.initEvents();
}

var p = PanoView.prototype;

p.init3D = function(){
  this.renderer = isWebGL() ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
  this.renderer.autoClearColor = false;
  this.renderer.setSize( window.innerWidth, window.innerHeight );


  this.mesh = new THREE.Mesh(
    new THREE.SphereGeometry( 500, 60, 40 ),
    new THREE.MeshPhongMaterial( { map: new THREE.Texture(), normalMap:new THREE.Texture(), side: THREE.DoubleSide } )
  );

  this.mesh2 = new THREE.Mesh(
    new THREE.SphereGeometry( 490, 60, 40 ),
    new THREE.MeshPhongMaterial( { map: new THREE.Texture(), side: THREE.DoubleSide, opacity:0.5,transparent:true } )
  );

  var groundMaskUniforms = {
    texture0: { type: "t", value: new THREE.Texture() },
    texture1: { type: "t", value: new THREE.Texture() },
    texture2: { type: "t", value: new THREE.Texture() }
  };

  var params = {
    uniforms:  groundMaskUniforms,
    vertexShader: require('./water_vs.glsl'),
    fragmentShader: require('./water_fs.glsl'),
    side: THREE.DoubleSide,
    transparent:false,
    lights: false
  }

  var maskMaterial = new THREE.ShaderMaterial(params);
  //maskMaterial.uniforms.map = new THREE.Texture();


  this.mesh3 = new THREE.Mesh(
    new THREE.SphereGeometry( 800, 60, 40 ),
    maskMaterial
  );

  //this.scene.add( this.mesh );
  //this.scene.add( this.mesh2 );
  this.scene.add( this.mesh3 );


  this.light = new THREE.AmbientLight();
  this.scene.add(this.light);

  this.controller.handleResize();

  $('#app')[0].appendChild( this.renderer.domElement );
}

p.initEvents = function(){
  $(this.renderer.domElement).on('click', this.onSceneClick);
}

p.onSceneClick = function(event){

  var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
  var projector = new THREE.Projector();
  projector.unprojectVector(vector, this.camera);

  var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

  var intersects = raycaster.intersectObjects([this.mesh3]);

  if (intersects.length > 0) {
    
    var normalizedPoint = intersects[0].point.clone().normalize();
    var u = Math.atan2(normalizedPoint.x, normalizedPoint.z) / (2 * Math.PI) + 0.5;
    var v = Math.asin(normalizedPoint.y) / Math.PI + 0.5;

    this.plotIn3D(intersects[0].point);
    //this.plotOnTexture(u,v);
    //console.log('intersect: ' + intersects[0].point.x.toFixed(2) + ', ' + intersects[0].point.y.toFixed(2) + ', ' + intersects[0].point.z.toFixed(2) + ')');
  }
  else {
      console.log('no intersect');
  }
}

p.setDepthData = function( data ){
  this.depthData = data;
}


p.setNormalData = function( data ){
  this.normalData = data;
}

p.plotIn3D = function(point){
  var sphere = new THREE.Mesh(this.markerGeo, this.markerMaterial);
  sphere.position.copy(point);
  console.log(this.getDistance(point));
  sphere.position.normalize().multiplyScalar(this.getDistance(point));
  this.scene.add(sphere);
}

p.getDistance = function(point){

  var normalizedPoint = point.clone().normalize();
  var u = Math.atan2(normalizedPoint.x, normalizedPoint.z) / (2 * Math.PI) + 0.5;
  var v = Math.asin(normalizedPoint.y) / Math.PI + 0.5;

  //distance
  var w = 512;
  var h = 256;
  
  u = (u-0.25);
  if( u < 0 ) u = 1-u;

  v = (1-v);

  var x = Math.floor(u*w);
  var y = Math.floor(v*h);

  var distance = this.depthData[y*w + x];

  return distance;
}

p.plotOnTexture = function(u,v){
  
  //normal
  var canvas = this.mesh3.material.uniforms.texture1.value.image;
  var ctx = canvas.getContext('2d');
  var imgd = ctx.getImageData(Math.floor(u*canvas.width), Math.floor(v*canvas.height), 1, 1);
  var pix = imgd.data;
  var normal = new THREE.Vector3(pix[0]/255-0.5,pix[1]/255-0.5,pix[2]/255-0.5);
  
  //distance
  var w = 512;
  var h = 256;
  
  u = (u-0.25);
  if( u < 0 ) u = 1-u;

  v = (1-v);

  var x = Math.floor(u*w);
  var y = Math.floor(v*h);
  
  ctx.fillRect(x,y,10,10);
  this.mesh3.material.uniforms.texture1.value.needsUpdate = true;
  console.log(this.depthData[y*w + x]);

  
}

p.render = function(){
  this.renderer.render( this.scene, this.camera );
  this.controller.update(0.1);
  this.time += 0.01;

  raf(this.render);
}
