// Lightweight CSS-3D cube for the home screen (no WebGL needed).
const FACES = {
  front:  ['F', 'F', 'R', 'F', 'F', 'F', 'U', 'F', 'F'],
  back:   ['B', 'B', 'B', 'L', 'B', 'B', 'B', 'B', 'D'],
  right:  ['R', 'R', 'R', 'R', 'R', 'U', 'R', 'R', 'B'],
  left:   ['L', 'F', 'L', 'L', 'L', 'L', 'L', 'D', 'L'],
  top:    ['U', 'U', 'D', 'U', 'U', 'U', 'B', 'U', 'U'],
  bottom: ['D', 'D', 'D', 'R', 'D', 'D', 'D', 'D', 'L'],
};

export default function HeroCube() {
  return (
    <div className="hero-cube" aria-hidden="true">
      <div className="hero-cube-glow" />
      <div className="hc-scene">
        <div className="hc-cube">
          {Object.entries(FACES).map(([side, cells]) => (
            <div key={side} className={'hc-face hc-' + side}>
              {cells.map((c, i) => <span key={i} className={'hc-s c-' + c} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
