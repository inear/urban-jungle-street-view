var GSVPANO = GSVPANO || {};
GSVPANO.PanoDepthLoader = function(parameters) {

  'use strict';

  var _parameters = parameters || {},
    onDepthLoad = null;

  this.load = function(panoId) {
    var self = this,
      url;

    url = "http://maps.google.com/cbk?output=json&cb_client=maps_sv&v=4&dm=1&pm=1&ph=1&hl=en&panoid=" + panoId;

    $.ajax({
      url: url,
      dataType: 'jsonp'
    })
      .done(function(data, textStatus, xhr) {
        var decoded, buffers;

        try {
          decoded = self.decode(data.model.depth_map);
          buffers = self.parse(decoded);
        } catch (e) {
          console.error("Error loading depth map for pano " + panoId + "\n" + e.message + "\nAt " + e.filename + "(" + e.lineNumber + ")");
          //buffers = self.createEmptyDepthMap();
          if (self.onDepthError) {
            self.onDepthError();
            return;
          }
        }

        self.buffers = buffers;

        if (self.onDepthLoad) {
          self.onDepthLoad(buffers);
        }
      })
      .fail(function(xhr, textStatus, errorThrown) {
        console.error("Request failed: " + url + "\n" + textStatus + "\n" + errorThrown);
        /*var buffers = self.createEmptyDepthMap();
        if (self.onDepthLoad) {
          self.buffers = buffers;
          self.onDepthLoad(buffers);
        }*/

        if (self.onDepthError) {
          self.onDepthError();
          return;
        }

      })
  }

  this.decode = function(rawDepthMap) {
    var self = this,
      i,
      compressedDepthMapData,
      depthMap,
      decompressedDepthMap;

    // Append '=' in order to make the length of the array a multiple of 4
    while (rawDepthMap.length % 4 != 0)
      rawDepthMap += '=';

    // Replace '-' by '+' and '_' by '/'
    rawDepthMap = rawDepthMap.replace(/-/g, '+');
    rawDepthMap = rawDepthMap.replace(/_/g, '/');

    // Decode and decompress data
    compressedDepthMapData = $.base64.decode(rawDepthMap);
    decompressedDepthMap = zpipe.inflate(compressedDepthMapData);

    // Convert output of decompressor to Uint8Array
    depthMap = new Uint8Array(decompressedDepthMap.length);
    for (i = 0; i < decompressedDepthMap.length; ++i)
      depthMap[i] = decompressedDepthMap.charCodeAt(i);
    return depthMap;
  }

  this.parseHeader = function(depthMap) {
    return {
      headerSize: depthMap.getUint8(0),
      numberOfPlanes: depthMap.getUint16(1, true),
      width: depthMap.getUint16(3, true),
      height: depthMap.getUint16(5, true),
      offset: depthMap.getUint16(7, true)
    };
  }

  this.parsePlanes = function(header, depthMap) {
    var planes = [],
      indices = [],
      i,
      n = [0, 0, 0],
      d,
      byteOffset;

    for (i = 0; i < header.width * header.height; ++i) {
      indices.push(depthMap.getUint8(header.offset + i));
    }

    for (i = 0; i < header.numberOfPlanes; ++i) {
      byteOffset = header.offset + header.width * header.height + i * 4 * 4;
      n[0] = depthMap.getFloat32(byteOffset, true);
      n[1] = depthMap.getFloat32(byteOffset + 4, true);
      n[2] = depthMap.getFloat32(byteOffset + 8, true);
      d = depthMap.getFloat32(byteOffset + 12, true);
      planes.push({
        n: n.slice(0),
        d: d
      });
    }

    return {
      planes: planes,
      indices: indices
    };
  }

  this.computeBuffers = function(header, indices, planes) {

    var depthMap = null,
      normalMap = null,
      normalPointer = 0,
      x, y,
      planeIdx,
      phi, theta,
      v = [0, 0, 0],
      w = header.width,
      h = header.height,
      plane, t, p;

    depthMap = new Float32Array(w * h);
    normalMap = new Float32Array(w * h * 3);

    for (y = 0; y < h; ++y) {
      for (x = 0; x < w; ++x) {
        planeIdx = indices[y * w + x];

        phi = (w - x - 1) / (w - 1) * 2 * Math.PI + Math.PI / 2;
        theta = (h - y - 1) / (h - 1) * Math.PI;

        v[0] = Math.sin(theta) * Math.cos(phi);
        v[1] = Math.sin(theta) * Math.sin(phi);
        v[2] = Math.cos(theta);

        if (planeIdx > 0) {
          plane = planes[planeIdx];

          t = plane.d / (v[0] * plane.n[0] + v[1] * plane.n[1] + v[2] * plane.n[2]);
          v[0] *= t;
          v[1] *= t;
          v[2] *= t;
          depthMap[y * w + (w - x - 1)] = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

          normalMap[normalPointer] = plane.n[1];
          normalMap[normalPointer + 1] = plane.n[2];
          normalMap[normalPointer + 2] = plane.n[0];

        } else {
          depthMap[y * w + (w - x - 1)] = 9999999999999999999.;

          normalMap[normalPointer] = 0;
          normalMap[normalPointer + 1] = 0;
          normalMap[normalPointer + 2] = 0;
        }

        normalPointer += 3;
      }
    }

    return {
      width: w,
      height: h,
      depthMap: depthMap,
      normalMap: normalMap
    };
  }

  this.parse = function(decodedDepthMap) {

    var depthMapData = new DataView(decodedDepthMap.buffer);
    var header = this.parseHeader(depthMapData);
    var data = this.parsePlanes(header, depthMapData);

    return this.computeBuffers(header, data.indices, data.planes);
  }

  this.createEmptyDepthMap = function() {
    var W = 512 * 2;
    var H = 256 * 2;

    var buffers = {
      width: W,
      height: H,
      depthMap: new Float32Array(W * H),
      normalMap: new Float32Array(W * H * 3)

    };

    for (var i = 0; i < W * H; ++i) {
      buffers.depthMap[i] = 9999999999999999999.;
    }

    for (var i = 0; i < W * H * 3; ++i) {
      buffers.normalMap[i] = 0;
    }
    return buffers;
  }
};
