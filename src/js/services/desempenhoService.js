import { ENDPOINTS } from '../constants/routes.js';
import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem } from '../utils/storage.js';
import { getCurrentUser } from './authService.js';
import { getGamificationData } from './gamificationService.js';
import { getModuloUserId } from './moduloService.js';

let cachedDesempenho = null;
const memoryDesempenhoCache = new Map();
const inFlightDesempenho = new Map();
const DESEMPENHO_CACHE_TTL_MS = 60 * 1000;

export function invalidateLocalDesempenhoCache(userId = null) {
  if (userId) {
    const activeUserId = getModuloUserId(userId);
    memoryDesempenhoCache.delete(activeUserId);
  } else {
    memoryDesempenhoCache.clear();
  }
  cachedDesempenho = null;
}

export const MATERIAS_DESEMPENHO_CONFIG = [
  {
    id: 'CodigoTransito',
    nome: 'Legislação de Trânsito',
    icone: 'fa-solid fa-scale-balanced',
    cor: 'green'
  },
  {
    id: 'PlacasTransito',
    nome: 'Placas e Sinalização',
    icone: 'fa-solid fa-diamond-turn-right',
    cor: 'blue'
  },
  {
    id: 'DirecaoDefensiva',
    nome: 'Direção Defensiva',
    icone: 'fa-solid fa-shield-halved',
    cor: 'yellow'
  },
  {
    id: 'MeioAmbiente',
    nome: 'Meio Ambiente e Cidadania',
    icone: 'fa-solid fa-leaf',
    cor: 'purple'
  },
  {
    id: 'PrimeirosSocorros',
    nome: 'Primeiros Socorros',
    icone: 'fa-solid fa-kit-medical',
    cor: 'red'
  },
  {
    id: 'MecanicaBasica',
    nome: 'Mecânica Básica',
    icone: 'fa-solid fa-gears',
    cor: 'cyan'
  }
];

export function getLocalDesempenho() {
  if (cachedDesempenho) return cachedDesempenho;
  const stored = getLocalItem(STORAGE_KEYS.DESEMPENHO, null);
  if (stored && stored.resumo) {
    cachedDesempenho = stored;
    return stored;
  }
  return gerarDesempenhoFallbackLocal();
}

export function gerarDesempenhoFallbackLocal() {
  const user = getCurrentUser();
  const gamification = getGamificationData() || {};

  const totalQuestoes = Number(gamification.questoesTotais ?? 0);
  const totalAcertos = Number(gamification.acertos ?? 0);
  const totalErros = Math.max(0, totalQuestoes - totalAcertos);
  const taxaAproveitamento = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;
  const totalSimulados = Number(gamification.simulados ?? 0);

  let statusGeral = 'Atenção';
  let statusCor = '#dc2626';
  let statusDescricao = 'Sua pontuação atual está abaixo de 50%. Dedique mais tempo aos módulos teóricos e resolva baterias de questões para subir sua taxa de acertos.';

  if (taxaAproveitamento >= 70) {
    statusGeral = 'Apto';
    statusCor = '#16a34a';
    statusDescricao = 'Você atingiu a pontuação mínima para aprovação (70%), mas recomendamos reforçar matérias críticas para ter mais segurança.';
  } else if (taxaAproveitamento >= 50) {
    statusGeral = 'Médio';
    statusCor = '#f59e0b';
    statusDescricao = 'Sua pontuação atual está próxima de 70%. Priorize as matérias em que você teve maior índice de erro para garantir sua aprovação.';
  } else if (totalQuestoes === 0) {
    statusGeral = 'Iniciando';
    statusCor = '#0284c7';
    statusDescricao = 'Você ainda não concluiu baterias de questões. Resolva os exercícios de cada módulo para liberar suas estatísticas detalhadas!';
  }

  const materias = MATERIAS_DESEMPENHO_CONFIG.map(m => ({
    id: m.id,
    nome: m.nome,
    icone: m.icone,
    cor: m.cor,
    totalQuestoes: 0,
    acertos: 0,
    erros: 0,
    porcentagem: 0,
    bateriasFeitas: 0,
    moduloAtual: 1,
    status: 'Pendente',
    statusClasse: 'badge-revisao',
    fillClasse: 'fill-revisao'
  }));

  return {
    sucesso: true,
    usuario: {
      id: user?.id_usuario || '',
      nome: user?.nome || 'Aluno',
      exp: gamification.totalExp || 0,
      lv: gamification.nivel || 1,
      tituloNivel: gamification.tituloNivel || 'Futuro Condutor'
    },
    resumo: {
      taxaAproveitamento,
      totalQuestoes,
      totalAcertos,
      totalErros,
      totalSimulados,
      simuladosAprovados: Math.round(totalSimulados * 0.75),
      simuladosReprovados: Math.max(0, totalSimulados - Math.round(totalSimulados * 0.75)),
      statusGeral,
      statusCor,
      statusDescricao
    },
    materias,
    pontosFortes: [],
    pontosFracos: ['Legislação de Trânsito', 'Direção Defensiva'],
    diagnosticoIa: 'Recomendamos priorizar os estudos de Legislação de Trânsito e Direção Defensiva no seu cronograma, pois são as matérias mais cobradas no exame oficial do DETRAN.',
    ultimosSimulados: []
  };
}

export function sincronizarGamificationComDesempenho(desempenho) {
  if (!desempenho || !desempenho.resumo) return;
  try {
    const gamification = getGamificationData() || {};
    const atualizado = {
      ...gamification,
      questoesTotais: desempenho.resumo.totalQuestoes,
      acertos: desempenho.resumo.totalAcertos,
      simulados: desempenho.resumo.totalSimulados
    };
    if (desempenho.usuario?.exp !== undefined) {
      atualizado.totalExp = desempenho.usuario.exp;
    }
    if (desempenho.usuario?.lv !== undefined) {
      atualizado.nivel = desempenho.usuario.lv;
      atualizado.lv = desempenho.usuario.lv;
    }
    if (desempenho.usuario?.tituloNivel) {
      atualizado.tituloNivel = desempenho.usuario.tituloNivel;
    }
    setLocalItem(STORAGE_KEYS.GAMIFICATION, atualizado);
  } catch (err) {
    console.warn('[DesempenhoService] Erro ao sincronizar gamification:', err.message);
  }
}

export async function fetchDesempenho(userId = null, forceRefresh = false) {
  const activeUserId = getModuloUserId(userId);

  if (!forceRefresh) {
    if (memoryDesempenhoCache.has(activeUserId)) {
      const entry = memoryDesempenhoCache.get(activeUserId);
      if (Date.now() - entry.timestamp < DESEMPENHO_CACHE_TTL_MS && entry.data?.resumo) {
        return entry.data;
      }
    }

    if (cachedDesempenho && cachedDesempenho.resumo) {
      return cachedDesempenho;
    }

    const localStored = getLocalItem(STORAGE_KEYS.DESEMPENHO, null);
    if (localStored && localStored.resumo) {
      cachedDesempenho = localStored;
      memoryDesempenhoCache.set(activeUserId, { data: localStored, timestamp: Date.now() });
      return localStored;
    }
  }

  if (inFlightDesempenho.has(activeUserId)) {
    return inFlightDesempenho.get(activeUserId);
  }

  const fetchPromise = (async () => {
    try {
      const url = ENDPOINTS.DESEMPENHO.GET(activeUserId);
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'X-User-Id': activeUserId
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.resumo) {
          cachedDesempenho = data;
          memoryDesempenhoCache.set(activeUserId, { data, timestamp: Date.now() });
          setLocalItem(STORAGE_KEYS.DESEMPENHO, data);
          sincronizarGamificationComDesempenho(data);
          return data;
        }
      }
    } catch (err) {
      console.warn('[DesempenhoService] Falha ao consultar endpoint de desempenho, usando cache/local:', err.message);
    } finally {
      inFlightDesempenho.delete(activeUserId);
    }

    const local = getLocalDesempenho();
    cachedDesempenho = local;
    memoryDesempenhoCache.set(activeUserId, { data: local, timestamp: Date.now() });
    return local;
  })();

  inFlightDesempenho.set(activeUserId, fetchPromise);
  return fetchPromise;
}

export default {
  MATERIAS_DESEMPENHO_CONFIG,
  getLocalDesempenho,
  gerarDesempenhoFallbackLocal,
  sincronizarGamificationComDesempenho,
  fetchDesempenho
};
