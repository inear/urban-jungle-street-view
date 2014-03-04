'use strict';

var Pano = require('streetview');

var self = {};
var _panoLoader = new GSVPANO.PanoLoader({zoom: 1});
var _depthLoader = new GSVPANO.PanoDepthLoader();

var currentPanoLocation = null;

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

  if( currentPanoLocation ) {
    var dist = google.maps.geometry.spherical.computeDistanceBetween(currentPanoLocation, this.panoLocation.latLng);
    console.log(dist);
  }

  currentPanoLocation = this.panoLocation.latLng;

};


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

  pano.setLinks(self.links, self.centerHeading );

}


 _panoLoader.setZoom(3);
 _panoLoader.load(new google.maps.LatLng(40.759101,-73.984406));
 //_panoLoader.load(new google.maps.LatLng(40.726786,-73.991728));

 //_panoLoader.load(new google.maps.LatLng(57.642814,18.296309));

 //_panoLoader.load(new google.maps.LatLng(40.736952,-73.99806));
 //_panoLoader.load(new google.maps.LatLng(40.759984,-73.972059));
 //_panoLoader.load(new google.maps.LatLng(40.760277,-73.983897));
 //_panoLoader.load(new google.maps.LatLng(40.759846, -73.984197));
 //_panoLoader.load(new google.maps.LatLng(59.334429,18.061984));
 //_panoLoader.load(new google.maps.LatLng(40.6849,-73.894615));


