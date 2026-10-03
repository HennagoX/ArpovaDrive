/**
 * AprovaDrive - Admin Service
 * Centraliza e organiza todos os serviços administrativos para módulos, PDFs,
 * histórico de alterações, reversão, banco de questões e simulados.
 */

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

// ============================================================================
// 1. Módulos & PDFs: Histórico, Reversão e Exclusão
// ============================================================================

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

// ============================================================================
// 2. Banco de Questões: Criação, Listagem e Remoção
// ============================================================================

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
    return resData;
}

export async function listarQuestoesCustomizadasAPI(materia = null) {
    try {
        const url = ENDPOINTS.QUESTOES.ADMIN_LISTAR(materia);
        const response = await fetch(url, {
            headers: getAdminHeaders()
        });

        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.questoes) ? data.questoes : [];
    } catch {
        return [];
    }
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
    return resData;
}

// ============================================================================
// 3. Simulados Customizados: Criação, Listagem e Remoção
// ============================================================================

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
    return resData;
}

export async function listarSimuladosCustomizadosAPI() {
    try {
        const response = await fetch(ENDPOINTS.SIMULADO.ADMIN_LISTAR, {
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.simulados) ? data.simulados : [];
    } catch {
        return [];
    }
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
    return resData;
}
