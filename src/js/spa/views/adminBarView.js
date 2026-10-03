import { qs, on } from '../../utils/dom.js';
import {
    getUsuarioAtivoId,
    setUsuarioAtivoId,
    getUsuariosCadastrados,
    verificarPermissaoAdmin,
    regenerarCronogramaComIA,
    clearCachedTarefas
} from '../../services/cronogramaService.js';
import { invalidateLocalDesempenhoCache } from '../../services/desempenhoService.js';
import { limparCacheTarefasFixas } from '../../services/tarefasFixasService.js';
import { showToast } from './modulosView.js';
import { carregarCronograma } from './cronogramaView.js';
import { renderDesempenho } from './desempenhoView.js';
import { renderDashboard } from './dashboardView.js';
import { renderTarefas } from './tarefasView.js';

let initialized = false;
let currentRouter = null;

const SECOES_PRINCIPAIS = [
    'inicio',
    'cronograma',
    'desempenho',
    'conteudos',
    'questoes',
    'simulado',
    'tarefas'
];

export async function atualizarVisibilidadeAdminBar(routeName = null) {
    const userSelectorBar = qs('#user-selector-bar');
    if (!userSelectorBar) return;

    try {
        const isAdmin = await verificarPermissaoAdmin();
        if (!isAdmin) {
            userSelectorBar.style.display = 'none';
            return;
        }

        const route = routeName || currentRouter?.currentRoute || 'inicio';
        const isPrincipal = SECOES_PRINCIPAIS.includes(route);

        if (isPrincipal) {
            userSelectorBar.style.display = 'flex';
        } else {
            userSelectorBar.style.display = 'none';
        }
    } catch {
        userSelectorBar.style.display = 'none';
    }
}

export async function initAdminBarView(router) {
    currentRouter = router;
    if (initialized) return;
    initialized = true;

    router.onRouteChange((routeName) => {
        atualizarVisibilidadeAdminBar(routeName);
    });

    try {
        const isAdmin = await verificarPermissaoAdmin();
        const userSelectorBar = qs('#user-selector-bar');
        if (!userSelectorBar) return;

        if (!isAdmin) {
            userSelectorBar.style.display = 'none';
            return;
        }

        await configurarSeletorGlobal();
        await atualizarVisibilidadeAdminBar(router.currentRoute || 'inicio');
    } catch (e) {
        console.warn('[AdminBar] Falha ao inicializar barra admin:', e);
    }
}

async function configurarSeletorGlobal() {
    const selectEl = qs('#select-usuario-ativo');
    const badgeEl = qs('#user-active-id-badge');
    const btnResetIa = qs('#btn-admin-reset-cronograma');
    if (!selectEl) return;

    const currentUserId = getUsuarioAtivoId();

    if (badgeEl) {
        badgeEl.textContent = `ID: ${currentUserId.substring(0, 8)}...`;
        badgeEl.title = currentUserId;
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
    } catch (err) {
        console.warn('[AdminBar] Erro ao carregar usuários:', err);
    }

    on(selectEl, 'change', async (e) => {
        const novoId = e.target.value;
        if (!novoId) return;

        setUsuarioAtivoId(novoId);
        if (badgeEl) {
            badgeEl.textContent = `ID: ${novoId.substring(0, 8)}...`;
            badgeEl.title = novoId;
        }

        const selectedOpt = selectEl.options[selectEl.selectedIndex];
        const nomeAluno = selectedOpt ? selectedOpt.textContent.trim() : 'Aluno';

        invalidateLocalDesempenhoCache(novoId);
        clearCachedTarefas(novoId);
        limparCacheTarefasFixas();

        showToast(`Espiando aluno: ${nomeAluno}`, 'info', 'fa-solid fa-eye');

        const rota = currentRouter?.currentRoute;
        if (rota === 'cronograma') {
            await carregarCronograma(novoId, true);
        } else if (rota === 'desempenho') {
            await renderDesempenho(true);
        } else if (rota === 'inicio') {
            await renderDashboard();
        } else if (rota === 'tarefas') {
            await renderTarefas(true);
        }
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
                invalidateLocalDesempenhoCache(targetUserId);

                const rota = currentRouter?.currentRoute;
                if (rota === 'cronograma') {
                    await carregarCronograma(targetUserId, true);
                } else if (rota === 'desempenho') {
                    await renderDesempenho(true);
                } else if (rota === 'inicio') {
                    await renderDashboard();
                }

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
