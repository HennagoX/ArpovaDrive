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
    {
      name: 'rewrite-clean-urls',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = (req.url || '').split('?')[0].split('#')[0];
          if (url === '/login' || url === '/Login.html') {
            req.url = req.url.replace(url, '/src/pages/Login.html');
          } else if (url === '/cadastro' || url === '/cadastro.html') {
            req.url = req.url.replace(url, '/src/pages/cadastro.html');
          } else if (url === '/dashboard' || url === '/inicio' || url === '/tutor-ia' || url === '/conteudos' || url === '/questoes' || url === '/cronograma' || url === '/tarefas' || url === '/desempenho' || url === '/telaInicial.html') {
            req.url = req.url.replace(url, '/src/pages/telaInicial.html');
          }
          next();
        });
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
