const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = isLocal 
  ? 'http://localhost:3000' 
  : 'https://arpovadriveapi.onrender.com';

  console.log(API_URL);
export const ROUTES = {
  HOME: '/index.html',
  LOGIN: '/src/pages/Login.html',
  CADASTRO: '/src/pages/cadastro.html',
  DASHBOARD: '/src/pages/telaInicial.html',
  CRONOGRAMA: '/src/pages/cronograma.html',
  DESEMPENHO: '/src/pages/desempenho.html'
};


export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    CADASTRO: `${API_URL}/auth/register`
  },
  TASK: {
    GET_TASKS: `${API_URL}/task/tasks?id=`,
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
  }
  
};
