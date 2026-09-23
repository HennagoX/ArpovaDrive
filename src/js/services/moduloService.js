/**
 * Serviço de Integração da API de Módulos (AprovaDrive)
 * Comunica-se com os endpoints /modulo e /modulo/next da AprovaDriveAPI.
 * Utiliza o localStorage como fonte de verdade imediata (cache-first / SWR)
 * para evitar requisições redundantes, travamentos de tela e re-renderizações desnecessárias.
 */

import { ENDPOINTS } from '../constants/routes.js';
import { getCurrentUser } from './authService.js';
import { getUsuarioAtivoId } from './cronogramaService.js';
import { getLocalItem, setLocalItem } from '../utils/storage.js';

const STORAGE_PREFIX = 'aprovadrive_modulo_progresso_';
const inFlightRequests = new Map();
const lastFetchTimestamps = new Map();
const CACHE_TTL_MS = 25000; // 25 segundos de validade para evitar requisições repetidas a cada clique

/**
 * Obtém o identificador de usuário para as requisições de módulos
 * @param {string} [userId]
 * @returns {string}
 */
export function getModuloUserId(userId) {
    if (userId && typeof userId === 'string' && userId.trim()) {
        return userId.trim();
    }
    const user = getCurrentUser();
    const id = user?.id || user?.id_usuario || user?.userId;
    if (id) return String(id);

    return getUsuarioAtivoId();
}

/**
 * Obtém a chave do localStorage para o progresso do conteúdo
 * @param {string} contentId 
 * @param {string} [userId] 
 * @returns {string}
 */
export function getModuloStorageKey(contentId, userId) {
    const activeUserId = getModuloUserId(userId);
    return `${STORAGE_PREFIX}${contentId}_${activeUserId}`;
}

/**
 * Obtém de forma síncrona e instantânea (0ms) o progresso do módulo a partir do localStorage.
 * Permite renderização imediata da tela sem aguardar requisições de rede.
 * 
 * @param {string} contentId - Identificador do conteúdo (ex: 'CodigoTransito')
 * @param {string} [userId] - Identificador do usuário
 * @returns {number} Número do módulo atual (mínimo 1)
 */
export function getModuloAtualCached(contentId, userId) {
    if (!contentId) return 1;
    const storageKey = getModuloStorageKey(contentId, userId);
    const cached = getLocalItem(storageKey, null);
    if (cached !== null && !isNaN(Number(cached))) {
        return Math.max(1, Number(cached));
    }
    return 1;
}

/**
 * Atualiza o progresso do módulo diretamente no localStorage
 * @param {string} contentId 
 * @param {number} moduloNumero 
 * @param {string} [userId] 
 */
export function setModuloAtualCached(contentId, moduloNumero, userId) {
    if (!contentId) return;
    const storageKey = getModuloStorageKey(contentId, userId);
    const num = Math.max(1, Number(moduloNumero || 1));
    setLocalItem(storageKey, num);
    lastFetchTimestamps.set(storageKey, Date.now());
}

/**
 * Obtém o progresso atual do módulo do conteúdo no banco de dados.
 * Utiliza cache local inteligente (SWR) e deduplicação de requisições concorrentes.
 * 
 * @param {string} contentId - Identificador do conteúdo (ex: 'CodigoTransito')
 * @param {string} [userId] - Identificador do usuário
 * @param {Object} [options]
 * @param {boolean} [options.forceRefresh=false] - Se deve forçar requisição ignorando TTL
 * @returns {Promise<{conteudo: string, modulo_atual: number, fromCache?: boolean, mudou?: boolean}>}
 */
export async function getModuloAtual(contentId, userId, options = {}) {
    if (!contentId) return { conteudo: '', modulo_atual: 1 };

    const activeUserId = getModuloUserId(userId);
    const storageKey = getModuloStorageKey(contentId, activeUserId);
    const cachedValue = getModuloAtualCached(contentId, activeUserId);

    const now = Date.now();
    const lastFetch = lastFetchTimestamps.get(storageKey) || 0;
    const isCacheFresh = (now - lastFetch) < CACHE_TTL_MS;

    // Se o cache for recente e não for refresh forçado, retorna imediatamente sem requisição de rede
    if (isCacheFresh && !options.forceRefresh) {
        return {
            conteudo: contentId,
            modulo_atual: cachedValue,
            fromCache: true,
            mudou: false
        };
    }

    // Se já houver uma requisição em andamento para este conteúdo, reutiliza a mesma Promise
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

        // Fallback seguro: retorna o valor do localStorage
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

/**
 * Avança o usuário para o próximo módulo (+1) chamando a rota POST /modulo/next da API.
 * Atualiza o localStorage imediatamente para garantir consistência visual em toda a aplicação.
 * 
 * @param {string} contentId - Identificador do conteúdo (ex: 'CodigoTransito')
 * @param {string} [userId] - Identificador do usuário
 * @returns {Promise<{success: boolean, modulo_atual: number, message: string, xp_ganha?: number}>}
 */
export async function avancarModulo(contentId, userId) {
    if (!contentId) {
        throw new Error('Conteúdo não informado.');
    }

    const activeUserId = getModuloUserId(userId);
    const storageKey = getModuloStorageKey(contentId, activeUserId);
    const cachedAtual = getModuloAtualCached(contentId, activeUserId);
    const proximoEsperado = cachedAtual + 1;

    // Atualização otimista imediata no localStorage
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
            const errorMsg = data?.error || 'Erro ao avançar para o próximo módulo.';
            throw new Error(errorMsg);
        }

        const moduloAtual = Math.max(proximoEsperado, Number(data.modulo_atual || proximoEsperado));
        setLocalItem(storageKey, moduloAtual);
        lastFetchTimestamps.set(storageKey, Date.now());

        return {
            success: true,
            conteudo: data.conteudo || contentId,
            modulo_atual: moduloAtual,
            modulo_anterior: data.modulo_anterior || cachedAtual,
            xp_ganha: data.xp_ganha || 25,
            message: data.message || `Avançou para o Módulo ${moduloAtual} com sucesso!`
        };
    } catch (err) {
        console.warn('[ModuloService] Erro na requisição à API, aplicando avanço no localStorage:', err.message);

        return {
            success: true,
            conteudo: contentId,
            modulo_atual: proximoEsperado,
            modulo_anterior: cachedAtual,
            xp_ganha: 25,
            message: `Avançou para o Módulo ${proximoEsperado}!`
        };
    }
}
