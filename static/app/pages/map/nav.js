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

  var geo = new THREE.ExtrudeGeometry(shape,{amount:0.2, bevelEnabled:true,bevelThickness:0.3,bevelSize:0.1});

  geo.applyMatrix(new THREE.Matrix4().makeTranslation(-4,-4,0));
  geo.applyMatrix(new THREE.Matrix4().makeScale(0.3,0.3,0.3));
  geo.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI*0.5));
  geo.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI));
  geo.applyMatrix(new THREE.Matrix4().makeTranslation(0,-2,3));

  var tex = THREE.ImageUtils.loadTexture( 'assets/images/concrete.jpg' );
  tex.repeat.x = tex.repeat.y = 0.1;
  var arrow = new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map: tex, wireframe:false,color:0x666666,ambient:0x333333}));

  //shadows
  shadowTex = THREE.ImageUtils.loadTexture( 'assets/images/arrow-shadow.png' );
  var shadow = new THREE.Mesh( new THREE.PlaneGeometry(3,3,1,1), new THREE.MeshBasicMaterial({map:shadowTex,transparent:true}));
  shadow.rotation.x = -Math.PI*0.5;
  shadow.rotation.z = Math.PI;
  shadow.position.y = -2.3;
  shadow.position.z = 3;

  arrow.shadow = shadow;
  arrow.add(shadow);

  for (var i = 0; i < 4; i++) {
    var newArrow = arrow.clone();
    newArrow.rotation.y = Math.PI/4*i*2;
    this.markers.push(newArrow);

    this.container.add(newArrow);


  };



}
