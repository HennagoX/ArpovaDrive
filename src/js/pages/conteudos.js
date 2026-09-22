import { ready, setText, qsa, qs } from "../utils/dom.js";
import { getCurrentUser, logout } from '../services/authService.js';
import { ROUTES } from '../constants/routes.js';
import {
    getConteudoById,
    getModulosByConteudoId,
    LOCKED_MODULE_MESSAGE,
    CONTEUDOS_DATA
} from '../services/conteudosService.js';
import { createModuleCard } from '../components/moduleCard.js';

ready(() => {
    // -------------------------------------------------------------
    // 1. INFORMAÇÕES DE USUÁRIO E AUTENTICAÇÃO
    // -------------------------------------------------------------
    const user = getCurrentUser();

    if (user && user.nome) {
        setText('.perfil-nome strong', user.nome);
    }

    const perfilBtn = qs('.perfil');
    if (perfilBtn) {
        perfilBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
            window.location.href = ROUTES.HOME;
        });
    }

    // -------------------------------------------------------------
    // 2. ELEMENTOS DO DOM (SPA & BUSCA)
    // -------------------------------------------------------------
    const viewConteudos = qs("#view-conteudos");
    const viewModulos = qs("#view-modulos");
    const pageTitle = qs("#page-title");
    const pageSubtitle = qs("#page-subtitle");

    // Elementos da Visão de Módulos
    const btnVoltarConteudos = qs("#btn-voltar-conteudos");
    const breadcrumbRootBtn = qs("#breadcrumb-root-btn");
    const breadcrumbTitle = qs("#modulos-breadcrumb-title");
    const modulesListContainer = qs("#modules-list");

    const heroCover = qs("#modulo-hero-cover");
    const heroIcon = qs("#modulo-hero-icon");
    const heroCategory = qs("#modulo-hero-category");
    const heroTitle = qs("#modulo-hero-title");
    const heroDesc = qs("#modulo-hero-desc");
    const heroLiberados = qs("#modulo-hero-liberados");
    const heroBloqueados = qs("#modulo-hero-bloqueados");
    const heroProgressPct = qs("#modulo-hero-progress-pct");
    const heroProgressFill = qs("#modulo-hero-progress-fill");
    const modulosContadorBadge = qs("#modulos-contador-badge");
    const toastContainer = qs("#toast-container");

    // Elementos da Visão de Conteúdos
    const search = qs("#search");
    const ebooks = qsa(".ebook");
    const filters = qsa(".filter");
    const contador = qs("#contador");
    const readBtns = qsa(".read-btn");

    // -------------------------------------------------------------
    // 3. NAVEGAÇÃO SPA (CONTEÚDOS <-> MÓDULOS)
    // -------------------------------------------------------------

    /**
     * Alterna para a visualização dos módulos de um conteúdo específico
     * @param {string} conteudoId 
     * @param {boolean} pushState 
     */
    function abrirModulos(conteudoId, pushState = true) {
        const conteudo = getConteudoById(conteudoId);
        if (!conteudo) {
            console.warn(`Conteúdo com ID "${conteudoId}" não encontrado.`);
            return;
        }

        const modulos = getModulosByConteudoId(conteudoId);

        // Atualiza títulos do cabeçalho global
        if (pageTitle) setText(pageTitle, conteudo.titulo);
        if (pageSubtitle) setText(pageSubtitle, `Módulos da trilha de ${conteudo.titulo}`);

        // Atualiza Breadcrumb
        if (breadcrumbTitle) setText(breadcrumbTitle, conteudo.titulo);

        // Atualiza o Hero Card do conteúdo selecionado
        if (heroCover) {
            heroCover.className = `hero-cover ${conteudo.cor || 'green'}`;
        }
        if (heroIcon) {
            heroIcon.className = conteudo.icone || 'fa-solid fa-book-open';
        }
        if (heroCategory) setText(heroCategory, conteudo.categoria);
        if (heroTitle) setText(heroTitle, conteudo.titulo);
        if (heroDesc) setText(heroDesc, conteudo.descricao);

        // Estatísticas dos módulos
        const total = modulos.length;
        const bloqueados = modulos.filter(m => m.bloqueado).length;
        const liberados = total - bloqueados;
        const pctProgresso = total > 0 ? Math.round((liberados / total) * 100) : 0;

        if (heroLiberados) setText(heroLiberados, `${liberados} ${liberados === 1 ? 'Módulo Liberado' : 'Módulos Liberados'}`);
        if (heroBloqueados) setText(heroBloqueados, `${bloqueados} ${bloqueados === 1 ? 'Módulo Bloqueado' : 'Módulos Bloqueados'}`);
        if (heroProgressPct) setText(heroProgressPct, `${pctProgresso}%`);
        if (heroProgressFill) heroProgressFill.style.width = `${pctProgresso}%`;
        if (modulosContadorBadge) setText(modulosContadorBadge, `${total} ${total === 1 ? 'módulo' : 'módulos'}`);

        // Renderiza os cards reutilizáveis de módulos
        if (modulesListContainer) {
            modulesListContainer.innerHTML = '';

            modulos.forEach((modulo) => {
                const card = createModuleCard(modulo, {
                    onRead: (mod, btn) => {
                        // Por enquanto os módulos não redirecionam para nenhum lugar
                        showToast(
                            `Módulo ${mod.numero}: "${mod.titulo}". A leitura estará disponível em breve!`,
                            'info',
                            'fa-solid fa-book-open'
                        );
                    },
                    onLockedClick: (mod, cardEl) => {
                        // Mensagem obrigatória para quando tentar ler o módulo bloqueado:
                        showToast(
                            LOCKED_MODULE_MESSAGE,
                            'locked',
                            'fa-solid fa-lock'
                        );
                    }
                });

                if (card) {
                    modulesListContainer.appendChild(card);
                }
            });
        }

        // Alterna visibilidade entre as sub-telas SPA
        document.body.classList.add('no-sidebar');
        if (viewConteudos) viewConteudos.style.display = 'none';
        if (viewModulos) {
            viewModulos.style.display = 'block';
            viewModulos.classList.remove('spa-view');
            void viewModulos.offsetWidth;
            viewModulos.classList.add('spa-view');
        }

        // Atualiza histórico do navegador para permitir Voltar/Avançar
        if (pushState) {
            const hash = `#modulo=${encodeURIComponent(conteudoId)}`;
            if (window.location.hash !== hash) {
                history.pushState({ view: 'modulos', conteudoId }, '', hash);
            }
        }

        // Rola suavemente para o topo do conteúdo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Retorna da tela de módulos para a biblioteca de conteúdos (SPA)
     * @param {boolean} pushState 
     */
    function voltarParaConteudos(pushState = true) {
        document.body.classList.remove('no-sidebar');
        if (viewModulos) viewModulos.style.display = 'none';
        if (viewConteudos) {
            viewConteudos.style.display = 'block';
            viewConteudos.classList.remove('spa-view');
            void viewConteudos.offsetWidth;
            viewConteudos.classList.add('spa-view');
        }

        if (pageTitle) setText(pageTitle, 'Biblioteca de conteúdos');
        if (pageSubtitle) setText(pageSubtitle, 'Estude os principais assuntos para sua prova do DETRAN.');

        if (pushState && window.location.hash) {
            history.pushState({ view: 'conteudos' }, '', window.location.pathname);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Vincula cliques para voltar
    if (btnVoltarConteudos) {
        btnVoltarConteudos.addEventListener('click', () => voltarParaConteudos(true));
    }
    if (breadcrumbRootBtn) {
        breadcrumbRootBtn.addEventListener('click', () => voltarParaConteudos(true));
    }

    // Vincula botões "Começar a ler" / "Continuar leitura" dos cards de ebooks
    readBtns?.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const conteudoId = btn.name || btn.dataset.id;
            if (conteudoId) {
                abrirModulos(conteudoId, true);
            }
        });
    });

    // Também permite clicar diretamente no card para abrir os módulos
    ebooks.forEach((card) => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            // Se já clicou no botão interno, não dispara duas vezes
            if (e.target.closest('.read-btn')) return;
            const conteudoId = card.dataset.id;
            if (conteudoId) {
                abrirModulos(conteudoId, true);
            }
        });
    });

    // Trata botões de Voltar / Avançar do navegador (popstate)
    window.addEventListener('popstate', (e) => {
        tratarRotaAtual(false);
    });

    /**
     * Lê o hash da URL para abrir o módulo correspondente caso recarregue ou venha por link direto
     * Ex: #modulo=CodigoTransito
     */
    function tratarRotaAtual(pushState = false) {
        const hash = window.location.hash || '';
        const match = hash.match(/#modulo=([^&]+)/);
        if (match && match[1]) {
            const conteudoId = decodeURIComponent(match[1]);
            abrirModulos(conteudoId, pushState);
        } else {
            voltarParaConteudos(pushState);
        }
    }

    // Inicializa a rota atual
    tratarRotaAtual(false);

    // -------------------------------------------------------------
    // 4. SISTEMA DE FEEDBACK FLUTUANTE (TOAST)
    // -------------------------------------------------------------
    let toastTimeout = null;

    /**
     * Exibe notificação flutuante acessível para o usuário
     * @param {string} mensagem 
     * @param {'info'|'locked'|'success'} tipo 
     * @param {string} iconeClass 
     */
    function showToast(mensagem, tipo = 'info', iconeClass = 'fa-solid fa-circle-info') {
        if (!toastContainer) return;

        toastContainer.innerHTML = '';
        if (toastTimeout) clearTimeout(toastTimeout);

        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.setAttribute('role', 'alert');

        toast.innerHTML = `
            <i class="${iconeClass}"></i>
            <span>${escapeToast(mensagem)}</span>
            <button type="button" class="toast-close" title="Fechar">&times;</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.remove();
            });
        }

        toastContainer.appendChild(toast);

        toastTimeout = setTimeout(() => {
            toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3800);
    }

    function escapeToast(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // -------------------------------------------------------------
    // 5. FILTROS E BUSCA NA LISTAGEM DE E-BOOKS
    // -------------------------------------------------------------
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
});