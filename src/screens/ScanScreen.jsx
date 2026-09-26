import { useEffect, useRef, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { cameraCapture } from '../vision/CameraCapture.js';
import { sampleFaceColors, CUBE_COLORS, FACE_ORDER } from '../vision/ColorDetector.js';
import { validateState } from '../cube/CubeModel.js';
import { FiRefreshCw } from 'react-icons/fi';
import { useT } from '../i18n.jsx';

function drawCover(ctx, video, w, h) {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return;
  const scale = Math.max(w / vw, h / vh);
  const sw = w / scale, sh = h / scale;
  ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h);
}

export default function ScanScreen({ navigate, algorithm }) {
  const { t } = useT();
  const stageRef = useRef(null);
  const guideRef = useRef(null);
  const videoRef = useRef(null);

  const [colors, setColors] = useState(Array(9).fill(null));
  const [captured, setCaptured] = useState({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);

  const capturedRef = useRef({});
  const pendingRef = useRef(false);
  const stableRef = useRef({ last: null, count: 0 });

  const nextFace = FACE_ORDER.find((f) => !captured[f]);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    let timer = null;
    let disposed = false;

    async function init() {
      try {
        const stream = await cameraCapture.start();
        if (disposed) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute('muted', '');
        video.muted = true;
        try { await video.play(); } catch (e) { /* ignore */ }
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

      const cols = sampleFaceColors(canvas, {
        x: (gRect.left - sRect.left) * dpr,
        y: (gRect.top - sRect.top) * dpr,
        size: gRect.width * dpr,
      });

      // Центр фиксирован — не сканируем его, он определяет грань.
      const face = FACE_ORDER.find((f) => !capturedRef.current[f]);
      if (face) cols[4] = face;
      setColors(cols);
      if (!face) return;

      const key = cols.join('');
      const st = stableRef.current;
      if (key === st.last) st.count++; else { st.last = key; st.count = 1; }

      if (st.count >= 3 && cols.every((c) => c)) {
        st.last = null; st.count = 0;
        pendingRef.current = true;
        setPending({ face, colors: [...cols] });
      }
    }

    init();
    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
      cameraCapture.stop();
    };
  }, []);

  useEffect(() => {
    if (Object.keys(captured).length === 6) {
      const facelet = FACE_ORDER.map((f) => captured[f].join('')).join('');
      if (validateState(facelet).valid) navigate('review', { faceletState: facelet, algorithm });
      else { capturedRef.current = {}; setCaptured({}); }
    }
  }, [captured, algorithm, navigate]);

  const confirmPending = () => {
    if (!pending) return;
    capturedRef.current[pending.face] = pending.colors;
    setCaptured({ ...capturedRef.current });
    pendingRef.current = false;
    setPending(null);
  };

  const cancelPending = () => {
    stableRef.current = { last: null, count: 0 };
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

  return (
    <div className="app">
      <TopBar title={t('scan.title')} onBack={() => navigate('solverEntry')} />

      <div className="scan-stage" ref={stageRef}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {!ready && !error && (
          <div className="scan-placeholder">
            <div className="spinner" />
            <div>{t('scan.starting')}</div>
          </div>
        )}

        {error && (
          <div className="scan-placeholder">
            <div>{error}</div>
            <button className="btn primary" onClick={() => navigate('manual', { algorithm })}>{t('scan.manual')}</button>
          </div>
        )}

        {ready && !pending && (
          <div className="scan-guide" ref={guideRef}>
            {colors.map((c, i) => (
              <div className="gcell" key={i}>
                <div className="dot" style={{ background: c ? CUBE_COLORS[c] : 'rgba(255,255,255,0.12)' }} />
              </div>
            ))}
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

      <div className="row" style={{ marginTop: 14, justifyContent: 'center', gap: 10 }}>
        {FACE_ORDER.map((f) => (
          <div key={f} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: CUBE_COLORS[f],
            border: '2px solid ' + (captured[f] ? 'var(--success)' : 'var(--border)'),
            opacity: captured[f] ? 1 : 0.35,
            transition: 'opacity 0.2s, border-color 0.2s',
          }} />
        ))}
      </div>

      <div className="status" style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {!nextFace ? t('scan.allDone') : (
          <>
            {t('scan.showFace')}
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: CUBE_COLORS[nextFace], border: '1px solid var(--border-strong)', flexShrink: 0 }} />
          </>
        )}
      </div>

      <div className="controls">
        <button className="btn ghost" onClick={resetAll}><FiRefreshCw /> {t('scan.reset')}</button>
        <button className="btn" onClick={() => navigate('manual', { algorithm })}>{t('scan.manualShort')}</button>
      </div>
    </div>
  );
}

  };
