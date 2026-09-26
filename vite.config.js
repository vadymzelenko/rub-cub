import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // относительные пути — обязательно для Capacitor (файлы грузятся из file://)
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
