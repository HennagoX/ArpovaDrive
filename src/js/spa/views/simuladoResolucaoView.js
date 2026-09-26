import { qs, setText } from '../../utils/dom.js';
import {
    getSimuladoQuestoesAPI,
    concluirSimuladoAPI
} from '../../services/questoesService.js';
import { atualizarXpNoLocalStorage } from '../../services/gamificationService.js';
import { limparCacheTarefasFixas } from '../../services/tarefasFixasService.js';

let initialized = false;
let routerRef = null;
let activeMateriaId = 'Geral';
let perguntas = [];
let indexAtual = 0;
let respostasUsuario = [];
let marcadasRevisao = new Set();
let tempoRestanteSegundos = 2400;
let timerInterval = null;
let simuladoFinalizado = false;
let resultadoFinal = null;

const LETRAS = ['A', 'B', 'C', 'D'];

const MATERIAS_CONFIG = {
    Geral: {
        id: 'Geral',
        titulo: 'Simulado Geral DETRAN',
        categoria: 'SIMULADO OFICIAL',
        cor: 'orange',
        icone: 'fa-solid fa-graduation-cap'
    },
    CodigoTransito: {
        id: 'CodigoTransito',
        titulo: 'Código de Trânsito',
        categoria: 'LEGISLAÇÃO',
        cor: 'green',
        icone: 'fa-solid fa-scale-balanced'
    },
    PlacaTransito: {
        id: 'PlacaTransito',
        titulo: 'Placas de Trânsito',
        categoria: 'SINALIZAÇÃO',
        cor: 'blue',
        icone: 'fa-solid fa-road'
    },
    DirecaoOfensiva: {
        id: 'DirecaoOfensiva',
        titulo: 'Direção Defensiva',
        categoria: 'SEGURANÇA',
        cor: 'yellow',
        icone: 'fa-solid fa-car-burst'
    },
    PrimeirosSocorros: {
        id: 'PrimeirosSocorros',
        titulo: 'Primeiros Socorros',
        categoria: 'PRIMEIROS SOCORROS',
        cor: 'red',
        icone: 'fa-solid fa-kit-medical'
    },
    MeioAmbiente: {
        id: 'MeioAmbiente',
        titulo: 'Meio Ambiente e Cidadania',
        categoria: 'MEIO AMBIENTE',
        cor: 'purple',
        icone: 'fa-solid fa-leaf'
    }
};

export function initSimuladoResolucaoView(router) {
    routerRef = router;
    if (initialized) return;
    initialized = true;

    const btnVoltar = qs('#btn-voltar-hub-simulado');
    const breadcrumbRoot = qs('#breadcrumb-simulado-root-btn');

    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            confirmarSaidaSimulado();
        });
    }

    if (breadcrumbRoot) {
        breadcrumbRoot.addEventListener('click', () => {
            confirmarSaidaSimulado();
        });
    }
}

function confirmarSaidaSimulado() {
    if (!simuladoFinalizado) {
        const confirmar = window.confirm('Deseja realmente sair do simulado? O seu progresso atual nesta tentativa será perdido.');
        if (!confirmar) return;
    }
    pararTimer();
    if (routerRef) {
        routerRef.navigateTo('simulado');
    }
}

export async function abrirSimuladoResolucao(materiaId = 'Geral') {
    activeMateriaId = materiaId || 'Geral';
    pararTimer();

    const infoMateria = MATERIAS_CONFIG[activeMateriaId] || MATERIAS_CONFIG.Geral;
    const temaCor = infoMateria.cor || 'orange';

    const viewResolucao = qs('#view-simulado-resolucao');
    if (viewResolucao) {
        const classes = Array.from(viewResolucao.classList).filter(c => c.startsWith('modulos-theme-'));
        classes.forEach(c => viewResolucao.classList.remove(c));
        viewResolucao.classList.add(`modulos-theme-${temaCor}`);
    }

    const breadcrumbMateria = qs('#breadcrumb-simulado-materia');
    const tagCategoria = qs('#simulado-resolucao-tag');
    const headerTitle = qs('#simulado-resolucao-title');
    const headerSubtitle = qs('#simulado-resolucao-subtitle');

    if (breadcrumbMateria) setText(breadcrumbMateria, infoMateria.titulo);
    if (tagCategoria) setText(tagCategoria, infoMateria.categoria);
    if (headerTitle) setText(headerTitle, infoMateria.titulo);
    if (headerSubtitle) setText(headerSubtitle, 'Simulado oficial de 30 questões · Meta de aprovação: 67% (20 acertos)');

    const container = qs('#simulado-resolucao-conteudo');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #64748b;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 36px; color: #f59e0b; margin-bottom: 16px;"></i>
                <h3 style="color: #1e293b; margin-bottom: 8px;">Preparando seu Simulado...</h3>
                <p>Selecionando 30 questões atualizadas no padrão oficial DETRAN.</p>
            </div>
        `;
    }

    try {
        const questoesRaw = await getSimuladoQuestoesAPI(activeMateriaId);
        perguntas = questoesRaw.map((q, idx) => {
            const indices = [0, 1, 2, 3];
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            const novoIndiceCorreto = indices.indexOf(q.correta);
            return {
                ...q,
                numero: idx + 1,
                opcoes: indices.map(idxOriginal => q.opcoes[idxOriginal]),
                correta: novoIndiceCorreto,
                corretaLetra: LETRAS[novoIndiceCorreto],
                originalCorretaLetra: q.corretaLetra || LETRAS[q.correta]
            };
        });

        indexAtual = 0;
        respostasUsuario = Array(perguntas.length).fill(null);
        marcadasRevisao = new Set();
        tempoRestanteSegundos = 2400;
        simuladoFinalizado = false;
        resultadoFinal = null;

        iniciarTimer();
        atualizarHeaderSimulado();
        renderQuestaoSimulado();
    } catch (err) {
        if (container) {
            container.innerHTML = `
                <div style="background: #fff; border: 1px solid #fed7aa; border-radius: 16px; padding: 32px; text-align: center;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; color: #ea580c; margin-bottom: 12px;"></i>
                    <h4 style="font-size: 18px; margin-bottom: 8px;">Erro ao carregar simulado</h4>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">${escapeHtml(err.message)}</p>
                    <button type="button" class="btn-tarefa btn-estudar" id="btn-tentar-simulado-novamente">
                        <i class="fa-solid fa-rotate-right"></i> Tentar novamente
                    </button>
                </div>
            `;
            const retryBtn = qs('#btn-tentar-simulado-novamente');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => abrirSimuladoResolucao(activeMateriaId));
            }
        }
    }
}

function iniciarTimer() {
    pararTimer();
    atualizarDisplayTimer();
    timerInterval = setInterval(() => {
        tempoRestanteSegundos--;
        atualizarDisplayTimer();
        if (tempoRestanteSegundos <= 0) {
            pararTimer();
            finalizarSimulado(true);
        }
    }, 1000);
}

function pararTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function atualizarDisplayTimer() {
    const timerEl = qs('#simulado-timer-display');
    if (!timerEl) return;

    const minutos = Math.floor(Math.max(0, tempoRestanteSegundos) / 60);
    const segundos = Math.max(0, tempoRestanteSegundos) % 60;
    const formatado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    timerEl.innerHTML = `<i class="fa-solid fa-stopwatch"></i> <span>${formatado}</span>`;

    if (tempoRestanteSegundos <= 300) {
        timerEl.classList.add('timer-alerta');
    } else {
        timerEl.classList.remove('timer-alerta');
    }
}

function atualizarHeaderSimulado() {
    const total = perguntas.length || 30;
    const respondidas = respostasUsuario.filter(r => r !== null).length;
    const pct = Math.round((respondidas / total) * 100);

    const txtProgresso = qs('#simulado-progresso-texto');
    const pctProgresso = qs('#simulado-progresso-pct');
    const fillProgresso = qs('#simulado-progresso-fill');
    const respondidasPill = qs('#simulado-respondidas-pill');

    if (txtProgresso) setText(txtProgresso, `Questão ${indexAtual + 1} de ${total}`);
    if (pctProgresso) setText(pctProgresso, `${pct}%`);
    if (fillProgresso) fillProgresso.style.width = `${pct}%`;
    if (respondidasPill) setText(respondidasPill, `${respondidas}/${total} respondidas`);

    renderNavegadorQuestoes();
}

function renderNavegadorQuestoes() {
    const navContainer = qs('#simulado-grade-questoes');
    if (!navContainer) return;

    navContainer.innerHTML = perguntas.map((q, idx) => {
        const isAtual = idx === indexAtual;
        const isRespondida = respostasUsuario[idx] !== null;
        const isMarcada = marcadasRevisao.has(idx);

        let statusClass = 'status-vazia';
        if (isRespondida) statusClass = 'status-respondida';
        if (isMarcada) statusClass = 'status-marcada';
        if (isAtual) statusClass += ' status-atual';

        let iconInner = idx + 1;
        if (isMarcada) {
            iconInner = `<i class="fa-solid fa-flag" style="font-size: 10px;"></i>`;
        }

        return `
            <button type="button" class="btn-pilula-questao ${statusClass}" data-indice="${idx}" title="Ir para a Questão ${idx + 1}">
                ${iconInner}
            </button>
        `;
    }).join('');

    const pilulas = navContainer.querySelectorAll('.btn-pilula-questao');
    pilulas.forEach(btn => {
        btn.addEventListener('click', () => {
            const alvo = Number(btn.dataset.indice);
            indexAtual = alvo;
            atualizarHeaderSimulado();
            renderQuestaoSimulado();
        });
    });
}

function renderQuestaoSimulado() {
    const container = qs('#simulado-resolucao-conteudo');
    if (!container) return;

    if (simuladoFinalizado) {
        renderResultadoSimuladoFinal();
        return;
    }

    if (indexAtual >= perguntas.length) {
        finalizarSimulado(false);
        return;
    }

    const q = perguntas[indexAtual];
    const respSalva = respostasUsuario[indexAtual];
    const isMarcada = marcadasRevisao.has(indexAtual);
    const respondidasTotal = respostasUsuario.filter(r => r !== null).length;
    const faltam = perguntas.length - respondidasTotal;

    container.innerHTML = `
        <article class="simulado-pergunta-card">
            <div class="simulado-card-meta-bar">
                <div class="simulado-card-meta-left">
                    <span class="simulado-materia-chip">
                        <i class="fa-solid fa-book-bookmark"></i> ${escapeHtml(q.materia || 'DETRAN')}
                    </span>
                    <span class="simulado-questao-num-tag">Questão ${indexAtual + 1} de ${perguntas.length}</span>
                </div>
                <div class="simulado-card-meta-right">
                    <button type="button" class="btn-marcar-revisao ${isMarcada ? 'marcada' : ''}" id="btn-toggle-revisao">
                        <i class="fa-solid fa-flag"></i>
                        <span>${isMarcada ? 'Marcada para Revisão' : 'Marcar para Revisão'}</span>
                    </button>
                </div>
            </div>

            <h3 class="simulado-enunciado">${escapeHtml(q.texto)}</h3>

            <div class="simulado-opcoes-lista" id="simulado-opcoes-container">
                ${q.opcoes.map((opcao, i) => {
                    const isSelected = respSalva !== null && respSalva.indexSelecionado === i;
                    const btnClass = `simulado-opcao-item ${isSelected ? 'selecionada' : ''}`;

                    return `
                        <button type="button" class="${btnClass}" data-opcao-idx="${i}">
                            <span class="simulado-letra-circle">${LETRAS[i]}</span>
                            <span class="simulado-opcao-text">${escapeHtml(opcao)}</span>
                            <div class="simulado-radio-indicator">
                                <i class="fa-solid fa-check"></i>
                            </div>
                        </button>
                    `;
                }).join('')}
            </div>

            <div class="simulado-card-acoes-footer">
                <button type="button" class="btn-resolucao-secundario" id="btn-simulado-anterior" ${indexAtual === 0 ? 'disabled' : ''}>
                    <i class="fa-solid fa-arrow-left"></i> Anterior
                </button>

                <div class="simulado-acoes-centro">
                    <button type="button" class="btn-finalizar-simulado-top" id="btn-concluir-simulado-acao">
                        <i class="fa-solid fa-circle-check"></i> Finalizar Simulado (${faltam > 0 ? `${faltam} pendente${faltam > 1 ? 's' : ''}` : 'Completo'})
                    </button>
                </div>

                <button type="button" class="btn-resolucao-primario" id="btn-simulado-proxima">
                    ${indexAtual === perguntas.length - 1 ? 'Revisar / Concluir' : 'Próxima'} <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </article>
    `;

    const btnsOpcoes = container.querySelectorAll('.simulado-opcao-item');
    btnsOpcoes.forEach(btn => {
        btn.addEventListener('click', () => {
            const idxOpcao = Number(btn.dataset.opcaoIdx);
            selecionarResposta(idxOpcao);
        });
    });

    const btnToggleRevisao = container.querySelector('#btn-toggle-revisao');
    if (btnToggleRevisao) {
        btnToggleRevisao.addEventListener('click', () => {
            if (marcadasRevisao.has(indexAtual)) {
                marcadasRevisao.delete(indexAtual);
            } else {
                marcadasRevisao.add(indexAtual);
            }
            atualizarHeaderSimulado();
            renderQuestaoSimulado();
        });
    }

    const btnAnt = container.querySelector('#btn-simulado-anterior');
    if (btnAnt) {
        btnAnt.addEventListener('click', () => {
            if (indexAtual > 0) {
                indexAtual--;
                atualizarHeaderSimulado();
                renderQuestaoSimulado();
            }
        });
    }

    const btnProx = container.querySelector('#btn-simulado-proxima');
    if (btnProx) {
        btnProx.addEventListener('click', () => {
            if (indexAtual < perguntas.length - 1) {
                indexAtual++;
                atualizarHeaderSimulado();
                renderQuestaoSimulado();
            } else {
                finalizarSimulado(false);
            }
        });
    }

    const btnFinalizar = container.querySelector('#btn-concluir-simulado-acao');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', () => {
            finalizarSimulado(false);
        });
    }
}

function selecionarResposta(indexEscolhido) {
    const q = perguntas[indexAtual];
    const letraEscolhida = LETRAS[indexEscolhido];
    const isCorreto = indexEscolhido === q.correta;

    respostasUsuario[indexAtual] = {
        indexSelecionado: indexEscolhido,
        letraSelecionada: letraEscolhida,
        correto: isCorreto,
        originalCorretaLetra: q.originalCorretaLetra,
        explicacao: q.explicacao
    };

    atualizarHeaderSimulado();
    renderQuestaoSimulado();
}

async function finalizarSimulado(forcarPorTempo = false) {
    const total = perguntas.length || 30;
    const respondidas = respostasUsuario.filter(r => r !== null).length;
    const naoRespondidas = total - respondidas;

    if (!forcarPorTempo && naoRespondidas > 0) {
        const confirmar = window.confirm(`Você ainda não respondeu ${naoRespondidas} ${naoRespondidas === 1 ? 'questão' : 'questões'}. Deseja realmente finalizar o simulado agora?`);
        if (!confirmar) return;
    }

    pararTimer();
    simuladoFinalizado = true;

    let acertos = 0;
    perguntas.forEach((q, idx) => {
        const r = respostasUsuario[idx];
        if (r && r.correto) {
            acertos++;
        }
    });

    const tempoGasto = 2400 - tempoRestanteSegundos;
    const porcentagem = Math.round((acertos / total) * 100);
    const aprovado = acertos >= 20 || porcentagem >= 67;

    const container = qs('#simulado-resolucao-conteudo');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #64748b;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 36px; color: #16a34a; margin-bottom: 16px;"></i>
                <h3 style="color: #1e293b; margin-bottom: 8px;">Processando seu resultado...</h3>
                <p>Calculando aproveitamento e sincronizando conquistas...</p>
            </div>
        `;
    }

    try {
        const respostasMap = {};
        perguntas.forEach((q, idx) => {
            const r = respostasUsuario[idx];
            if (r) {
                respostasMap[q.numero] = r.originalCorretaLetra;
            }
        });

        const conclusao = await concluirSimuladoAPI({
            materia: activeMateriaId,
            acertos,
            total,
            porcentagem,
            tempoGastoSegundos: tempoGasto,
            respostas: respostasMap
        });

        resultadoFinal = {
            ...conclusao,
            acertos,
            totalQuestoes: total,
            porcentagem,
            aprovado,
            tempoGastoSegundos: tempoGasto
        };

        if (conclusao && conclusao.totalExp !== undefined && conclusao.totalExp !== null) {
            atualizarXpNoLocalStorage({
                expTotal: conclusao.totalExp,
                lv: conclusao.lv
            });
        }
    } catch {
        resultadoFinal = {
            materia: activeMateriaId,
            acertos,
            totalQuestoes: total,
            porcentagem,
            aprovado,
            tempoGastoSegundos: tempoGasto,
            expBonus: aprovado ? 150 : 50
        };
    }

    try {
        limparCacheTarefasFixas();
    } catch {}

    renderResultadoSimuladoFinal();
}

function renderResultadoSimuladoFinal() {
    const container = qs('#simulado-resolucao-conteudo');
    if (!container || !resultadoFinal) return;

    const total = resultadoFinal.totalQuestoes || 30;
    const acertos = resultadoFinal.acertos;
    const porcentagem = resultadoFinal.porcentagem;
    const aprovado = resultadoFinal.aprovado;
    const tempoGasto = resultadoFinal.tempoGastoSegundos || (2400 - tempoRestanteSegundos);
    const minutos = Math.floor(tempoGasto / 60);
    const segundos = tempoGasto % 60;
    const tempoFormatado = `${minutos}m ${segundos}s`;

    let titulo = aprovado ? 'Parabéns! Você foi APROVADO!' : 'Resultado do Simulado';
    let subtitulo = aprovado
        ? `Você superou a nota de corte oficial do DETRAN com ${porcentagem}% de aproveitamento (${acertos}/30 questões).`
        : `Você acertou ${acertos} de 30 questões (${porcentagem}%). A nota de corte exigida é de 67% (20 acertos).`;

    const bannerHtml = aprovado ? `
        <div class="resultado-task-banner aprovado" style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; margin: 20px 0;">
            <i class="fa-solid fa-gift" style="font-size: 26px; color: #059669;"></i>
            <div style="text-align: left;">
                <strong style="color: #065f46; font-size: 15px; display: block;">Recompensa de +600 XP Liberada em Tarefas!</strong>
                <p style="margin: 3px 0 0 0; font-size: 13px; color: #047857;">A sua aprovação no Simulado liberou a missão de 600 XP permanente na aba de Tarefas Fixas.</p>
            </div>
        </div>
    ` : `
        <div class="resultado-task-banner reprovado" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; margin: 20px 0;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 26px; color: #d97706;"></i>
            <div style="text-align: left;">
                <strong style="color: #92400e; font-size: 15px; display: block;">Meta de 67% (20 Acertos) Não Atingida</strong>
                <p style="margin: 3px 0 0 0; font-size: 13px; color: #b45309;">Faltaram apenas ${Math.max(0, 20 - acertos)} acerto(s) para a aprovação. Refaça o simulado para alcançar os 67% e liberar os 600 XP!</p>
            </div>
        </div>
    `;

    container.innerHTML = `
        <article class="resolucao-resultado-card">
            <div class="resultado-trofeu-box ${aprovado ? 'aprovado' : 'reprovado'}">
                <i class="fa-solid ${aprovado ? 'fa-trophy' : 'fa-graduation-cap'}"></i>
            </div>

            <h3 class="resultado-titulo">${titulo}</h3>
            <p class="resultado-subtitulo">${subtitulo}</p>

            <div class="resultado-metrics-grid">
                <div class="resultado-metric-item">
                    <strong>${total}</strong>
                    <span>Total de Questões</span>
                </div>
                <div class="resultado-metric-item">
                    <strong style="color: ${aprovado ? '#16a34a' : '#d97706'};">${acertos}</strong>
                    <span>Questões Corretas</span>
                </div>
                <div class="resultado-metric-item">
                    <strong style="color: ${aprovado ? '#16a34a' : '#d97706'};">${porcentagem}%</strong>
                    <span>Aproveitamento (Meta: 67%)</span>
                </div>
                <div class="resultado-metric-item">
                    <strong style="color: #0284c7;">${tempoFormatado}</strong>
                    <span>Tempo Gasto</span>
                </div>
            </div>

            ${bannerHtml}

            <div class="resultado-botoes" style="margin-top: 24px;">
                ${aprovado ? `
                    <button type="button" class="btn-resultado-acao btn-resultado-tarefas" id="btn-resultado-reivindicar-600xp">
                        <i class="fa-solid fa-gift"></i> Reivindicar +600 XP em Tarefas
                    </button>
                ` : ''}

                <button type="button" class="btn-resultado-acao btn-resultado-primario" id="btn-resultado-refazer-simulado">
                    <i class="fa-solid fa-rotate-left"></i> Refazer Simulado (30 Questões)
                </button>

                <button type="button" class="btn-resultado-acao btn-resultado-secundario" id="btn-resultado-ver-gabarito">
                    <i class="fa-solid fa-list-check"></i> Revisar Todas as Respostas
                </button>

                <button type="button" class="btn-resultado-acao btn-resultado-secundario" id="btn-resultado-voltar-simulados">
                    <i class="fa-solid fa-clipboard-check"></i> Voltar para Simulados
                </button>
            </div>

            <section id="gabarito-detalhado-container" style="display: none; margin-top: 36px; text-align: left;"></section>
        </article>
    `;

    const btnReivindicar = container.querySelector('#btn-resultado-reivindicar-600xp');
    if (btnReivindicar) {
        btnReivindicar.addEventListener('click', () => {
            if (routerRef) {
                routerRef.navigateTo('tarefas');
            }
        });
    }

    const btnRefazer = container.querySelector('#btn-resultado-refazer-simulado');
    if (btnRefazer) {
        btnRefazer.addEventListener('click', () => {
            abrirSimuladoResolucao(activeMateriaId);
        });
    }

    const btnVoltarHub = container.querySelector('#btn-resultado-voltar-simulados');
    if (btnVoltarHub) {
        btnVoltarHub.addEventListener('click', () => {
            if (routerRef) {
                routerRef.navigateTo('simulado');
            }
        });
    }

    const btnGabarito = container.querySelector('#btn-resultado-ver-gabarito');
    if (btnGabarito) {
        btnGabarito.addEventListener('click', () => {
            renderGabaritoDetalhado();
        });
    }
}

function renderGabaritoDetalhado() {
    const gabaritoContainer = qs('#gabarito-detalhado-container');
    if (!gabaritoContainer) return;

    gabaritoContainer.style.display = 'block';
    gabaritoContainer.scrollIntoView({ behavior: 'smooth' });

    gabaritoContainer.innerHTML = `
        <div style="border-top: 2px dashed #e2e8f0; padding-top: 24px; margin-bottom: 20px;">
            <h4 style="font-size: 20px; color: #1e293b; margin-bottom: 4px;">
                <i class="fa-solid fa-list-check"></i> Revisão Completa das 30 Questões
            </h4>
            <p style="color: #64748b; font-size: 14px;">Confira abaixo suas escolhas, a alternativa correta e a fundamentação técnica de cada questão.</p>
        </div>

        <div class="gabarito-lista-itens">
            ${perguntas.map((q, idx) => {
                const resp = respostasUsuario[idx];
                const isRespondida = resp !== null;
                const isCorreta = isRespondida && resp.correto;
                const letraUsuario = isRespondida ? resp.letraSelecionada : 'Não respondida';

                return `
                    <div class="gabarito-item-card ${isCorreta ? 'gabarito-acerto' : 'gabarito-erro'}" style="background: #fff; border: 1px solid ${isCorreta ? '#bbf7d0' : '#fecaca'}; border-radius: 12px; padding: 18px 20px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-weight: 700; color: #1e293b; font-size: 14px;">
                                Questão ${idx + 1} · ${escapeHtml(q.materia || 'DETRAN')}
                            </span>
                            <span style="font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; background: ${isCorreta ? '#dcfce7' : '#fee2e2'}; color: ${isCorreta ? '#15803d' : '#b91c1c'};">
                                <i class="fa-solid ${isCorreta ? 'fa-check' : 'fa-xmark'}"></i> ${isCorreta ? 'Acertou' : 'Errou'}
                            </span>
                        </div>

                        <p style="font-size: 15px; color: #334155; margin-bottom: 12px; font-weight: 500;">
                            ${escapeHtml(q.texto)}
                        </p>

                        <div style="display: grid; gap: 6px; margin-bottom: 12px;">
                            ${q.opcoes.map((opc, opcIdx) => {
                                const letra = LETRAS[opcIdx];
                                const isGabarito = opcIdx === q.correta;
                                const isMarcouEsta = isRespondida && resp.indexSelecionado === opcIdx;

                                let itemStyle = 'padding: 8px 12px; border-radius: 8px; font-size: 13px; display: flex; align-items: center; gap: 8px; border: 1px solid #e2e8f0; background: #f8fafc;';
                                if (isGabarito) {
                                    itemStyle = 'padding: 8px 12px; border-radius: 8px; font-size: 13px; display: flex; align-items: center; gap: 8px; border: 1px solid #86efac; background: #f0fdf4; font-weight: 600; color: #166534;';
                                } else if (isMarcouEsta && !isCorreta) {
                                    itemStyle = 'padding: 8px 12px; border-radius: 8px; font-size: 13px; display: flex; align-items: center; gap: 8px; border: 1px solid #fca5a5; background: #fef2f2; font-weight: 600; color: #991b1b;';
                                }

                                return `
                                    <div style="${itemStyle}">
                                        <span style="font-weight: 700;">${letra})</span>
                                        <span>${escapeHtml(opc)}</span>
                                        ${isGabarito ? '<i class="fa-solid fa-circle-check" style="margin-left: auto; color: #16a34a;"></i>' : ''}
                                        ${isMarcouEsta && !isCorreta ? '<i class="fa-solid fa-circle-xmark" style="margin-left: auto; color: #dc2626;"></i>' : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <div style="background: #f1f5f9; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #475569;">
                            <strong style="color: #1e293b;"><i class="fa-solid fa-circle-info"></i> Explicação:</strong> ${escapeHtml(q.explicacao || 'Alternativa correta conforme CTB.')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
