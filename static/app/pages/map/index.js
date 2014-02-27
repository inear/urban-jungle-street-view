var raf = require('raf');
var DEG_TO_RAD = Math.PI/180;
var MAP_WIDTH = 512;
var MAP_HEIGHT = 256;

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

  this.normalMapCanvas = null;
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
  this.markerGeo = new THREE.PlaneGeometry(2,2,1,1);
  var tex = THREE.ImageUtils.loadTexture('assets/images/cracks.png');

  this.markerMaterial = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: tex,alphaTest: 0.8 });

  var grassMap = THREE.ImageUtils.loadTexture( 'assets/images/grass_billboard.png' );
  this.grassMaterial = new THREE.MeshBasicMaterial( { map: grassMap, alphaTest: 0.8, side: THREE.DoubleSide } );

  var wallMossMap = THREE.ImageUtils.loadTexture( 'assets/images/wall-moss.png' );
  this.wallMossMaterial = new THREE.MeshBasicMaterial( { map: wallMossMap, transparent:true, depthWrite:false,  side: THREE.DoubleSide } );

  var wallHangMap = THREE.ImageUtils.loadTexture( 'assets/images/leafs.png' );
  this.wallHangMaterial = new THREE.MeshBasicMaterial( { map: wallHangMap, alphaTest:0.9, side: THREE.DoubleSide } );

  var climbingLeafTex = THREE.ImageUtils.loadTexture( 'assets/images/climbing.png' );
  this.climbingPlantLeafMaterial = new THREE.MeshBasicMaterial({map:climbingLeafTex,alphaTest:0.9, side: THREE.DoubleSide});
  this.climbingPlantMaterial = new THREE.MeshLambertMaterial({color:0x47c46d});


  this.hangBillboardGeo = new THREE.PlaneGeometry(5,3,1,1);
  this.climbingBillboardGeo = new THREE.PlaneGeometry(2.6,3.8,1,1);
  this.grassBillboardGeo = new THREE.PlaneGeometry(2,4,1,1);

  this.init3D();
  this.initEvents();
}

var p = PanoView.prototype;

p.ready = function(){
  this.createEdgeFoliage();
  this.createPlants();
  this.createClimbingFoliages();
  this.render();

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

p.createPlants = function(){
  var totalPlants = 200;
  var created = false;
  for (var i = 0; i < totalPlants; i++) {
    var point = this.get3DPointFromUV(0.35 + 0.3*Math.random(),1/totalPlants*i);


    var reflectedPoint = point.clone();
    reflectedPoint.z *= -1;

    created = this.plotIn3D(reflectedPoint);

    if( created ) {
      this.plotOnTexture(point);
    }

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
  var divider = 32;
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

  this.renderer = isWebGL() ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
  this.renderer.autoClearColor = false;
  this.renderer.setClearColor(0xffffff,1);
  this.renderer.setSize( window.innerWidth, window.innerHeight );
  this.renderer.sortObjects = false;
  this.renderer.autoClear = false;
  //this.renderer.sortElements = true;

  this.composer = new WAGNER.Composer( this.renderer );
  this.vignettePass = new WAGNER.VignettePass();
  this.bloomPass = new WAGNER.MultiPassBloomPass();
  this.noisePass = new WAGNER.NoisePass();
  this.dirtPass = new WAGNER.DirtPass();

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
    transparent:true,
    lights: false
  }

  var maskMaterial = new THREE.ShaderMaterial(params);
  //maskMaterial.uniforms.map = new THREE.Texture();

  this.mesh = new THREE.Mesh(
    new THREE.SphereGeometry( 500, 60, 140 ),
    maskMaterial
  );

  //this.mesh.scale.z = -1;

  this.scene.add( this.mesh );

  this.light = new THREE.DirectionalLight(0xffffff,0.2);

  this.scene.add(this.light);

  this.scene.add( new THREE.AmbientLight(0x222222,0.4));

  this.plant

  //ground
  var mossTile = THREE.ImageUtils.loadTexture( 'assets/images/moss-tile.jpg' );
  mossTile.repeat.set(200,200);
  mossTile.wrapS = mossTile.wrapT = THREE.RepeatWrapping;
  mossTile.needsUpdate = true;

  this.ground = new THREE.Mesh( new THREE.PlaneGeometry(4000,4000,1,1), new THREE.MeshLambertMaterial({map:mossTile}));
  this.ground.rotation.x = Math.PI*-0.5;
  this.ground.position.y = -20;
  this.scene.add(this.ground);

  //tree
  var treeTex = THREE.ImageUtils.loadTexture( 'assets/images/tree.png' );
  var tree = new THREE.Mesh( new THREE.PlaneGeometry(12.5,15,1,1), new THREE.MeshBasicMaterial({map:treeTex,side: THREE.DoubleSide,transparent:true}));
  tree.position.set(30,0,5);
  tree.lookAt(this.camera.position.clone());
  this.scene.add(tree);

  //tree2
  var treeTex = THREE.ImageUtils.loadTexture( 'assets/images/tree2.png' );
  var tree = new THREE.Mesh( new THREE.PlaneGeometry(13,20,1,1), new THREE.MeshBasicMaterial({map:treeTex,side: THREE.DoubleSide,transparent:true}));
  tree.position.set(-20,0,0);
  tree.lookAt(this.camera.position.clone());
  this.scene.add(tree);

  this.controller.handleResize();

  $('#app')[0].appendChild( this.renderer.domElement );

  window.addEventListener('resize',this.onWindowResize.bind(this));
  this.onWindowResize();
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

p.plotIn3D = function( point, forceType ){

  var plant;

  //get info from normalmap and depthmap
  var pointData = this.getPointData(point);

  var distanceToCamera = pointData.distance;
  var pointInWorld = point.normalize().multiplyScalar(distanceToCamera);
  var normalInWorld = pointData.normal;

  var up = new THREE.Vector3(0,-1,0);

  if( pointData.distance > 140 ) {
    return;
  }

  if( forceType === 'climb' ) {

    plant = this.createClimbingPlant();

  }
  else if( normalInWorld.y < -0.7 || forceType === 'ground') {
    plant = this.createGrass({disableCracks:true});
    //plant.rotation.x = Math.PI*0.5;
    //make rotation
    /*var v = plant.position.clone();
    v.add( up );
    plant.lookAt(v);*/

  }
  else {
    plant = this.createWallPlant();

    //make rotation

    var v = plant.position.clone();
    v.add( normalInWorld );
    plant.lookAt(v);
  }

  //set position

  plant.position.copy(pointInWorld);

  this.scene.add(plant);

  return plant;

}

p.createWallPlant = function(){
  var plant = new THREE.Mesh(this.hangBillboardGeo, this.wallHangMaterial );

  return plant;
}

p.createGrass = function( opts ){

  var plant;

  if( opts.disableCracks ) {
    plant = new THREE.Object3D();
  }
  else {
    plant = new THREE.Mesh(this.markerGeo, this.markerMaterial);
  }
  plant.rotation.x = Math.PI*0.5;
  //grass billboard sprites
  for (var i = 0; i < 3; i++) {
    var billboard = new THREE.Mesh(this.grassBillboardGeo, this.grassMaterial );
    billboard.rotation.x = Math.PI*-0.5;
    billboard.rotation.y = Math.PI*Math.random();

    billboard.position.z =  -1;
    billboard.position.x = Math.random()*2-1;
    billboard.position.y = Math.random()*2-1;

    //billboard.scale.y = 2;
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
  //var line = new THREE.Line(geometry, material);

  var len = path.length;
  for ( i =  3; i < len; i+= Math.floor(Math.random()*3+2) ) {

    var plant = new THREE.Mesh( self.climbingBillboardGeo, self.climbingPlantLeafMaterial );
    plant.position.copy(path[i]);

    plant.rotation.z = Math.random();
    plant.rotation.y = Math.random();
    plant.scale.set(0.6,0.6,0.6);

    mesh.add(plant);
  }


  return mesh;
}

p.render = function(){

  this.renderer.autoClearColor = false;

  this.renderer.clear();
  this.composer.reset();

  this.mesh.visible = false;
  this.ground.visible = true;
  this.composer.render( this.scene, this.camera );

  this.composer.reset();
  this.renderer.clear(false, true, false );
  this.mesh.visible = true;
  this.ground.visible = false;

  this.composer.render( this.scene, this.camera );

  this.composer.pass( this.dirtPass );
  this.composer.pass( this.bloomPass );

  this.composer.toScreen();

  this.controller.update(0.1);
  this.time += 0.01;

  raf(this.render);
}

p.onWindowResize  = function() {

  var s = 1,
    w = window.innerWidth,
    h = window.innerHeight;

  this.renderer.setSize( s * w, s * h );
  this.composer.setSize( w, h );

}
