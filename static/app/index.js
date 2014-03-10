'use strict';

var Pano = require('streetview');

var self = {};
var _panoLoader = new GSVPANO.PanoLoader({zoom: 3});
var _depthLoader = new GSVPANO.PanoDepthLoader();

var defaultLatlng = new google.maps.LatLng(40.759101,-73.984406);
var currentPanoLocation = null;

var mouse2d = new google.maps.Point();
var pegmanTimeout;
var depthCanvas;
var normalCanvas;

var TALK_DEFAULT = 'Choose your location<br>and pick me up!';

var $map = $('#map');
var $intro = $('.js-intro');
var $message = $('.js-message');
var $introContent = $('.js-intro-content');
var $loadingLabel = $('.js-loading-label');

pegmanTalk(TALK_DEFAULT);

$('#backToMap').on('click', function(){

  pegmanTalk(TALK_DEFAULT);

  pano.fadeOut( function(){
    $map.fadeIn();
    $intro.fadeIn();
    $dragHideLayers.fadeIn();
    $pegman.removeClass('dragging');

  });

  TweenLite.set($pegman, {x:0,y:0});

})

$('#choice-default-1').on('click', function(){
  var to = new google.maps.LatLng(40.759101,-73.984406)
  _panoLoader.load(to);
  map.panTo( to );

  //addMarker( currentLocation );
})

$('#choice-default-2').on('click', function(){
  var to = new google.maps.LatLng(37.7914908,-122.3977816)
  _panoLoader.load(to);
  map.panTo( to );
})


$('#choice-default-3').on('click', function(){
  var to = new google.maps.LatLng(59.3346806,18.0621834)
  _panoLoader.load(to);
  map.panTo( to );
})


$('#choice-location').on('click', function(){
  navigator.geolocation.getCurrentPosition( geoSuccess, geoError );
})

$('.js-intro').removeClass('inactive');

var pano = new Pano();

$('.js-start-btn').on('click', function(){
  $('.js-intro').fadeOut();
  pano.start();
});

pano.on('panoLinkClicked', function(id,description){
  $loadingLabel.find('h1').html(description)

  $loadingLabel.removeClass('inactive');
  TweenMax.to($loadingLabel,1,{opacity:1});

  pano.fadeOut( function(){
    _panoLoader.loadId(id);
  });
})

var $pegman = $('#pegman');
var $pegmanCircle = $('.js-pegman-circle');

Draggable.create($pegman, {
  type:"x,y",
  edgeResistance:0.5,
  throwProps:true,
  bounds:window,
  onDragStart:onStartDragPegman,
  onDragEnd:onEndDragPegman
});

function pegmanTalk( msg, timeout ){
  $message.html(msg);

  TweenMax.fromTo($message,0.3,{x:0},{x:10,yoyo:true});

  if( timeout ) {
    if( pegmanTimeout ) {
      clearTimeout(pegmanTimeout);
    }
    pegmanTimeout = setTimeout(function(){
      pegmanTalk(TALK_DEFAULT)
    },timeout*1000)
  }
}

function onStartDragPegman(){

  $dragHideLayers.fadeOut()
  $pegman.addClass('dragging');

  pegmanTalk('Now drop me somewhere');
}

function onEndDragPegman( event ){

  streetViewLayer.setMap();

  var offset = $pegman.offset(),

  bounds = map.getBounds(),
  neLatlng = bounds.getNorthEast(),
  swLatlng = bounds.getSouthWest(),
  startLat = neLatlng.lat(),
  endLng = neLatlng.lng(),
  endLat = swLatlng.lat(),
  startLng = swLatlng.lng(),
  x = offset.left + 45,
  y = offset.top + 60

  var lat = startLat + ((y/window.innerHeight) * (endLat - startLat))
  var lng = startLng + ((x/window.innerWidth) * (endLng - startLng));


  $loadingLabel.find('h1').html("loading");

  $loadingLabel.removeClass('inactive');
  TweenMax.to($loadingLabel,1,{opacity:1});

  _panoLoader.load(new google.maps.LatLng(lat,lng));

  pegmanTalk('I hope there will be no snakes');

  setTimeout(function(){
    $map.fadeOut();
    $intro.fadeOut();
  },2000);

  //_panoLoader.load();
  //addMarker( new google.maps.LatLng(lat,lng) );


}


var $dragHideLayers = $('.js-drag-hide');

/*

var el = document.getElementById( 'myLocationButton' );
el.addEventListener( 'click', function( event ) {
  event.preventDefault();
  navigator.geolocation.getCurrentPosition( geoSuccess, geoError );
}, false );

  navigator.pointer = navigator.pointer || navigator.webkitPointer;

  function lockPointer () {
    if( navigator.pointer ) {
      navigator.pointer.lock( container, function() {
        console.log( 'Pointer locked' );
      }, function() {
        console.log( 'No pointer lock' );
      } );
    }
  }

  var el = document.getElementById( 'fullscreenButton' );
  if( el ) {
    el.addEventListener( 'click', function( e ) {
      container.onwebkitfullscreenchange = function(e) {
        lockPointer();
        container.onwebkitfullscreenchange = function() {
        };
      };
      container.onmozfullscreenchange = function(e) {
        lockPointer();
        container.onmozfullscreenchange = function() {
        };
      };
      if( container.webkitRequestFullScreen ) container.webkitRequestFullScreen();
      if( container.mozRequestFullScreen ) container.mozRequestFullScreen();
      e.preventDefault();
    }, false );
  }

  */


function geoSuccess( position ) {
  pegmanTalk('I can see you!',2)
  var currentLocation = new google.maps.LatLng( position.coords.latitude, position.coords.longitude );
  map.panTo( currentLocation );
  //addMarker( currentLocation ); // move to position (thanks @theCole!)

}

function geoError( message ) {
  pegmanTalk( "I can't see where you are" , 4 );
}

var marker;

var styleArray = [
  {"stylers": [
    { "visibility": "off" },
  ]},
  {
    "featureType": "landscape.man_made",
    "stylers": [
      { "visibility": "on" },
      { "hue": "#00ff11" },
      { "saturation": 53 },
      { "gamma": 0.26 },
      { "lightness": -75 }
    ]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      { "visibility": "simplified" },
      { color: "#065337" }
    ]
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [
      { color: "#126f4d" }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "stylers": [
      { "visibility": "simplified" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      { "visibility": "on" },
      { "color": "#033a26" }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [
      { "visibility": "on" },
      { "color": "#2f4d5f" }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry.fill",
    "stylers": [
      { "visibility": "on" },
      { "color": "#006943" }
    ]
  }
];

var myOptions = {
  zoom: 17,
  center: defaultLatlng,
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  tilt:45,
  disableDefaultUI:true,
  streetViewControl: false,
  styles: styleArray
}
var map = new google.maps.Map( document.getElementById( 'map' ), myOptions );

var streetViewLayer = new google.maps.StreetViewCoverageLayer();

google.maps.event.addListener(map, 'mousemove', function(event) {

/*
  var TILE_SIZE = 256;
  var proj = map.getProjection();
  var numTiles = 1 << map.getZoom();
  var worldCoordinate = proj.fromLatLngToPoint(event.latLng);

  var pixelCoordinate = new google.maps.Point(
          worldCoordinate.x * numTiles,
          worldCoordinate.y * numTiles);

  var tileCoordinate = new google.maps.Point(
      Math.floor(pixelCoordinate.x / TILE_SIZE),
      Math.floor(pixelCoordinate.y / TILE_SIZE));

  //console.log('TileX:' +tileCoordinate.x+' - TileY:'+tileCoordinate.y);
  //console.log(event.pixel.x + ', ' + event.pixel.y);

  var localPixel = new google.maps.Point(pixelCoordinate.x%256,pixelCoordinate.y%256);
*/
});

/*google.maps.event.addListener(map, 'click', function(event) {
  addMarker(event.latLng);
});*/

var geocoder = new google.maps.Geocoder();

var el = document.getElementById( 'searchButton' );
el.addEventListener( 'click', function( event ) {
  event.preventDefault();
  findAddress( document.getElementById("address").value );
}, false );


document.getElementById("address").focus();

function findAddress( address ) {

  //showMessage( 'Getting coordinates...' );

  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      pegmanTalk("Found the place, let's go!",3);
      //addMarker( results[0].geometry.location );
    } else {
      pegmanTalk("Could not find the location",5);
      //showProgress( false );
    }
  });
}


function addMarker(location) {
  if( marker ) marker.setMap( null );
  marker = new google.maps.Marker({
    position: location,
    map: map
  });
  marker.setMap( map );
  //_panoLoader.load( location );
}

//this.onResize = this.onResize.bind(this);
window.addEventListener('resize',onResize);

onResize();


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
  pano.start();

  if( !pano.isIntro ) {
    TweenMax.to($loadingLabel,1,{opacity:0});
  }

  pano.setLinks(self.links, self.centerHeading );

}



 //_panoLoader.load(new google.maps.LatLng(40.759101,-73.984406));
 //_panoLoader.load(new google.maps.LatLng(40.726786,-73.991728));

 //_panoLoader.load(new google.maps.LatLng(57.642814,18.296309));

 //_panoLoader.load(new google.maps.LatLng(40.736952,-73.99806));
 //_panoLoader.load(new google.maps.LatLng(40.759984,-73.972059));
 //_panoLoader.load(new google.maps.LatLng(40.760277,-73.983897));
 //_panoLoader.load(new google.maps.LatLng(40.759846, -73.984197));
 //_panoLoader.load(new google.maps.LatLng(59.334429,18.061984));
 //_panoLoader.load(new google.maps.LatLng(40.6849,-73.894615));
 //_panoLoader.load(new google.maps.LatLng(22.300546,114.17276));

 function onResize() {
  var w = window.innerWidth,
    h = window.innerHeight;

    //TweenMax.set($introContent,{y: h*.5 - $introContent.height()*.5 });

    pano.onResize(w,h);

 }

