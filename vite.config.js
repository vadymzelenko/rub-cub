import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true, // доступ с телефона в локальной сети для теста через getUserMedia (нужен https или localhost)
    port: 5173,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: true,
  },
});

