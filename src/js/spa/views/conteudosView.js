/**
 * Módulo de Visão: Biblioteca de Conteúdos (SPA)
 * 
 * Gerencia a listagem de e-books, filtros por categoria,
 * barra de busca interativa e redirecionamento para os módulos do conteúdo.
 */

import { qs, qsa, setText } from '../../utils/dom.js';

let initialized = false;

export function initConteudosView(router) {
    if (initialized) return;
    initialized = true;

    const search = qs("#search");
    const ebooks = qsa(".ebook");
    const filters = qsa(".filter");
    const contador = qs("#contador");
    const readBtns = qsa(".read-btn");

    // Vincula busca por texto
    if (search) {
        search.addEventListener("input", filtrar);
    }

    // Vincula botões de filtro
    filters.forEach(filter => {
        filter.addEventListener("click", () => {
            filters.forEach(f => f.classList.remove("active"));
            filter.classList.add("active");
            filtrar();
        });
    });

    // Função de filtro dinâmico
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

    // Abertura de módulos pelo botão "Começar a ler" / "Continuar leitura"
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

    // Permite clicar no card inteiro
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
    const titleEl = qs('#inicio-saudacao');
    const subtitleEl = qs('#inicio-subtitulo');

    if (titleEl) setText(titleEl, 'Biblioteca de conteúdos');
    if (subtitleEl) setText(subtitleEl, 'Estude os principais assuntos para sua prova do DETRAN.');
}
