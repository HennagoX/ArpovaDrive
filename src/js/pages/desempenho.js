import { ready, qs, setText } from '../utils/dom.js';
import { getCurrentUser, logout } from '../services/authService.js';
import { getGamificationData, getTaxaAproveitamento } from '../services/gamificationService.js';
import { SELECTORS } from '../constants/selectors.js';
import { ROUTES } from '../constants/routes.js';

ready(() => {
    const user = getCurrentUser();
    if (user && user.nome) {
        setText('.topo h1', `Desempenho de ${user.nome}`);
        setText('.perfil-nome strong', user.nome);
    }

    const gamification = getGamificationData();
    if (gamification) {
        const taxa = getTaxaAproveitamento();
        setText(SELECTORS.DESEMPENHO_APROVEITAMENTO, `${taxa}%`);

        const circulo = qs(SELECTORS.DESEMPENHO_CIRCULO);
        if (circulo) {
            const deg = Math.round((taxa / 100) * 360);
            circulo.style.background = `conic-gradient(var(--brand-green, #16a34a) 0deg ${deg}deg, #e5e7eb ${deg}deg 360deg)`;
        }

        setText(SELECTORS.DESEMPENHO_QUESTOES, String(gamification.questoesTotais));
        setText(SELECTORS.DESEMPENHO_ACERTOS, String(gamification.acertos));

        const erros = Math.max(0, gamification.questoesTotais - gamification.acertos);
        setText(SELECTORS.DESEMPENHO_ERROS, String(erros));

        setText(SELECTORS.DESEMPENHO_SIMULADOS, String(gamification.simulados));
    }

    const perfilBtn = qs('.perfil');
    if (perfilBtn) {
        perfilBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
            window.location.href = ROUTES.HOME;
        });
    }
});
