var raf = require('raf');
var Emitter = require('emitter');
var Nav = require('./nav');
var detector = require('./utils/detector');

var DEG_TO_RAD = Math.PI/180;
var MAP_WIDTH = 512;
var MAP_HEIGHT = 256;

var imageFolder = 'http://s3.amazonaws.com/urbanjungle/images2/';
//var shaderPath = 'http://s3.amazonaws.com/urbanjungle/shaders/';
//var imageFolder = 'assets/images/'

module.exports = PanoView;

function PanoView(){

  THREE.ImageUtils.crossOrigin = "anonymous";

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
  var cracksTex = THREE.ImageUtils.loadTexture( imageFolder + 'cracks.png');

  this.grassBaseMaterial = new THREE.MeshLambertMaterial({ map: cracksTex,side: THREE.DoubleSide,alphaTest: 0.3, opacity:0.7,transparent:true});

  var grassMap = THREE.ImageUtils.loadTexture( imageFolder + 'grass_billboard.png' );
  this.grassMaterial = new THREE.MeshLambertMaterial( { map: grassMap, alphaTest: 0.8, side: THREE.DoubleSide } );

  var wallHangMap = THREE.ImageUtils.loadTexture( imageFolder + 'leafs.png' );
  this.wallHangMaterial = new THREE.MeshLambertMaterial( { map: wallHangMap, alphaTest:0.9, side: THREE.DoubleSide } );

  var climbingLeafTex = THREE.ImageUtils.loadTexture( imageFolder + 'climbing.png' );
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

  if(this.rafId) {
    raf.cancel( this.rafId);
  }

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

  var totalPlants = detector.isMobile?100:200;
  for (var i = 0; i < totalPlants; i++) {
    var point = this.get3DPointFromUV(0.35 + 0.3*Math.random(),1/totalPlants*i);

    var reflectedPoint = point.clone();
    reflectedPoint.z *= -1;

    created = this.plotIn3D(reflectedPoint);

    /*if( created ) {
      this.plotOnTexture(point);
    }*/

  };

  totalPlants = detector.isMobile?100:200;;
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
  var totalPlants = MAP_WIDTH/detector.isMobile?8:4;
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
  var divider = detector.isMobile?32:16;
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
  var mossTile = THREE.ImageUtils.loadTexture( imageFolder + 'moss-tile.jpg' );
  mossTile.repeat.set(200,200);
  mossTile.wrapS = mossTile.wrapT = THREE.RepeatWrapping;
  mossTile.needsUpdate = true;

  this.ground = new THREE.Mesh( new THREE.PlaneGeometry(4000,4000,1,1), new THREE.MeshLambertMaterial({map:mossTile,ambient:0x000000}));
  this.ground.rotation.x = Math.PI*-0.5;
  this.ground.position.y = -20;
  this.scene.add(this.ground);

  //tree
  var treeTex = THREE.ImageUtils.loadTexture( imageFolder + 'tree.png' );
  var tree = new THREE.Mesh( new THREE.PlaneGeometry(12.5,15,1,1), new THREE.MeshBasicMaterial({map:treeTex,side: THREE.DoubleSide,transparent:true}));
  tree.position.set(40,0,5);
  tree.lookAt(this.camera.position.clone());
  this.scene.add(tree);

  this.tree1 = tree;

  //tree2
  var treeTex = THREE.ImageUtils.loadTexture( imageFolder + 'tree2.png' );
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
  //this.container.addEventListener( 'touchcancel', this.onContainerTouchEnd, false );
  this.container.addEventListener( 'touchmove', this.onContainerTouchMove, false );
}

p.removeEvents = function(){
  this.container.removeEventListener( 'mousedown', this.onContainerMouseDown );
  this.container.removeEventListener( 'mousemove', this.onContainerMouseMove );
  this.container.removeEventListener( 'mouseup', this.onContainerMouseUp );
  this.container.removeEventListener( 'mousewheel', this.onContainerMouseWheel );

  this.container.removeEventListener( 'touchstart', this.onContainerTouchStart );
  this.container.removeEventListener( 'touchend', this.onContainerTouchEnd );
  //this.container.removeEventListener( 'touchcancel', this.onContainerTouchEnd );
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

  this.mouse2d.x = ( event.clientX / this.winSize.width ) * 2 - 1;
  this.mouse2d.y = - ( event.clientY / this.winSize.height ) * 2 + 1;

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
/*
  delta = Date.now()-lastTime;
  lastTime = Date.now();
  $('#debug').text( delta );
*/
}

p.onContainerMouseUp = function( event ) {
  this.isUserInteracting = false;

  if( Date.now()- this.isUserInteractingTime < 300 ) {
    this.onSceneClick(this.mouse2d.x,this.mouse2d.y);
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

    this.mouse2d.x = ( event.touches[0].pageX / this.winSize.width ) * 2 - 1;
    this.mouse2d.y = - ( event.touches[0].pageY / this.winSize.height ) * 2 + 1;

    this.onPointerDownLon = this.lon;
    this.onPointerDownLat = this.lat;

  }

}

p.onContainerTouchEnd = function( event ){

  //event.preventDefault();

  this.isUserInteracting = false;

  if( Date.now()- this.isUserInteractingTime  < 300 ) {
    this.onSceneClick(this.mouse2d.x,this.mouse2d.y);
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

p.onSceneClick = function(x,y){

  var vector = new THREE.Vector3(x, y, 0.5);
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
