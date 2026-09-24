import { MESSAGES } from '../constants/messages.js';

export const LOCKED_MODULE_MESSAGE = MESSAGES.MODULO_BLOQUEADO || 'Conclua o módulo anterior para desbloquear este módulo!';

export function resolvePdfUrl(filename, folder = 'modulo1') {
    if (!filename) return null;
    let path = filename;
    if (!path.startsWith('modulo1/') && !path.startsWith('modulo2/') && !path.startsWith('modulo4/') && !path.startsWith('modulo5/')) {
        path = `${folder}/${filename}`;
    }
    const encoded = encodeURI(path);
    if (typeof window !== 'undefined' && window.location && window.location.pathname) {
        if (window.location.pathname.includes('/src/pages/') || window.location.pathname.includes('/pages/')) {
            return `../../assets/PDFs/${encoded}`;
        }
    }
    return `../../assets/PDFs/${encoded}`;
}

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
        totalCapitulos: 10,
        modulos: [
            {
                id: 'ctb-mod-1',
                numero: 1,
                titulo: 'Conhecendo o Trânsito',
                descricao: 'Conceitos fundamentais de trânsito, vias públicas, circulação segura e o papel do cidadão nas vias brasileiras.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'Conhecendo_o_trânsito.pdf',
                pdfUrl: resolvePdfUrl('Conhecendo_o_trânsito.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-2',
                numero: 2,
                titulo: 'Sistema Nacional de Trânsito',
                descricao: 'Estrutura, composição e competências dos órgãos normativos e executivos do SNT (CONTRAN, DETRAN, PRF e JARI).',
                duracao: '25 min',
                topicos: 5,
                pdfNome: 'AprovaDrive_Modulo_02_Sistema_Nacional_de_Transito.pdf',
                pdfUrl: resolvePdfUrl('AprovaDrive_Modulo_02_Sistema_Nacional_de_Transito.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-3',
                numero: 3,
                titulo: 'Habilitação e Condutor',
                descricao: 'Processo de formação do condutor, categorias de CNH (A, B, C, D e E), Permissão Para Dirigir (PPD) e renovação.',
                duracao: '30 min',
                topicos: 5,
                pdfNome: 'AprovaDrive_Modulo_03_Habilitacao_e_Condutor.pdf',
                pdfUrl: resolvePdfUrl('AprovaDrive_Modulo_03_Habilitacao_e_Condutor.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-4',
                numero: 4,
                titulo: 'Regras de Circulação e Conduta',
                descricao: 'Normas gerais de circulação, preferências em cruzamentos e rotatórias, limites de velocidade, uso de luzes e ultrapassagens.',
                duracao: '35 min',
                topicos: 6,
                pdfNome: 'AprovaDrive_Modulo_04_Regras_de_Circulacao_e_Conduta.pdf',
                pdfUrl: resolvePdfUrl('AprovaDrive_Modulo_04_Regras_de_Circulacao_e_Conduta.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-5',
                numero: 5,
                titulo: 'Infrações de Trânsito',
                descricao: 'Classificação das infrações (leves, médias, graves e gravíssimas), sistema de pontuação e fatores multiplicadores.',
                duracao: '30 min',
                topicos: 5,
                pdfNome: 'AprovaDrive_Modulo_05_Infracoes_de_Transito.pdf',
                pdfUrl: resolvePdfUrl('AprovaDrive_Modulo_05_Infracoes_de_Transito.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-6',
                numero: 6,
                titulo: 'Penalidades e Medidas Administrativas',
                descricao: 'Diferença entre penalidades aplicadas pela autoridade e medidas administrativas adotadas pelo agente (retenção, remoção e recolhimento).',
                duracao: '30 min',
                topicos: 5,
                pdfNome: 'AprovaDrive_Modulo_06_Penalidades_e_Medidas_Administrativas.pdf',
                pdfUrl: resolvePdfUrl('AprovaDrive_Modulo_06_Penalidades_e_Medidas_Administrativas.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-7',
                numero: 7,
                titulo: 'Crimes de Trânsito',
                descricao: 'Infrações penais previstas no CTB: embriaguez ao volante, racha/pegas, homicídio e lesão corporal culposa, e penas aplicáveis.',
                duracao: '25 min',
                topicos: 4,
                pdfNome: 'AprovaDrive_Modulo_07_Crimes_de_Transito.pdf',
                pdfUrl: resolvePdfUrl('AprovaDrive_Modulo_07_Crimes_de_Transito.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-8',
                numero: 8,
                titulo: 'Parada, Estacionamento e Imobilização',
                descricao: 'Diferenças legais e operacionais entre parar e estacionar, proibições de estacionamento e normas para carga e descarga.',
                duracao: '25 min',
                topicos: 4,
                pdfNome: 'AprovaDrive_Modulo_08_Parada_Estacionamento_e_Imobilizacao.pdf',
                pdfUrl: resolvePdfUrl('AprovaDrive_Modulo_08_Parada_Estacionamento_e_Imobilizacao.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-9',
                numero: 9,
                titulo: 'Responsabilidades e Segurança no Trânsito',
                descricao: 'Responsabilidade objetiva do poder público, deveres dos condutores, segurança dos pedestres e vulneráveis e convívio harmônico.',
                duracao: '25 min',
                topicos: 4,
                pdfNome: 'AprovaDrive_Modulo_09_Responsabilidades_e_Seguranca_no_Transito.pdf',
                pdfUrl: resolvePdfUrl('AprovaDrive_Modulo_09_Responsabilidades_e_Seguranca_no_Transito.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'ctb-mod-10',
                numero: 10,
                titulo: 'Revisão Geral',
                descricao: 'Síntese completa de todos os módulos de legislação, questões comentadas e checklist final preparatório para a prova teórica do DETRAN.',
                duracao: '45 min',
                topicos: 6,
                pdfNome: 'AprovaDrive_Modulo_10_Revisao_Geral.pdf',
                pdfUrl: resolvePdfUrl('AprovaDrive_Modulo_10_Revisao_Geral.pdf'),
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
        pdfFolder: 'modulo2',
        descricao: 'Domine a sinalização vertical, horizontal, semafórica e gestos de agentes para trafegar com segurança e acertar tudo na prova.',
        totalCapitulos: 10,
        modulos: [
            {
                id: 'plc-mod-1',
                numero: 1,
                titulo: 'Introdução à Sinalização',
                descricao: 'Conceitos gerais, hierarquia da sinalização, finalidades e princípios estabelecidos pelo CTB.',
                duracao: '15 min',
                topicos: 4,
                pdfNome: 'modulo2/Modulo 01 - Introducao a Sinalizacao.pdf',
                pdfUrl: resolvePdfUrl('modulo2/Modulo 01 - Introducao a Sinalizacao.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-2',
                numero: 2,
                titulo: 'Sinalização Vertical',
                descricao: 'Classificação da sinalização fixada em suportes verticais: regulamentação, advertência e indicação.',
                duracao: '20 min',
                topicos: 5,
                pdfNome: 'modulo2/Modulo 02 - Sinalizacao Vertical.pdf',
                pdfUrl: resolvePdfUrl('modulo2/Modulo 02 - Sinalizacao Vertical.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-3',
                numero: 3,
                titulo: 'Placas de Regulamentação',
                descricao: 'Placas vermelhas e redondas de obrigações, restrições e proibições de cumprimento obrigatório.',
                duracao: '25 min',
                topicos: 6,
                pdfNome: 'modulo2/Modulo 03 - Placas de Regulamentacao.pdf',
                pdfUrl: resolvePdfUrl('modulo2/Modulo 03 - Placas de Regulamentacao.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-4',
                numero: 4,
                titulo: 'Placas de Advertência',
                descricao: 'Placas amarelas de atenção prévia a perigos potenciais, curvas, aclives e estreitamentos na pista.',
                duracao: '25 min',
                topicos: 5,
                pdfNome: 'modulo2/Modulo 04 - Placas de Advertencia.pdf',
                pdfUrl: resolvePdfUrl('modulo2/Modulo 04 - Placas de Advertencia.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-5',
                numero: 5,
                titulo: 'Placas de Indicação',
                descricao: 'Sinalização de identificação de rodovias, destinos, distâncias, serviços auxiliares e atrativos turísticos.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo2/Modulo 05 - Placas de Indicacao.pdf',
                pdfUrl: resolvePdfUrl('modulo2/Modulo 05 - Placas de Indicacao.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-6',
                numero: 6,
                titulo: 'Sinalização Horizontal',
                descricao: 'Marcas viárias pintadas no pavimento: faixas contínuas, seccionadas, faixas de pedestre e marcas de canalização.',
                duracao: '25 min',
                topicos: 5,
                pdfNome: 'modulo2/Modulo 06 - Sinalizacao Horizontal.pdf',
                pdfUrl: resolvePdfUrl('modulo2/Modulo 06 - Sinalizacao Horizontal.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-7',
                numero: 7,
                titulo: 'Semáforos e Controle Luminoso',
                descricao: 'Sinalização semafórica para veículos e pedestres, fases, tempos de verde, amarelo e vermelho.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo2/Modulo 07 - Semaforos.pdf',
                pdfUrl: resolvePdfUrl('modulo2/Modulo 07 - Semaforos.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-8',
                numero: 8,
                titulo: 'Sinais dos Agentes de Trânsito',
                descricao: 'Comandos gestuais e ordens emitidas pela autoridade de trânsito que prevalecem sobre as demais regras.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo2/Modulo 08 - Sinais dos Agentes de Transito.pdf',
                pdfUrl: resolvePdfUrl('modulo2/Modulo 08 - Sinais dos Agentes de Transito.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-9',
                numero: 9,
                titulo: 'Sinais Sonoros e Outros Sinais',
                descricao: 'Silvos de apito do agente, dispositivos auxiliares de segurança, barreiras e sinalização temporária de obras.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo2/Modulo 09 - Sinais Sonoros e Outros Sinais.pdf',
                pdfUrl: resolvePdfUrl('modulo2/Modulo 09 - Sinais Sonoros e Outros Sinais.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'plc-mod-10',
                numero: 10,
                titulo: 'Como Não Confundir as Placas',
                descricao: 'Guia comparativo definitivo das placas mais cobradas e com maiores taxas de pegadinhas nas provas teóricas.',
                duracao: '30 min',
                topicos: 6,
                pdfNome: 'modulo2/Modulo 10 - Como Nao Confundir as Placas.pdf',
                pdfUrl: resolvePdfUrl('modulo2/Modulo 10 - Como Nao Confundir as Placas.pdf'),
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
        pdfFolder: 'modulo4',
        descricao: 'Orientações práticas de atendimento emergencial para prestar auxílio seguro em sinistros de trânsito sem se colocar em risco.',
        totalCapitulos: 10,
        modulos: [
            {
                id: 'soc-mod-1',
                numero: 1,
                titulo: 'Introdução aos Primeiros Socorros',
                descricao: 'Conceitos essenciais, dever legal de auxílio (art. 176 do CTB), limites de atuação do cidadão e postura segura sem agravamento de danos.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo4/AprovaDrive_Modulo_01_Introducao_aos_Primeiros_Socorros.pdf',
                pdfUrl: resolvePdfUrl('modulo4/AprovaDrive_Modulo_01_Introducao_aos_Primeiros_Socorros.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-2',
                numero: 2,
                titulo: 'Ao Presenciar um Acidente',
                descricao: 'Sequência geral de procedimentos: manter a calma, identificação de perigos imediatos, sinalização sem riscos e acionamento dos canais oficiais.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo4/AprovaDrive_Modulo_02_Ao_Presenciar_um_Acidente.pdf',
                pdfUrl: resolvePdfUrl('modulo4/AprovaDrive_Modulo_02_Ao_Presenciar_um_Acidente.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-3',
                numero: 3,
                titulo: 'Segurança da Cena',
                descricao: 'Avaliação do entorno viário, checklist visual de riscos secundários (combustível, fios caídos, tráfego ativo) e proteção do local.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo4/AprovaDrive_Modulo_03_Seguranca_da_Cena.pdf',
                pdfUrl: resolvePdfUrl('modulo4/AprovaDrive_Modulo_03_Seguranca_da_Cena.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-4',
                numero: 4,
                titulo: 'Acione os Serviços de Emergência',
                descricao: 'Canais oficiais de socorro (SAMU 192, Bombeiros 193, PM 190, PRF 191), triagem correta e transmissão precisa de dados ao atendente.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo4/AprovaDrive_Modulo_04_Servicos_de_Emergencia.pdf',
                pdfUrl: resolvePdfUrl('modulo4/AprovaDrive_Modulo_04_Servicos_de_Emergencia.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-5',
                numero: 5,
                titulo: 'Avaliação Inicial da Vítima',
                descricao: 'Verificação de responsividade, respiração e consciência; comunicação clara com a vítima e orientações para não realizar manobras invasivas.',
                duracao: '25 min',
                topicos: 5,
                pdfNome: 'modulo4/AprovaDrive_Modulo_05_Avaliacao_Inicial_da_Vitima.pdf',
                pdfUrl: resolvePdfUrl('modulo4/AprovaDrive_Modulo_05_Avaliacao_Inicial_da_Vitima.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-6',
                numero: 6,
                titulo: 'Vítimas Inconscientes',
                descricao: 'Cuidados específicos com ausência de resposta, proteção da coluna cervical, riscos de movimentação indevida e manutenção da vigilância.',
                duracao: '25 min',
                topicos: 4,
                pdfNome: 'modulo4/AprovaDrive_Modulo_06_Vitimas_Inconscientes.pdf',
                pdfUrl: resolvePdfUrl('modulo4/AprovaDrive_Modulo_06_Vitimas_Inconscientes.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-7',
                numero: 7,
                titulo: 'Sangramentos e Ferimentos',
                descricao: 'Identificação de hemorragias externas, uso de barreiras de proteção, cuidados essenciais e condutas terminantemente proibidas.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo4/AprovaDrive_Modulo_07_Sangramentos_e_Ferimentos.pdf',
                pdfUrl: resolvePdfUrl('modulo4/AprovaDrive_Modulo_07_Sangramentos_e_Ferimentos.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-8',
                numero: 8,
                titulo: 'Fraturas, Traumas e Lesões',
                descricao: 'Reconhecimento de sinais de fraturas e traumas em cabeça, pescoço e membros, e a regra de ouro de nunca retirar o capacete.',
                duracao: '25 min',
                topicos: 5,
                pdfNome: 'modulo4/AprovaDrive_Modulo_08_Fraturas_Traumas_e_Lesoes.pdf',
                pdfUrl: resolvePdfUrl('modulo4/AprovaDrive_Modulo_08_Fraturas_Traumas_e_Lesoes.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-9',
                numero: 9,
                titulo: 'Queimaduras e Incêndios',
                descricao: 'Proteção individual em cenários com fogo, fumaça ou líquidos aquecidos, acionamento do 193 e condutas preventivas contra novas vítimas.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo4/AprovaDrive_Modulo_09_Queimaduras_e_Incendios.pdf',
                pdfUrl: resolvePdfUrl('modulo4/AprovaDrive_Modulo_09_Queimaduras_e_Incendios.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'soc-mod-10',
                numero: 10,
                titulo: 'Choque Elétrico e Outros Riscos',
                descricao: 'Precauções com cabos caídos e veículos energizados, produtos perigosos, cargas instáveis e acionamento de resgate especializado.',
                duracao: '25 min',
                topicos: 4,
                pdfNome: 'modulo4/AprovaDrive_Modulo_10_Choque_Eletrico_e_Outros_Riscos.pdf',
                pdfUrl: resolvePdfUrl('modulo4/AprovaDrive_Modulo_10_Choque_Eletrico_e_Outros_Riscos.pdf'),
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
        pdfFolder: 'modulo5',
        descricao: 'Entenda os impactos ambientais causados por veículos, poluição sonora e atmosférica, além da convivência cidadã no trânsito.',
        totalCapitulos: 9,
        modulos: [
            {
                id: 'amb-mod-1',
                numero: 1,
                titulo: 'Trânsito, Meio Ambiente e Sociedade',
                descricao: 'Conceitos fundamentais sobre a relação entre escolhas individuais, mobilidade urbana, infraestrutura e sustentabilidade ambiental nas cidades.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo5/AprovaDrive_Meio_Ambiente_Modulo_01_Transito_Meio_Ambiente_e_Sociedade.pdf',
                pdfUrl: resolvePdfUrl('modulo5/AprovaDrive_Meio_Ambiente_Modulo_01_Transito_Meio_Ambiente_e_Sociedade.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-mod-2',
                numero: 2,
                titulo: 'Poluição do Ar',
                descricao: 'Processo de combustão veicular, emissões de gases poluentes, papel do PROCONVE/IBAMA e a importância da manutenção preventiva.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo5/AprovaDrive_Meio_Ambiente_Modulo_02_Poluicao_do_Ar.pdf',
                pdfUrl: resolvePdfUrl('modulo5/AprovaDrive_Meio_Ambiente_Modulo_02_Poluicao_do_Ar.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-mod-3',
                numero: 3,
                titulo: 'Poluição Sonora',
                descricao: 'Efeitos do ruído excessivo na saúde pública, regras de uso breve da buzina pelo CTB e fiscalização de escapamentos irregulares.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo5/AprovaDrive_Meio_Ambiente_Modulo_03_Poluicao_Sonora.pdf',
                pdfUrl: resolvePdfUrl('modulo5/AprovaDrive_Meio_Ambiente_Modulo_03_Poluicao_Sonora.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-mod-4',
                numero: 4,
                titulo: 'Manutenção do Veículo e Meio Ambiente',
                descricao: 'Impactos da manutenção no consumo e emissões: motor, pneus, escapamento, filtros e contenção de vazamentos de fluidos.',
                duracao: '25 min',
                topicos: 4,
                pdfNome: 'modulo5/AprovaDrive_Meio_Ambiente_Modulo_04_Manutencao_do_Veiculo.pdf',
                pdfUrl: resolvePdfUrl('modulo5/AprovaDrive_Meio_Ambiente_Modulo_04_Manutencao_do_Veiculo.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-mod-5',
                numero: 5,
                titulo: 'Combustíveis e Consumo Consciente',
                descricao: 'Tipos de combustíveis, técnicas de condução eficiente, planejamento de rotas e redução de desperdícios no dia a dia.',
                duracao: '25 min',
                topicos: 4,
                pdfNome: 'modulo5/AprovaDrive_Meio_Ambiente_Modulo_05_Combustiveis_e_Consumo_Consciente.pdf',
                pdfUrl: resolvePdfUrl('modulo5/AprovaDrive_Meio_Ambiente_Modulo_05_Combustiveis_e_Consumo_Consciente.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-mod-6',
                numero: 6,
                titulo: 'Resíduos e Descarte Correto',
                descricao: 'Destinação adequada de óleo lubrificante, pneus, filtros e baterias usadas, responsabilidade ambiental e logística reversa.',
                duracao: '25 min',
                topicos: 4,
                pdfNome: 'modulo5/AprovaDrive_Meio_Ambiente_Modulo_06_Residuos_e_Descarte_Correto.pdf',
                pdfUrl: resolvePdfUrl('modulo5/AprovaDrive_Meio_Ambiente_Modulo_06_Residuos_e_Descarte_Correto.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-mod-7',
                numero: 7,
                titulo: 'Mobilidade Sustentável',
                descricao: 'Integração modal, transporte coletivo, circulação a pé e por bicicletas, carona solidária e planejamento urbano inclusivo.',
                duracao: '25 min',
                topicos: 4,
                pdfNome: 'modulo5/AprovaDrive_Meio_Ambiente_Modulo_07_Mobilidade_Sustentavel.pdf',
                pdfUrl: resolvePdfUrl('modulo5/AprovaDrive_Meio_Ambiente_Modulo_07_Mobilidade_Sustentavel.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-mod-8',
                numero: 8,
                titulo: 'Cidadania no Trânsito',
                descricao: 'Exercício de direitos e cumprimento de deveres coletivos, preservação do patrimônio público e convivência solidária.',
                duracao: '20 min',
                topicos: 4,
                pdfNome: 'modulo5/AprovaDrive_Meio_Ambiente_Modulo_08_Cidadania_no_Transito.pdf',
                pdfUrl: resolvePdfUrl('modulo5/AprovaDrive_Meio_Ambiente_Modulo_08_Cidadania_no_Transito.pdf'),
                status: 'available',
                bloqueado: false
            },
            {
                id: 'amb-mod-9',
                numero: 9,
                titulo: 'Respeito aos Usuários da Via',
                descricao: 'Proteção e prioridade aos pedestres, ciclistas, idosos e pessoas com deficiência, distância lateral de segurança e empatia nas vias.',
                duracao: '25 min',
                topicos: 4,
                pdfNome: 'modulo5/AprovaDrive_Meio_Ambiente_Modulo_09_Respeito_aos_Usuarios_da_Via.pdf',
                pdfUrl: resolvePdfUrl('modulo5/AprovaDrive_Meio_Ambiente_Modulo_09_Respeito_aos_Usuarios_da_Via.pdf'),
                status: 'locked',
                bloqueado: true
            }
        ]
    }
};

export function getConteudoById(id) {
    if (!id) return null;
    if (CONTEUDOS_DATA[id]) return CONTEUDOS_DATA[id];

    const normalized = String(id).toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = Object.keys(CONTEUDOS_DATA).find(key => {
        const item = CONTEUDOS_DATA[key];
        return key.toLowerCase() === normalized ||
            item.slug.replace(/[^a-z0-9]/g, '') === normalized;
    });

    return foundKey ? CONTEUDOS_DATA[foundKey] : null;
}

export function getModulosByConteudoId(id, moduloAtual = null) {
    const conteudo = getConteudoById(id);
    if (!conteudo || !Array.isArray(conteudo.modulos)) {
        return [];
    }

    const total = conteudo.modulos.length;
    const folder = conteudo.pdfFolder || (id === 'PlacaTransito' ? 'modulo2' : (id === 'PrimeirosSocorros' ? 'modulo4' : (id === 'MeioAmbiente' ? 'modulo5' : 'modulo1')));
    return conteudo.modulos.map((modulo, index) => {
        const num = Number(modulo.numero || (index + 1));
        const pdfUrl = modulo.pdfUrl || (modulo.pdfNome ? resolvePdfUrl(modulo.pdfNome, folder) : null);

        let status = 'available';
        let bloqueado = false;

        if (moduloAtual !== null && moduloAtual !== undefined) {
            const nivelAtual = Math.min(10, Math.max(1, Number(moduloAtual)));
            if (num < nivelAtual) {
                status = 'done';
                bloqueado = false;
            } else if (num === nivelAtual) {
                status = 'available';
                bloqueado = false;
            } else {
                status = 'locked';
                bloqueado = true;
            }
        } else {
            const isLast = index === total - 1;
            status = isLast ? 'locked' : 'available';
            bloqueado = isLast;
        }

        return {
            ...modulo,
            pdfUrl,
            status,
            bloqueado
        };
    });
}
