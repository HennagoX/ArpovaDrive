
import { qs, setText } from '../../utils/dom.js';
import { getCurrentUser } from '../../services/authService.js';
import { getGamificationData, getTaxaAproveitamento } from '../../services/gamificationService.js';
import { SELECTORS } from '../../constants/selectors.js';

let initialized = false;

export function initDesempenhoView(router) {
    if (initialized) return;
    initialized = true;

    const btnAjustarCronograma = qs('#view-desempenho .ia-botao');
    if (btnAjustarCronograma && router) {
        btnAjustarCronograma.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigateTo('cronograma');
        });
    }
}

export function renderDesempenho() {
    const user = getCurrentUser();
    const tituloSaudacao = qs('#inicio-saudacao');
    const subtitulo = qs('#inicio-subtitulo');

    if (tituloSaudacao) {
        if (user && user.nome) {
            setText(tituloSaudacao, `Desempenho de ${user.nome}`);
        } else {
            setText(tituloSaudacao, 'Relatório de Desempenho');
        }
    }

    if (subtitulo) {
        setText(subtitulo, 'Monitore suas estatísticas detalhadas e prepare-se para o DETRAN');
    }

    const gamification = getGamificationData();
    const taxa = getTaxaAproveitamento();

    const taxaEl = qs(SELECTORS.DESEMPENHO_APROVEITAMENTO);
    if (taxaEl) {
        setText(taxaEl, `${taxa}%`);
    }

    const circuloEl = qs(SELECTORS.DESEMPENHO_CIRCULO);
    const circuloTaxaEl = qs('#circuloTaxa');
    const circuloStatusEl = qs('#circuloStatusLabel');
    const circuloDescEl = qs('#circuloStatusDesc');

    if (circuloTaxaEl) {
        setText(circuloTaxaEl, `${taxa}%`);
    }

    if (circuloEl) {
        const deg = Math.round((taxa / 100) * 360);
        circuloEl.style.background = `conic-gradient(var(--brand-green, #16a34a) 0deg ${deg}deg, #e5e7eb ${deg}deg 360deg)`;
    }

    if (circuloStatusEl) {
        if (taxa >= 70) {
            setText(circuloStatusEl, 'Apto');
            circuloStatusEl.style.color = '#16a34a';
        } else if (taxa >= 50) {
            setText(circuloStatusEl, 'Médio');
            circuloStatusEl.style.color = '#f59e0b';
        } else {
            setText(circuloStatusEl, 'Atenção');
            circuloStatusEl.style.color = '#dc2626';
        }
    }

    if (circuloDescEl) {
        if (taxa >= 70) {
            setText(circuloDescEl, 'Você atingiu a pontuação mínima para aprovação (70%), mas recomendamos reforçar matérias críticas para ter mais segurança.');
        } else {
            setText(circuloDescEl, 'Sua pontuação atual está abaixo de 70%. Priorize as matérias em que você teve maior índice de erro para garantir sua aprovação.');
        }
    }

    if (gamification) {
        const totalQuestoesEl = qs(SELECTORS.DESEMPENHO_QUESTOES);
        if (totalQuestoesEl) {
            setText(totalQuestoesEl, String(gamification.questoesTotais ?? 124));
        }

        const totalAcertosEl = qs(SELECTORS.DESEMPENHO_ACERTOS);
        if (totalAcertosEl) {
            setText(totalAcertosEl, String(gamification.acertos ?? 86));
        }

        const erros = Math.max(0, (gamification.questoesTotais ?? 124) - (gamification.acertos ?? 86));
        const totalErrosEl = qs(SELECTORS.DESEMPENHO_ERROS);
        if (totalErrosEl) {
            setText(totalErrosEl, String(erros));
        }

        const totalSimuladosEl = qs(SELECTORS.DESEMPENHO_SIMULADOS);
        if (totalSimuladosEl) {
            setText(totalSimuladosEl, String(gamification.simulados ?? 8));
        }
    }
}
