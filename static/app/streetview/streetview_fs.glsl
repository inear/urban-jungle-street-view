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

  //normal
  vec3 diffuseTex1 = texture2D( texture1, vUv ).xyz;
  vec3 normalizedNormal = normalize(diffuseTex1);
  float DiffuseTerm = 1.0 - clamp(max(0.0, dot(normalizedNormal, vec3(0.0,1.0,0.0))), 0.0, 1.0);
  DiffuseTerm = 1.0 - step(DiffuseTerm,0.97);


  //depth
  vec3 diffuseTex2 = texture2D( texture2, vUv ).xyz;

  //diffuse
  vec3 diffuseTex0 = texture2D( texture0, vUv ).xyz;
  float grey = 1.0-(diffuseTex0.r + diffuseTex0.g + diffuseTex0.b)/3.0;
  //vec3 finalDiffuse = mix(diffuseTex0*vec3(0.8,0.9,0.8),vec3(0.8,0.9,0.8),diffuseTex2*diffuseTex2*0.1);
  vec3 finalDiffuse = diffuseTex0*vec3(0.8,0.9,0.8);



  float thres = 1.0-step(0.1,diffuseTex1.b);
  //vec4(diffuseTex1,1.0);
  gl_FragColor = vec4( finalDiffuse,1.0-DiffuseTerm*(1.0-diffuseTex2.x));


  //float depth = gl_FragCoord.z / gl_FragCoord.w;
  //float fogFactor = smoothstep( fogNear, fogFar, depth );
  //gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );

}
