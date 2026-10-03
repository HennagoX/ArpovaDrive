import { qs, qsa, setText } from '../../utils/dom.js';
import { usuarioGlobal } from '../../services/userService.js';
import { getModuloAtualCached, getModuloAtual } from '../../services/moduloService.js';
import { getBateriasByMateriaId, criarQuestaoAdminAPI } from '../../services/questoesService.js';
import { showToast } from './modulosView.js';
import { abrirModalHistoricoQuestoes } from './adminHistoryView.js';

let initialized = false;

export function abrirModalAdminQuestao(materiaPreselecionada = null, bateriaPreselecionada = null) {
    const modal = qs('#modal-admin-questao');
    if (!modal) return;

    const materiaSelect = qs('#admin-questao-materia-input');
    const bateriaSelect = qs('#admin-questao-bateria-input');
    const enunciadoInput = qs('#admin-questao-enunciado-input');
    const opA = qs('#admin-questao-op-a');
    const opB = qs('#admin-questao-op-b');
    const opC = qs('#admin-questao-op-c');
    const opD = qs('#admin-questao-op-d');
    const corretaSelect = qs('#admin-questao-correta-input');
    const simuladoCheck = qs('#admin-questao-simulado-check');
    const explicacaoInput = qs('#admin-questao-explicacao-input');

    if (enunciadoInput) enunciadoInput.value = '';
    if (opA) opA.value = '';
    if (opB) opB.value = '';
    if (opC) opC.value = '';
    if (opD) opD.value = '';
    if (corretaSelect) corretaSelect.value = 'A';
    if (simuladoCheck) simuladoCheck.checked = true;
    if (explicacaoInput) explicacaoInput.value = '';

    if (materiaSelect) {
        if (materiaPreselecionada) {
            const mNorm = String(materiaPreselecionada).toLowerCase().replace(/[^a-z0-9]/g, '');
            if (mNorm.includes('codigo') || mNorm.includes('legislacao')) materiaSelect.value = 'CodigoTransito';
            else if (mNorm.includes('placa') || mNorm.includes('sinalizacao')) materiaSelect.value = 'PlacasTransito';
            else if (mNorm.includes('direcao') || mNorm.includes('defensiva') || mNorm.includes('ofensiva')) materiaSelect.value = 'DirecaoDefensiva';
            else if (mNorm.includes('socorro') || mNorm.includes('saude') || mNorm.includes('primeiro')) materiaSelect.value = 'PrimeirosSocorros';
            else if (mNorm.includes('ambiente') || mNorm.includes('cidadania')) materiaSelect.value = 'MeioAmbiente';
            else materiaSelect.value = materiaPreselecionada;
        } else {
            materiaSelect.value = 'CodigoTransito';
        }
    }

    if (bateriaSelect) {
        if (bateriaPreselecionada) {
            let bNum = 1;
            if (typeof bateriaPreselecionada === 'number') bNum = bateriaPreselecionada;
            else {
                const match = String(bateriaPreselecionada).match(/\d+/);
                if (match) bNum = Number(match[0]);
            }
            bateriaSelect.value = String(Math.max(1, Math.min(4, bNum)));
        } else {
            bateriaSelect.value = '1';
        }
    }

    modal.style.display = 'flex';
    enunciadoInput?.focus();
}

export function fecharModalAdminQuestao() {
    const modal = qs('#modal-admin-questao');
    if (modal) modal.style.display = 'none';
}

export function atualizarProgressoQuestoes() {
    const cards = qsa(".questoes-subject-card");
    const activeUserId = usuarioGlobal.id_usuario || usuarioGlobal.id;

    cards.forEach(card => {
        const materiaId = card.dataset.id;
        if (!materiaId) return;

        const moduloAtualCached = getModuloAtualCached(materiaId, activeUserId);
        const baterias = getBateriasByMateriaId(materiaId, moduloAtualCached);
        const total = baterias.length;
        const liberadas = baterias.filter(b => !b.bloqueado).length;
        const pctProgresso = total > 0 ? Math.round((liberadas / total) * 100) : 0;

        const badgeEl = card.querySelector(".questoes-badge-unlocked");
        if (badgeEl) {
            badgeEl.innerHTML = `<i class="fa-solid fa-unlock"></i> ${liberadas} ${liberadas === 1 ? 'Liberada' : 'Liberadas'}`;
        }

        const pctSpan = card.querySelector(".questoes-progress-pct");
        if (pctSpan) {
            setText(pctSpan, `${pctProgresso}%`);
        }

        const fillEl = card.querySelector(".questoes-progress-fill");
        if (fillEl) {
            fillEl.style.width = `${pctProgresso}%`;
        }
    });

    cards.forEach(async (card) => {
        const materiaId = card.dataset.id;
        if (!materiaId) return;
        try {
            const res = await getModuloAtual(materiaId, activeUserId);
            const freshModuloAtual = typeof res === 'number' ? res : (res?.modulo_atual || 1);
            const baterias = getBateriasByMateriaId(materiaId, freshModuloAtual);
            const total = baterias.length;
            const liberadas = baterias.filter(b => !b.bloqueado).length;
            const pctProgresso = total > 0 ? Math.round((liberadas / total) * 100) : 0;

            const badgeEl = card.querySelector(".questoes-badge-unlocked");
            if (badgeEl) {
                badgeEl.innerHTML = `<i class="fa-solid fa-unlock"></i> ${liberadas} ${liberadas === 1 ? 'Liberada' : 'Liberadas'}`;
            }
            const pctSpan = card.querySelector(".questoes-progress-pct");
            if (pctSpan) setText(pctSpan, `${pctProgresso}%`);
            const fillEl = card.querySelector(".questoes-progress-fill");
            if (fillEl) fillEl.style.width = `${pctProgresso}%`;
        } catch {}
    });
}

export function initQuestoesView(router) {
    if (initialized) return;
    initialized = true;

    const searchInput = qs("#search-questoes");
    const cards = qsa(".questoes-subject-card");
    const filters = qsa(".filter-questoes");
    const contador = qs("#contador-questoes");
    const actionBtns = qsa(".btn-praticar-questoes");

    if (searchInput) {
        searchInput.addEventListener("input", filtrar);
    }

    filters.forEach(filter => {
        filter.addEventListener("click", () => {
            filters.forEach(f => f.classList.remove("active"));
            filter.classList.add("active");
            filtrar();
        });
    });

    function filtrar() {
        if (!searchInput) return;
        const texto = searchInput.value.toLowerCase().trim();
        const activeFilter = qs(".filter-questoes.active");
        const categoriaSelecionada = activeFilter ? activeFilter.dataset.category : "todos";

        let quantidade = 0;

        cards.forEach(card => {
            const conteudo = card.innerText.toLowerCase();
            const categoria = card.dataset.category;

            const correspondeTexto = conteudo.includes(texto);
            const correspondeCategoria = categoriaSelecionada === "todos" || categoria === categoriaSelecionada;

            if (correspondeTexto && correspondeCategoria) {
                card.style.display = "flex";
                quantidade++;
            } else {
                card.style.display = "none";
            }
        });

        if (contador) {
            contador.textContent = `${quantidade} ${quantidade === 1 ? 'disciplina' : 'disciplinas'}`;
        }
    }

    actionBtns?.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const materiaId = btn.dataset.id || btn.name;
            if (materiaId && router) {
                router.navigateTo('questoes-modulos', { materiaId });
            }
        });
    });

    cards.forEach((card) => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-praticar-questoes')) return;
            const materiaId = card.dataset.id;
            if (materiaId && router) {
                router.navigateTo('questoes-modulos', { materiaId });
            }
        });
    });

    // =========================================================================
    // Admin: Eventos de Criação de Questões
    // =========================================================================
    const btnAdminAdd = qs('#btn-admin-add-questao');
    if (btnAdminAdd) {
        btnAdminAdd.addEventListener('click', () => {
            abrirModalAdminQuestao();
        });
    }

    const btnAdminGerenciar = qs('#btn-admin-gerenciar-questoes');
    if (btnAdminGerenciar) {
        btnAdminGerenciar.addEventListener('click', () => {
            abrirModalHistoricoQuestoes();
        });
    }

    const btnFechar = qs('#btn-fechar-modal-admin-questao');
    if (btnFechar) {
        btnFechar.addEventListener('click', () => {
            fecharModalAdminQuestao();
        });
    }

    const btnCancelar = qs('#btn-cancelar-admin-questao');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            fecharModalAdminQuestao();
        });
    }

    const modal = qs('#modal-admin-questao');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharModalAdminQuestao();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            fecharModalAdminQuestao();
        }
    });

    const btnSalvar = qs('#btn-salvar-admin-questao');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', async () => {
            const materiaSelect = qs('#admin-questao-materia-input');
            const bateriaSelect = qs('#admin-questao-bateria-input');
            const enunciadoInput = qs('#admin-questao-enunciado-input');
            const opA = qs('#admin-questao-op-a');
            const opB = qs('#admin-questao-op-b');
            const opC = qs('#admin-questao-op-c');
            const opD = qs('#admin-questao-op-d');
            const corretaSelect = qs('#admin-questao-correta-input');
            const simuladoCheck = qs('#admin-questao-simulado-check');
            const explicacaoInput = qs('#admin-questao-explicacao-input');

            const texto = enunciadoInput?.value?.trim() || '';
            if (!texto) {
                showToast('O enunciado da questão é obrigatório.', 'locked', 'fa-solid fa-triangle-exclamation');
                enunciadoInput?.focus();
                return;
            }

            const valA = opA?.value?.trim() || '';
            const valB = opB?.value?.trim() || '';
            const valC = opC?.value?.trim() || '';
            const valD = opD?.value?.trim() || '';

            if (!valA || !valB || !valC || !valD) {
                showToast('Preencha todas as 4 alternativas de resposta (A, B, C e D).', 'locked', 'fa-solid fa-triangle-exclamation');
                return;
            }

            const corretaLetra = corretaSelect?.value || 'A';
            const corretaIdx = ['A', 'B', 'C', 'D'].indexOf(corretaLetra);

            const dados = {
                materia: materiaSelect?.value || 'CodigoTransito',
                bateria: Number(bateriaSelect?.value || 1),
                texto,
                opcoes: [valA, valB, valC, valD],
                correta: corretaIdx >= 0 ? corretaIdx : 0,
                corretaLetra,
                explicacao: explicacaoInput?.value?.trim() || '',
                incluir_no_simulado: simuladoCheck ? simuladoCheck.checked : true
            };

            const originalHtml = btnSalvar.innerHTML;
            try {
                btnSalvar.disabled = true;
                btnSalvar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

                await criarQuestaoAdminAPI(dados);
                showToast('Questão cadastrada com sucesso no banco!', 'success', 'fa-solid fa-circle-check');
                fecharModalAdminQuestao();
                atualizarProgressoQuestoes();
            } catch (err) {
                showToast(err.message || 'Erro ao salvar questão.', 'locked', 'fa-solid fa-triangle-exclamation');
            } finally {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = originalHtml;
            }
        });
    }
}

export function renderQuestoes() {
    usuarioGlobal.updateUI();

    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');

    if (titleEl) setText(titleEl, 'Banco de Questões');
    if (subtitleEl) setText(subtitleEl, 'Pratique com questões simuladas do DETRAN a cada 3 módulos concluídos.');

    const btnAdminAdd = qs('#btn-admin-add-questao');
    if (btnAdminAdd) {
        btnAdminAdd.style.display = usuarioGlobal.isAdmin ? 'inline-flex' : 'none';
    }

    const btnAdminGerenciar = qs('#btn-admin-gerenciar-questoes');
    if (btnAdminGerenciar) {
        btnAdminGerenciar.style.display = usuarioGlobal.isAdmin ? 'inline-flex' : 'none';
    }

    atualizarProgressoQuestoes();
}
