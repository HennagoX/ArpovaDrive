document.addEventListener("DOMContentLoaded", () => {
    const senha = document.getElementById("senha");
    const mostrarSenha = document.getElementById("mostrarSenha");
    const formLogin = document.getElementById("formLogin");
    const mensagem = document.getElementById("mensagem");
    const esqueci = document.getElementById("esqueci");
    const google = document.getElementById("google");

    if (mostrarSenha && senha) {
        mostrarSenha.addEventListener("click", () => {
            if (senha.type === "password") {
                senha.type = "text";
                mostrarSenha.textContent = "🙈";
            } else {
                senha.type = "password";
                mostrarSenha.textContent = "👁";
            }
        });
    }

    if (formLogin) {
        formLogin.addEventListener("submit", (event) => {
            event.preventDefault();

            const usuario = document.getElementById("usuario")?.value.trim();
            const senhaValor = senha?.value.trim();

            if (!usuario || !senhaValor) {
                if (mensagem) {
                    mensagem.style.display = "block";
                    mensagem.style.background = "#ffe5e5";
                    mensagem.style.color = "#c00000";
                    mensagem.textContent = "Preencha todos os campos.";
                }
                return;
            }

            if (mensagem) {
                mensagem.style.display = "block";
                mensagem.style.background = "#e4f8ec";
                mensagem.style.color = "#16834a";
                mensagem.textContent = "Entrando...";
            }

            setTimeout(() => {
                window.location.href = "./telaInicial.html";
            }, 500);
        });
    }

    if (esqueci) {
        esqueci.addEventListener("click", (event) => {
            event.preventDefault();
            alert("Página de recuperação de senha.");
        });
    }

    if (google) {
        google.addEventListener("click", () => {
            alert("Aqui será integrada a entrada com Google.");
        });
    }
});