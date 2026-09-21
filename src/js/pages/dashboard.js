import { ready, qs, setText, setHTML } from '../utils/dom.js';
import { getCurrentUser, logout } from '../services/authService.js';
import { getGamificationData, getTaxaAproveitamento } from '../services/gamificationService.js';
import { getTarefas } from '../services/cronogramaService.js';
import { ROUTES } from '../constants/routes.js';

ready(async () => {
    const user = localStorage.getItem("aprovadrive_auth_user");
    let userObject = null;
    try {
        userObject = user ? JSON.parse(user) : null;
    } catch {
        userObject = null;
    }
    
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

    // Carrega dados e missões de hoje diretamente da API
    try {
        const payload = await getTarefas();
        if (payload) {
            // Sincroniza XP se disponível
            if (payload.usuario && typeof payload.usuario.exp === 'number') {
                const totalXp = payload.usuario.exp;
                const xpMaximo = gamification?.xpMaximo || 1000;
                setText('.xp-topo span:last-child', `${totalXp} / ${xpMaximo}`);
                const percentXp = Math.min(100, Math.round((totalXp / xpMaximo) * 100));
                const barraXp = qs('.barra span');
                if (barraXp) {
                    barraXp.style.width = `${percentXp}%`;
                }
                const estatisticaXp = qs('.estatistica strong:last-child');
                if (estatisticaXp) {
                    setText(estatisticaXp, `${totalXp} XP`);
                }
            }

            // Renderiza as missões de hoje dinamicamente
            const missaoContainer = qs('.missao');
            if (missaoContainer && payload.tarefasDoDia && payload.tarefasDoDia.length > 0) {
                const headerHtml = `
                    <div class="titulo-card">
                        <h2><span class="material-symbols-outlined icone-inline">target</span> Missão de hoje</h2>
                        <a href="./cronograma.html" class="ver">Ver cronograma</a>
                    </div>
                `;

                const tasksHtml = payload.tarefasDoDia.map((t) => {
                    const isDone = Boolean(t.concluida || t.status === 'done');
                    const isInProgress = !isDone && t.status === 'in_progress';
                    const icon = isDone 
                        ? '<i class="fa-solid fa-check"></i>' 
                        : isInProgress 
                            ? '<i class="fa-solid fa-play"></i>' 
                            : '<i class="fa-solid fa-book-open"></i>';
                    const iconStyle = isDone 
                        ? 'background: #e8f5e9; color: #16a34a;' 
                        : isInProgress 
                            ? 'background: #e0f2fe; color: #0284c7;' 
                            : 'background: #f1f5f9; color: #64748b;';

                    const statusBadge = isDone 
                        ? '<span style="color: #16a34a; font-size: 11px; font-weight: bold; margin-left: 8px;">Concluída</span>' 
                        : isInProgress 
                            ? '<span style="color: #0284c7; font-size: 11px; font-weight: bold; margin-left: 8px;">Em andamento</span>' 
                            : '';

                    return `
                        <div class="tarefa" onclick="window.location.href='./cronograma.html'">
                            <div class="check" style="${iconStyle}">
                                ${icon}
                            </div>
                            <div style="flex: 1;">
                                <strong>${escapeHtml(t.titulo)} ${statusBadge}</strong>
                                <span>${escapeHtml(t.duracao || '20 min')} • +${t.xp_reward || 30} XP</span>
                            </div>
                        </div>
                    `;
                }).join('');

                missaoContainer.innerHTML = headerHtml + tasksHtml;
            }
        }
    } catch (err) {
        console.warn('Não foi possível carregar missões dinâmicas no dashboard:', err.message);
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

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
}

