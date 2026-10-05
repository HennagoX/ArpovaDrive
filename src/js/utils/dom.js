
export function applyTilt(el, opts = {}) {
    const {
        maxTilt    = 8,     
        perspective = 800,  
        scale      = 1.04,   
        stiffness  = 0.13,  
        damping    = 0.6,  
    } = opts;

    let rotX = 0, rotY = 0;           
    let velX = 0, velY = 0;          
    let tgtX = 0, tgtY = 0;           
    let hovering = false;
    let rafId = null;

    el.style.willChange = 'transform';
    el.style.transformStyle = 'preserve-3d';

    function loop() {
        velX += (tgtX - rotX) * stiffness;
        velY += (tgtY - rotY) * stiffness;
        velX *= damping;
        velY *= damping;
        rotX += velX;
        rotY += velY;

        const sc = hovering ? scale : 1 + (scale - 1) * (Math.abs(rotX) + Math.abs(rotY)) / (maxTilt * 2);
        el.style.transform =
            `perspective(${perspective}px) rotateX(${rotX.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg) scale(${sc.toFixed(4)})`;

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
        const nx = (e.clientX - rect.left) / rect.width  - 0.5;
        const ny = (e.clientY - rect.top)  / rect.height - 0.5;
        tgtX = -ny * maxTilt * 2;
        tgtY =  nx * maxTilt * 2;
        startLoop();
    });

    el.addEventListener('mouseleave', () => {
        hovering = false;
        tgtX = 0;
        tgtY = 0;
        startLoop();
    });
}


export function applyTiltAll(selector, opts = {}) {
    document.querySelectorAll(selector).forEach(el => applyTilt(el, opts));
}

/////////////////////////////////////////////////////////////////////

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


