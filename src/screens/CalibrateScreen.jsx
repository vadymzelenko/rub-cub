import { useEffect, useRef, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import {
    averageColor,
    calibrateColor,
    resetCalibration,
    CUBE_COLORS,
    FACE_ORDER,
} from '../vision/ColorDetector.js';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

function drawCover(ctx, video, w, h) {
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return;
    const scale = Math.max(w / vw, h / vh);
    const sw = w / scale, sh = h / scale;
    ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h);
}

// Тёмный текст на светлых цветах (белый, жёлтый), светлый — на остальных.
function textColorFor(face) {
    return face === 'U' || face === 'D' ? '#111' : '#fff';
}

export default function CalibrateScreen() {
    const { t } = useT();
    const { navigate } = useNav();
    const stageRef = useRef(null);
    const targetRef = useRef(null);
    const videoRef = useRef(null);

    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(0);
    const [flash, setFlash] = useState(false);
    const [done, setDone] = useState(false);

    const current = FACE_ORDER[step];
    const total = FACE_ORDER.length;

    useEffect(() => {
        const video = videoRef.current;
        let stream = null;
        let disposed = false;

        async function start() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
                if (disposed) { stream.getTracks().forEach((t) => t.stop()); return; }
                if (video) {
                    video.srcObject = stream;
                    video.play().catch(() => {});
                }
                setReady(true);
            } catch (e) {
                setError(t('scan.error') + ' (' + (e.message || e) + ')');
            }
        }

        start();
        return () => {
            disposed = true;
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    const capture = () => {
        if (!ready || done) return;
        const video = videoRef.current;
        const stage = stageRef.current;
        const target = targetRef.current;
        if (!video || !stage || !target || video.readyState < 2) return;

        const canvas = document.createElement('canvas');
        const sRect = stage.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.round(sRect.width * dpr));
        const h = Math.max(1, Math.round(sRect.height * dpr));
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        drawCover(ctx, video, w, h);

        const cx = (tRect.left - sRect.left + tRect.width / 2) * dpr;
        const cy = (tRect.top - sRect.top + tRect.height / 2) * dpr;
        // Берём пиксели из центра круга — внутри мишени (радиус ~ 30% диаметра).
        const radius = Math.min(tRect.width, tRect.height) * dpr * 0.2;
        const { r, g, b } = averageColor(ctx, cx, cy, radius);

        calibrateColor(current, r, g, b);
        setFlash(true);
        setTimeout(() => setFlash(false), 200);

        if (step < total - 1) {
            setStep(step + 1);
        } else {
            setDone(true);
            setTimeout(() => navigate('solverEntry'), 800);
        }
    };

    const reset = () => {
        resetCalibration();
        setStep(0);
        setDone(false);
    };

    return (
        <div className="app">
            <TopBar title={t('calib.title')} />

            {/*<div className="status" style={{ marginTop: 4 }}>*/}
            {/*    {done ? t('calib.allDone') : t('calib.step', { n: step + 1, total })}*/}
            {/*</div>*/}

            <div className="scan-stage" ref={stageRef}>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                />

                {flash && <div className="scan-flash" />}

                {!ready && !error && (
                    <div className="scan-placeholder">
                        <div className="spinner" />
                        <div>{t('scan.starting')}</div>
                    </div>
                )}

                {error && (
                    <div className="scan-placeholder">
                        <div>{error}</div>
                    </div>
                )}

                {ready && !done && (
                    <>
                        <div
                            className="calib-badge"
                            style={{
                                background: CUBE_COLORS[current],
                                color: textColorFor(current),
                                borderColor: textColorFor(current) === '#111' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.55)',
                                textShadow: textColorFor(current) === '#111'
                                    ? 'none'
                                    : '0 1px 3px rgba(0, 0, 0, 0.55)',
                            }}
                        >
  <span
      className="calib-badge-dot"
      style={{
          background: textColorFor(current) === '#111'
              ? 'rgba(0,0,0,0.28)'
              : 'rgba(0,0,0,0.28)',
          boxShadow: textColorFor(current) === '#111'
              ? 'inset 0 0 0 1.5px rgba(0,0,0,0.35)'
              : 'inset 0 0 0 1.5px rgba(255,255,255,0.6)',
      }}
  />
                            {t('color.' + current)}
                        </div>

                        <div className="calib-circle-wrap">
                            <div className="calib-circle" ref={targetRef}>
                                <div className="calib-circle-inner" />
                            </div>
                        </div>

                        <div className="calib-hint-overlay">{t('calib.hint')}</div>
                    </>
                )}

                {done && (
                    <div className="scan-placeholder">
                        <div style={{ fontSize: 40 }}>✓</div>
                        <div>{t('calib.allDone')}</div>
                    </div>
                )}
            </div>

            <div className="calib-dots">
                {FACE_ORDER.map((f, i) => (
                    <span
                        key={f}
                        className={
                            'calib-dot' +
                            (i < step ? ' filled' : '') +
                            (i === step && !done ? ' active' : '')
                        }
                        style={{ '--c': CUBE_COLORS[f] }}
                    />
                ))}
            </div>

            <div className="shutter-row">
                <button
                    className="shutter"
                    onClick={capture}
                    disabled={!ready || done}
                    aria-label={t('scan.shutter')}
                >
                    <span className="shutter-inner" />
                </button>
            </div>

            <div className="controls">
                <button className="btn ghost" onClick={reset}>{t('calib.reset')}</button>
                <button className="btn" onClick={() => navigate('solverEntry')}>{t('calib.skip')}</button>
            </div>
        </div>
    );
}