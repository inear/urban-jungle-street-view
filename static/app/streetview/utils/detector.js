'use strict';

var $html = $('html');
var ua = navigator.userAgent;

function _modernizr(feature) {
  return $html.hasClass(feature);
}

/*
 * CONST
 */

var TYPE_MOBILE = 1;
var TYPE_TOUCH = 2;
var TYPE_DESKTOP = 3;

var TABLET_BREAKPOINT = { width: 645, height: 645 };

/**
 * Detect if the device is a touch device or not.
 *
 * @return {Boolean}
 * @public
 */

var isTouchDevice = !!('ontouchstart' in window) || !!('onmsgesturechange' in window);

/**
 * Detect if it's a mobile/tablet.
 *
 * @return {Boolean}
 * @public
 */

var isMobile = (/android|webos|ip(hone|ad|od)|blackberry|iemobile|windows (ce|phone)|opera mini/i).test(ua.toLowerCase());
var isTablet = isMobile && (window.innerWidth > TABLET_BREAKPOINT.width || window.innerHeight > TABLET_BREAKPOINT.height);


/**
 * Returns the type of the device (TYPE_MOBILE, TYPE_TOUCH, TYPE_DESKTOP).
 *
 * @return {Int} see const (TYPE_MOBILE, TYPE_TOUCH, TYPE_DESKTOP).
 * @public
 */


var getType = (function() {
  if (isMobile) {
    return TYPE_MOBILE;
  }

  if (isTouchDevice) {
    return TYPE_TOUCH;
  }

  return TYPE_DESKTOP;
}());

/**
 * Use modernizr to detect if the "browser" support WebGL.
 * @return {Boolean}
 * @public
 */

var webgl = (function() {
  try {
    return !!window.WebGLRenderingContext && (!!document.createElement('canvas').getContext('experimental-webgl') || !!document.createElement('canvas').getContext('webgl'));
  } catch(e) {
      return false;
  }
}());


/**
 * Detect if we support this browser or not.
 * @return {Boolean}
 * @public
 */

var isBrowserSupported = _modernizr('canvas') && _modernizr('csstransforms') && _modernizr('csstransforms3d') && _modernizr('svg');

var isRetina = window.devicePixelRatio >= 2;

var isNexusPhone = (/nexus\s4|galaxy\snexus/i).test(ua);
var isNexusTablet = (/nexus\s7|nexus\s10/i).test(ua);

var isMozilla = !!~ua.indexOf('Gecko') && !~ua.indexOf('KHTML');
var isIE = (/MSIE (\d+\.\d+);/).test(ua);
var isiOS = (/ip(hone|ad|od)/i).test(ua);

// Quick fix for ipad.
// Use the same layout/perf optimisation as the mobile version
if (isiOS) {
  isMobile = true;
  isTablet = false;
}


var hasPointerEvents = (function() {
  if(navigator.appName == 'Microsoft Internet Explorer')
  {
      var agent = navigator.userAgent;
      if (agent.match(/MSIE ([0-9]{1,}[\.0-9]{0,})/) != null){
          var version = parseFloat( RegExp.$1 );
          if(version < 11)
            return false;
      }
  }
  return true;
}());


/**
 * Expose data.
 */

module.exports = {
  TYPE_MOBILE: TYPE_MOBILE,
  TYPE_TOUCH: TYPE_TOUCH,
  TYPE_DESKTOP: TYPE_DESKTOP,

  isBrowserSupported: isBrowserSupported,
  isTouchDevice: isTouchDevice,
  isMobile: isMobile,
  isTablet: isTablet,
  isDesktop: !isMobile && !isTablet,
  isRetina: isRetina,
  getType: getType,
  webgl: webgl,
  hasPointerEvents: hasPointerEvents,

  isNexusPhone: isNexusPhone,
  isNexusTablet: isNexusTablet,
  isMozilla: isMozilla,
  isIE: isIE,
  isiOS: isiOS,
};
