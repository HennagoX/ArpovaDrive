import { qs, qsa, setText } from '../../utils/dom.js';
import { usuarioGlobal } from '../../services/userService.js';
import { getModuloAtualCached, getModuloAtual } from '../../services/moduloService.js';
import { getBateriasByMateriaId, criarQuestaoAdminAPI } from '../../services/questoesService.js';
import { showToast } from './modulosView.js';
import { abrirModalHistoricoQuestoes } from './adminHistoryView.js';

let initialized = false;
let questaoEmEdicaoId = null;

function atualizarSelecaoAlternativa(letra) {
    const corretaSelect = qs('#admin-questao-correta-input');
    if (corretaSelect && corretaSelect.value !== letra) {
        corretaSelect.value = letra;
    }
    const rows = qsa('.admin-alternativa-row');
    rows.forEach(row => {
        const span = row.querySelector('.alternativa-letra');
        if (span && span.textContent.trim().toUpperCase() === letra) {
            row.classList.add('selected');
        } else {
            row.classList.remove('selected');
        }
    });
}

export function abrirModalAdminQuestao(materiaPreselecionada = null, bateriaPreselecionada = null, questaoParaEditar = null) {
    const modal = qs('#modal-admin-questao');
    if (!modal) return;

    questaoEmEdicaoId = questaoParaEditar ? (questaoParaEditar.id || null) : null;

    const modalTitulo = qs('#modal-admin-questao-titulo');
    const btnSalvar = qs('#btn-salvar-admin-questao');
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

    if (modalTitulo) {
        modalTitulo.textContent = questaoParaEditar ? 'Editar Questão' : 'Criar Nova Questão';
    }
    if (btnSalvar) {
        btnSalvar.innerHTML = questaoParaEditar
            ? '<i class="fa-solid fa-floppy-disk"></i> Atualizar Questão'
            : '<i class="fa-solid fa-floppy-disk"></i> Salvar Questão';
    }

    if (questaoParaEditar) {
        if (enunciadoInput) enunciadoInput.value = questaoParaEditar.texto || '';
        const ops = Array.isArray(questaoParaEditar.opcoes)
            ? questaoParaEditar.opcoes
            : (typeof questaoParaEditar.opcoes === 'string' ? JSON.parse(questaoParaEditar.opcoes || '[]') : []);
        if (opA) opA.value = ops[0] || '';
        if (opB) opB.value = ops[1] || '';
        if (opC) opC.value = ops[2] || '';
        if (opD) opD.value = ops[3] || '';

        const letraCorreta = questaoParaEditar.correta_letra || (typeof questaoParaEditar.correta === 'number' ? ['A', 'B', 'C', 'D'][questaoParaEditar.correta] : 'A');
        if (corretaSelect) corretaSelect.value = letraCorreta;
        atualizarSelecaoAlternativa(letraCorreta);

        if (simuladoCheck) simuladoCheck.checked = questaoParaEditar.incluir_no_simulado !== false;
        if (explicacaoInput) explicacaoInput.value = questaoParaEditar.explicacao || '';
    } else {
        if (enunciadoInput) enunciadoInput.value = '';
        if (opA) opA.value = '';
        if (opB) opB.value = '';
        if (opC) opC.value = '';
        if (opD) opD.value = '';
        if (corretaSelect) corretaSelect.value = 'A';
        atualizarSelecaoAlternativa('A');
        if (simuladoCheck) simuladoCheck.checked = true;
        if (explicacaoInput) explicacaoInput.value = '';
    }

    const materiaDesejada = questaoParaEditar?.materia || materiaPreselecionada;
    if (materiaSelect) {
        if (materiaDesejada) {
            const mNorm = String(materiaDesejada).toLowerCase().replace(/[^a-z0-9]/g, '');
            if (mNorm.includes('codigo') || mNorm.includes('legislacao')) materiaSelect.value = 'CodigoTransito';
            else if (mNorm.includes('placa') || mNorm.includes('sinalizacao')) materiaSelect.value = 'PlacasTransito';
            else if (mNorm.includes('direcao') || mNorm.includes('defensiva') || mNorm.includes('ofensiva')) materiaSelect.value = 'DirecaoDefensiva';
            else if (mNorm.includes('socorro') || mNorm.includes('saude') || mNorm.includes('primeiro')) materiaSelect.value = 'PrimeirosSocorros';
            else if (mNorm.includes('ambiente') || mNorm.includes('cidadania')) materiaSelect.value = 'MeioAmbiente';
            else materiaSelect.value = materiaDesejada;
        } else {
            materiaSelect.value = 'CodigoTransito';
        }
    }

    const bateriaDesejada = questaoParaEditar?.bateria_numero || questaoParaEditar?.bateria || bateriaPreselecionada;
    if (bateriaSelect) {
        if (bateriaDesejada) {
            let bNum = 1;
            if (typeof bateriaDesejada === 'number') bNum = bateriaDesejada;
            else {
                const match = String(bateriaDesejada).match(/\d+/);
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
    questaoEmEdicaoId = null;
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

    const corretaSelect = qs('#admin-questao-correta-input');
    if (corretaSelect) {
        corretaSelect.addEventListener('change', () => {
            atualizarSelecaoAlternativa(corretaSelect.value);
        });
    }

    const altRows = qsa('.admin-alternativa-row');
    altRows.forEach((row) => {
        const letraSpan = row.querySelector('.alternativa-letra');
        if (letraSpan) {
            letraSpan.setAttribute('title', 'Clique para marcar como resposta correta');
            letraSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                const letra = letraSpan.textContent.trim().toUpperCase();
                atualizarSelecaoAlternativa(letra);
            });
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
            const corretaSelectEl = qs('#admin-questao-correta-input');
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

            const corretaLetra = corretaSelectEl?.value || 'A';
            const corretaIdx = ['A', 'B', 'C', 'D'].indexOf(corretaLetra);
            const isEdit = Boolean(questaoEmEdicaoId);

            const dados = {
                ...(isEdit ? { id: questaoEmEdicaoId } : {}),
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

                const resultado = await criarQuestaoAdminAPI(dados);
                showToast(
                    isEdit ? 'Questão atualizada com sucesso no banco!' : 'Questão cadastrada com sucesso no banco!',
                    'success',
                    'fa-solid fa-circle-check'
                );
                fecharModalAdminQuestao();
                atualizarProgressoQuestoes();

                document.dispatchEvent(new CustomEvent('questao-customizada-salva', {
                    detail: { questao: resultado?.questao || dados, isEdit }
                }));
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
