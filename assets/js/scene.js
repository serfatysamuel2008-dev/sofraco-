// SOFRACO — WebGL hero: a glass prism splitting a beam of white light into a spectrum.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const canvas = document.getElementById('gl');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (e) {
  window.__sceneReady = true;
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x050506, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0, 12);

// Environment for reflections / refraction
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const world = new THREE.Group();
scene.add(world);

/* ---------------- Beams (behind the prism so transmission refracts them) ---------------- */
const beamVert = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;
const beamFrag = /* glsl */`
  uniform vec3 uColor; uniform float uIntensity; uniform float uTime; uniform float uFadeIn; uniform float uFadeOut; uniform float uSeed;
  varying vec2 vUv;
  void main(){
    float across = 1.0 - abs(vUv.y - 0.5) * 2.0;
    float core = pow(across, 6.0) * 1.6 + pow(across, 2.0) * 0.35;
    float along = smoothstep(0.0, uFadeIn, vUv.x) * (1.0 - smoothstep(1.0 - uFadeOut, 1.0, vUv.x));
    float flicker = 0.88 + 0.12 * sin(uTime * 3.0 + vUv.x * 18.0 + uSeed * 7.0);
    float a = core * along * flicker * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;
function makeBeam({ color = 0xffffff, length = 10, width = 0.2, intensity = 1, fadeIn = 0.3, fadeOut = 0.3, seed = 0 }) {
  const geo = new THREE.PlaneGeometry(length, width);
  geo.translate(length / 2, 0, 0); // origin at beam start
  const mat = new THREE.ShaderMaterial({
    vertexShader: beamVert, fragmentShader: beamFrag,
    uniforms: {
      uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity }, uTime: { value: 0 },
      uFadeIn: { value: fadeIn }, uFadeOut: { value: fadeOut }, uSeed: { value: seed },
    },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

const beams = new THREE.Group();
world.add(beams);

// Incoming white beam (top-left → prism)
const IN_FROM = new THREE.Vector2(-13.2, 5.2), IN_TO = new THREE.Vector2(-0.7, 0.4);
const inLen = IN_FROM.distanceTo(IN_TO);
const inBeam = makeBeam({ length: inLen, width: 0.16, intensity: 1.4, fadeIn: 0.5, fadeOut: 0.02 });
inBeam.position.set(IN_FROM.x, IN_FROM.y, -0.4);
inBeam.rotation.z = Math.atan2(IN_TO.y - IN_FROM.y, IN_TO.x - IN_FROM.x);
beams.add(inBeam);
const inHalo = makeBeam({ length: inLen, width: 1.1, intensity: 0.22, fadeIn: 0.5, fadeOut: 0.05, seed: 3 });
inHalo.position.copy(inBeam.position); inHalo.rotation.z = inBeam.rotation.z;
beams.add(inHalo);

// Outgoing spectrum fan
const spectrum = [0xff2a2a, 0xff8a1f, 0xffe14d, 0x3dff9a, 0x2fb4ff, 0x5a5bff, 0xc04dff];
const outBeams = [];
spectrum.forEach((c, i) => {
  const b = makeBeam({ color: c, length: 16, width: 0.34, intensity: 0.9, fadeIn: 0.04, fadeOut: 0.55, seed: i });
  b.position.set(0.7, 0.3, -0.3);
  b.userData.base = -0.42 - i * 0.055;
  b.rotation.z = b.userData.base;
  beams.add(b); outBeams.push(b);
});
const outGlow = makeBeam({ color: 0xffffff, length: 16, width: 2.4, intensity: 0.08, fadeIn: 0.04, fadeOut: 0.7, seed: 9 });
outGlow.position.set(0.7, 0.3, -0.35); outGlow.rotation.z = -0.58;
beams.add(outGlow);

// Glow sprite at entry point
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.2, 'rgba(255,255,255,.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const glowTex = glowTexture();
const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .9 }));
flare.scale.set(1.6, 1.6, 1); flare.position.set(-0.7, 0.4, 0.2);
beams.add(flare);

/* ---------------- Prism ---------------- */
const prismGroup = new THREE.Group();
world.add(prismGroup);

const prismGeo = new THREE.CylinderGeometry(1.75, 1.75, 1.6, 3, 1);
prismGeo.rotateX(Math.PI / 2);   // triangular face toward camera
prismGeo.rotateZ(Math.PI);       // apex up
prismGeo.computeVertexNormals();
const prismMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, metalness: 0, roughness: 0.04,
  transmission: 1, thickness: 1.6, ior: 1.52,
  iridescence: 0.9, iridescenceIOR: 1.3, iridescenceThicknessRange: [100, 800],
  clearcoat: 1, clearcoatRoughness: 0.05,
  envMapIntensity: 1.4, specularIntensity: 1, attenuationColor: new THREE.Color(0xdfe8ff), attenuationDistance: 6,
});
const prism = new THREE.Mesh(prismGeo, prismMat);
prismGroup.add(prism);

// Crisp edges
const edges = new THREE.LineSegments(new THREE.EdgesGeometry(prismGeo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
prism.add(edges);

// Inner rainbow core sheen
const innerGeo = new THREE.CircleGeometry(0.9, 3);
innerGeo.rotateZ(Math.PI / 2);
const innerMat = new THREE.ShaderMaterial({
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  uniforms: { uTime: { value: 0 } },
  vertexShader: beamVert,
  fragmentShader: /* glsl */`
    uniform float uTime; varying vec2 vUv;
    vec3 hue(float h){ return clamp(abs(mod(h*6.0+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); }
    void main(){ float d = distance(vUv, vec2(.5)); float a = smoothstep(.5,.0,d)*.22; gl_FragColor = vec4(hue(vUv.x*.8+uTime*.05)*a, a); }
  `,
});
const inner = new THREE.Mesh(innerGeo, innerMat);
inner.position.z = -0.85;
prismGroup.add(inner);

// Lights for highlights
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-4, 6, 6); scene.add(key);
const rim = new THREE.PointLight(0x8a5bff, 30, 20); rim.position.set(4, -3, 3); scene.add(rim);
const warm = new THREE.PointLight(0xff5a1f, 22, 20); warm.position.set(-5, -2, 2); scene.add(warm);

/* ---------------- Floating shards (secondary crystals) ---------------- */
const shardMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, transmission: 1, thickness: 0.6, ior: 1.45, iridescence: 1, envMapIntensity: 1.6, clearcoat: 1 });
const shards = [];
const shardGeo = new THREE.OctahedronGeometry(0.28, 0);
for (let i = 0; i < 9; i++) {
  const m = new THREE.Mesh(shardGeo, shardMat);
  const r = 3.4 + Math.random() * 3;
  const a = Math.random() * Math.PI * 2;
  m.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.6, -1 - Math.random() * 4);
  m.scale.setScalar(0.4 + Math.random() * 1.1);
  m.userData = { a, r, speed: 0.05 + Math.random() * 0.1, rot: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.01), y: m.position.y };
  world.add(m); shards.push(m);
}

/* ---------------- Dust particles ---------------- */
const N = 900;
const pGeo = new THREE.BufferGeometry();
const pos = new Float32Array(N * 3), seeds = new Float32Array(N);
for (let i = 0; i < N; i++) {
  pos[i * 3] = (Math.random() - 0.5) * 30;
  pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
  pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
  seeds[i] = Math.random();
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
const pMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
  vertexShader: /* glsl */`
    attribute float aSeed; uniform float uTime; uniform float uPR; varying float vA; varying float vS;
    void main(){
      vec3 p = position;
      p.y += mod(uTime * (0.08 + aSeed * 0.12) + aSeed * 18.0, 18.0) - 9.0 - position.y * 0.0;
      p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.3;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (1.0 + aSeed * 2.5) * uPR * (8.0 / -mv.z);
      vA = 0.25 + 0.75 * abs(sin(uTime * (0.5 + aSeed) + aSeed * 10.0)); vS = aSeed;
    }`,
  fragmentShader: /* glsl */`
    varying float vA; varying float vS;
    void main(){ float d = length(gl_PointCoord - .5); if(d > .5) discard; float a = smoothstep(.5, 0., d) * vA * .55;
      vec3 c = mix(vec3(1.), vec3(.75,.7,1.), vS); gl_FragColor = vec4(c * a, a); }`,
});
const dust = new THREE.Points(pGeo, pMat);
scene.add(dust);

/* ---------------- Interaction state ---------------- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
}, { passive: true });

let burst = 0; // click shockwave
window.addEventListener('pointerdown', () => { burst = 1; }, { passive: true });

let layout = { x: 2.6, y: 0, s: 1 };
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const mobile = w < 900;
  layout = mobile ? { x: 0.6, y: 2.3, s: 0.48 } : { x: 2.7 * Math.min(1, camera.aspect / 1.6), y: 0.1, s: 1 };
}
window.addEventListener('resize', resize);
resize();

/* ---------------- Loop ---------------- */
const clock = new THREE.Clock();
let introT = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  introT = Math.min(1, introT + dt * (window.__introStarted ? 0.55 : 0));
  const intro = 1 - Math.pow(1 - introT, 4);

  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const scroll = window.scrollY / maxScroll;          // 0 → 1 whole page
  const heroP = Math.min(1, window.scrollY / window.innerHeight); // 0 → 1 over hero

  // Finale: prism comes back to centre stage behind the contact section
  const vh = window.innerHeight;
  const endP = THREE.MathUtils.smoothstep(window.scrollY, maxScroll - 2.2 * vh, maxScroll - 0.9 * vh);
  const away = heroP * (1 - endP); // 0 in hero & finale, 1 in middle sections

  // World placement: prism drifts to the side & recedes while content is read
  const sideX = window.innerWidth < 900 ? 1.6 : 5.2;
  world.position.x = THREE.MathUtils.lerp(THREE.MathUtils.lerp(layout.x, sideX, heroP), 0, endP) + mouse.x * 0.25;
  world.position.y = layout.y * (1 - endP) + mouse.y * 0.15 - (1 - intro) * 2 - endP * 0.4;
  world.position.z = -away * 7 - (1 - intro) * 6;
  world.scale.setScalar(layout.s * (1 - endP) + endP * (window.innerWidth < 900 ? 0.7 : 0.9));
  canvas.style.opacity = String(1 - away * 0.62);

  // Prism motion
  const spin = reduceMotion ? 0 : t * 0.15;
  prism.rotation.y = Math.sin(spin) * 0.5 + mouse.x * 0.6 + scroll * Math.PI * 4;
  prism.rotation.x = mouse.y * -0.35 + Math.sin(t * 0.4) * 0.05 + scroll * Math.PI * 1.5;
  prism.position.y = Math.sin(t * 0.8) * 0.06;
  burst *= 0.92;
  prismGroup.scale.setScalar(1 + burst * 0.08 + Math.sin(t * 1.1) * 0.01);
  inner.material.uniforms.uTime.value = t;
  inner.rotation.z = t * 0.2;

  // Beams follow mouse slightly & dim after hero
  const beamPower = intro * (1 - away * 0.6);
  inBeam.material.uniforms.uIntensity.value = 1.4 * beamPower;
  inHalo.material.uniforms.uIntensity.value = 0.22 * beamPower;
  flare.material.opacity = 0.9 * beamPower * (0.85 + Math.sin(t * 6) * 0.15);
  outBeams.forEach((b, i) => {
    b.rotation.z = b.userData.base + mouse.y * 0.12 + Math.sin(t * 0.5 + i) * 0.01 - burst * 0.15 * (i / 6);
    b.material.uniforms.uIntensity.value = 0.9 * beamPower * (1 + burst);
    b.material.uniforms.uTime.value = t;
  });
  outGlow.rotation.z = -0.58 + mouse.y * 0.12;
  outGlow.material.uniforms.uIntensity.value = 0.08 * beamPower;
  inBeam.material.uniforms.uTime.value = t; inHalo.material.uniforms.uTime.value = t;
  beams.rotation.z = mouse.y * 0.04;

  shards.forEach((s) => {
    const u = s.userData;
    s.rotation.x += u.rot.x; s.rotation.y += u.rot.y;
    s.position.x = Math.cos(u.a + t * u.speed) * u.r;
    s.position.y = u.y + Math.sin(t * u.speed * 3 + u.a) * 0.3 - scroll * 6 * (u.r / 6);
  });

  rim.position.x = 4 + mouse.x * 3; rim.position.y = -3 + mouse.y * 3;
  pMat.uniforms.uTime.value = t;
  dust.rotation.y = mouse.x * 0.05;

  camera.position.x = mouse.x * 0.3;
  camera.position.y = mouse.y * 0.2;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// compile shaders before revealing to avoid a hitch
renderer.compile(scene, camera);
window.__sceneReady = true;
requestAnimationFrame(tick);
