
import { qs, qsa, setText } from '../../utils/dom.js';
import { usuarioGlobal } from '../../services/userService.js';

let initialized = false;

export function initConteudosView(router) {
    if (initialized) return;
    initialized = true;

    const search = qs("#search");
    const ebooks = qsa(".ebook");
    const filters = qsa(".filter");
    const contador = qs("#contador");
    const readBtns = qsa(".read-btn");

    if (search) {
        search.addEventListener("input", filtrar);
    }

    filters.forEach(filter => {
        filter.addEventListener("click", () => {
            filters.forEach(f => f.classList.remove("active"));
            filter.classList.add("active");
            filtrar();
        });
    });

    function filtrar() {
        if (!search) return;
        const texto = search.value.toLowerCase().trim();
        const activeFilter = qs(".filter.active");
        const categoriaSelecionada = activeFilter ? activeFilter.dataset.category : "todos";

        let quantidade = 0;

        ebooks.forEach(ebook => {
            const conteudo = ebook.innerText.toLowerCase();
            const categoria = ebook.dataset.category;

            const correspondeTexto = conteudo.includes(texto);
            const correspondeCategoria = categoriaSelecionada === "todos" || categoria === categoriaSelecionada;

            if (correspondeTexto && correspondeCategoria) {
                ebook.style.display = "flex";
                quantidade++;
            } else {
                ebook.style.display = "none";
            }
        });

        if (contador) {
            contador.textContent = `${quantidade} ${quantidade === 1 ? 'conteúdo' : 'conteúdos'}`;
        }
    }

    readBtns?.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const conteudoId = btn.name || btn.dataset.id;
            if (conteudoId && router) {
                router.navigateTo('modulos', { conteudoId });
            }
        });
    });

    ebooks.forEach((card) => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if (e.target.closest('.read-btn')) return;
            const conteudoId = card.dataset.id;
            if (conteudoId && router) {
                router.navigateTo('modulos', { conteudoId });
            }
        });
    });
}

export function renderConteudos() {
    usuarioGlobal.updateUI();

    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');

    if (titleEl) setText(titleEl, 'Biblioteca de conteúdos');
    if (subtitleEl) setText(subtitleEl, 'Estude os principais assuntos para sua prova do DETRAN.');
}
