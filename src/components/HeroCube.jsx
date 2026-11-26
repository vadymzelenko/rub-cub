import { useEffect, useRef } from 'react';
import Cube3D from './Cube3D.jsx';
import { SOLVED_STATE } from '../cube/CubeModel.js';

// Six times "R U R' U'" brings the cube back to solved, so the loop is seamless.
const LOOP = Array.from({ length: 6 }, () => ['R', 'U', "R'", "U'"]).flat();

/** Slowly rotating 3D cube on the home screen that keeps turning its layers. */
export default function HeroCube() {
  const cubeRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await wait(900);
      while (alive && !reduce) {
        for (const m of LOOP) {
          if (!alive) return;
          if (document.hidden) { await wait(500); continue; }
          await cubeRef.current?.playMove(m, 950);
          await wait(260);
        }
        cubeRef.current?.setState(SOLVED_STATE);
        await wait(2200);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="hero-cube" aria-hidden="true">
      <div className="hero-cube-glow" />
      <Cube3D ref={cubeRef} initialState={SOLVED_STATE} autoRotate interactive={false} className="hero-3d" />
    </div>
  );
}
