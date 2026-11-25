import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CUBE_COLORS } from '../vision/ColorDetector.js';

const BODY = 0x0d0d10;
const UNKNOWN = 0x3a3a42;
const FACE_BASE = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
const MOVES = {
  U: { axis: 'y', layer: 1, angle: -Math.PI / 2 },
  D: { axis: 'y', layer: -1, angle: Math.PI / 2 },
  F: { axis: 'z', layer: 1, angle: -Math.PI / 2 },
  B: { axis: 'z', layer: -1, angle: Math.PI / 2 },
  R: { axis: 'x', layer: 1, angle: -Math.PI / 2 },
  L: { axis: 'x', layer: -1, angle: Math.PI / 2 },
  // Whole-cube rotations
  x: { axis: 'x', layer: null, angle: -Math.PI / 2 },
  y: { axis: 'y', layer: null, angle: -Math.PI / 2 },
  z: { axis: 'z', layer: null, angle: -Math.PI / 2 },
};
const AXES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const NORMALS = {
  U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0],
};

// Facelet index of the sticker facing `face` on the cubie at home position (x, y, z).
function faceletIndex(face, x, y, z) {
  let row, col;
  switch (face) {
    case 'U': row = z + 1; col = x + 1; break;
    case 'D': row = 1 - z; col = x + 1; break;
    case 'F': row = 1 - y; col = x + 1; break;
    case 'B': row = 1 - y; col = 1 - x; break;
    case 'R': row = 1 - y; col = 1 - z; break;
    default:  row = 1 - y; col = z + 1; break; // L
  }
  return FACE_BASE[face] + row * 3 + col;
}

function roundedSquare(size, radius) {
  const s = size / 2, r = radius;
  const shape = new THREE.Shape();
  shape.moveTo(-s + r, -s);
  shape.lineTo(s - r, -s); shape.quadraticCurveTo(s, -s, s, -s + r);
  shape.lineTo(s, s - r); shape.quadraticCurveTo(s, s, s - r, s);
  shape.lineTo(-s + r, s); shape.quadraticCurveTo(-s, s, -s, s - r);
  shape.lineTo(-s, -s + r); shape.quadraticCurveTo(-s, -s, -s + r, -s);
  return new THREE.ShapeGeometry(shape, 6);
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Animated 3D cube. Fills the width of its container (square).
 * Ref API: setState(facelets) — jump to a state (cancels animations);
 *          playMove(move, ms) — animate one move; calls are queued.
 */
const Cube3D = forwardRef(function Cube3D({ initialState, autoRotate = false, className = '' }, ref) {
  const mountRef = useRef(null);
  const api = useRef(null);

  useImperativeHandle(ref, () => ({
    setState: (f) => api.current?.setState(f),
    playMove: (m, ms) => api.current?.playMove(m, ms) ?? Promise.resolve(),
  }), []);

  useEffect(() => {
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.75;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 9.6);
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(4, 7, 6);
    scene.add(key, new THREE.AmbientLight(0xffffff, 0.2));

    const orbit = new THREE.Group();
    orbit.rotation.set(0.5, -0.65, 0);
    scene.add(orbit);
    const cubeGroup = new THREE.Group();
    orbit.add(cubeGroup);

    const bodyGeo = new RoundedBoxGeometry(0.96, 0.96, 0.96, 3, 0.1);
    const bodyMat = new THREE.MeshStandardMaterial({ color: BODY, roughness: 0.55, metalness: 0.1 });
    const stickerGeo = roundedSquare(0.8, 0.12);
    const disposables = [bodyGeo, bodyMat, stickerGeo, envTex, pmrem];

    const cubies = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      if (!x && !y && !z) continue;
      const mesh = new THREE.Mesh(bodyGeo, bodyMat);
      mesh.position.set(x, y, z);
      const stickers = [];
      for (const [face, n] of Object.entries(NORMALS)) {
        const on = (n[0] && n[0] === x) || (n[1] && n[1] === y) || (n[2] && n[2] === z);
        if (!on) continue;
        const mat = new THREE.MeshStandardMaterial({ color: UNKNOWN, roughness: 0.4, metalness: 0 });
        disposables.push(mat);
        const st = new THREE.Mesh(stickerGeo, mat);
        st.position.set(n[0] * 0.485, n[1] * 0.485, n[2] * 0.485);
        st.lookAt(n[0] * 2, n[1] * 2, n[2] * 2);
        mesh.add(st);
        stickers.push({ mat, index: faceletIndex(face, x, y, z) });
      }
      cubeGroup.add(mesh);
      cubies.push({ home: [x, y, z], pos: [x, y, z], mesh, stickers });
    }

    // ---------- render loop (on demand) ----------
    let dirty = true, raf = 0, disposed = false;
    let dragging = false, vx = 0, vy = 0, lastX = 0, lastY = 0, lastInteract = 0;
    const tickers = new Set();

    const frame = (now) => {
      raf = 0;
      if (disposed) return;
      for (const fn of tickers) fn(now);
      if (!dragging && (Math.abs(vx) > 0.0002 || Math.abs(vy) > 0.0002)) {
        orbit.rotation.y += vx; orbit.rotation.x = clampX(orbit.rotation.x + vy);
        vx *= 0.92; vy *= 0.92; dirty = true;
      }
      if (autoRotate && !dragging && now - lastInteract > 2500) {
        orbit.rotation.y += 0.004; dirty = true;
      }
      if (dirty) { renderer.render(scene, camera); dirty = false; }
      if (tickers.size || autoRotate || Math.abs(vx) > 0.0002 || Math.abs(vy) > 0.0002) request();
    };
    const request = () => { if (!raf && !disposed) raf = requestAnimationFrame(frame); };
    const invalidate = () => { dirty = true; request(); };
    const clampX = (v) => Math.max(-1.3, Math.min(1.3, v));

    // ---------- resize ----------
    const resize = () => {
      const w = Math.max(1, mount.clientWidth);
      renderer.setSize(w, w, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      invalidate();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    // ---------- drag to orbit ----------
    const el = renderer.domElement;
    const onDown = (e) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY; vx = vy = 0;
      el.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = (e.clientX - lastX) * 0.009, dy = (e.clientY - lastY) * 0.009;
      lastX = e.clientX; lastY = e.clientY;
      orbit.rotation.y += dx; orbit.rotation.x = clampX(orbit.rotation.x + dy);
      vx = dx; vy = dy; lastInteract = performance.now();
      invalidate();
    };
    const onUp = () => { dragging = false; lastInteract = performance.now(); request(); };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    // ---------- state & moves ----------
    let generation = 0;
    let queue = Promise.resolve();

    const snap = (c) => {
      const p = c.mesh.position;
      p.set(Math.round(p.x), Math.round(p.y), Math.round(p.z));
      c.pos = [p.x, p.y, p.z];
      const m = new THREE.Matrix4().makeRotationFromQuaternion(c.mesh.quaternion);
      m.elements = m.elements.map((v) => Math.round(v));
      c.mesh.quaternion.setFromRotationMatrix(m);
    };

    const setState = (facelets) => {
      generation++;
      queue = Promise.resolve();
      tickers.clear();
      for (const c of cubies) {
        if (c.mesh.parent !== cubeGroup) cubeGroup.attach(c.mesh);
        c.mesh.position.set(...c.home);
        c.mesh.quaternion.identity();
        c.pos = [...c.home];
        for (const s of c.stickers) {
          const hex = CUBE_COLORS[facelets?.[s.index]];
          s.mat.color.set(hex || UNKNOWN);
        }
      }
      for (const child of [...cubeGroup.children]) if (child.isGroup) cubeGroup.remove(child);
      invalidate();
    };

    const animate = (move, duration, gen) => new Promise((resolve) => {
      const def = MOVES[move[0]];
      if (!def || gen !== generation) { resolve(); return; }
      const times = move[1] === '2' ? 2 : 1;
      const sign = move[1] === "'" ? -1 : 1;
      const total = def.angle * sign * times;
      const ai = { x: 0, y: 1, z: 2 }[def.axis];
      const layer = def.layer === null ? cubies : cubies.filter((c) => c.pos[ai] === def.layer);
      const pivot = new THREE.Group();
      cubeGroup.add(pivot);
      layer.forEach((c) => pivot.attach(c.mesh));
      const dur = duration * (times === 2 ? 1.35 : 1);
      const start = performance.now();
      const tick = (now) => {
        if (gen !== generation) { tickers.delete(tick); resolve(); return; }
        const t = Math.min(1, (now - start) / Math.max(1, dur));
        pivot.quaternion.setFromAxisAngle(AXES[def.axis], total * easeInOut(t));
        dirty = true;
        if (t >= 1) {
          tickers.delete(tick);
          layer.forEach((c) => { cubeGroup.attach(c.mesh); snap(c); });
          cubeGroup.remove(pivot);
          resolve();
        }
      };
      tickers.add(tick);
      request();
    });

    const playMove = (move, duration = 600) => {
      const gen = generation;
      queue = queue.then(() => animate(move, duration, gen));
      return queue;
    };

    api.current = { setState, playMove };
    setState(initialState);

    const onVis = () => { if (!document.hidden) invalidate(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      disposed = true;
      generation++;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      el.remove();
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRotate]);

  return <div ref={mountRef} className={'cube3d ' + className} />;
});

export default Cube3D;
