
import { qs, setText } from '../../utils/dom.js';
import {
    getMateriaQuestoesById,
    getBateriasByMateriaId,
    LOCKED_QUESTION_MESSAGE
} from '../../services/questoesService.js';
import { createQuestionModuleCard } from '../../components/questionModuleCard.js';

let initialized = false;
let toastTimeout = null;

export function initQuestoesModulosView(router) {
    if (initialized) return;
    initialized = true;

    const btnVoltar = qs("#btn-voltar-hub-questoes");
    const breadcrumbRoot = qs("#breadcrumb-questoes-root-btn");

    if (btnVoltar && router) {
        btnVoltar.addEventListener("click", () => {
            router.navigateTo("questoes");
        });
    }

    if (breadcrumbRoot && router) {
        breadcrumbRoot.addEventListener("click", () => {
            router.navigateTo("questoes");
        });
    }
}

export function abrirQuestoesModulos(materiaId) {
    if (!materiaId) return;

    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.add('no-sidebar');
    }

    const materia = getMateriaQuestoesById(materiaId);
    if (!materia) {
        console.warn(`[QuestoesModulosView] Matéria de questões "${materiaId}" não encontrada.`);
        return;
    }

    const baterias = getBateriasByMateriaId(materiaId);

    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');
    if (titleEl) setText(titleEl, `Questões: ${materia.titulo}`);
    if (subtitleEl) setText(subtitleEl, `Baterias de questões a cada 3 módulos de ${materia.titulo}`);

    const viewQuestoesModulos = qs("#view-questoes-modulos");
    const heroCover = qs("#questoes-hero-cover");
    const heroIcon = qs("#questoes-hero-icon");
    const heroCategory = qs("#questoes-hero-category");
    const heroTitle = qs("#questoes-hero-title");
    const heroDesc = qs("#questoes-hero-desc");
    const heroLiberadas = qs("#questoes-hero-liberadas");
    const heroBloqueadas = qs("#questoes-hero-bloqueadas");
    const heroProgressPct = qs("#questoes-hero-progress-pct");
    const heroProgressFill = qs("#questoes-hero-progress-fill");
    const contadorBadge = qs("#questoes-contador-badge");
    const breadcrumbTitle = qs("#questoes-breadcrumb-title");
    const modulesListContainer = qs("#questoes-modules-list");

    if (breadcrumbTitle) setText(breadcrumbTitle, materia.titulo);

    const temaCor = materia.cor || 'green';
    if (viewQuestoesModulos) {
        const themeClasses = Array.from(viewQuestoesModulos.classList).filter(c => c.startsWith('modulos-theme-'));
        themeClasses.forEach(c => viewQuestoesModulos.classList.remove(c));
        viewQuestoesModulos.classList.add(`modulos-theme-${temaCor}`);
    }
    const modal = qs("#modal-avancar-modulo");
    if (modal) {
        const themeClasses = Array.from(modal.classList).filter(c => c.startsWith('modulos-theme-'));
        themeClasses.forEach(c => modal.classList.remove(c));
        modal.classList.add(`modulos-theme-${temaCor}`);
    }

    if (heroCover) {
        heroCover.className = `questoes-emblem ${materia.cor || 'green'}`;
    }
    if (heroIcon) {
        heroIcon.className = materia.icone || 'fa-solid fa-circle-question';
    }
    if (heroCategory) setText(heroCategory, materia.categoria);
    if (heroTitle) setText(heroTitle, `Questões: ${materia.titulo}`);
    if (heroDesc) setText(heroDesc, materia.descricao);

    const total = baterias.length;
    const bloqueadas = baterias.filter(b => b.bloqueado).length;
    const liberadas = total - bloqueadas;
    const pctProgresso = total > 0 ? Math.round((liberadas / total) * 100) : 0;

    if (heroLiberadas) setText(heroLiberadas, `${liberadas} ${liberadas === 1 ? 'Bateria Liberada' : 'Baterias Liberadas'}`);
    if (heroBloqueadas) setText(heroBloqueadas, `${bloqueadas} ${bloqueadas === 1 ? 'Bateria Bloqueada' : 'Baterias Bloqueadas'}`);
    if (heroProgressPct) setText(heroProgressPct, `${pctProgresso}%`);
    if (heroProgressFill) heroProgressFill.style.width = `${pctProgresso}%`;
    if (contadorBadge) setText(contadorBadge, `${total} ${total === 1 ? 'bateria' : 'baterias'}`);

    if (modulesListContainer) {
        const isSameMateria = modulesListContainer.dataset.materiaId === materiaId && modulesListContainer.children.length > 0;
        if (!isSameMateria) {
            modulesListContainer.dataset.materiaId = materiaId;
            modulesListContainer.innerHTML = '';

            baterias.forEach((bateria) => {
                const card = createQuestionModuleCard(bateria, {
                    onStart: (bat) => {
                        showToast(
                            `Iniciando ${bat.titulo} (${bat.questoesCount} questões). A tela interativa de resolução de questões será conectada em breve!`,
                            'info',
                            'fa-solid fa-circle-play'
                        );
                    },
                    onLockedClick: (bat) => {
                        showToast(
                            bat.motivoBloqueio || LOCKED_QUESTION_MESSAGE,
                            'locked',
                            'fa-solid fa-lock'
                        );
                    }
                });

                if (card) {
                    modulesListContainer.appendChild(card);
                }
            });
        }
    }
}

export function showToast(mensagem, tipo = 'info', iconeClass = 'fa-solid fa-circle-info') {
    const toastContainer = qs("#toast-container");
    if (!toastContainer) return;

    toastContainer.innerHTML = '';
    if (toastTimeout) clearTimeout(toastTimeout);

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.setAttribute('role', 'alert');

    toast.innerHTML = `
        <i class="${iconeClass}"></i>
        <span>${escapeToast(mensagem)}</span>
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

function escapeToast(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
