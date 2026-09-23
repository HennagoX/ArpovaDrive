import { MESSAGES } from '../constants/messages.js';
import { ENDPOINTS } from '../constants/routes.js';
import { getModuloUserId } from './moduloService.js';

export const LOCKED_QUESTION_MESSAGE = MESSAGES.QUESTAO_BLOQUEADA || 'Conclua ao menos 3 módulos de estudo desta matéria para desbloquear esta bateria de questões!';
export const MODULOS_INTERVALO_DESBLOQUEIO = 3;

/**
 * Base de dados das matérias de questões e suas baterias de simulados.
 * 
 * Regra de Negócio:
 * - As baterias de questões são liberadas sequencialmente a cada 3 módulos de estudo concluídos.
 * - Por padrão (frontend inicial), a primeira bateria está liberada e as demais bloqueadas.
 * - No backend, o aluno só poderá fazer questões após a conclusão do bloco de módulos correspondente.
 */
export const QUESTOES_MATERIAS_DATA = {
    CodigoTransito: {
        id: 'CodigoTransito',
        slug: 'codigo-transito',
        titulo: 'Código de Trânsito',
        categoria: 'LEGISLAÇÃO',
        categoriaKey: 'legislacao',
        cor: 'green',
        icone: 'fa-solid fa-scale-balanced',
        descricao: 'Pratique com questões simuladas sobre leis, normas de conduta, infrações e direitos do Código de Trânsito Brasileiro (CTB).',
        totalQuestoes: 75,
        totalBaterias: 4,
        baterias: [
            {
                id: 'ctb-bat-1',
                numero: 1,
                titulo: 'Bateria 1: Fundamentos e Legislação Inicial',
                descricao: 'Questões essenciais referentes aos Módulos 01 a 03.',
                topicos: ['Conceitos de Trânsito', 'SNT e Órgãos', 'Habilitação e CNH'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulos 01 a 03',
                modulosNecessarios: 3,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-bat-2',
                numero: 2,
                titulo: 'Bateria 2: Circulação, Infrações e Penalidades',
                descricao: 'Questões práticas referentes aos Módulos 04 a 06.',
                topicos: ['Normas de Circulação', 'Infrações e Pontos', 'Penalidades Administrativas'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulos 04 a 06',
                modulosNecessarios: 6,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua até o Módulo 6 de Código de Trânsito para desbloquear esta bateria!'
            },
            {
                id: 'ctb-bat-3',
                numero: 3,
                titulo: 'Bateria 3: Crimes e Segurança Viária',
                descricao: 'Questões sobre Processo Administrativo, Crimes de Trânsito e Segurança Viária.',
                topicos: ['Processo Administrativo', 'Crimes de Trânsito', 'Segurança nas Vias'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulos 07 a 09',
                modulosNecessarios: 9,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua até o Módulo 9 de Código de Trânsito para desbloquear esta bateria!'
            },
            {
                id: 'ctb-bat-4',
                numero: 4,
                titulo: 'Simulado Final: Prova Completa de Legislação',
                descricao: 'Simulado completo de 30 questões englobando todos os 10 módulos nos padrões da prova teórica.',
                topicos: ['Revisão Geral CTB', 'Questões Oficiais DETRAN', 'Checklist de Aprovação'],
                questoesCount: 30,
                duracao: '35 min',
                modulosReferencia: 'Todos os Módulos (01 a 10)',
                modulosNecessarios: 10,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua todos os 10 módulos de estudo para desbloquear o simulado final!'
            }
        ]
    },

    PlacaTransito: {
        id: 'PlacaTransito',
        slug: 'placas-transito',
        titulo: 'Placas de Trânsito',
        categoria: 'SINALIZAÇÃO',
        categoriaKey: 'placas',
        cor: 'blue',
        icone: 'fa-solid fa-road',
        descricao: 'Teste seus conhecimentos sobre placas de regulamentação, advertência, indicação, marcas na pista e semáforos.',
        totalQuestoes: 30,
        totalBaterias: 2,
        baterias: [
            {
                id: 'plc-bat-1',
                numero: 1,
                titulo: 'Bateria 1: Placas Verticais e Sinalização',
                descricao: 'Questões sobre Placas de Regulamentação (vermelhas), Advertência (amarelas) e Indicação/Serviços.',
                topicos: ['Regulamentação', 'Advertência', 'Indicação e Serviços'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulos 01 a 03',
                modulosNecessarios: 3,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-bat-2',
                numero: 2,
                titulo: 'Bateria 2: Marcas Viárias, Semáforos e Gestos',
                descricao: 'Questões sobre sinalização horizontal, faixas contínuas, ciclos semafóricos e gestos de trânsito.',
                topicos: ['Faixas e Marcas no Solo', 'Sinalização Semafórica', 'Gestos de Agentes e Condutores'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulo 04',
                modulosNecessarios: 4,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua os módulos de sinalização para desbloquear este simulado!'
            }
        ]
    },

    DirecaoOfensiva: {
        id: 'DirecaoOfensiva',
        slug: 'direcao-defensiva',
        titulo: 'Direção Defensiva',
        categoria: 'SEGURANÇA',
        categoriaKey: 'seguranca',
        cor: 'yellow',
        icone: 'fa-solid fa-car-burst',
        descricao: 'Aprenda e fixe as metodologias preventivas de direção para evitar sinistros e responder com agilidade nas vias.',
        totalQuestoes: 30,
        totalBaterias: 2,
        baterias: [
            {
                id: 'dir-bat-1',
                numero: 1,
                titulo: 'Bateria 1: Fundamentos e Condições Adversas',
                descricao: 'Questões sobre os 5 pilares defensivos, cálculo de frenagem e situações sob chuva, neblina e ofuscamento.',
                topicos: ['5 Pilares Defensivos', 'Condições Adversas (Chuva/Luz)', 'Cálculo de Frenagem e Parada'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulos 01 a 03',
                modulosNecessarios: 3,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'dir-bat-2',
                numero: 2,
                titulo: 'Bateria 2: Prevenção de Colisões e Emergências',
                descricao: 'Questões sobre manobras evasivas, pontos cegos do veículo, cruzamentos e distâncias seguras de seguimento.',
                topicos: ['Prevenção de Colisões', 'Pontos Cegos', 'Manobras Evasivas'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulo 04',
                modulosNecessarios: 4,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua os módulos de Direção Defensiva para desbloquear este simulado!'
            }
        ]
    },

    PrimeirosSocorros: {
        id: 'PrimeirosSocorros',
        slug: 'primeiros-socorros',
        titulo: 'Primeiros Socorros',
        categoria: 'PRIMEIROS SOCORROS',
        categoriaKey: 'saude',
        cor: 'red',
        icone: 'fa-solid fa-kit-medical',
        descricao: 'Questões práticas de atendimento emergencial em ocorrências viárias para preservar vidas sem se colocar em risco.',
        totalQuestoes: 75,
        totalBaterias: 4,
        baterias: [
            {
                id: 'soc-bat-1',
                numero: 1,
                titulo: 'Bateria 1: Procedimentos Iniciais e Segurança',
                descricao: 'Questões essenciais referentes aos Módulos 01 a 03.',
                topicos: ['Introdução e Dever Legal', 'Ao Presenciar Acidente', 'Segurança da Cena'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulos 01 a 03',
                modulosNecessarios: 3,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-bat-2',
                numero: 2,
                titulo: 'Bateria 2: Serviços de Emergência e Avaliação',
                descricao: 'Questões práticas referentes aos Módulos 04 a 06.',
                topicos: ['Serviços 192 e 193', 'Avaliação Primária', 'Vítimas Inconscientes'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulos 04 a 06',
                modulosNecessarios: 6,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua até o Módulo 6 de Primeiros Socorros para desbloquear esta bateria!'
            },
            {
                id: 'soc-bat-3',
                numero: 3,
                titulo: 'Bateria 3: Traumas, Hemorragias e Queimaduras',
                descricao: 'Questões sobre controle de lesões referentes aos Módulos 07 a 09.',
                topicos: ['Sangramentos e Ferimentos', 'Fraturas e Lesões', 'Queimaduras e Incêndios'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulos 07 a 09',
                modulosNecessarios: 9,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua até o Módulo 9 de Primeiros Socorros para desbloquear esta bateria!'
            },
            {
                id: 'soc-bat-4',
                numero: 4,
                titulo: 'Simulado Final: Prova Completa de Primeiros Socorros',
                descricao: 'Simulado completo de 30 questões englobando todos os 10 módulos nos padrões da prova teórica.',
                topicos: ['Revisão Geral de Socorros', 'Questões Oficiais DETRAN', 'Checklist de Aprovação'],
                questoesCount: 30,
                duracao: '35 min',
                modulosReferencia: 'Todos os Módulos (01 a 10)',
                modulosNecessarios: 10,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua todos os 10 módulos de estudo para desbloquear o simulado final!'
            }
        ]
    },

    MeioAmbiente: {
        id: 'MeioAmbiente',
        slug: 'meio-ambiente',
        titulo: 'Meio Ambiente e Cidadania',
        categoria: 'MEIO AMBIENTE',
        categoriaKey: 'ambiente',
        cor: 'purple',
        icone: 'fa-solid fa-leaf',
        descricao: 'Questões sobre poluição veicular, PROCONVE, ruídos no trânsito, convívio cidadão e empatia no trânsito.',
        totalQuestoes: 30,
        totalBaterias: 2,
        baterias: [
            {
                id: 'amb-bat-1',
                numero: 1,
                titulo: 'Bateria 1: Poluição Veicular e Resíduos',
                descricao: 'Questões sobre emissão de gases (CO, NOx), catalisadores, poluição sonora e descarte ecológico.',
                topicos: ['Gases Automotivos', 'PROCONVE e Catalisador', 'Poluição Sonora e Visual'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulos 01 a 03',
                modulosNecessarios: 3,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-bat-2',
                numero: 2,
                titulo: 'Bateria 2: Cidadania e Convívio Social nas Vias',
                descricao: 'Questões sobre direitos humanos, respeito prioritário a pedestres e ciclistas e responsabilidade no trânsito.',
                topicos: ['Direitos Humanos e Cidadania', 'Prioridade aos Vulneráveis', 'Convivência Harmoniosa'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulo 04',
                modulosNecessarios: 4,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua os módulos de Meio Ambiente para desbloquear este simulado!'
            }
        ]
    }
};

/**
 * Retorna todas as matérias de questões cadastradas
 * @returns {Array<Object>}
 */
export function getMateriasQuestoes() {
    return Object.values(QUESTOES_MATERIAS_DATA);
}

/**
 * Retorna os dados de uma matéria de questões por ID ou slug
 * @param {string} id - Ex: 'CodigoTransito' ou 'codigo-transito'
 * @returns {Object|null}
 */
export function getMateriaQuestoesById(id) {
    if (!id) return null;
    if (QUESTOES_MATERIAS_DATA[id]) return QUESTOES_MATERIAS_DATA[id];

    const normalized = String(id).toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = Object.keys(QUESTOES_MATERIAS_DATA).find(key => {
        const item = QUESTOES_MATERIAS_DATA[key];
        return key.toLowerCase() === normalized ||
            (item.slug && item.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized);
    });

    return foundKey ? QUESTOES_MATERIAS_DATA[foundKey] : null;
}

/**
 * Retorna as baterias de questões de uma matéria específica
 * @param {string} materiaId 
 * @returns {Array<Object>}
 */
export function getBateriasByMateriaId(materiaId) {
    const materia = getMateriaQuestoesById(materiaId);
    return materia && Array.isArray(materia.baterias) ? materia.baterias : [];
}

/**
 * Helper extensível para verificação de desbloqueio de bateria de questões.
 * Preparado para integração direta com a API do backend:
 * Cada bateria exige que o aluno tenha concluído no mínimo bateria.modulosNecessarios.
 * 
 * @param {Object} bateria - Objeto da bateria de questões
 * @param {number} [modulosConcluidosCount=3] - Quantidade de módulos concluídos pelo aluno no backend
 * @returns {boolean} Se a bateria está apta para realização
 */
export function isBateriaDesbloqueada(bateria, modulosConcluidosCount = 3) {
    if (!bateria) return false;
    if (bateria.numero === 1) return true;
    const necessarios = bateria.modulosNecessarios || (bateria.numero * MODULOS_INTERVALO_DESBLOQUEIO);
    return modulosConcluidosCount >= necessarios;
}

/**
 * Verifica se a conclusão de um determinado módulo desbloqueia uma nova bateria de questões.
 * A cada 3 módulos concluídos (3, 6, 9, etc.) ou no fechamento do conteúdo, uma nova bateria é liberada.
 * 
 * @param {string} materiaId - Identificador do conteúdo/matéria
 * @param {number} moduloNumero - Número do módulo concluído
 * @returns {Object|null} Objeto da bateria liberada ou null
 */
export function checkBateriaLiberadaPorModulo(materiaId, moduloNumero) {
    if (!materiaId || !moduloNumero) return null;
    const num = Number(moduloNumero);
    const materia = getMateriaQuestoesById(materiaId);
    const baterias = materia && Array.isArray(materia.baterias) ? materia.baterias : [];

    // Busca se existe uma bateria configurada exatamente para esse número de módulos
    const bateriaExata = baterias.find(b => Number(b.modulosNecessarios) === num);
    if (bateriaExata) {
        return bateriaExata;
    }

    // Regra padrão: a cada 3 módulos (3, 6, 9...)
    if (num % MODULOS_INTERVALO_DESBLOQUEIO === 0) {
        const indice = Math.floor(num / MODULOS_INTERVALO_DESBLOQUEIO);
        const bateriaIndex = baterias[indice - 1];
        if (bateriaIndex) return bateriaIndex;
        return {
            numero: indice,
            titulo: `Bateria ${String(indice).padStart(2, '0')}`,
            modulosNecessarios: num
        };
    }

    return null;
}

/**
 * Consulta o total de questões concluídas e acertos do usuário na API
 * @param {string} [materia] 
 * @param {string} [userId] 
 * @returns {Promise<{success: boolean, acertos: any}>}
 */
export async function fetchQuestoesConcluidas(materia, userId) {
    const activeUserId = getModuloUserId(userId);
    try {
        const url = ENDPOINTS.QUESTOES.CONCLUIDAS(activeUserId, materia);
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-User-Id': activeUserId
            }
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (err) {
        console.warn('[QuestoesService] Erro ao consultar questões concluídas:', err.message);
    }
    return { success: false, acertos: null };
}

/**
 * Envia a resposta de uma questão para validação na API
 * @param {Object} dadosResposta - { questao, num, resposta, materia }
 * @param {string} [userId]
 * @returns {Promise<{success: boolean, correto?: boolean, message?: string}>}
 */
export async function checkAcertoQuestaoAPI(dadosResposta, userId) {
    const activeUserId = getModuloUserId(userId);
    try {
        const response = await fetch(ENDPOINTS.QUESTOES.CHECK_ACERTO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-User-Id': activeUserId
            },
            body: JSON.stringify({
                ...dadosResposta,
                userId: activeUserId,
                id_usuario: activeUserId
            })
        });
        return await response.json();
    } catch (err) {
        console.warn('[QuestoesService] Erro ao checar acerto via API:', err.message);
        return { success: false, message: err.message };
    }
}


