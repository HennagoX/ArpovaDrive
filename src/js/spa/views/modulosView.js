/**
 * Módulo de Visão: Módulos do Conteúdo Selecionado (SPA)
 * 
 * Gerencia a renderização dos cards reutilizáveis de módulos de um conteúdo,
 * feedbacks de bloqueio e retorno para a biblioteca.
 */

import { qs, setText } from '../../utils/dom.js';
import {
    getConteudoById,
    getModulosByConteudoId,
    LOCKED_MODULE_MESSAGE
} from '../../services/conteudosService.js';
import { createModuleCard } from '../../components/moduleCard.js';

let initialized = false;
let toastTimeout = null;

export function initModulosView(router) {
    if (initialized) return;
    initialized = true;

    const btnVoltar = qs("#btn-voltar-conteudos");
    const breadcrumbRoot = qs("#breadcrumb-root-btn");

    if (btnVoltar && router) {
        btnVoltar.addEventListener("click", () => {
            router.navigateTo("conteudos");
        });
    }

    if (breadcrumbRoot && router) {
        breadcrumbRoot.addEventListener("click", () => {
            router.navigateTo("conteudos");
        });
    }
}

/**
 * Atualiza e renderiza os módulos do conteúdo selecionado
 * @param {string} conteudoId 
 */
export function abrirModulos(conteudoId) {
    if (!conteudoId) return;

    const conteudo = getConteudoById(conteudoId);
    if (!conteudo) {
        console.warn(`[ModulosView] Conteúdo "${conteudoId}" não encontrado.`);
        return;
    }

    const modulos = getModulosByConteudoId(conteudoId);

    // Atualiza cabeçalho global
    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');
    if (titleEl) setText(titleEl, conteudo.titulo);
    if (subtitleEl) setText(subtitleEl, `Trilha de estudos de ${conteudo.titulo}`);

    // Elementos do DOM
    const heroCover = qs("#modulo-hero-cover");
    const heroIcon = qs("#modulo-hero-icon");
    const heroCategory = qs("#modulo-hero-category");
    const heroTitle = qs("#modulo-hero-title");
    const heroDesc = qs("#modulo-hero-desc");
    const heroLiberados = qs("#modulo-hero-liberados");
    const heroBloqueados = qs("#modulo-hero-bloqueados");
    const heroProgressPct = qs("#modulo-hero-progress-pct");
    const heroProgressFill = qs("#modulo-hero-progress-fill");
    const modulosContadorBadge = qs("#modulos-contador-badge");
    const breadcrumbTitle = qs("#modulos-breadcrumb-title");
    const modulesListContainer = qs("#modules-list");

    // Atualiza Breadcrumb
    if (breadcrumbTitle) setText(breadcrumbTitle, conteudo.titulo);

    // Atualiza o Hero Card do conteúdo
    if (heroCover) {
        heroCover.className = `hero-cover ${conteudo.cor || 'green'}`;
    }
    if (heroIcon) {
        heroIcon.className = conteudo.icone || 'fa-solid fa-book-open';
    }
    if (heroCategory) setText(heroCategory, conteudo.categoria);
    if (heroTitle) setText(heroTitle, conteudo.titulo);
    if (heroDesc) setText(heroDesc, conteudo.descricao);

    // Estatísticas dos módulos
    const total = modulos.length;
    const bloqueados = modulos.filter(m => m.bloqueado).length;
    const liberados = total - bloqueados;
    const pctProgresso = total > 0 ? Math.round((liberados / total) * 100) : 0;

    if (heroLiberados) setText(heroLiberados, `${liberados} ${liberados === 1 ? 'Módulo Liberado' : 'Módulos Liberados'}`);
    if (heroBloqueados) setText(heroBloqueados, `${bloqueados} ${bloqueados === 1 ? 'Módulo Bloqueado' : 'Módulos Bloqueados'}`);
    if (heroProgressPct) setText(heroProgressPct, `${pctProgresso}%`);
    if (heroProgressFill) heroProgressFill.style.width = `${pctProgresso}%`;
    if (modulosContadorBadge) setText(modulosContadorBadge, `${total} ${total === 1 ? 'módulo' : 'módulos'}`);

    // Renderiza cards reutilizáveis
    if (modulesListContainer) {
        modulesListContainer.innerHTML = '';

        modulos.forEach((modulo) => {
            const card = createModuleCard(modulo, {
                onRead: (mod) => {
                    showToast(
                        `Módulo ${mod.numero}: "${mod.titulo}". A leitura estará disponível em breve!`,
                        'info',
                        'fa-solid fa-book-open'
                    );
                },
                onLockedClick: () => {
                    showToast(
                        LOCKED_MODULE_MESSAGE,
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

/**
 * Exibe notificação flutuante acessível para o usuário
 * @param {string} mensagem 
 * @param {'info'|'locked'|'success'} tipo 
 * @param {string} iconeClass 
 */
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
        <button type="button" class="toast-close" title="Fechar">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
    }

    toastContainer.appendChild(toast);

    toastTimeout = setTimeout(() => {
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3800);
}

function escapeToast(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
