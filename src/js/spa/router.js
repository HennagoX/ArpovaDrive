/**
 * Router Modular para SPA (Single Page Application) do AprovaDrive
 * 
 * Gerencia a navegação entre as telas 'inicio', 'conteudos' e a sub-tela 'modulos',
 * sincronizando a visibilidade das seções, classes ativas na barra de navegação
 * e o histórico do navegador (hash / popstate).
 */

import { qs, qsa } from '../utils/dom.js';

class SpaRouter {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.currentParams = {};
        this.navItems = [];

        this.handlePopState = this.handlePopState.bind(this);
    }

    /**
     * Registra uma rota na SPA
     * @param {string} name - Nome identificador da rota ('inicio', 'conteudos', 'modulos')
     * @param {Object} config - Configurações da rota
     * @param {string} config.viewSelector - Seletor do elemento DOM da tela
     * @param {Function} [config.onEnter] - Callback ao entrar na rota
     * @param {Function} [config.onLeave] - Callback ao sair da rota
     * @param {string} [config.navKey] - Identificador correspondente no menu lateral
     */
    register(name, config) {
        this.routes[name] = {
            name,
            viewSelector: config.viewSelector,
            onEnter: config.onEnter || null,
            onLeave: config.onLeave || null,
            navKey: config.navKey || name
        };
    }

    /**
     * Inicializa o router e escuta eventos de navegação
     */
    init() {
        this.navItems = qsa('[data-nav]');

        // Vincula cliques em links com data-nav
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-nav]');
            if (navLink) {
                const targetRoute = navLink.dataset.nav;
                if (this.routes[targetRoute]) {
                    e.preventDefault();
                    this.navigateTo(targetRoute);
                }
            }
        });

        // Escuta eventos de avançar e voltar do navegador
        window.addEventListener('popstate', this.handlePopState);

        // Processa rota inicial baseada na URL atual
        this.resolveCurrentUrl(false);
    }

    /**
     * Navega para uma rota programaticamente
     * @param {string} routeName 
     * @param {Object} [params] 
     * @param {boolean} [pushState=true] 
     */
    navigateTo(routeName, params = {}, pushState = true) {
        const route = this.routes[routeName];
        if (!route) {
            console.warn(`[SpaRouter] Rota não encontrada: ${routeName}`);
            return;
        }

        // Executa hook de saída da rota anterior
        if (this.currentRoute && this.routes[this.currentRoute]?.onLeave) {
            this.routes[this.currentRoute].onLeave();
        }

        // Oculta todas as telas registradas
        Object.values(this.routes).forEach((r) => {
            const el = qs(r.viewSelector);
            if (el) {
                el.style.display = 'none';
            }
        });

        // Exibe a tela da rota atual com efeito de fade
        const targetEl = qs(route.viewSelector);
        if (targetEl) {
            targetEl.style.display = 'block';
            targetEl.classList.remove('spa-view');
            void targetEl.offsetWidth; // Força reflow para reiniciar animação
            targetEl.classList.add('spa-view');
        }

        this.currentRoute = routeName;
        this.currentParams = params;

        // Controle da sidebar no modo foco para a tela de módulos
        if (typeof document !== 'undefined' && document.body) {
            if (routeName === 'modulos') {
                document.body.classList.add('no-sidebar');
            } else {
                document.body.classList.remove('no-sidebar');
            }
        }

        // Atualiza marcação ativa no menu lateral
        this.updateNavHighlight(route.navKey);

        // Atualiza histórico do navegador
        if (pushState) {
            const hash = this.buildHash(routeName, params);
            if (window.location.hash !== hash) {
                history.pushState({ route: routeName, params }, '', hash);
            }
        }

        // Executa hook de entrada da nova rota
        if (typeof route.onEnter === 'function') {
            route.onEnter(params);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Atualiza o destaque ativo no menu lateral
     * @param {string} navKey 
     */
    updateNavHighlight(navKey) {
        this.navItems.forEach((item) => {
            if (item.dataset.nav === navKey) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Monta o hash da URL para a rota e parâmetros
     */
    buildHash(routeName, params = {}) {
        if (routeName === 'modulos' && params.conteudoId) {
            return `#modulo=${encodeURIComponent(params.conteudoId)}`;
        }
        if (routeName === 'conteudos') {
            return '#conteudos';
        }
        if (routeName === 'cronograma') {
            return '#cronograma';
        }
        if (routeName === 'desempenho') {
            return '#desempenho';
        }
        return '#inicio';
    }

    /**
     * Resolve a rota baseada no hash da URL atual
     */
    resolveCurrentUrl(pushState = false) {
        const hash = window.location.hash || '';

        // Rota de módulo específico
        const moduloMatch = hash.match(/#modulo=([^&]+)/);
        if (moduloMatch && moduloMatch[1]) {
            const conteudoId = decodeURIComponent(moduloMatch[1]);
            this.navigateTo('modulos', { conteudoId }, pushState);
            return;
        }

        // Rota de conteúdos
        if (hash === '#conteudos' || hash.startsWith('#conteudos')) {
            this.navigateTo('conteudos', {}, pushState);
            return;
        }

        // Rota de cronograma
        if (hash === '#cronograma' || hash.startsWith('#cronograma')) {
            this.navigateTo('cronograma', {}, pushState);
            return;
        }

        // Rota de desempenho
        if (hash === '#desempenho' || hash.startsWith('#desempenho')) {
            this.navigateTo('desempenho', {}, pushState);
            return;
        }

        // Padrão: tela de início (dashboard)
        this.navigateTo('inicio', {}, pushState);
    }

    handlePopState(event) {
        if (event.state && event.state.route) {
            this.navigateTo(event.state.route, event.state.params || {}, false);
        } else {
            this.resolveCurrentUrl(false);
        }
    }
}

export const router = new SpaRouter();
