/**
 * Serviço de Integração da API de Módulos (AprovaDrive)
 * Comunica-se com os endpoints /modulo e /modulo/next da AprovaDriveAPI
 */

import { ENDPOINTS, API_URL } from '../constants/routes.js';
import { getCurrentUser } from './authService.js';
import { getUsuarioAtivoId } from './cronogramaService.js';
import { getLocalItem, setLocalItem } from '../utils/storage.js';

const STORAGE_PREFIX = 'aprovadrive_modulo_progresso_';

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
 * Obtém o progresso atual do módulo do conteúdo no banco de dados.
 * @param {string} contentId - Identificador do conteúdo (ex: 'CodigoTransito')
 * @param {string} [userId] - Identificador do usuário
 * @returns {Promise<{conteudo: string, modulo_atual: number}>}
 */
export async function getModuloAtual(contentId, userId) {
    if (!contentId) return { conteudo: '', modulo_atual: 1 };

    const activeUserId = getModuloUserId(userId);
    const storageKey = `${STORAGE_PREFIX}${contentId}_${activeUserId}`;

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
            const moduloAtual = Number(data.modulo_atual || 1);
            setLocalItem(storageKey, moduloAtual);
            return {
                conteudo: data.conteudo || contentId,
                modulo_atual: Math.max(1, moduloAtual)
            };
        }
    } catch (err) {
        console.warn(`[ModuloService] Erro ao consultar backend para ${contentId}:`, err.message);
    }

    // Fallback para cache local se indisponível
    const cached = getLocalItem(storageKey, null);
    if (cached !== null) {
        return {
            conteudo: contentId,
            modulo_atual: Math.max(1, Number(cached))
        };
    }

    return { conteudo: contentId, modulo_atual: 1 };
}

/**
 * Avança o usuário para o próximo módulo (+1) chamando a rota POST /modulo/next da API.
 * @param {string} contentId - Identificador do conteúdo (ex: 'CodigoTransito')
 * @param {string} [userId] - Identificador do usuário
 * @returns {Promise<{success: boolean, modulo_atual: number, message: string, xp_ganha?: number}>}
 */
export async function avancarModulo(contentId, userId) {
    if (!contentId) {
        throw new Error('Conteúdo não informado.');
    }

    const activeUserId = getModuloUserId(userId);
    const storageKey = `${STORAGE_PREFIX}${contentId}_${activeUserId}`;

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

        const moduloAtual = Number(data.modulo_atual || 1);
        setLocalItem(storageKey, moduloAtual);

        return {
            success: true,
            conteudo: data.conteudo || contentId,
            modulo_atual: moduloAtual,
            modulo_anterior: data.modulo_anterior,
            xp_ganha: data.xp_ganha || 25,
            message: data.message || `Avançou para o Módulo ${moduloAtual} com sucesso!`
        };
    } catch (err) {
        console.warn('[ModuloService] Erro na requisição à API:', err.message);

        // Fallback progressão local caso a rede falhe
        const cached = getLocalItem(storageKey, 1);
        const novoModulo = Number(cached) + 1;
        setLocalItem(storageKey, novoModulo);

        return {
            success: true,
            conteudo: contentId,
            modulo_atual: novoModulo,
            message: `Avançou para o Módulo ${novoModulo}!`
        };
    }
}
