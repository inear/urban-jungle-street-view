'use strict';

var Pano = require('streetview');

var self = {};
var _panoLoader = new GSVPANO.PanoLoader({zoom: 1});
var _depthLoader = new GSVPANO.PanoDepthLoader();

var depthCanvas;
var normalCanvas;

var pano = new Pano();

pano.on('panoLinkClicked', function(id){
  _panoLoader.loadId(id);
})


_panoLoader.onPanoramaLoad = function() {

  pano.setPano(this.canvas);

  _depthLoader.load(this.panoId);
  self.centerHeading = this.centerHeading;
  self.links = this.links;


};


_depthLoader.onDepthLoad = function() {
  var x, y, context, image, w, h, c,pointer;

  if( !depthCanvas ) {
    depthCanvas = document.createElement("canvas");
  }

  context = depthCanvas.getContext('2d');

  w = this.depthMap.width;
  h = this.depthMap.height;

  depthCanvas.setAttribute('width', w);
  depthCanvas.setAttribute('height', h);

  image = context.getImageData(0, 0, w, h);

  for(y=0; y<h; ++y) {
    for(x=0; x<w; ++x) {
      c = this.depthMap.depthMap[y*w + x] / 50 * 255;
      image.data[4*(y*w + x)    ] = c;
      image.data[4*(y*w + x) + 1] = c;
      image.data[4*(y*w + x) + 2] = c;
      image.data[4*(y*w + x) + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);

  //document.body.appendChild(panoCanvas);
  pano.setDepthData(this.depthMap.depthMap);
  pano.setDepthMap(depthCanvas);

  if( !normalCanvas ) {
    normalCanvas = document.createElement("canvas");
    //document.body.appendChild(normalCanvas);
  }

  context = normalCanvas.getContext('2d');

  w = this.depthMap.width;
  h = this.depthMap.height;

  normalCanvas.setAttribute('width', w);
  normalCanvas.setAttribute('height', h);

  image = context.getImageData(0, 0, w, h);
  pointer = 0;

  var pixelIndex;

  for(y=0; y<h; ++y) {
    for(x=0; x<w; ++x) {
      pointer += 3;
      pixelIndex = (y*w + (w-x))*4;
      image.data[ pixelIndex ] = (this.normalMap.normalMap[pointer]+1)/2 * 255;
      image.data[pixelIndex + 1] = (this.normalMap.normalMap[pointer+1]+1)/2 * 255;
      image.data[pixelIndex + 2] = (this.normalMap.normalMap[pointer+2]+1)/2 * 255;
      image.data[pixelIndex + 3] = 255;
    }
  }

  pano.setNormalData(this.normalMap.normalMap);

  context.putImageData(image, 0, 0);



  pano.setNormalMap(normalCanvas);

  pano.generateNature();

  pano.setLinks(self.links, self.centerHeading );

}


 _panoLoader.setZoom(2);
 //_panoLoader.load(new google.maps.LatLng(40.759101,-73.984406));
 //_panoLoader.load(new google.maps.LatLng(40.726786,-73.991728));

 //_panoLoader.load(new google.maps.LatLng(57.642814,18.296309));

 _panoLoader.load(new google.maps.LatLng(40.736952,-73.99806));
 //_panoLoader.load(new google.maps.LatLng(40.759984,-73.972059));
 //_panoLoader.load(new google.maps.LatLng(40.760277,-73.983897));
 //_panoLoader.load(new google.maps.LatLng(40.759846, -73.984197));
 //_panoLoader.load(new google.maps.LatLng(59.334429,18.061984));
 //_panoLoader.load(new google.maps.LatLng(40.6849,-73.894615));


