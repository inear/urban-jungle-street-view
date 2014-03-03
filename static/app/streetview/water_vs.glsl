// switch on high precision floats
varying vec4 mPosition;
varying vec2 vUv;
uniform float time;

void main() {

  mPosition = modelMatrix * vec4(position,1.0);

  vUv = uv;
  vec4 mvPosition = viewMatrix * mPosition;
  gl_Position = projectionMatrix * mvPosition;

}
