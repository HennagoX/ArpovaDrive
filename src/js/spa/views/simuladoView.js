import { qs, qsa, setText } from '../../utils/dom.js';
import { usuarioGlobal } from '../../services/userService.js';
import { getSimuladoResultadosAPI } from '../../services/questoesService.js';

let initialized = false;

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
        if (badgeEl) {
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

export function initSimuladoView(router) {
    if (initialized) return;
    initialized = true;

    const searchInput = qs("#search-simulado");
    const cards = qsa(".simulado-card");
    const filters = qsa(".filter-simulado");
    const contador = qs("#contador-simulado");
    const actionBtns = qsa(".btn-iniciar-simulado");

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
        const activeFilter = qs(".filter-simulado.active");
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
            contador.textContent = `${quantidade} ${quantidade === 1 ? 'simulado' : 'simulados'}`;
        }
    }

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
}

export function renderSimulado() {
    usuarioGlobal.updateUI();

    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');

    if (titleEl) setText(titleEl, 'Simulados DETRAN');
    if (subtitleEl) setText(subtitleEl, 'Provas oficiais de 30 questões cronometradas. Meta de aprovação: 67% (20 acertos).');

    atualizarProgressoSimulados();
}
