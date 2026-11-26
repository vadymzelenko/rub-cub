import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiRotateCcw } from 'react-icons/fi';
import TopBar from '../components/TopBar.jsx';
import { averageColor, calibrateColor, resetCalibration, CUBE_COLORS, ON_COLOR } from '../vision/ColorDetector.js';
import { useT } from '../i18n.jsx';
import { useNav } from '../navigation.jsx';

const ORDER = ['U', 'D', 'F', 'B', 'R', 'L'];

export default function CalibrateScreen() {
  const { t } = useT();
  const { back } = useNav();
  const stageRef = useRef(null);
  const targetRef = useRef(null);
  const videoRef = useRef(null);

  const [status, setStatus] = useState('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(0);
  const [flash, setFlash] = useState(false);
  const done = step >= ORDER.length;
  const current = ORDER[step];

  useEffect(() => {
    let stream = null, disposed = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('insecure');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (disposed) { stream.getTracks().forEach((tr) => tr.stop()); return; }
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setStatus('ready');
      } catch (e) {
        if (disposed) return;
        setStatus('error');
        setErrorMsg(e?.name === 'NotAllowedError' ? 'denied' : e?.message === 'insecure' ? 'insecure' : 'unavailable');
      }
    })();
    return () => { disposed = true; stream?.getTracks().forEach((tr) => tr.stop()); };
  }, []);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(back, 1100);
    return () => clearTimeout(id);
  }, [done, back]);

  const capture = () => {
    const video = videoRef.current, stage = stageRef.current, target = targetRef.current;
    if (done || !video || !stage || !target || video.readyState < 2) return;
    const sRect = stage.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const scale = Math.min(1, 480 / sRect.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sRect.width * scale);
    canvas.height = Math.round(sRect.height * scale);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const vw = video.videoWidth, vh = video.videoHeight;
    const s = Math.max(canvas.width / vw, canvas.height / vh);
    const sw = canvas.width / s, sh = canvas.height / s;
    ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
    const cx = (tRect.left - sRect.left + tRect.width / 2) * scale;
    const cy = (tRect.top - sRect.top + tRect.height / 2) * scale;
    calibrateColor(current, averageColor(ctx, cx, cy, tRect.width * scale * 0.25));
    navigator.vibrate?.(12);
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    setStep((n) => n + 1);
  };

  return (
    <div className="page page-scan">
      <TopBar
        title={t('calib.title')}
        subtitle={done ? t('calib.allDone') : t('calib.step', { n: step + 1, total: ORDER.length })}
        right={
          <button className="icon-btn" onClick={() => { resetCalibration(); setStep(0); }} aria-label={t('calib.reset')}>
            <FiRotateCcw size={19} />
          </button>
        }
      />

      <div className="scan-progress">
        {ORDER.map((f, i) => (
          <span key={f} className={'scan-chip' + (i < step ? ' done' : '') + (i === step ? ' current' : '')} style={{ '--c': CUBE_COLORS[f] }} />
        ))}
      </div>

      <div className="scan-stage" ref={stageRef}>
        <video ref={videoRef} autoPlay muted playsInline className="scan-video" />
        {flash && <div className="scan-flash" />}
        {status === 'starting' && <div className="scan-overlay"><div className="spinner" /><p>{t('scan.starting')}</p></div>}
        {status === 'error' && <div className="scan-overlay"><p>{t('scan.err.' + errorMsg)}</p></div>}
        {status === 'ready' && !done && (
          <div className="calib-target" ref={targetRef} style={{ '--c': CUBE_COLORS[current] }} />
        )}
        {done && (
          <div className="scan-overlay">
            <span className="done-badge"><FiCheck size={30} /></span>
            <p>{t('calib.allDone')}</p>
          </div>
        )}
      </div>

      {!done && status === 'ready' && (
        <div className="scan-instruction">
          <span className="face-badge" style={{ background: CUBE_COLORS[current], color: ON_COLOR[current] }}>
            {t('color.' + current)}
          </span>
          <span>{t('calib.hint')}</span>
        </div>
      )}

      <div className="scan-controls">
        <span className="icon-btn big invisible" />
        <button className="shutter" onClick={capture} disabled={status !== 'ready' || done} aria-label={t('scan.shutter')}>
          <span className="shutter-inner" />
        </button>
        <button className="icon-btn big text" onClick={back}>{t('calib.skip')}</button>
      </div>
    </div>
  );
}

