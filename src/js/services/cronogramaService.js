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
 * Consulta a lista de usuários cadastrados no banco de dados através da API.
 * @returns {Promise<Array>}
 */
export async function getUsuariosCadastrados() {
    try {
        const response = await fetch(ENDPOINTS.TASK.USUARIOS, {
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return data.usuarios || [];
    } catch (err) {
        console.warn('Aviso ao buscar usuários cadastrados via API:', err.message);
        return [
            { id_usuario: '0b0c0d89-2cea-48ad-9988-928337357643', nome: 'Henrique', email: 'Henrique@gmail.com', exp: 690 },
            { id_usuario: 'e57b1624-39af-4ef1-b909-2dec1253981b', nome: 'Ronaldo', email: 'Ronaldo@gmail.com', exp: 0 },
            { id_usuario: 'f00af674-40eb-411b-bfe6-304b6781d8c4', nome: 'Joao', email: 'Joao@gmail.com', exp: 225 },
            { id_usuario: '23edb2bb-da1a-4391-93cb-9f5eaddcfaae', nome: 'Carlos', email: 'Carlos@gmail.com', exp: 50 }
        ];
    }
}

/**
 * Busca o payload de tarefas do usuário selecionado na API AprovaDrive.
 * Lança erro caso a API recuse a requisição (ex: usuário não cadastrado).
 * 
 * @param {string} [userId] - Identificador único do usuário
 * @returns {Promise<Object>} Payload contendo taskAtual, dias da semana e tarefas
 */
export async function getTarefas(userId) {
    const usuarioId = getUsuarioAtivoId(userId);
    const mockDia = getMockDia();
    const mockQuery = mockDia ? `&simularDia=${encodeURIComponent(mockDia)}` : '';

    const url = `${ENDPOINTS.TASK.GET_TASKS}${encodeURIComponent(usuarioId)}${mockQuery}`;
    
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'X-User-Id': usuarioId,
            ...(mockDia ? { 'X-Mock-Day': mockDia } : {})
        }
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const errorMsg = data?.error || `Erro ${response.status} ao carregar tarefas da semana.`;
        throw new Error(errorMsg);
    }

    if (data) {
        setLocalItem(STORAGE_KEYS.CRONOGRAMA, data);
        return data;
    }

    throw new Error('Nenhum dado retornado pela API.');
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
            'Accept': 'application/json',
            'X-User-Id': usuarioId,
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
            'Accept': 'application/json',
            'X-User-Id': usuarioId,
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
            'Accept': 'application/json',
            'X-User-Id': usuarioId,
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
            'Accept': 'application/json',
            'X-User-Id': usuarioId,
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
