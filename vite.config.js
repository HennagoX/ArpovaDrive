import fs from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: '.',
  plugins: [
    {
      name: 'copy-pdfs',
      closeBundle() {
        if (fs.existsSync('assets/PDFs')) {
          fs.cpSync('assets/PDFs', 'dist/assets/PDFs', { recursive: true });
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'src/pages/telaInicial.html'),
        login: resolve(__dirname, 'src/pages/Login.html'),
        cadastro: resolve(__dirname, 'src/pages/cadastro.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
