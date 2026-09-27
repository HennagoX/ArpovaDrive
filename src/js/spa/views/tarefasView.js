import { qs, qsa, setText, setHTML } from '../../utils/dom.js';
import {
    getTarefasFixas,
    concluirTarefaFixa,
    limparCacheTarefasFixas
} from '../../services/tarefasFixasService.js';
import { createTarefaFixaCard } from '../../components/tarefaFixaCard.js';
import {
    getGamificationData,
    syncUserGamification,
    atualizarXpNoLocalStorage,
    updateLevelUI
} from '../../services/gamificationService.js';
import { usuarioGlobal } from '../../services/userService.js';
import { attachButtonCooldown, startCooldown } from '../../utils/debounce.js';

let initialized = false;
let currentRouter = null;
let activeFilter = 'todos';
let toastTimeout = null;
let currentPayload = null;

export function initTarefasView(router) {
    currentRouter = router;
    if (initialized) return;
    initialized = true;

    // Listener para delegação de clique em abas de filtro
    const filterContainer = qs('#tarefas-filtros');
    if (filterContainer) {
        filterContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.tarefas-filter-btn');
            if (btn && btn.dataset.filter) {
                const targetFilter = btn.dataset.filter;
                setActiveFilter(targetFilter);
            }
        });
    }

    const btnAtualizar = qs('#btn-recarregar-tarefas');
    if (btnAtualizar) {
        attachButtonCooldown(btnAtualizar, async () => {
            limparCacheTarefasFixas();
            await renderTarefas(true);
        }, {
            cooldownSeconds: 6,
            loadingText: 'Atualizando...',
            formatCooldown: (sec) => `Aguarde (${sec}s)`
        });
    }
}

export function setActiveFilter(filterId) {
    activeFilter = filterId;

    // Atualiza visual dos botões de filtro
    const buttons = qsa('.tarefas-filter-btn');
    buttons.forEach(btn => {
        if (btn.dataset.filter === filterId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Filtra seções visíveis
    const sections = qsa('.tarefas-conteudo-section');
    sections.forEach(sec => {
        if (filterId === 'todos' || sec.dataset.conteudoId === filterId) {
            sec.style.display = 'block';
        } else {
            sec.style.display = 'none';
        }
    });
}

export async function renderTarefas(forceRefresh = false) {
    usuarioGlobal.updateUI();
    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');
    if (titleEl) setText(titleEl, 'Tarefas por Conteúdo');
    if (subtitleEl) setText(subtitleEl, 'Missões fixas e permanentes de módulos e desafios práticos de questões.');

    const container = qs('#tarefas-conteudos-wrapper');
    const heroProgressFill = qs('#tarefas-hero-progress-fill');
    const heroProgressPct = qs('#tarefas-hero-progress-pct');
    const heroTotalTasks = qs('#tarefas-stat-total-tasks');
    const heroConcluidas = qs('#tarefas-stat-concluidas');
    const heroXpGanho = qs('#tarefas-stat-xp-ganho');

    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 32px; color: #0d47a1; margin-bottom: 12px;"></i>
                <p>Carregando missões de conteúdo...</p>
            </div>
        `;
    }

    try {
        const payload = await getTarefasFixas(null, forceRefresh);
        currentPayload = payload;

        if (!payload || !payload.conteudos) {
            throw new Error('Dados de tarefas não retornados.');
        }

        // Atualiza estatísticas do Hero
        const resumo = payload.resumo || {};
        if (heroTotalTasks) setText(heroTotalTasks, String(resumo.totalTasks || 0));
        if (heroConcluidas) setText(heroConcluidas, `${resumo.concluidas || 0} / ${resumo.totalTasks || 0}`);
        if (heroXpGanho) setText(heroXpGanho, `+${(resumo.xpGanho || 0).toLocaleString('pt-BR')} XP`);
        if (heroProgressPct) setText(heroProgressPct, `${resumo.porcentagemConcluida || 0}%`);
        if (heroProgressFill) heroProgressFill.style.width = `${resumo.porcentagemConcluida || 0}%`;

        // Sincroniza barra de XP e nível do topo da tela inicial
        if (payload.usuario) {
            usuarioGlobal.sync(payload.usuario);
            syncUserGamification(payload.usuario);
        }

        // Atualiza os contadores das abas de filtro
        renderFilterTabs(payload.conteudos);

        // Renderiza cada seção de conteúdo
        if (container) {
            container.innerHTML = '';
            const conteudosList = Object.values(payload.conteudos);

            conteudosList.forEach(conteudo => {
                const section = createConteudoSection(conteudo);
                if (section) {
                    if (activeFilter !== 'todos' && conteudo.id !== activeFilter) {
                        section.style.display = 'none';
                    }
                    container.appendChild(section);
                }
            });
        }
    } catch (err) {
        console.error('[TarefasView] Erro ao carregar tarefas:', err);
        if (container) {
            container.innerHTML = `
                <div style="background: #fff; border: 1px solid #fed7aa; border-radius: 16px; padding: 32px; text-align: center;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; color: #ea580c; margin-bottom: 12px;"></i>
                    <h4 style="font-size: 18px; margin-bottom: 8px;">Não foi possível carregar as tarefas</h4>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">${escapeHtml(err.message)}</p>
                    <button type="button" class="btn-tarefa btn-estudar" id="btn-tentar-novamente-tarefas">
                        <i class="fa-solid fa-rotate-right"></i> Tentar novamente
                    </button>
                </div>
            `;
            const retryBtn = qs('#btn-tentar-novamente-tarefas');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => renderTarefas(true));
            }
        }
    }
}

function renderFilterTabs(conteudos) {
    const filtersWrapper = qs('#tarefas-filtros');
    if (!filtersWrapper) return;

    let totalTasksGlobal = 0;
    let totalConcluidasGlobal = 0;
    Object.values(conteudos).forEach(c => {
        totalTasksGlobal += c.totalTasks || 0;
        totalConcluidasGlobal += c.tasksConcluidas || 0;
    });

    let buttonsHtml = `
        <button type="button" class="tarefas-filter-btn ${activeFilter === 'todos' ? 'active' : ''}" data-filter="todos">
            <i class="fa-solid fa-list-ul"></i>
            <span>Todos os Conteúdos</span>
            <span class="tarefas-filter-badge">${totalConcluidasGlobal}/${totalTasksGlobal}</span>
        </button>
    `;

    Object.values(conteudos).forEach(c => {
        const isActive = activeFilter === c.id;
        buttonsHtml += `
            <button type="button" class="tarefas-filter-btn ${isActive ? 'active' : ''}" data-filter="${c.id}">
                <i class="${c.icone || 'fa-solid fa-book'}"></i>
                <span>${escapeHtml(c.titulo)}</span>
                <span class="tarefas-filter-badge">${c.tasksConcluidas || 0}/${c.totalTasks || 0}</span>
            </button>
        `;
    });

    filtersWrapper.innerHTML = buttonsHtml;
}

function createConteudoSection(conteudo) {
    const section = document.createElement('section');
    section.className = 'tarefas-conteudo-section';
    section.dataset.conteudoId = conteudo.id;

    const cor = conteudo.cor || 'green';
    const icone = conteudo.icone || 'fa-solid fa-book';
    const pct = conteudo.porcentagemConcluida || 0;

    section.innerHTML = `
        <div class="tarefas-conteudo-header">
            <div class="tarefas-conteudo-title-box">
                <div class="tarefas-conteudo-icon-avatar ${cor}">
                    <i class="${icone}"></i>
                </div>
                <div class="tarefas-conteudo-meta-titles">
                    <span class="tarefas-conteudo-category-tag">${escapeHtml(conteudo.categoria || 'CONTEÚDO')}</span>
                    <h3>${escapeHtml(conteudo.titulo)}</h3>
                </div>
            </div>

            <div class="tarefas-conteudo-progress-pill">
                <span>${conteudo.tasksConcluidas || 0} de ${conteudo.totalTasks || 0} concluídas</span>
                <div class="tarefas-conteudo-progress-mini">
                    <div class="tarefas-conteudo-progress-mini-fill" style="width: ${pct}%;"></div>
                </div>
                <span>${pct}%</span>
            </div>
        </div>

        <div class="tarefas-cards-list"></div>
    `;

    const cardsContainer = section.querySelector('.tarefas-cards-list');

    if (Array.isArray(conteudo.tasks)) {
        conteudo.tasks.forEach(task => {
            const card = createTarefaFixaCard(task, {
                onClaim: async (t, btn) => {
                    await handleClaimTask(t, btn);
                },
                onStudy: (t) => {
                    if (currentRouter) {
                        currentRouter.navigateTo('modulos', { conteudoId: t.conteudoId });
                    }
                },
                onPractice: (t) => {
                    if (currentRouter) {
                        if (t.tipo === 'simulado' || t.isSimulado) {
                            currentRouter.navigateTo('simulado');
                        } else if (t.tipo === 'questao' && t.bateriaNumero) {
                            currentRouter.navigateTo('questoes-resolucao', {
                                materiaId: t.conteudoId,
                                bateriaNumero: t.bateriaNumero
                            });
                        } else {
                            currentRouter.navigateTo('questoes-modulos', { materiaId: t.conteudoId });
                        }
                    }
                },
                onLockedClick: (t) => {
                    showToast(
                        t.motivo || 'Complete as etapas anteriores para desbloquear esta missão.',
                        'locked',
                        'fa-solid fa-lock'
                    );
                }
            });

            if (card) {
                cardsContainer.appendChild(card);
            }
        });
    }

    return section;
}

async function handleClaimTask(task, buttonEl) {
    if (!task || !task.id) return;

    const originalContent = buttonEl ? buttonEl.innerHTML : '';
    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Concluindo...';
    }

    const xpAmount = Number(task.xp_reward || 150);

    try {
        const result = await concluirTarefaFixa(task.id);

        // Confirmação com dados exatos retornados pelo backend
        atualizarXpNoLocalStorage({
            xpGanho: result.xpGanho || xpAmount,
            expTotal: result.expTotal,
            lv: result.lv,
            tituloNivel: result.tituloNivel,
            taskId: task.id
        });

        if (result.leveledUp) {
            showToast(
                `Subiu de Nível! Você alcançou o Nível ${result.lv} — ${result.tituloNivel}!`,
                'success',
                'fa-solid fa-trophy'
            );
        } else {
            showToast(
                `Missão concluída! Você ganhou +${result.xpGanho || task.xp_reward} XP permanentes!`,
                'success',
                'fa-solid fa-circle-check'
            );
        }

        // Recarrega lista e atualiza números em tempo real
        await renderTarefas(true);
    } catch (err) {
        showToast(err.message, 'error', 'fa-solid fa-triangle-exclamation');
        if (buttonEl) {
            startCooldown(buttonEl, 2, {
                originalHtml: originalContent,
                originalDisabled: false,
                formatText: (sec) => `Aguarde (${sec}s)`
            });
        }
    }
}

export function showToast(mensagem, tipo = 'info', iconeClass = 'fa-solid fa-circle-info') {
    const toastContainer = qs('#toast-container');
    if (!toastContainer) return;

    toastContainer.innerHTML = '';
    if (toastTimeout) clearTimeout(toastTimeout);

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.setAttribute('role', 'alert');

    toast.innerHTML = `
        <i class="${iconeClass}"></i>
        <span>${escapeHtml(mensagem)}</span>
        <button type="button" class="toast-close" aria-label="Fechar notificação">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
    }

    toastContainer.appendChild(toast);

    toastTimeout = setTimeout(() => {
        toast.remove();
    }, 4500);
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
