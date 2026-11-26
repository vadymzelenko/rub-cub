// PWA helpers: service-worker registration with an update prompt, and the
// "install app" flow (beforeinstallprompt on Chromium, a hint on iOS Safari).
import { useEffect, useState } from 'react';

export const isNative = () => !!window.Capacitor?.isNativePlatform?.();
export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// ---------- install ----------
let deferred = null;
const installListeners = new Set();
const notify = () => installListeners.forEach((l) => l());

addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  notify();
});
addEventListener('appinstalled', () => { deferred = null; notify(); });

/** 'prompt' (one-tap install), 'ios' (show Share → Add to Home Screen hint) or null. */
export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    installListeners.add(l);
    return () => installListeners.delete(l);
  }, []);
  if (isNative() || isStandalone()) return { mode: null };
  if (deferred) {
    return {
      mode: 'prompt',
      install: async () => {
        const e = deferred;
        deferred = null; notify();
        e.prompt();
        await e.userChoice.catch(() => {});
      },
    };
  }
  if (isIOS()) return { mode: 'ios' };
  return { mode: null };
}

// ---------- service worker ----------
let updateSW = null;
let needRefresh = false;
let offlineReady = false;
const swListeners = new Set();
const swNotify = () => swListeners.forEach((l) => l());

export async function registerServiceWorker() {
  if (isNative() || !('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const { registerSW } = await import('virtual:pwa-register');
  updateSW = registerSW({
    onNeedRefresh() { needRefresh = true; swNotify(); },
    onOfflineReady() { offlineReady = true; swNotify(); },
    onRegisteredSW(_url, reg) {
      // Check for a new version every hour while the app stays open.
      if (reg) setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    },
  });
}

export function useServiceWorker() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    swListeners.add(l);
    return () => swListeners.delete(l);
  }, []);
  return {
    needRefresh,
    offlineReady,
    update: () => updateSW?.(true),
    dismiss: () => { needRefresh = false; offlineReady = false; swNotify(); },
  };
}
