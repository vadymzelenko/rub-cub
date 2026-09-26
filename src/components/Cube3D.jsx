import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';

const FACE_COLORS = { U: 0xffffff, D: 0xffd500, F: 0x009e60, B: 0x0051ba, L: 0xff5800, R: 0xc41e3a };
const BODY = 0x111111;
const FACE_BASE = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
const MOVES = {
  U: { axis: 'y', layer: 1, angle: -Math.PI / 2 },
  D: { axis: 'y', layer: -1, angle: Math.PI / 2 },
  F: { axis: 'z', layer: 1, angle: -Math.PI / 2 },
  B: { axis: 'z', layer: -1, angle: Math.PI / 2 },
  R: { axis: 'x', layer: 1, angle: -Math.PI / 2 },
  L: { axis: 'x', layer: -1, angle: Math.PI / 2 },
};

function faceletIndex(face, x, y, z) {
  let row, col;
  switch (face) {
    case 'U': row = z + 1; col = x + 1; break;
    case 'D': row = 1 - z; col = x + 1; break;
    case 'F': row = 1 - y; col = x + 1; break;
    case 'B': row = 1 - y; col = 1 - x; break;
    case 'R': row = 1 - y; col = 1 - z; break;
    case 'L': row = 1 - y; col = z + 1; break;
  }
  return FACE_BASE[face] + row * 3 + col;
}

// Материалы BoxGeometry идут в порядке: +x, -x, +y, -y, +z, -z.
const FACE_TO_MAT = { R: 0, L: 1, U: 2, D: 3, F: 4, B: 5 };

const Cube3D = forwardRef(function Cube3D({ size = 260 }, ref) {
  const mountRef = useRef(null);
  const s = useRef({});

  useImperativeHandle(ref, () => ({
    setState(facelet) {
      const st = s.current;
      if (!st) return;
      for (const c of st.cubies) {
        for (const face of c.faces) {
          const letter = facelet[faceletIndex(face, c.x, c.y, c.z)];
          c.materials[FACE_TO_MAT[face]].color.setHex(FACE_COLORS[letter] ?? BODY);
        }
      }
    },
    async playMove(move, duration = 1400) {
      const st = s.current;
      const def = MOVES[move[0]];
      const times = move[1] === '2' ? 2 : 1;
      const sign = move[1] === "'" ? -1 : 1;
      const total = def.angle * sign * times;
      const layer = st.cubies.filter((c) => c[def.axis] === def.layer);

      const pivot = new THREE.Group();
      st.cubeGroup.add(pivot);
      layer.forEach((c) => pivot.attach(c.group));

      const axis = def.axis === 'x' ? new THREE.Vector3(1, 0, 0) : def.axis === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);

      await new Promise((resolve) => {
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          pivot.rotation.set(0, 0, 0);
          pivot.rotateOnAxis(axis, total * eased);
          if (t < 1) requestAnimationFrame(step);
          else {
            layer.forEach((c) => st.cubeGroup.attach(c.group));
            st.cubeGroup.remove(pivot);
            layer.forEach((c) => {
              c.x = Math.round(c.group.position.x);
              c.y = Math.round(c.group.position.y);
              c.z = Math.round(c.group.position.z);
            });
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    },
  }), []);

  useEffect(() => {
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(4.6, 4.4, 6.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(5, 8, 6);
    scene.add(dir);

    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.set(-0.4, 0.7, 0);
    scene.add(orbitGroup);
    const cubeGroup = new THREE.Group();
    orbitGroup.add(cubeGroup);

    const cubies = [];
    const geo = new THREE.BoxGeometry(0.94, 0.94, 0.94);
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      if (x === 0 && y === 0 && z === 0) continue;
      const faces = [];
      if (x === 1) faces.push('R');
      if (x === -1) faces.push('L');
      if (y === 1) faces.push('U');
      if (y === -1) faces.push('D');
      if (z === 1) faces.push('F');
      if (z === -1) faces.push('B');
      const materials = Array.from({ length: 6 }, () => new THREE.MeshLambertMaterial({ color: BODY }));
      const mesh = new THREE.Mesh(geo, materials);
      mesh.position.set(x, y, z);
      cubeGroup.add(mesh);
      cubies.push({ x, y, z, faces, materials, group: mesh });
    }

    s.current = { renderer, scene, camera, cubeGroup, orbitGroup, cubies };

    // Простое вращение куба перетаскиванием.
    let dragging = false, lastX = 0, lastY = 0;
    const el = mount;
    el.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      orbitGroup.rotation.y += dx * 0.008;
      orbitGroup.rotation.x += dy * 0.008;
    });
    window.addEventListener('pointerup', () => { dragging = false; });

    let raf;
    const loop = () => { renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [size]);

  return <div ref={mountRef} style={{ width: size, height: size, touchAction: 'none' }} />;
});

export default Cube3D;
