import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem, removeLocalItem } from '../utils/storage.js';
import { ENDPOINTS, API_URL } from '../constants/routes.js';
import { TIMING } from '../constants/timing.js';
import { getHttpErrorMessage, getNetworkErrorMessage } from '../constants/messages.js';

export const MOCK_STORAGE_KEY = 'aprovadrive_mock_dia';

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
    }

    const stored = getLocalItem(MOCK_STORAGE_KEY, null);
    if (stored && stored !== 'auto' && stored !== 'real') {
        return String(stored).toLowerCase().trim();
    }

    return null;
}

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
export const DEFAULT_USER_ID = '352cdb5d-e451-4573-a8fc-58cc38f69d71';

export function getUsuarioAtivoId(userId) {
    if (userId && typeof userId === 'string' && userId.trim()) {
        return userId.trim();
    }

    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    const authId = authUser?.id_usuario || authUser?.id || authUser?.userId;

    const storedId = getLocalItem(ACTIVE_USER_KEY, null);
    if (storedId && typeof storedId === 'string' && storedId.trim()) {
        if (authUser && (authUser.is_admin || authUser.isAdmin)) {
            return storedId.trim();
        }
    }

    if (authId && typeof authId === 'string' && authId.trim()) {
        setLocalItem(ACTIVE_USER_KEY, authId.trim());
        return authId.trim();
    }

    if (storedId && typeof storedId === 'string' && storedId.trim()) {
        return storedId.trim();
    }

    setLocalItem(ACTIVE_USER_KEY, DEFAULT_USER_ID);
    return DEFAULT_USER_ID;
}

export function setUsuarioAtivoId(userId) {
    if (userId && typeof userId === 'string') {
        setLocalItem(ACTIVE_USER_KEY, userId.trim());
    }
}

export async function verificarPermissaoAdmin(userId = null) {
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    if (!authUser) return false;

    if (authUser.is_admin || authUser.isAdmin) {
        return true;
    }

    const authId = authUser.id_usuario || authUser.id || authUser.userId;
    if (!authId) return false;

    try {
        const response = await fetch(`${ENDPOINTS.TASK.ADMIN_CHECK}?id=${encodeURIComponent(authId)}`, {
            headers: {
                'Accept': 'application/json',
                'X-User-Id': authId,
                'X-Admin-Id': authId
            }
        });
        if (!response.ok) return false;
        const data = await response.json();
        if (data && data.isAdmin) {
            authUser.is_admin = true;
            authUser.isAdmin = true;
            setLocalItem(STORAGE_KEYS.AUTH_USER, authUser);
            return true;
        }
        return false;
    } catch {
        return Boolean(authUser.is_admin || authUser.isAdmin);
    }
}

export async function getUsuariosCadastrados(adminId = null) {
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    const requester = adminId || authUser?.id_usuario || authUser?.id || authUser?.userId;
    try {
        const response = await fetch(ENDPOINTS.TASK.USUARIOS, {
            headers: {
                'Accept': 'application/json',
                'X-User-Id': requester,
                'X-Admin-Id': requester
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
    }
    return null;
}

export function setCachedTarefas(userId, data) {
    try {
        const usuarioId = getUsuarioAtivoId(userId);
        const mockDia = getMockDia() || 'real';
        const key = `${SESSION_CRONOGRAMA_KEY}_${usuarioId}_${mockDia}`;
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch {
    }
}

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
    }
}

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

export async function getTarefas(userId, forceRefresh = false) {
    const usuarioId = getUsuarioAtivoId(userId);

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
            signal: (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') ? AbortSignal.timeout(TIMING.REQUEST_TIMEOUT) : undefined,
            headers: {
                ...getAuthHeaders(usuarioId),
                ...(mockDia ? { 'X-Mock-Day': mockDia } : {})
            }
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const errorMsg = getHttpErrorMessage(response.status, data?.error, 'Erro ao carregar tarefas da semana.');
            throw new Error(errorMsg);
        }

        if (data && data.dias) {
            setLocalItem(STORAGE_KEYS.CRONOGRAMA, data);
            setCachedTarefas(usuarioId, data);
            return data;
        }

        throw new Error('Nenhuma missão encontrada para esta semana.');
    } catch (err) {
        if (err?.message && (err.message.includes('(Erro HTTP') || err.message === 'Nenhuma missão encontrada para esta semana.')) {
            throw err;
        }
        throw new Error(getNetworkErrorMessage(err));
    }
}

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
        throw new Error(getHttpErrorMessage(response.status, data?.error, 'Erro ao iniciar tarefa.'));
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
        throw new Error(getHttpErrorMessage(response.status, data?.error, 'Erro ao concluir tarefa.'));
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
        throw new Error(getHttpErrorMessage(response.status, data?.error, 'Erro ao pausar tarefa.'));
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
        throw new Error(getHttpErrorMessage(response.status, data?.error, 'Erro ao reiniciar tarefa.'));
    }

    if (data.payload) {
        setLocalItem(STORAGE_KEYS.CRONOGRAMA, data.payload);
    }

    return data;
}

export async function regenerarCronogramaComIA(userId) {
    const usuarioId = getUsuarioAtivoId(userId);
    const mockDia = getMockDia();

    const url = ENDPOINTS.TASK.REGENERAR_IA || `${API_URL}/task/regenerar-ia`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(usuarioId),
            ...(mockDia ? { 'X-Mock-Day': mockDia } : {})
        },
        body: JSON.stringify({
            id_usuario: usuarioId,
            simularDia: mockDia || undefined
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(getHttpErrorMessage(response.status, data?.error, 'Erro ao otimizar missões com IA.'));
    }

    if (data.payload) {
        setLocalItem(STORAGE_KEYS.CRONOGRAMA, data.payload);
        setCachedTarefas(usuarioId, data.payload);
    }

    return data;
}

