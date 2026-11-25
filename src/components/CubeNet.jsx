import { CUBE_COLORS, FACE_ORDER } from '../vision/ColorDetector.js';
import { useT } from '../i18n.jsx';

const LAYOUT = { U: [2, 1], L: [1, 2], F: [2, 2], R: [3, 2], B: [4, 2], D: [2, 3] };

/** Unfolded cube. `onCellTap(globalIndex)` makes non-centre stickers tappable. */
export default function CubeNet({ state, onCellTap, highlight, errorCells }) {
  const { t } = useT();
  return (
    <div className="net">
      {FACE_ORDER.map((face, fi) => {
        const [col, row] = LAYOUT[face];
        return (
          <div key={face} className="net-face" style={{ gridColumn: col, gridRow: row }}>
            {[...state.slice(fi * 9, fi * 9 + 9)].map((c, i) => {
              const k = fi * 9 + i;
              const center = i === 4;
              const tappable = onCellTap && !center;
              return (
                <button
                  key={i}
                  type="button"
                  tabIndex={tappable ? 0 : -1}
                  disabled={!tappable}
                  className={'sticker' + (center ? ' center' : '') + (c === '?' ? ' empty' : '') + (highlight?.has(k) ? ' flagged' : '') + (errorCells?.has(k) ? ' bad' : '')}
                  style={{ '--c': CUBE_COLORS[c] || 'transparent' }}
                  onClick={tappable ? () => onCellTap(k) : undefined}
                  aria-label={center ? t('face.' + face) : c === '?' ? t('common.empty') : t('color.' + c)}
                >
                  {center && <span className="sticker-label">{face}</span>}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
