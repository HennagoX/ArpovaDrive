import { ready, qs, setText, setHTML } from '../utils/dom.js';
import { getCurrentUser, logout } from '../services/authService.js';
import { getGamificationData, getTaxaAproveitamento } from '../services/gamificationService.js';
import { ROUTES } from '../constants/routes.js';

ready(() => {
    const user = localStorage.getItem("aprovadrive_auth_user")
    const userObject = JSON.parse(user);
    
    if (userObject && userObject.nome) {
        setHTML('.topo h1', `Olá, ${userObject.nome}! <span class="material-symbols-outlined icone-inline">waving_hand</span>`);
        setText('.perfil-nome strong', userObject.nome);
    }

    const gamification = getGamificationData();
    if (gamification) {
        setText('.nivel h2', `Nível ${gamification.nivel} — ${gamification.tituloNivel}`);
        setText('.xp-topo span:last-child', `${gamification.xpAtual} / ${gamification.xpMaximo}`);
        const percentXp = Math.min(100, Math.round((gamification.xpAtual / gamification.xpMaximo) * 100));
        const barraXp = qs('.barra span');
        if (barraXp) {
            barraXp.style.width = `${percentXp}%`;
        }

        setText('.sequencia h3', `${gamification.diasOfensiva} dias de sequência!`);

        const taxa = getTaxaAproveitamento();
        setText('.circulo-interno strong', `${taxa}%`);
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
