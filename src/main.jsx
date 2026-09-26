import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Без StrictMode: он двойным монтированием ломает getUserMedia (двойной запрос
// камеры) и WebGL-контекст 3D-куба в dev-режиме.
createRoot(document.getElementById('root')).render(<App />);

