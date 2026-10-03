import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem, removeLocalItem, clearAllLocalStorage } from '../utils/storage.js';
import { API_URL, ENDPOINTS } from '../constants/routes.js';
import { syncUserGamification } from './gamificationService.js';
import { MESSAGES, getHttpErrorMessage, getNetworkErrorMessage } from '../constants/messages.js';
import { TIMING } from '../constants/timing.js';

function createTimeoutSignal(timeoutMs = TIMING.REQUEST_TIMEOUT) {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return AbortSignal.timeout(timeoutMs);
    }
    const controller = new AbortController();
    setTimeout(() => {
        try {
            controller.abort(new DOMException('TimeoutError', 'TimeoutError'));
        } catch {
            controller.abort();
        }
    }, timeoutMs);
    return controller.signal;
}

function getStoredUsers() {
    const storedUsers = getLocalItem(STORAGE_KEYS.USER_PROFILE, []);
    return Array.isArray(storedUsers) ? storedUsers : [storedUsers];
}

function getApiUser(data, fallbackUser) {
    const user = data?.user || data?.usuario || data;
    if (!user || typeof user !== 'object' || Array.isArray(user)) return fallbackUser;

    const { senha, password, ...safeUser } = user;
    return { ...fallbackUser, ...safeUser };
}

async function parseResponse(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

export function getCurrentUser() {
    return getLocalItem(STORAGE_KEYS.AUTH_USER, null);
}

export function isAuthenticated() {
    return Boolean(getCurrentUser());
}

export async function login(email, senha) {
    const normalizedEmail = email?.trim();
    if (!normalizedEmail || !senha) {
        return { success: false, error: MESSAGES.CAMPOS_OBRIGATORIOS };
    }

    try {
        const response = await fetch(ENDPOINTS.AUTH.LOGIN, {
            signal: createTimeoutSignal(TIMING.REQUEST_TIMEOUT),
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail, senha })
        });
        const data = await parseResponse(response);

        if (!response.ok) {
            const serverMsg = data?.message || data?.error;
            return {
                success: false,
                error: getHttpErrorMessage(response.status, serverMsg, MESSAGES.LOGIN_ERRADO)
            };
        }

        const user = getApiUser(data, { email: normalizedEmail });
        setLocalItem(STORAGE_KEYS.AUTH_USER, user);

        const userId = user?.id_usuario || user?.id;
        if (userId) {
            setLocalItem('aprovadrive_active_user_id', String(userId));
        }

        try {
            sessionStorage.clear();
        } catch {}

        syncUserGamification(user);

        return { success: true, user };
    } catch (error) {
        console.error('Erro ao conectar com a API:', error);
        return { success: false, error: getNetworkErrorMessage(error) };
    }
}

export async function cadastrar(userData) {
    const { nome, email, senha, dataNascimento, perguntaSeguranca, respostaSeguranca } = userData || {};
    const normalizedEmail = email?.trim();
    if (!nome || !normalizedEmail || !senha || !dataNascimento) {
        return { success: false, error: MESSAGES.CAMPOS_OBRIGATORIOS };
    }

    try {
        const response = await fetch(ENDPOINTS.AUTH.CADASTRO, {
            signal: createTimeoutSignal(TIMING.REQUEST_TIMEOUT),
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: normalizedEmail,
                nome,
                senha,
                data_nascimento: dataNascimento,
                pergunta_seguranca: perguntaSeguranca?.trim() || null,
                resposta_seguranca: respostaSeguranca?.trim() || null
            })
        });
        const data = await parseResponse(response);
        if (!response.ok) {
            let serverMsg = data?.message || data?.error;
            if (data?.details?.fieldErrors) {
                const firstField = Object.keys(data.details.fieldErrors)[0];
                if (firstField && data.details.fieldErrors[firstField]?.length > 0) {
                    serverMsg = data.details.fieldErrors[firstField][0];
                }
            } else if (data?.details?.formErrors?.length > 0) {
                serverMsg = data.details.formErrors[0];
            }

            const fallbackMsg = response.status === 409
                ? 'Esse e-mail já está em uso!'
                : 'Não foi possível concluir o cadastro. Verifique os dados informados.';

            return {
                success: false,
                error: getHttpErrorMessage(response.status, serverMsg, fallbackMsg)
            };
        }

        return { success: true, user: data?.usuario || { nome, email: normalizedEmail } };
    } catch (error) {
        console.error('Erro ao conectar com a API:', error);
        return { success: false, error: getNetworkErrorMessage(error) };
    }
}

export async function verificarEmailDisponivel(email) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
        return { success: false, disponivel: false, error: 'Por favor, informe seu e-mail.' };
    }

    try {
        const response = await fetch(ENDPOINTS.AUTH.VERIFICAR_EMAIL, {
            signal: createTimeoutSignal(TIMING.REQUEST_TIMEOUT),
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail })
        });

        // Se o endpoint /auth/verificar-email não existir (404 da rota), faz fallback para buscarPerguntaSeguranca
        if (response.status === 404) {
            const fallbackCheck = await buscarPerguntaSeguranca(normalizedEmail);
            if (fallbackCheck.success || fallbackCheck.error?.includes('pergunta de segurança configurada')) {
                return { success: true, disponivel: false, exists: true, message: 'Esse e-mail já está em uso!' };
            }
            if (fallbackCheck.error?.includes('não encontrado')) {
                return { success: true, disponivel: true, exists: false, message: 'E-mail disponível.' };
            }
        }

        const data = await parseResponse(response);
        if (!response.ok) {
            if (response.status === 409) {
                return { success: true, disponivel: false, exists: true, message: 'Esse e-mail já está em uso!' };
            }
            let serverMsg = data?.message || data?.error;
            return {
                success: false,
                disponivel: false,
                error: getHttpErrorMessage(response.status, serverMsg, 'Não foi possível verificar a disponibilidade do e-mail.')
            };
        }

        const exists = Boolean(data?.exists);
        const disponivel = data?.disponivel !== undefined ? Boolean(data?.disponivel) : !exists;

        return {
            success: true,
            disponivel,
            exists,
            message: data?.message || (exists ? 'Esse e-mail já está em uso!' : 'E-mail disponível.')
        };
    } catch (error) {
        console.error('Erro ao verificar e-mail:', error);
        return { success: false, error: getNetworkErrorMessage(error) };
    }
}

export async function buscarPerguntaSeguranca(email) {
    const normalizedEmail = email?.trim();
    if (!normalizedEmail) {
        return { success: false, error: 'Por favor, informe seu e-mail.' };
    }

    try {
        const response = await fetch(ENDPOINTS.AUTH.PERGUNTA_SEGURANCA, {
            signal: createTimeoutSignal(TIMING.REQUEST_TIMEOUT),
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail })
        });
        const data = await parseResponse(response);

        if (!response.ok) {
            const serverMsg = data?.message || data?.error;
            return {
                success: false,
                error: getHttpErrorMessage(response.status, serverMsg, 'Usuário não encontrado ou sem pergunta configurada.')
            };
        }

        return { success: true, pergunta: data?.pergunta };
    } catch (error) {
        console.error('Erro ao buscar pergunta de segurança:', error);
        return { success: false, error: getNetworkErrorMessage(error) };
    }
}

export async function verificarRespostaSeguranca(email, resposta) {
    const normalizedEmail = email?.trim();
    const normalizedResposta = resposta?.trim();

    if (!normalizedEmail || !normalizedResposta) {
        return { success: false, error: 'E-mail e resposta são obrigatórios.' };
    }

    try {
        const response = await fetch(ENDPOINTS.AUTH.VERIFICAR_RESPOSTA, {
            signal: createTimeoutSignal(TIMING.REQUEST_TIMEOUT),
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: normalizedEmail,
                resposta: normalizedResposta
            })
        });
        const data = await parseResponse(response);

        if (!response.ok) {
            const serverMsg = data?.message || data?.error;
            return {
                success: false,
                error: getHttpErrorMessage(response.status, serverMsg, 'Resposta de segurança incorreta.')
            };
        }

        return { success: true, message: data?.message || 'Resposta correta!' };
    } catch (error) {
        console.error('Erro ao verificar resposta de segurança:', error);
        return { success: false, error: getNetworkErrorMessage(error) };
    }
}

export async function redefinirSenha(email, resposta, novaSenha) {
    const normalizedEmail = email?.trim();
    const normalizedResposta = resposta?.trim();

    if (!normalizedEmail || !normalizedResposta || !novaSenha) {
        return { success: false, error: 'Preencha todos os campos.' };
    }

    if (novaSenha.length < 6) {
        return { success: false, error: MESSAGES.SENHA_CURTA };
    }

    try {
        const response = await fetch(ENDPOINTS.AUTH.REDEFINIR_SENHA, {
            signal: createTimeoutSignal(TIMING.REQUEST_TIMEOUT),
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: normalizedEmail,
                resposta: normalizedResposta,
                novaSenha
            })
        });
        const data = await parseResponse(response);

        if (!response.ok) {
            const serverMsg = data?.message || data?.error;
            return {
                success: false,
                error: getHttpErrorMessage(response.status, serverMsg, 'Não foi possível redefinir a senha.')
            };
        }

        return { success: true, message: data?.message || 'Senha redefinida com sucesso!' };
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        return { success: false, error: getNetworkErrorMessage(error) };
    }
}

export function logout() {
    clearAllLocalStorage();
    try {
        sessionStorage.clear();
    } catch {}
}
