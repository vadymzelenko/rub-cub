import { useEffect, useRef, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { sampleFaceColors, CUBE_COLORS, FACE_ORDER, FACE_NEIGHBORS } from '../vision/ColorDetector.js';
import { FiRefreshCw } from 'react-icons/fi';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

function drawCover(ctx, video, w, h) {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return;
  const scale = Math.max(w / vw, h / vh);
  const sw = w / scale, sh = h / scale;
  ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h);
}

export default function ScanScreen() {
  const { t } = useT();
  const { navigate } = useNav();
  const stageRef = useRef(null);
  const guideRef = useRef(null);
  const videoRef = useRef(null);

  const [colors, setColors] = useState(Array(9).fill(null));
  const [captured, setCaptured] = useState({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [flash, setFlash] = useState(false);

  const capturedRef = useRef({});
  const pendingRef = useRef(false);
  const colorsRef = useRef(Array(9).fill(null));

  const nextFace = FACE_ORDER.find((f) => !captured[f]);
  const neighbors = nextFace ? FACE_NEIGHBORS[nextFace] : null;

  useEffect(() => {
    const canvas = document.createElement('canvas');
    let stream = null;
    let timer = null;
    let disposed = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (disposed) { stream.getTracks().forEach((t) => t.stop()); return; }

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
        }
        setReady(true);
        timer = setInterval(detect, 160);
      } catch (e) {
        setError(t('scan.error') + ' (' + (e.message || e) + ')');
      }
    }

    function detect() {
      if (pendingRef.current) return;
      const video = videoRef.current;
      const stage = stageRef.current, guide = guideRef.current;
      if (!video || !stage || !guide || video.readyState < 2) return;

      const sRect = stage.getBoundingClientRect();
      const gRect = guide.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(sRect.width * dpr));
      const h = Math.max(1, Math.round(sRect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      drawCover(ctx, video, w, h);

      const face = FACE_ORDER.find((f) => !capturedRef.current[f]);
      const rect = {
        x: (gRect.left - sRect.left) * dpr,
        y: (gRect.top - sRect.top) * dpr,
        size: gRect.width * dpr,
      };

      const cols = sampleFaceColors(canvas, rect, face || undefined);
      colorsRef.current = cols;
      setColors(cols);
    }

    start();
    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (Object.keys(captured).length === 6) {
      const facelet = FACE_ORDER.map((f) => captured[f].join('')).join('');
      navigate('review', { faceletState: facelet });
    }
  }, [captured, navigate]);

  const capture = () => {
    if (pendingRef.current || flash) return;
    const face = FACE_ORDER.find((f) => !capturedRef.current[f]);
    if (!face) return;
    const cols = colorsRef.current || [];
    if (cols.length !== 9 || !cols.every((c) => c)) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    pendingRef.current = true;
    setPending({ face, colors: [...cols] });
  };

  const confirmPending = () => {
    if (!pending) return;
    capturedRef.current[pending.face] = pending.colors;
    setCaptured({ ...capturedRef.current });
    pendingRef.current = false;
    setPending(null);
  };

  const cancelPending = () => {
    pendingRef.current = false;
    setPending(null);
  };

  const editPendingCell = (i) => {
    if (i === 4 || !pending) return;
    setPending((p) => {
      const colors = [...p.colors];
      colors[i] = FACE_ORDER[(FACE_ORDER.indexOf(colors[i]) + 1) % FACE_ORDER.length];
      return { ...p, colors };
    });
  };

  const resetAll = () => {
    capturedRef.current = {};
    setCaptured({});
    pendingRef.current = false;
    setPending(null);
  };

  return (
      <div className="app">
        <TopBar title={t('scan.title')} />

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
                <button className="btn primary" onClick={() => navigate('manual')}>{t('scan.manual')}</button>
              </div>
          )}

          {ready && !pending && (
              <div className="scan-guide-wrap">
                {neighbors && (
                    <>
                      <div className="guide-strip top" style={{ background: CUBE_COLORS[neighbors.top] }} />
                      <div className="guide-strip right" style={{ background: CUBE_COLORS[neighbors.right] }} />
                      <div className="guide-strip bottom" style={{ background: CUBE_COLORS[neighbors.bottom] }} />
                      <div className="guide-strip left" style={{ background: CUBE_COLORS[neighbors.left] }} />
                    </>
                )}
                <div className="scan-guide" ref={guideRef}>
                  {colors.map((c, i) => (
                      <div className="gcell" key={i}>
                        <div className="dot" style={{ background: c ? CUBE_COLORS[c] : 'rgba(255,255,255,0.12)' }} />
                      </div>
                  ))}
                </div>
              </div>
          )}

          {pending && (
              <div className="confirm-overlay">
                <div className="confirm-card">
                  <div className="confirm-title">{t('scan.confirmTitle')}</div>
                  <div className="confirm-grid">
                    {pending.colors.map((c, i) => (
                        <button
                            key={i}
                            className={'confirm-cell' + (i === 4 ? ' locked' : '')}
                            style={{ background: CUBE_COLORS[c] }}
                            onClick={() => editPendingCell(i)}
                            disabled={i === 4}
                        />
                    ))}
                  </div>
                  <div className="confirm-hint">{t('scan.confirmHint')}</div>
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn" onClick={cancelPending} style={{ flex: 1 }}>{t('scan.rescan')}</button>
                    <button className="btn primary" onClick={confirmPending} style={{ flex: 1 }}>{t('scan.confirm')}</button>
                  </div>
                </div>
              </div>
          )}
        </div>

        <div className="shutter-row">
          <button className="shutter" onClick={capture} disabled={!ready || !!pending || !nextFace} aria-label={t('scan.shutter')}>
            <span className="shutter-inner" />
          </button>
        </div>

        <div className="controls">
          <button className="btn ghost" onClick={resetAll}><FiRefreshCw /> {t('scan.reset')}</button>
          <button className="btn" onClick={() => navigate('manual')}>{t('scan.manualShort')}</button>
        </div>
      </div>
  );
}