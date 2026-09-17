import { ready, setText, qsa } from "../utils/dom.js";
import { getCurrentUser, logout } from '../services/authService.js';

ready(() => {
    const user = getCurrentUser();

    if (user && user.nome) {
        setText('.topo h1', `Desempenho de ${user.nome}`);
        setText('.perfil-nome strong', user.nome);
    }
    const search = document.getElementById("search");
    const ebooks = document.querySelectorAll(".ebook");
    const filters = document.querySelectorAll(".filter");
    const contador = document.getElementById("contador");
    const messages = {CodigoTransito : 'Código de Trânsito', PlacaTransito : 'Placas de Trânsito', DirecaoOfensiva: 'Direção Defensiva', PrimeirosSocorros: 'Primeiros Socorros', MeioAmbiente : 'Meio Ambiente e Cidadania'}
    const readBtns = qsa(".read-btn")
    
    readBtns?.forEach((btn) => {
        btn.addEventListener("click", () => abrirEbook(messages?.[btn.name] || ""))
    })
        search.addEventListener("input", filtrar);

    filters.forEach(filter => {
        filter.addEventListener("click", () => {
            filters.forEach(f => f.classList.remove("active"));
            filter.classList.add("active");
            filtrar();
        });
    });


    function filtrar() {

        const texto = search.value.toLowerCase();

        const categoriaSelecionada =
            document.querySelector(".filter.active")
                .dataset.category;

        let quantidade = 0;


        ebooks.forEach(ebook => {

            const conteudo =
                ebook.innerText.toLowerCase();

            const categoria =
                ebook.dataset.category;


            const correspondeTexto =
                conteudo.includes(texto);

            const correspondeCategoria =
                categoriaSelecionada === "todos" ||
                categoria === categoriaSelecionada;


            if (correspondeTexto && correspondeCategoria) {

                ebook.style.display = "block";

                quantidade++;

            } else {

                ebook.style.display = "none";

            }

        });

        contador.textContent =
            quantidade +
            (quantidade === 1 ? " conteúdo" : " conteúdos");

    }


    // ABRIR E-BOOK

    function abrirEbook(nome) {

        alert(
            "Abrindo o e-book: " +
            nome
        );

        /*
         * Depois podemos substituir este alert
         * por:
         *
         * window.location.href =
         * "ebook.html?titulo=" +
         * encodeURIComponent(nome);
         */

    }
})  