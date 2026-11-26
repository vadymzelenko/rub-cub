import { CUBE_COLORS, FACE_ORDER } from '../vision/ColorDetector.js';
import { useT } from '../i18n.jsx';

/** Row of six colour swatches; `counts` (optional) shows how many of each are used. */
export default function ColorPicker({ value, onChange, counts }) {
  const { t } = useT();
  return (
    <div className="picker" role="radiogroup">
      {FACE_ORDER.map((f) => {
        const n = counts?.[f];
        return (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={value === f}
            className={'swatch' + (value === f ? ' active' : '')}
            style={{ '--c': CUBE_COLORS[f] }}
            onClick={() => onChange(f)}
            title={t('color.' + f)}
          >
            <span className="swatch-chip" />
            {counts && <span className={'swatch-count' + (n > 9 ? ' over' : n === 9 ? ' full' : '')}>{n}/9</span>}
          </button>
        );
      })}
    </div>
  );
}
