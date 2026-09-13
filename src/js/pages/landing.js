import { ready, qsa, on } from '../utils/dom.js';
import { SELECTORS } from '../constants/selectors.js';

ready(() => {

    
    const links = qsa(SELECTORS.NAV_LINKS);
    links.forEach(link => {
        on(link, 'click', (e) => {
            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
