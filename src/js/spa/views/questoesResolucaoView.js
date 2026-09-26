import { qs, setText } from '../../utils/dom.js';
import {
    getMateriaQuestoesById,
    getBateriasByMateriaId,
    getQuestoesByBateria,
    checkAcertoQuestaoAPI,
    concluirBateriaAPI,
    verificarAcessoBateriaAPI,
    isBateriaDesbloqueada
} from '../../services/questoesService.js';
import { getModuloAtualCached } from '../../services/moduloService.js';
import { showToast } from './modulosView.js';
import { atualizarXpNoLocalStorage } from '../../services/gamificationService.js';
import { limparCacheTarefasFixas } from '../../services/tarefasFixasService.js';
import { usuarioGlobal } from '../../services/userService.js';

let initialized = false;
let routerRef = null;
let activeMateriaId = 'MeioAmbiente';
let activeBateriaId = null;
let activeBateriaNumero = 1;
let perguntas = [];
let indexAtual = 0;
let respostasUsuario = [];
let acertosCount = 0;
let xpGanhoSessao = 0;

const LETRAS = ['A', 'B', 'C', 'D'];

export function initQuestoesResolucaoView(router) {
    routerRef = router;
    if (initialized) return;
    initialized = true;

    const btnVoltar = qs('#btn-voltar-baterias-questoes');
    const breadcrumbRoot = qs('#breadcrumb-resolucao-root-btn');
    const breadcrumbMateria = qs('#breadcrumb-resolucao-materia');

    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            if (routerRef) {
                routerRef.navigateTo('questoes-modulos', { materiaId: activeMateriaId });
            }
        });
    }

    if (breadcrumbRoot) {
        breadcrumbRoot.addEventListener('click', () => {
            if (routerRef) {
                routerRef.navigateTo('questoes');
            }
        });
    }

    if (breadcrumbMateria) {
        breadcrumbMateria.addEventListener('click', () => {
            if (routerRef) {
                routerRef.navigateTo('questoes-modulos', { materiaId: activeMateriaId });
            }
        });
    }
}

export function abrirQuestoesResolucao(materiaId, bateriaIdOrNumero) {
    usuarioGlobal.updateUI();
    activeMateriaId = materiaId || 'MeioAmbiente';

    let num = 1;
    if (typeof bateriaIdOrNumero === 'number') {
        num = bateriaIdOrNumero;
    } else if (typeof bateriaIdOrNumero === 'string') {
        const match = bateriaIdOrNumero.match(/\d+/);
        if (match) num = Number(match[0]);
    }
    activeBateriaNumero = Math.max(1, Math.min(4, num));

    const materia = getMateriaQuestoesById(activeMateriaId);
    const baterias = getBateriasByMateriaId(activeMateriaId);
    const bateria = baterias.find(b => Number(b.numero) === activeBateriaNumero) || baterias[activeBateriaNumero - 1];
    activeBateriaId = typeof bateriaIdOrNumero === 'string' ? bateriaIdOrNumero : (bateria?.id || `${activeMateriaId}-${activeBateriaNumero}`);

    const moduloProgresso = getModuloAtualCached(activeMateriaId);
    if (!isBateriaDesbloqueada(bateria, moduloProgresso)) {
        showToast(bateria?.motivoBloqueio || 'Esta bateria está bloqueada.', 'locked', 'fa-solid fa-lock');
        if (routerRef) {
            routerRef.navigateTo('questoes-modulos', { materiaId: activeMateriaId });
        }
        return;
    }

    const temaCor = materia?.cor || 'green';
    const viewQuestoesResolucao = qs('#view-questoes-resolucao');
    if (viewQuestoesResolucao) {
        const themeClasses = Array.from(viewQuestoesResolucao.classList).filter(c => c.startsWith('modulos-theme-'));
        themeClasses.forEach(c => viewQuestoesResolucao.classList.remove(c));
        viewQuestoesResolucao.classList.add(`modulos-theme-${temaCor}`);
    }

    const listaOriginal = getQuestoesByBateria(activeMateriaId, activeBateriaNumero);
    perguntas = listaOriginal.map(q => {
        const indices = [0, 1, 2, 3];
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const novoIndiceCorreto = indices.indexOf(q.correta);
        return {
            ...q,
            opcoes: indices.map(idx => q.opcoes[idx]),
            correta: novoIndiceCorreto,
            corretaLetra: LETRAS[novoIndiceCorreto],
            originalCorretaLetra: q.corretaLetra || LETRAS[q.correta]
        };
    });
    indexAtual = 0;
    respostasUsuario = Array(perguntas.length).fill(null);
    acertosCount = 0;
    xpGanhoSessao = 0;

    const breadcrumbMateria = qs('#breadcrumb-resolucao-materia');
    const breadcrumbBateria = qs('#breadcrumb-resolucao-bateria');
    const tagCategoria = qs('#resolucao-tag-categoria');
    const headerTitle = qs('#resolucao-header-title');
    const headerSubtitle = qs('#resolucao-header-subtitle');

    if (breadcrumbMateria && materia) setText(breadcrumbMateria, materia.titulo);
    if (breadcrumbBateria) setText(breadcrumbBateria, `Bateria ${String(activeBateriaNumero).padStart(2, '0')}`);
    if (tagCategoria && materia) setText(tagCategoria, materia.categoria || 'MEIO AMBIENTE');
    if (headerTitle) setText(headerTitle, bateria?.titulo || `Bateria ${activeBateriaNumero}`);
    if (headerSubtitle) setText(headerSubtitle, bateria?.descricao || 'Pratique com questões simuladas.');

    atualizarPlacarTopo();
    renderQuestaoAtual();
}

function atualizarPlacarTopo() {
    const liveScore = qs('#resolucao-live-score');
    const liveXp = qs('#resolucao-live-xp');
    const progressoTexto = qs('#resolucao-progresso-texto');
    const progressoPct = qs('#resolucao-progresso-pct');
    const progressoFill = qs('#resolucao-progresso-fill');

    const total = perguntas.length || 10;
    const atualVisual = Math.min(total, indexAtual + 1);
    const respondidas = respostasUsuario.filter(r => r !== null).length;
    const pct = Math.round((respondidas / total) * 100);

    if (liveScore) setText(liveScore, `Acertos: ${acertosCount}/${total}`);
    if (liveXp) setText(liveXp, `+${xpGanhoSessao} XP`);
    if (progressoTexto) setText(progressoTexto, `Questão ${atualVisual} de ${total} (${respondidas} respondidas)`);
    if (progressoPct) setText(progressoPct, `${pct}%`);
    if (progressoFill) progressoFill.style.width = `${pct}%`;
}

function renderQuestaoAtual() {
    const container = qs('#resolucao-conteudo-ativo');
    if (!container) return;

    if (indexAtual >= perguntas.length) {
        renderResultadoFinal();
        return;
    }

    const q = perguntas[indexAtual];
    const respSalva = respostasUsuario[indexAtual];
    const isRespondida = respSalva !== null;

    container.innerHTML = `
        <article class="resolucao-card">
            <div class="resolucao-meta-row">
                <span class="resolucao-modulo-tag">
                    <i class="fa-solid fa-book-open"></i> Módulo ${q.modulo}
                </span>
                <span class="resolucao-contador-questao">Questão ${indexAtual + 1} de ${perguntas.length}</span>
            </div>

            <h3 class="resolucao-pergunta-texto">${escapeHtml(q.texto)}</h3>

            <div class="resolucao-opcoes-grid" id="opcoes-grid-container">
                ${q.opcoes.map((opcao, i) => {
                    let btnClass = 'resolucao-opcao-btn';
                    let iconHtml = '<i class="fa-solid fa-circle-check resolucao-opcao-icon"></i>';

                    if (isRespondida) {
                        if (i === q.correta) {
                            btnClass += ' correta';
                            iconHtml = '<i class="fa-solid fa-circle-check resolucao-opcao-icon"></i>';
                        } else if (i === respSalva.indexSelecionado) {
                            btnClass += ' errada';
                            iconHtml = '<i class="fa-solid fa-circle-xmark resolucao-opcao-icon"></i>';
                        }
                    }

                    return `
                        <button type="button" class="${btnClass}" data-opcao-index="${i}" ${isRespondida ? 'disabled' : ''}>
                            <span class="resolucao-letra-chip">${LETRAS[i]}</span>
                            <span class="resolucao-opcao-corpo">${escapeHtml(opcao)}</span>
                            ${iconHtml}
                        </button>
                    `;
                }).join('')}
            </div>

            <div id="resolucao-feedback-container">
                ${isRespondida ? renderFeedbackHtml(respSalva.correto, q.corretaLetra, q.explicacao) : ''}
            </div>

            <div class="resolucao-acoes-footer">
                <button type="button" class="btn-resolucao-secundario" id="btn-resolucao-ant" ${indexAtual === 0 ? 'disabled' : ''}>
                    <i class="fa-solid fa-arrow-left"></i> Anterior
                </button>

                <button type="button" class="btn-resolucao-primario" id="btn-resolucao-prox" ${!isRespondida ? 'disabled' : ''}>
                    ${indexAtual === perguntas.length - 1 ? 'Ver Resultado' : 'Próxima'} <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </article>
    `;

    const btnsOpcoes = container.querySelectorAll('.resolucao-opcao-btn');
    btnsOpcoes.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = Number(btn.dataset.opcaoIndex);
            tratarResposta(index);
        });
    });

    const btnAnt = container.querySelector('#btn-resolucao-ant');
    if (btnAnt) {
        btnAnt.addEventListener('click', () => {
            if (indexAtual > 0) {
                indexAtual--;
                renderQuestaoAtual();
            }
        });
    }

    const btnProx = container.querySelector('#btn-resolucao-prox');
    if (btnProx) {
        btnProx.addEventListener('click', () => {
            indexAtual++;
            atualizarPlacarTopo();
            renderQuestaoAtual();
        });
    }
}

async function tratarResposta(indexEscolhido) {
    if (respostasUsuario[indexAtual] !== null) return;

    const q = perguntas[indexAtual];
    const letraEscolhida = LETRAS[indexEscolhido];
    const isCorretoLocal = indexEscolhido === q.correta;
    const textoEscolhido = q.opcoes[indexEscolhido];

    let respostaApi = null;
    try {
        respostaApi = await checkAcertoQuestaoAPI({
            materia: activeMateriaId,
            bateria: activeBateriaNumero,
            num: q.numero,
            resposta: isCorretoLocal ? q.originalCorretaLetra : 'ERRADA',
            textoResposta: textoEscolhido
        });
    } catch {
        respostaApi = null;
    }

    const isCorreto = respostaApi?.correto !== undefined ? Boolean(respostaApi.correto) : isCorretoLocal;

    if (isCorreto) {
        acertosCount++;
        xpGanhoSessao += 10;
        atualizarXpNoLocalStorage({
            xpGanho: 10,
            expTotal: respostaApi?.totalExp,
            lv: respostaApi?.lv
        });
    }

    respostasUsuario[indexAtual] = {
        indexSelecionado: indexEscolhido,
        letraSelecionada: letraEscolhida,
        correto: isCorreto,
        explicacao: q.explicacao
    };

    atualizarPlacarTopo();
    renderQuestaoAtual();
}

function renderFeedbackHtml(correto, corretaLetra, explicacao) {
    if (correto) {
        return `
            <div class="resolucao-feedback-box correto">
                <div class="resolucao-feedback-title">
                    <i class="fa-solid fa-circle-check"></i> Parabéns! Resposta correta (+10 XP)
                </div>
                <div class="resolucao-feedback-desc">${escapeHtml(explicacao)}</div>
            </div>
        `;
    }
    return `
        <div class="resolucao-feedback-box errado">
            <div class="resolucao-feedback-title">
                <i class="fa-solid fa-circle-xmark"></i> Resposta incorreta! A alternativa correta é a letra ${corretaLetra}.
            </div>
            <div class="resolucao-feedback-desc">${escapeHtml(explicacao)}</div>
        </div>
    `;
}

async function renderResultadoFinal() {
    const container = qs('#resolucao-conteudo-ativo');
    if (!container) return;

    const total = perguntas.length || 10;
    const porcentagem = Math.round((acertosCount / total) * 100);
    const aprovado = porcentagem >= 70;

    let conclusaoData = null;
    try {
        conclusaoData = await concluirBateriaAPI({
            materia: activeMateriaId,
            bateria: activeBateriaNumero,
            acertos: acertosCount,
            total
        });
        if (conclusaoData && conclusaoData.totalExp !== undefined && conclusaoData.totalExp !== null) {
            atualizarXpNoLocalStorage({
                expTotal: conclusaoData.totalExp,
                lv: conclusaoData.lv
            });
        }
    } catch {}

    // Invalida cache de tarefas fixas para refletir o aproveitamento imediatamente
    try {
        limparCacheTarefasFixas();
    } catch {}

    let tituloResultado = aprovado ? 'Excelente Desempenho!' : 'Bom Treinamento!';
    let subtitulo = aprovado
        ? 'Você atingiu o aproveitamento recomendado para a prova teórica do DETRAN.'
        : 'Continue praticando para fixar os conceitos e melhorar seu percentual de acertos.';

    const iconeTrofeu = aprovado
        ? '<i class="fa-solid fa-trophy"></i>'
        : '<i class="fa-solid fa-graduation-cap"></i>';

    const classeTrofeu = aprovado ? 'aprovado' : 'reprovado';

    const baterias = getBateriasByMateriaId(activeMateriaId);
    const proximaNumero = activeBateriaNumero + 1;
    const existeProximaNoBanco = proximaNumero <= baterias.length;

    let temProximaLiberada = false;
    if (existeProximaNoBanco) {
        if (conclusaoData && typeof conclusaoData.proximaBateriaLiberada === 'boolean') {
            temProximaLiberada = conclusaoData.proximaBateriaLiberada;
        } else {
            const acessoCheck = await verificarAcessoBateriaAPI(activeMateriaId, proximaNumero);
            temProximaLiberada = Boolean(acessoCheck?.permitido);
        }
    }

    const taskBannerHtml = aprovado ? `
        <div class="resultado-task-banner aprovado">
            <i class="fa-solid fa-gift"></i>
            <div>
                <strong>Desafio de Tarefas Liberado (${porcentagem}% de acertos)!</strong>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #047857;">Você atingiu a meta de 70%+ e agora pode reivindicar sua recompensa de XP na aba de Tarefas.</p>
            </div>
        </div>
    ` : `
        <div class="resultado-task-banner reprovado">
            <i class="fa-solid fa-circle-exclamation"></i>
            <div>
                <strong>Meta de 70% não atingida (${porcentagem}%)</strong>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #b45309;">Para liberar a recompensa da Tarefa Fixa desta bateria, é necessário atingir no mínimo 70% de acertos. Refaça a bateria para conquistar o bônus de XP!</p>
            </div>
        </div>
    `;

    container.innerHTML = `
        <article class="resolucao-resultado-card">
            <div class="resultado-trofeu-box ${classeTrofeu}">
                ${iconeTrofeu}
            </div>

            <h3 class="resultado-titulo">${tituloResultado}</h3>
            <p class="resultado-subtitulo">${subtitulo}</p>

            <div class="resultado-metrics-grid">
                <div class="resultado-metric-item">
                    <strong>${total}</strong>
                    <span>Total Questões</span>
                </div>
                <div class="resultado-metric-item">
                    <strong style="color: ${aprovado ? '#16a34a' : '#d97706'};">${acertosCount}</strong>
                    <span>Acertos</span>
                </div>
                <div class="resultado-metric-item">
                    <strong style="color: ${aprovado ? '#16a34a' : '#d97706'};">${porcentagem}%</strong>
                    <span>Aproveitamento</span>
                </div>
            </div>

            <div class="resultado-xp-banner">
                <i class="fa-solid fa-bolt"></i> +${xpGanhoSessao} XP conquistados nesta bateria
            </div>

            ${taskBannerHtml}

            <div class="resultado-botoes">
                ${aprovado ? `
                    <button type="button" class="btn-resultado-acao btn-resultado-tarefas" id="btn-resultado-ir-tarefas">
                        <i class="fa-solid fa-gift"></i> Reivindicar +350 XP em Tarefas
                    </button>
                ` : ''}

                ${temProximaLiberada ? `
                    <button type="button" class="btn-resultado-acao btn-resultado-primario" id="btn-resultado-proxima-bateria">
                        <i class="fa-solid fa-forward"></i> Próxima Bateria
                    </button>
                ` : ''}

                <button type="button" class="btn-resultado-acao ${temProximaLiberada || aprovado ? 'btn-resultado-secundario' : 'btn-resultado-primario'}" id="btn-resultado-refazer">
                    <i class="fa-solid fa-rotate-left"></i> Refazer Esta Bateria
                </button>

                <button type="button" class="btn-resultado-acao btn-resultado-secundario" id="btn-resultado-voltar-hub">
                    <i class="fa-solid fa-layer-group"></i> Voltar para as Baterias
                </button>
            </div>
        </article>
    `;

    const btnIrTarefas = container.querySelector('#btn-resultado-ir-tarefas');
    if (btnIrTarefas) {
        btnIrTarefas.addEventListener('click', () => {
            if (routerRef) {
                routerRef.navigateTo('tarefas');
            }
        });
    }

    const btnRefazer = container.querySelector('#btn-resultado-refazer');
    if (btnRefazer) {
        btnRefazer.addEventListener('click', () => {
            abrirQuestoesResolucao(activeMateriaId, activeBateriaNumero);
        });
    }

    const btnVoltarHub = container.querySelector('#btn-resultado-voltar-hub');
    if (btnVoltarHub) {
        btnVoltarHub.addEventListener('click', () => {
            if (routerRef) {
                routerRef.navigateTo('questoes-modulos', { materiaId: activeMateriaId });
            }
        });
    }

    const btnProxBat = container.querySelector('#btn-resultado-proxima-bateria');
    if (btnProxBat) {
        btnProxBat.addEventListener('click', () => {
            abrirQuestoesResolucao(activeMateriaId, activeBateriaNumero + 1);
        });
    }
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
