export function ready(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
        return;
    }
    callback();
}

export function qs(selector, parent = document) {
    if (!parent || !parent.querySelector) return null;
    return parent.querySelector(selector);
}

export function qsa(selector, parent = document) {
    if (!parent || !parent.querySelectorAll) return [];
    return Array.from(parent.querySelectorAll(selector));
}

export function on(element, event, handler, options) {
    if (!element) return;
    element.addEventListener(event, handler, options);
}

export function setText(elementOrSelector, text) {
    const el = typeof elementOrSelector === 'string' ? qs(elementOrSelector) : elementOrSelector;
    if (el) el.textContent = text;
}

export function setHTML(elementOrSelector, html) {
    const el = typeof elementOrSelector === 'string' ? qs(elementOrSelector) : elementOrSelector;
    if (el) el.innerHTML = html;
}

export function toggleClass(elementOrSelector, className, force) {
    const el = typeof elementOrSelector === 'string' ? qs(elementOrSelector) : elementOrSelector;
    if (el) el.classList.toggle(className, force);
}

/**
 * Tilt 3D elástico — o card inclina seguindo o mouse e volta com física de mola ao soltar.
 *
 * Como funciona:
 *  - mousemove: calcula posição relativa do cursor dentro do card (-0.5 a 0.5)
 *    e converte em rotateX/rotateY. Atualiza um estado "target".
 *  - O loop de spring roda via rAF continuamente enquanto o card tem listeners.
 *    A cada frame: velocity += (target - current) * stiffness
 *                  velocity *= damping
 *                  current += velocity
 *    Isso é um spring de Hooke simplificado — mesma física do TweenService Elastic do Roblox.
 *  - mouseleave: target volta pra (0, 0), o spring naturalmente oscila de volta.
 *
 * @param {HTMLElement} el
 * @param {{ maxTilt?: number, perspective?: number, scale?: number, stiffness?: number, damping?: number }} opts
 */
export function applyTilt(el, opts = {}) {
    const {
        maxTilt    = 6,     // graus máximos de inclinação
        perspective = 600,   // perspectiva 3D em px
        scale      = 1.04,   // escala ao hover
        stiffness  = 0.13,   // quão forte é a mola (0.05 = lenta, 0.2 = rápida)
        damping    = 0.6,   // amortecimento (0.6 = oscila muito, 0.85 = quase nenhuma)
    } = opts;

    // Estado do spring
    let rotX = 0, rotY = 0;           // valores atuais
    let velX = 0, velY = 0;           // velocidades
    let tgtX = 0, tgtY = 0;           // alvos
    let hovering = false;
    let rafId = null;

    el.style.willChange = 'transform';
    el.style.transformStyle = 'preserve-3d';

    function loop() {
        // Spring: F = k * (target - current), com amortecimento
        velX += (tgtX - rotX) * stiffness;
        velY += (tgtY - rotY) * stiffness;
        velX *= damping;
        velY *= damping;
        rotX += velX;
        rotY += velY;

        const sc = hovering ? scale : 1 + (scale - 1) * (Math.abs(rotX) + Math.abs(rotY)) / (maxTilt * 2);
        el.style.transform =
            `perspective(${perspective}px) rotateX(${rotX.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg) scale(${sc.toFixed(4)})`;

        // Para o loop quando está parado e não há hover
        const moving = Math.abs(velX) > 0.005 || Math.abs(velY) > 0.005;
        if (moving || hovering) {
            rafId = requestAnimationFrame(loop);
        } else {
            el.style.transform = '';
            rafId = null;
        }
    }

    function startLoop() {
        if (!rafId) rafId = requestAnimationFrame(loop);
    }

    el.addEventListener('mouseenter', () => {
        hovering = true;
        startLoop();
    });

    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        // nx, ny de -0.5 a 0.5 relativos ao centro do card
        const nx = (e.clientX - rect.left) / rect.width  - 0.5;
        const ny = (e.clientY - rect.top)  / rect.height - 0.5;
        // rotateX: mouse em cima → inclina pra frente (negativo), embaixo → pra trás
        tgtX = -ny * maxTilt * 2;
        tgtY =  nx * maxTilt * 2;
        startLoop();
    });

    el.addEventListener('mouseleave', () => {
        hovering = false;
        tgtX = 0;
        tgtY = 0;
        startLoop(); // deixa o spring voltar sozinho
    });
}

/**
 * Aplica tilt em todos os elementos que casam com o seletor.
 */
export function applyTiltAll(selector, opts = {}) {
    document.querySelectorAll(selector).forEach(el => applyTilt(el, opts));
}
