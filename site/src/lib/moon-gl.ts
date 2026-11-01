/**
 * The moon, drawn with WebGL. Its surface (hills, seas, craters) is a small
 * image made ahead of time by scripts/bake-moon.mjs, so a phone only has to
 * light it. The light comes from the real sun-moon angle, so every phase and
 * terminator is geometrically correct.
 */

const QUAD_VS = `attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}`;

const SHADE_FS = `precision highp float;
varying vec2 v;
uniform sampler2D T;uniform float E,S,R,A;
const float PI=3.14159265;
const vec3 GLOW=vec3(.50,.44,1.);
void main(){vec2 q=v/R;float r=length(q);
float glow=.62*exp(-max(r-1.,0.)*5.2)*(1.-smoothstep(1.,1./R,r));
float a=1.-smoothstep(1.-A,1.,r);
if(a<=0.){gl_FragColor=vec4(GLOW*glow,glow);return;}
vec3 n=vec3(q,sqrt(max(1.-r*r,0.)));
const float c=.951,s=-.309;
vec3 m=vec3(c*n.x-s*n.y,s*n.x+c*n.y,n.z);
vec3 L=vec3(sin(E),0.,-cos(E));
vec2 uv=vec2((atan(m.x,m.z)+S)/(2.*PI)+.5,asin(clamp(m.y,-1.,1.))/PI+.5);
vec4 t=texture2D(T,uv);
float e=1./640.;
float hx=texture2D(T,uv+vec2(e,0.)).r-t.r,hy=texture2D(T,uv+vec2(0.,e)).r-t.r;
vec3 tang=normalize(vec3(m.z,0.,-m.x)+vec3(1e-4));vec3 bit=cross(m,tang);
vec3 N=normalize(m-(tang*hx+bit*hy)*5.4);
float d=dot(N,L);
float fine=t.r-texture2D(T,uv,3.5).r;
vec3 albedo=mix(vec3(1.,1.,1.),vec3(.76,.75,.97),t.b*.62)*(.9+.2*t.r+fine*2.1);
float lit=smoothstep(-.06,.26,d);
vec3 day=albedo*mix(vec3(.72,.71,.96),vec3(1.08),clamp(d*1.7,0.,1.));
vec3 night=mix(vec3(.17,.13,.52),vec3(.37,.32,.86),clamp(t.r*1.05-t.b*.22,0.,1.));
vec3 col=mix(night,day,lit);
col+=vec3(.62,.56,1.)*pow(1.-n.z,2.6)*(.26+.26*lit);
col=mix(GLOW*glow,col,a);
gl_FragColor=vec4(col,a+glow*(1.-a));}`;

function compile(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
  const program = gl.createProgram();
  for (const [type, source] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const shader = gl.createShader(type);
    if (!shader || !program) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
    gl.attachShader(program, shader);
  }
  if (!program) return null;
  gl.bindAttribLocation(program, 0, "p");
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

export type MoonRenderer = {
  resize(pixels: number): void;
  render(elongation: number, spin: number): void;
};

/**
 * `surface` is an equirectangular map: red is height, blue is the dark seas.
 * `radius` is the disc's share of the canvas half-width; the rest is glow.
 */
export function createMoonRenderer(canvas: HTMLCanvasElement, surface: HTMLImageElement, radius: number): MoonRenderer | null {
  // Without a real GPU, drawing this would freeze the page, so the SVG moon stays.
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return null;

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const shade = compile(gl, QUAD_VS, SHADE_FS);
  if (!shade) return null;

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, surface);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.useProgram(shade);
  const uE = gl.getUniformLocation(shade, "E");
  const uS = gl.getUniformLocation(shade, "S");
  const uA = gl.getUniformLocation(shade, "A");
  gl.uniform1f(gl.getUniformLocation(shade, "R"), radius);
  gl.uniform1i(gl.getUniformLocation(shade, "T"), 0);

  return {
    resize(pixels) {
      canvas.width = canvas.height = pixels;
      gl.viewport(0, 0, pixels, pixels);
      gl.uniform1f(uA, 4 / (pixels * radius));
    },
    render(elongation, spin) {
      gl.uniform1f(uE, (elongation * Math.PI) / 180);
      gl.uniform1f(uS, spin);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}
