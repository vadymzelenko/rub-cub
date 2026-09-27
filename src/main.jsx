import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/600.css';
import '@fontsource/rubik/700.css';
import './index.css';

// Применяем сохранённую тему до отрисовки, чтобы не было «мигания».
try {
  const theme = localStorage.getItem('theme');
  if (theme) document.documentElement.dataset.theme = theme;
} catch { /* ignore */ }

// Без StrictMode: он двойным монтированием ломает getUserMedia (двойной запрос
// камеры) и WebGL-контекст 3D-куба в dev-режиме.
createRoot(document.getElementById('root')).render(<App />);

