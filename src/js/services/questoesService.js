import { MESSAGES } from '../constants/messages.js';
import { ENDPOINTS } from '../constants/routes.js';
import { getModuloUserId, getModuloAtual } from './moduloService.js';

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
        totalQuestoes: 40,
        totalBaterias: 4,
        baterias: [
            {
                id: 'amb-bat-1',
                numero: 1,
                titulo: 'Bateria 1: Trânsito, Ar e Ruído',
                descricao: 'Questões sobre impacto urbano, emissões e poluição sonora dos Módulos 01 a 03.',
                topicos: ['Trânsito e Mobilidade', 'Poluição do Ar', 'Poluição Sonora'],
                questoesCount: 10,
                duracao: '15 min',
                modulosReferencia: 'Módulos 01 a 03',
                modulosNecessarios: 3,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-bat-2',
                numero: 2,
                titulo: 'Bateria 2: Manutenção, Consumo e Resíduos',
                descricao: 'Questões sobre manutenção preventiva, combustíveis e descarte correto dos Módulos 03 a 06.',
                topicos: ['Ruídos e Sons', 'Manutenção Preventiva', 'Resíduos Automotivos'],
                questoesCount: 10,
                duracao: '15 min',
                modulosReferencia: 'Módulos 03 a 06',
                modulosNecessarios: 6,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua até o Módulo 6 de Meio Ambiente para desbloquear esta bateria!'
            },
            {
                id: 'amb-bat-3',
                numero: 3,
                titulo: 'Bateria 3: Mobilidade, Cidadania e Respeito',
                descricao: 'Questões sobre mobilidade sustentável, cidadania e respeito aos vulneráveis dos Módulos 07 a 09.',
                topicos: ['Mobilidade Sustentável', 'Cidadania no Trânsito', 'Respeito aos Usuários'],
                questoesCount: 10,
                duracao: '15 min',
                modulosReferencia: 'Módulos 07 a 09',
                modulosNecessarios: 9,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua até o Módulo 9 de Meio Ambiente para desbloquear esta bateria!'
            },
            {
                id: 'amb-bat-4',
                numero: 4,
                titulo: 'Bateria 4: Ética e Espaço Público',
                descricao: 'Simulado final cobrindo ética, convívio coletivo e preservação do patrimônio dos Módulos 10 e 11.',
                topicos: ['Ética e Convivência', 'Resolução de Conflitos', 'Espaço Público'],
                questoesCount: 10,
                duracao: '15 min',
                modulosReferencia: 'Módulos 10 e 11',
                modulosNecessarios: 10,
                status: 'locked',
                bloqueado: true,
                motivoBloqueio: 'Conclua todos os módulos de Meio Ambiente para desbloquear o simulado final!'
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

export function getBateriasByMateriaId(materiaId, moduloAtual = null) {
    const materia = getMateriaQuestoesById(materiaId);
    if (!materia || !Array.isArray(materia.baterias)) return [];
    if (moduloAtual === null || moduloAtual === undefined) {
        return materia.baterias;
    }
    const progresso = Number(moduloAtual);
    return materia.baterias.map(bateria => {
        const desbloqueada = isBateriaDesbloqueada(bateria, progresso);
        return {
            ...bateria,
            bloqueado: !desbloqueada,
            status: desbloqueada ? 'available' : 'locked'
        };
    });
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
        return { success: false, message: err.message };
    }
}

export async function concluirBateriaAPI(dadosConclusao, userId) {
    const activeUserId = getModuloUserId(userId);
    try {
        const response = await fetch(ENDPOINTS.QUESTOES.CONCLUIR_BATERIA, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-User-Id': activeUserId
            },
            body: JSON.stringify({
                ...dadosConclusao,
                userId: activeUserId,
                id_usuario: activeUserId
            })
        });
        return await response.json();
    } catch (err) {
        return { success: false, message: err.message };
    }
}

export async function verificarAcessoBateriaAPI(materia, bateriaNumero, userId) {
    const activeUserId = getModuloUserId(userId);
    try {
        const url = ENDPOINTS.QUESTOES.VERIFICAR_ACESSO(materia, bateriaNumero, activeUserId);
        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-User-Id': activeUserId
            }
        });
        if (res.ok) {
            return await res.json();
        }
    } catch {}

    const moduloProgresso = await getModuloAtual(materia, activeUserId, { forceRefresh: true });
    const modAtual = Number(moduloProgresso?.modulo_atual || 1);
    const materiaObj = getMateriaQuestoesById(materia);
    const baterias = materiaObj?.baterias || [];
    const bat = baterias.find(b => Number(b.numero) === Number(bateriaNumero)) || { numero: bateriaNumero, modulosNecessarios: bateriaNumero * 3 };
    const permitido = isBateriaDesbloqueada(bat, modAtual);

    return {
        sucesso: true,
        permitido,
        bloqueado: !permitido,
        moduloAtual: modAtual,
        moduloMinimo: bat.modulosNecessarios || (bateriaNumero * 3)
    };
}

export const QUESTOES_DATA_MEIO_AMBIENTE = {
    1: [
        {
            numero: 1,
            modulo: 1,
            texto: 'O trânsito envolve apenas veículos e condutores?',
            opcoes: [
                'Sim, apenas veículos usam as vias.',
                'Não, também envolve pedestres, passageiros, ciclistas e infraestrutura.',
                'Sim, quando não há ônibus.',
                'Envolve somente motoristas e passageiros.'
            ],
            correta: 1,
            corretaLetra: 'B',
            explicacao: 'O trânsito é compartilhado por diferentes pessoas.'
        },
        {
            numero: 2,
            modulo: 1,
            texto: 'O aumento de deslocamentos sem planejamento pode causar:',
            opcoes: [
                'Mais congestionamentos, emissões e ruídos.',
                'Fim da poluição.',
                'Menos necessidade de transporte.',
                'Fim dos conflitos na via.'
            ],
            correta: 0,
            corretaLetra: 'A',
            explicacao: 'Mais circulação pode ampliar impactos na cidade.'
        },
        {
            numero: 3,
            modulo: 1,
            texto: 'Qual atitude evita deslocamentos desnecessários?',
            opcoes: [
                'Fazer várias viagens para locais próximos.',
                'Escolher sempre o caminho mais longo.',
                'Combinar compromissos próximos em um trajeto viável.',
                'Acelerar mais entre compromissos.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'Planejar viagens ajuda a economizar recursos.'
        },
        {
            numero: 4,
            modulo: 1,
            texto: 'A responsabilidade pelos impactos do trânsito é:',
            opcoes: [
                'Somente do motorista.',
                'Somente do governo.',
                'Somente dos passageiros.',
                'Individual e coletiva.'
            ],
            correta: 3,
            corretaLetra: 'D',
            explicacao: 'Escolhas pessoais e planejamento urbano influenciam os impactos.'
        },
        {
            numero: 5,
            modulo: 2,
            texto: 'Em um motor a combustão, o combustível:',
            opcoes: [
                'É queimado e produz emissões.',
                'Desaparece sem produzir gases.',
                'Vira apenas água limpa.',
                'Não afeta o ar.'
            ],
            correta: 0,
            corretaLetra: 'A',
            explicacao: 'A combustão movimenta o veículo e também gera poluentes.'
        },
        {
            numero: 6,
            modulo: 2,
            texto: 'Sem fumaça visível, um veículo pode emitir poluentes?',
            opcoes: [
                'Não, fumaça é a única emissão.',
                'Sim, nem toda emissão é visível.',
                'Apenas com a buzina ligada.',
                'Apenas desligado.'
            ],
            correta: 1,
            corretaLetra: 'B',
            explicacao: 'A ausência de fumaça não significa emissão zero.'
        },
        {
            numero: 7,
            modulo: 2,
            texto: 'Como a manutenção ajuda a qualidade do ar?',
            opcoes: [
                'Mudando a cor da fumaça.',
                'Eliminando toda emissão.',
                'Corrigindo falhas que podem elevar emissões.',
                'Dispensando o escapamento.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'Veículos com defeito podem emitir mais poluentes.'
        },
        {
            numero: 8,
            modulo: 3,
            texto: 'Poluição sonora é:',
            opcoes: [
                'Toda conversa na rua.',
                'Somente barulho de obras.',
                'Apenas música no carro.',
                'Excesso de sons indesejados no ambiente.'
            ],
            correta: 3,
            corretaLetra: 'D',
            explicacao: 'O ruído excessivo também é um impacto do trânsito.'
        },
        {
            numero: 9,
            modulo: 3,
            texto: 'Em um congestionamento, o condutor deve:',
            opcoes: [
                'Evitar buzinar por impaciência.',
                'Buzinar continuamente.',
                'Acelerar parado.',
                'Usar a buzina para demonstrar irritação.'
            ],
            correta: 0,
            corretaLetra: 'A',
            explicacao: 'Buzinas repetidas aumentam o ruído e não resolvem o trânsito.'
        },
        {
            numero: 10,
            modulo: 3,
            texto: 'Ruído excessivo pode prejudicar:',
            opcoes: [
                'Apenas quem dirige.',
                'Descanso, concentração, pessoas e animais.',
                'Somente a pintura do carro.',
                'Apenas quem está dentro do veículo.'
            ],
            correta: 1,
            corretaLetra: 'B',
            explicacao: 'O ruído afeta quem vive ou circula perto das vias.'
        }
    ],
    2: [
        {
            numero: 1,
            modulo: 3,
            texto: 'Poluição sonora é:',
            opcoes: [
                'Qualquer som de veículo.',
                'Excesso de sons indesejados no ambiente.',
                'Apenas música alta.',
                'Somente barulho de obras.'
            ],
            correta: 1,
            corretaLetra: 'B',
            explicacao: 'O excesso de ruído também afeta a qualidade de vida.'
        },
        {
            numero: 2,
            modulo: 3,
            texto: 'Quais fontes podem aumentar o ruído no trânsito?',
            opcoes: [
                'Somente bicicletas.',
                'Apenas o vento.',
                'Motores, escapamentos, buzinas e trânsito intenso.',
                'Somente placas.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'Diferentes fontes de ruído se somam nas cidades.'
        },
        {
            numero: 3,
            modulo: 3,
            texto: 'Quem pode ser afetado por ruídos frequentes?',
            opcoes: [
                'Pessoas e animais.',
                'Somente motoristas.',
                'Apenas passageiros.',
                'Ninguém fora do veículo.'
            ],
            correta: 0,
            corretaLetra: 'A',
            explicacao: 'Ruídos podem prejudicar descanso, conversa e concentração.'
        },
        {
            numero: 4,
            modulo: 4,
            texto: 'A manutenção preventiva contribui com o ambiente porque:',
            opcoes: [
                'Elimina toda emissão.',
                'Ajuda a evitar falhas, desperdícios e vazamentos.',
                'Dispensa o descarte correto.',
                'Transforma combustível sem perdas.'
            ],
            correta: 1,
            corretaLetra: 'B',
            explicacao: 'Conservar o veículo pode evitar impactos adicionais.'
        },
        {
            numero: 5,
            modulo: 4,
            texto: 'Pneus mal calibrados podem causar:',
            opcoes: [
                'Maior resistência ao movimento e possível aumento no consumo.',
                'Emissão zero.',
                'Frenagem sempre melhor.',
                'Fim dos ruídos.'
            ],
            correta: 0,
            corretaLetra: 'A',
            explicacao: 'Siga a calibragem indicada para o veículo.'
        },
        {
            numero: 6,
            modulo: 4,
            texto: 'Problemas no escapamento podem causar:',
            opcoes: [
                'Mudança na pintura.',
                'Mais passageiros.',
                'Emissões inadequadas ou ruído excessivo.',
                'Redução certa no consumo.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'Defeitos no sistema devem ser avaliados por uma oficina.'
        },
        {
            numero: 7,
            modulo: 5,
            texto: 'Em veículos a combustão, maior consumo geralmente está associado a:',
            opcoes: [
                'Mais emissões durante o uso.',
                'Somente vapor de água.',
                'Nenhum impacto.',
                'Fim da manutenção.'
            ],
            correta: 0,
            corretaLetra: 'A',
            explicacao: 'O uso de combustível gera emissões.'
        },
        {
            numero: 8,
            modulo: 5,
            texto: 'Qual condução evita desperdício?',
            opcoes: [
                'Acelerar forte e frear logo depois.',
                'Deixar o motor ligado sem necessidade.',
                'Antecipar o trânsito e conduzir suavemente.',
                'Dirigir acima da velocidade adequada.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'Acelerações e frenagens desnecessárias gastam energia.'
        },
        {
            numero: 9,
            modulo: 6,
            texto: 'Qual conjunto contém resíduos automotivos?',
            opcoes: [
                'Somente papel.',
                'Apenas água limpa.',
                'Óleo usado, filtros, pneus e baterias.',
                'Somente combustível novo.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'Manutenção e reparos geram materiais que precisam de destinação adequada.'
        },
        {
            numero: 10,
            modulo: 6,
            texto: 'O que é logística reversa?',
            opcoes: [
                'Jogar tudo no lixo comum.',
                'Recolher certos produtos usados para destinação adequada.',
                'Guardar peças para sempre.',
                'Transportar resíduos pela contramão.'
            ],
            correta: 1,
            corretaLetra: 'B',
            explicacao: 'Ela organiza o retorno de alguns materiais após o uso.'
        }
    ],
    3: [
        {
            numero: 1,
            modulo: 7,
            texto: 'Mobilidade sustentável procura combinar:',
            opcoes: [
                'Somente rapidez dos carros.',
                'Acesso, segurança, inclusão e menor impacto ambiental.',
                'Uso obrigatório de uma opção.',
                'Fim de todas as ruas.'
            ],
            correta: 1,
            corretaLetra: 'B',
            explicacao: 'Mobilidade sustentável considera pessoas, infraestrutura e recursos.'
        },
        {
            numero: 2,
            modulo: 7,
            texto: 'Quando a bicicleta pode ser uma boa opção?',
            opcoes: [
                'Em qualquer rota, mesmo perigosa.',
                'Apenas para quem tem carro.',
                'Quando distância e infraestrutura permitem uma viagem segura.',
                'Somente quando não há ônibus.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'Distância, condições pessoais e segurança devem ser avaliadas.'
        },
        {
            numero: 3,
            modulo: 7,
            texto: 'O transporte coletivo pode contribuir ao:',
            opcoes: [
                'Transportar muitas pessoas por veículo.',
                'Eliminar sozinho todo congestionamento.',
                'Atender somente o centro.',
                'Dispensar pontos de ônibus.'
            ],
            correta: 0,
            corretaLetra: 'A',
            explicacao: 'Ele atende várias pessoas em uma viagem.'
        },
        {
            numero: 4,
            modulo: 7,
            texto: 'Por que não há uma opção melhor para todas as viagens?',
            opcoes: [
                'Segurança não importa.',
                'Distância não importa.',
                'Só o custo importa.',
                'Necessidades e condições variam conforme a situação.'
            ],
            correta: 3,
            corretaLetra: 'D',
            explicacao: 'Considere segurança, acessibilidade, custo e disponibilidade.'
        },
        {
            numero: 5,
            modulo: 8,
            texto: 'Cidadania no trânsito significa:',
            opcoes: [
                'Exigir prioridade sempre.',
                'Seguir regras só com fiscalização.',
                'Exercer direitos e cumprir deveres respeitando os outros.',
                'Deixar tudo para os motoristas.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'Cidadania inclui cooperação e responsabilidade.'
        },
        {
            numero: 6,
            modulo: 8,
            texto: 'Estacionar sobre a calçada pode:',
            opcoes: [
                'Bloquear pedestres e dificultar a acessibilidade.',
                'Beneficiar os pedestres.',
                'Afetar somente o dono do carro.',
                'Liberar a passagem.'
            ],
            correta: 0,
            corretaLetra: 'A',
            explicacao: 'Calçadas precisam permitir a circulação segura.'
        },
        {
            numero: 7,
            modulo: 8,
            texto: 'Quem deve colaborar para a boa convivência?',
            opcoes: [
                'Somente agentes.',
                'Somente motoristas.',
                'Somente ciclistas.',
                'Todos os usuários, conforme sua participação.'
            ],
            correta: 3,
            corretaLetra: 'D',
            explicacao: 'O trânsito é compartilhado por diferentes pessoas.'
        },
        {
            numero: 8,
            modulo: 9,
            texto: 'Ao passar perto de uma bicicleta, o motorista deve:',
            opcoes: [
                'Manter afastamento seguro e evitar manobras bruscas.',
                'Passar o mais perto possível.',
                'Buzinar sem parar.',
                'Presumir que o ciclista vai parar.'
            ],
            correta: 0,
            corretaLetra: 'A',
            explicacao: 'Distância e movimentos previsíveis reduzem riscos.'
        },
        {
            numero: 9,
            modulo: 9,
            texto: 'Perto de escolas, o correto é:',
            opcoes: [
                'Acelerar antes da faixa.',
                'Redobrar a atenção às crianças e à sinalização.',
                'Ignorar crianças acompanhadas.',
                'Parar sobre a calçada.'
            ],
            correta: 1,
            corretaLetra: 'B',
            explicacao: 'Crianças podem agir de forma inesperada.'
        },
        {
            numero: 10,
            modulo: 9,
            texto: 'Por que manter rampas e calçadas livres?',
            opcoes: [
                'Para estacionar motos.',
                'Porque só ciclistas usam rampas.',
                'Para permitir circulação acessível e segura.',
                'Para dispensar faixas de pedestres.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'Esses espaços atendem pessoas com diferentes necessidades.'
        }
    ],
    4: [
        {
            numero: 1,
            modulo: 10,
            texto: 'Cidadania no trânsito vai além de obedecer às regras porque exige:',
            opcoes: [
                'Disputar espaço.',
                'Paciência, cooperação e cuidado com outras pessoas.',
                'Ignorar erros dos outros.',
                'Respeitar só veículos semelhantes.'
            ],
            correta: 1,
            corretaLetra: 'B',
            explicacao: 'A convivência segura também depende de atitudes respeitosas.'
        },
        {
            numero: 2,
            modulo: 10,
            texto: 'Em uma situação tensa com outro condutor, é mais seguro:',
            opcoes: [
                'Fechar o veículo.',
                'Parar para discutir na pista.',
                'Manter distância e evitar provocações.',
                'Buzinar repetidamente.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'Provocações podem aumentar o risco de colisão.'
        },
        {
            numero: 3,
            modulo: 10,
            texto: 'Como demonstrar respeito aos agentes de trânsito?',
            opcoes: [
                'Observar suas orientações e colaborar.',
                'Ignorar orientações quando a via parece vazia.',
                'Alterar sinais por conta própria.',
                'Discutir na pista.'
            ],
            correta: 0,
            corretaLetra: 'A',
            explicacao: 'Agentes ajudam a organizar a circulação.'
        },
        {
            numero: 4,
            modulo: 10,
            texto: 'Qual comportamento tende a agravar conflitos?',
            opcoes: [
                'Manter a calma.',
                'Ceder passagem quando a regra determina.',
                'Evitar disputas.',
                'Buzinar por irritação e fechar outro veículo.'
            ],
            correta: 3,
            corretaLetra: 'D',
            explicacao: 'Agressividade prejudica decisões prudentes.'
        },
        {
            numero: 5,
            modulo: 10,
            texto: 'Um cidadão responsável deve:',
            opcoes: [
                'Danificar sinalização.',
                'Respeitar regras, preservar equipamentos e comunicar perigos.',
                'Disputar passagem sem prioridade.',
                'Obstruir a via.'
            ],
            correta: 1,
            corretaLetra: 'B',
            explicacao: 'Responsabilidade envolve cooperação e cuidado coletivo.'
        },
        {
            numero: 6,
            modulo: 11,
            texto: 'Por que preservar placas, semáforos e calçadas?',
            opcoes: [
                'Porque servem só aos motoristas.',
                'Porque nunca precisam de reparo.',
                'Porque ajudam a organizar o acesso da comunidade.',
                'Porque dispensam atenção individual.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'A infraestrutura serve a toda a comunidade.'
        },
        {
            numero: 7,
            modulo: 11,
            texto: 'Qual atitude prejudica o espaço público?',
            opcoes: [
                'Abandonar objetos na via ou bloquear calçadas.',
                'Respeitar sinais.',
                'Comunicar defeitos.',
                'Cuidar dos equipamentos.'
            ],
            correta: 0,
            corretaLetra: 'A',
            explicacao: 'Obstáculos tornam a circulação mais difícil e perigosa.'
        },
        {
            numero: 8,
            modulo: 11,
            texto: 'Ao encontrar uma placa danificada, a atitude adequada é:',
            opcoes: [
                'Alterá-la por conta própria.',
                'Comunicar o problema ao órgão responsável.',
                'Retirá-la da via.',
                'Ignorar e acelerar.'
            ],
            correta: 1,
            corretaLetra: 'B',
            explicacao: 'A manutenção da sinalização cabe ao órgão competente.'
        },
        {
            numero: 9,
            modulo: 11,
            texto: 'Uma calçada livre facilita a circulação de:',
            opcoes: [
                'Apenas pessoas sem dificuldade de locomoção.',
                'Somente motoristas.',
                'Apenas ciclistas.',
                'Pedestres, idosos, crianças e pessoas com deficiência.'
            ],
            correta: 3,
            corretaLetra: 'D',
            explicacao: 'Calçadas desobstruídas melhoram a acessibilidade.'
        },
        {
            numero: 10,
            modulo: 11,
            texto: 'Os usuários das vias devem evitar:',
            opcoes: [
                'Somente atrasos.',
                'Apenas transporte coletivo.',
                'Atos que criem perigo, obstáculos ou danos ao patrimônio.',
                'A comunicação de defeitos.'
            ],
            correta: 2,
            corretaLetra: 'C',
            explicacao: 'Evitar obstruções e danos é uma responsabilidade no trânsito.'
        }
    ]
};

export function getQuestoesByBateria(materiaId, bateriaNumeroOrId) {
    let num = 1;
    if (typeof bateriaNumeroOrId === 'number') {
        num = bateriaNumeroOrId;
    } else if (typeof bateriaNumeroOrId === 'string') {
        const match = bateriaNumeroOrId.match(/\d+/);
        if (match) num = Number(match[0]);
    }
    num = Math.max(1, Math.min(4, num));

    const banco = QUESTOES_DATA_MEIO_AMBIENTE[num];
    if (Array.isArray(banco) && banco.length > 0) {
        return banco;
    }
    return [];
}

