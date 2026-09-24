import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem } from '../utils/storage.js';
import { qs, setText } from '../utils/dom.js';

export const TITULOS_NIVEL = [
    'Futuro Condutor',            // Lv 1
    'Aluno em Formação',          // Lv 2
    'Aprendiz da Legislação',     // Lv 3
    'Conhecedor de Placas',       // Lv 4
    'Motorista Consciente',       // Lv 5
    'Piloto Preventivo',          // Lv 6
    'Motorista em Treinamento',   // Lv 7
    'Condutor Experiente',        // Lv 8
    'Mestre da Direção Defensiva',// Lv 9
    'Perito no Trânsito',         // Lv 10
    'Piloto de Elite',            // Lv 11
    'Ás do Volante',              // Lv 12
    'Especialista DETRAN',        // Lv 13
    'Instrutor Honorário',        // Lv 14
    'Lenda do Asfalto'            // Lv 15+
];

export function getXpRequiredForLevel(level) {
    if (level <= 1) return 0;
    return 100 * Math.pow(level - 1, 2);
}

export function getLevelInfo(totalExp = 0) {
    const exp = Math.max(0, Number(totalExp) || 0);
    let level = 1;
    while (getXpRequiredForLevel(level + 1) <= exp) {
        level++;
    }
    const currentBase = getXpRequiredForLevel(level);
    const nextBase = getXpRequiredForLevel(level + 1);
    const xpInLevel = exp - currentBase;
    const xpNeeded = nextBase - currentBase;
    const pct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
    const titulo = TITULOS_NIVEL[Math.min(level - 1, TITULOS_NIVEL.length - 1)];

    return {
        nivel: level,
        tituloNivel: titulo,
        totalExp: exp,
        xpNoNivel: xpInLevel,
        xpNecessarioNivel: xpNeeded,
        progressoPct: pct
    };
}

const DEFAULT_GAMIFICATION = {
    nivel: 1,
    tituloNivel: 'Futuro Condutor',
    totalExp: 0,
    xpAtual: 0,
    xpMaximo: 100,
    diasOfensiva: 5,
    questoesTotais: 124,
    acertos: 86,
    simulados: 8
};

export function getGamificationData() {
    return getLocalItem(STORAGE_KEYS.GAMIFICATION, DEFAULT_GAMIFICATION);
}

export function atualizarXpNoLocalStorage(params = {}) {
    const { xpGanho = 0, expTotal = null, lv = null, tituloNivel = null, taskId = null } = params;

    let totalExp;
    if (expTotal !== null && expTotal !== undefined && !isNaN(Number(expTotal))) {
        totalExp = Math.max(0, Number(expTotal));
    } else {
        // Incrementa em cima do maior XP atual existente em qualquer chave do localStorage
        const gData = getGamificationData();
        const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
        const directXp = getLocalItem(STORAGE_KEYS.XP, null);
        const cronograma = getLocalItem(STORAGE_KEYS.CRONOGRAMA, null);
        const rawStorageExp = typeof localStorage !== 'undefined' ? localStorage.getItem('exp') : null;
        const rawStorageUserExp = typeof localStorage !== 'undefined' ? localStorage.getItem('aprovadrive_user_exp') : null;
        const rawStorageXp = typeof localStorage !== 'undefined' ? localStorage.getItem('aprovadrive_xp') : null;

        const currentExp = Math.max(
            Number(gData?.totalExp || 0),
            Number(authUser?.exp || 0),
            Number(cronograma?.usuario?.exp || 0),
            Number(directXp || 0),
            Number(rawStorageExp || 0),
            Number(rawStorageUserExp || 0),
            Number(rawStorageXp || 0),
            0
        );

        totalExp = Math.max(0, currentExp + Number(xpGanho || 0));
    }

    const levelInfo = getLevelInfo(totalExp);
    const nivelFinal = lv !== null && lv !== undefined ? Number(lv) : levelInfo.nivel;
    const tituloFinal = tituloNivel || levelInfo.tituloNivel;

    // 1. Atualiza objeto de gamificação no localStorage
    const gamification = getGamificationData();
    gamification.totalExp = totalExp;
    gamification.nivel = nivelFinal;
    gamification.lv = nivelFinal;
    gamification.tituloNivel = tituloFinal;
    gamification.xpAtual = levelInfo.xpNoNivel;
    gamification.xpMaximo = levelInfo.xpNecessarioNivel;
    gamification.progressoPct = levelInfo.progressoPct;
    setLocalItem(STORAGE_KEYS.GAMIFICATION, gamification);

    // 2. Salva chaves diretas no localStorage
    setLocalItem(STORAGE_KEYS.XP, totalExp);
    setLocalItem(STORAGE_KEYS.LV, nivelFinal);

    // 3. Atualiza lv e exp no objeto de usuário autenticado (AUTH_USER)
    try {
        const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
        if (authUser && typeof authUser === 'object') {
            authUser.exp = totalExp;
            authUser.lv = nivelFinal;
            authUser.nivel = nivelFinal;
            authUser.tituloNivel = tituloFinal;
            setLocalItem(STORAGE_KEYS.AUTH_USER, authUser);
        }
    } catch {
        // Ignora erro de acesso ao storage
    }

    // 4. Atualiza usuario no objeto de CRONOGRAMA no localStorage (se existir)
    try {
        const cronograma = getLocalItem(STORAGE_KEYS.CRONOGRAMA, null);
        if (cronograma && typeof cronograma === 'object') {
            if (cronograma.usuario && typeof cronograma.usuario === 'object') {
                cronograma.usuario.exp = totalExp;
                cronograma.usuario.lv = nivelFinal;
                cronograma.usuario.tituloNivel = tituloFinal;
                cronograma.usuario.xpNoNivel = levelInfo.xpNoNivel;
                cronograma.usuario.xpNecessarioNivel = levelInfo.xpNecessarioNivel;
                cronograma.usuario.progressoPct = levelInfo.progressoPct;
            }
            setLocalItem(STORAGE_KEYS.CRONOGRAMA, cronograma);
        }
    } catch {
        // Ignora erro de acesso ao storage
    }

    // 5. Salva chaves diretas para compatibilidade máxima com qualquer script/inspeção
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('aprovadrive_user_lv', String(nivelFinal));
            localStorage.setItem('aprovadrive_lv', String(nivelFinal));
            localStorage.setItem('lv', String(nivelFinal));
            localStorage.setItem('aprovadrive_user_exp', String(totalExp));
            localStorage.setItem('aprovadrive_xp', String(totalExp));
            localStorage.setItem('exp', String(totalExp));
            localStorage.setItem('xp', String(totalExp));

            // Salva registro da tarefa fixa concluída no histórico local
            if (taskId) {
                const fixasKey = 'aprovadrive_tarefas_fixas_concluidas';
                let concluidas = [];
                try {
                    const raw = localStorage.getItem(fixasKey);
                    if (raw) concluidas = JSON.parse(raw);
                } catch {
                    // Ignora parse
                }
                if (!Array.isArray(concluidas)) concluidas = [];
                if (!concluidas.includes(taskId)) {
                    concluidas.push(taskId);
                    localStorage.setItem(fixasKey, JSON.stringify(concluidas));
                }
            }
        }
    } catch {
        // Ignora
    }

    // 6. Atualiza elementos visuais do nível na tela imediatamente
    updateLevelUI(gamification);

    // 7. Notifica outros componentes da aplicação
    if (typeof window !== 'undefined') {
        try {
            window.dispatchEvent(new CustomEvent('aprovadrive:xp_updated', {
                detail: {
                    xpGanho,
                    expTotal: totalExp,
                    lv: nivelFinal,
                    tituloNivel: tituloFinal,
                    taskId
                }
            }));
        } catch {
            // Ignora
        }
    }

    return gamification;
}

export function syncUserGamification(usuario) {
    if (!usuario) return getGamificationData();
    const expTotal = typeof usuario.exp === 'number' ? usuario.exp : (usuario.totalExp !== undefined ? Number(usuario.totalExp) : null);
    const lv = usuario.lv || usuario.nivel || null;
    const tituloNivel = usuario.tituloNivel || null;

    return atualizarXpNoLocalStorage({
        expTotal,
        lv,
        tituloNivel
    });
}

export function getUserLevel() {
    const directLv = getLocalItem(STORAGE_KEYS.LV, null);
    if (directLv !== null && !isNaN(Number(directLv))) {
        return Number(directLv);
    }
    const gamification = getGamificationData();
    if (gamification && (gamification.nivel || gamification.lv)) {
        return Number(gamification.nivel || gamification.lv);
    }
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    if (authUser && (authUser.lv || authUser.nivel)) {
        return Number(authUser.lv || authUser.nivel);
    }
    return 1;
}

export function addXp(amount) {
    return atualizarXpNoLocalStorage({ xpGanho: Number(amount) || 0 });
}

export function updateLevelUI(infoOrUsuario) {
    if (!infoOrUsuario) return;

    let info = null;
    if (typeof infoOrUsuario === 'number') {
        info = getLevelInfo(infoOrUsuario);
    } else if (infoOrUsuario.xpNoNivel !== undefined && infoOrUsuario.xpNecessarioNivel !== undefined) {
        info = infoOrUsuario;
    } else {
        const exp = typeof infoOrUsuario.exp === 'number' ? infoOrUsuario.exp : (infoOrUsuario.totalExp || 0);
        info = getLevelInfo(exp);
        if (infoOrUsuario.tituloNivel) info.tituloNivel = infoOrUsuario.tituloNivel;
        if (infoOrUsuario.lv || infoOrUsuario.nivel) info.nivel = infoOrUsuario.lv || infoOrUsuario.nivel;
    }

    // Atualiza título do nível: "Nível X — Título"
    const nivelTituloEl = qs('#header-nivel-titulo') || qs('.nivel h2');
    if (nivelTituloEl) {
        setText(nivelTituloEl, `Nível ${info.nivel} — ${info.tituloNivel}`);
    }

    // Atualiza texto de XP: "X / Y XP"
    const xpTextoEl = qs('#header-xp-detalhe') || qs('.xp-topo span:last-child');
    if (xpTextoEl) {
        const xpAtual = (info.xpNoNivel !== undefined ? info.xpNoNivel : info.xpAtual || 0).toLocaleString('pt-BR');
        const xpMax = (info.xpNecessarioNivel !== undefined ? info.xpNecessarioNivel : info.xpMaximo || 100).toLocaleString('pt-BR');
        setText(xpTextoEl, `${xpAtual} / ${xpMax} XP`);
    }

    // Atualiza barra de progresso do nível (%)
    const barraSpan = qs('#header-xp-barra-fill') || qs('.barra span');
    if (barraSpan) {
        const pct = info.progressoPct !== undefined ? info.progressoPct : Math.min(100, Math.round(((info.xpAtual || 0) / (info.xpMaximo || 100)) * 100));
        barraSpan.style.width = `${pct}%`;
    }

    // Atualiza XP total nas estatísticas da tela inicial
    const estatisticaXp = qs('.estatistica strong:last-child');
    if (estatisticaXp && info.totalExp !== undefined) {
        setText(estatisticaXp, `${info.totalExp.toLocaleString('pt-BR')} XP`);
    }
}

export function getTaxaAproveitamento() {
    const data = getGamificationData();
    if (!data.questoesTotais || data.questoesTotais === 0) return 0;
    return Math.round((data.acertos / data.questoesTotais) * 100);
}
