// Bakes the moon's surface into src/engine/moon-surface.webp, using headless Chrome.
// Run it only to change how the moon looks:  npm run bake-moon
//
// Height goes in red and green, and the dark seas in blue, on a seamless
// 1024x512 map. WebP keeps brightness sharp and blurs colour, so this keeps the
// fine craters crisp while the broad seas lose nothing. It is made ahead of
// time because generating it on a phone would stall the page.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const SURFACE_FS = `precision highp float;
varying vec2 v;
const float PI=3.14159265;
float hash(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
vec3 hash3(vec3 p){return vec3(hash(p),hash(p+17.1),hash(p+41.3));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+7.1;a*=.5;}return s;}
float craters(vec3 p,float scale,float seed){p*=scale;vec3 id=floor(p),f=fract(p);float h=0.;
for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)for(int z=-1;z<=1;z++){
vec3 c=vec3(float(x),float(y),float(z));vec3 r=hash3(id+c+seed);
if(r.z>.42)continue;
vec3 o=c+r-f;float rad=.12+.3*r.x*r.x;float d=length(o)/rad;
if(d<1.7){h+=(-smoothstep(1.,.15,d)*.75+exp(-pow((d-1.)*3.2,2.))*.42)*rad*1.6;}}
return h;}
void main(){float lon=v.x*PI,lat=v.y*PI*.5;
vec3 p=vec3(cos(lat)*sin(lon),sin(lat),cos(lat)*cos(lon));
float seas=smoothstep(.49,.6,fbm(p*1.35+vec3(3.1,1.2,7.7)));
float h=.5+(fbm(p*4.)-.5)*.55+(fbm(p*15.)-.5)*.2;
float c=craters(p,3.,1.)+craters(p,7.,5.)*.6+craters(p,15.,9.)*.32;
h+=c*mix(1.,.35,seas);
h=clamp(h,0.,1.);gl_FragColor=vec4(h,h,seas,1.);}`;

const page = `<!doctype html><canvas id="c" width="1024" height="512"></canvas><script>
const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, alpha: false });
const shader = (type, source) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  return s;
};
const program = gl.createProgram();
gl.attachShader(program, shader(gl.VERTEX_SHADER, "attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}"));
gl.attachShader(program, shader(gl.FRAGMENT_SHADER, ${JSON.stringify(SURFACE_FS)}));
gl.bindAttribLocation(program, 0, "p");
gl.linkProgram(program);
gl.useProgram(program);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
document.body.textContent = canvas.toDataURL("image/webp", 0.9);
</script>`;

const file = join(mkdtempSync(join(tmpdir(), "moon-")), "bake.html");
writeFileSync(file, page);
const dom = execFileSync(
  chrome,
  ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--virtual-time-budget=30000", "--dump-dom", pathToFileURL(file).href],
  { encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] },
);
const data = dom.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/)?.[1];
if (!data) throw new Error("Chrome did not produce a surface");
const out = join(site, "src/engine/moon-surface.webp");
writeFileSync(out, Buffer.from(data, "base64"));
console.log(`wrote ${out}: ${Math.round((data.length * 0.75) / 1024)} KB`);
