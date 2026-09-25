import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem } from '../utils/storage.js';
import { qs, setText } from '../utils/dom.js';

export const TITULOS_NIVEL = [
    'Futuro Condutor',
    'Aluno em Formação',
    'Aprendiz da Legislação',
    'Conhecedor de Placas',
    'Motorista Consciente',
    'Piloto Preventivo',
    'Motorista em Treinamento',
    'Condutor Experiente',
    'Mestre da Direção Defensiva',
    'Perito no Trânsito',
    'Piloto de Elite',
    'Ás do Volante',
    'Especialista DETRAN',
    'Instrutor Honorário',
    'Lenda do Asfalto'
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
    const data = getLocalItem(STORAGE_KEYS.GAMIFICATION, null);
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);

    if (authUser && (typeof authUser.exp === 'number' || authUser.lv !== undefined)) {
        const userExp = Math.max(0, Number(authUser.exp || 0));
        const userLevelInfo = getLevelInfo(userExp);
        const userLv = Math.max(Number(authUser.lv || 1), userLevelInfo.nivel);
        const userTitulo = authUser.tituloNivel || userLevelInfo.tituloNivel;

        if (!data || data.totalExp !== userExp || data.nivel !== userLv) {
            const merged = {
                ...(data || DEFAULT_GAMIFICATION),
                totalExp: userExp,
                nivel: userLv,
                lv: userLv,
                tituloNivel: userTitulo,
                xpAtual: userLevelInfo.xpNoNivel,
                xpMaximo: userLevelInfo.xpNecessarioNivel,
                progressoPct: userLevelInfo.progressoPct
            };
            setLocalItem(STORAGE_KEYS.GAMIFICATION, merged);
            setLocalItem(STORAGE_KEYS.XP, userExp);
            setLocalItem(STORAGE_KEYS.LV, userLv);
            return merged;
        }
        return data;
    }

    return data || DEFAULT_GAMIFICATION;
}

export function atualizarXpNoLocalStorage(params = {}) {
    const { xpGanho = 0, expTotal = null, lv = null, tituloNivel = null, taskId = null } = params;

    let totalExp;
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    const gData = getLocalItem(STORAGE_KEYS.GAMIFICATION, null);

    if (expTotal !== null && expTotal !== undefined && !isNaN(Number(expTotal))) {
        totalExp = Math.max(0, Number(expTotal));
    } else {
        const baseExp = authUser && typeof authUser.exp === 'number'
            ? Number(authUser.exp)
            : Number(gData?.totalExp || 0);
        totalExp = Math.max(0, baseExp + Number(xpGanho || 0));
    }

    const levelInfo = getLevelInfo(totalExp);
    const nivelFinal = Math.max(Number(lv || 1), levelInfo.nivel);
    const tituloFinal = tituloNivel || levelInfo.tituloNivel;

    const gamification = gData || { ...DEFAULT_GAMIFICATION };
    gamification.totalExp = totalExp;
    gamification.nivel = nivelFinal;
    gamification.lv = nivelFinal;
    gamification.tituloNivel = tituloFinal;
    gamification.xpAtual = levelInfo.xpNoNivel;
    gamification.xpMaximo = levelInfo.xpNecessarioNivel;
    gamification.progressoPct = levelInfo.progressoPct;
    setLocalItem(STORAGE_KEYS.GAMIFICATION, gamification);

    setLocalItem(STORAGE_KEYS.XP, totalExp);
    setLocalItem(STORAGE_KEYS.LV, nivelFinal);

    try {
        if (authUser && typeof authUser === 'object') {
            authUser.exp = totalExp;
            authUser.lv = nivelFinal;
            authUser.nivel = nivelFinal;
            authUser.tituloNivel = tituloFinal;
            setLocalItem(STORAGE_KEYS.AUTH_USER, authUser);
        }
    } catch {}

    try {
        const cronograma = getLocalItem(STORAGE_KEYS.CRONOGRAMA, null);
        if (cronograma && typeof cronograma === 'object' && cronograma.usuario) {
            cronograma.usuario.exp = totalExp;
            cronograma.usuario.lv = nivelFinal;
            cronograma.usuario.tituloNivel = tituloFinal;
            cronograma.usuario.xpNoNivel = levelInfo.xpNoNivel;
            cronograma.usuario.xpNecessarioNivel = levelInfo.xpNecessarioNivel;
            cronograma.usuario.progressoPct = levelInfo.progressoPct;
            setLocalItem(STORAGE_KEYS.CRONOGRAMA, cronograma);
        }
    } catch {}

    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('aprovadrive_user_lv', String(nivelFinal));
            localStorage.setItem('aprovadrive_lv', String(nivelFinal));
            localStorage.setItem('lv', String(nivelFinal));
            localStorage.setItem('aprovadrive_user_exp', String(totalExp));
            localStorage.setItem('aprovadrive_xp', String(totalExp));
            localStorage.setItem('exp', String(totalExp));
            localStorage.setItem('xp', String(totalExp));

            if (taskId) {
                const fixasKey = 'aprovadrive_tarefas_fixas_concluidas';
                let concluidas = [];
                try {
                    const raw = localStorage.getItem(fixasKey);
                    if (raw) concluidas = JSON.parse(raw);
                } catch {}
                if (!Array.isArray(concluidas)) concluidas = [];
                if (!concluidas.includes(taskId)) {
                    concluidas.push(taskId);
                    localStorage.setItem(fixasKey, JSON.stringify(concluidas));
                }
            }
        }
    } catch {}

    updateLevelUI(gamification);

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
        } catch {}
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
    const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
    if (authUser && (authUser.lv || authUser.nivel || typeof authUser.exp === 'number')) {
        const exp = Math.max(0, Number(authUser.exp || 0));
        const levelInfo = getLevelInfo(exp);
        return Math.max(Number(authUser.lv || authUser.nivel || 1), levelInfo.nivel);
    }
    const directLv = getLocalItem(STORAGE_KEYS.LV, null);
    if (directLv !== null && !isNaN(Number(directLv))) {
        return Number(directLv);
    }
    const gamification = getGamificationData();
    if (gamification && (gamification.nivel || gamification.lv)) {
        return Number(gamification.nivel || gamification.lv);
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
        if (infoOrUsuario.lv || infoOrUsuario.nivel) {
            info.nivel = Math.max(Number(infoOrUsuario.lv || infoOrUsuario.nivel), info.nivel);
        }
    }

    const nivelTituloEl = qs('#header-nivel-titulo') || qs('.nivel h2');
    if (nivelTituloEl) {
        setText(nivelTituloEl, `Nível ${info.nivel} — ${info.tituloNivel}`);
    }

    const xpTextoEl = qs('#header-xp-detalhe') || qs('.xp-topo span:last-child');
    if (xpTextoEl) {
        const xpAtual = (info.xpNoNivel !== undefined ? info.xpNoNivel : info.xpAtual || 0).toLocaleString('pt-BR');
        const xpMax = (info.xpNecessarioNivel !== undefined ? info.xpNecessarioNivel : info.xpMaximo || 100).toLocaleString('pt-BR');
        setText(xpTextoEl, `${xpAtual} / ${xpMax} XP`);
    }

    const barraSpan = qs('#header-xp-barra-fill') || qs('.barra span');
    if (barraSpan) {
        const pct = info.progressoPct !== undefined ? info.progressoPct : Math.min(100, Math.round(((info.xpAtual || 0) / (info.xpMaximo || 100)) * 100));
        barraSpan.style.width = `${pct}%`;
    }

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
