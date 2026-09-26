import { useEffect, useRef, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { cameraCapture } from '../vision/CameraCapture.js';
import { sampleFaceColors, CUBE_COLORS, FACE_ORDER, FACE_LABELS } from '../vision/ColorDetector.js';
import { validateState } from '../cube/CubeModel.js';
import { FiCheck, FiRefreshCw } from 'react-icons/fi';

// Рисует видео в canvas с сохранением object-fit: cover (как в CSS).
function drawCover(ctx, video, w, h) {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return;
  const scale = Math.max(w / vw, h / vh);
  const sw = w / scale, sh = h / scale;
  const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
}

export default function ScanScreen({ navigate, algorithm }) {
  const stageRef = useRef(null);
  const guideRef = useRef(null);
  const videoWrapRef = useRef(null);

  const [colors, setColors] = useState(Array(9).fill(null));
  const [captured, setCaptured] = useState({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const capturedRef = useRef({});
  const stableRef = useRef({ last: null, count: 0 });

  useEffect(() => {
    const canvas = document.createElement('canvas');
    let timer = null;
    let disposed = false;

    async function init() {
      try {
        const video = await cameraCapture.start();
        if (disposed) return;
        videoWrapRef.current.appendChild(video);
        setReady(true);
        timer = setInterval(() => detect(video), 160);
      } catch (e) {
        setError('Камера недоступна (' + (e.message || 'нет доступа') + '). Нужен HTTPS или localhost.');
      }
    }

    function detect(video) {
      const stage = stageRef.current, guide = guideRef.current;
      if (!stage || !guide || video.readyState < 2) return;

      const sRect = stage.getBoundingClientRect();
      const gRect = guide.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const w = Math.max(1, Math.round(sRect.width * dpr));
      const h = Math.max(1, Math.round(sRect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      drawCover(ctx, video, w, h);

      const rect = {
        x: (gRect.left - sRect.left) * dpr,
        y: (gRect.top - sRect.top) * dpr,
        size: gRect.width * dpr,
      };
      const cols = sampleFaceColors(canvas, rect);
      setColors(cols);

      // Автозахват: стабильные 2 кадра + центр = новая грань.
      const key = cols.join('');
      const st = stableRef.current;
      if (key === st.last) st.count++;
      else { st.last = key; st.count = 1; }

      if (st.count >= 2 && cols.every((c) => c)) {
        const center = cols[4];
        if (!capturedRef.current[center]) {
          capturedRef.current[center] = cols;
          setCaptured({ ...capturedRef.current });
          st.last = null;
          st.count = 0;
        }
      }
    }

    init();
    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
      cameraCapture.stop();
    };
  }, []);

  // Когда все 6 граней собраны — собираем facelet-строку и идём на проверку.
  useEffect(() => {
    if (Object.keys(captured).length === 6) {
      const facelet = FACE_ORDER.map((f) => captured[f].join('')).join('');
      if (validateState(facelet).valid) {
        navigate('review', { faceletState: facelet, algorithm });
      } else {
        capturedRef.current = {};
        setCaptured({});
      }
    }
  }, [captured, algorithm, navigate]);

  const remaining = FACE_ORDER.filter((f) => !captured[f]);

  return (
    <div className="app">
      <TopBar title="Скан кубика" onBack={() => navigate('solverEntry')} />

      <div className="scan-stage" ref={stageRef}>
        <div ref={videoWrapRef} style={{ position: 'absolute', inset: 0 }} />

        {!ready && !error && (
          <div className="scan-placeholder">
            <div className="spinner" />
            <div>Включаем камеру…</div>
          </div>
        )}

        {error && (
          <div className="scan-placeholder">
            <div>{error}</div>
            <button className="btn primary" onClick={() => navigate('manual', { algorithm })}>Ввести вручную</button>
          </div>
        )}

        {ready && (
          <div className="scan-guide" ref={guideRef}>
            {colors.map((c, i) => (
              <div className="gcell" key={i}>
                <div className="dot" style={{ background: c ? CUBE_COLORS[c] : 'rgba(255,255,255,0.12)' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="row" style={{ marginTop: 14, justifyContent: 'center', gap: 8 }}>
        {FACE_ORDER.map((f) => (
          <div key={f} className="status" style={{
            minHeight: 0, padding: '4px 9px', borderRadius: 8,
            border: '1px solid var(--border)', fontSize: 12,
            color: captured[f] ? 'var(--success)' : 'var(--muted)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {captured[f] ? <FiCheck size={12} /> : null}{f}
          </div>
        ))}
      </div>

      <div className="status" style={{ marginTop: 10 }}>
        {remaining.length === 0 ? 'Все грани получены — проверяем…' : `Покажите камере: ${FACE_LABELS[remaining[0]]}`}
      </div>

      <div className="controls">
        <button className="btn ghost" onClick={() => { capturedRef.current = {}; setCaptured({}); }}>
          <FiRefreshCw /> Сбросить
        </button>
        <button className="btn" onClick={() => navigate('manual', { algorithm })}>Вручную</button>
      </div>
    </div>
  );
}
