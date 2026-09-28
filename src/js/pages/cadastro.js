import { ready, qs, on } from '../utils/dom.js';
import { SELECTORS } from '../constants/selectors.js';
import { ROUTES } from '../constants/routes.js';
import { MESSAGES } from '../constants/messages.js';
import { TIMING } from '../constants/timing.js';

ready( () => {
    if (localStorage.getItem("aprovadrive_auth_user")) {
         window.location.href = ROUTES.DASHBOARD;
    }
    const secaoCadastro = qs(SELECTORS.SECAO_CADASTRO);
    const secaoPergunta = qs(SELECTORS.SECAO_PERGUNTA);
    const formCadastro = qs(SELECTORS.FORM_CADASTRO);
    const formPergunta = qs(SELECTORS.FORM_PERGUNTA);
    const mensagem = qs(SELECTORS.MENSAGEM);
    const mensagemSeguranca = qs(SELECTORS.MENSAGEM_SEGURANCA);
    const btnVoltarCadastro = qs(SELECTORS.BTN_VOLTAR_CADASTRO);
    const selectPergunta = qs(SELECTORS.PERGUNTA_SEGURANCA);
    const campoPerguntaCustom = qs(SELECTORS.CAMPO_PERGUNTA_CUSTOM);
    const inputPerguntaCustom = qs(SELECTORS.PERGUNTA_CUSTOM);
    const inputResposta = qs(SELECTORS.RESPOSTA_SEGURANCA);

    function alternarParaPergunta() {
        if (secaoCadastro) secaoCadastro.style.display = 'none';
        if (secaoPergunta) {
            secaoPergunta.style.display = 'block';
            if (mensagemSeguranca) {
                mensagemSeguranca.style.display = 'none';
                mensagemSeguranca.textContent = '';
            }
        }
    }

    function alternarParaCadastro() {
        if (secaoPergunta) secaoPergunta.style.display = 'none';
        if (secaoCadastro) {
            secaoCadastro.style.display = 'block';
        }
    }

    if (selectPergunta) {
        on(selectPergunta, 'change', () => {
            if (selectPergunta.value === 'custom') {
                if (campoPerguntaCustom) campoPerguntaCustom.style.display = 'block';
                if (inputPerguntaCustom) inputPerguntaCustom.focus();
            } else {
                if (campoPerguntaCustom) campoPerguntaCustom.style.display = 'none';
            }
        });
    }

    if (btnVoltarCadastro) {
        on(btnVoltarCadastro, 'click', (event) => {
            event.preventDefault();
            alternarParaCadastro();
        });
    }

    if (formCadastro) {
        on(formCadastro, 'submit', (event) => {
            event.preventDefault();

            const nome = qs(SELECTORS.CADASTRO_NOME)?.value.trim();
            const email = qs(SELECTORS.CADASTRO_EMAIL)?.value.trim();
            const senha = qs(SELECTORS.CADASTRO_SENHA)?.value;
            const confirmarSenha = qs(SELECTORS.CADASTRO_CONFIRMAR_SENHA)?.value;
            const dataNascimento = qs(SELECTORS.CADASTRO_DATA_NASCIMENTO)?.value;

            if (!nome || !email || !senha || !confirmarSenha || !dataNascimento) {
                if (mensagem) {
                    mensagem.style.display = 'block';
                    mensagem.style.background = '#ffe5e5';
                    mensagem.style.color = '#c00000';
                    mensagem.textContent = MESSAGES.CAMPOS_OBRIGATORIOS;
                }
                return;
            }

            if (senha !== confirmarSenha) {
                if (mensagem) {
                    mensagem.style.display = 'block';
                    mensagem.style.background = '#ffe5e5';
                    mensagem.style.color = '#c00000';
                    mensagem.textContent = MESSAGES.SENHAS_DIVERGENTES;
                }
                return;
            }

            if (senha.length < 6) {
                if (mensagem) {
                    mensagem.style.display = 'block';
                    mensagem.style.background = '#ffe5e5';
                    mensagem.style.color = '#c00000';
                    mensagem.textContent = MESSAGES.SENHA_CURTA;
                }
                return;
            }

            if (mensagem) {
                mensagem.style.display = 'none';
                mensagem.textContent = '';
            }

            alternarParaPergunta();
        });
    }

    if (formPergunta) {
        on(formPergunta, 'submit', (event) => {
            event.preventDefault();

            const isCustom = selectPergunta?.value === 'custom';
            const pergunta = isCustom
                ? inputPerguntaCustom?.value.trim()
                : selectPergunta?.value;
            const resposta = inputResposta?.value.trim();

            if (!pergunta || (isCustom && pergunta.length < 5)) {
                if (mensagemSeguranca) {
                    mensagemSeguranca.style.display = 'block';
                    mensagemSeguranca.style.background = '#ffe5e5';
                    mensagemSeguranca.style.color = '#c00000';
                    mensagemSeguranca.textContent = 'Por favor, selecione ou digite uma pergunta válida (mínimo 5 caracteres).';
                }
                return;
            }

            if (!resposta || resposta.length < 2) {
                if (mensagemSeguranca) {
                    mensagemSeguranca.style.display = 'block';
                    mensagemSeguranca.style.background = '#ffe5e5';
                    mensagemSeguranca.style.color = '#c00000';
                    mensagemSeguranca.textContent = 'A resposta deve ter pelo menos 2 caracteres.';
                }
                return;
            }

            if (mensagemSeguranca) {
                mensagemSeguranca.style.display = 'block';
                mensagemSeguranca.style.background = '#e4f8ec';
                mensagemSeguranca.style.color = '#16834a';
                mensagemSeguranca.textContent = MESSAGES.CADASTRO_SUCESSO;
            }

            setTimeout(() => {
                window.location.href = ROUTES.LOGIN;
            }, TIMING.REDIRECT_SUCCESS);
        });
    }
});
