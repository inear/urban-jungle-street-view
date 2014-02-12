'use strict';


function init() {
  var _panoLoader = new GSVPANO.PanoLoader({zoom: 1});
  var _depthLoader = new GSVPANO.PanoDepthLoader();

  _depthLoader.onDepthLoad = function() {
    var x, y, canvas, context, image, w, h, c;
    
    canvas = document.createElement("canvas");
    context = canvas.getContext('2d');

    w = this.depthMap.width;
    h = this.depthMap.height;

    canvas.setAttribute('width', w);
    canvas.setAttribute('height', h);
    
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

    document.body.appendChild(canvas);
  }

  _panoLoader.onPanoramaLoad = function() {
    document.body.appendChild(this.canvas);
    _depthLoader.load(this.panoId);
  };

  _panoLoader.load(new google.maps.LatLng(42.345601, -71.098348));
}

init();