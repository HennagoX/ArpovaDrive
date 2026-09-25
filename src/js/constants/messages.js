export const MESSAGES = {
    // Validações de Formulário
    CAMPOS_OBRIGATORIOS: 'Por favor, preencha todos os campos.',
    SENHAS_DIVERGENTES: 'As senhas não coincidem.',
    SENHA_CURTA: 'A senha deve ter no mínimo 6 caracteres.',

    // Autenticação e Ações
    LOGIN_SUCESSO: 'Entrando...',
    CADASTRO_SUCESSO: 'Cadastro realizado com sucesso! Redirecionando...',
    ESQUECI_SENHA_INFO: 'Página de recuperação de senha.',
    GOOGLE_INFO: 'Aqui será integrada a entrada com Google.',
    LOGIN_ERRADO: 'E-mail ou senha incorretos.',

    // Módulos e Conteúdos
    MODULO_BLOQUEADO: 'Conclua o módulo anterior para desbloquear este módulo!',
    MODULO_EM_BREVE: 'Módulo em desenvolvimento. A leitura estará disponível em breve!',
    QUESTAO_BLOQUEADA: 'Conclua ao menos 3 módulos de estudo desta matéria para desbloquear este módulo de questões!',
    QUESTAO_EM_BREVE: 'Módulo de questões selecionado. A tela interativa de resolução de questões será conectada em breve!',

    // Erros de Conexão e Rede
    CONEXAO_FALHA: 'Não foi possível se conectar com o servidor. Verifique sua conexão e tente novamente.',
    CONEXAO_TIMEOUT: 'O servidor demorou muito para responder (tempo limite esgotado). Tente novamente em instantes.',
    CONEXAO_OFFLINE: 'Você está sem conexão com a internet. Verifique sua rede e tente novamente.',
    ERRO_INESPERADO: 'Ocorreu um erro inesperado ao se comunicar com o servidor. Tente novamente mais tarde.',

    // Mensagens de Erros HTTP Personalizadas e Amigáveis (incluindo o código de erro HTTP)
    HTTP_400: 'Dados inválidos ou incompletos na requisição. (Erro HTTP 400)',
    HTTP_401: 'Acesso não autorizado. Credenciais incorretas ou sessão expirada. (Erro HTTP 401)',
    HTTP_403: 'Acesso negado. Você não tem permissão para acessar este recurso. (Erro HTTP 403)',
    HTTP_404: 'O serviço ou recurso solicitado não foi encontrado no servidor. (Erro HTTP 404)',
    HTTP_408: 'O tempo limite da requisição se esgotou no servidor. (Erro HTTP 408)',
    HTTP_409: 'Conflito de informações. Os dados fornecidos já estão em uso no sistema. (Erro HTTP 409)',
    HTTP_422: 'Não foi possível processar as informações enviadas. Verifique os dados. (Erro HTTP 422)',
    HTTP_429: 'Muitas requisições enviadas em pouco tempo. Aguarde alguns instantes e tente novamente. (Erro HTTP 429)',
    HTTP_500: 'Ocorreu um erro interno no servidor. Já estamos verificando. (Erro HTTP 500)',
    HTTP_502: 'O servidor está temporariamente indisponível (Bad Gateway). Tente novamente em instantes. (Erro HTTP 502)',
    HTTP_503: 'Servidor temporariamente indisponível para manutenção. Tente novamente mais tarde. (Erro HTTP 503)',
    HTTP_504: 'O servidor demorou para responder (Gateway Timeout). Tente novamente em instantes. (Erro HTTP 504)'
};

export const HTTP_ERROR_MESSAGES = {
    400: MESSAGES.HTTP_400,
    401: MESSAGES.HTTP_401,
    403: MESSAGES.HTTP_403,
    404: MESSAGES.HTTP_404,
    408: MESSAGES.HTTP_408,
    409: MESSAGES.HTTP_409,
    422: MESSAGES.HTTP_422,
    429: MESSAGES.HTTP_429,
    500: MESSAGES.HTTP_500,
    502: MESSAGES.HTTP_502,
    503: MESSAGES.HTTP_503,
    504: MESSAGES.HTTP_504
};

const TECHNICAL_ERROR_PATTERNS = [
    'internal server error',
    'bad request',
    'unauthorized',
    'forbidden',
    'not found',
    'method not allowed',
    'conflict',
    'too many requests',
    'bad gateway',
    'service unavailable',
    'gateway timeout',
    'cannot get',
    'cannot post',
    'cannot put',
    'cannot delete',
    'failed to fetch',
    'networkerror',
    'econnrefused',
    'enotfound',
    'etimedout',
    'postgres',
    'sql',
    'database',
    'syntax error',
    'unique constraint',
    'duplicate key',
    'null pointer',
    'stack trace',
    '<!doctype html>'
];

/**
 * Verifica se a mensagem retornada pelo servidor é técnica/padrão
 * (que deve ser substituída por uma mensagem personalizada mais amigável).
 * 
 * @param {string} msg
 * @returns {boolean}
 */
export function isTechnicalMessage(msg) {
    if (!msg || typeof msg !== 'string') return true;
    const lower = msg.toLowerCase().trim();
    if (!lower) return true;
    return TECHNICAL_ERROR_PATTERNS.some(pattern => lower.includes(pattern));
}

/**
 * Retorna mensagem amigável para status HTTP, substituindo erros técnicos ou genéricos do servidor
 * por mensagens personalizadas e garantindo a indicação do código HTTP.
 * 
 * @param {number|string} status Código de status HTTP (ex: 400, 401, 404, 500)
 * @param {string} [serverError] Mensagem original vinda do servidor
 * @param {string} [customFallback] Fallback personalizado
 * @returns {string} Mensagem amigável com indicação do código HTTP
 */
export function getHttpErrorMessage(status, serverError = '', customFallback = '') {
    const statusCode = Number(status);

    // Se o backend enviou uma mensagem amigável específica (não técnica)
    if (serverError && !isTechnicalMessage(serverError)) {
        const cleanMsg = serverError.trim();
        // Se a mensagem já possui indicação do código HTTP
        if (/http\s*\d+/i.test(cleanMsg) || (statusCode && cleanMsg.includes(String(statusCode)))) {
            return cleanMsg;
        }
        const formattedMsg = cleanMsg.endsWith('.') ? cleanMsg : `${cleanMsg}.`;
        return statusCode ? `${formattedMsg} (Erro HTTP ${statusCode})` : formattedMsg;
    }

    // Se existe uma mensagem personalizada no catálogo para este código HTTP
    if (statusCode && HTTP_ERROR_MESSAGES[statusCode]) {
        return HTTP_ERROR_MESSAGES[statusCode];
    }

    // Se houver um fallback amigável fornecido
    if (customFallback && !isTechnicalMessage(customFallback)) {
        const cleanFallback = customFallback.trim();
        if (/http\s*\d+/i.test(cleanFallback) || (statusCode && cleanFallback.includes(String(statusCode)))) {
            return cleanFallback;
        }
        const formattedFallback = cleanFallback.endsWith('.') ? cleanFallback : `${cleanFallback}.`;
        return statusCode ? `${formattedFallback} (Erro HTTP ${statusCode})` : formattedFallback;
    }

    // Categorias genéricas HTTP com código
    if (statusCode >= 400 && statusCode < 500) {
        return `Não foi possível processar a requisição. (Erro HTTP ${statusCode})`;
    }
    if (statusCode >= 500 && statusCode < 600) {
        return `Instabilidade temporária nos servidores. Tente novamente mais tarde. (Erro HTTP ${statusCode})`;
    }

    return statusCode ? `Falha na comunicação com o servidor. (Erro HTTP ${statusCode})` : MESSAGES.CONEXAO_FALHA;
}

/**
 * Retorna uma mensagem amigável para falhas de rede, conexão e timeouts de requisição.
 * 
 * @param {Error|any} error Objeto de erro capturado no catch
 * @returns {string} Mensagem amigável de erro de conexão
 */
export function getNetworkErrorMessage(error) {
    if (!error) return MESSAGES.CONEXAO_FALHA;

    const errorName = error.name || '';
    const errorMsg = String(error.message || '').toLowerCase();

    // Timeout de requisição
    if (
        errorName === 'TimeoutError' ||
        errorName === 'AbortError' ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('timed out') ||
        errorMsg.includes('tempo limite')
    ) {
        return MESSAGES.CONEXAO_TIMEOUT;
    }

    // Sem conexão de rede no dispositivo
    if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
        return MESSAGES.CONEXAO_OFFLINE;
    }

    return MESSAGES.CONEXAO_FALHA;
}

