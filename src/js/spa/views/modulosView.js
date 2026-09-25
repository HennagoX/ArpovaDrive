
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
    avancarModulo,
    MAX_MODULO
} from '../../services/moduloService.js';
import { checkBateriaLiberadaPorModulo } from '../../services/questoesService.js';
import { createModuleCard, updateModuleCard } from '../../components/moduleCard.js';
import { atualizarXpNoLocalStorage, addXp } from '../../services/gamificationService.js';

let initialized = false;
let toastTimeout = null;
let routerRef = null;
let activeConteudoId = null;
let activeModulo = null;
let proximoModuloPendente = null;

export function initModulosView(router) {
    routerRef = router;
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

    const btnAvancarTopo = qs("#btn-avancar-modulo-topo");
    if (btnAvancarTopo) {
        btnAvancarTopo.addEventListener("click", async () => {
            if (!activeConteudoId || !activeModulo) return;

            const numModuloAtual = Number(activeModulo.numero || 1);
            const conteudo = getConteudoById(activeConteudoId);
            const modulos = getModulosByConteudoId(activeConteudoId);
            const totalModulos = modulos.length || MAX_MODULO;

            if (numModuloAtual >= MAX_MODULO || numModuloAtual >= totalModulos) {
                showToast(`Você já concluiu todos os módulos de ${conteudo?.titulo || 'estudos'}!`, 'info');
                btnAvancarTopo.style.display = 'none';
                return;
            }

            const proximoNumero = numModuloAtual + 1;
            const proxModulo = (proximoNumero <= MAX_MODULO && proximoNumero <= totalModulos)
                ? (modulos.find(m => Number(m.numero) === proximoNumero) || null)
                : null;

            const progressoAtual = getModuloAtualCached(activeConteudoId);

            if (numModuloAtual < progressoAtual) {
                if (proxModulo) {
                    abrirLeituraPdf(activeConteudoId, proxModulo);
                } else {
                    router.navigateTo("modulos", { conteudoId: activeConteudoId });
                }
                return;
            }

            const originalHtml = btnAvancarTopo.innerHTML;
            try {
                btnAvancarTopo.disabled = true;
                btnAvancarTopo.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Avançando...';

                const resultado = await avancarModulo(activeConteudoId);
                if (resultado?.exp_total && typeof resultado.exp_total.exp === 'number') {
                    atualizarXpNoLocalStorage({
                        expTotal: resultado.exp_total.exp,
                        lv: resultado.exp_total.lv
                    });
                } else if (resultado?.xp_ganha > 0) {
                    addXp(resultado.xp_ganha);
                }
                const proxModuloNum = Math.min(MAX_MODULO, Number(resultado.modulo_atual || Math.min(MAX_MODULO, numModuloAtual + 1)));

                atualizarCardsModuloUI(activeConteudoId, proxModuloNum);

                const proximoModuloCarregar = proxModulo
                    || modulos.find(m => Number(m.numero) === proxModuloNum)
                    || null;

                const bateriaLiberada = checkBateriaLiberadaPorModulo(activeConteudoId, numModuloAtual);

                const xpGanha = Number(resultado.xp_ganha || 0);
                const xpTexto = xpGanha > 0 ? ` +${xpGanha} XP` : '';

                const realmenteGanhouModulo = proxModuloNum > progressoAtual || xpGanha > 0;

                if (bateriaLiberada) {
                    if (realmenteGanhouModulo) {
                        showToast(
                            `Parabéns! Módulo ${String(numModuloAtual).padStart(2, '0')} concluído!${xpTexto}`,
                            'success',
                            'fa-solid fa-circle-check'
                        );
                    }

                    proximoModuloPendente = proximoModuloCarregar || null;

                    abrirModalQuestoesLiberadas(conteudo, activeModulo, bateriaLiberada, proximoModuloCarregar);
                } else {
                    if (proximoModuloCarregar) {
                        if (realmenteGanhouModulo) {
                            showToast(
                                `Parabéns! Módulo concluído. Você avançou para o Módulo ${String(proximoModuloCarregar.numero).padStart(2, '0')}!${xpTexto}`,
                                'success',
                                'fa-solid fa-circle-check'
                            );
                        }
                        abrirLeituraPdf(activeConteudoId, proximoModuloCarregar);
                    } else {
                        showToast(`Você concluiu todos os módulos de ${conteudo?.titulo || 'estudos'}!${xpTexto}`, 'success');
                        btnAvancarTopo.style.display = 'none';
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

    const btnExpandPdf = qs("#btn-toggle-expand-pdf");
    if (btnExpandPdf) {
        btnExpandPdf.addEventListener("click", () => {
            toggleFullscreenReader();
        });
    }

    const btnFecharModal = qs("#btn-fechar-modal-modulo");
    const btnContinuarLendo = qs("#btn-modal-continuar-leitura");
    const modalOverlay = qs("#modal-avancar-modulo");
    const btnIrQuestoes = qs("#btn-modal-confirmar-avanco");

    const fecharECarregarProximo = () => {
        fecharModalAvancar();
        if (proximoModuloPendente && Number(proximoModuloPendente.numero) <= MAX_MODULO) {
            const nextMod = proximoModuloPendente;
            proximoModuloPendente = null;
            abrirLeituraPdf(activeConteudoId, nextMod);
        } else if (activeConteudoId && router) {
            proximoModuloPendente = null;
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

export function aplicarTemaModal(temaCor = 'green') {
    const modal = qs("#modal-avancar-modulo");
    if (modal) {
        const themeClasses = Array.from(modal.classList).filter(c => c.startsWith('modulos-theme-'));
        themeClasses.forEach(c => modal.classList.remove(c));
        modal.classList.add(`modulos-theme-${temaCor}`);
    }
}

export function atualizarCardsModuloUI(conteudoId, moduloAtual) {
    if (!conteudoId) return;
    const modulos = getModulosByConteudoId(conteudoId, moduloAtual);
    const modulesListContainer = qs("#modules-list");

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

    const moduloAtual = getModuloAtualCached(conteudoId);
    const modulos = getModulosByConteudoId(conteudoId, moduloAtual);

    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');
    if (titleEl) setText(titleEl, conteudo.titulo);
    if (subtitleEl) setText(subtitleEl, `Trilha de estudos de ${conteudo.titulo}`);

    const breadcrumbTitle = qs("#modulos-breadcrumb-title");
    if (breadcrumbTitle) setText(breadcrumbTitle, conteudo.titulo);

    const temaCor = conteudo.cor || 'green';
    const viewModulos = qs("#view-modulos");
    if (viewModulos) {
        const themeClasses = Array.from(viewModulos.classList).filter(c => c.startsWith('modulos-theme-'));
        themeClasses.forEach(c => viewModulos.classList.remove(c));
        viewModulos.classList.add(`modulos-theme-${temaCor}`);
    }
    aplicarTemaModal(temaCor);

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

    const modulesListContainer = qs("#modules-list");
    const isSameConteudo = modulesListContainer &&
        modulesListContainer.dataset.conteudoId === conteudoId &&
        modulesListContainer.children.length > 0;

    if (isSameConteudo) {
        atualizarCardsModuloUI(conteudoId, moduloAtual);
    } else if (modulesListContainer) {
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

    getModuloAtual(conteudoId).then((progresso) => {
        if (progresso && progresso.mudou && activeConteudoId === conteudoId) {
            const novoNum = Math.max(1, Number(progresso.modulo_atual || 1));
            atualizarCardsModuloUI(conteudoId, novoNum);
        }
    }).catch((err) => {
        console.warn('[ModulosView] Sincronização em segundo plano:', err.message);
    });
}

export function abrirLeituraPdf(conteudoId, moduloOrNumero) {
    if (!conteudoId) return;
    activeConteudoId = conteudoId;

    const conteudo = getConteudoById(conteudoId);
    if (!conteudo) return;

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

    if (routerRef && routerRef.currentRoute !== 'leitura-pdf') {
        routerRef.navigateTo('leitura-pdf', {
            conteudoId,
            moduloNumero: modulo.numero,
            modulo
        });
    }

    const temaCor = conteudo.cor || 'green';
    const viewLeitura = qs("#view-leitura-pdf");
    if (viewLeitura) {
        const themeClasses = Array.from(viewLeitura.classList).filter(c => c.startsWith('modulos-theme-'));
        themeClasses.forEach(c => viewLeitura.classList.remove(c));
        viewLeitura.classList.add(`modulos-theme-${temaCor}`);
    }
    aplicarTemaModal(temaCor);

    const btnAvancarTopo = qs("#btn-avancar-modulo-topo");
    const modulosConteudo = getModulosByConteudoId(conteudoId);
    const totalModulos = modulosConteudo.length || MAX_MODULO;
    const numModuloAtual = Number(modulo.numero || 1);
    const isUltimoModulo = numModuloAtual >= MAX_MODULO || numModuloAtual >= totalModulos;

    if (btnAvancarTopo) {
        btnAvancarTopo.style.display = isUltimoModulo ? 'none' : 'inline-flex';
        const progressoAtual = getModuloAtualCached(conteudoId);
        if (numModuloAtual < progressoAtual) {
            btnAvancarTopo.innerHTML = '<i class="fa-solid fa-forward-step"></i> Próximo Módulo';
            btnAvancarTopo.title = "Ir para o próximo módulo";
        } else {
            btnAvancarTopo.innerHTML = '<i class="fa-solid fa-forward-step"></i> Avançar Módulo';
            btnAvancarTopo.title = "Concluir leitura e desbloquear o próximo módulo";
        }
    }

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

    const pdfUrl = modulo.pdfUrl || '';
    if (btnExternal) {
        btnExternal.href = pdfUrl || '#';
        btnExternal.style.display = pdfUrl ? 'inline-flex' : 'none';
    }

    if (iframePdf) {
        iframePdf.src = pdfUrl;
    }

}

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
        if (proximoModulo && Number(proximoModulo.numero) <= MAX_MODULO) {
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

export function abrirModalAvancar(conteudo, modulo) {
    const bat = checkBateriaLiberadaPorModulo(conteudo?.id || activeConteudoId, modulo?.numero || 3);
    abrirModalQuestoesLiberadas(conteudo, modulo, bat || { numero: 1 }, null);
}

export function fecharModalAvancar() {
    const modal = qs("#modal-avancar-modulo");
    if (modal) {
        modal.style.display = 'none';
    }
    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.remove('modal-modulo-open');
    }
}

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
