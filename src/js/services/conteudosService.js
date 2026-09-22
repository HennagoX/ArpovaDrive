import { MESSAGES } from '../constants/messages.js';

export const LOCKED_MODULE_MESSAGE = MESSAGES.MODULO_BLOQUEADO || 'Conclua o módulo anterior para desbloquear este módulo!';

/**
 * Base de dados mockada dos conteúdos e seus respectivos módulos
 * para a plataforma AprovaDrive.
 */
export const CONTEUDOS_DATA = {
    CodigoTransito: {
        id: 'CodigoTransito',
        slug: 'codigo-transito',
        titulo: 'Código de Trânsito',
        categoria: 'LEGISLAÇÃO',
        categoriaKey: 'legislacao',
        cor: 'green',
        icone: 'fa-solid fa-scale-balanced',
        descricao: 'Aprenda as principais leis, normas de circulação, infrações e direitos estabelecidos pelo Código de Trânsito Brasileiro (CTB).',
        totalCapitulos: 12,
        modulos: [
            {
                id: 'ctb-mod-1',
                numero: 1,
                titulo: 'Introdução ao CTB e Sistema Nacional de Trânsito',
                descricao: 'Conheça os órgãos normativos e executivos do SNT, os princípios da segurança viária e as diretrizes básicas da legislação brasileira.',
                duracao: '20 min',
                topicos: 4,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-2',
                numero: 2,
                titulo: 'Normas Gerais de Circulação e Conduta',
                descricao: 'Regras essenciais de preferência de passagem, ultrapassagem segura, velocidade em diferentes vias, uso de faróis e regras de parada.',
                duracao: '35 min',
                topicos: 6,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-3',
                numero: 3,
                titulo: 'Infrações, Penalidades e Medidas Administrativas',
                descricao: 'Classificação das infrações em leves, médias, graves e gravíssimas, pontuação acumulada na CNH, suspensão do direito de dirigir e retenção veicular.',
                duracao: '30 min',
                topicos: 5,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-4',
                numero: 4,
                titulo: 'Habilitação, Crimes de Trânsito e Recursos',
                descricao: 'Processo completo de primeira habilitação, renovação, crimes culposos e dolosos previstos no CTB e prazos de defesa na JARI.',
                duracao: '40 min',
                topicos: 5,
                status: 'locked',
                bloqueado: true
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
        descricao: 'Domine a sinalização vertical, horizontal, semafórica e gestos de agentes para trafegar com segurança e acertar tudo na prova.',
        totalCapitulos: 8,
        modulos: [
            {
                id: 'plc-mod-1',
                numero: 1,
                titulo: 'Placas de Regulamentação (Vermelhas)',
                descricao: 'Aprenda as placas imperativas que impõem proibições, restrições e obrigações indispensáveis com penalidade direta por descumprimento.',
                duracao: '20 min',
                topicos: 5,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-2',
                numero: 2,
                titulo: 'Placas de Advertência (Amarelas)',
                descricao: 'Identifique os alertas prévios sobre riscos na pista, como curvas perigosas, aclives, estreitamentos de pista e cruzamentos.',
                duracao: '25 min',
                topicos: 4,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-3',
                numero: 3,
                titulo: 'Placas de Indicação, Educativas e Serviços Auxiliares',
                descricao: 'Sinalização azul e verde de identificação de rotas, distâncias, cidades, atrativos turísticos e locais de serviços como hospitais e postos.',
                duracao: '20 min',
                topicos: 4,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-4',
                numero: 4,
                titulo: 'Sinalização Horizontal, Luminosa e Gestual',
                descricao: 'Significado das faixas contínuas, seccionadas, faixas amarelas e brancas no asfalto, tempos dos semáforos e gestos universais de agentes.',
                duracao: '30 min',
                topicos: 5,
                status: 'locked',
                bloqueado: true
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
        descricao: 'Aprenda metodologias preventivas de direção para antecipar perigos, evitar acidentes e proteger a sua vida e a de terceiros.',
        totalCapitulos: 10,
        modulos: [
            {
                id: 'dir-mod-1',
                numero: 1,
                titulo: 'Fundamentos e Elementos da Condução Defensiva',
                descricao: 'Os cinco pilares fundamentais: Conhecimento, Atenção, Previsão, Decisão e Habilidade para evitar ocorrências no dia a dia.',
                duracao: '25 min',
                topicos: 4,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'dir-mod-2',
                numero: 2,
                titulo: 'Condições Adversas de Clima, Pista e Luz',
                descricao: 'Como conduzir com segurança em situações de chuva forte, aquaplanagem, neblina, pista escorregadia, noite e ofuscamento solar.',
                duracao: '30 min',
                topicos: 5,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'dir-mod-3',
                numero: 3,
                titulo: 'Distâncias de Segurança e Tempos de Frenagem',
                descricao: 'Cálculo da regra dos 2 segundos, tempo de reação do condutor, distância de frenagem do veículo e distância total de parada.',
                duracao: '25 min',
                topicos: 4,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'dir-mod-4',
                numero: 4,
                titulo: 'Prevenção de Colisões e Manobras de Emergência',
                descricao: 'Técnicas defensivas para evitar colisão frontal, traseira, em cruzamentos com semáforo intermitente e controle de pontos cegos.',
                duracao: '35 min',
                topicos: 6,
                status: 'locked',
                bloqueado: true
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
        descricao: 'Orientações práticas de atendimento emergencial para prestar auxílio seguro em sinistros de trânsito sem se colocar em risco.',
        totalCapitulos: 6,
        modulos: [
            {
                id: 'soc-mod-1',
                numero: 1,
                titulo: 'Segurança no Local e Acionamento de Socorro Especializado',
                descricao: 'Primeiras providências: isolar e sinalizar o local do acidente com triângulo, prevenir novos choques e acionar SAMU (192) e Resgate (193).',
                duracao: '20 min',
                topicos: 4,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-2',
                numero: 2,
                titulo: 'Avaliação Primária e Respiração da Vítima',
                descricao: 'Verificação rápida de responsividade, respiração e orientações sobre imobilização provisória da região cervical.',
                duracao: '25 min',
                topicos: 4,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-3',
                numero: 3,
                titulo: 'Controle de Hemorragias e Cuidados Iniciais',
                descricao: 'Identificação e controle de sangramentos externos através de compressão direta com pano limpo, evitando infecções.',
                duracao: '20 min',
                topicos: 3,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-4',
                numero: 4,
                titulo: 'Ações Fatais: O que NUNCA fazer em um Acidente',
                descricao: 'Ações proibidas que podem agravar o estado da vítima: nunca retirar o capacete de motociclista e não movimentar a coluna.',
                duracao: '25 min',
                topicos: 4,
                status: 'locked',
                bloqueado: true
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
        descricao: 'Entenda os impactos ambientais causados por veículos, poluição sonora e atmosférica, além da convivência cidadã no trânsito.',
        totalCapitulos: 7,
        modulos: [
            {
                id: 'amb-mod-1',
                numero: 1,
                titulo: 'Emissão de Gases Tóxicos e Poluição Atmosférica',
                descricao: 'Principais poluentes automotivos (CO, NOx, fuligem), papel do PROCONVE, funcionamento do catalisador e manutenção preventiva.',
                duracao: '20 min',
                topicos: 3,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-mod-2',
                numero: 2,
                titulo: 'Poluição Sonora e Visual no Trânsito',
                descricao: 'Limites de ruído permitidos por lei, consequências da poluição sonora contínua e penalidades pelo uso incorreto da buzina e escape.',
                duracao: '20 min',
                topicos: 3,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-mod-3',
                numero: 3,
                titulo: 'Descarte Sustentável de Resíduos Automotivos',
                descricao: 'Destinação ecológica correta de pneus usados, baterias de chumbo-ácido, fluidos de freio e óleo lubrificante queimado.',
                duracao: '25 min',
                topicos: 4,
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-mod-4',
                numero: 4,
                titulo: 'Cidadania, Direitos Humanos e Empatia nas Vias',
                descricao: 'O trânsito como espaço coletivo de convivência: respeito prioritário aos pedestres, ciclistas, idosos e pessoas com deficiência.',
                duracao: '25 min',
                topicos: 4,
                status: 'locked',
                bloqueado: true
            }
        ]
    }
};

/**
 * Retorna os detalhes de um conteúdo pelo seu ID ou slug
 * @param {string} id - Identificador do conteúdo (ex: 'CodigoTransito')
 * @returns {Object|null}
 */
export function getConteudoById(id) {
    if (!id) return null;
    if (CONTEUDOS_DATA[id]) return CONTEUDOS_DATA[id];

    // Busca alternativa por slug
    const normalized = String(id).toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = Object.keys(CONTEUDOS_DATA).find(key => {
        const item = CONTEUDOS_DATA[key];
        return key.toLowerCase() === normalized ||
            item.slug.replace(/[^a-z0-9]/g, '') === normalized;
    });

    return foundKey ? CONTEUDOS_DATA[foundKey] : null;
}

/**
 * Retorna os módulos de um conteúdo pelo ID.
 * Garante a regra de negócio do frontend:
 * - Todos os módulos anteriores livres (unlocked).
 * - O último módulo sempre bloqueado (locked).
 * @param {string} id
 * @returns {Array<Object>}
 */
export function getModulosByConteudoId(id) {
    const conteudo = getConteudoById(id);
    if (!conteudo || !Array.isArray(conteudo.modulos)) {
        return [];
    }

    const total = conteudo.modulos.length;
    return conteudo.modulos.map((modulo, index) => {
        // Regra solicitada:
        // "só deixa tudo livre e só o último bloqueado já com a mensagem que provavelmente vamos usar quando tentar ler ele tbm..."
        const isLast = index === total - 1;
        return {
            ...modulo,
            status: isLast ? 'locked' : 'available',
            bloqueado: isLast
        };
    });
}
