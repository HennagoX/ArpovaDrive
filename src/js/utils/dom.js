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
