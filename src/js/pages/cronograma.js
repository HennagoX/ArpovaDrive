import { ready, qs, qsa, on, setText } from '../utils/dom.js';
import {
    getDiaSemanaAtual,
    getNomesDias,
    getTarefas,
    getChaveDia,
    getNumeroDia,
    iniciarTarefa,
    concluirTarefa,
    getMockDia,
    setMockDia,
    getUsuarioAtivoId,
    setUsuarioAtivoId,
    getUsuariosCadastrados,
    verificarPermissaoAdmin
} from '../services/cronogramaService.js';
import { addXp, getGamificationData } from '../services/gamificationService.js';
import { logout } from '../services/authService.js';
import { SELECTORS } from '../constants/selectors.js';
import { ROUTES } from '../constants/routes.js';
import { createTaskCard } from '../components/taskCard.js';

ready(async () => {
    let diaAtual = getDiaSemanaAtual();
    const nomesDias = getNomesDias();

    // Atualiza badges do HUD inicialmente
    atualizarHud();

    // 1. Configura abas dos dias da semana
    configurarAbas();

    // 2. Configura botões de logout / sair (remove tudo do localStorage)
    const logoutElements = qsa('#btn-logout, #nav-logout, .btn-sair');
    logoutElements.forEach((btn) => {
        on(btn, 'click', (e) => {
            e.preventDefault();
            logout();
            window.location.href = ROUTES.HOME;
        });
    });

    // 3. Verifica se o usuário ativo é o Administrador
    const activeUserId = getUsuarioAtivoId();
    const isAdmin = await verificarPermissaoAdmin(activeUserId);

    const adminBadge = qs('#admin-indicator-badge');
    const userSelectorBar = qs('#user-selector-bar');
    const simulationHud = qs('#simulation-hud');

    if (isAdmin) {
        if (adminBadge) adminBadge.style.display = 'inline-flex';
        if (userSelectorBar) userSelectorBar.style.display = 'flex';
        if (simulationHud) simulationHud.style.display = 'flex';

        // Configura ferramentas exclusivas do Administrador
        configurarBarraSimulacao();
        await configurarSeletorUsuarios();
    } else {
        if (adminBadge) adminBadge.style.display = 'none';
        if (userSelectorBar) userSelectorBar.style.display = 'none';
        if (simulationHud) simulationHud.style.display = 'none';
        setMockDia('auto');
    }

    // 4. Configura botão de tentar novamente (em caso de erro)
    const btnRetry = qs('#btn-tentar-novamente');
    if (btnRetry) {
        on(btnRetry, 'click', async () => {
            await carregarCronograma(getUsuarioAtivoId());
        });
    }

    // 5. Carrega o cronograma do usuário ativo
    await carregarCronograma(getUsuarioAtivoId());

    /**
     * Alterna visibilidade entre as 6 divs dos dias da semana.
     * @param {number} diaNum 
     */
    function mudarVisibilidadeDia(diaNum) {
        for (let d = 1; d <= 6; d++) {
            const divDia = qs(`#day-tasks-${d}`);
            if (divDia) {
                divDia.style.display = (d === Number(diaNum)) ? 'flex' : 'none';
            }
        }
    }

    /**
     * Ativa a aba visualmente e exibe a div de tarefas correspondente.
     * @param {number} diaNum 
     */
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

    /**
     * Event listeners de alternância entre as abas da semana.
     */
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

    /**
     * Popula e gerencia o seletor de usuários cadastrados no banco.
     */
    async function configurarSeletorUsuarios() {
        const selectEl = qs('#select-usuario-ativo');
        const badgeEl = qs('#user-active-id-badge');
        if (!selectEl) return;

        try {
            const usuarios = await getUsuariosCadastrados();
            const currentUserId = getUsuarioAtivoId();

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

            if (badgeEl) {
                badgeEl.textContent = `ID: ${currentUserId.substring(0, 8)}...`;
                badgeEl.title = currentUserId;
            }

            on(selectEl, 'change', async (e) => {
                const novoId = e.target.value;
                setUsuarioAtivoId(novoId);
                if (badgeEl) {
                    badgeEl.textContent = `ID: ${novoId.substring(0, 8)}...`;
                    badgeEl.title = novoId;
                }
                const nomeUsuario = selectEl.options[selectEl.selectedIndex]?.textContent?.split(' ')[0] || 'Usuário';
                mostrarNotificacao(`Carregando cronograma de ${nomeUsuario}...`, 'info');
                await carregarCronograma(novoId);
            });
        } catch (err) {
            console.warn('Falha ao configurar dropdown de usuários:', err);
        }
    }

    /**
     * Configura a barra de mock/simulação de dias.
     */
    function configurarBarraSimulacao() {
        const mockAtivo = getMockDia();
        qsa('.btn-sim').forEach((btn) => {
            const simVal = btn.dataset.sim;
            if ((!mockAtivo && simVal === 'auto') || (mockAtivo && mockAtivo === simVal)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }

            on(btn, 'click', async () => {
                const targetSim = btn.dataset.sim;
                setMockDia(targetSim);

                qsa('.btn-sim').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                try {
                    btn.disabled = true;
                    await carregarCronograma(getUsuarioAtivoId());

                    const nomeSim = nomesDias[diaAtual] || targetSim;
                    const msgSim = targetSim === 'auto'
                        ? 'Simulação desativada: Retornou ao dia real do sistema.'
                        : `Modo Mock: Hoje agora é simulado como ${nomeSim}!`;
                    mostrarNotificacao(msgSim, 'info');
                } catch (err) {
                    mostrarNotificacao(err.message, 'erro');
                } finally {
                    btn.disabled = false;
                }
            });
        });
    }

    /**
     * Realiza a requisição das tarefas à API, exibindo estados explícitos de loading e erro.
     * @param {string} [userId] 
     */
    async function carregarCronograma(userId) {
        const loadingEl = qs('#cronograma-loading');
        const errorEl = qs('#cronograma-error');
        const banner = qs('#task-atual-banner');

        // Estado visual de carregamento ativo
        if (loadingEl) loadingEl.style.display = 'flex';
        if (errorEl) errorEl.style.display = 'none';
        if (banner) banner.style.display = 'none';

        // Esconde temporariamente as divs dos dias durante a requisição
        for (let d = 1; d <= 6; d++) {
            const div = qs(`#day-tasks-${d}`);
            if (div) div.style.display = 'none';
        }

        try {
            const targetUser = userId || getUsuarioAtivoId();
            const payload = await getTarefas(targetUser);

            if (!payload || !payload.dias) {
                throw new Error('Nenhuma missão encontrada para esta semana.');
            }

            // Sucesso na requisição: esconde loading e renderiza
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'none';

            diaAtual = payload.diaSemanaAtual || diaAtual;
            renderizarTarefasNasDivs(payload);
            consumirTaskAtual(payload.taskAtual, payload.diaConcluido);
            atualizarAbas(payload, diaAtual);
            ativarAba(diaAtual);

            if (payload.usuario) {
                atualizarHud(payload.usuario);
                const badgeEl = qs('#user-active-id-badge');
                if (badgeEl && payload.usuario.id_usuario) {
                    badgeEl.textContent = `ID: ${payload.usuario.id_usuario.substring(0, 8)}...`;
                    badgeEl.title = payload.usuario.id_usuario;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar cronograma:', error);

            // Esconde loading e exibe mensagem de erro explícita com retry
            if (loadingEl) loadingEl.style.display = 'none';
            if (banner) banner.style.display = 'none';
            if (errorEl) {
                errorEl.style.display = 'flex';
                setText('#cronograma-error-desc', error.message || 'Erro ao conectar à API AprovaDrive.');
            }

            mostrarNotificacao(error.message || 'Falha ao requisitar tarefas.', 'erro');
        }
    }

    /**
     * Renderiza os cards de tarefas nas 6 divs da semana.
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
                        // Ao clicar no botão (INICIAR ou BLOQUEADO)
                        onStart: async (taskIniciada, btnEl) => {
                            const originalHtml = btnEl ? btnEl.innerHTML : 'INICIAR';
                            try {
                                if (btnEl) {
                                    btnEl.disabled = true;
                                    btnEl.textContent = 'Iniciando...';
                                }

                                const result = await iniciarTarefa(taskIniciada.id, getUsuarioAtivoId());

                                const updatedPayload = result.payload || await getTarefas(getUsuarioAtivoId());
                                renderizarTarefasNasDivs(updatedPayload);
                                consumirTaskAtual(updatedPayload.taskAtual, updatedPayload.diaConcluido);
                                atualizarAbas(updatedPayload, diaAtual);
                                mostrarNotificacao(result.message || `Missão "${taskIniciada.titulo}" iniciada! Bons estudos!`, 'sucesso');
                            } catch (error) {
                                mostrarNotificacao(error.message, 'erro');
                                if (btnEl) {
                                    btnEl.disabled = false;
                                    btnEl.innerHTML = originalHtml;
                                }
                            }
                        },

                        // Ao clicar no botão CONCLUIR
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

                                const updatedPayload = result.payload || await getTarefas(getUsuarioAtivoId());
                                renderizarTarefasNasDivs(updatedPayload);
                                consumirTaskAtual(updatedPayload.taskAtual, updatedPayload.diaConcluido);
                                atualizarAbas(updatedPayload, diaAtual);

                                if (updatedPayload.usuario) {
                                    atualizarHud(updatedPayload.usuario);
                                }
                                mostrarNotificacao(result.message || `Missão "${taskConcluida.titulo}" concluída! +${result.xp_reward || 30} XP!`, 'sucesso');
                            } catch (error) {
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
     * Consome os dados da task atual e atualiza o banner de destaque.
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
     * Atualiza as legendas de cada aba com o status das missões.
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
