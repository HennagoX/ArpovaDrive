
import { qs, qsa, setText } from '../../utils/dom.js';

let initialized = false;

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
}

export function renderQuestoes() {
    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');

    if (titleEl) setText(titleEl, 'Banco de Questões');
    if (subtitleEl) setText(subtitleEl, 'Pratique com questões simuladas do DETRAN a cada 3 módulos concluídos.');
}
