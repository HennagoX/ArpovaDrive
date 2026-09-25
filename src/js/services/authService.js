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
    const { nome, email, senha, dataNascimento } = userData || {};
    const normalizedEmail = email?.trim();
    if (!nome || !normalizedEmail || !senha || !dataNascimento) {
        return { success: false, error: MESSAGES.CAMPOS_OBRIGATORIOS };
    }

    const users = getStoredUsers();
    const emailJaCadastrado = users.some(
        user => user?.email?.toLowerCase() === normalizedEmail.toLowerCase()
    );
    if (emailJaCadastrado) {
        return { success: false, error: 'E-mail já cadastrado localmente.' };
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
                data_nascimento: dataNascimento
            })
        });
        const data = await parseResponse(response);
        if (!response.ok) {
            const serverMsg = data?.message || data?.error;
            return {
                success: false,
                error: getHttpErrorMessage(response.status, serverMsg, 'Esse e-mail já está em uso!')
            };
        }
    } catch (error) {
        console.error('Erro ao conectar com a API:', error);
        return { success: false, error: getNetworkErrorMessage(error) };
    }

    const newUser = {
        nome,
        email: normalizedEmail,
        dataNascimento,
        criadoEm: new Date().toISOString()
    };
    users.push(newUser);
    setLocalItem(STORAGE_KEYS.USER_PROFILE, users);
    return { success: true, user: newUser };
}

export function logout() {
    clearAllLocalStorage();
    try {
        sessionStorage.clear();
    } catch {}
}
