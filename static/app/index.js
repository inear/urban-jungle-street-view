'use strict';
var detector = require('./streetview/utils/detector');
var Pano = require('streetview');

var self = {};
var _panoLoader = new GSVPANO.PanoLoader({zoom: 3});
var _depthLoader = new GSVPANO.PanoDepthLoader();

var defaultLatlng = new google.maps.LatLng(40.759101,-73.984406);
var currentPanoLocation = null;
var draggingInstance;
var mouse2d = new google.maps.Point();
var pegmanTimeout;
var depthCanvas;
var normalCanvas;

var TALK_DEFAULT = 'Choose your location, pan around, and then pick me up!';

var $streetview = $('.streetview');
var $pegman = $('#pegman');
var $pegmanCircle = $('.js-pegman-circle');
var $map = $('#map');
var $intro = $('.js-intro');
var $message = $('.js-message');
var $introContent = $('.js-intro-content');
var $loadingLabel = $('.js-loading-label');
var $dragHideLayers = $('.js-drag-hide');
var $streetviewTile = $('.js-streetview-layer-tile');

var streetviewCanvas = document.createElement('canvas');
var streetViewTileData;
streetviewCanvas.className = 'streetview-layer-tile-canvas';
streetviewCanvas.width = 256;
streetviewCanvas.height = 256;
//document.body.appendChild(streetviewCanvas);

var streetviewTileImg = document.createElement('img');
streetviewTileImg.addEventListener('load',drawStreetViewTileToCanvas.bind(this));

if( !detector.webgl ) {
  location.href='nosupport.html';
  return;
}

var pano = new Pano();

pegmanTalk(TALK_DEFAULT);

$('#backToMap').on('click touchstart', function(){

  pegmanTalk(TALK_DEFAULT);

  backToMap();

})

$('#choice-default-1').on('click', function( event ){
  event.preventDefault();
  var to = new google.maps.LatLng(40.759101,-73.984406)
  map.panTo( to );
})

$('#choice-default-2').on('click', function(){
  event.preventDefault();
  var to = new google.maps.LatLng(37.7914908,-122.3977816)
  map.panTo( to );
})


$('#choice-default-3').on('click', function(){
  event.preventDefault();
  var to = new google.maps.LatLng(59.3346806,18.0621834)
  map.panTo( to );
})


$('#choice-location').on('click', function(){
  event.preventDefault();
  navigator.geolocation.getCurrentPosition( geoSuccess, geoError );
})

$('.js-more-info').on('click', function(){
  $('#info').show();
})

$('.js-close-info').on('click', function(){
  $('#info').hide();
})

$('.js-intro').removeClass('inactive');

pano.on('panoLinkClicked', function(id,description){

  $loadingLabel.find('h1').html(description)

  $loadingLabel.removeClass('inactive');
  TweenMax.to($loadingLabel,1,{opacity:1});

  pano.fadeOut( function(){
    _panoLoader.loadId(id);
  });
})

function backToMap() {

  if( pano.isRunning ) {
    pano.once('transitionOutComplete', function(){
      showMap();
    });
    pano.transitionOut();

    TweenLite.set($pegman, {x:0,y:0});
  }
  else {
    showMap();
  }

  function showMap() {
    $streetview.addClass('inactive');
    draggingInstance.enable();
    $map.fadeIn();
    $intro.fadeIn();
    $dragHideLayers.fadeIn();
    $pegman.removeClass('dragging');
    $pegman.removeClass('over-road');
  }

}

draggingInstance = Draggable.create($pegman, {
  type:"x,y",
  edgeResistance:0.5,
  throwProps:true,
  bounds:window,
  onDragStart:onStartDragPegman,
  onDragEnd:onEndDragPegman,
  onDrag:onDragPegman
})[0];


function onDragPegman(event) {

  var offset = $pegman.offset(),
  bounds = map.getBounds(),
  neLatlng = bounds.getNorthEast(),
  swLatlng = bounds.getSouthWest(),
  startLat = neLatlng.lat(),
  endLng = neLatlng.lng(),
  endLat = swLatlng.lat(),
  startLng = swLatlng.lng(),
  x = offset.left + 50,
  y = offset.top + 50

  var lat = startLat + ((y/window.innerHeight) * (endLat - startLat))
  var lng = startLng + ((x/window.innerWidth) * (endLng - startLng));

  var TILE_SIZE = 256;
  var proj = map.getProjection();
  var numTiles = 1 << map.getZoom();
  var worldCoordinate = proj.fromLatLngToPoint( new google.maps.LatLng(lat,lng));

  var pixelCoordinate = new google.maps.Point(
    worldCoordinate.x * numTiles,
    worldCoordinate.y * numTiles);

  var tileCoordinate = new google.maps.Point(
    Math.floor(pixelCoordinate.x / TILE_SIZE),
    Math.floor(pixelCoordinate.y / TILE_SIZE));

  //console.log('TileX:' +tileCoordinate.x+' - TileY:'+tileCoordinate.y);

  var localPixel = new google.maps.Point(pixelCoordinate.x%256,pixelCoordinate.y%256);

  var tileUrl = 'https://mts1.googleapis.com/vt?hl=sv-SE&lyrs=svv|cb_client:apiv3&style=40,18&x='+tileCoordinate.x+'&y='+tileCoordinate.y+'&z=' + map.getZoom();

  if( streetviewTileImg.src !== tileUrl ){
    streetviewTileImg.crossOrigin = '';
    streetviewTileImg.src = tileUrl;

  }
  else {
    if(streetViewTileData && streetViewTileData.length > 0) {
      //get pixel
      var index = (Math.floor(localPixel.y) * 256 + Math.floor(localPixel.x)) * 4;
      var trans = streetViewTileData[index];
      var blue = streetViewTileData[index-1]
      var validColor = false;

      if( trans > 0 && blue === 132 ) {
        validColor = true;
      }
      if( validColor && !$pegman.hasClass('over-road')) {
        $pegman.addClass('over-road');
      }
      else if( !validColor && $pegman.hasClass('over-road')){
        $pegman.removeClass('over-road');
      }
    }
  }
}

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

  streetViewLayer.setMap(map);

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

  pegmanTalk('I hope there will be no snakes');

  _panoLoader.load(new google.maps.LatLng(lat,lng));

  draggingInstance.disable();

}

function drawStreetViewTileToCanvas(){
  streetviewCanvas.width = streetviewCanvas.width;
  var ctx = streetviewCanvas.getContext('2d');

  ctx.drawImage(streetviewTileImg,0,0,256,256);
  streetViewTileData = ctx.getImageData(0, 0, 256, 256).data;
}



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

var geocoder = new google.maps.Geocoder();

var el = document.getElementById( 'searchButton' );
el.addEventListener( 'click', function( event ) {
  event.preventDefault();
  findAddress( document.getElementById("address").value );
}, false );


//document.getElementById("address").focus();

function findAddress( address ) {

  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      pegmanTalk("Found the place, let's go!",3);
    } else {
      pegmanTalk("Could not find the location",5);
      //showProgress( false );
    }
  });
}




_panoLoader.onPanoramaLoad = function() {

  pano.setPano(this.canvas);

  _depthLoader.load(this.panoId);
  self.centerHeading = this.centerHeading;
  self.links = this.links;

  if( currentPanoLocation ) {
    var dist = google.maps.geometry.spherical.computeDistanceBetween(currentPanoLocation, this.panoLocation.latLng);

  }

  currentPanoLocation = this.panoLocation.latLng;

};

_panoLoader.onNoPanoramaData = function(){
  pegmanTalk("Snakes! Can't go there. Try another spot",4);
  backToMap();
}

_depthLoader.onDepthError = function() {
  pegmanTalk("Snakes! Can't go there. Try another spot",4);

  backToMap();
}

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
  $streetview.removeClass('inactive');

  if( !pano.isIntro ) {
    TweenMax.to($loadingLabel,1,{opacity:0});
  }

  $loadingLabel.removeClass('inactive');
  TweenMax.to($loadingLabel,1,{opacity:1});

  $map.fadeOut();
  $intro.fadeOut();
  TweenMax.to($loadingLabel,1,{opacity:0});

  pano.setLinks(self.links, self.centerHeading );

}

window.addEventListener('resize',onResize);
onResize();

 function onResize() {
  var w = window.innerWidth,
    h = window.innerHeight;

    //TweenMax.set($introContent,{y: h*.5 - $introContent.height()*.5 });

    pano.onResize(w,h);

 }


