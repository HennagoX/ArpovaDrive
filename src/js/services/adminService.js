import { ENDPOINTS } from '../constants/routes.js';
import { getModuloUserId } from './moduloService.js';

function getAdminHeaders(extraHeaders = {}) {
    const requesterId = getModuloUserId();
    return {
        'Accept': 'application/json',
        'X-User-Id': requesterId,
        'X-Admin-Id': requesterId,
        ...extraHeaders
    };
}

export async function obterHistoricoPdfAdmin(conteudoId = null, moduloId = null) {
    try {
        const url = ENDPOINTS.MODULOS_CUSTOMIZADOS.HISTORICO(conteudoId, moduloId);
        const response = await fetch(url, {
            headers: getAdminHeaders()
        });

        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.historico) ? data.historico : [];
    } catch {
        return [];
    }
}

export async function reverterHistoricoPdfAdmin(historicoId, targetVersion = 'versao') {
    const response = await fetch(ENDPOINTS.MODULOS_CUSTOMIZADOS.REVERTER(historicoId), {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ targetVersion })
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData?.error || resData?.message || 'Erro ao reverter alteração do módulo.');
    }
    return resData;
}

export async function excluirItemHistoricoPdfAdmin(historicoId) {
    const response = await fetch(ENDPOINTS.MODULOS_CUSTOMIZADOS.HISTORICO_REMOVER(historicoId), {
        method: 'DELETE',
        headers: getAdminHeaders()
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData?.error || resData?.message || 'Erro ao excluir item do histórico.');
    }
    return resData;
}

export async function limparHistoricoPdfAdmin(conteudoId = null, moduloId = null) {
    const url = ENDPOINTS.MODULOS_CUSTOMIZADOS.HISTORICO_LIMPAR(conteudoId, moduloId);
    const response = await fetch(url, {
        method: 'DELETE',
        headers: getAdminHeaders()
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData?.error || resData?.message || 'Erro ao limpar histórico.');
    }
    return resData;
}

const memoryAdminCache = new Map();
const inFlightAdminRequests = new Map();
const ADMIN_CACHE_TTL_MS = 60000;

export function invalidarCacheQuestoesAdmin() {
    for (const key of memoryAdminCache.keys()) {
        if (key.startsWith('questoes_')) {
            memoryAdminCache.delete(key);
        }
    }
}

export function invalidarCacheSimuladosAdmin() {
    for (const key of memoryAdminCache.keys()) {
        if (key.startsWith('simulados_')) {
            memoryAdminCache.delete(key);
        }
    }
}

export async function criarQuestaoAdminAPI(dados) {
    const response = await fetch(ENDPOINTS.QUESTOES.ADMIN_CRIAR, {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(dados)
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData?.error || resData?.message || 'Erro ao criar questão.');
    }
    invalidarCacheQuestoesAdmin();
    return resData;
}

export async function listarQuestoesCustomizadasAPI(materia = null, forceRefresh = false) {
    const cacheKey = `questoes_${materia || 'all'}`;
    const now = Date.now();

    if (!forceRefresh) {
        const cached = memoryAdminCache.get(cacheKey);
        if (cached && (now - cached.timestamp < ADMIN_CACHE_TTL_MS)) {
            return cached.data;
        }
    }

    if (inFlightAdminRequests.has(cacheKey)) {
        return inFlightAdminRequests.get(cacheKey);
    }

    const fetchPromise = (async () => {
        try {
            const url = ENDPOINTS.QUESTOES.ADMIN_LISTAR(materia);
            const response = await fetch(url, {
                headers: getAdminHeaders()
            });

            if (!response.ok) return [];
            const data = await response.json();
            const result = Array.isArray(data?.questoes) ? data.questoes : [];
            memoryAdminCache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
        } catch {
            return [];
        } finally {
            inFlightAdminRequests.delete(cacheKey);
        }
    })();

    inFlightAdminRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
}

export async function removerQuestaoAdminAPI(id) {
    const response = await fetch(ENDPOINTS.QUESTOES.ADMIN_REMOVER(id), {
        method: 'DELETE',
        headers: getAdminHeaders()
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData?.error || resData?.message || 'Erro ao remover questão.');
    }
    invalidarCacheQuestoesAdmin();
    return resData;
}

export async function criarSimuladoAdminAPI(dados) {
    const response = await fetch(ENDPOINTS.SIMULADO.ADMIN_CRIAR, {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(dados)
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData?.error || resData?.message || 'Erro ao criar simulado.');
    }
    invalidarCacheSimuladosAdmin();
    return resData;
}

export async function listarSimuladosCustomizadosAPI(forceRefresh = false) {
    const cacheKey = 'simulados_all';
    const now = Date.now();

    if (!forceRefresh) {
        const cached = memoryAdminCache.get(cacheKey);
        if (cached && (now - cached.timestamp < ADMIN_CACHE_TTL_MS)) {
            return cached.data;
        }
    }

    if (inFlightAdminRequests.has(cacheKey)) {
        return inFlightAdminRequests.get(cacheKey);
    }

    const fetchPromise = (async () => {
        try {
            const response = await fetch(ENDPOINTS.SIMULADO.ADMIN_LISTAR, {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) return [];
            const data = await response.json();
            const result = Array.isArray(data?.simulados) ? data.simulados : [];
            memoryAdminCache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
        } catch {
            return [];
        } finally {
            inFlightAdminRequests.delete(cacheKey);
        }
    })();

    inFlightAdminRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
}

export async function removerSimuladoAdminAPI(id) {
    const response = await fetch(ENDPOINTS.SIMULADO.ADMIN_REMOVER(id), {
        method: 'DELETE',
        headers: getAdminHeaders()
    });

    const resData = await response.json();
    if (!response.ok) {
        throw new Error(resData?.error || resData?.message || 'Erro ao remover simulado.');
    }
    invalidarCacheSimuladosAdmin();
    return resData;
}
