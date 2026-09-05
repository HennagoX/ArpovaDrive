import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem } from '../utils/storage.js';

const DEFAULT_GAMIFICATION = {
    nivel: 7,
    tituloNivel: 'Motorista em Treinamento',
    xpAtual: 680,
    xpMaximo: 1000,
    diasOfensiva: 5,
    questoesTotais: 124,
    acertos: 86,
    simulados: 8
};

export function getGamificationData() {
    return getLocalItem(STORAGE_KEYS.GAMIFICATION, DEFAULT_GAMIFICATION);
}

export function addXp(amount) {
    const data = getGamificationData();
    data.xpAtual += amount;
    if (data.xpAtual >= data.xpMaximo) {
        data.nivel += 1;
        data.xpAtual = data.xpAtual - data.xpMaximo;
        data.xpMaximo = Math.round(data.xpMaximo * 1.2);
    }
    setLocalItem(STORAGE_KEYS.GAMIFICATION, data);
    return data;
}

export function getTaxaAproveitamento() {
    const data = getGamificationData();
    if (data.questoesTotais === 0) return 0;
    return Math.round((data.acertos / data.questoesTotais) * 100);
}
