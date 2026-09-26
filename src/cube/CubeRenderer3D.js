import * as THREE from 'three';
import { CUBE_COLORS } from '../ui/theme.js';
import { FACE_ORDER, SOLVED_STATE } from './CubeModel.js';
import { getDPR } from '../core/hidpi.js';

const STICKER_COLOR_HEX = {
  U: CUBE_COLORS.U, D: CUBE_COLORS.D, F: CUBE_COLORS.F,
  B: CUBE_COLORS.B, L: CUBE_COLORS.L, R: CUBE_COLORS.R,
};
const INNER_COLOR = 0x111111;

/**
 * Рендерер 3D кубика на Three.js, монтируется в #three-root поверх Phaser-канваса.
 * Не зависит от Phaser напрямую — общается через facelet-строку CubeModel
 * и явные вызовы playMove()/setState().
 */
export class CubeRenderer3D {
  constructor(container) {
    this.container = container;
    this.cubies = []; // 26 маленьких кубиков (без центрального невидимого)
    this._initThree();
    this._buildCube();
    this._animating = false;
    this._raf = null;
  }

  _initThree() {
    const { clientWidth: w, clientHeight: h } = this.container;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    this.camera.position.set(4.2, 4.2, 5.2);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(getDPR());
    this.renderer.setClearColor(0x000000, 0); // прозрачный фон — виден Phaser-слой под ним
    this.container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 8, 6);
    this.scene.add(ambient, dir);

    this.cubeGroup = new THREE.Group();
    this.scene.add(this.cubeGroup);

    this._resizeHandler = () => this._onResize();
    window.addEventListener('resize', this._resizeHandler);
  }

  _onResize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _buildCube() {
    const gap = 0.06;
    const size = 0.94;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const geo = new THREE.BoxGeometry(size, size, size);
          const materials = this._materialsForPosition(x, y, z);
          const mesh = new THREE.Mesh(geo, materials);
          mesh.position.set(x * (size + gap), y * (size + gap), z * (size + gap));
          mesh.userData.gridPos = { x, y, z };
          this.cubeGroup.add(mesh);
          this.cubies.push(mesh);
        }
      }
    }
  }

  // Three.js порядок граней box: +X -X +Y -Y +Z -Z  =>  R L U D F B
  _materialsForPosition(x, y, z) {
    const faceForSide = {
      R: x === 1, L: x === -1, U: y === 1, D: y === -1, F: z === 1, B: z === -1,
    };
    const order = ['R', 'L', 'U', 'D', 'F', 'B'];
    return order.map(face =>
      new THREE.MeshLambertMaterial({ color: faceForSide[face] ? STICKER_COLOR_HEX[face] : INNER_COLOR })
    );
  }

  /** Полная перекраска кубиков по facelet-строке (после скана/ввода, без анимации). */
  setState(faceletState) {
    // TODO: сопоставление facelet-индексов с гранями конкретных mesh по gridPos.
    // Оставлено как явный TODO — требует таблицы facelet(i) -> (cubieGridPos, localFace),
    // которую удобнее сгенерировать один раз и закэшировать (аналогично MOVE_DEFS в CubeModel).
  }

  /**
   * Анимированно поворачивает слой по ходу (напр. "R", "U'", "F2").
   * Возвращает Promise, резолвится по завершении анимации.
   */
  async playMove(move, durationMs = 220) {
    if (this._animating) return;
    this._animating = true;

    const face = move[0];
    const mod = move.slice(1);
    const angle = (mod === '2' ? Math.PI : Math.PI / 2) * (mod === "'" ? -1 : 1);
    const axis = this._axisForFace(face);
    const layerCubies = this._cubiesInLayer(face);

    const pivot = new THREE.Group();
    this.scene.add(pivot);
    layerCubies.forEach(c => pivot.attach(c));

    await this._tweenRotation(pivot, axis, angle, durationMs);

    layerCubies.forEach(c => this.cubeGroup.attach(c));
    this.scene.remove(pivot);
    this._animating = false;
  }

  _axisForFace(face) {
    return { U: 'y', D: 'y', F: 'z', B: 'z', L: 'x', R: 'x' }[face];
  }

  _cubiesInLayer(face) {
    const key = { U: ['y', 1], D: ['y', -1], F: ['z', 1], B: ['z', -1], L: ['x', -1], R: ['x', 1] }[face];
    const [axis, val] = key;
    return this.cubies.filter(c => c.userData.gridPos[axis] === val);
  }

  _tweenRotation(pivot, axis, targetAngle, durationMs) {
    return new Promise(resolve => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic, синхронно с MOTION.ease темы
        pivot.rotation[axis] = targetAngle * eased;
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  startRenderLoop() {
    const loop = () => {
      this.renderer.render(this.scene, this.camera);
      this._raf = requestAnimationFrame(loop);
    };
    loop();
  }

  stopRenderLoop() {
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  /** Свободное вращение камеры вокруг куба (для 3D-визуализатора/тренировки). */
  setOrbit(theta, phi, radius = 7) {
    this.camera.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
    this.camera.lookAt(0, 0, 0);
  }

  dispose() {
    this.stopRenderLoop();
    window.removeEventListener('resize', this._resizeHandler);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
