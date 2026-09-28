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
    const secaoLogin = qs(SELECTORS.SECAO_LOGIN);
    const secaoEsqueci = qs(SELECTORS.SECAO_ESQUECI);

    const senha = qs(SELECTORS.LOGIN_SENHA);
    const mostrarSenha = qs(SELECTORS.BTN_MOSTRAR_SENHA);
    const formLogin = qs(SELECTORS.FORM_LOGIN);
    const mensagem = qs(SELECTORS.MENSAGEM);
    const esqueci = qs(SELECTORS.BTN_ESQUECI_SENHA);
    const google = qs(SELECTORS.BTN_GOOGLE);

    const formEsqueci = qs(SELECTORS.FORM_ESQUECI);
    const recuperarEmail = qs(SELECTORS.RECUPERAR_EMAIL);
    const recuperarResposta = qs(SELECTORS.RECUPERAR_RESPOSTA);
    const btnVoltarLogin = qs(SELECTORS.BTN_VOLTAR_LOGIN);
    const linkVoltarLogin = qs(SELECTORS.LINK_VOLTAR_LOGIN);
    const googleRecuperar = qs(SELECTORS.BTN_GOOGLE_RECUPERAR);
    const mensagemEsqueci = qs(SELECTORS.MENSAGEM_ESQUECI);

    function alternarParaEsqueci() {
        if (secaoLogin) secaoLogin.style.display = 'none';
        if (secaoEsqueci) {
            secaoEsqueci.style.display = 'block';
            const emailDigitado = qs(SELECTORS.LOGIN_USUARIO)?.value.trim();
            if (emailDigitado && recuperarEmail && !recuperarEmail.value) {
                recuperarEmail.value = emailDigitado;
            }
            if (mensagemEsqueci) {
                mensagemEsqueci.style.display = 'none';
                mensagemEsqueci.textContent = '';
            }
        }
    }

    function alternarParaLogin() {
        if (secaoEsqueci) secaoEsqueci.style.display = 'none';
        if (secaoLogin) {
            secaoLogin.style.display = 'block';
            if (mensagem) {
                mensagem.style.display = 'none';
                mensagem.textContent = '';
            }
        }
    }

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
            alternarParaEsqueci();
        });
    }

    if (btnVoltarLogin) {
        on(btnVoltarLogin, 'click', (event) => {
            event.preventDefault();
            alternarParaLogin();
        });
    }

    if (linkVoltarLogin) {
        on(linkVoltarLogin, 'click', (event) => {
            event.preventDefault();
            alternarParaLogin();
        });
    }

    if (formEsqueci) {
        on(formEsqueci, 'submit', (event) => {
            event.preventDefault();

            const emailOuCpf = recuperarEmail?.value.trim();
            const resposta = recuperarResposta?.value.trim();

            if (!emailOuCpf || emailOuCpf.length < 3) {
                if (mensagemEsqueci) {
                    mensagemEsqueci.style.display = 'block';
                    mensagemEsqueci.style.background = '#ffe5e5';
                    mensagemEsqueci.style.color = '#c00000';
                    mensagemEsqueci.textContent = 'Por favor, informe um e-mail válido.';
                }
                return;
            }

            if (!resposta || resposta.length < 2) {
                if (mensagemEsqueci) {
                    mensagemEsqueci.style.display = 'block';
                    mensagemEsqueci.style.background = '#ffe5e5';
                    mensagemEsqueci.style.color = '#c00000';
                    mensagemEsqueci.textContent = 'A resposta deve ter pelo menos 2 caracteres.';
                }
                return;
            }

            if (mensagemEsqueci) {
                mensagemEsqueci.style.display = 'block';
                mensagemEsqueci.style.background = '#e4f8ec';
                mensagemEsqueci.style.color = '#16834a';
                mensagemEsqueci.textContent = 'Instruções enviadas com sucesso! Verifique seu e-mail.';
            }

            setTimeout(() => {
                alternarParaLogin();
            }, 2500);
        });
    }

    if (google) {
        on(google, 'click', () => {
            alert(MESSAGES.GOOGLE_INFO);
        });
    }

    if (googleRecuperar) {
        on(googleRecuperar, 'click', () => {
            alert(MESSAGES.GOOGLE_INFO);
        });
    }
});
