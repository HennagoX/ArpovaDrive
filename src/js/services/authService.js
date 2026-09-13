import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem, removeLocalItem } from '../utils/storage.js';

export function getCurrentUser() {
    return getLocalItem(STORAGE_KEYS.AUTH_USER, null);
}

export function isAuthenticated() {
    return getCurrentUser();
}

export async function login(usuario, senha) {
    if (!usuario || !senha) return { success: false, error: 'Preencha todos os campos.' };

    const users = getLocalItem(STORAGE_KEYS.USER_PROFILE, []);
    const foundUser = users.find(u => (u.email === usuario || u.usuario === usuario) && u.senha === senha);

    const authData = foundUser || {
        nome: usuario.split('@')[0] || 'Aluno',
        email: usuario.includes('@') ? usuario : `${usuario}@aprovadrive.com`,
        logadoEm: new Date().toISOString()
    };

    setLocalItem(STORAGE_KEYS.AUTH_USER, authData);
    return { success: true, user: authData };
}

export async function cadastrar(userData) {
    const { nome, email, senha, dataNascimento } = userData;
    if (!nome || !email || !senha || !dataNascimento) {
        return { success: false, error: 'Preencha todos os campos.' };
    }

    
    const users = getLocalItem(STORAGE_KEYS.USER_PROFILE, []);
    const emailJaCadastradoLocal = users.some(u => u.email === email);

    if (emailJaCadastradoLocal){
  return { success: false, error: 'E-mail já cadastrado localmente.' };
    }
    

    const estaLogado = isAuthenticated(email);
    if (estaLogado) {

        return { success: false, error: 'E-mail já cadastrado.' };
    } else {
        try {

            const response = await fetch('http://localhost:3000/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body:JSON.stringify({
                    email : email,
                    nome : nome,
                    senha : senha,
                    data_nascimento : dataNascimento
                })
            });
            console.warn(response);
            
            if (!response?.ok) {
                     console.log("Já tem")
                return { success: false, error: "Esse email já está em uso!"};
            }
        } catch (error) {
                        console.error("Erro ao conectar com a API:", error);
                return { success: false, error};
        }
    }

    const newUser = { nome, email, senha, dataNascimento, criadoEm: new Date().toISOString() };
    users.push(newUser);
    setLocalItem(STORAGE_KEYS.USER_PROFILE, users);
    return { success: true, user: newUser };
}

export function logout() {
    removeLocalItem(STORAGE_KEYS.AUTH_USER);
}
