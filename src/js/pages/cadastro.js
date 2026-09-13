import { ready, qs, on } from '../utils/dom.js';
import { SELECTORS } from '../constants/selectors.js';
import { ROUTES } from '../constants/routes.js';
import { MESSAGES } from '../constants/messages.js';
import { TIMING } from '../constants/timing.js';
import { cadastrar } from '../services/authService.js';

ready( () => {
    const formCadastro = qs(SELECTORS.FORM_CADASTRO);
    const mensagem = qs(SELECTORS.MENSAGEM);

    if (formCadastro) {
        on(formCadastro, 'submit', async (event) => {
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

            const result =  await cadastrar({ nome, email, senha, dataNascimento });

            if (result.success) {
                if (mensagem) {
                    mensagem.style.display = 'block';
                    mensagem.style.background = '#e4f8ec';
                    mensagem.style.color = '#16834a';
                    mensagem.textContent = MESSAGES.CADASTRO_SUCESSO;
                }

                setTimeout(() => {
               //     window.location.href = ROUTES.LOGIN;
                }, TIMING.REDIRECT_SUCCESS);
            } else if (mensagem) {
                mensagem.style.display = 'block';
                mensagem.style.background = '#ffe5e5';
                mensagem.style.color = '#c00000';
                mensagem.textContent = result.error || 'Erro ao realizar cadastro.';
            }
        });
    }
});
