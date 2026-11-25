import { useEffect, useRef, useState } from 'react';
import { FiCornerUpLeft, FiGrid, FiZap, FiZapOff, FiCheck, FiRefreshCw } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import {
  sampleFace, buildReferences, classifyRgb, classifyBalanced,
  CUBE_COLORS, ON_COLOR, FACE_ORDER, FACE_NEIGHBORS,
} from '../vision/ColorDetector.js';
import { analyzeState } from '../cube/CubeModel.js';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';
import { warmupSolver } from '../solvers/kociemba.js';

// Scan around the sides first (a quarter turn each time), then top and bottom.
const SCAN_ORDER = ['F', 'R', 'B', 'L', 'U', 'D'];

function drawCover(ctx, video, w, h) {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return false;
  const scale = Math.max(w / vw, h / vh);
  const sw = w / scale, sh = h / scale;
  ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h);
  return true;
}

export default function ScanScreen() {
  const { t } = useT();
  const { navigate } = useNav();
  const stageRef = useRef(null);
  const guideRef = useRef(null);
  const videoRef = useRef(null);
  const trackRef = useRef(null);

  const [live, setLive] = useState(Array(9).fill(null));
  const [faces, setFaces] = useState({}); // face -> { rgb: [9], colors: [9], locked: Set }
  const [pending, setPending] = useState(null);
  const [editCell, setEditCell] = useState(null);
  const [status, setStatus] = useState('starting'); // starting | ready | error
  const [errorMsg, setErrorMsg] = useState('');
  const [torch, setTorch] = useState(null); // null = unsupported, else boolean
  const [flash, setFlash] = useState(false);

  const facesRef = useRef(faces);
  facesRef.current = faces;
  const pendingRef = useRef(null);
  pendingRef.current = pending;
  const liveRgbRef = useRef(null);

  const current = SCAN_ORDER.find((f) => !faces[f]);
  const neighbors = current ? FACE_NEIGHBORS[current] : null;

  useEffect(() => { warmupSolver(); }, []);

  // ---------- camera ----------
  useEffect(() => {
    const canvas = document.createElement('canvas');
    let stream = null, timer = null, disposed = false;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('insecure');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (disposed) { stream.getTracks().forEach((tr) => tr.stop()); return; }
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        try {
          const caps = track.getCapabilities?.();
          if (caps?.torch) setTorch(false);
        } catch { /* ignore */ }
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play().catch(() => {});
        setStatus('ready');
        timer = setInterval(detect, 140);
      } catch (e) {
        if (disposed) return;
        setStatus('error');
        setErrorMsg(e?.name === 'NotAllowedError' ? 'denied' : e?.message === 'insecure' ? 'insecure' : 'unavailable');
      }
    }

    function detect() {
      if (pendingRef.current || document.hidden) return;
      const video = videoRef.current, stage = stageRef.current, guide = guideRef.current;
      if (!video || !stage || !guide || video.readyState < 2) return;
      const sRect = stage.getBoundingClientRect();
      const gRect = guide.getBoundingClientRect();
      // Sample at a modest resolution: plenty for averaging and much cheaper.
      const scale = Math.min(1, 480 / sRect.width);
      const w = Math.max(1, Math.round(sRect.width * scale));
      const h = Math.max(1, Math.round(sRect.height * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!drawCover(ctx, video, w, h)) return;
      const rgb = sampleFace(canvas, {
        x: (gRect.left - sRect.left) * scale,
        y: (gRect.top - sRect.top) * scale,
        size: gRect.width * scale,
      });
      const face = SCAN_ORDER.find((f) => !facesRef.current[f]);
      if (!face) return;
      const centers = Object.fromEntries(Object.entries(facesRef.current).map(([f, d]) => [f, d.rgb[4]]));
      centers[face] = rgb[4];
      const refs = buildReferences(centers);
      const colors = rgb.map((c, i) => (i === 4 ? face : classifyRgb(c, refs)));
      liveRgbRef.current = rgb;
      setLive(colors);
    }

    start();
    return () => {
      disposed = true;
      clearInterval(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
      trackRef.current = null;
    };
  }, []);

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track || torch === null) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch }] });
      setTorch(!torch);
    } catch { setTorch(null); }
  };

  // ---------- capture flow ----------
  const capture = () => {
    if (!current || pending || !liveRgbRef.current || live.some((c) => !c)) return;
    navigator.vibrate?.(12);
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    setPending({ face: current, rgb: liveRgbRef.current, colors: [...live], locked: new Set() });
  };

  const setPendingColor = (f) => {
    setPending((p) => {
      const colors = [...p.colors];
      colors[editCell] = f;
      const locked = new Set(p.locked); locked.add(editCell);
      return { ...p, colors, locked };
    });
    setEditCell(null);
  };

  const confirm = () => {
    const next = { ...faces, [pending.face]: pending };
    setPending(null);
    setEditCell(null);
    if (Object.keys(next).length < 6) { setFaces(next); return; }
    finish(next);
  };

  const finish = (all) => {
    const direct = FACE_ORDER.map((f) => all[f].colors.join('')).join('');
    let state = direct;
    if (!analyzeState(direct).valid) {
      // Re-classify everything against the six measured centres, keeping manual fixes.
      const samples = Object.fromEntries(FACE_ORDER.map((f) => [f, all[f].rgb]));
      const locked = {};
      FACE_ORDER.forEach((f, fi) => all[f].locked.forEach((i) => { locked[fi * 9 + i] = all[f].colors[i]; }));
      const balanced = classifyBalanced(samples, locked);
      if (analyzeState(balanced).errors.length < analyzeState(direct).errors.length) state = balanced;
    }
    navigate('review', { faceletState: state }, { replace: true });
  };

  const undo = () => {
    if (pending) { setPending(null); setEditCell(null); return; }
    const done = SCAN_ORDER.filter((f) => faces[f]);
    if (!done.length) return;
    const next = { ...faces };
    delete next[done[done.length - 1]];
    setFaces(next);
  };

  const doneCount = Object.keys(faces).length;

  return (
    <div className="page page-scan">
      <TopBar
        title={t('scan.title')}
        subtitle={t('scan.progress', { n: Math.min(doneCount + 1, 6) })}
        right={torch !== null && (
          <button className={'icon-btn' + (torch ? ' on' : '')} onClick={toggleTorch} aria-label={t('scan.torch')}>
            {torch ? <FiZap size={19} /> : <FiZapOff size={19} />}
          </button>
        )}
      />

      <div className="scan-progress">
        {SCAN_ORDER.map((f) => (
          <span
            key={f}
            className={'scan-chip' + (faces[f] ? ' done' : '') + (f === (pending?.face || current) ? ' current' : '')}
            style={{ '--c': CUBE_COLORS[f] }}
          />
        ))}
      </div>

      <div className="scan-stage" ref={stageRef}>
        <video ref={videoRef} autoPlay muted playsInline className="scan-video" />
        {flash && <div className="scan-flash" />}

        {status === 'starting' && (
          <div className="scan-overlay"><div className="spinner" /><p>{t('scan.starting')}</p></div>
        )}
        {status === 'error' && (
          <div className="scan-overlay">
            <p>{t('scan.err.' + errorMsg)}</p>
            <button className="btn btn-primary" onClick={() => navigate('manual', {}, { replace: true })}>
              <FiGrid /> {t('scan.manual')}
            </button>
          </div>
        )}

        {status === 'ready' && current && !pending && (
          <div className="guide-wrap">
            <div className="guide-strip top" style={{ '--c': CUBE_COLORS[neighbors.top] }} />
            <div className="guide-strip right" style={{ '--c': CUBE_COLORS[neighbors.right] }} />
            <div className="guide-strip bottom" style={{ '--c': CUBE_COLORS[neighbors.bottom] }} />
            <div className="guide-strip left" style={{ '--c': CUBE_COLORS[neighbors.left] }} />
            <div className="guide" ref={guideRef}>
              {live.map((c, i) => (
                <div className="guide-cell" key={i}>
                  <span className="guide-dot" style={{ '--c': c ? CUBE_COLORS[c] : 'transparent' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {pending && (
          <div className="scan-overlay confirm">
            <div className="confirm-card">
              <p className="confirm-title">{t('scan.confirmTitle')}</p>
              <div className="confirm-grid">
                {pending.colors.map((c, i) => (
                  <button
                    key={i}
                    className={'confirm-cell' + (i === 4 ? ' locked' : '') + (editCell === i ? ' editing' : '')}
                    style={{ '--c': CUBE_COLORS[c] }}
                    onClick={() => i !== 4 && setEditCell(i)}
                    disabled={i === 4}
                    aria-label={t('color.' + c)}
                  />
                ))}
              </div>
              {editCell != null
                ? <ColorPicker value={pending.colors[editCell]} onChange={setPendingColor} />
                : <p className="confirm-hint">{t('scan.confirmHint')}</p>}
              <div className="btn-row">
                <button className="btn btn-secondary" onClick={undo}><FiRefreshCw /> {t('scan.rescan')}</button>
                <button className="btn btn-primary grow" onClick={confirm}><FiCheck /> {t('scan.confirm')}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {current && !pending && status === 'ready' && (
        <div className="scan-instruction">
          <span className="face-badge" style={{ background: CUBE_COLORS[current], color: ON_COLOR[current] }}>
            {t('color.' + current)}
          </span>
          <span>{t('scan.instruction', { top: t('color.' + neighbors.top).toLowerCase() })}</span>
        </div>
      )}

      <div className="scan-controls">
        <button className="icon-btn big" onClick={undo} disabled={!doneCount && !pending} aria-label={t('scan.undo')}>
          <FiCornerUpLeft size={22} />
        </button>
        <button
          className="shutter"
          onClick={capture}
          disabled={status !== 'ready' || !!pending || !current}
          aria-label={t('scan.shutter')}
        >
          <span className="shutter-inner" />
        </button>
        <button className="icon-btn big" onClick={() => navigate('manual', {}, { replace: true })} aria-label={t('scan.manual')}>
          <FiGrid size={22} />
        </button>
      </div>
    </div>
  );
}
