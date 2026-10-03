
import { qs, qsa, setText, setHTML, applyTiltAll } from '../../utils/dom.js';
import { getCurrentUser, logout } from '../../services/authService.js';
import { getGamificationData, getTaxaAproveitamento, syncUserGamification, updateLevelUI } from '../../services/gamificationService.js';
import { getTarefas, getUsuarioAtivoId } from '../../services/cronogramaService.js';
import { fetchDesempenho, getLocalDesempenho } from '../../services/desempenhoService.js';
import { usuarioGlobal } from '../../services/userService.js';
import { ROUTES } from '../../constants/routes.js';
import { SELECTORS } from '../../constants/selectors.js';

let initialized = false;

export function initDashboardView(router) {
    if (initialized) return;
    initialized = true;

    window.addEventListener('aprovadrive:desempenho-invalidado', () => {
        const viewInicio = qs('#view-inicio');
        if (viewInicio && viewInicio.style.display !== 'none') {
            const activeId = getUsuarioAtivoId();
            fetchDesempenho(activeId, true).then(remoto => {
                if (remoto && remoto.resumo) {
                    atualizarCardDesempenhoResumo(remoto);
                }
            }).catch(() => {});
        }
    });

    const perfilBtn = qs('.perfil');
    if (perfilBtn) {
        perfilBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
            window.location.href = ROUTES.HOME;
        });
    }
}

export async function renderDashboard() {
    usuarioGlobal.updateUI();

    const user = getCurrentUser();

    if (usuarioGlobal.nome) {
        setHTML('#inicio-saudacao', `Olá, ${usuarioGlobal.nome}! <span class="material-symbols-outlined icone-inline">waving_hand</span>`);
    }

    if (user && (typeof user.exp === 'number' || user.lv !== undefined)) {
        syncUserGamification(user);
    }

    const gamification = getGamificationData();
    if (gamification) {
        updateLevelUI(gamification);
        setText('.sequencia h3', `${gamification.diasOfensiva} dias de sequência!`);

        const taxa = getTaxaAproveitamento();
        setText('#card-desempenho-resumo .circulo-interno strong', `${taxa}%`);
    }

    const localDesempenho = getLocalDesempenho();
    if (localDesempenho) {
        atualizarCardDesempenhoResumo(localDesempenho);
    }

    fetchDesempenho(getUsuarioAtivoId(), false)
        .then(remoto => {
            if (remoto && remoto.resumo) {
                atualizarCardDesempenhoResumo(remoto);
            }
        })
        .catch(() => {});

    try {
        const payload = await getTarefas(undefined, false);
        if (payload) {
            if (payload.usuario) {
                syncUserGamification(payload.usuario);
            }

            const missaoContainer = qs('.missao');
            if (missaoContainer && payload.tarefasDoDia && payload.tarefasDoDia.length > 0) {
                const headerHtml = `
                    <div class="titulo-card">
                        <h2><span class="material-symbols-outlined icone-inline">target</span> Missão de hoje</h2>
                        <a href="#cronograma" class="ver" data-nav="cronograma">Ver cronograma</a>
                    </div>
                `;

                const tasksHtml = payload.tarefasDoDia.map((t) => {
                    const isDone = Boolean(t.concluida || t.status === 'done');
                    const isInProgress = !isDone && t.status === 'in_progress';
                    const icon = isDone
                        ? '<i class="fa-solid fa-check"></i>'
                        : isInProgress
                            ? '<i class="fa-solid fa-play"></i>'
                            : '<i class="fa-solid fa-book-open"></i>';
                    const iconStyle = isDone
                        ? 'background: #e8f5e9; color: #16a34a;'
                        : isInProgress
                            ? 'background: #e0f2fe; color: #0284c7;'
                            : 'background: #f1f5f9; color: #64748b;';

                    const statusBadge = isDone
                        ? '<span style="color: #16a34a; font-size: 11px; font-weight: bold; margin-left: 8px;">Concluída</span>'
                        : isInProgress
                            ? '<span style="color: #0284c7; font-size: 11px; font-weight: bold; margin-left: 8px;">Em andamento</span>'
                            : '';

                    return `
                        <div class="tarefa" style="cursor: pointer;" data-nav="cronograma">
                            <div class="check" style="${iconStyle}">
                                ${icon}
                            </div>
                            <div style="flex: 1;">
                                <strong>${escapeHtml(t.titulo)} ${statusBadge}</strong>
                                <span>${escapeHtml(t.duracao || '20 min')} • +${t.xp_reward || 30} XP</span>
                            </div>
                        </div>
                    `;
                }).join('');

                missaoContainer.innerHTML = headerHtml + tasksHtml;
            }
        }
    } catch (err) {
        console.warn('[DashboardView] Não foi possível carregar missões da API:', err.message);
    }

    // Tilt 3D elástico nos cards do dashboard
    applyTiltAll('.cards .card');
}

function atualizarCardDesempenhoResumo(desempenho) {
    if (!desempenho || !desempenho.resumo) return;
    const taxa = Number(desempenho.resumo.taxaAproveitamento ?? 0);
    const circuloInternoStrong = qs('#card-desempenho-resumo .circulo-interno strong');
    if (circuloInternoStrong) setText(circuloInternoStrong, `${taxa}%`);

    const circulo = qs('#card-desempenho-resumo .circulo');
    if (circulo) {
        const deg = Math.round((Math.max(0, Math.min(100, taxa)) / 100) * 360);
        const cor = desempenho.resumo.statusCor || (taxa >= 70 ? '#16a34a' : (taxa >= 50 ? '#f59e0b' : '#dc2626'));
        circulo.style.background = `conic-gradient(${cor} 0deg ${deg}deg, #e5e7eb ${deg}deg 360deg)`;
    }

    const questoesEl = qs(SELECTORS.DASHBOARD_RESUMO_QUESTOES);
    const acertosEl = qs(SELECTORS.DASHBOARD_RESUMO_ACERTOS);
    const simuladosEl = qs(SELECTORS.DASHBOARD_RESUMO_SIMULADOS);
    const xpEl = qs(SELECTORS.DASHBOARD_RESUMO_XP);

    const gamification = getGamificationData() || {};
    const xpVal = Number(desempenho.usuario?.exp ?? gamification.totalExp ?? 0);

    if (questoesEl && acertosEl && simuladosEl && xpEl) {
        setText(questoesEl, String(desempenho.resumo.totalQuestoes ?? 0));
        setText(acertosEl, String(desempenho.resumo.totalAcertos ?? 0));
        setText(simuladosEl, String(desempenho.resumo.totalSimulados ?? 0));
        setText(xpEl, `${xpVal.toLocaleString('pt-BR')} XP`);
    } else {
        const estatisticas = qsa('#card-desempenho-resumo .estatistica strong');
        if (estatisticas && estatisticas.length >= 4) {
            setText(estatisticas[0], String(desempenho.resumo.totalQuestoes ?? 0));
            setText(estatisticas[1], String(desempenho.resumo.totalAcertos ?? 0));
            setText(estatisticas[2], String(desempenho.resumo.totalSimulados ?? 0));
            setText(estatisticas[3], `${xpVal.toLocaleString('pt-BR')} XP`);
        }
    }
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
}
