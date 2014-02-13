varying vec4 mPosition;
uniform sampler2D texture0;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform float time;
varying vec2 vUv;

uniform vec3 diffuse;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

void main() {

  //diffuse
  vec3 diffuseTex0 = texture2D( texture0, vUv ).xyz;

  //normal
  vec3 diffuseTex1 = texture2D( texture1, vUv ).xyz;

  //depth
  vec3 diffuseTex2 = texture2D( texture2, vUv ).xyz;

  float thres = 1.0-step(0.1,diffuseTex1.b);

  vec3 waterColor = diffuseTex0;

  gl_FragColor = vec4( diffuseTex0,1.0);

  //float depth = gl_FragCoord.z / gl_FragCoord.w;
  //float fogFactor = smoothstep( fogNear, fogFar, depth );
  //gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );

}
