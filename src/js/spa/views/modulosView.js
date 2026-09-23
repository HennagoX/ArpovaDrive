/**
 * Módulo de Visão: Módulos do Conteúdo Selecionado e Leitura de PDF (SPA)
 * 
 * Gerencia:
 * - A listagem e renderização dos cards de módulos do conteúdo selecionado
 * - A sincronização do progresso atual com o backend (PostgreSQL)
 * - A abertura da tela de leitura embarcada de PDFs
 * - O modal de confirmação e chamada à API para avançar para o próximo módulo (+1)
 */

import { qs, setText } from '../../utils/dom.js';
import {
    getConteudoById,
    getModulosByConteudoId,
    LOCKED_MODULE_MESSAGE
} from '../../services/conteudosService.js';
import { getModuloAtual, avancarModulo } from '../../services/moduloService.js';
import { createModuleCard } from '../../components/moduleCard.js';

let initialized = false;
let toastTimeout = null;
let routerRef = null;
let activeConteudoId = null;
let activeModulo = null;

/**
 * Inicializa ouvintes de eventos da tela de módulos e do leitor de PDF
 * @param {Object} router - Instância do SPA Router
 */
export function initModulosView(router) {
    routerRef = router;
    if (initialized) return;
    initialized = true;

    // 1. Navegação de retorno da tela de lista de módulos
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

    // 2. Navegação de retorno da tela de leitura de PDF
    const btnVoltarLeitura = qs("#btn-voltar-leitura-modulos");
    const breadcrumbLeituraConteudos = qs("#breadcrumb-leitura-conteudos");
    const breadcrumbLeituraModuloRoot = qs("#breadcrumb-leitura-modulo-root");

    if (btnVoltarLeitura && router) {
        btnVoltarLeitura.addEventListener("click", () => {
            toggleFullscreenReader(false);
            if (activeConteudoId) {
                router.navigateTo("modulos", { conteudoId: activeConteudoId });
            } else {
                router.navigateTo("conteudos");
            }
        });
    }

    if (breadcrumbLeituraConteudos && router) {
        breadcrumbLeituraConteudos.addEventListener("click", () => {
            toggleFullscreenReader(false);
            router.navigateTo("conteudos");
        });
    }

    if (breadcrumbLeituraModuloRoot && router) {
        breadcrumbLeituraModuloRoot.addEventListener("click", () => {
            toggleFullscreenReader(false);
            if (activeConteudoId) {
                router.navigateTo("modulos", { conteudoId: activeConteudoId });
            } else {
                router.navigateTo("conteudos");
            }
        });
    }

    // 3. Botão do topo para abrir/reabrir modal de avanço na tela de leitura
    const btnAvancarTopo = qs("#btn-avancar-modulo-topo");
    if (btnAvancarTopo) {
        btnAvancarTopo.addEventListener("click", () => {
            if (activeConteudoId && activeModulo) {
                const conteudo = getConteudoById(activeConteudoId);
                abrirModalAvancar(conteudo, activeModulo);
            }
        });
    }

    // 3.5. Botão para alternar modo tela cheia / expandido do visualizador
    const btnExpandPdf = qs("#btn-toggle-expand-pdf");
    if (btnExpandPdf) {
        btnExpandPdf.addEventListener("click", () => {
            toggleFullscreenReader();
        });
    }

    // 4. Ações da Modal de Avanço de Módulo
    const btnFecharModal = qs("#btn-fechar-modal-modulo");
    const btnContinuarLendo = qs("#btn-modal-continuar-leitura");
    const modalOverlay = qs("#modal-avancar-modulo");
    const btnConfirmarAvanco = qs("#btn-modal-confirmar-avanco");

    if (btnFecharModal) {
        btnFecharModal.addEventListener("click", fecharModalAvancar);
    }

    if (btnContinuarLendo) {
        btnContinuarLendo.addEventListener("click", fecharModalAvancar);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) {
                fecharModalAvancar();
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const modalEl = qs("#modal-avancar-modulo");
            if (modalEl && modalEl.style.display !== "none") {
                fecharModalAvancar();
                return;
            }
            const viewLeitura = qs("#view-leitura-pdf");
            if (viewLeitura && viewLeitura.classList.contains("is-fullscreen-reader")) {
                toggleFullscreenReader(false);
            }
        }
    });

    // 5. Botão que chama a rota no backend para adicionar +1 no módulo atual
    if (btnConfirmarAvanco) {
        btnConfirmarAvanco.addEventListener("click", async () => {
            if (!activeConteudoId) {
                showToast("Conteúdo não identificado para avançar.", "locked");
                return;
            }

            const originalHtml = btnConfirmarAvanco.innerHTML;
            try {
                btnConfirmarAvanco.disabled = true;
                btnConfirmarAvanco.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Avançando módulo...';

                // Chamada à rota do backend (POST /modulo/next)
                const resultado = await avancarModulo(activeConteudoId);

                fecharModalAvancar();

                const proxModuloNum = resultado.modulo_atual;
                showToast(
                    `Parabéns! Módulo concluído com sucesso. Você avançou para o Módulo ${proxModuloNum}! +${resultado.xp_ganha || 25} XP`,
                    'success',
                    'fa-solid fa-circle-check'
                );

                // Retorna para a tela de módulos já com o novo módulo desbloqueado
                if (router) {
                    router.navigateTo("modulos", { conteudoId: activeConteudoId });
                } else {
                    abrirModulos(activeConteudoId);
                }
            } catch (err) {
                console.error("[ModulosView] Erro ao avançar módulo:", err);
                showToast(err.message || "Erro ao avançar para o próximo módulo.", "locked", "fa-solid fa-triangle-exclamation");
            } finally {
                btnConfirmarAvanco.disabled = false;
                btnConfirmarAvanco.innerHTML = originalHtml;
            }
        });
    }
}

/**
 * Atualiza e renderiza os módulos do conteúdo selecionado integrando com o banco de dados
 * @param {string} conteudoId 
 */
export async function abrirModulos(conteudoId) {
    if (!conteudoId) return;
    activeConteudoId = conteudoId;

    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.add('no-sidebar');
    }

    const conteudo = getConteudoById(conteudoId);
    if (!conteudo) {
        console.warn(`[ModulosView] Conteúdo "${conteudoId}" não encontrado.`);
        return;
    }

    // Consulta o progresso atual do módulo no backend
    let moduloAtual = 1;
    try {
        const progresso = await getModuloAtual(conteudoId);
        moduloAtual = Math.max(1, Number(progresso.modulo_atual || 1));
    } catch (err) {
        console.warn('[ModulosView] Fallback de progresso local:', err.message);
    }

    const modulos = getModulosByConteudoId(conteudoId, moduloAtual);

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

    // Atualiza o tema visual da tela de módulos com base na cor do conteúdo
    const viewModulos = qs("#view-modulos");
    if (viewModulos) {
        const themeClasses = Array.from(viewModulos.classList).filter(c => c.startsWith('modulos-theme-'));
        themeClasses.forEach(c => viewModulos.classList.remove(c));
        const temaCor = conteudo.cor || 'green';
        viewModulos.classList.add(`modulos-theme-${temaCor}`);
    }

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

    // Estatísticas dos módulos sincronizadas com o banco
    const total = modulos.length;
    const bloqueados = modulos.filter(m => m.bloqueado).length;
    const liberados = total - bloqueados;
    const pctProgresso = total > 0 ? Math.min(100, Math.round((liberados / total) * 100)) : 0;

    if (heroLiberados) setText(heroLiberados, `${liberados} ${liberados === 1 ? 'Módulo Liberado' : 'Módulos Liberados'}`);
    if (heroBloqueados) setText(heroBloqueados, `${bloqueados} ${bloqueados === 1 ? 'Módulo Bloqueado' : 'Módulos Bloqueados'}`);
    if (heroProgressPct) setText(heroProgressPct, `${pctProgresso}%`);
    if (heroProgressFill) heroProgressFill.style.width = `${pctProgresso}%`;
    if (modulosContadorBadge) setText(modulosContadorBadge, `${total} ${total === 1 ? 'módulo' : 'módulos'}`);

    // Renderiza cards reutilizáveis com integração para a tela de leitura de PDF
    if (modulesListContainer) {
        modulesListContainer.innerHTML = '';

        modulos.forEach((modulo) => {
            const card = createModuleCard(modulo, {
                onRead: (mod) => {
                    abrirLeituraPdf(conteudoId, mod);
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
 * Abre a tela de leitura do PDF do módulo e exibe o modal para avançar para o próximo módulo.
 * @param {string} conteudoId 
 * @param {Object|number} moduloOrNumero 
 */
export function abrirLeituraPdf(conteudoId, moduloOrNumero) {
    if (!conteudoId) return;
    activeConteudoId = conteudoId;

    const conteudo = getConteudoById(conteudoId);
    if (!conteudo) return;

    // Resolve o módulo
    let modulo = null;
    if (typeof moduloOrNumero === 'object' && moduloOrNumero !== null) {
        modulo = moduloOrNumero;
    } else {
        const modulos = getModulosByConteudoId(conteudoId);
        const num = Number(moduloOrNumero || 1);
        modulo = modulos.find(m => Number(m.numero) === num) || modulos[0];
    }

    if (!modulo) return;
    activeModulo = modulo;

    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.add('no-sidebar');
    }

    // Se o router estiver disponível, navega para a rota de leitura de PDF
    if (routerRef && routerRef.currentRoute !== 'leitura-pdf') {
        routerRef.navigateTo('leitura-pdf', {
            conteudoId,
            moduloNumero: modulo.numero,
            modulo
        });
    }

    // Configura os elementos da tela de visualização
    const viewLeitura = qs("#view-leitura-pdf");
    if (viewLeitura) {
        const themeClasses = Array.from(viewLeitura.classList).filter(c => c.startsWith('modulos-theme-'));
        themeClasses.forEach(c => viewLeitura.classList.remove(c));
        const temaCor = conteudo.cor || 'green';
        viewLeitura.classList.add(`modulos-theme-${temaCor}`);
    }

    // Atualiza cabeçalhos e breadcrumb da leitura
    const breadcrumbRoot = qs("#breadcrumb-leitura-modulo-root");
    const breadcrumbAtual = qs("#breadcrumb-leitura-modulo-atual");
    const badgeNumero = qs("#leitura-modulo-numero-badge");
    const duracaoEl = qs("#leitura-modulo-duracao");
    const topicosEl = qs("#leitura-modulo-topicos");
    const tituloEl = qs("#leitura-modulo-titulo");
    const descEl = qs("#leitura-modulo-desc");
    const headerIcon = qs("#leitura-header-icon i");
    const btnExternal = qs("#btn-abrir-pdf-nova-aba");
    const iframePdf = qs("#leitura-pdf-frame");

    const numeroFormatado = String(modulo.numero || 1).padStart(2, '0');

    if (breadcrumbRoot) setText(breadcrumbRoot, conteudo.titulo);
    if (breadcrumbAtual) setText(breadcrumbAtual, `Módulo ${numeroFormatado}`);
    if (badgeNumero) setText(badgeNumero, `Módulo ${numeroFormatado}`);
    if (tituloEl) setText(tituloEl, modulo.titulo || `Módulo ${numeroFormatado}`);
    if (descEl) setText(descEl, modulo.descricao || 'Material oficial para estudo.');

    if (duracaoEl) {
        duracaoEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${modulo.duracao || '20 min'}`;
    }
    if (topicosEl) {
        const topicosText = modulo.topicos ? `${modulo.topicos} tópicos` : 'Aulas práticas';
        topicosEl.innerHTML = `<i class="fa-regular fa-file-lines"></i> ${topicosText}`;
    }
    if (headerIcon) {
        headerIcon.className = conteudo.icone || 'fa-solid fa-file-pdf';
    }

    // Carrega o PDF no iframe e no botão externo
    const pdfUrl = modulo.pdfUrl || '';
    if (btnExternal) {
        btnExternal.href = pdfUrl || '#';
        btnExternal.style.display = pdfUrl ? 'inline-flex' : 'none';
    }

    if (iframePdf) {
        iframePdf.src = pdfUrl;
    }

    // Conforme solicitado: assim que abrir o PDF, abre a modal simples de avançar módulo
    abrirModalAvancar(conteudo, modulo);
}

/**
 * Abre a modal simples com a opção de avançar para o próximo módulo
 * @param {Object} conteudo 
 * @param {Object} modulo 
 */
export function abrirModalAvancar(conteudo, modulo) {
    const modal = qs("#modal-avancar-modulo");
    if (!modal) return;

    const tag = qs("#modal-modulo-tag");
    const titulo = qs("#modal-modulo-titulo");
    const desc = qs("#modal-modulo-descricao");

    const numeroFormatado = String(modulo?.numero || 1).padStart(2, '0');

    if (tag) setText(tag, `Módulo ${numeroFormatado}`);
    if (titulo) setText(titulo, `Avançar para o próximo módulo?`);
    if (desc) {
        desc.innerHTML = `
            Você abriu o material do <strong>Módulo ${numeroFormatado}: "${modulo?.titulo || 'Conteúdo'}"</strong>.
            Ao avançar, o sistema registrará seu progresso em <strong>${conteudo?.titulo || 'estudos'}</strong>, concederá <strong>+25 XP</strong> e liberará o próximo módulo na sua trilha!
        `;
    }

    modal.style.display = 'flex';
    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.add('modal-modulo-open');
    }
}

/**
 * Fecha a modal de avanço de módulo
 */
export function fecharModalAvancar() {
    const modal = qs("#modal-avancar-modulo");
    if (modal) {
        modal.style.display = 'none';
    }
    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.remove('modal-modulo-open');
    }
}

/**
 * Alterna modo expandido / tela cheia do visualizador de PDF
 * @param {boolean} [forceState]
 */
export function toggleFullscreenReader(forceState) {
    const viewLeitura = qs("#view-leitura-pdf");
    const btnExpandPdf = qs("#btn-toggle-expand-pdf");
    if (!viewLeitura) return;

    const shouldExpand = typeof forceState === 'boolean'
        ? forceState
        : !viewLeitura.classList.contains("is-fullscreen-reader");

    if (shouldExpand) {
        viewLeitura.classList.add("is-fullscreen-reader");
        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.add("pdf-fullscreen-active");
        }
        if (btnExpandPdf) {
            btnExpandPdf.innerHTML = '<i class="fa-solid fa-compress"></i> <span class="btn-expand-text">Reduzir</span>';
            btnExpandPdf.title = "Sair do modo tela cheia (Esc)";
            btnExpandPdf.classList.add("active");
        }
    } else {
        viewLeitura.classList.remove("is-fullscreen-reader");
        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.remove("pdf-fullscreen-active");
        }
        if (btnExpandPdf) {
            btnExpandPdf.innerHTML = '<i class="fa-solid fa-expand"></i> <span class="btn-expand-text">Expandir</span>';
            btnExpandPdf.title = "Alternar modo tela cheia / expandido";
            btnExpandPdf.classList.remove("active");
        }
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
    }, 4000);
}

function escapeToast(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
