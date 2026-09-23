const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '' ||
  window.location.hostname === '0.0.0.0' ||
  window.location.protocol === 'file:'
);

export const API_URL = 
   'https://arpova-drive-api.vercel.app';

export const ROUTES = {
  HOME: '/index.html',
  LOGIN: '/src/pages/Login.html',
  CADASTRO: '/src/pages/cadastro.html',
  DASHBOARD: '/src/pages/telaInicial.html',
  CRONOGRAMA: '/src/pages/cronograma.html',
  DESEMPENHO: '/src/pages/desempenho.html',
  QUESTOES: '/src/pages/questoes.html'
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    CADASTRO: `${API_URL}/auth/register`
  },
  TASK: {
    GET_TASKS: `${API_URL}/task/tasks?id=`,
    USUARIOS: `${API_URL}/task/usuarios`,
    ADMIN_CHECK: `${API_URL}/task/admin-check`,
    INICIAR: (id) => `${API_URL}/task/${encodeURIComponent(id)}/iniciar`,
    CONCLUIR: (id) => `${API_URL}/task/${encodeURIComponent(id)}/concluir`,
    PAUSAR: (id) => `${API_URL}/task/${encodeURIComponent(id)}/pausar`,
    REINICIAR: (id) => `${API_URL}/task/${encodeURIComponent(id)}/reiniciar`
  },
  USUARIOS: {
    ME: `${API_URL}/usuarios/me`,
    CADASTRO: `${API_URL}/cadastro`
  },
  CRONOGRAMA: {
    LISTAR: `${API_URL}/cronograma`,
    CRIAR: `${API_URL}/cronograma`
  },
  MODULO: {
    GET: (contentId, userId) => `${API_URL}/modulo?contentId=${encodeURIComponent(contentId || '')}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`,
    NEXT: `${API_URL}/modulo/next`
  }
};

