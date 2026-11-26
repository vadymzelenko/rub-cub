// Tiny persisted settings store (theme, animation speed) shared via a hook.
import { useSyncExternalStore } from 'react';

const KEY = 'rubcub.settings';
const DEFAULTS = { theme: 'system', speed: 'normal' };
export const THEMES = ['system', 'dark', 'light'];
export const SPEEDS = ['slow', 'normal', 'fast'];
export const SPEED_MS = { slow: 1400, normal: 900, fast: 480 };

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    // Migrate keys from older versions.
    const legacyTheme = localStorage.getItem('theme');
    const legacySpeed = localStorage.getItem('cubeSpeed');
    const s = { ...DEFAULTS, ...(legacyTheme ? { theme: legacyTheme } : {}), ...(legacySpeed ? { speed: legacySpeed } : {}), ...raw };
    if (!THEMES.includes(s.theme)) s.theme = DEFAULTS.theme;
    if (!SPEEDS.includes(s.speed)) s.speed = DEFAULTS.speed;
    return s;
  } catch { return { ...DEFAULTS }; }
}

let state = load();
const listeners = new Set();
const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null;

export function resolvedTheme(theme = state.theme) {
  if (theme === 'system') return media?.matches ? 'light' : 'dark';
  return theme;
}

export function applyTheme() {
  const t = resolvedTheme();
  document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'light' ? '#f6f5f2' : '#0b0b0f');
  for (const fn of themeListeners) fn(t);
}
const themeListeners = new Set();
export function onThemeChange(fn) { themeListeners.add(fn); return () => themeListeners.delete(fn); }

media?.addEventListener?.('change', () => { if (state.theme === 'system') applyTheme(); });

export function setSetting(key, value) {
  state = { ...state, [key]: value };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  if (key === 'theme') applyTheme();
  listeners.forEach((l) => l());
}

export function getSettings() { return state; }

export function useSettings() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state,
  );
}
