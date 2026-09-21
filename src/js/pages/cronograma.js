import { ready, qs, qsa, on, setText } from '../utils/dom.js';
import {
    getDiaSemanaAtual,
    getNomesDias,
    getTarefas,
    getChaveDia,
    iniciarTarefa,
    concluirTarefa
} from '../services/cronogramaService.js';
import { addXp, getGamificationData } from '../services/gamificationService.js';
import { SELECTORS } from '../constants/selectors.js';
import { createTaskCard } from '../components/taskCard.js';

ready(async () => {
    const diaAtual = getDiaSemanaAtual();
    const nomesDias = getNomesDias();

    // Atualiza badges do HUD com dados locais de gamificação
    atualizarHud();

    // 1. Alternância de visibilidade entre as 6 divs dos dias da semana
    function mudarVisibilidadeDia(diaNum) {
        for (let d = 1; d <= 6; d++) {
            const divDia = qs(`#day-tasks-${d}`);
            if (divDia) {
                // Muda APENAS a visibilidade da div correspondente
                divDia.style.display = (d === Number(diaNum)) ? 'flex' : 'none';
            }
        }
    }

    // 2. Ativação inicial da aba do dia da semana
    const diaTabAtivo = qs(`${SELECTORS.CRONOGRAMA_TAB_PREFIX}${diaAtual}`);
    if (diaTabAtivo) {
        qsa(SELECTORS.CRONOGRAMA_TABS).forEach(t => t.classList.remove('active'));
        diaTabAtivo.classList.add('active');
    }

    const nomeDiaAtual = nomesDias[diaAtual] || 'Hoje';
    setText('.schedule-header h3', `Missões de ${nomeDiaAtual}`);

    // Define a visibilidade inicial para o dia atual
    mudarVisibilidadeDia(diaAtual);

    // 3. Event listeners das abas - alterna apenas a visibilidade
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
                // Muda apenas a visibilidade da div selecionada
                mudarVisibilidadeDia(diaNum);
            }
        });
    });

    // 4. Consumo da API e renderização dos cards nas 6 divs
    try {
        const payload = await getTarefas();
        if (payload) {
            renderizarTarefasNasDivs(payload);
            consumirTaskAtual(payload.taskAtual, payload.diaConcluido);
            atualizarAbas(payload, diaAtual);
            if (payload.usuario) {
                atualizarHud(payload.usuario);
            }
        }
    } catch (error) {
        console.error('Erro ao processar tarefas do cronograma:', error);
    }

    /**
     * Renderiza os cards de tarefas nas 6 divs (uma para cada dia da semana).
     * O clique no botão envia diretamente a requisição para a API sem validação local.
     * @param {Object} payload 
     */
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
                        // Ao clicar no botão (INICIAR ou BLOQUEADO), envia requisição diretamente à API
                        onStart: async (taskIniciada, btnEl) => {
                            const originalHtml = btnEl ? btnEl.innerHTML : 'INICIAR';
                            try {
                                if (btnEl) {
                                    btnEl.disabled = true;
                                    btnEl.textContent = 'Iniciando...';
                                }

                                const result = await iniciarTarefa(taskIniciada.id);

                                // Se a API aprovou, atualiza a interface com o novo estado
                                const updatedPayload = result.payload || await getTarefas();
                                renderizarTarefasNasDivs(updatedPayload);
                                consumirTaskAtual(updatedPayload.taskAtual, updatedPayload.diaConcluido);
                                atualizarAbas(updatedPayload, diaAtual);
                                mostrarNotificacao(result.message || `Missão "${taskIniciada.titulo}" iniciada! Bons estudos!`, 'sucesso');
                            } catch (error) {
                                // A validação da API retornou erro (ex: tarefa de outro dia ou anterior pendente)
                                mostrarNotificacao(error.message, 'erro');
                                if (btnEl) {
                                    btnEl.disabled = false;
                                    btnEl.innerHTML = originalHtml;
                                }
                            }
                        },

                        // Ao clicar no botão CONCLUIR, envia requisição diretamente à API
                        onComplete: async (taskConcluida, btnEl) => {
                            const originalHtml = btnEl ? btnEl.innerHTML : 'CONCLUIR';
                            try {
                                if (btnEl) {
                                    btnEl.disabled = true;
                                    btnEl.textContent = 'Concluindo...';
                                }

                                const result = await concluirTarefa(taskConcluida.id);

                                // Se a API aprovou a conclusão, adiciona o XP ganho
                                if (result.xp_reward) {
                                    addXp(result.xp_reward);
                                    atualizarHud();
                                }

                                const updatedPayload = result.payload || await getTarefas();
                                renderizarTarefasNasDivs(updatedPayload);
                                consumirTaskAtual(updatedPayload.taskAtual, updatedPayload.diaConcluido);
                                atualizarAbas(updatedPayload, diaAtual);
                                if (updatedPayload.usuario) {
                                    atualizarHud(updatedPayload.usuario);
                                }
                                mostrarNotificacao(result.message || `Missão "${taskConcluida.titulo}" concluída! +${result.xp_reward || 30} XP!`, 'sucesso');
                            } catch (error) {
                                // A validação da API retornou erro
                                mostrarNotificacao(error.message, 'erro');
                                if (btnEl) {
                                    btnEl.disabled = false;
                                    btnEl.innerHTML = originalHtml;
                                }
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

    /**
     * Consome os dados da task atual e atualiza a interface de destaque.
     * @param {Object|null} taskAtual 
     * @param {boolean} diaConcluido
     */
    function consumirTaskAtual(taskAtual, diaConcluido = false) {
        const banner = qs('#task-atual-banner');
        const tituloEl = qs('#task-atual-titulo');
        const xpEl = qs('#task-atual-xp');

        if (!banner) return;

        if (diaConcluido || !taskAtual) {
            banner.style.display = 'flex';
            banner.classList.add('completed-banner');
            if (tituloEl) {
                tituloEl.innerHTML = '<strong>Parabéns!</strong> Você concluiu todas as missões de hoje. Descanse e volte amanhã!';
            }
            if (xpEl) {
                xpEl.textContent = 'Dia Completo :)';
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

    /**
     * Atualiza as legendas de cada aba com o status das aulas.
     * @param {Object} payload 
     * @param {number} diaAtualNum 
     */
    function atualizarAbas(payload, diaAtualNum) {
        const diasData = payload.dias || {};

        for (let d = 1; d <= 6; d++) {
            const tab = qs(`${SELECTORS.CRONOGRAMA_TAB_PREFIX}${d}`);
            if (!tab) continue;

            const statusEl = tab.querySelector('.day-status');
            if (!statusEl) continue;

            if (d === diaAtualNum) {
                if (payload.diaConcluido) {
                    statusEl.textContent = '✔ Concluído';
                    statusEl.style.color = '#16a34a';
                } else {
                    statusEl.textContent = '• Hoje';
                    statusEl.style.color = '#2563eb';
                }
            } else if (d < diaAtualNum) {
                const chave = getChaveDia(d);
                const tarefas = diasData[chave] || [];
                const todasConcluidas = tarefas.length > 0 && tarefas.every(t => t.concluida || t.status === 'done');
                statusEl.textContent = todasConcluidas ? '✔ Concluído' : 'Anterior';
                statusEl.style.color = '#64748b';
            } else {
                statusEl.textContent = 'Bloqueado';
                statusEl.style.color = '#94a3b8';
            }
        }
    }

    /**
     * Atualiza o HUD do topo com os dados atuais de XP e ofensiva.
     * @param {Object} [usuarioPayload]
     */
    function atualizarHud(usuarioPayload) {
        const gamification = getGamificationData();
        const xpBadge = qs('.hud-card .stat-badge.xp');
        if (xpBadge) {
            const totalXp = (usuarioPayload && typeof usuarioPayload.exp === 'number')
                ? usuarioPayload.exp
                : (gamification ? gamification.xpAtual : 0);
            xpBadge.innerHTML = `<span class="material-symbols-outlined icone-inline">bolt</span> Total: ${totalXp} XP`;
        }
    }

    /**
     * Exibe toast flutuante com feedback para o usuário.
     * @param {string} mensagem 
     * @param {'sucesso' | 'erro' | 'info'} tipo 
     */
    function mostrarNotificacao(mensagem, tipo = 'info') {
        let toast = qs('#toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }

        toast.className = `toast-notification ${tipo} show`;
        toast.textContent = mensagem;

        if (window._toastTimeout) {
            clearTimeout(window._toastTimeout);
        }

        window._toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }
});


