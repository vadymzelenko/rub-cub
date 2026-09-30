import { useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import CubeNet from '../components/CubeNet.jsx';
import { analyzeState, FACE_ORDER } from '../cube/CubeModel.js';
import { CUBE_COLORS, FACE_NEIGHBORS } from '../vision/ColorDetector.js';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

export default function ReviewScreen({ faceletState }) {
    const { t } = useT();
    const { navigate } = useNav();
    const [state, setState] = useState(faceletState);
    const [face, setFace] = useState('U');
    const [view, setView] = useState('face'); // 'face' | 'net'

    const { valid, errors } = analyzeState(state);
    const base = FACE_ORDER.indexOf(face) * 9;
    const faceStr = state.slice(base, base + 9);
    const neighbors = FACE_NEIGHBORS[face];

    const cycleCell = (i) => {
        if (i === 4) return;
        setState((s) => {
            const arr = s.split('');
            const cur = arr[base + i];
            arr[base + i] = FACE_ORDER[(FACE_ORDER.indexOf(cur) + 1) % FACE_ORDER.length];
            return arr.join('');
        });
    };

    return (
        <div className="app scroll">
            <TopBar title={t('review.title')} />

            <div className="review-toggle">
                <button
                    className={'review-toggle-btn' + (view === 'face' ? ' active' : '')}
                    onClick={() => setView('face')}
                >{t('review.viewFace')}</button>
                <button
                    className={'review-toggle-btn' + (view === 'net' ? ' active' : '')}
                    onClick={() => setView('net')}
                >{t('review.viewNet')}</button>
            </div>

            {view === 'face' && (
                <>
                    <div className="review-tabs">
                        {FACE_ORDER.map((f) => (
                            <button
                                key={f}
                                className={'review-tab' + (face === f ? ' active' : '')}
                                onClick={() => setFace(f)}
                            >
                                <span className="review-tab-dot" style={{ background: CUBE_COLORS[f] }} />
                                <span className="review-tab-label">{t('face.' + f)}</span>
                            </button>
                        ))}
                    </div>

                    <div className="review-face">
                        <div className="review-face-name">{t('face.' + face)}</div>
                        <div className="review-face-grid">
                            {neighbors && (
                                <>
                                    <div className="review-strip top"    style={{ background: CUBE_COLORS[neighbors.top] }} />
                                    <div className="review-strip right"  style={{ background: CUBE_COLORS[neighbors.right] }} />
                                    <div className="review-strip bottom" style={{ background: CUBE_COLORS[neighbors.bottom] }} />
                                    <div className="review-strip left"   style={{ background: CUBE_COLORS[neighbors.left] }} />
                                </>
                            )}
                            {faceStr.split('').map((c, i) => (
                                <button
                                    key={i}
                                    className={'review-cell' + (i === 4 ? ' center' : '')}
                                    style={{ background: CUBE_COLORS[c] || '#3a3a3a' }}
                                    onClick={() => cycleCell(i)}
                                />
                            ))}
                        </div>
                        <div className="review-face-hint">{t('review.tapHint')}</div>
                    </div>
                </>
            )}

            {view === 'net' && (
                <div className="review-net-wrap">
                    <div className="net-wrap"><CubeNet faceletState={state} /></div>
                    <div className="review-face-hint">{t('review.netHint')}</div>
                </div>
            )}

            <div className={'review-status ' + (valid ? 'success' : 'error')}>
                {valid ? (
                    <div className="review-status-ok">✓ {t('review.ok')}</div>
                ) : (
                    <>
                        <div className="review-status-title">{t('manual.error')} ({errors.length})</div>
                        <ul className="review-errors">
                            {errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                    </>
                )}
            </div>

            <div className="controls">
                <button className="btn" onClick={() => navigate('manual', { prefill: state })} style={{ flex: 1 }}>
                    {t('review.edit')}
                </button>
                <button
                    className="btn primary"
                    disabled={!valid}
                    onClick={() => navigate('solve', { faceletState: state })}
                    style={{ flex: 1 }}
                >
                    {t('review.solve')}
                </button>
            </div>
        </div>
    );
}