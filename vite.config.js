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
          if (url === '/src/pages/Login.html' || url === '/src/pages/Login' || url === '/Login.html') {
            res.writeHead(302, { Location: '/login' });
            res.end();
            return;
          }
          if (url === '/src/pages/cadastro.html' || url === '/src/pages/cadastro' || url === '/cadastro.html') {
            res.writeHead(302, { Location: '/cadastro' });
            res.end();
            return;
          }
          if (url === '/src/pages/telaInicial.html' || url === '/src/pages/telaInicial' || url === '/telaInicial.html') {
            res.writeHead(302, { Location: '/dashboard' });
            res.end();
            return;
          }
          if (url === '/login') {
            req.url = req.url.replace('/login', '/src/pages/Login.html');
          } else if (url === '/cadastro') {
            req.url = req.url.replace('/cadastro', '/src/pages/cadastro.html');
          } else if (url === '/dashboard' || url === '/inicio' || url === '/tutor-ia' || url === '/conteudos' || url === '/questoes' || url === '/cronograma' || url === '/tarefas' || url === '/desempenho') {
            req.url = req.url.replace(url, '/src/pages/telaInicial.html');
          } else if (url.startsWith('/css/')) {
            req.url = req.url.replace('/css/', '/src/css/');
          } else if (url.startsWith('/js/')) {
            req.url = req.url.replace('/js/', '/src/js/');
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
