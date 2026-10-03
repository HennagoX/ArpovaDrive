import { ready, qs, on } from '../utils/dom.js';
import { SELECTORS } from '../constants/selectors.js';
import { ROUTES } from '../constants/routes.js';
import { MESSAGES } from '../constants/messages.js';
import { TIMING } from '../constants/timing.js';
import { login, buscarPerguntaSeguranca, verificarRespostaSeguranca, redefinirSenha } from '../services/authService.js';

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
    const containerPergunta = qs(SELECTORS.CONTAINER_PERGUNTA_EXIBIDA);
    const textoPergunta = qs(SELECTORS.TEXTO_PERGUNTA_EXIBIDA);
    const etapaNovaSenha = qs(SELECTORS.ETAPA_NOVA_SENHA);
    const novaSenha = qs(SELECTORS.RECUPERAR_NOVA_SENHA);
    const confirmarNovaSenha = qs(SELECTORS.RECUPERAR_CONFIRMAR_SENHA);
    const mostrarNovaSenha = qs(SELECTORS.BTN_MOSTRAR_NOVA_SENHA);
    const btnAcaoRecuperar = qs(SELECTORS.BTN_ACAO_RECUPERAR);
    const btnVoltarLogin = qs(SELECTORS.BTN_VOLTAR_LOGIN);
    const linkVoltarLogin = qs(SELECTORS.LINK_VOLTAR_LOGIN);
    const googleRecuperar = qs(SELECTORS.BTN_GOOGLE_RECUPERAR);
    const mensagemEsqueci = qs(SELECTORS.MENSAGEM_ESQUECI);

    let respostaValidada = false;

    async function tentarCarregarPergunta() {
        const email = recuperarEmail?.value.trim();
        if (!email || email.length < 5 || !email.includes('@')) {
            if (containerPergunta) containerPergunta.style.display = 'none';
            return;
        }

        const res = await buscarPerguntaSeguranca(email);
        if (res.success && res.pergunta) {
            if (textoPergunta) textoPergunta.textContent = `Pergunta: ${res.pergunta}`;
            if (containerPergunta) containerPergunta.style.display = 'block';
        } else if (containerPergunta) {
            containerPergunta.style.display = 'none';
        }
    }

    function resetarFormEsqueci() {
        respostaValidada = false;
        if (etapaNovaSenha) etapaNovaSenha.style.display = 'none';
        if (recuperarEmail) {
            recuperarEmail.readOnly = false;
        }
        if (recuperarResposta) {
            recuperarResposta.readOnly = false;
            recuperarResposta.value = '';
        }
        if (novaSenha) novaSenha.value = '';
        if (confirmarNovaSenha) confirmarNovaSenha.value = '';
        if (btnAcaoRecuperar) btnAcaoRecuperar.textContent = 'Verificar resposta';
        if (containerPergunta) containerPergunta.style.display = 'none';
        if (mensagemEsqueci) {
            mensagemEsqueci.style.display = 'none';
            mensagemEsqueci.textContent = '';
        }
    }

    function alternarParaEsqueci() {
        if (secaoLogin) secaoLogin.style.display = 'none';
        if (secaoEsqueci) {
            secaoEsqueci.style.display = 'block';
            resetarFormEsqueci();
            const emailDigitado = qs(SELECTORS.LOGIN_USUARIO)?.value.trim();
            if (emailDigitado && recuperarEmail) {
                recuperarEmail.value = emailDigitado;
                tentarCarregarPergunta();
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
        resetarFormEsqueci();
    }

    if (recuperarEmail) {
        on(recuperarEmail, 'blur', tentarCarregarPergunta);
        on(recuperarEmail, 'change', tentarCarregarPergunta);
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

    if (mostrarNovaSenha && novaSenha) {
        on(mostrarNovaSenha, 'click', () => {
            const isPassword = novaSenha.type === 'password';
            novaSenha.type = isPassword ? 'text' : 'password';
            const icon = qs('.material-symbols-outlined', mostrarNovaSenha) || mostrarNovaSenha;
            icon.textContent = isPassword ? 'visibility_off' : 'visibility';
        });
    }

    if (formEsqueci) {
        on(formEsqueci, 'submit', async (event) => {
            event.preventDefault();

            const email = recuperarEmail?.value.trim();
            const resposta = recuperarResposta?.value.trim();

            if (!email || email.length < 3) {
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

            if (!respostaValidada) {
                if (mensagemEsqueci) {
                    mensagemEsqueci.style.display = 'block';
                    mensagemEsqueci.style.background = '#eef2ff';
                    mensagemEsqueci.style.color = '#1e40af';
                    mensagemEsqueci.textContent = 'Verificando resposta...';
                }

                const result = await verificarRespostaSeguranca(email, resposta);
                if (result.success) {
                    respostaValidada = true;
                    if (recuperarEmail) recuperarEmail.readOnly = true;
                    if (recuperarResposta) recuperarResposta.readOnly = true;
                    if (etapaNovaSenha) etapaNovaSenha.style.display = 'block';
                    if (btnAcaoRecuperar) btnAcaoRecuperar.textContent = 'Salvar nova senha';
                    if (novaSenha) novaSenha.focus();

                    if (mensagemEsqueci) {
                        mensagemEsqueci.style.display = 'block';
                        mensagemEsqueci.style.background = '#e4f8ec';
                        mensagemEsqueci.style.color = '#16834a';
                        mensagemEsqueci.textContent = 'Resposta correta! Agora crie sua nova senha abaixo.';
                    }
                } else {
                    if (mensagemEsqueci) {
                        mensagemEsqueci.style.display = 'block';
                        mensagemEsqueci.style.background = '#ffe5e5';
                        mensagemEsqueci.style.color = '#c00000';
                        mensagemEsqueci.textContent = result.error || 'Resposta de segurança incorreta.';
                    }
                }
                return;
            }

            const novaSenhaValor = novaSenha?.value;
            const confirmarSenhaValor = confirmarNovaSenha?.value;

            if (!novaSenhaValor || novaSenhaValor.length < 6) {
                if (mensagemEsqueci) {
                    mensagemEsqueci.style.display = 'block';
                    mensagemEsqueci.style.background = '#ffe5e5';
                    mensagemEsqueci.style.color = '#c00000';
                    mensagemEsqueci.textContent = MESSAGES.SENHA_CURTA;
                }
                return;
            }

            if (novaSenhaValor !== confirmarSenhaValor) {
                if (mensagemEsqueci) {
                    mensagemEsqueci.style.display = 'block';
                    mensagemEsqueci.style.background = '#ffe5e5';
                    mensagemEsqueci.style.color = '#c00000';
                    mensagemEsqueci.textContent = MESSAGES.SENHAS_DIVERGENTES;
                }
                return;
            }

            if (mensagemEsqueci) {
                mensagemEsqueci.style.display = 'block';
                mensagemEsqueci.style.background = '#eef2ff';
                mensagemEsqueci.style.color = '#1e40af';
                mensagemEsqueci.textContent = 'Atualizando sua senha...';
            }

            const redResult = await redefinirSenha(email, resposta, novaSenhaValor);
            if (redResult.success) {
                if (mensagemEsqueci) {
                    mensagemEsqueci.style.display = 'block';
                    mensagemEsqueci.style.background = '#e4f8ec';
                    mensagemEsqueci.style.color = '#16834a';
                    mensagemEsqueci.textContent = 'Senha redefinida com sucesso! Redirecionando para o login...';
                }

                setTimeout(() => {
                    alternarParaLogin();
                    const loginEmail = qs(SELECTORS.LOGIN_USUARIO);
                    if (loginEmail) loginEmail.value = email;
                    const loginSenha = qs(SELECTORS.LOGIN_SENHA);
                    if (loginSenha) loginSenha.focus();
                }, 1500);
            } else {
                if (mensagemEsqueci) {
                    mensagemEsqueci.style.display = 'block';
                    mensagemEsqueci.style.background = '#ffe5e5';
                    mensagemEsqueci.style.color = '#c00000';
                    mensagemEsqueci.textContent = redResult.error || 'Não foi possível redefinir a senha.';
                }
            }
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
