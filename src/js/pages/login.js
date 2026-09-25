import { ready, qs, on } from '../utils/dom.js';
import { SELECTORS } from '../constants/selectors.js';
import { ROUTES } from '../constants/routes.js';
import { MESSAGES } from '../constants/messages.js';
import { TIMING } from '../constants/timing.js';
import { login } from '../services/authService.js';

ready(() => {
    if (localStorage.getItem("aprovadrive_auth_user")) {
         window.location.href = ROUTES.DASHBOARD;
    }
    const senha = qs(SELECTORS.LOGIN_SENHA);
    const mostrarSenha = qs(SELECTORS.BTN_MOSTRAR_SENHA);
    const formLogin = qs(SELECTORS.FORM_LOGIN);
    const mensagem = qs(SELECTORS.MENSAGEM);
    const esqueci = qs(SELECTORS.BTN_ESQUECI_SENHA);
    const google = qs(SELECTORS.BTN_GOOGLE);

    if (mostrarSenha && senha) {
        on(mostrarSenha, 'click', () => {
            const isPassword = senha.type === 'password';
            senha.type = isPassword ? 'text' : 'password';
            const icon = qs('.material-symbols-outlined', mostrarSenha) || mostrarSenha;
            icon.textContent = isPassword ? 'visibility_off' : 'visibility';
        });
    }

    if (formLogin) {
        on(formLogin, 'submit', async (event) => {
            try {
                event.preventDefault();

                const usuario = qs(SELECTORS.LOGIN_USUARIO)?.value.trim();
                const senhaValor = senha?.value.trim();

                if (!usuario || !senhaValor) {
                    if (mensagem) {
                        mensagem.style.display = 'block';
                        mensagem.style.background = '#ffe5e5';
                        mensagem.style.color = '#c00000';
                        mensagem.textContent = MESSAGES.CAMPOS_OBRIGATORIOS;
                    }
                    return;
                }
                const result = await login(usuario, senhaValor);

                if (result.success) {
                    if (mensagem) {
                        mensagem.style.display = 'block';
                        mensagem.style.background = '#e4f8ec';
                        mensagem.style.color = '#16834a';
                        mensagem.textContent = MESSAGES.LOGIN_SUCESSO;
                    }

                    setTimeout(() => {
                        window.location.href = ROUTES.DASHBOARD;
                    }, TIMING.REDIRECT_DELAY);
                } else {
                    if (mensagem) {
                        mensagem.style.display = 'block';
                        mensagem.style.background = '#ffe5e5';
                        mensagem.style.color = '#c00000';
                        mensagem.textContent = result?.error || MESSAGES.LOGIN_ERRADO;
                    }
                }
            } catch (erro) {
                if (mensagem) {
                    mensagem.style.display = 'block';
                    mensagem.style.background = '#ffe5e5';
                    mensagem.style.color = '#c00000';
                    mensagem.textContent = MESSAGES.CONEXAO_FALHA;
                }
            }
        });
    }

    if (esqueci) {
        on(esqueci, 'click', (event) => {
            event.preventDefault();
            alert(MESSAGES.ESQUECI_SENHA_INFO);
        });
    }

    if (google) {
        on(google, 'click', () => {
            alert(MESSAGES.GOOGLE_INFO);
        });
    }
});
