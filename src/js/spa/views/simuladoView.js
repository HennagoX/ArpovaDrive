import { qs, qsa, setText } from '../../utils/dom.js';

let initialized = false;

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
    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');

    if (titleEl) setText(titleEl, 'Simulados DETRAN');
    if (subtitleEl) setText(subtitleEl, 'Provas oficiais de 30 questões cronometradas. Meta de aprovação: 67% (20 acertos).');
}
