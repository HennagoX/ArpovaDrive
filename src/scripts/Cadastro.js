document.addEventListener("DOMContentLoaded", () => {
    const formCadastro = document.getElementById("formCadastro");
    const mensagem = document.getElementById("mensagem");

    if (formCadastro) {
        formCadastro.addEventListener("submit", (event) => {
            event.preventDefault();

            const nome = document.getElementById("nome")?.value.trim();
            const email = document.getElementById("email")?.value.trim();
            const senha = document.getElementById("senhaCadastro")?.value;
            const confirmarSenha = document.getElementById("confirmarSenha")?.value;
            const dataNascimento = document.getElementById("dataNascimento")?.value;

            if (!nome || !email || !senha || !confirmarSenha || !dataNascimento) {
                if (mensagem) {
                    mensagem.style.display = "block";
                    mensagem.style.background = "#ffe5e5";
                    mensagem.style.color = "#c00000";
                    mensagem.textContent = "Por favor, preencha todos os campos.";
                }
                return;
            }

            if (senha !== confirmarSenha) {
                if (mensagem) {
                    mensagem.style.display = "block";
                    mensagem.style.background = "#ffe5e5";
                    mensagem.style.color = "#c00000";
                    mensagem.textContent = "As senhas não coincidem.";
                }
                return;
            }

            if (senha.length < 6) {
                if (mensagem) {
                    mensagem.style.display = "block";
                    mensagem.style.background = "#ffe5e5";
                    mensagem.style.color = "#c00000";
                    mensagem.textContent = "A senha deve ter no mínimo 6 caracteres.";
                }
                return;
            }

            if (mensagem) {
                mensagem.style.display = "block";
                mensagem.style.background = "#e4f8ec";
                mensagem.style.color = "#16834a";
                mensagem.textContent = "Cadastro realizado com sucesso! Redirecionando...";
            }

            setTimeout(() => {
                window.location.href = "./Login.html";
            }, 1000);
        });
    }
});
