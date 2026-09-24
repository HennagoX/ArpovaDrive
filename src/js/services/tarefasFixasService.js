import { ENDPOINTS } from '../constants/routes.js';
import { getUsuarioAtivoId } from './cronogramaService.js';
import { atualizarXpNoLocalStorage, addXp } from './gamificationService.js';
import { getLocalItem, setLocalItem } from '../utils/storage.js';

export const SESSION_TAREFAS_FIXAS_KEY = 'aprovadrive_tarefas_fixas_cache';

export async function getTarefasFixas(userId, forceRefresh = false) {
    const usuarioId = getUsuarioAtivoId(userId);

    if (!forceRefresh) {
        try {
            const cached = sessionStorage.getItem(`${SESSION_TAREFAS_FIXAS_KEY}_${usuarioId}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.conteudos) {
                    return parsed;
                }
            }
        } catch {
            // Ignora erro de cache
        }
    }

    const url = ENDPOINTS.TAREFAS_FIXAS.GET_TASKS(usuarioId);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-User-Id': usuarioId
            }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.error || `Erro HTTP ${response.status} ao carregar tarefas fixas.`);
        }

        const data = await response.json();
        if (data && data.success && data.conteudos) {
            try {
                sessionStorage.setItem(`${SESSION_TAREFAS_FIXAS_KEY}_${usuarioId}`, JSON.stringify(data));
            } catch {
                // Ignore storage limits
            }
            return data;
        }

        throw new Error('Formato de resposta inválido do servidor.');
    } catch (err) {
        console.warn('[TarefasFixasService] Falha na requisição ao backend:', err.message);
        throw err;
    }
}

export async function concluirTarefaFixa(taskId, userId) {
    if (!taskId) {
        throw new Error('ID da tarefa é obrigatório.');
    }

    const usuarioId = getUsuarioAtivoId(userId);
    const url = ENDPOINTS.TAREFAS_FIXAS.CONCLUIR(taskId);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-User-Id': usuarioId
        },
        body: JSON.stringify({
            taskId,
            userId: usuarioId,
            id_usuario: usuarioId
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Não foi possível concluir esta tarefa.');
    }

    // Invalida cache local da sessão para forçar sincronização
    try {
        sessionStorage.removeItem(`${SESSION_TAREFAS_FIXAS_KEY}_${usuarioId}`);
    } catch {
        // Ignora
    }

    // Atualiza imediatamente o localStorage com o XP e LV incrementados
    const xpGanho = Number(data.xpGanho || 0);
    const expTotal = data.expTotal !== undefined ? Number(data.expTotal) : null;
    const lv = data.lv !== undefined ? Number(data.lv) : null;
    const tituloNivel = data.tituloNivel || null;

    try {
        atualizarXpNoLocalStorage({
            xpGanho,
            expTotal,
            lv,
            tituloNivel,
            taskId
        });
    } catch (err) {
        console.warn('[TarefasFixasService] Não foi possível atualizar localStorage:', err.message);
    }

    return data;
}

export function limparCacheTarefasFixas(userId) {
    try {
        const usuarioId = getUsuarioAtivoId(userId);
        sessionStorage.removeItem(`${SESSION_TAREFAS_FIXAS_KEY}_${usuarioId}`);
    } catch {
        // Ignora
    }
}
