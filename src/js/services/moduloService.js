
import { ENDPOINTS } from '../constants/routes.js';
import { getCurrentUser } from './authService.js';
import { getUsuarioAtivoId } from './cronogramaService.js';
import { getLocalItem, setLocalItem } from '../utils/storage.js';
import { TIMING } from '../constants/timing.js';
import { getHttpErrorMessage } from '../constants/messages.js';

const STORAGE_PREFIX = 'aprovadrive_modulo_progresso_';
const inFlightRequests = new Map();
const lastFetchTimestamps = new Map();
const CACHE_TTL_MS = 25000;

export const MAX_MODULO = 999;

export function getModuloUserId(userId) {
    if (userId && typeof userId === 'string' && userId.trim()) {
        return userId.trim();
    }
    return getUsuarioAtivoId();
}

export function getModuloStorageKey(contentId, userId) {
    const activeUserId = getModuloUserId(userId);
    return `${STORAGE_PREFIX}${contentId}_${activeUserId}`;
}

export function getModuloAtualCached(contentId, userId) {
    if (!contentId) return 1;
    const storageKey = getModuloStorageKey(contentId, userId);
    const cached = getLocalItem(storageKey, null);
    if (cached !== null && !isNaN(Number(cached))) {
        return Math.max(1, Number(cached));
    }
    return 1;
}

export function setModuloAtualCached(contentId, moduloNumero, userId) {
    if (!contentId) return;
    const storageKey = getModuloStorageKey(contentId, userId);
    const num = Math.max(1, Number(moduloNumero || 1));
    setLocalItem(storageKey, num);
    lastFetchTimestamps.set(storageKey, Date.now());
}

export async function getModuloAtual(contentId, userId, options = {}) {
    if (!contentId) return { conteudo: '', modulo_atual: 1 };

    const activeUserId = getModuloUserId(userId);
    const storageKey = getModuloStorageKey(contentId, activeUserId);
    const cachedValue = getModuloAtualCached(contentId, activeUserId);

    const now = Date.now();
    const lastFetch = lastFetchTimestamps.get(storageKey) || 0;
    const isCacheFresh = (now - lastFetch) < CACHE_TTL_MS;

    if (isCacheFresh && !options.forceRefresh) {
        return {
            conteudo: contentId,
            modulo_atual: cachedValue,
            fromCache: true,
            mudou: false
        };
    }

    if (inFlightRequests.has(storageKey)) {
        return inFlightRequests.get(storageKey);
    }

    const fetchPromise = (async () => {
        try {
            const url = ENDPOINTS.MODULO.GET(contentId, activeUserId);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-User-Id': activeUserId
                }
            });

            if (response.ok) {
                const data = await response.json();
                const moduloAtual = Math.max(1, Number(data.modulo_atual || 1));
                const mudou = moduloAtual !== cachedValue;

                setLocalItem(storageKey, moduloAtual);
                lastFetchTimestamps.set(storageKey, Date.now());

                return {
                    conteudo: data.conteudo || contentId,
                    modulo_atual: moduloAtual,
                    mudou,
                    fromCache: false
                };
            }
        } catch (err) {
            console.warn(`[ModuloService] Backend offline ou rota inacessível (${contentId}):`, err.message);
        } finally {
            inFlightRequests.delete(storageKey);
        }

        return {
            conteudo: contentId,
            modulo_atual: cachedValue,
            fromCache: true,
            mudou: false
        };
    })();

    inFlightRequests.set(storageKey, fetchPromise);
    return fetchPromise;
}

export async function avancarModulo(contentId, userId, maxModulos = null) {
    if (!contentId) {
        throw new Error('Conteúdo não informado.');
    }

    const activeUserId = getModuloUserId(userId);
    const storageKey = getModuloStorageKey(contentId, activeUserId);
    const cachedAtual = getModuloAtualCached(contentId, activeUserId);

    if (maxModulos && cachedAtual >= maxModulos) {
        return {
            success: true,
            conteudo: contentId,
            modulo_atual: maxModulos,
            modulo_anterior: maxModulos,
            xp_ganha: 0,
            message: `Você já concluiu todos os ${maxModulos} módulos de ${contentId}.`
        };
    }

    const proximoEsperado = maxModulos ? Math.min(maxModulos, cachedAtual + 1) : cachedAtual + 1;

    setLocalItem(storageKey, proximoEsperado);
    lastFetchTimestamps.set(storageKey, Date.now());

    try {
        const response = await fetch(ENDPOINTS.MODULO.NEXT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-User-Id': activeUserId
            },
            body: JSON.stringify({
                contentId,
                id: contentId,
                userId: activeUserId,
                id_usuario: activeUserId
            })
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const errorMsg = getHttpErrorMessage(response.status, data?.error, 'Erro ao avançar para o próximo módulo.');
            throw new Error(errorMsg);
        }

        const moduloAtual = Math.max(proximoEsperado, Number(data.modulo_atual || proximoEsperado));
        const xpGanha = typeof data?.xp_ganha === 'number' ? data.xp_ganha : (moduloAtual > cachedAtual ? 25 : 0);
        setLocalItem(storageKey, moduloAtual);
        lastFetchTimestamps.set(storageKey, Date.now());

        return {
            success: true,
            conteudo: data.conteudo || contentId,
            modulo_atual: moduloAtual,
            modulo_anterior: data.modulo_anterior || cachedAtual,
            xp_ganha: xpGanha,
            message: data.message || `Avançou para o Módulo ${moduloAtual} com sucesso!`
        };
    } catch (err) {
        console.warn('[ModuloService] Erro na requisição à API, aplicando avanço no localStorage:', err.message);

        return {
            success: true,
            conteudo: contentId,
            modulo_atual: proximoEsperado,
            modulo_anterior: cachedAtual,
            xp_ganha: proximoEsperado > cachedAtual ? 25 : 0,
            message: `Avançou para o Módulo ${proximoEsperado}!`
        };
    }
}

export async function setPonteiroModulo(contentId, novoNumero, userId) {
    if (!contentId) {
        throw new Error('Conteúdo não informado.');
    }
    const num = Math.max(1, Number(novoNumero || 1));
    const activeUserId = getModuloUserId(userId);
    const storageKey = getModuloStorageKey(contentId, activeUserId);

    setLocalItem(storageKey, num);
    lastFetchTimestamps.set(storageKey, Date.now());

    try {
        const response = await fetch(ENDPOINTS.MODULO.SET || `${API_URL}/modulo/set`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-User-Id': activeUserId
            },
            body: JSON.stringify({
                contentId,
                id: contentId,
                userId: activeUserId,
                id_usuario: activeUserId,
                numero: num
            })
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const errorMsg = getHttpErrorMessage(response.status, data?.error, 'Erro ao definir ponteiro do módulo.');
            throw new Error(errorMsg);
        }

        const moduloAtual = Math.max(1, Number(data.modulo_atual || num));
        setLocalItem(storageKey, moduloAtual);
        lastFetchTimestamps.set(storageKey, Date.now());

        return {
            success: true,
            conteudo: data.conteudo || contentId,
            modulo_atual: moduloAtual,
            message: data.message || `Ponteiro do Módulo definido para ${moduloAtual} com sucesso!`
        };
    } catch (err) {
        console.warn('[ModuloService] Erro na requisição à API, aplicando no localStorage:', err.message);
        return {
            success: true,
            conteudo: contentId,
            modulo_atual: num,
            message: `Ponteiro do Módulo definido para ${num}!`
        };
    }
}
