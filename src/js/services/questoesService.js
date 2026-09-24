import { MESSAGES } from '../constants/messages.js';
import { ENDPOINTS } from '../constants/routes.js';
import { getModuloUserId } from './moduloService.js';

export const LOCKED_QUESTION_MESSAGE = MESSAGES.QUESTAO_BLOQUEADA || 'Conclua ao menos 3 módulos de estudo desta matéria para desbloquear esta bateria de questões!';
export const MODULOS_INTERVALO_DESBLOQUEIO = 3;

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
        totalQuestoes: 60,
        totalBaterias: 3,
        baterias: [
            {
                id: 'amb-bat-1',
                numero: 1,
                titulo: 'Bateria 1: Sociedade e Poluição do Ar e Sonora',
                descricao: 'Questões sobre impacto urbano, emissões, PROCONVE e poluição sonora dos Módulos 01 a 03.',
                topicos: ['Trânsito e Meio Ambiente', 'Poluição do Ar e PROCONVE', 'Poluição Sonora e Buzina'],
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
                titulo: 'Bateria 2: Manutenção, Consumo e Resíduos',
                descricao: 'Questões sobre manutenção preventiva, combustíveis e descarte correto dos Módulos 04 a 06.',
                topicos: ['Manutenção e Emissões', 'Consumo Eficiente', 'Resíduos e Logística Reversa'],
                questoesCount: 15,
                duracao: '20 min',
                modulosReferencia: 'Módulos 04 a 06',
                modulosNecessarios: 6,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua até o Módulo 6 de Meio Ambiente para desbloquear esta bateria!'
            },
            {
                id: 'amb-bat-3',
                numero: 3,
                titulo: 'Simulado Final: Mobilidade e Cidadania no Trânsito',
                descricao: 'Simulado completo cobrindo sustentabilidade, cidadania e respeito aos vulneráveis dos Módulos 07 a 09.',
                topicos: ['Mobilidade Sustentável', 'Cidadania no Trânsito', 'Respeito aos Usuários da Via'],
                questoesCount: 30,
                duracao: '35 min',
                modulosReferencia: 'Todos os Módulos (01 a 09)',
                modulosNecessarios: 9,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua todos os 9 módulos de Meio Ambiente para desbloquear o simulado final!'
            }
        ]
    }
};

export function getMateriasQuestoes() {
    return Object.values(QUESTOES_MATERIAS_DATA);
}

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

export function getBateriasByMateriaId(materiaId) {
    const materia = getMateriaQuestoesById(materiaId);
    return materia && Array.isArray(materia.baterias) ? materia.baterias : [];
}

export function isBateriaDesbloqueada(bateria, modulosConcluidosCount = 3) {
    if (!bateria) return false;
    if (bateria.numero === 1) return true;
    const necessarios = bateria.modulosNecessarios || (bateria.numero * MODULOS_INTERVALO_DESBLOQUEIO);
    return modulosConcluidosCount >= necessarios;
}

export function checkBateriaLiberadaPorModulo(materiaId, moduloNumero) {
    if (!materiaId || !moduloNumero) return null;
    const num = Number(moduloNumero);
    const materia = getMateriaQuestoesById(materiaId);
    const baterias = materia && Array.isArray(materia.baterias) ? materia.baterias : [];

    const bateriaExata = baterias.find(b => Number(b.modulosNecessarios) === num);
    if (bateriaExata) {
        return bateriaExata;
    }

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
