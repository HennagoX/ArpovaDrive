import { ready, qs, qsa, on, setText } from '../utils/dom.js';
import { getDiaSemanaAtual, getNomesDias, getTarefas} from '../services/cronogramaService.js';
import { SELECTORS } from '../constants/selectors.js';

ready(async () => {
    const diaAtual = getDiaSemanaAtual();
    const nomesDias = getNomesDias();

    const diaTabAtivo = qs(`${SELECTORS.CRONOGRAMA_TAB_PREFIX}${diaAtual}`);
    if (diaTabAtivo) {
        diaTabAtivo.classList.add('active');
    }

    const tabs = qsa(SELECTORS.CRONOGRAMA_TABS);
    tabs.forEach(tab => {
        on(tab, 'click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const idMatch = tab.id.match(/\d+$/);
            if (idMatch) {
                const diaNum = parseInt(idMatch[0], 10);
                const nomeDia = nomesDias[diaNum];
                if (nomeDia) {
                    setText('.schedule-header h3', `Missões de ${nomeDia}`);
                }
            }
        });
    });
        await getTarefas();
});
