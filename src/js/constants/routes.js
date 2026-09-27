const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '' ||
  window.location.hostname === '0.0.0.0' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.endsWith('.local') ||
  window.location.protocol === 'file:'
);

export const API_URL = isLocal
  ? 'http://localhost:3001'
  : 'https://arpova-drive-api.vercel.app';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CADASTRO: '/cadastro',
  DASHBOARD: '/dashboard',
  CRONOGRAMA: '/dashboard#cronograma',
  DESEMPENHO: '/dashboard#desempenho',
  QUESTOES: '/dashboard#questoes',
  SIMULADO: '/dashboard#simulado'
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
    RESET_SCHEDULE: `${API_URL}/task/reset-schedule`,
    REGENERAR_IA: `${API_URL}/task/regenerar-ia`,
    SUGERIR_IA: `${API_URL}/task/sugerir-ia`
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
    CONCLUIR_QUESTAO: `${API_URL}/questoes/concluirQuestao`,
    PERGUNTAS: (materia, bateria) => `${API_URL}/questoes/perguntas?materia=${encodeURIComponent(materia || 'MeioAmbiente')}&bateria=${encodeURIComponent(bateria || 1)}`,
    CONCLUIR_BATERIA: `${API_URL}/questoes/concluirBateria`,
    VERIFICAR_ACESSO: (materia, bateria, userId) => `${API_URL}/questoes/verificarAcesso?materia=${encodeURIComponent(materia || 'MeioAmbiente')}&bateria=${encodeURIComponent(bateria || 1)}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`
  },
  SIMULADO: {
    GET_QUESTOES: (materia) => `${API_URL}/questoes/simulado?materia=${encodeURIComponent(materia || 'Geral')}`,
    CONCLUIR: `${API_URL}/questoes/simulado/concluir`,
    RESULTADOS: (userId) => `${API_URL}/questoes/simulado/resultados?userId=${encodeURIComponent(userId || '')}`
  },
  DESEMPENHO: {
    GET: (userId) => `${API_URL}/desempenho${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`
  },
  AI: {
    CHAT: `${API_URL}/ai/chat`
  }
};

