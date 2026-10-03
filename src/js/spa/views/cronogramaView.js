
import { qs, qsa, on, setText } from '../../utils/dom.js';
import {
    getDiaSemanaAtual,
    getNomesDias,
    getTarefas,
    getCachedTarefas,
    getChaveDia,
    iniciarTarefa,
    concluirTarefa,
    getMockDia,
    setMockDia,
    getUsuarioAtivoId,
    setUsuarioAtivoId,
    getUsuariosCadastrados,
    verificarPermissaoAdmin,
    regenerarCronogramaComIA,
    clearCachedTarefas
} from '../../services/cronogramaService.js';
import { addXp, getGamificationData, syncUserGamification } from '../../services/gamificationService.js';
import { usuarioGlobal } from '../../services/userService.js';
import { SELECTORS } from '../../constants/selectors.js';
import { createTaskCard } from '../../components/taskCard.js';
import { showToast } from './modulosView.js';
import { attachButtonCooldown } from '../../utils/debounce.js';

let initialized = false;
let currentRouter = null;
let diaAtual = 1;
const nomesDias = getNomesDias();

let lastRenderedState = {
    userId: null,
    mockDia: null,
    renderedAt: 0
};

export function initCronogramaView(router) {
    currentRouter = router;
    if (initialized) return;
    initialized = true;

    diaAtual = getDiaSemanaAtual();

    configurarAbas();
    initBarraSimulacao();

    const btnRetry = qs('#btn-tentar-novamente');
    if (btnRetry) {
        attachButtonCooldown(btnRetry, async () => {
            await carregarCronograma(getUsuarioAtivoId(), true);
        }, {
            cooldownSeconds: 2,
            loadingText: 'Tentando...',
            formatCooldown: (sec) => `Aguarde (${sec}s)`
        });
    }

    const btnVoltarPainel = qs('#btn-voltar-painel-cronograma');
    if (btnVoltarPainel && router) {
        on(btnVoltarPainel, 'click', (e) => {
            e.preventDefault();
            router.navigateTo('inicio');
        });
    }
}

export async function renderCronograma(options = {}) {
    usuarioGlobal.updateUI();
    const activeUserId = getUsuarioAtivoId();

    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');
    if (titleEl) setText(titleEl, 'Cronograma Semanal');
    if (subtitleEl) setText(subtitleEl, 'Acompanhe seu roteiro diário e avance nos estudos.');
    atualizarHud();

    try {
        const isAdmin = await verificarPermissaoAdmin();
        const adminBadge = qs('#admin-indicator-badge');
        const userSelectorBar = qs('#user-selector-bar');
        const simulationHud = qs('#simulation-hud');

        if (isAdmin) {
            if (adminBadge) adminBadge.style.display = 'inline-flex';
            if (userSelectorBar) userSelectorBar.style.display = 'flex';
            if (simulationHud) simulationHud.style.display = 'flex';

            atualizarBarraSimulacaoUI();
            await configurarSeletorUsuarios();
        } else {
            if (adminBadge) adminBadge.style.display = 'none';
            if (userSelectorBar) userSelectorBar.style.display = 'none';
            if (simulationHud) simulationHud.style.display = 'none';
        }
    } catch {
    }

    await carregarCronograma(activeUserId, options.forceRefresh || false);
}

async function carregarCronograma(userId, forceRefresh = false) {
    const loadingEl = qs('#cronograma-loading');
    const errorEl = qs('#cronograma-error');
    const banner = qs('#task-atual-banner');

    const targetUser = userId || getUsuarioAtivoId();
    const currentMock = getMockDia() || 'real';

    const cached = !forceRefresh ? getCachedTarefas(targetUser) : null;
    if (cached && cached.dias) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';

        diaAtual = cached.diaSemanaAtual ?? diaAtual;

        const container1 = qs('#day-tasks-1');
        const jaRenderizadoNoDom = lastRenderedState.userId === targetUser &&
                                   lastRenderedState.mockDia === currentMock &&
                                   container1 && container1.children.length > 0;

        if (!jaRenderizadoNoDom) {
            renderizarTarefasNasDivs(cached);
        }

        consumirTaskAtual(cached.taskAtual, cached.diaConcluido);
        atualizarAbas(cached, diaAtual);
        ativarAba(diaAtual);

        lastRenderedState = {
            userId: targetUser,
            mockDia: currentMock,
            renderedAt: Date.now()
        };

        if (cached.usuario) {
            const authId = usuarioGlobal.id_usuario || usuarioGlobal.id;
            const targetId = cached.usuario.id_usuario || cached.usuario.id;
            const isSelf = !authId || !targetId || String(authId).toLowerCase() === String(targetId).toLowerCase();
            if (isSelf) {
                syncUserGamification(cached.usuario);
            }
            atualizarHud(cached.usuario);
        }
        return;
    }

    if (loadingEl) loadingEl.style.display = 'flex';
    if (errorEl) errorEl.style.display = 'none';
    if (banner) banner.style.display = 'none';

    for (let d = 1; d <= 6; d++) {
        const div = qs(`#day-tasks-${d}`);
        if (div) div.style.display = 'none';
    }

    try {
        const payload = await getTarefas(targetUser, forceRefresh);

        if (!payload || !payload.dias) {
            throw new Error('Nenhuma missão encontrada para esta semana.');
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';

        diaAtual = payload.diaSemanaAtual ?? diaAtual;
        renderizarTarefasNasDivs(payload);
        consumirTaskAtual(payload.taskAtual, payload.diaConcluido);
        atualizarAbas(payload, diaAtual);
        ativarAba(diaAtual);

        lastRenderedState = {
            userId: targetUser,
            mockDia: currentMock,
            renderedAt: Date.now()
        };

        if (payload.usuario) {
            const authId = usuarioGlobal.id_usuario || usuarioGlobal.id;
            const targetId = payload.usuario.id_usuario || payload.usuario.id;
            const isSelf = !authId || !targetId || String(authId).toLowerCase() === String(targetId).toLowerCase();
            if (isSelf) {
                syncUserGamification(payload.usuario);
            }
            atualizarHud(payload.usuario);
            const badgeEl = qs('#user-active-id-badge');
            if (badgeEl && payload.usuario.id_usuario) {
                badgeEl.textContent = `ID: ${payload.usuario.id_usuario.substring(0, 8)}...`;
                badgeEl.title = payload.usuario.id_usuario;
            }
        }
    } catch (error) {
        console.warn('[CronogramaView] Erro ao carregar missões:', error);

        if (loadingEl) loadingEl.style.display = 'none';
        if (banner) banner.style.display = 'none';
        if (errorEl) {
            errorEl.style.display = 'flex';
            setText('#cronograma-error-desc', error.message || 'Não foi possível carregar as missões no momento.');
        }
    }
}

function renderizarTarefasNasDivs(payload) {
    const diasData = payload.dias || {};

    for (let d = 1; d <= 6; d++) {
        const containerDiv = qs(`#day-tasks-${d}`);
        if (!containerDiv) continue;

        containerDiv.innerHTML = '';

        const chaveDia = getChaveDia(d);
        const tarefasDoDia = diasData[chaveDia] || [];

        if (tarefasDoDia.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-day-message';
            emptyMsg.textContent = `Nenhuma missão agendada para ${nomesDias[d] || 'este dia'}.`;
            containerDiv.appendChild(emptyMsg);
        } else {
            tarefasDoDia.forEach((tarefa, index) => {
                const card = createTaskCard({
                    ...tarefa,
                    sort: tarefa.sort || (index + 1)
                }, {
                    onStart: async (taskIniciada, btnEl) => {
                        const originalHtml = btnEl ? btnEl.innerHTML : 'INICIAR';
                        try {
                            if (btnEl) {
                                btnEl.disabled = true;
                                btnEl.textContent = 'Iniciando...';
                            }

                            const result = await iniciarTarefa(taskIniciada.id, getUsuarioAtivoId());
                            const updatedPayload = result.payload || await getTarefas(getUsuarioAtivoId(), true);

                            renderizarTarefasNasDivs(updatedPayload);
                            consumirTaskAtual(updatedPayload.taskAtual, updatedPayload.diaConcluido);
                            atualizarAbas(updatedPayload, diaAtual);
                            showToast(result.message || `Missão "${taskIniciada.titulo}" iniciada!`, 'info', 'fa-solid fa-play');
                        } catch (error) {
                            showToast(error.message, 'locked', 'fa-solid fa-triangle-exclamation');
                            if (btnEl) {
                                btnEl.disabled = false;
                                btnEl.innerHTML = originalHtml;
                            }
                        }
                    },

                    onComplete: async (taskConcluida, btnEl) => {
                        const originalHtml = btnEl ? btnEl.innerHTML : 'CONCLUIR';
                        try {
                            if (btnEl) {
                                btnEl.disabled = true;
                                btnEl.textContent = 'Concluindo...';
                            }

                            const result = await concluirTarefa(taskConcluida.id, getUsuarioAtivoId());

                            if (result.xp_reward) {
                                addXp(result.xp_reward);
                                atualizarHud();
                            }

                            const updatedPayload = result.payload || await getTarefas(getUsuarioAtivoId(), true);

                            renderizarTarefasNasDivs(updatedPayload);
                            consumirTaskAtual(updatedPayload.taskAtual, updatedPayload.diaConcluido);
                            atualizarAbas(updatedPayload, diaAtual);

                            if (updatedPayload.usuario) {
                                const authId = usuarioGlobal.id_usuario || usuarioGlobal.id;
                                const targetId = updatedPayload.usuario.id_usuario || updatedPayload.usuario.id;
                                const isSelf = !authId || !targetId || String(authId).toLowerCase() === String(targetId).toLowerCase();
                                if (isSelf) {
                                    syncUserGamification(updatedPayload.usuario);
                                }
                                atualizarHud(updatedPayload.usuario);
                            }
                            showToast(result.message || `Missão concluída! +${result.xp_reward || 30} XP!`, 'info', 'fa-solid fa-trophy');
                        } catch (error) {
                            showToast(error.message, 'locked', 'fa-solid fa-triangle-exclamation');
                            if (btnEl) {
                                btnEl.disabled = false;
                                btnEl.innerHTML = originalHtml;
                            }
                        }
                    },

                    onPractice: (t) => {
                        if (currentRouter) {
                            const mat = t.linkAcao?.materiaId || t.parametros_validacao?.materia || 'CodigoTransito';
                            const bat = t.linkAcao?.bateriaNumero || t.parametros_validacao?.bateria || 1;
                            if (t.tipo_validacao === 'acertos') {
                                currentRouter.navigateTo('questoes-modulos', { materiaId: mat });
                            } else {
                                currentRouter.navigateTo('questoes-resolucao', { materiaId: mat, bateriaNumero: bat });
                            }
                        }
                    },

                    onSimulado: (t) => {
                        if (currentRouter) {
                            currentRouter.navigateTo('simulado');
                        }
                    },

                    onStudy: (t) => {
                        if (currentRouter) {
                            const mat = t.linkAcao?.conteudoId || t.parametros_validacao?.materia || 'CodigoTransito';
                            currentRouter.navigateTo('modulos', { conteudoId: mat });
                        }
                    }
                });

                if (card) {
                    containerDiv.appendChild(card);
                }
            });
        }
    }
}

function consumirTaskAtual(taskAtual, diaConcluido = false) {
    const banner = qs('#task-atual-banner');
    const tituloEl = qs('#task-atual-titulo');
    const xpEl = qs('#task-atual-xp');

    if (!banner) return;

    if (diaConcluido || !taskAtual) {
        console.log(taskAtual);
        banner.style.display = 'flex';
        banner.classList.add('completed-banner');
        if (tituloEl) {
            tituloEl.innerHTML = '<strong>Parabéns!</strong> Você concluiu todas as missões de hoje. Descanse e volte amanhã!';
        }
        if (xpEl) {
            xpEl.textContent = 'Dia Completo';
        }
        const metaTag = qs('.hud-card .level-tag');
        if (metaTag) {
            metaTag.textContent = 'Missões de Hoje: Concluídas (100%)';
        }
        return;
    }

    banner.classList.remove('completed-banner');
    if (tituloEl && xpEl) {
        tituloEl.textContent = taskAtual.titulo || 'Missão em andamento';
        xpEl.textContent = `+${taskAtual.xp_reward || 30} XP`;
        banner.style.display = 'flex';
    }

    const metaTag = qs('.hud-card .level-tag');
    if (metaTag && taskAtual.sort) {
        const statusLabel = taskAtual.status === 'in_progress' ? 'Em andamento' : 'Disponível';
        metaTag.textContent = `Missão Atual: Aula ${taskAtual.sort} de 3 (${statusLabel})`;
    }
}

function atualizarAbas(payload, diaAtualNum) {
    const diasData = payload.dias || {};
    const diaHojeValido = diaAtualNum === 0 ? 7 : diaAtualNum;

    for (let d = 1; d <= 6 ; d++) {
        const tab = qs(`${SELECTORS.CRONOGRAMA_TAB_PREFIX}${d}`);
        if (!tab) continue;

        const statusEl = tab.querySelector('.day-status');
        if (!statusEl) continue;

        tab.classList.remove('tab-expired', 'tab-concluded', 'tab-today');

        if (d === diaAtualNum) {
            console.log(diaAtualNum);
            tab.classList.add('tab-today');
            if (payload.diaConcluido) {
                statusEl.textContent = 'Concluído';
                statusEl.style.color = '#16a34a';
            } else {
                statusEl.textContent = 'Hoje';
                statusEl.style.color = '#2563eb';
            }
        } else if (d < diaHojeValido) {
            const chave = getChaveDia(d);
            const tarefas = diasData[chave] || [];
            const todasConcluidas = tarefas.length > 0 && tarefas.every(t => t.concluida || t.status === 'done');
            if (todasConcluidas) {
                tab.classList.add('tab-concluded');
                statusEl.textContent = 'Concluído';
                statusEl.style.color = '#16a34a';
            } else {
                tab.classList.add('tab-expired');
                statusEl.textContent = 'Expirado';
                statusEl.style.color = '#dc2626';
            }
        } else {
            statusEl.textContent = 'Bloqueado';
            statusEl.style.color = '#94a3b8';
        }
    }
}

function mudarVisibilidadeDia(diaNum) {
    for (let d = 1; d <= 6; d++) {
        const divDia = qs(`#day-tasks-${d}`);
        if (divDia) {
            divDia.style.display = (d === Number(diaNum)) ? 'flex' : 'none';
        }
    }
}

function ativarAba(diaNum) {
    qsa(SELECTORS.CRONOGRAMA_TABS).forEach(t => t.classList.remove('active'));
    const diaTabAlvo = qs(`${SELECTORS.CRONOGRAMA_TAB_PREFIX}${diaNum}`);
    if (diaTabAlvo) {
        diaTabAlvo.classList.add('active');
    }
    const nomeDia = nomesDias[diaNum] || 'Hoje';
    setText('.schedule-header h3', `Missões de ${nomeDia}`);
    mudarVisibilidadeDia(diaNum);
}

function configurarAbas() {
    const tabs = qsa(SELECTORS.CRONOGRAMA_TABS);
    tabs.forEach(tab => {
        on(tab, 'click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const idMatch = tab.id.match(/\d+$/);
            if (idMatch) {
                const diaNum = parseInt(idMatch[0], 10);
                const nomeDia = nomesDias[diaNum];
                if (nomeDia) {
                    setText('.schedule-header h3', `Missões de ${nomeDia}`);
                }
                mudarVisibilidadeDia(diaNum);
            }
        });
    });
}

function atualizarHud(usuarioPayload) {
    const gamification = getGamificationData();
    const xpBadge = qs('.hud-card .stat-badge.xp');
    const streakBadge = qs('.hud-card .stat-badge:not(.xp):not(.admin)');

    if (usuarioPayload && typeof usuarioPayload.exp === 'number' && xpBadge) {
        xpBadge.innerHTML = `<span class="material-symbols-outlined icone-inline">bolt</span> Total: ${usuarioPayload.exp} XP`;
    } else if (gamification && xpBadge) {
        xpBadge.innerHTML = `<span class="material-symbols-outlined icone-inline">bolt</span> Total: ${gamification.xpAtual} XP`;
    }

    if (gamification && streakBadge) {
        streakBadge.innerHTML = `<span class="material-symbols-outlined icone-inline">local_fire_department</span> Ofensiva: ${gamification.diasOfensiva} Dias`;
    }

    const authId = usuarioGlobal.id_usuario || usuarioGlobal.id;
    const payloadId = usuarioPayload?.id_usuario || usuarioPayload?.id;
    const isSelf = !payloadId || !authId || String(authId).toLowerCase() === String(payloadId).toLowerCase();

    if (usuarioPayload && isSelf) {
        usuarioGlobal.sync(usuarioPayload);
    } else {
        usuarioGlobal.updateUI();
    }
}

let seletorUsuariosConfigurado = false;
let barraSimulacaoConfigurada = false;

function initBarraSimulacao() {
    if (barraSimulacaoConfigurada) return;
    barraSimulacaoConfigurada = true;

    qsa('.btn-sim').forEach((btn) => {
        on(btn, 'click', async () => {
            const targetSim = btn.dataset.sim;
            setMockDia(targetSim);

            atualizarBarraSimulacaoUI();

            try {
                btn.disabled = true;
                await carregarCronograma(getUsuarioAtivoId(), true);
            } catch (err) {
                showToast(err.message, 'locked');
            } finally {
                btn.disabled = false;
            }
        });
    });
}

function atualizarBarraSimulacaoUI() {
    const mockAtivo = getMockDia();
    qsa('.btn-sim').forEach((btn) => {
        const simVal = btn.dataset.sim;
        if ((!mockAtivo && simVal === 'auto') || (mockAtivo && mockAtivo === simVal)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

async function configurarSeletorUsuarios() {
    const selectEl = qs('#select-usuario-ativo');
    const badgeEl = qs('#user-active-id-badge');
    const btnResetIa = qs('#btn-admin-reset-cronograma');
    if (!selectEl) return;

    const currentUserId = getUsuarioAtivoId();

    if (badgeEl) {
        badgeEl.textContent = `ID: ${currentUserId.substring(0, 8)}...`;
        badgeEl.title = currentUserId;
    }

    if (!seletorUsuariosConfigurado) {
        seletorUsuariosConfigurado = true;
        on(selectEl, 'change', async (e) => {
            const novoId = e.target.value;
            setUsuarioAtivoId(novoId);
            if (badgeEl) {
                badgeEl.textContent = `ID: ${novoId.substring(0, 8)}...`;
                badgeEl.title = novoId;
            }
            await carregarCronograma(novoId, true);
        });

        if (btnResetIa) {
            on(btnResetIa, 'click', async () => {
                const targetUserId = selectEl.value || getUsuarioAtivoId();
                const selectedOpt = selectEl.options && selectEl.selectedIndex >= 0 ? selectEl.options[selectEl.selectedIndex] : null;
                const nomeAluno = selectedOpt ? selectedOpt.textContent.trim() : 'o aluno selecionado';

                const confirmacao = window.confirm(
                    `Deseja realmente resetar o cronograma semanal de:\n${nomeAluno}\n\nO Tutor IA analisará o histórico de acertos e erros desse aluno para gerar dinamicamente 18 novas missões personalizadas para a semana!`
                );
                if (!confirmacao) return;

                const originalHtml = btnResetIa.innerHTML;
                btnResetIa.disabled = true;
                btnResetIa.classList.add('is-loading');
                btnResetIa.innerHTML = `<span class="material-symbols-outlined icone-inline" style="animation: spinCronograma 1s linear infinite;">sync</span> <span>Gerando com IA...</span>`;

                try {
                    const result = await regenerarCronogramaComIA(targetUserId);
                    clearCachedTarefas(targetUserId);
                    await carregarCronograma(targetUserId, true);
                    showToast(result?.message || 'Cronograma semanal gerado com sucesso pela IA!', 'sucesso', 'fa-solid fa-wand-magic-sparkles');
                } catch (err) {
                    console.error('[Admin] Erro ao regenerar cronograma com IA:', err);
                    showToast(err.message || 'Erro ao gerar missões com IA.', 'locked', 'fa-solid fa-triangle-exclamation');
                } finally {
                    btnResetIa.disabled = false;
                    btnResetIa.classList.remove('is-loading');
                    btnResetIa.innerHTML = originalHtml;
                }
            });
        }
    }

    if (selectEl.options && selectEl.options.length > 1) {
        selectEl.value = currentUserId;
        return;
    }

    try {
        const usuarios = await getUsuariosCadastrados();
        selectEl.innerHTML = '';
        usuarios.forEach((u) => {
            const opt = document.createElement('option');
            opt.value = u.id_usuario;
            opt.textContent = `${u.nome} (${u.email || u.exp + ' XP'})`;
            if (u.id_usuario === currentUserId) {
                opt.selected = true;
            }
            selectEl.appendChild(opt);
        });
        selectEl.value = currentUserId;
    } catch {
    }
}
