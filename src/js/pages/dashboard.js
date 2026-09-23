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
import { initModulosView, abrirModulos, abrirLeituraPdf } from '../spa/views/modulosView.js';

import { initCronogramaView, renderCronograma } from '../spa/views/cronogramaView.js';
import { initDesempenhoView, renderDesempenho } from '../spa/views/desempenhoView.js';
import { initQuestoesView, renderQuestoes } from '../spa/views/questoesView.js';
import { initQuestoesModulosView, abrirQuestoesModulos } from '../spa/views/questoesModulosView.js';

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
            document.body.classList.add('no-sidebar');
            if (params && params.conteudoId) {
                abrirModulos(params.conteudoId);
            } else {
                router.navigateTo('conteudos');
            }
        },
        onLeave: () => {
            document.body.classList.remove('no-sidebar');
        }
    });

    router.register('leitura-pdf', {
        viewSelector: '#view-leitura-pdf',
        navKey: 'conteudos',
        onEnter: (params) => {
            document.body.classList.add('no-sidebar');
            if (params && params.conteudoId) {
                abrirLeituraPdf(params.conteudoId, params.modulo || params.moduloNumero);
            } else {
                router.navigateTo('conteudos');
            }
        },
        onLeave: () => {
            document.body.classList.remove('no-sidebar');
        }
    });


    router.register('questoes', {
        viewSelector: '#view-questoes',
        navKey: 'questoes',
        onEnter: () => {
            renderQuestoes();
        }
    });

    router.register('questoes-modulos', {
        viewSelector: '#view-questoes-modulos',
        navKey: 'questoes', // Mantém Questões destacado no menu lateral
        onEnter: (params) => {
            document.body.classList.add('no-sidebar');
            if (params && params.materiaId) {
                abrirQuestoesModulos(params.materiaId);
            } else {
                router.navigateTo('questoes');
            }
        },
        onLeave: () => {
            document.body.classList.remove('no-sidebar');
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
    initQuestoesView(router);
    initQuestoesModulosView(router);
    initCronogramaView(router);
    initDesempenhoView(router);

    // 3. Inicia o router (interpreta hash atual e configura popstate)
    router.init();
});
