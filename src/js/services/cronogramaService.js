import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem, removeLocalItem } from '../utils/storage.js';
import { ENDPOINTS, API_URL } from '../constants/routes.js';

export function getDiaSemanaAtual() {
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

/**
 * Busca o payload de tarefas do usuário selecionado na API AprovaDrive.
 * Padrão: Service Layer
 * 
 * @param {string} [userId] - Identificador ou nome do usuário (opcional, fallback para o usuário autenticado)
 * @returns {Promise<Object>} Payload contendo taskAtual, dias da semana e tarefas
 */
export async function getTarefas(userId) {
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    const usuarioId = userId || authUser?.id || authUser?.id_usuario || authUser?.nome || 'Henrique';

    try {
        const response = await fetch(`${ENDPOINTS.TASK.GET_TASKS}${encodeURIComponent(usuarioId)}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Falha na requisição: status ${response.status}`);
        }

        const data = await response.json();
        if (data) {
            setLocalItem(STORAGE_KEYS.CRONOGRAMA, data);
            return data;
        }
    } catch (error) {
        console.warn('Aviso ao consultar API de tarefas, utilizando dados estruturados locais:', error.message);
    }

    // Fallback estruturado caso a API esteja temporariamente indisponível
    const cached = getLocalItem(STORAGE_KEYS.CRONOGRAMA, null);
    if (cached && cached.dias) {
        return cached;
    }

    return getFallbackPayload(usuarioId);
}

function getFallbackPayload(usuario) {
    const diaAtualNum = getDiaSemanaAtual();
    const diaAtualChave = getChaveDia(diaAtualNum);

    const fallbackDias = {
        segunda: [
            { id: '1', titulo: 'Estudar capítulo 1 do Código de Trânsito', descricao: 'Leia o capítulo 1 do Código de Trânsito e anote os conceitos principais.', xp_reward: 50, status: 'done', concluida: true, sort: 1 },
            { id: '2', titulo: 'Mini-Quiz: 10 Questões de Direção Defensiva', descricao: 'Acerte no mínimo 70% para liberar o bônus diário de XP.', xp_reward: 100, status: 'current', sort: 2 },
            { id: '3', titulo: 'Leitura Guiada & Flashcards de Placas', descricao: 'Revisão rápida das placas de Regulamentação e Advertência.', xp_reward: 75, status: 'pending', sort: 3 }
        ],
        terca: [
            { id: '4', titulo: 'Estudar capítulo 2 do Código de Trânsito', descricao: 'Revise o capítulo 2 com foco nas normas gerais de circulação e conduta.', xp_reward: 40, status: 'pending', sort: 1 },
            { id: '5', titulo: 'Prática de Placas de Sinalização', descricao: 'Fixação das placas de advertência e indicação.', xp_reward: 60, status: 'pending', sort: 2 },
            { id: '6', titulo: 'Simulado Rápido de Legislação', descricao: '15 questões cronometradas sobre regras de trânsito.', xp_reward: 80, status: 'pending', sort: 3 }
        ],
        quarta: [
            { id: '7', titulo: 'Estudar Direção Defensiva - Parte 1', descricao: 'Princípios básicos e como evitar colisões com outros veículos.', xp_reward: 50, status: 'pending', sort: 1 },
            { id: '8', titulo: 'Condições Adversas de Tráfego e Tempo', descricao: 'Chuva, neblina, noite e estado de conservação da via.', xp_reward: 50, status: 'pending', sort: 2 },
            { id: '9', titulo: 'Quiz de Fixação de Direção Defensiva', descricao: '10 perguntas práticas de situações reais de trânsito.', xp_reward: 70, status: 'pending', sort: 3 }
        ],
        quinta: [
            { id: '10', titulo: 'Primeiros Socorros no Trânsito', descricao: 'Atendimento inicial a acidentados e sinalização do local.', xp_reward: 45, status: 'pending', sort: 1 },
            { id: '11', titulo: 'Procedimentos de Emergência e Telefones Úteis', descricao: 'Quando e como acionar SAMU, Bombeiros e Polícia Rodoviária.', xp_reward: 45, status: 'pending', sort: 2 },
            { id: '12', titulo: 'Revisão com Flashcards de Primeiros Socorros', descricao: 'Exercícios mnemônicos sobre sinais vitais e procedimentos.', xp_reward: 60, status: 'pending', sort: 3 }
        ],
        sexta: [
            { id: '13', titulo: 'Meio Ambiente e Convívio Social no Trânsito', descricao: 'Emissão de poluentes, poluição sonora e direitos do pedestre.', xp_reward: 40, status: 'pending', sort: 1 },
            { id: '14', titulo: 'Mecânica Básica para Habilitação', descricao: 'Componentes essenciais do veículo e manutenção preventiva.', xp_reward: 50, status: 'pending', sort: 2 },
            { id: '15', titulo: 'Simulado Geral Integrado', descricao: 'Prova de 30 questões nos moldes oficiais do DETRAN.', xp_reward: 120, status: 'pending', sort: 3 }
        ],
        sabado: [
            { id: '16', titulo: 'Revisão dos Erros da Semana', descricao: 'Reanálise de todas as questões erradas nos simulados anteriores.', xp_reward: 80, status: 'pending', sort: 1 },
            { id: '17', titulo: 'Maratona de Questões Desafiadoras', descricao: 'Bateria de 20 questões com maior índice de reprovação.', xp_reward: 100, status: 'pending', sort: 2 },
            { id: '18', titulo: 'Desafio Semanal de Fixação Rápida', descricao: 'Conquiste o bônus de XP e mantenha sua ofensiva de estudos ativa!', xp_reward: 150, status: 'pending', sort: 3 }
        ]
    };

    const taskAtual = fallbackDias[diaAtualChave]?.[1] || fallbackDias[diaAtualChave]?.[0] || fallbackDias.segunda[1];

    return {
        usuario,
        diaAtual: diaAtualChave,
        diaSemanaAtual: diaAtualNum,
        taskAtual: { ...taskAtual, status: 'current' },
        tarefasDoDia: fallbackDias[diaAtualChave] || [],
        dias: fallbackDias
    };
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
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    const usuarioId = userId || authUser?.id || authUser?.id_usuario || authUser?.nome || 'Henrique';

    const url = ENDPOINTS.TASK.INICIAR ? ENDPOINTS.TASK.INICIAR(taskId) : `${API_URL}/task/${encodeURIComponent(taskId)}/iniciar`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            id_usuario: usuarioId,
            taskId
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

/**
 * Envia requisição para concluir uma tarefa.
 * A validação de negócio é realizada exclusivamente na API.
 * 
 * @param {string} taskId - Identificador único da tarefa
 * @param {string} [userId] - Identificador do usuário (opcional)
 * @param {Object} [options] - Opções adicionais (ex: force)
 * @returns {Promise<Object>} Resposta da API com payload atualizado e XP ganho
 */
export async function concluirTarefa(taskId, userId, options = {}) {
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    const usuarioId = userId || authUser?.id || authUser?.id_usuario || authUser?.nome || 'Henrique';

    const url = ENDPOINTS.TASK.CONCLUIR ? ENDPOINTS.TASK.CONCLUIR(taskId) : `${API_URL}/task/${encodeURIComponent(taskId)}/concluir`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            id_usuario: usuarioId,
            taskId,
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

/**
 * Envia requisição para pausar uma tarefa em andamento.
 * A validação é realizada na API.
 * 
 * @param {string} taskId 
 * @param {string} [userId] 
 * @returns {Promise<Object>}
 */
export async function pausarTarefa(taskId, userId) {
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    const usuarioId = userId || authUser?.id || authUser?.id_usuario || authUser?.nome || 'Henrique';

    const url = ENDPOINTS.TASK.PAUSAR ? ENDPOINTS.TASK.PAUSAR(taskId) : `${API_URL}/task/${encodeURIComponent(taskId)}/pausar`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            id_usuario: usuarioId,
            taskId
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

/**
 * Envia requisição para reiniciar uma tarefa.
 * 
 * @param {string} taskId 
 * @param {string} [userId] 
 * @returns {Promise<Object>}
 */
export async function reiniciarTarefa(taskId, userId) {
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    const usuarioId = userId || authUser?.id || authUser?.id_usuario || authUser?.nome || 'Henrique';

    const url = ENDPOINTS.TASK.REINICIAR ? ENDPOINTS.TASK.REINICIAR(taskId) : `${API_URL}/task/${encodeURIComponent(taskId)}/reiniciar`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            id_usuario: usuarioId,
            taskId
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
