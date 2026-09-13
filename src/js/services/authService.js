import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem, removeLocalItem } from '../utils/storage.js';
import { ENDPOINTS } from '../constants/routes.js';


export function getCurrentUser() {
    return getLocalItem(STORAGE_KEYS.AUTH_USER, null);
}

export function isAuthenticated() {
    return getCurrentUser();
}

export async function login(email, senha) {
    if (!email || !senha) return { success: false, error: 'Preencha todos os campos.' };
    
        

        try{
    const request = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        body: JSON.stringify({
            "email" : email,
            "senha" : senha
        })
          }
        )
       
          if (request.status === 429){
              return { success: false, error: 'Você fez muitas requisições!' };
        }

      const data = await request.json();
        
      if (request?.ok) {
      return {success : true};
      }
      else
      {
       return {success : false, error: "E-mail ou senha incorretos!"};
      }

    }
    catch(error){
   console.error("Erro ao conectar com a API:", error);
    return { success: false, error};
    }
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
            const response = await fetch(ENDPOINTS.USUARIOS.CADASTRO, {
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

            const data = await response.json();
            console.log(data);
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
