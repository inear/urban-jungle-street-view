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

  this.camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, 1, 1100 );
  this.target = new THREE.Vector3( 0, 0, 0 );

  this.controller = new THREE.FirstPersonControls(this.camera,document);

  this.scene = new THREE.Scene();
  this.scene.add( this.camera );

  this.mesh = null;

  //this.markerGeo = new THREE.SphereGeometry(2,4,4);
  this.markerGeo = new THREE.PlaneGeometry(3,3,1,1);
  var tex = THREE.ImageUtils.loadTexture('assets/images/cracks.png');
  
  this.markerMaterial = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, map: tex, transparent:true,depthWrite:false });
  
  var grassMap = THREE.ImageUtils.loadTexture( 'assets/images/grass_billboard.png' );
  this.grassMaterial = new THREE.MeshBasicMaterial( { map: grassMap, alphaTest: 0.8, side: THREE.DoubleSide } );

  var wallMossMap = THREE.ImageUtils.loadTexture( 'assets/images/wall-moss.png' );
  this.wallMossMaterial = new THREE.MeshBasicMaterial( { map: wallMossMap, alphaTest: 0.8, side: THREE.DoubleSide } );

  var wallHangMap = THREE.ImageUtils.loadTexture( 'assets/images/wall-hang.png' );
  this.wallHangMaterial = new THREE.MeshBasicMaterial( { map: wallHangMap, transparent:true, depthWrite:false, side: THREE.DoubleSide } );  

  this.hangBillboardGeo = new THREE.PlaneGeometry(5,3,1,1);
  this.grassBillboardGeo = new THREE.PlaneGeometry(2,2,1,1);

  this.init3D();
  this.initEvents();
}

var p = PanoView.prototype;

p.init3D = function(){

  this.renderer = isWebGL() ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
  this.renderer.autoClearColor = false;
  this.renderer.setSize( window.innerWidth, window.innerHeight );
  //this.renderer.sortObjects = true;
  //this.renderer.sortElements = true;

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

  this.mesh = new THREE.Mesh(
    new THREE.SphereGeometry( 500, 60, 40 ),
    maskMaterial
  );

  this.scene.add( this.mesh );

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

  var intersects = raycaster.intersectObjects([this.mesh]);

  if (intersects.length > 0) {
    
    var normalizedPoint = intersects[0].point.clone().normalize();
    var u = Math.atan2(normalizedPoint.x, normalizedPoint.z) / (2 * Math.PI) + 0.5;
    var v = Math.asin(normalizedPoint.y) / Math.PI + 0.5;

    this.plotIn3D(intersects[0].point);
    this.plotOnTexture(intersects[0].point);
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
  
  var pointData = this.getPointData(point);
  
  var marker;
  
  if(pointData.normal.y < -0.7) {

     marker = new THREE.Mesh(this.markerGeo, this.markerMaterial);

    //grass billboard
    for (var i = 0; i < 7; i++) {
      var billboard = new THREE.Mesh(this.grassBillboardGeo, this.grassMaterial );
      billboard.rotation.x = Math.PI*-0.5;
      billboard.rotation.y = Math.PI*Math.random();
      billboard.position.z = -1;
      billboard.position.x = Math.random()*2-1;
      billboard.position.y = Math.random()*2-1;
      marker.add(billboard);  
    };
  }
  else {

    marker = new THREE.Object3D();//new THREE.Mesh(this.markerGeo, this.wallMossMaterial);

    for (var i = 0; i < 6; i++) {
      var billboard = new THREE.Mesh(this.hangBillboardGeo, this.wallHangMaterial );
      //billboard.rotation.x = Math.PI*-0.5;
      billboard.rotation.y = Math.PI*Math.random();
      //billboard.position.z = -1.5;
      billboard.position.x = Math.random()*3-1.5;
      billboard.position.z = Math.random()*3-1.5;
      marker.add(billboard);  
    };
    
  }

  marker.position.copy(point);

  marker.position.normalize().multiplyScalar(pointData.distance);
  var v = marker.position.clone();
  v.add( pointData.normal );
  marker.lookAt(v);
  this.scene.add(marker);
  
}

p.getPointData = function(point){

  var normalizedPoint = point.clone().normalize();
  var u = Math.atan2(normalizedPoint.x, normalizedPoint.z) / (2 * Math.PI) + 0.5;
  var v = Math.asin(normalizedPoint.y) / Math.PI + 0.5;

  //distance
  var w = 512;
  var h = 256;
  
  u = (u-0.25);
  if( u < 0 ) {
    u = 1+u;
  }

  v = (1-v);

  var x = Math.floor(u*w);
  var y = Math.floor(v*h);

  var pixelIndex = y*w + x;

  var distance = this.depthData[pixelIndex];

 var normal = new THREE.Vector3(
    this.normalData[pixelIndex*3],
    this.normalData[pixelIndex*3+1],
    this.normalData[pixelIndex*3+2]);
  
  if(this.normalData[pixelIndex*3] === 0 && this.normalData[pixelIndex*3+1] === 0 && this.normalData[pixelIndex*3+2] === 0 ) {
    normal = normal.set(0,1,0); 
  }
  
  return {
    distance: distance,
    normal: normal
  }

}



p.plotOnTexture = function(point){
  
  var normalizedPoint = point.clone().normalize();
  var u = Math.atan2(normalizedPoint.x, normalizedPoint.z) / (2 * Math.PI) + 0.5;
  var v = Math.asin(normalizedPoint.y) / Math.PI + 0.5;

  //normal
  var canvas = this.mesh.material.uniforms.texture1.value.image;
  var ctx = canvas.getContext('2d');
  var imgd = ctx.getImageData(Math.floor(u*canvas.width), Math.floor(v*canvas.height), 1, 1);
  var pix = imgd.data;
  var normal = new THREE.Vector3(pix[0]/255-0.5,pix[1]/255-0.5,pix[2]/255-0.5);
  
  //distance
  var w = 512;
  var h = 256;
  
  u = (u-0.25);
  if( u < 0 ) u = 1+u;

  v = (1-v);

  var x = Math.floor(u*w);
  var y = Math.floor(v*h);
  
  ctx.fillRect(x,y,10,10);
  this.mesh.material.uniforms.texture1.value.needsUpdate = true;
  
}

p.render = function(){
  this.renderer.render( this.scene, this.camera );
  this.controller.update(0.1);
  this.time += 0.01;

  raf(this.render);
}
