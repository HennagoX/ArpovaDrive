/**
 * AprovaDrive - Admin History View
 * Gerencia os painéis e modais de histórico do Administrador:
 * 1. Histórico de alterações e versões de PDFs / Módulos (com reversão e exclusão)
 * 2. Histórico e gerenciamento de questões customizadas criadas pelo admin
 */

import { qs, qsa, setText } from '../../utils/dom.js';
import {
    obterHistoricoPdfAdmin,
    reverterHistoricoPdfAdmin,
    excluirItemHistoricoPdfAdmin,
    limparHistoricoPdfAdmin,
    listarQuestoesCustomizadasAPI,
    removerQuestaoAdminAPI
} from '../../services/adminService.js';
import { showToast } from './modulosView.js';

let initialized = false;
let routerRef = null;
let listaHistoricoCache = [];
let listaQuestoesCache = [];

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================================
// 1. Histórico de Módulos e PDFs (Auditoria, Reversão e Exclusão)
// ============================================================================

export async function abrirModalHistoricoPdf(conteudoId = null) {
    const modal = qs('#modal-admin-historico-pdf');
    if (!modal) return;

    const selectHistConteudo = qs("#select-historico-conteudo");
    if (selectHistConteudo) {
        selectHistConteudo.value = conteudoId || '';
    }

    const inputBuscaHist = qs("#input-busca-historico");
    if (inputBuscaHist) inputBuscaHist.value = '';

    modal.style.display = 'flex';
    await carregarERenderizarHistorico(conteudoId || null);
}

export function fecharModalHistoricoPdf() {
    const modal = qs('#modal-admin-historico-pdf');
    if (modal) modal.style.display = 'none';
}

export async function carregarERenderizarHistorico(conteudoId = null) {
    const container = qs('#historico-timeline-list');
    if (!container) return;

    container.innerHTML = `
        <div class="historico-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Buscando histórico de alterações e versões de PDFs...</span>
        </div>
    `;

    try {
        const historico = await obterHistoricoPdfAdmin(conteudoId);
        listaHistoricoCache = historico || [];
        renderizarListaHistorico(listaHistoricoCache);
    } catch (err) {
        container.innerHTML = `
            <div class="historico-empty">
                <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>
                <span>Erro ao carregar histórico: ${escapeHtml(err.message || 'Falha na conexão')}</span>
            </div>
        `;
    }
}

function filtrarListaHistorico(termo = '') {
    if (!termo || !termo.trim()) {
        renderizarListaHistorico(listaHistoricoCache);
        return;
    }
    const clean = termo.toLowerCase().trim();
    const filtrados = listaHistoricoCache.filter(item => {
        const desc = (item.descricao_acao || '').toLowerCase();
        const modId = (item.modulo_id || '').toLowerCase();
        const contId = (item.conteudo_id || '').toLowerCase();
        const pdfNovo = (item.dados_novos?.pdf_nome || '').toLowerCase();
        const pdfAnt = (item.dados_anteriores?.pdf_nome || '').toLowerCase();
        return desc.includes(clean) || modId.includes(clean) || contId.includes(clean) || pdfNovo.includes(clean) || pdfAnt.includes(clean);
    });
    renderizarListaHistorico(filtrados);
}

function renderizarListaHistorico(lista) {
    const container = qs('#historico-timeline-list');
    if (!container) return;

    if (!Array.isArray(lista) || lista.length === 0) {
        container.innerHTML = `
            <div class="historico-empty">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>Nenhuma alteração registrada até o momento.</span>
                <small style="color: #94a3b8;">As modificações, criações e substituições de PDFs feitas pelo administrador ficarão listadas aqui para consulta, reversão ou exclusão.</small>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    lista.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'historico-card-item';

        const dataFormatada = new Date(item.criado_em).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let badgeClass = 'historico-badge-edicao';
        let badgeIcon = 'fa-solid fa-pen';
        let badgeText = 'Edição';

        switch (item.tipo_acao) {
            case 'CRIACAO':
                badgeClass = 'historico-badge-criacao';
                badgeIcon = 'fa-solid fa-plus-circle';
                badgeText = 'Criação';
                break;
            case 'EDICAO_PDF':
                badgeClass = 'historico-badge-edicao-pdf';
                badgeIcon = 'fa-solid fa-file-pdf';
                badgeText = 'Troca de PDF';
                break;
            case 'REMOCAO':
                badgeClass = 'historico-badge-remocao';
                badgeIcon = 'fa-solid fa-trash-can';
                badgeText = 'Remoção';
                break;
            case 'RESTAURACAO':
                badgeClass = 'historico-badge-criacao';
                badgeIcon = 'fa-solid fa-rotate';
                badgeText = 'Restauração';
                break;
            case 'REVERSAO':
                badgeClass = 'historico-badge-reversao';
                badgeIcon = 'fa-solid fa-clock-rotate-left';
                badgeText = 'Reversão';
                break;
        }

        const conteudoNome = item.conteudo_id || 'Conteúdo Geral';
        const pdfAnt = item.dados_anteriores?.pdf_nome;
        const pdfNovo = item.dados_novos?.pdf_nome;
        const titAnt = item.dados_anteriores?.titulo;
        const titNovo = item.dados_novos?.titulo;

        let diffHtml = '';
        if (pdfAnt || pdfNovo) {
            diffHtml = `
                <div class="historico-diff-box">
                    <div class="historico-diff-row">
                        <span class="historico-diff-label"><i class="fa-solid fa-file-pdf"></i> PDF:</span>
                        ${pdfAnt ? `<span class="historico-diff-old"><i class="fa-solid fa-xmark"></i> ${escapeHtml(pdfAnt)}</span>` : '<span style="color: #94a3b8;">(sem PDF anterior)</span>'}
                        ${(pdfAnt && pdfNovo && pdfAnt !== pdfNovo) ? '<i class="fa-solid fa-arrow-right" style="color: #94a3b8; font-size: 10px;"></i>' : ''}
                        ${pdfNovo ? `<span class="historico-diff-new"><i class="fa-solid fa-check"></i> ${escapeHtml(pdfNovo)}</span>` : ''}
                    </div>
                    ${(titAnt && titNovo && titAnt !== titNovo) ? `
                        <div class="historico-diff-row">
                            <span class="historico-diff-label"><i class="fa-solid fa-heading"></i> Título:</span>
                            <span class="historico-diff-old">${escapeHtml(titAnt)}</span>
                            <i class="fa-solid fa-arrow-right" style="color: #94a3b8; font-size: 10px;"></i>
                            <span class="historico-diff-new">${escapeHtml(titNovo)}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        const adminAuthor = item.admin_id ? escapeHtml(item.admin_id) : 'Administrador';

        card.innerHTML = `
            <div class="historico-card-header">
                <div class="historico-header-left">
                    <span class="historico-badge-acao ${badgeClass}">
                        <i class="${badgeIcon}"></i> ${badgeText}
                    </span>
                    <span class="historico-materia-tag"><i class="fa-solid fa-book"></i> ${escapeHtml(conteudoNome)}</span>
                </div>
                <span class="historico-data"><i class="fa-regular fa-clock"></i> ${dataFormatada}</span>
            </div>

            <div class="historico-card-desc">
                ${escapeHtml(item.descricao_acao || 'Alteração realizada')}
            </div>

            ${diffHtml}

            <div class="historico-card-footer">
                <span class="historico-admin-author">
                    <i class="fa-solid fa-user-shield"></i> Por: <strong>${adminAuthor}</strong>
                </span>
                <div class="historico-footer-actions">
                    <button type="button" class="btn-reverter-versao" data-historico-id="${item.id}" title="Reverter o módulo e PDF para esta versão">
                        <i class="fa-solid fa-rotate-left"></i> Reverter
                    </button>
                    <button type="button" class="btn-del-item-historico" data-historico-id="${item.id}" title="Excluir este registro do histórico">
                        <i class="fa-solid fa-trash-can"></i> Excluir
                    </button>
                </div>
            </div>
        `;

        const btnReverter = card.querySelector('.btn-reverter-versao');
        if (btnReverter) {
            btnReverter.addEventListener('click', () => {
                executarReversaoHistorico(item.id, item);
            });
        }

        const btnDel = card.querySelector('.btn-del-item-historico');
        if (btnDel) {
            btnDel.addEventListener('click', () => {
                executarExclusaoItemHistorico(item.id);
            });
        }

        container.appendChild(card);
    });
}

async function executarReversaoHistorico(historicoId, item) {
    const nomeAlvo = item.dados_novos?.titulo || item.dados_anteriores?.titulo || `Módulo #${item.modulo_id}`;
    const confirmar = confirm(`Deseja realmente reverter as alterações e restaurar este estado do PDF/módulo "${nomeAlvo}"?`);
    if (!confirmar) return;

    try {
        showToast('Revertendo alterações...', 'info', 'fa-solid fa-spinner fa-spin');
        const res = await reverterHistoricoPdfAdmin(historicoId, 'versao');
        showToast(res.message || 'Módulo e PDF revertidos com sucesso!', 'success', 'fa-solid fa-circle-check');
        fecharModalHistoricoPdf();
        window.dispatchEvent(new CustomEvent('aprovadrive:historico-revertido', { detail: { conteudoId: item.conteudo_id } }));
    } catch (err) {
        showToast(err.message || 'Erro ao reverter alteração.', 'locked', 'fa-solid fa-triangle-exclamation');
    }
}

async function executarExclusaoItemHistorico(historicoId) {
    const confirmar = confirm(`Deseja realmente excluir este registro #${historicoId} do histórico?`);
    if (!confirmar) return;

    try {
        await excluirItemHistoricoPdfAdmin(historicoId);
        showToast('Registro de histórico excluído com sucesso!', 'info', 'fa-solid fa-trash-can');
        const selectHistConteudo = qs("#select-historico-conteudo");
        await carregarERenderizarHistorico(selectHistConteudo?.value || null);
    } catch (err) {
        showToast(err.message || 'Erro ao excluir item do histórico.', 'locked', 'fa-solid fa-triangle-exclamation');
    }
}

async function executarLimpezaHistorico(conteudoId = null) {
    const msg = conteudoId
        ? `Deseja realmente limpar todo o histórico de alterações da disciplina "${conteudoId}"?`
        : 'Deseja realmente limpar todo o histórico de alterações de PDFs de todas as disciplinas?';
    if (!confirm(msg)) return;

    try {
        await limparHistoricoPdfAdmin(conteudoId);
        showToast('Histórico de alterações limpo com sucesso!', 'info', 'fa-solid fa-trash-can');
        await carregarERenderizarHistorico(conteudoId);
    } catch (err) {
        showToast(err.message || 'Erro ao limpar histórico.', 'locked', 'fa-solid fa-triangle-exclamation');
    }
}

// ============================================================================
// 2. Histórico e Gerenciamento de Questões Customizadas
// ============================================================================

export async function abrirModalHistoricoQuestoes(materiaId = null) {
    const modal = qs('#modal-admin-historico-questoes');
    if (!modal) return;

    const selectMateria = qs("#select-historico-questoes-materia");
    if (selectMateria) {
        selectMateria.value = materiaId || '';
    }

    const inputBusca = qs("#input-busca-historico-questoes");
    if (inputBusca) inputBusca.value = '';

    modal.style.display = 'flex';
    await carregarERenderizarHistoricoQuestoes(materiaId || null);
}

export function fecharModalHistoricoQuestoes() {
    const modal = qs('#modal-admin-historico-questoes');
    if (modal) modal.style.display = 'none';
}

export async function carregarERenderizarHistoricoQuestoes(materia = null) {
    const container = qs('#lista-admin-historico-questoes');
    if (!container) return;

    container.innerHTML = `
        <div class="historico-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Buscando questões cadastradas pelo administrador...</span>
        </div>
    `;

    try {
        const questoes = await listarQuestoesCustomizadasAPI(materia);
        listaQuestoesCache = questoes || [];
        renderizarListaHistoricoQuestoes(listaQuestoesCache);
    } catch (err) {
        container.innerHTML = `
            <div class="historico-empty">
                <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>
                <span>Erro ao carregar questões: ${escapeHtml(err.message || 'Falha na conexão')}</span>
            </div>
        `;
    }
}

function filtrarListaHistoricoQuestoes(termo = '') {
    if (!termo || !termo.trim()) {
        renderizarListaHistoricoQuestoes(listaQuestoesCache);
        return;
    }
    const clean = termo.toLowerCase().trim();
    const filtrados = listaQuestoesCache.filter(q => {
        const texto = (q.texto || '').toLowerCase();
        const mat = (q.materia || '').toLowerCase();
        const expl = (q.explicacao || '').toLowerCase();
        const opcoes = Array.isArray(q.opcoes) ? q.opcoes.join(' ').toLowerCase() : '';
        return texto.includes(clean) || mat.includes(clean) || expl.includes(clean) || opcoes.includes(clean);
    });
    renderizarListaHistoricoQuestoes(filtrados);
}

function renderizarListaHistoricoQuestoes(lista) {
    const container = qs('#lista-admin-historico-questoes');
    if (!container) return;

    if (!Array.isArray(lista) || lista.length === 0) {
        container.innerHTML = `
            <div class="historico-empty">
                <i class="fa-solid fa-circle-question"></i>
                <span>Nenhuma questão personalizada encontrada.</span>
                <small style="color: #94a3b8;">As questões criadas pelo administrador aparecem aqui para consulta, verificação e exclusão.</small>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    const LETRAS = ['A', 'B', 'C', 'D'];

    lista.forEach((q) => {
        const card = document.createElement('div');
        card.className = 'admin-questao-card-item';

        const dataFormatada = q.criado_em ? new Date(q.criado_em).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Recentemente';

        const opcoes = Array.isArray(q.opcoes) ? q.opcoes : [];
        const corretaIndex = typeof q.correta === 'number' ? q.correta : (LETRAS.indexOf(q.correta_letra || 'A'));

        let opcoesHtml = '';
        opcoes.forEach((op, idx) => {
            const isCorreta = idx === corretaIndex;
            const letra = LETRAS[idx] || String(idx + 1);
            opcoesHtml += `
                <div class="admin-questao-opcao-preview ${isCorreta ? 'correta' : ''}">
                    <strong>${letra})</strong> ${escapeHtml(op)}
                    ${isCorreta ? '<i class="fa-solid fa-circle-check" style="margin-left: auto;"></i>' : ''}
                </div>
            `;
        });

        card.innerHTML = `
            <div class="historico-card-header">
                <div class="admin-questao-badges">
                    <span class="admin-questao-materia-badge">
                        <i class="fa-solid fa-book"></i> ${escapeHtml(q.materia || 'Geral')}
                    </span>
                    <span class="admin-questao-bateria-badge">
                        <i class="fa-solid fa-layer-group"></i> Bateria ${q.bateria_numero || q.bateria || 1}
                    </span>
                    ${q.incluir_no_simulado ? `
                    <span class="admin-questao-simulado-badge">
                        <i class="fa-solid fa-trophy"></i> Simulado Oficial
                    </span>` : ''}
                </div>
                <span class="historico-data"><i class="fa-regular fa-clock"></i> ${dataFormatada}</span>
            </div>

            <div class="admin-questao-enunciado">
                ${escapeHtml(q.texto || 'Questão sem enunciado')}
            </div>

            <div class="admin-questao-opcoes-grid">
                ${opcoesHtml}
            </div>

            ${q.explicacao ? `
            <div class="admin-questao-explicacao">
                <i class="fa-solid fa-lightbulb" style="color: #f59e0b; margin-right: 4px;"></i>
                <strong>Justificativa:</strong> ${escapeHtml(q.explicacao)}
            </div>` : ''}

            <div class="admin-questao-card-footer">
                <span class="historico-admin-author">
                    <i class="fa-solid fa-user-shield"></i> Criado por: <strong>${escapeHtml(q.criado_por || 'admin')}</strong>
                </span>
                <button type="button" class="btn-admin-del-questao-card" data-id="${q.id}" title="Excluir esta questão permanentemente">
                    <i class="fa-solid fa-trash-can"></i> Excluir Questão
                </button>
            </div>
        `;

        const btnDel = card.querySelector('.btn-admin-del-questao-card');
        if (btnDel) {
            btnDel.addEventListener('click', async () => {
                const confirmar = confirm(`Deseja realmente excluir permanentemente a questão:\n"${q.texto?.slice(0, 80)}..."?`);
                if (!confirmar) return;

                try {
                    btnDel.disabled = true;
                    btnDel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Excluindo...';
                    await removerQuestaoAdminAPI(q.id);
                    showToast('Questão excluída com sucesso do banco!', 'info', 'fa-solid fa-trash-can');
                    card.remove();
                    listaQuestoesCache = listaQuestoesCache.filter(item => item.id !== q.id);
                    if (listaQuestoesCache.length === 0) {
                        renderizarListaHistoricoQuestoes([]);
                    }
                } catch (err) {
                    showToast(err.message || 'Erro ao excluir questão.', 'locked', 'fa-solid fa-triangle-exclamation');
                    btnDel.disabled = false;
                    btnDel.innerHTML = '<i class="fa-solid fa-trash-can"></i> Excluir Questão';
                }
            });
        }

        container.appendChild(card);
    });
}

// ============================================================================
// Inicialização de Eventos
// ============================================================================

export function initAdminHistoryView(router) {
    routerRef = router;
    if (initialized) return;
    initialized = true;

    // --- Histórico de PDFs ---
    const selectHistConteudo = qs("#select-historico-conteudo");
    if (selectHistConteudo) {
        selectHistConteudo.addEventListener("change", () => {
            carregarERenderizarHistorico(selectHistConteudo.value || null);
        });
    }

    const inputBuscaHist = qs("#input-busca-historico");
    if (inputBuscaHist) {
        inputBuscaHist.addEventListener("input", () => {
            filtrarListaHistorico(inputBuscaHist.value);
        });
    }

    const btnRefreshHist = qs("#btn-refresh-historico");
    if (btnRefreshHist) {
        btnRefreshHist.addEventListener("click", () => {
            carregarERenderizarHistorico(selectHistConteudo?.value || null);
        });
    }

    const btnLimparHist = qs("#btn-limpar-historico-pdf");
    if (btnLimparHist) {
        btnLimparHist.addEventListener("click", () => {
            executarLimpezaHistorico(selectHistConteudo?.value || null);
        });
    }

    const btnFecharHist = qs("#btn-fechar-modal-admin-historico");
    if (btnFecharHist) {
        btnFecharHist.addEventListener("click", fecharModalHistoricoPdf);
    }

    const modalHist = qs('#modal-admin-historico-pdf');
    if (modalHist) {
        modalHist.addEventListener('click', (e) => {
            if (e.target === modalHist) fecharModalHistoricoPdf();
        });
    }

    // --- Histórico de Questões ---
    const selectMateriaQuestoes = qs("#select-historico-questoes-materia");
    if (selectMateriaQuestoes) {
        selectMateriaQuestoes.addEventListener("change", () => {
            carregarERenderizarHistoricoQuestoes(selectMateriaQuestoes.value || null);
        });
    }

    const inputBuscaQuestoes = qs("#input-busca-historico-questoes");
    if (inputBuscaQuestoes) {
        inputBuscaQuestoes.addEventListener("input", () => {
            filtrarListaHistoricoQuestoes(inputBuscaQuestoes.value);
        });
    }

    const btnRefreshQuestoes = qs("#btn-refresh-historico-questoes");
    if (btnRefreshQuestoes) {
        btnRefreshQuestoes.addEventListener("click", () => {
            carregarERenderizarHistoricoQuestoes(selectMateriaQuestoes?.value || null);
        });
    }

    const btnFecharQuestoes = qs("#btn-fechar-modal-admin-historico-questoes");
    if (btnFecharQuestoes) {
        btnFecharQuestoes.addEventListener("click", fecharModalHistoricoQuestoes);
    }

    const modalQuestoes = qs('#modal-admin-historico-questoes');
    if (modalQuestoes) {
        modalQuestoes.addEventListener('click', (e) => {
            if (e.target === modalQuestoes) fecharModalHistoricoQuestoes();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalHist && modalHist.style.display === 'flex') fecharModalHistoricoPdf();
            if (modalQuestoes && modalQuestoes.style.display === 'flex') fecharModalHistoricoQuestoes();
        }
    });
}
