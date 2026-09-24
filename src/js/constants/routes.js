const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '' ||
  window.location.hostname === '0.0.0.0' ||
  window.location.protocol === 'file:'
);

export const API_URL = isLocal
  ? 'http://localhost:3001'
  : 'https://arpova-drive-api.vercel.app';

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
    REINICIAR: (id) => `${API_URL}/task/${encodeURIComponent(id)}/reiniciar`,
    RESET_SCHEDULE: `${API_URL}/task/reset-schedule`
  },
  TAREFAS_FIXAS: {
    GET_TASKS: (userId) => `${API_URL}/task/fixas${userId ? `?id=${encodeURIComponent(userId)}` : ''}`,
    CONCLUIR: (taskId) => `${API_URL}/task/fixas/${encodeURIComponent(taskId)}/concluir`
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
    GET: (contentId, userId) => `${API_URL}/modulo/${encodeURIComponent(contentId || '')}${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`,
    GET_QUERY: (contentId, userId) => `${API_URL}/modulo?contentId=${encodeURIComponent(contentId || '')}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`,
    NEXT: `${API_URL}/modulo/next`
  },
  QUESTOES: {
    CONCLUIDAS: (userId, materia) => `${API_URL}/questoes/concluidas?userId=${encodeURIComponent(userId || '')}${materia ? `&materia=${encodeURIComponent(materia)}` : ''}`,
    CHECK_ACERTO: `${API_URL}/questoes/checkAcerto`,
    CHECK_QUESTAO: `${API_URL}/questoes/checkQuestao`,
    CONCLUIR_QUESTAO: `${API_URL}/questoes/concluirQuestao`
  }
};
