module.exports = Nav;

var imageFolder = 'http://s3.amazonaws.com/urbanjungle/images2/'

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

  var tex = THREE.ImageUtils.loadTexture( imageFolder + 'concrete.jpg' );
  tex.repeat.x = tex.repeat.y = 0.1;

  markerGeo = new THREE.SphereGeometry(2,6,6);
  markerGeo.applyMatrix(new THREE.Matrix4().makeTranslation(0,-2,5));

  var marker = new THREE.Mesh( markerGeo, new THREE.MeshBasicMaterial({color:0xff0000,visible:false}));
  var arrow = new THREE.Mesh( arrowGeo,new THREE.MeshLambertMaterial({map: tex, wireframe:false,color:0x666666,ambient:0x333333}));
  arrow.name = 'arrow';
  //shadows
  shadowTex = THREE.ImageUtils.loadTexture( imageFolder + 'arrow-shadow.png' );
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
