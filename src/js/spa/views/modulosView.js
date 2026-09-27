
import { qs, setText } from '../../utils/dom.js';
import {
    getConteudoById,
    getModulosByConteudoId,
    LOCKED_MODULE_MESSAGE,
    carregarModulosDinamicos,
    salvarModuloAdmin,
    removerModuloAdmin
} from '../../services/conteudosService.js';
import {
    getModuloAtual,
    getModuloAtualCached,
    setModuloAtualCached,
    avancarModulo,
    setPonteiroModulo,
    getModuloUserId
} from '../../services/moduloService.js';
import { checkBateriaLiberadaPorModulo } from '../../services/questoesService.js';
import { createModuleCard, updateModuleCard } from '../../components/moduleCard.js';
import { atualizarXpNoLocalStorage, addXp } from '../../services/gamificationService.js';
import { usuarioGlobal } from '../../services/userService.js';
import { startCooldown } from '../../utils/debounce.js';

let initialized = false;
let toastTimeout = null;
let routerRef = null;
let activeConteudoId = null;
let activeModulo = null;
let proximoModuloPendente = null;
let moduloParaRemover = null;
let uploadedPdfBase64 = null;
let uploadedPdfName = null;

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
            const totalModulos = modulos.length || 1;

            if (numModuloAtual >= totalModulos) {
                showToast(`Você já concluiu todos os módulos de ${conteudo?.titulo || 'estudos'}!`, 'info');
                btnAvancarTopo.style.display = 'none';
                return;
            }

            const proximoNumero = numModuloAtual + 1;
            const proxModulo = (proximoNumero <= totalModulos)
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

                const resultado = await avancarModulo(activeConteudoId, null, totalModulos);
                if (resultado?.exp_total && typeof resultado.exp_total.exp === 'number') {
                    atualizarXpNoLocalStorage({
                        expTotal: resultado.exp_total.exp,
                        lv: resultado.exp_total.lv
                    });
                } else if (resultado?.xp_ganha > 0) {
                    addXp(resultado.xp_ganha);
                }
                const proxModuloNum = Number(resultado.modulo_atual || (numModuloAtual + 1));

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
                startCooldown(btnAvancarTopo, 2, {
                    originalHtml,
                    originalDisabled: false,
                    formatText: (sec) => `Aguarde (${sec}s)`
                });
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
        if (proximoModuloPendente) {
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

    // =========================================================================
    // Admin: Eventos dos Modais de Gerenciamento de Módulos e PDFs
    // =========================================================================

    const btnAdminAdd = qs("#btn-admin-add-modulo");
    if (btnAdminAdd) {
        btnAdminAdd.addEventListener("click", () => {
            abrirModalAdminModulo(null);
        });
    }

    const btnFecharAdminModal = qs("#btn-fechar-modal-admin-modulo");
    const btnCancelarAdminModal = qs("#btn-cancelar-admin-modulo");
    if (btnFecharAdminModal) btnFecharAdminModal.addEventListener("click", fecharModalAdminModulo);
    if (btnCancelarAdminModal) btnCancelarAdminModal.addEventListener("click", fecharModalAdminModulo);

    const modalAdminOverlay = qs("#modal-admin-modulo");
    if (modalAdminOverlay) {
        modalAdminOverlay.addEventListener("click", (e) => {
            if (e.target === modalAdminOverlay) fecharModalAdminModulo();
        });
    }

    const btnCancelarDelete = qs("#btn-cancelar-delete-modulo");
    if (btnCancelarDelete) btnCancelarDelete.addEventListener("click", fecharModalAdminDelete);

    const modalAdminDelete = qs("#modal-admin-delete");
    if (modalAdminDelete) {
        modalAdminDelete.addEventListener("click", (e) => {
            if (e.target === modalAdminDelete) fecharModalAdminDelete();
        });
    }

    const tabUrl = qs("#tab-admin-pdf-url");
    const tabFile = qs("#tab-admin-pdf-file");
    if (tabUrl) tabUrl.addEventListener("click", () => ativarTabPdf('url'));
    if (tabFile) tabFile.addEventListener("click", () => ativarTabPdf('file'));

    const dropzone = qs("#admin-file-dropzone");
    const fileInput = qs("#admin-modulo-pdf-file-input");
    const dropzoneFilename = qs("#admin-dropzone-filename");

    if (dropzone && fileInput) {
        dropzone.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (file) {
                if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                    showToast('Por favor, selecione exclusivamente arquivos no formato PDF.', 'locked', 'fa-solid fa-triangle-exclamation');
                    fileInput.value = '';
                    return;
                }
                uploadedPdfName = file.name;
                if (dropzoneFilename) dropzoneFilename.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;

                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedPdfBase64 = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const btnSalvarModulo = qs("#btn-salvar-admin-modulo");
    if (btnSalvarModulo) {
        btnSalvarModulo.addEventListener("click", async (e) => {
            if (e) e.preventDefault();
            const originalHtml = btnSalvarModulo.innerHTML;

            try {
                btnSalvarModulo.disabled = true;
                btnSalvarModulo.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

                const tituloInput = qs('#admin-modulo-titulo-input')?.value?.trim();
                if (!tituloInput) {
                    showToast('O título do módulo é obrigatório.', 'locked', 'fa-solid fa-triangle-exclamation');
                    return;
                }

                const payload = {
                    id: qs('#admin-modulo-id')?.value || undefined,
                    conteudo_id: activeConteudoId || 'CodigoTransito',
                    titulo: tituloInput,
                    descricao: qs('#admin-modulo-desc-input')?.value?.trim() || '',
                    duracao: qs('#admin-modulo-duracao-input')?.value?.trim() || '20 min',
                    topicos: Number(qs('#admin-modulo-topicos-input')?.value || 4),
                    pdf_url: qs('#admin-modulo-pdf-url-input')?.value?.trim() || undefined,
                    pdf_base64: uploadedPdfBase64 || undefined,
                    pdf_nome: uploadedPdfName || undefined
                };

                await salvarModuloAdmin(payload);
                fecharModalAdminModulo();
                showToast('Módulo / Material em PDF configurado com sucesso!', 'success', 'fa-solid fa-circle-check');
                abrirModulos(activeConteudoId);
            } catch (err) {
                showToast(err.message || 'Erro ao salvar módulo.', 'locked', 'fa-solid fa-triangle-exclamation');
            } finally {
                btnSalvarModulo.disabled = false;
                btnSalvarModulo.innerHTML = originalHtml;
            }
        });
    }

    const btnConfirmarDelete = qs("#btn-confirmar-delete-modulo");
    if (btnConfirmarDelete) {
        btnConfirmarDelete.addEventListener("click", async () => {
            if (!moduloParaRemover) return;
            const originalHtml = btnConfirmarDelete.innerHTML;

            try {
                btnConfirmarDelete.disabled = true;
                btnConfirmarDelete.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Removendo...';

                await removerModuloAdmin(moduloParaRemover.id, activeConteudoId);
                fecharModalAdminDelete();
                showToast('Módulo / PDF removido com sucesso!', 'info', 'fa-solid fa-trash-can');
                abrirModulos(activeConteudoId);
            } catch (err) {
                showToast(err.message || 'Erro ao remover módulo.', 'locked', 'fa-solid fa-triangle-exclamation');
            } finally {
                btnConfirmarDelete.disabled = false;
                btnConfirmarDelete.innerHTML = originalHtml;
            }
        });
    }

    const btnAdminTrocarPdf = qs("#btn-admin-trocar-pdf");
    if (btnAdminTrocarPdf) {
        btnAdminTrocarPdf.addEventListener("click", () => {
            if (activeModulo) {
                abrirModalAdminModulo(activeModulo);
            }
        });
    }
}

function abrirModalAdminModulo(modulo = null) {
    const modal = qs('#modal-admin-modulo');
    if (!modal) return;

    const inputId = qs('#admin-modulo-id');
    const inputConteudoId = qs('#admin-modulo-conteudo-id');
    const inputTitulo = qs('#admin-modulo-titulo-input');
    const inputDesc = qs('#admin-modulo-desc-input');
    const inputDuracao = qs('#admin-modulo-duracao-input');
    const inputTopicos = qs('#admin-modulo-topicos-input');
    const inputPdfUrl = qs('#admin-modulo-pdf-url-input');
    const inputPdfFile = qs('#admin-modulo-pdf-file-input');
    const titleEl = qs('#modal-admin-modulo-titulo');
    const dropzoneFilename = qs('#admin-dropzone-filename');

    uploadedPdfBase64 = null;
    uploadedPdfName = null;
    if (inputPdfFile) inputPdfFile.value = '';

    if (inputConteudoId) inputConteudoId.value = activeConteudoId || 'CodigoTransito';

    if (modulo) {
        if (titleEl) titleEl.textContent = 'Editar Módulo / Substituir PDF';
        if (inputId) inputId.value = modulo.id || '';
        if (inputTitulo) inputTitulo.value = modulo.titulo || '';
        if (inputDesc) inputDesc.value = modulo.descricao || '';
        if (inputDuracao) inputDuracao.value = modulo.duracao || '20 min';
        if (inputTopicos) inputTopicos.value = modulo.topicos || 4;
        if (inputPdfUrl) inputPdfUrl.value = modulo.pdfUrl || modulo.pdfNome || '';
        if (dropzoneFilename) dropzoneFilename.textContent = modulo.pdfNome || 'Clique para selecionar um novo arquivo PDF';
    } else {
        if (titleEl) titleEl.textContent = 'Adicionar Novo Módulo / PDF';
        if (inputId) inputId.value = '';
        if (inputTitulo) inputTitulo.value = '';
        if (inputDesc) inputDesc.value = '';
        if (inputDuracao) inputDuracao.value = '20 min';
        if (inputTopicos) inputTopicos.value = 4;
        if (inputPdfUrl) inputPdfUrl.value = '';
        if (dropzoneFilename) dropzoneFilename.textContent = 'Clique para selecionar um arquivo PDF';
    }

    ativarTabPdf('url');
    modal.style.display = 'flex';
}

function fecharModalAdminModulo() {
    const modal = qs('#modal-admin-modulo');
    if (modal) modal.style.display = 'none';
}

function abrirModalAdminDelete(modulo) {
    if (!modulo) return;
    moduloParaRemover = modulo;
    const modal = qs('#modal-admin-delete');
    const alvoEl = qs('#delete-modulo-nome-alvo');
    if (alvoEl) alvoEl.textContent = `"${modulo.titulo || 'Módulo ' + (modulo.numero || '')}"`;
    if (modal) modal.style.display = 'flex';
}

function fecharModalAdminDelete() {
    moduloParaRemover = null;
    const modal = qs('#modal-admin-delete');
    if (modal) modal.style.display = 'none';
}

function ativarTabPdf(tab) {
    const tabUrl = qs('#tab-admin-pdf-url');
    const tabFile = qs('#tab-admin-pdf-file');
    const paneUrl = qs('#pane-admin-pdf-url');
    const paneFile = qs('#pane-admin-pdf-file');

    if (tab === 'url') {
        if (tabUrl) tabUrl.classList.add('active');
        if (tabFile) tabFile.classList.remove('active');
        if (paneUrl) paneUrl.style.display = 'block';
        if (paneFile) paneFile.style.display = 'none';
    } else {
        if (tabUrl) tabUrl.classList.remove('active');
        if (tabFile) tabFile.classList.add('active');
        if (paneUrl) paneUrl.style.display = 'none';
        if (paneFile) paneFile.style.display = 'block';
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

async function alterarPonteiroModulo(targetNum) {
    if (!activeConteudoId) return;
    try {
        const num = Math.max(1, Number(targetNum || 1));
        const activeUserId = getModuloUserId();
        const res = await setPonteiroModulo(activeConteudoId, num, activeUserId);
        showToast(res.message || `Ponteiro do Módulo definido para ${num}!`, 'info', 'fa-solid fa-location-crosshairs');
        setModuloAtualCached(activeConteudoId, num, activeUserId);
        atualizarCardsModuloUI(activeConteudoId, num);

        const selectAdminPointer = qs("#select-admin-pointer");
        if (selectAdminPointer) {
            selectAdminPointer.value = String(num);
        }
    } catch (err) {
        showToast(err.message || 'Erro ao definir ponteiro.', 'locked', 'fa-solid fa-triangle-exclamation');
    }
}

export function atualizarCardsModuloUI(conteudoId, moduloAtual) {
    if (!conteudoId) return;
    const modulos = getModulosByConteudoId(conteudoId, moduloAtual);
    const modulesListContainer = qs("#modules-list");

    const total = modulos.length;
    const bloqueados = modulos.filter(m => m.bloqueado).length;
    const liberados = total - bloqueados;
    const nivelAtual = Math.max(1, Number(moduloAtual || 1));
    const concluidos = nivelAtual > total ? total : modulos.filter(m => Number(m.numero) < nivelAtual).length;
    const pctProgresso = total > 0 ? Math.min(100, Math.round((concluidos / total) * 100)) : 0;

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
                    onLockedClick: () => showToast(LOCKED_MODULE_MESSAGE, 'locked', 'fa-solid fa-lock'),
                    onAdminEdit: (m) => abrirModalAdminModulo(m),
                    onAdminDelete: (m) => abrirModalAdminDelete(m),
                    onSetPointer: (m) => alterarPonteiroModulo(m.numero)
                });
            }
        });
    }

    const selectAdminPointer = qs("#select-admin-pointer");
    if (selectAdminPointer && moduloAtual) {
        selectAdminPointer.value = String(moduloAtual);
    }
}

export function abrirModulos(conteudoId) {
    if (!conteudoId) return;
    activeConteudoId = conteudoId;
    usuarioGlobal.updateUI();

    const btnAdminAdd = qs("#btn-admin-add-modulo");
    if (btnAdminAdd) {
        btnAdminAdd.style.display = usuarioGlobal.isAdmin ? 'inline-flex' : 'none';
    }

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

    const adminPointerControl = qs("#admin-pointer-control");
    const selectAdminPointer = qs("#select-admin-pointer");
    if (adminPointerControl && selectAdminPointer) {
        if (usuarioGlobal.isAdmin) {
            adminPointerControl.style.display = 'inline-flex';
            selectAdminPointer.innerHTML = '';
            modulos.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.numero;
                opt.textContent = `Módulo ${String(m.numero).padStart(2, '0')}: ${m.titulo}`;
                if (Number(m.numero) === Number(moduloAtual)) {
                    opt.selected = true;
                }
                selectAdminPointer.appendChild(opt);
            });
            selectAdminPointer.onchange = async (e) => {
                const targetNum = Number(e.target.value);
                await alterarPonteiroModulo(targetNum);
            };
        } else {
            adminPointerControl.style.display = 'none';
        }
    }

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
                onLockedClick: () => showToast(LOCKED_MODULE_MESSAGE, 'locked', 'fa-solid fa-lock'),
                onAdminEdit: (mod) => abrirModalAdminModulo(mod),
                onAdminDelete: (mod) => abrirModalAdminDelete(mod),
                onSetPointer: (mod) => alterarPonteiroModulo(mod.numero)
            });
            if (card) {
                modulesListContainer.appendChild(card);
            }
        });

        atualizarCardsModuloUI(conteudoId, moduloAtual);
    }

    // Sincroniza módulos dinâmicos da API em segundo plano
    carregarModulosDinamicos(conteudoId).then(() => {
        if (activeConteudoId === conteudoId) {
            const modulosAtualizados = getModulosByConteudoId(conteudoId, moduloAtual);
            if (modulesListContainer) {
                modulesListContainer.innerHTML = '';
                modulosAtualizados.forEach((modulo) => {
                    const card = createModuleCard(modulo, {
                        onRead: (mod) => abrirLeituraPdf(conteudoId, mod),
                        onLockedClick: () => showToast(LOCKED_MODULE_MESSAGE, 'locked', 'fa-solid fa-lock'),
                        onAdminEdit: (mod) => abrirModalAdminModulo(mod),
                        onAdminDelete: (mod) => abrirModalAdminDelete(mod),
                        onSetPointer: (mod) => alterarPonteiroModulo(mod.numero)
                    });
                    if (card) {
                        modulesListContainer.appendChild(card);
                    }
                });
                atualizarCardsModuloUI(conteudoId, moduloAtual);
            }

            if (selectAdminPointer) {
                selectAdminPointer.innerHTML = '';
                modulosAtualizados.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.numero;
                    opt.textContent = `Módulo ${String(m.numero).padStart(2, '0')}: ${m.titulo}`;
                    if (Number(m.numero) === Number(moduloAtual)) {
                        opt.selected = true;
                    }
                    selectAdminPointer.appendChild(opt);
                });
            }
        }
    }).catch(() => {});

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
    const totalModulos = modulosConteudo.length || 1;
    const numModuloAtual = Number(modulo.numero || 1);
    const isUltimoModulo = numModuloAtual >= totalModulos;

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

    const btnTrocarPdf = qs('#btn-admin-trocar-pdf');
    if (btnTrocarPdf) {
        btnTrocarPdf.style.display = usuarioGlobal.isAdmin ? 'inline-flex' : 'none';
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
