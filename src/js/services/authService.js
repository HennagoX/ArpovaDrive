import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem, removeLocalItem } from '../utils/storage.js';
import { ENDPOINTS } from '../constants/routes.js';

const REQUIRED_FIELDS_MESSAGE = 'Preencha todos os campos.';
const INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha incorretos.';
const API_CONNECTION_MESSAGE = 'Não foi possível conectar com a API.';

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

function getApiError(data, fallbackMessage) {
    return data?.message || data?.error || fallbackMessage;
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
        return { success: false, error: REQUIRED_FIELDS_MESSAGE };
    }

    try {
        const response = await fetch(ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail, senha })
        });
        const data = await parseResponse(response);

        if (response.status === 429) {
            return { success: false, error: 'Você fez muitas requisições!' };
        }
        if (!response.ok) {
            return { success: false, error: getApiError(data, INVALID_CREDENTIALS_MESSAGE) };
        }

        const user = getApiUser(data, { email: normalizedEmail });
        setLocalItem(STORAGE_KEYS.AUTH_USER, user);
        return { success: true, user };
    } catch (error) {
        console.error('Erro ao conectar com a API:', error);
        return { success: false, error: API_CONNECTION_MESSAGE };
    }
}

export async function cadastrar(userData) {
    const { nome, email, senha, dataNascimento } = userData || {};
    const normalizedEmail = email?.trim();
    if (!nome || !normalizedEmail || !senha || !dataNascimento) {
        return { success: false, error: REQUIRED_FIELDS_MESSAGE };
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
            return { success: false, error: getApiError(data, 'Esse e-mail já está em uso!') };
        }
    } catch (error) {
        console.error('Erro ao conectar com a API:', error);
        return { success: false, error: API_CONNECTION_MESSAGE };
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
    removeLocalItem(STORAGE_KEYS.AUTH_USER);
}
