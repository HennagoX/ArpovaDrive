/**
 * Ponto de Entrada da SPA (Single Page Application) AprovaDrive
 * 
 * Orquestra as telas modulares:
 * - 'inicio' (Dashboard principal, gamificação e missões)
 * - 'conteudos' (Biblioteca de conteúdos com busca e filtros)
 * - 'modulos' (Módulos do conteúdo selecionado com cards reutilizáveis e bloqueios)
 */

import { ready } from '../utils/dom.js';
import { router } from '../spa/router.js';
import { initDashboardView, renderDashboard } from '../spa/views/dashboardView.js';
import { initConteudosView, renderConteudos } from '../spa/views/conteudosView.js';
import { initModulosView, abrirModulos } from '../spa/views/modulosView.js';
import { initCronogramaView, renderCronograma } from '../spa/views/cronogramaView.js';
import { initDesempenhoView, renderDesempenho } from '../spa/views/desempenhoView.js';

ready(() => {
    // 1. Registra as visões modulares no SPA Router
    router.register('inicio', {
        viewSelector: '#view-inicio',
        navKey: 'inicio',
        onEnter: () => {
            renderDashboard();
        }
    });

    router.register('conteudos', {
        viewSelector: '#view-conteudos',
        navKey: 'conteudos',
        onEnter: () => {
            renderConteudos();
        }
    });

    router.register('modulos', {
        viewSelector: '#view-modulos',
        navKey: 'conteudos', // Mantém Conteúdos destacado no menu lateral
        onEnter: (params) => {
            if (params && params.conteudoId) {
                abrirModulos(params.conteudoId);
            } else {
                router.navigateTo('conteudos');
            }
        }
    });

    router.register('cronograma', {
        viewSelector: '#view-cronograma',
        navKey: 'cronograma',
        onEnter: () => {
            renderCronograma();
        }
    });

    router.register('desempenho', {
        viewSelector: '#view-desempenho',
        navKey: 'desempenho',
        onEnter: () => {
            renderDesempenho();
        }
    });

    // 2. Inicializa controladores de cada visão modular
    initDashboardView(router);
    initConteudosView(router);
    initModulosView(router);
    initCronogramaView(router);
    initDesempenhoView(router);

    // 3. Inicia o router (interpreta hash atual e configura popstate)
    router.init();
});
