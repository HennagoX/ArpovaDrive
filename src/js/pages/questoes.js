import { ready } from '../utils/dom.js';

ready(() => {
    const hash = window.location.hash || '#questoes';
    window.location.replace('./telaInicial.html' + hash);
});
