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
import {
    getModuloAtual,
    getModuloAtualCached,
    setModuloAtualCached,
    avancarModulo
} from '../../services/moduloService.js';
import { checkBateriaLiberadaPorModulo } from '../../services/questoesService.js';
import { createModuleCard, updateModuleCard } from '../../components/moduleCard.js';

let initialized = false;
let toastTimeout = null;
let routerRef = null;
let activeConteudoId = null;
let activeModulo = null;
let proximoModuloPendente = null;

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

    // 3. Botão do topo para avançar módulo na tela de leitura
    const btnAvancarTopo = qs("#btn-avancar-modulo-topo");
    if (btnAvancarTopo) {
        btnAvancarTopo.addEventListener("click", async () => {
            if (!activeConteudoId || !activeModulo) return;

            const numModuloAtual = Number(activeModulo.numero || 1);
            const conteudo = getConteudoById(activeConteudoId);
            const modulos = getModulosByConteudoId(activeConteudoId);

            const originalHtml = btnAvancarTopo.innerHTML;
            try {
                btnAvancarTopo.disabled = true;
                btnAvancarTopo.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Avançando...';

                // Chamada à rota do backend (POST /modulo/next) para persistir o progresso
                const resultado = await avancarModulo(activeConteudoId);
                const proxModuloNum = Number(resultado.modulo_atual || numModuloAtual + 1);

                // Atualiza cirurgicamente o DOM dos módulos imediatamente
                atualizarCardsModuloUI(activeConteudoId, proxModuloNum);

                // Localiza o próximo módulo na lista do conteúdo
                const proxModulo = modulos.find(m => Number(m.numero) === proxModuloNum)
                    || modulos.find(m => Number(m.numero) === numModuloAtual + 1);

                // Verifica se a conclusão DESTE módulo libera uma nova bateria de questões (a cada 3 módulos)
                const bateriaLiberada = checkBateriaLiberadaPorModulo(activeConteudoId, numModuloAtual);

                if (bateriaLiberada) {
                    showToast(
                        `Parabéns! Módulo ${String(numModuloAtual).padStart(2, '0')} concluído! +${resultado.xp_ganha || 25} XP`,
                        'success',
                        'fa-solid fa-circle-check'
                    );

                    // Salva próximo módulo pendente caso o aluno decida continuar a leitura
                    proximoModuloPendente = proxModulo || null;

                    // Abre o modal avisando sobre a bateria de questões liberada
                    abrirModalQuestoesLiberadas(conteudo, activeModulo, bateriaLiberada, proxModulo);
                } else {
                    // Módulo intermediário: NÃO libera questões, avança direto sem modal
                    showToast(
                        `Parabéns! Módulo concluído. Você avançou para o Módulo ${String(proxModuloNum).padStart(2, '0')}! +${resultado.xp_ganha || 25} XP`,
                        'success',
                        'fa-solid fa-circle-check'
                    );

                    if (proxModulo) {
                        abrirLeituraPdf(activeConteudoId, proxModulo);
                    } else {
                        showToast(`Você concluiu todos os módulos de ${conteudo?.titulo || 'estudos'}!`, 'success');
                        router.navigateTo("modulos", { conteudoId: activeConteudoId });
                    }
                }
            } catch (err) {
                console.error("[ModulosView] Erro ao avançar módulo:", err);
                showToast(err.message || "Erro ao avançar para o próximo módulo.", "locked", "fa-solid fa-triangle-exclamation");
            } finally {
                btnAvancarTopo.disabled = false;
                btnAvancarTopo.innerHTML = originalHtml;
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

    // 4. Ações da Modal de Questões Liberadas
    const btnFecharModal = qs("#btn-fechar-modal-modulo");
    const btnContinuarLendo = qs("#btn-modal-continuar-leitura");
    const modalOverlay = qs("#modal-avancar-modulo");
    const btnIrQuestoes = qs("#btn-modal-confirmar-avanco");

    const fecharECarregarProximo = () => {
        fecharModalAvancar();
        if (proximoModuloPendente) {
            const nextMod = proximoModuloPendente;
            proximoModuloPendente = null;
            abrirLeituraPdf(activeConteudoId, nextMod);
        } else if (activeConteudoId && router) {
            router.navigateTo("modulos", { conteudoId: activeConteudoId });
        }
    };

    if (btnFecharModal) {
        btnFecharModal.addEventListener("click", fecharECarregarProximo);
    }

    if (btnContinuarLendo) {
        btnContinuarLendo.addEventListener("click", fecharECarregarProximo);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) {
                fecharECarregarProximo();
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const modalEl = qs("#modal-avancar-modulo");
            if (modalEl && modalEl.style.display !== "none") {
                fecharECarregarProximo();
                return;
            }
            const viewLeitura = qs("#view-leitura-pdf");
            if (viewLeitura && viewLeitura.classList.contains("is-fullscreen-reader")) {
                toggleFullscreenReader(false);
            }
        }
    });

    // 5. Botão que vai para a tela de módulos/baterias de questões da matéria
    if (btnIrQuestoes) {
        btnIrQuestoes.addEventListener("click", () => {
            const materiaId = activeConteudoId;
            proximoModuloPendente = null;
            fecharModalAvancar();
            toggleFullscreenReader(false);

            if (materiaId && router) {
                router.navigateTo("questoes-modulos", { materiaId });
            } else if (router) {
                router.navigateTo("questoes");
            }
        });
    }
}

/**
 * Aplica a classe de cor temática ao modal global (#modal-avancar-modulo)
 * @param {string} temaCor - Nome da cor ('green', 'blue', 'yellow', 'red', 'purple')
 */
export function aplicarTemaModal(temaCor = 'green') {
    const modal = qs("#modal-avancar-modulo");
    if (modal) {
        const themeClasses = Array.from(modal.classList).filter(c => c.startsWith('modulos-theme-'));
        themeClasses.forEach(c => modal.classList.remove(c));
        modal.classList.add(`modulos-theme-${temaCor}`);
    }
}

/**
 * Atualiza cirurgicamente apenas os cards cujo estado mudou e os contadores do Hero,
 * sem resetar ou reconstruir a lista do DOM.
 * @param {string} conteudoId 
 * @param {number} moduloAtual 
 */
export function atualizarCardsModuloUI(conteudoId, moduloAtual) {
    if (!conteudoId) return;
    const modulos = getModulosByConteudoId(conteudoId, moduloAtual);
    const modulesListContainer = qs("#modules-list");

    // Estatísticas dos módulos sincronizadas
    const total = modulos.length;
    const bloqueados = modulos.filter(m => m.bloqueado).length;
    const liberados = total - bloqueados;
    const pctProgresso = total > 0 ? Math.min(100, Math.round((liberados / total) * 100)) : 0;

    const heroLiberados = qs("#modulo-hero-liberados");
    const heroBloqueados = qs("#modulo-hero-bloqueados");
    const heroProgressPct = qs("#modulo-hero-progress-pct");
    const heroProgressFill = qs("#modulo-hero-progress-fill");
    const modulosContadorBadge = qs("#modulos-contador-badge");

    if (heroLiberados) setText(heroLiberados, `${liberados} ${liberados === 1 ? 'Módulo Liberado' : 'Módulos Liberados'}`);
    if (heroBloqueados) setText(heroBloqueados, `${bloqueados} ${bloqueados === 1 ? 'Módulo Bloqueado' : 'Módulos Bloqueados'}`);
    if (heroProgressPct) setText(heroProgressPct, `${pctProgresso}%`);
    if (heroProgressFill) heroProgressFill.style.width = `${pctProgresso}%`;
    if (modulosContadorBadge) setText(modulosContadorBadge, `${total} ${total === 1 ? 'módulo' : 'módulos'}`);

    if (modulesListContainer) {
        const cards = Array.from(modulesListContainer.children);
        cards.forEach(card => {
            const num = Number(card.dataset.moduleNumber);
            const mod = modulos.find(m => Number(m.numero) === num);
            if (mod) {
                updateModuleCard(card, mod, {
                    onRead: (m) => abrirLeituraPdf(conteudoId, m),
                    onLockedClick: () => showToast(LOCKED_MODULE_MESSAGE, 'locked', 'fa-solid fa-lock')
                });
            }
        });
    }
}

/**
 * Atualiza e renderiza os módulos do conteúdo selecionado integrando com o banco de dados.
 * Utiliza o localStorage para renderização imediata (0ms) e atualização diferencial no DOM.
 * 
 * @param {string} conteudoId 
 */
export function abrirModulos(conteudoId) {
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

    // 1. Obtém o progresso imediatamente do localStorage (0ms de latência)
    const moduloAtual = getModuloAtualCached(conteudoId);
    const modulos = getModulosByConteudoId(conteudoId, moduloAtual);

    // 2. Atualiza cabeçalho global
    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');
    if (titleEl) setText(titleEl, conteudo.titulo);
    if (subtitleEl) setText(subtitleEl, `Trilha de estudos de ${conteudo.titulo}`);

    const breadcrumbTitle = qs("#modulos-breadcrumb-title");
    if (breadcrumbTitle) setText(breadcrumbTitle, conteudo.titulo);

    // 3. Atualiza o tema visual da tela de módulos com base na cor do conteúdo
    const temaCor = conteudo.cor || 'green';
    const viewModulos = qs("#view-modulos");
    if (viewModulos) {
        const themeClasses = Array.from(viewModulos.classList).filter(c => c.startsWith('modulos-theme-'));
        themeClasses.forEach(c => viewModulos.classList.remove(c));
        viewModulos.classList.add(`modulos-theme-${temaCor}`);
    }
    aplicarTemaModal(temaCor);

    // 4. Atualiza o Hero Card do conteúdo
    const heroCover = qs("#modulo-hero-cover");
    const heroIcon = qs("#modulo-hero-icon");
    const heroCategory = qs("#modulo-hero-category");
    const heroTitle = qs("#modulo-hero-title");
    const heroDesc = qs("#modulo-hero-desc");
    if (heroCover) heroCover.className = `hero-cover ${conteudo.cor || 'green'}`;
    if (heroIcon) heroIcon.className = conteudo.icone || 'fa-solid fa-book-open';
    if (heroCategory) setText(heroCategory, conteudo.categoria);
    if (heroTitle) setText(heroTitle, conteudo.titulo);
    if (heroDesc) setText(heroDesc, conteudo.descricao);

    // 5. Renderização diferencial (só muda o que realmente mudou, sem resetar todo o DOM)
    const modulesListContainer = qs("#modules-list");
    const isSameConteudo = modulesListContainer &&
        modulesListContainer.dataset.conteudoId === conteudoId &&
        modulesListContainer.children.length > 0;

    if (isSameConteudo) {
        // Já renderizado para esta matéria: atualiza cirurgicamente cards e hero
        atualizarCardsModuloUI(conteudoId, moduloAtual);
    } else if (modulesListContainer) {
        // Primeira carga ou troca de matéria: renderiza com base no localStorage instantâneo
        modulesListContainer.dataset.conteudoId = conteudoId;
        modulesListContainer.innerHTML = '';

        modulos.forEach((modulo) => {
            const card = createModuleCard(modulo, {
                onRead: (mod) => abrirLeituraPdf(conteudoId, mod),
                onLockedClick: () => showToast(LOCKED_MODULE_MESSAGE, 'locked', 'fa-solid fa-lock')
            });
            if (card) {
                modulesListContainer.appendChild(card);
            }
        });

        atualizarCardsModuloUI(conteudoId, moduloAtual);
    }

    // 6. Sincronização em segundo plano não bloqueante (SWR)
    getModuloAtual(conteudoId).then((progresso) => {
        if (progresso && progresso.mudou && activeConteudoId === conteudoId) {
            const novoNum = Math.max(1, Number(progresso.modulo_atual || 1));
            atualizarCardsModuloUI(conteudoId, novoNum);
        }
    }).catch((err) => {
        console.warn('[ModulosView] Sincronização em segundo plano:', err.message);
    });
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
    const temaCor = conteudo.cor || 'green';
    const viewLeitura = qs("#view-leitura-pdf");
    if (viewLeitura) {
        const themeClasses = Array.from(viewLeitura.classList).filter(c => c.startsWith('modulos-theme-'));
        themeClasses.forEach(c => viewLeitura.classList.remove(c));
        viewLeitura.classList.add(`modulos-theme-${temaCor}`);
    }
    aplicarTemaModal(temaCor);

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

}

/**
 * Abre a modal anunciando que uma nova bateria de questões foi liberada
 * e oferece a opção de ir para as baterias de questões ou continuar a leitura.
 * 
 * @param {Object} conteudo - Dados do conteúdo/matéria
 * @param {Object} moduloConcluido - Módulo concluído
 * @param {Object} bateria - Bateria desbloqueada
 * @param {Object} [proximoModulo] - Próximo módulo a ser lido se continuar
 */
export function abrirModalQuestoesLiberadas(conteudo, moduloConcluido, bateria, proximoModulo) {
    const modal = qs("#modal-avancar-modulo");
    if (!modal) return;

    aplicarTemaModal(conteudo?.cor || 'green');

    proximoModuloPendente = proximoModulo || null;

    const tag = qs("#modal-modulo-tag");
    const titulo = qs("#modal-modulo-titulo");
    const desc = qs("#modal-modulo-descricao");
    const btnQuestoes = qs("#btn-modal-confirmar-avanco");
    const btnContinuar = qs("#btn-modal-continuar-leitura");

    const batNum = bateria?.numero || Math.ceil(Number(moduloConcluido?.numero || 3) / 3);
    const batTitulo = bateria?.titulo || `Bateria ${String(batNum).padStart(2, '0')}`;
    const numModuloStr = String(moduloConcluido?.numero || 1).padStart(2, '0');

    if (tag) setText(tag, `Bateria ${String(batNum).padStart(2, '0')} Liberada!`);
    if (titulo) setText(titulo, `Hora de Praticar com Questões!`);
    if (desc) {
        desc.innerHTML = `
            Parabéns! Você concluiu o <strong>Módulo ${numModuloStr}</strong> de <strong>${conteudo?.titulo || 'estudos'}</strong>!
            <br><br>
            A cada 3 módulos concluídos, uma nova bateria de questões simuladas é liberada. A <strong>${batTitulo}</strong> já está disponível na área de Questões para testar seus conhecimentos. Deseja praticar agora?
        `;
    }

    if (btnQuestoes) {
        btnQuestoes.innerHTML = `<i class="fa-solid fa-list-check"></i> Ir para as Questões`;
    }

    if (btnContinuar) {
        if (proximoModulo) {
            const numProx = String(proximoModulo.numero).padStart(2, '0');
            btnContinuar.innerHTML = `<i class="fa-solid fa-book-open"></i> Continuar lendo (Módulo ${numProx})`;
        } else {
            btnContinuar.innerHTML = `<i class="fa-solid fa-list"></i> Voltar aos Módulos`;
        }
    }

    modal.style.display = 'flex';
    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.add('modal-modulo-open');
    }
}

/**
 * Função compatível com chamadas legadas
 */
export function abrirModalAvancar(conteudo, modulo) {
    const bat = checkBateriaLiberadaPorModulo(conteudo?.id || activeConteudoId, modulo?.numero || 3);
    abrirModalQuestoesLiberadas(conteudo, modulo, bat || { numero: 1 }, null);
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
