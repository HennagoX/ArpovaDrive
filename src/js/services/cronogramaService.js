import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem, removeLocalItem } from '../utils/storage.js';
import { ENDPOINTS, API_URL } from '../constants/routes.js';

export const MOCK_STORAGE_KEY = 'aprovadrive_mock_dia';

/**
 * Obtém o dia simulado (mock) ativo no sistema, caso exista.
 * Pode ser definido via query param na URL (?simularDia=quarta) ou salvo no storage.
 * @returns {string|null}
 */
export function getMockDia() {
    try {
        if (typeof window !== 'undefined' && window.location) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlMock = urlParams.get('simularDia') || urlParams.get('mockDay') || urlParams.get('dia');
            if (urlMock) {
                const normalized = urlMock.toLowerCase().trim();
                setLocalItem(MOCK_STORAGE_KEY, normalized);
                return normalized;
            }
        }
    } catch {
        // Fallback para storage
    }

    const stored = getLocalItem(MOCK_STORAGE_KEY, null);
    if (stored && stored !== 'auto' && stored !== 'real') {
        return String(stored).toLowerCase().trim();
    }

    return null;
}

/**
 * Define ou limpa o dia simulado (mock).
 * @param {string|null} dia - Nome do dia ('quarta', 'terca', etc) ou 'auto' para voltar ao tempo real
 */
export function setMockDia(dia) {
    if (!dia || dia === 'auto' || dia === 'real') {
        removeLocalItem(MOCK_STORAGE_KEY);
    } else {
        setLocalItem(MOCK_STORAGE_KEY, String(dia).toLowerCase().trim());
    }
}

export function getDiaSemanaAtual() {
    const mock = getMockDia();
    if (mock) {
        const mapa = {
            segunda: 1,
            'segunda-feira': 1,
            '1': 1,
            terca: 2,
            terça: 2,
            'terca-feira': 2,
            '2': 2,
            quarta: 3,
            'quarta-feira': 3,
            '3': 3,
            quinta: 4,
            'quinta-feira': 4,
            '4': 4,
            sexta: 5,
            'sexta-feira': 5,
            '5': 5,
            sabado: 6,
            sábado: 6,
            '6': 6
        };
        if (mapa[mock] !== undefined) {
            return mapa[mock];
        }
    }

    const hoje = new Date();
    const dia = hoje.getDay();
    return (dia >= 1 && dia <= 6) ? dia : 1;
}

export function getNomesDias() {
    return {
        1: 'Segunda-feira',
        2: 'Terça-feira',
        3: 'Quarta-feira',
        4: 'Quinta-feira',
        5: 'Sexta-feira',
        6: 'Sábado'
    };
}
export const MAPA_DIAS = {
    1: 'segunda',
    2: 'terca',
    3: 'quarta',
    4: 'quinta',
    5: 'sexta',
    6: 'sabado'
};

export function getChaveDia(diaNum) {
    return MAPA_DIAS[diaNum] || 'segunda';
}

export function getNumeroDia(chaveDia) {
    const entry = Object.entries(MAPA_DIAS).find(([, val]) => val === chaveDia);
    return entry ? parseInt(entry[0], 10) : 1;
}

export const ACTIVE_USER_KEY = 'aprovadrive_active_user_id';
export const DEFAULT_USER_ID = '0b0c0d89-2cea-48ad-9988-928337357643'; // Henrique (Cadastrado)

/**
 * Obtém o ID do usuário ativo no sistema.
 * Prioriza o argumento passado, depois o storage de usuário ativo, depois auth_user, e por fim o padrão Henrique.
 * @param {string} [userId]
 * @returns {string}
 */
export function getUsuarioAtivoId(userId) {
    if (userId && typeof userId === 'string' && userId.trim()) {
        return userId.trim();
    }

    const storedId = getLocalItem(ACTIVE_USER_KEY, null);
    if (storedId && typeof storedId === 'string' && storedId.trim()) {
        return storedId.trim();
    }

    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    const authId = authUser?.id_usuario || authUser?.id || authUser?.userId;
    if (authId && typeof authId === 'string' && authId.trim()) {
        setLocalItem(ACTIVE_USER_KEY, authId.trim());
        return authId.trim();
    }

    // Default garantido cadastrado no banco PostgreSQL (Henrique)
    setLocalItem(ACTIVE_USER_KEY, DEFAULT_USER_ID);
    return DEFAULT_USER_ID;
}

/**
 * Define o usuário ativo selecionado no sistema.
 * @param {string} userId
 */
export function setUsuarioAtivoId(userId) {
    if (userId && typeof userId === 'string') {
        setLocalItem(ACTIVE_USER_KEY, userId.trim());
    }
}

/**
 * Verifica junto à API se o usuário informado possui permissões de Administrador.
 * @param {string} [userId]
 * @returns {Promise<boolean>}
 */
export async function verificarPermissaoAdmin(userId) {
    const usuarioId = getUsuarioAtivoId(userId);
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);

    if (authUser && (authUser.id === usuarioId || authUser.id_usuario === usuarioId) && (authUser.is_admin || authUser.isAdmin)) {
        return true;
    }

    try {
        const response = await fetch(`${ENDPOINTS.TASK.ADMIN_CHECK}?id=${encodeURIComponent(usuarioId)}`, {
            headers: {
                'Accept': 'application/json',
                'X-User-Id': usuarioId
            }
        });
        if (!response.ok) return false;
        const data = await response.json();
        return Boolean(data.isAdmin);
    } catch {
        return false;
    }
}

/**
 * Consulta a lista de usuários cadastrados no banco de dados através da API.
 * RESTRITO: Apenas executado com sucesso se o usuário for o Administrador.
 * @param {string} [adminId]
 * @returns {Promise<Array>}
 */
export async function getUsuariosCadastrados(adminId) {
    const requester = getUsuarioAtivoId(adminId);
    try {
        const response = await fetch(ENDPOINTS.TASK.USUARIOS, {
            headers: { 
                'Accept': 'application/json',
                'X-User-Id': requester
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return data.usuarios || [];
    } catch (err) {
        console.warn('Aviso ao buscar usuários cadastrados via API:', err.message);
        return [];
    }
}

function getAuthHeaders(targetUserId) {
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    const authId = authUser?.id_usuario || authUser?.id || authUser?.userId;
    const isAdm = Boolean(authUser?.is_admin || authUser?.isAdmin);
    const headers = {
        'Accept': 'application/json',
        'X-User-Id': targetUserId
    };
    if (authId) {
        headers['X-Requester-Id'] = authId;
    }
    if (isAdm && authId) {
        headers['X-Admin-Id'] = authId;
    }
    return headers;
}

export const SESSION_CRONOGRAMA_KEY = 'aprovadrive_session_cronograma';

/**
 * Obtém o cronograma cacheado na sessão para o usuário ativo.
 */
export function getCachedTarefas(userId) {
    try {
        const usuarioId = getUsuarioAtivoId(userId);
        const mockDia = getMockDia() || 'real';
        const key = `${SESSION_CRONOGRAMA_KEY}_${usuarioId}_${mockDia}`;
        const raw = sessionStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.dias) {
                return parsed;
            }
        }
    } catch {
        // Fallback
    }
    return null;
}

/**
 * Salva o payload de tarefas na sessão.
 */
export function setCachedTarefas(userId, data) {
    try {
        const usuarioId = getUsuarioAtivoId(userId);
        const mockDia = getMockDia() || 'real';
        const key = `${SESSION_CRONOGRAMA_KEY}_${usuarioId}_${mockDia}`;
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch {
        // Fallback
    }
}

/**
 * Limpa o cache de tarefas da sessão
 */
export function clearCachedTarefas(userId) {
    try {
        if (userId) {
            const mockDia = getMockDia() || 'real';
            sessionStorage.removeItem(`${SESSION_CRONOGRAMA_KEY}_${userId}_${mockDia}`);
        } else {
            Object.keys(sessionStorage).forEach(k => {
                if (k.startsWith(SESSION_CRONOGRAMA_KEY)) {
                    sessionStorage.removeItem(k);
                }
            });
        }
    } catch {
        // Fallback
    }
}

/**
 * Higieniza mensagens de erro para não expor termos técnicos de banco (ex: PostgreSQL) ao aluno.
 */
function sanitizeErrorMessage(msg) {
    if (!msg || typeof msg !== 'string') {
        return 'Não foi possível carregar as missões no momento. Tente novamente.';
    }
    const lower = msg.toLowerCase();
    if (
        lower.includes('postgre') ||
        lower.includes('sql') ||
        lower.includes('database') ||
        lower.includes('banco') ||
        lower.includes('connection') ||
        lower.includes('timeout') ||
        lower.includes('econnrefused') ||
        lower.includes('failed to fetch') ||
        lower.includes('internal server')
    ) {
        return 'O servidor está preparando suas missões. Por favor, tente novamente em instantes.';
    }
    return msg;
}

/**
 * Busca o payload de tarefas do usuário selecionado na API AprovaDrive.
 * Utiliza cache na sessão (sessionStorage) para não reconsultar a API desnecessariamente.
 * 
 * @param {string} [userId] - Identificador único do usuário
 * @param {boolean} [forceRefresh=false] - Forçar nova requisição à API
 * @returns {Promise<Object>} Payload contendo taskAtual, dias da semana e tarefas
 */
export async function getTarefas(userId, forceRefresh = false) {
    const usuarioId = getUsuarioAtivoId(userId);

    // 1. Utiliza cache da sessão para carregamento instantâneo se disponível
    if (!forceRefresh) {
        const cached = getCachedTarefas(usuarioId);
        if (cached) {
            return cached;
        }
    }

    const mockDia = getMockDia();
    const mockQuery = mockDia ? `&simularDia=${encodeURIComponent(mockDia)}` : '';
    const url = `${ENDPOINTS.TASK.GET_TASKS}${encodeURIComponent(usuarioId)}${mockQuery}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                ...getAuthHeaders(usuarioId),
                ...(mockDia ? { 'X-Mock-Day': mockDia } : {})
            }
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const errorMsg = sanitizeErrorMessage(data?.error || `Erro ao carregar tarefas da semana.`);
            throw new Error(errorMsg);
        }

        if (data && data.dias) {
            setLocalItem(STORAGE_KEYS.CRONOGRAMA, data);
            setCachedTarefas(usuarioId, data);
            return data;
        }

        throw new Error('Nenhuma missão encontrada para esta semana.');
    } catch (err) {
        throw new Error(sanitizeErrorMessage(err.message));
    }
}

/**
 * Envia requisição para iniciar uma tarefa.
 * A validação de negócio é realizada exclusivamente na API.
 * 
 * @param {string} taskId - Identificador único da tarefa
 * @param {string} [userId] - Identificador do usuário (opcional)
 * @returns {Promise<Object>} Resposta da API com payload atualizado
 */
export async function iniciarTarefa(taskId, userId) {
    const usuarioId = getUsuarioAtivoId(userId);
    const mockDia = getMockDia();

    const url = ENDPOINTS.TASK.INICIAR ? ENDPOINTS.TASK.INICIAR(taskId) : `${API_URL}/task/${encodeURIComponent(taskId)}/iniciar`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(usuarioId),
            ...(mockDia ? { 'X-Mock-Day': mockDia } : {})
        },
        body: JSON.stringify({
            id_usuario: usuarioId,
            taskId,
            simularDia: mockDia || undefined
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar tarefa.');
    }

    if (data.payload) {
        setLocalItem(STORAGE_KEYS.CRONOGRAMA, data.payload);
        setCachedTarefas(usuarioId, data.payload);
    }

    return data;
}

export async function concluirTarefa(taskId, userId, options = {}) {
    const usuarioId = getUsuarioAtivoId(userId);
    const mockDia = getMockDia();

    const url = ENDPOINTS.TASK.CONCLUIR ? ENDPOINTS.TASK.CONCLUIR(taskId) : `${API_URL}/task/${encodeURIComponent(taskId)}/concluir`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(usuarioId),
            ...(mockDia ? { 'X-Mock-Day': mockDia } : {})
        },
        body: JSON.stringify({
            id_usuario: usuarioId,
            taskId,
            simularDia: mockDia || undefined,
            force: Boolean(options.force)
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Erro ao concluir tarefa.');
    }

    if (data.payload) {
        setLocalItem(STORAGE_KEYS.CRONOGRAMA, data.payload);
        setCachedTarefas(usuarioId, data.payload);
    }

    return data;
}

export async function pausarTarefa(taskId, userId) {
    const usuarioId = getUsuarioAtivoId(userId);
    const mockDia = getMockDia();

    const url = ENDPOINTS.TASK.PAUSAR ? ENDPOINTS.TASK.PAUSAR(taskId) : `${API_URL}/task/${encodeURIComponent(taskId)}/pausar`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(usuarioId),
            ...(mockDia ? { 'X-Mock-Day': mockDia } : {})
        },
        body: JSON.stringify({
            id_usuario: usuarioId,
            taskId,
            simularDia: mockDia || undefined
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Erro ao pausar tarefa.');
    }

    if (data.payload) {
        setLocalItem(STORAGE_KEYS.CRONOGRAMA, data.payload);
    }

    return data;
}

export async function reiniciarTarefa(taskId, userId) {
    const usuarioId = getUsuarioAtivoId(userId);
    const mockDia = getMockDia();

    const url = ENDPOINTS.TASK.REINICIAR ? ENDPOINTS.TASK.REINICIAR(taskId) : `${API_URL}/task/${encodeURIComponent(taskId)}/reiniciar`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(usuarioId),
            ...(mockDia ? { 'X-Mock-Day': mockDia } : {})
        },
        body: JSON.stringify({
            id_usuario: usuarioId,
            taskId,
            simularDia: mockDia || undefined
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Erro ao reiniciar tarefa.');
    }

    if (data.payload) {
        setLocalItem(STORAGE_KEYS.CRONOGRAMA, data.payload);
    }

    return data;
}
