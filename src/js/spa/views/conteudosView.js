
import { qs, qsa, setText, applyTiltAll } from '../../utils/dom.js';
import { usuarioGlobal } from '../../services/userService.js';
import { getModuloAtualCached, getModuloAtual } from '../../services/moduloService.js';
import { getModulosByConteudoId } from '../../services/conteudosService.js';

let initialized = false;

export function atualizarProgressoConteudos() {
    const ebooks = qsa(".ebook");
    const activeUserId = usuarioGlobal.id_usuario || usuarioGlobal.id;

    ebooks.forEach(card => {
        const conteudoId = card.dataset.id;
        if (!conteudoId) return;

        const moduloAtualCached = getModuloAtualCached(conteudoId, activeUserId);
        const modulos = getModulosByConteudoId(conteudoId, moduloAtualCached);
        const total = modulos.length;
        const nivelAtual = Math.max(1, Number(moduloAtualCached || 1));
        const concluidos = nivelAtual > total ? total : modulos.filter(m => Number(m.numero) < nivelAtual).length;
        const pctProgresso = total > 0 ? Math.min(100, Math.round((concluidos / total) * 100)) : 0;

        const countSpan = card.querySelector(".info span:first-child");
        if (countSpan) {
            countSpan.innerHTML = `<i class="fa-regular fa-file-lines"></i> ${total} ${total === 1 ? 'módulo' : 'módulos'}`;
        }

        const pctSpan = card.querySelector(".ebook-progress-pct") || card.querySelector(".info span:last-child");
        if (pctSpan) {
            pctSpan.className = "ebook-progress-pct";
            setText(pctSpan, `${pctProgresso}%`);
        }

        const progressBar = card.querySelector(".progress-bar");
        if (progressBar) {
            progressBar.style.width = `${pctProgresso}%`;
        }

        const btn = card.querySelector(".read-btn");
        if (btn) {
            if (pctProgresso === 100) {
                btn.innerHTML = '<i class="fa-solid fa-book-open"></i> Revisar conteúdo';
            } else if (pctProgresso > 0) {
                btn.innerHTML = '<i class="fa-solid fa-book-open"></i> Continuar leitura';
            } else {
                btn.innerHTML = '<i class="fa-solid fa-book-open"></i> Começar a ler';
            }
        }
    });

    ebooks.forEach(async (card) => {
        const conteudoId = card.dataset.id;
        if (!conteudoId) return;
        try {
            const res = await getModuloAtual(conteudoId, activeUserId);
            const freshModuloAtual = typeof res === 'number' ? res : (res?.modulo_atual || 1);
            const modulos = getModulosByConteudoId(conteudoId, freshModuloAtual);
            const total = modulos.length;
            const nivelAtual = Math.max(1, Number(freshModuloAtual));
            const concluidos = nivelAtual > total ? total : modulos.filter(m => Number(m.numero) < nivelAtual).length;
            const pctProgresso = total > 0 ? Math.min(100, Math.round((concluidos / total) * 100)) : 0;

            const pctSpan = card.querySelector(".ebook-progress-pct") || card.querySelector(".info span:last-child");
            if (pctSpan) setText(pctSpan, `${pctProgresso}%`);
            const progressBar = card.querySelector(".progress-bar");
            if (progressBar) progressBar.style.width = `${pctProgresso}%`;
        } catch {}
    });
}

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

    atualizarProgressoConteudos();
    applyTiltAll('.ebook-card');
}
