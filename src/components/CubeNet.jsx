import { useT } from '../i18n.jsx';
import { CUBE_COLORS, FACE_ORDER } from '../vision/ColorDetector.js';

const LAYOUT = {
  U: { col: 1, row: 0 },
  L: { col: 0, row: 1 },
  F: { col: 1, row: 1 },
  R: { col: 2, row: 1 },
  B: { col: 3, row: 1 },
  D: { col: 1, row: 2 },
};

export default function CubeNet({ faceletState, onCellTap, size = 26 }) {
  const { t } = useT();
  return (
    <div className="net">
      {FACE_ORDER.map((face) => {
        const { col, row } = LAYOUT[face];
        const base = FACE_ORDER.indexOf(face) * 9;
        const faceStr = faceletState.slice(base, base + 9);
        return (
          <div key={face} className="face" style={{ gridColumn: col + 1, gridRow: row + 1 }}>
            <div className="face-label">{t('face.' + face)}</div>
            {faceStr.split('').map((c, i) => (
              <div
                key={i}
                className={'cell' + (onCellTap && i !== 4 ? ' tappable' : '')}
                style={{ background: CUBE_COLORS[c] || '#3a3a3a', width: size, height: size }}
                onClick={() => onCellTap && i !== 4 && onCellTap(face, i)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
