import { ready, qs, on } from '../utils/dom.js';
import { SELECTORS } from '../constants/selectors.js';
import { ROUTES } from '../constants/routes.js';
import { MESSAGES } from '../constants/messages.js';
import { TIMING } from '../constants/timing.js';
import { cadastrar, verificarEmailDisponivel } from '../services/authService.js';
import { initTheme } from '../utils/themeManager.js';

ready(() => {
    // Inicializa o gerenciador de tema (suporte a Dark Mode e Claro)
    initTheme();

    if (localStorage.getItem("aprovadrive_auth_user")) {
        window.location.href = ROUTES.DASHBOARD;
        return;
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

    // Novos elementos visuais e de interação
    const indicadorEtapa1 = qs('#indicadorEtapa1');
    const indicadorEtapa2 = qs('#indicadorEtapa2');
    const inputDataNascimento = qs(SELECTORS.CADASTRO_DATA_NASCIMENTO);
    const feedbackIdade = qs('#feedbackIdade');

    // Configuração dos limites do calendário (18 anos mínimos e 110 anos máximos)
    const formatarDataISO = (d) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const hoje = new Date();
    const dataMaxima18Anos = formatarDataISO(new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate()));
    const dataMinima110Anos = formatarDataISO(new Date(hoje.getFullYear() - 110, hoje.getMonth(), hoje.getDate()));

    if (inputDataNascimento) {
        inputDataNascimento.setAttribute('max', dataMaxima18Anos);
        inputDataNascimento.setAttribute('min', dataMinima110Anos);
    }

    /**
     * Valida se a idade é plausível e permitida para o processo de CNH (DETRAN)
     * Requisitos:
     * - Não pode ser vazia ou inexistente
     * - Não pode ser uma data futura
     * - Deve ter no mínimo 18 anos completos (Art. 140, I do CTB)
     * - Deve ter no máximo 110 anos (idade plausível)
     */
    function validarIdade(dataString) {
        if (!dataString) {
            return {
                valido: false,
                mensagem: 'Por favor, informe sua data de nascimento.'
            };
        }

        const partes = dataString.split('-');
        if (partes.length !== 3) {
            return {
                valido: false,
                mensagem: 'Formato de data inválido. Use dia, mês e ano.'
            };
        }

        const ano = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const dia = parseInt(partes[2], 10);

        const dataNasc = new Date(ano, mes, dia);
        if (isNaN(dataNasc.getTime()) || dataNasc.getFullYear() !== ano || dataNasc.getMonth() !== mes || dataNasc.getDate() !== dia) {
            return {
                valido: false,
                mensagem: 'Data de nascimento inexistente ou inválida.'
            };
        }

        const agora = new Date();
        const anoAtual = agora.getFullYear();
        const mesAtual = agora.getMonth();
        const diaAtual = agora.getDate();
        const hojeZerado = new Date(anoAtual, mesAtual, diaAtual);

        if (dataNasc > hojeZerado) {
            return {
                valido: false,
                mensagem: 'A data de nascimento não pode estar no futuro.'
            };
        }

        let idade = anoAtual - ano;
        const jaFezAniversario = (mesAtual > mes) || (mesAtual === mes && diaAtual >= dia);
        if (!jaFezAniversario) {
            idade--;
        }

        if (idade < 18) {
            return {
                valido: false,
                idade,
                mensagem: `Você tem ${idade} ano${idade === 1 ? '' : 's'}. É necessário ter no mínimo 18 anos para se cadastrar (exigência DETRAN para CNH).`
            };
        }

        if (idade > 110) {
            return {
                valido: false,
                idade,
                mensagem: 'Por favor, insira uma data de nascimento plausível (idade máxima permitida: 110 anos).'
            };
        }

        return {
            valido: true,
            idade,
            mensagem: `${idade} anos completos — Idade apta para habilitação DETRAN.`
        };
    }

    /**
     * Atualiza o badge dinâmico de feedback da idade em tempo real
     */
    function atualizarFeedbackIdade() {
        if (!feedbackIdade || !inputDataNascimento) return;
        const valor = inputDataNascimento.value;
        if (!valor) {
            feedbackIdade.className = 'campo-feedback';
            feedbackIdade.innerHTML = '';
            feedbackIdade.style.display = 'none';
            inputDataNascimento.classList.remove('input-erro', 'input-sucesso');
            return;
        }

        const res = validarIdade(valor);
        if (res.valido) {
            feedbackIdade.className = 'campo-feedback valido';
            feedbackIdade.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${res.mensagem}</span>`;
            feedbackIdade.style.display = 'flex';
            inputDataNascimento.classList.remove('input-erro');
            inputDataNascimento.classList.add('input-sucesso');
        } else {
            feedbackIdade.className = 'campo-feedback invalido';
            feedbackIdade.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>${res.mensagem}</span>`;
            feedbackIdade.style.display = 'flex';
            inputDataNascimento.classList.remove('input-sucesso');
            inputDataNascimento.classList.add('input-erro');
        }
    }

    if (inputDataNascimento) {
        on(inputDataNascimento, 'input', atualizarFeedbackIdade);
        on(inputDataNascimento, 'change', atualizarFeedbackIdade);

        // Abre o calendário nativo do navegador ao clicar no input
        const abrirSeletorCalendario = () => {
            if (typeof inputDataNascimento.showPicker === 'function') {
                try {
                    inputDataNascimento.showPicker();
                } catch (e) {
                    // Fallback seguro se o picker já estiver aberto ou não suportado
                }
            }
        };

        on(inputDataNascimento, 'click', abrirSeletorCalendario);
    }

    // Configuração dos botões de alternar visualização de senha
    function setupPasswordToggle(buttonSelector, inputSelector) {
        const btn = qs(buttonSelector);
        const input = qs(inputSelector);
        if (btn && input) {
            on(btn, 'click', (e) => {
                e.preventDefault();
                const isPass = input.type === 'password';
                input.type = isPass ? 'text' : 'password';
                const icon = qs('.material-symbols-outlined', btn) || btn;
                icon.textContent = isPass ? 'visibility_off' : 'visibility';
                btn.setAttribute('aria-label', isPass ? 'Ocultar senha' : 'Ver senha');
                btn.setAttribute('title', isPass ? 'Ocultar senha' : 'Ver senha');
            });
        }
    }

    setupPasswordToggle('#toggleSenhaCadastro', SELECTORS.CADASTRO_SENHA);
    setupPasswordToggle('#toggleConfirmarSenha', SELECTORS.CADASTRO_CONFIRMAR_SENHA);

    function alternarParaPergunta() {
        if (secaoCadastro) secaoCadastro.style.display = 'none';
        if (secaoPergunta) {
            secaoPergunta.style.display = 'block';
            if (mensagemSeguranca) {
                mensagemSeguranca.style.display = 'none';
                mensagemSeguranca.textContent = '';
            }
        }
        if (indicadorEtapa1) {
            indicadorEtapa1.classList.remove('ativa');
            indicadorEtapa1.classList.add('concluida');
        }
        if (indicadorEtapa2) {
            indicadorEtapa2.classList.add('ativa');
        }
    }

    function alternarParaCadastro() {
        if (secaoPergunta) secaoPergunta.style.display = 'none';
        if (secaoCadastro) {
            secaoCadastro.style.display = 'block';
        }
        if (indicadorEtapa1) {
            indicadorEtapa1.classList.remove('concluida');
            indicadorEtapa1.classList.add('ativa');
        }
        if (indicadorEtapa2) {
            indicadorEtapa2.classList.remove('ativa');
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
        const inputEmail = qs(SELECTORS.CADASTRO_EMAIL);
        if (inputEmail) {
            on(inputEmail, 'input', () => {
                inputEmail.classList.remove('input-erro');
                if (mensagem && (mensagem.textContent.includes('e-mail') || mensagem.textContent.includes('E-mail'))) {
                    mensagem.style.display = 'none';
                    mensagem.textContent = '';
                }
            });
        }

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

            // Validação de formato de e-mail no front
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (mensagem) {
                    mensagem.style.display = 'block';
                    mensagem.style.background = '#ffe5e5';
                    mensagem.style.color = '#c00000';
                    mensagem.textContent = 'Por favor, insira um e-mail válido.';
                }
                if (inputEmail) {
                    inputEmail.classList.add('input-erro');
                    inputEmail.focus();
                }
                return;
            }

            // Validação de Idade (Mínimo 18 anos e idade plausível - Front-end)
            const validacaoIdade = validarIdade(dataNascimento);
            if (!validacaoIdade.valido) {
                if (mensagem) {
                    mensagem.style.display = 'block';
                    mensagem.style.background = '#ffe5e5';
                    mensagem.style.color = '#c00000';
                    mensagem.textContent = validacaoIdade.mensagem;
                }
                atualizarFeedbackIdade();
                const inputData = qs(SELECTORS.CADASTRO_DATA_NASCIMENTO);
                if (inputData) {
                    inputData.focus();
                    if (typeof inputData.showPicker === 'function') {
                        try { inputData.showPicker(); } catch (e) {}
                    }
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

            // Verifica se o e-mail já existe no banco antes de ir para a etapa de segurança
            const btnContinuar = qs('#btnContinuarCadastro');
            const textoOriginal = btnContinuar ? btnContinuar.textContent : 'Continuar';
            if (btnContinuar) {
                btnContinuar.disabled = true;
                btnContinuar.textContent = 'Verificando...';
            }

            try {
                const checagem = await verificarEmailDisponivel(email);
                if (checagem.success && !checagem.disponivel) {
                    if (mensagem) {
                        mensagem.style.display = 'block';
                        mensagem.style.background = '#ffe5e5';
                        mensagem.style.color = '#c00000';
                        mensagem.textContent = checagem.message || 'Esse e-mail já está em uso!';
                    }
                    if (inputEmail) {
                        inputEmail.classList.add('input-erro');
                        inputEmail.focus();
                    }
                    return;
                }
            } catch (err) {
                console.warn('[Cadastro] Não foi possível pré-verificar e-mail:', err);
            } finally {
                if (btnContinuar) {
                    btnContinuar.disabled = false;
                    btnContinuar.textContent = textoOriginal;
                }
            }

            if (inputEmail) {
                inputEmail.classList.remove('input-erro');
            }

            if (mensagem) {
                mensagem.style.display = 'none';
                mensagem.textContent = '';
            }

            alternarParaPergunta();
        });
    }

    if (formPergunta) {
        on(formPergunta, 'submit', async (event) => {
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

            try {
                const nome = qs(SELECTORS.CADASTRO_NOME)?.value.trim();
                const email = qs(SELECTORS.CADASTRO_EMAIL)?.value.trim();
                const senha = qs(SELECTORS.CADASTRO_SENHA)?.value;
                const dataNascimento = qs(SELECTORS.CADASTRO_DATA_NASCIMENTO)?.value;

                const result = await cadastrar({
                    nome,
                    email,
                    senha,
                    dataNascimento,
                    perguntaSeguranca: pergunta,
                    respostaSeguranca: resposta
                });

                if (result.success) {
                    if (mensagemSeguranca) {
                        mensagemSeguranca.style.display = 'block';
                        mensagemSeguranca.style.background = '#e4f8ec';
                        mensagemSeguranca.style.color = '#16834a';
                        mensagemSeguranca.textContent = MESSAGES.CADASTRO_SUCESSO;
                    }

                    setTimeout(() => {
                        window.location.href = ROUTES.LOGIN;
                    }, TIMING.REDIRECT_SUCCESS);
                } else {
                    if (mensagemSeguranca) {
                        mensagemSeguranca.style.display = 'block';
                        mensagemSeguranca.style.background = '#ffe5e5';
                        mensagemSeguranca.style.color = '#c00000';
                        mensagemSeguranca.textContent = result.error || 'Erro ao realizar cadastro.';
                    }
                }
            } catch (err) {
                if (mensagemSeguranca) {
                    mensagemSeguranca.style.display = 'block';
                    mensagemSeguranca.style.background = '#ffe5e5';
                    mensagemSeguranca.style.color = '#c00000';
                    mensagemSeguranca.textContent = MESSAGES.CONEXAO_FALHA;
                }
            }
        });
    }
});
