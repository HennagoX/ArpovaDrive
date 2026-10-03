import { qs, qsa, setText } from '../../utils/dom.js';
import { usuarioGlobal } from '../../services/userService.js';
import {
    getSimuladoResultadosAPI,
    criarSimuladoAdminAPI,
    listarSimuladosCustomizadosAPI,
    removerSimuladoAdminAPI
} from '../../services/questoesService.js';
import { showToast } from './modulosView.js';

let initialized = false;
let routerRef = null;

const MATERIA_THEMES = {
    Geral: {
        categoriaKey: 'geral',
        categoriaNome: 'SIMULADO OFICIAL DETRAN',
        cor: 'orange',
        corBtn: '',
        icone: 'fa-solid fa-graduation-cap'
    },
    CodigoTransito: {
        categoriaKey: 'legislacao',
        categoriaNome: 'LEGISLAÇÃO',
        cor: 'green',
        corBtn: 'verde-card',
        icone: 'fa-solid fa-scale-balanced'
    },
    PlacasTransito: {
        categoriaKey: 'placas',
        categoriaNome: 'SINALIZAÇÃO',
        cor: 'blue',
        corBtn: '',
        icone: 'fa-solid fa-road'
    },
    PlacaTransito: {
        categoriaKey: 'placas',
        categoriaNome: 'SINALIZAÇÃO',
        cor: 'blue',
        corBtn: '',
        icone: 'fa-solid fa-road'
    },
    DirecaoDefensiva: {
        categoriaKey: 'seguranca',
        categoriaNome: 'SEGURANÇA',
        cor: 'yellow',
        corBtn: 'amarelo-card',
        icone: 'fa-solid fa-car-burst'
    },
    DirecaoOfensiva: {
        categoriaKey: 'seguranca',
        categoriaNome: 'SEGURANÇA',
        cor: 'yellow',
        corBtn: 'amarelo-card',
        icone: 'fa-solid fa-car-burst'
    },
    PrimeirosSocorros: {
        categoriaKey: 'saude',
        categoriaNome: 'PRIMEIROS SOCORROS',
        cor: 'red',
        corBtn: 'vermelho-card',
        icone: 'fa-solid fa-kit-medical'
    },
    MeioAmbiente: {
        categoriaKey: 'ambiente',
        categoriaNome: 'MEIO AMBIENTE',
        cor: 'purple',
        corBtn: 'roxo-card',
        icone: 'fa-solid fa-leaf'
    }
};

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function abrirModalAdminSimulado() {
    const modal = qs('#modal-admin-simulado');
    if (!modal) return;

    const tituloInput = qs('#admin-simulado-titulo-input');
    const materiaSelect = qs('#admin-simulado-materia-input');
    const tempoInput = qs('#admin-simulado-tempo-input');
    const descInput = qs('#admin-simulado-desc-input');
    const totalInput = qs('#admin-simulado-total-input');
    const metaInput = qs('#admin-simulado-meta-input');

    if (tituloInput) tituloInput.value = '';
    if (materiaSelect) materiaSelect.value = 'Geral';
    if (tempoInput) tempoInput.value = '40';
    if (descInput) descInput.value = '';
    if (totalInput) totalInput.value = '30';
    if (metaInput) metaInput.value = '20';

    modal.style.display = 'flex';
    tituloInput?.focus();
}

export function fecharModalAdminSimulado() {
    const modal = qs('#modal-admin-simulado');
    if (modal) modal.style.display = 'none';
}

export function filtrarSimulados() {
    const searchInput = qs("#search-simulado");
    const cards = qsa(".simulado-card");
    const activeFilter = qs(".filter-simulado.active");
    const contador = qs("#contador-simulado");

    const texto = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const categoriaSelecionada = activeFilter ? activeFilter.dataset.category : "todos";

    let quantidade = 0;

    cards.forEach(card => {
        const conteudo = card.innerText.toLowerCase();
        const categoria = card.dataset.category;

        const correspondeTexto = !texto || conteudo.includes(texto);
        const correspondeCategoria = categoriaSelecionada === "todos" || categoria === categoriaSelecionada;

        if (correspondeTexto && correspondeCategoria) {
            card.style.display = "flex";
            quantidade++;
        } else {
            card.style.display = "none";
        }
    });

    if (contador) {
        contador.textContent = `${quantidade} ${quantidade === 1 ? 'simulado' : 'simulados'}`;
    }
}

export async function atualizarProgressoSimulados() {
    const cards = qsa(".simulado-card");
    const activeUserId = usuarioGlobal.id_usuario || usuarioGlobal.id;

    let resultados = [];
    try {
        const resData = await getSimuladoResultadosAPI(activeUserId);
        if (resData && Array.isArray(resData.resultados)) {
            resultados = resData.resultados;
        }
    } catch {}

    cards.forEach((card) => {
        const materiaId = card.dataset.id || 'Geral';
        const isGeral = materiaId === 'Geral';

        const resultadosMateria = resultados.filter(r => {
            if (isGeral) return String(r.materia || '').toLowerCase() === 'geral';
            const rNorm = String(r.materia || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const mNorm = String(materiaId).toLowerCase().replace(/[^a-z0-9]/g, '');
            return rNorm === mNorm || rNorm.includes(mNorm) || mNorm.includes(rNorm);
        });

        let melhor = null;
        if (resultadosMateria.length > 0) {
            melhor = resultadosMateria.reduce((best, cur) => (Number(cur.acertos || 0) > Number(best.acertos || 0) ? cur : best), resultadosMateria[0]);
        }

        const pct = melhor ? Math.min(100, Math.max(0, Math.round(Number(melhor.porcentagem || 0)))) : 0;
        const aprovado = melhor ? Boolean(melhor.aprovado || pct >= 67 || Number(melhor.acertos) >= 20) : false;

        const pctSpan = card.querySelector(".simulado-progress-pct");
        if (pctSpan) {
            setText(pctSpan, `${pct}%`);
        }

        const fillEl = card.querySelector(".questoes-progress-fill");
        if (fillEl) {
            fillEl.style.width = `${pct}%`;
        }

        const badgeEl = card.querySelector(".questoes-badge-unlocked");
        if (badgeEl && !card.classList.contains('simulado-custom-card')) {
            if (aprovado) {
                badgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Aprovado (${pct}%)`;
                badgeEl.style.background = 'rgba(22, 163, 74, 0.15)';
                badgeEl.style.color = '#16a34a';
                badgeEl.style.borderColor = 'rgba(22, 163, 74, 0.3)';
            } else if (resultadosMateria.length > 0) {
                badgeEl.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> Recorde: ${pct}%`;
                badgeEl.style.background = 'rgba(245, 158, 11, 0.15)';
                badgeEl.style.color = '#d97706';
                badgeEl.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            } else if (isGeral) {
                badgeEl.innerHTML = `<i class="fa-solid fa-trophy"></i> +600 XP Fixos`;
                badgeEl.style.background = 'rgba(245, 158, 11, 0.15)';
                badgeEl.style.color = '#d97706';
                badgeEl.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            } else {
                badgeEl.innerHTML = `<i class="fa-solid fa-bolt"></i> Meta 67%`;
                badgeEl.style.background = '';
                badgeEl.style.color = '';
                badgeEl.style.borderColor = '';
            }
        }
    });
}

export async function carregarSimuladosCustomizados() {
    const grid = qs('#simulado-grid');
    if (!grid) return;

    qsa('.simulado-custom-card').forEach(el => el.remove());

    try {
        const customSimulados = await listarSimuladosCustomizadosAPI();
        if (!Array.isArray(customSimulados) || customSimulados.length === 0) return;

        customSimulados.forEach(sim => {
            const theme = MATERIA_THEMES[sim.materia] || MATERIA_THEMES.Geral;
            const total = Number(sim.total_questoes) || 30;
            const meta = Number(sim.meta_acertos) || 20;
            const duracao = Number(sim.duracao_minutos) || 40;
            const metaPct = Math.round((meta / total) * 100);

            const card = document.createElement('article');
            card.className = 'questoes-card simulado-card simulado-custom-card';
            card.dataset.category = theme.categoriaKey;
            card.dataset.id = sim.materia || 'Geral';
            card.dataset.simuladoId = sim.id;
            card.style.cursor = 'pointer';

            card.innerHTML = `
                <div class="questoes-card-header">
                    <div class="questoes-emblem ${theme.cor}">
                        <i class="${theme.icone}"></i>
                    </div>
                    <span class="questoes-badge-unlocked" style="background: rgba(14, 165, 233, 0.15); color: #0284c7; border-color: rgba(14, 165, 233, 0.3);">
                        <i class="fa-solid fa-user-shield"></i> Customizado
                    </span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <span class="questoes-category-pill">${theme.categoriaNome}</span>
                    <span class="simulado-tag-custom"><i class="fa-solid fa-pen-ruler"></i> Instrutor</span>
                </div>
                <h3 class="questoes-card-title">${escapeHtml(sim.titulo)}</h3>
                <p class="questoes-card-desc">${escapeHtml(sim.descricao || 'Simulado elaborado para reforço e avaliação prática dos alunos.')}</p>
                <div class="questoes-metrics-grid">
                    <div class="metric-box">
                        <i class="fa-solid fa-list-check"></i>
                        <strong>${total}</strong>
                        <span>Questões</span>
                    </div>
                    <div class="metric-box">
                        <i class="fa-solid fa-bullseye"></i>
                        <strong>${metaPct}%</strong>
                        <span>${meta} Acertos</span>
                    </div>
                    <div class="metric-box">
                        <i class="fa-solid fa-stopwatch"></i>
                        <strong>${duracao} min</strong>
                        <span>Duração</span>
                    </div>
                </div>
                <div class="questoes-progress-meta">
                    <span>Melhor Desempenho</span>
                    <span class="simulado-progress-pct">0%</span>
                </div>
                <div class="questoes-progress-bar">
                    <div class="questoes-progress-fill ${theme.cor}" style="width: 0%;"></div>
                </div>
                <button type="button" class="btn-praticar-questoes btn-iniciar-simulado ${theme.corBtn}" data-id="${sim.materia || 'Geral'}">
                    <i class="fa-solid fa-circle-play"></i> Iniciar Simulado
                </button>
                ${usuarioGlobal.isAdmin ? `
                <button type="button" class="btn-admin-del-simulado" data-id="${sim.id}" title="Excluir este simulado">
                    <i class="fa-solid fa-trash-can"></i> Excluir Simulado
                </button>` : ''}
            `;

            const delBtn = card.querySelector('.btn-admin-del-simulado');
            if (delBtn) {
                delBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!window.confirm(`Deseja realmente excluir o simulado "${sim.titulo}"?`)) return;

                    try {
                        delBtn.disabled = true;
                        delBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Excluindo...';
                        await removerSimuladoAdminAPI(sim.id);
                        showToast('Simulado removido com sucesso!', 'info', 'fa-solid fa-trash-can');
                        card.remove();
                        filtrarSimulados();
                    } catch (err) {
                        showToast(err.message || 'Erro ao excluir simulado.', 'locked', 'fa-solid fa-triangle-exclamation');
                        delBtn.disabled = false;
                        delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Excluir Simulado';
                    }
                });
            }

            const startBtn = card.querySelector('.btn-iniciar-simulado');
            if (startBtn) {
                startBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const materiaId = sim.materia || 'Geral';
                    if (routerRef) {
                        routerRef.navigateTo('simulado-resolucao', { materiaId });
                    }
                });
            }

            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-admin-del-simulado') || e.target.closest('.btn-iniciar-simulado')) return;
                const materiaId = sim.materia || 'Geral';
                if (routerRef) {
                    routerRef.navigateTo('simulado-resolucao', { materiaId });
                }
            });

            grid.appendChild(card);
        });

        filtrarSimulados();
        atualizarProgressoSimulados();
    } catch {}
}

export function initSimuladoView(router) {
    routerRef = router;
    if (initialized) return;
    initialized = true;

    const searchInput = qs("#search-simulado");
    const filters = qsa(".filter-simulado");
    const cards = qsa(".simulado-card");
    const actionBtns = qsa(".btn-iniciar-simulado");

    if (searchInput) {
        searchInput.addEventListener("input", filtrarSimulados);
    }

    filters.forEach(filter => {
        filter.addEventListener("click", () => {
            filters.forEach(f => f.classList.remove("active"));
            filter.classList.add("active");
            filtrarSimulados();
        });
    });

    actionBtns?.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const materiaId = btn.dataset.id || 'Geral';
            if (router) {
                router.navigateTo('simulado-resolucao', { materiaId });
            }
        });
    });

    cards.forEach((card) => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-iniciar-simulado')) return;
            const materiaId = card.dataset.id || 'Geral';
            if (router) {
                router.navigateTo('simulado-resolucao', { materiaId });
            }
        });
    });

    // =========================================================================
    // Admin: Eventos de Criação e Gerenciamento de Simulados
    // =========================================================================
    const btnAdminAdd = qs('#btn-admin-add-simulado');
    if (btnAdminAdd) {
        btnAdminAdd.addEventListener('click', () => {
            abrirModalAdminSimulado();
        });
    }

    const btnFechar = qs('#btn-fechar-modal-admin-simulado');
    if (btnFechar) {
        btnFechar.addEventListener('click', () => {
            fecharModalAdminSimulado();
        });
    }

    const btnCancelar = qs('#btn-cancelar-admin-simulado');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            fecharModalAdminSimulado();
        });
    }

    const modal = qs('#modal-admin-simulado');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharModalAdminSimulado();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            fecharModalAdminSimulado();
        }
    });

    const btnSalvar = qs('#btn-salvar-admin-simulado');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', async () => {
            const tituloInput = qs('#admin-simulado-titulo-input');
            const materiaSelect = qs('#admin-simulado-materia-input');
            const tempoInput = qs('#admin-simulado-tempo-input');
            const descInput = qs('#admin-simulado-desc-input');
            const totalInput = qs('#admin-simulado-total-input');
            const metaInput = qs('#admin-simulado-meta-input');

            const titulo = tituloInput?.value?.trim() || '';
            if (!titulo) {
                showToast('O título do simulado é obrigatório.', 'locked', 'fa-solid fa-triangle-exclamation');
                tituloInput?.focus();
                return;
            }

            const dados = {
                titulo,
                materia: materiaSelect?.value || 'Geral',
                duracao_minutos: Number(tempoInput?.value || 40),
                descricao: descInput?.value?.trim() || '',
                total_questoes: Number(totalInput?.value || 30),
                meta_acertos: Number(metaInput?.value || 20)
            };

            const originalHtml = btnSalvar.innerHTML;
            try {
                btnSalvar.disabled = true;
                btnSalvar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

                await criarSimuladoAdminAPI(dados);
                showToast('Simulado criado com sucesso!', 'success', 'fa-solid fa-circle-check');
                fecharModalAdminSimulado();
                await carregarSimuladosCustomizados();
            } catch (err) {
                showToast(err.message || 'Erro ao criar simulado.', 'locked', 'fa-solid fa-triangle-exclamation');
            } finally {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = originalHtml;
            }
        });
    }
}

export function renderSimulado() {
    usuarioGlobal.updateUI();

    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');

    if (titleEl) setText(titleEl, 'Simulados DETRAN');
    if (subtitleEl) setText(subtitleEl, 'Provas oficiais de 30 questões cronometradas. Meta de aprovação: 67% (20 acertos).');

    const btnAdminAdd = qs('#btn-admin-add-simulado');
    if (btnAdminAdd) {
        btnAdminAdd.style.display = usuarioGlobal.isAdmin ? 'inline-flex' : 'none';
    }

    carregarSimuladosCustomizados();
    atualizarProgressoSimulados();
}
