
import { qs, qsa } from '../utils/dom.js';

class SpaRouter {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.currentParams = {};
        this.navItems = [];

        this.handlePopState = this.handlePopState.bind(this);
    }

    register(name, config) {
        this.routes[name] = {
            name,
            viewSelector: config.viewSelector,
            onEnter: config.onEnter || null,
            onLeave: config.onLeave || null,
            navKey: config.navKey || name
        };
    }

    init() {
        this.navItems = qsa('[data-nav]');

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

        window.addEventListener('popstate', this.handlePopState);

        this.resolveCurrentUrl(false);
    }

    navigateTo(routeName, params = {}, pushState = true) {
        const route = this.routes[routeName];
        if (!route) {
            console.warn(`[SpaRouter] Rota não encontrada: ${routeName}`);
            return;
        }

        if (this.currentRoute && this.routes[this.currentRoute]?.onLeave) {
            this.routes[this.currentRoute].onLeave();
        }

        Object.values(this.routes).forEach((r) => {
            const el = qs(r.viewSelector);
            if (el) {
                el.style.display = 'none';
            }
        });

        const targetEl = qs(route.viewSelector);
        if (targetEl) {
            targetEl.style.display = 'block';
            targetEl.classList.remove('spa-view');
            void targetEl.offsetWidth;
            targetEl.classList.add('spa-view');
        }

        this.currentRoute = routeName;
        this.currentParams = params;

        if (typeof document !== 'undefined' && document.body) {
            if (routeName === 'modulos' || routeName === 'questoes-modulos' || routeName === 'leitura-pdf') {
                document.body.classList.add('no-sidebar');
            } else {
                document.body.classList.remove('no-sidebar');
            }
        }

        this.updateNavHighlight(route.navKey);

        if (pushState) {
            const hash = this.buildHash(routeName, params);
            if (window.location.hash !== hash) {
                history.pushState({ route: routeName, params }, '', hash);
            }
        }

        if (typeof route.onEnter === 'function') {
            route.onEnter(params);
        }

        window.scrollTo(0, 0);
    }

    updateNavHighlight(navKey) {
        this.navItems.forEach((item) => {
            if (item.dataset.nav === navKey) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    buildHash(routeName, params = {}) {
        if (routeName === 'leitura-pdf' && params.conteudoId && params.moduloNumero) {
            return `#leitura=${encodeURIComponent(params.conteudoId)}&modulo=${encodeURIComponent(params.moduloNumero)}`;
        }
        if (routeName === 'modulos' && params.conteudoId) {
            return `#modulo=${encodeURIComponent(params.conteudoId)}`;
        }
        if (routeName === 'questoes-modulos' && params.materiaId) {
            return `#questoes-materia=${encodeURIComponent(params.materiaId)}`;
        }
        if (routeName === 'conteudos') {
            return '#conteudos';
        }
        if (routeName === 'questoes') {
            return '#questoes';
        }
        if (routeName === 'cronograma') {
            return '#cronograma';
        }
        if (routeName === 'desempenho') {
            return '#desempenho';
        }
        return '#inicio';
    }

    resolveCurrentUrl(pushState = false) {
        const hash = window.location.hash || '';

        const leituraMatch = hash.match(/#leitura=([^&]+)&modulo=([^&]+)/);
        if (leituraMatch && leituraMatch[1] && leituraMatch[2]) {
            const conteudoId = decodeURIComponent(leituraMatch[1]);
            const moduloNumero = Number(decodeURIComponent(leituraMatch[2]));
            this.navigateTo('leitura-pdf', { conteudoId, moduloNumero }, pushState);
            return;
        }

        const moduloMatch = hash.match(/#modulo=([^&]+)/);
        if (moduloMatch && moduloMatch[1]) {
            const conteudoId = decodeURIComponent(moduloMatch[1]);
            this.navigateTo('modulos', { conteudoId }, pushState);
            return;
        }

        const questoesMatch = hash.match(/#questoes-materia=([^&]+)/);
        if (questoesMatch && questoesMatch[1]) {
            const materiaId = decodeURIComponent(questoesMatch[1]);
            this.navigateTo('questoes-modulos', { materiaId }, pushState);
            return;
        }

        if (hash === '#conteudos' || hash.startsWith('#conteudos')) {
            this.navigateTo('conteudos', {}, pushState);
            return;
        }

        if (hash === '#questoes' || hash.startsWith('#questoes')) {
            this.navigateTo('questoes', {}, pushState);
            return;
        }

        if (hash === '#cronograma' || hash.startsWith('#cronograma')) {
            this.navigateTo('cronograma', {}, pushState);
            return;
        }

        if (hash === '#desempenho' || hash.startsWith('#desempenho')) {
            this.navigateTo('desempenho', {}, pushState);
            return;
        }

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
