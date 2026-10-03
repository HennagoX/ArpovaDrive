import { qs } from './dom.js';

export function debounce(fn, delayMs = 300) {
    let timer = null;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delayMs);
    };
}

export function throttle(fn, limitMs = 300) {
    let inThrottle = false;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limitMs);
        }
    };
}

function extrairIconeHtml(button) {
    if (!button) return '';
    const iconEl = button.querySelector('span.material-symbols-outlined, i.fa-solid, i.fa-regular, svg, .icone-inline');
    return iconEl ? iconEl.outerHTML : '';
}

export function startCooldown(buttonOrSelector, seconds = 2, options = {}) {
    const button = typeof buttonOrSelector === 'string' ? qs(buttonOrSelector) : buttonOrSelector;
    if (!button) return Promise.resolve();

    if (button.dataset.cooldownIntervalId) {
        clearInterval(Number(button.dataset.cooldownIntervalId));
        delete button.dataset.cooldownIntervalId;
    }

    const {
        originalHtml = button.innerHTML,
        originalDisabled = false,
        formatText = (rem) => `Aguarde (${rem}s)`,
        preserveIcon = true,
        onTick = null,
        onComplete = null
    } = options;

    const iconHtml = preserveIcon ? extrairIconeHtml(button) : '';
    let remaining = Math.max(1, Math.round(seconds));

    button.dataset.cooldownActive = 'true';
    button.disabled = true;
    button.classList.add('is-cooldown', 'btn-cooldown');
    button.style.pointerEvents = 'none';

    const updateLabel = (sec) => {
        const text = typeof formatText === 'function' ? formatText(sec) : `Aguarde (${sec}s)`;
        button.innerHTML = iconHtml ? `${iconHtml} ${text}` : text;
        if (typeof onTick === 'function') onTick(sec, button);
    };

    updateLabel(remaining);

    return new Promise((resolve) => {
        const intervalId = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                updateLabel(remaining);
            } else {
                clearInterval(intervalId);
                delete button.dataset.cooldownIntervalId;
                delete button.dataset.cooldownActive;

                button.innerHTML = originalHtml;
                button.disabled = originalDisabled;
                button.classList.remove('is-cooldown', 'btn-cooldown');
                button.style.pointerEvents = '';

                if (typeof onComplete === 'function') onComplete(button);
                resolve();
            }
        }, 1000);

        button.dataset.cooldownIntervalId = String(intervalId);
    });
}

export function attachButtonCooldown(buttonOrSelector, asyncAction, options = {}) {
    const button = typeof buttonOrSelector === 'string' ? qs(buttonOrSelector) : buttonOrSelector;
    if (!button) {
        console.warn('[debounce] Botão não encontrado para attachButtonCooldown:', buttonOrSelector);
        return () => {};
    }

    const {
        cooldownSeconds = 2,
        loadingText = 'Atualizando...',
        formatCooldown = (sec) => `Aguarde (${sec}s)`,
        preserveIcon = true,
        onError = null
    } = options;

    const handler = async (event) => {
        if (button.dataset.cooldownActive === 'true' || button.disabled) {
            if (event && event.preventDefault) event.preventDefault();
            return;
        }

        const originalHtml = button.innerHTML;
        const originalDisabled = button.disabled;
        const iconHtml = preserveIcon ? extrairIconeHtml(button) : '';

        button.dataset.cooldownActive = 'true';
        button.disabled = true;
        button.style.pointerEvents = 'none';
        button.classList.add('is-cooldown', 'btn-cooldown');

        if (loadingText) {
            let spinIcon = iconHtml;
            if (spinIcon && !spinIcon.includes('fa-spin')) {
                spinIcon = spinIcon.replace(/class="([^"]*)"/, 'class="$1 fa-spin"');
            } else if (!spinIcon) {
                spinIcon = '<i class="fa-solid fa-spinner fa-spin"></i>';
            }
            button.innerHTML = `${spinIcon} ${loadingText}`;
        }

        try {
            if (typeof asyncAction === 'function') {
                await asyncAction(event, button);
            }
        } catch (err) {
            console.error('[debounce] Erro ao executar ação do botão:', err);
            if (typeof onError === 'function') onError(err, button);
        } finally {
            await startCooldown(button, cooldownSeconds, {
                originalHtml,
                originalDisabled,
                formatText: formatCooldown,
                preserveIcon
            });
        }
    };

    button.addEventListener('click', handler);
    return () => button.removeEventListener('click', handler);
}

export function withCooldown(fn, buttonOrSelector, cooldownSeconds = 2, options = {}) {
    return async function (...args) {
        const button = typeof buttonOrSelector === 'string' ? qs(buttonOrSelector) : buttonOrSelector;
        if (button && (button.dataset.cooldownActive === 'true' || button.disabled)) {
            return;
        }

        const originalHtml = button ? button.innerHTML : '';
        const originalDisabled = button ? button.disabled : false;

        if (button) {
            button.dataset.cooldownActive = 'true';
            button.disabled = true;
            button.style.pointerEvents = 'none';
            button.classList.add('is-cooldown', 'btn-cooldown');
        }

        try {
            return await fn.apply(this, args);
        } finally {
            if (button) {
                await startCooldown(button, cooldownSeconds, {
                    originalHtml,
                    originalDisabled,
                    formatText: options.formatCooldown || ((sec) => `Aguarde (${sec}s)`),
                    preserveIcon: options.preserveIcon ?? true
                });
            }
        }
    };
}

export default {
    debounce,
    throttle,
    startCooldown,
    attachButtonCooldown,
    withCooldown
};
