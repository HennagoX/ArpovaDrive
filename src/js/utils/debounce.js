import { qs } from './dom.js';

/**
 * Utilitário de Debounce e Cooldown para botões que requisitam a API.
 * Evita spam de requisições e rate-limit na hospedagem com contagem regressiva visual.
 */

/**
 * Função debounce clássica para funções e inputs.
 * @param {Function} fn - Função a ser executada
 * @param {number} delayMs - Tempo de espera em milissegundos
 * @returns {Function}
 */
export function debounce(fn, delayMs = 300) {
    let timer = null;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delayMs);
    };
}

/**
 * Função throttle clássica para limitar frequência de execução.
 * @param {Function} fn - Função a ser executada
 * @param {number} limitMs - Intervalo mínimo em milissegundos
 * @returns {Function}
 */
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

/**
 * Extrai o elemento de ícone HTML de um botão, se existir (FontAwesome ou Material Symbols).
 * @param {HTMLElement} button
 * @returns {string} HTML do ícone ou string vazia
 */
function extrairIconeHtml(button) {
    if (!button) return '';
    const iconEl = button.querySelector('span.material-symbols-outlined, i.fa-solid, i.fa-regular, svg, .icone-inline');
    return iconEl ? iconEl.outerHTML : '';
}

/**
 * Inicia uma contagem regressiva de cooldown em um botão com atualização visual em tempo real.
 * @param {HTMLElement|string} buttonOrSelector - Elemento do botão ou seletor CSS
 * @param {number} seconds - Duração do cooldown em segundos (ex: 2)
 * @param {Object} options - Configurações opcionais
 * @returns {Promise<void>} Resolve quando o cooldown terminar
 */
export function startCooldown(buttonOrSelector, seconds = 2, options = {}) {
    const button = typeof buttonOrSelector === 'string' ? qs(buttonOrSelector) : buttonOrSelector;
    if (!button) return Promise.resolve();

    // Se já estiver em cooldown com timer ativo, limpa o anterior
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

/**
 * Conecta um manipulador de clique com debounce e cooldown visual com contagem regressiva.
 * Ideal para botões que disparam chamadas à API (ex: atualizar tarefas, retry, claim).
 * 
 * @param {HTMLElement|string} buttonOrSelector - Elemento ou seletor CSS do botão
 * @param {Function} asyncAction - Função a ser executada ao clicar (pode ser async)
 * @param {Object} options - Opções de configuração
 * @param {number} [options.cooldownSeconds=2] - Duração do cooldown em segundos (padrão: 2)
 * @param {string} [options.loadingText] - Texto exibido enquanto a ação estiver em andamento (ex: 'Atualizando...')
 * @param {Function} [options.formatCooldown] - Formatação do texto de contagem (ex: (sec) => `Aguarde (${sec}s)`)
 * @param {boolean} [options.preserveIcon=true] - Manter o ícone existente no botão durante o loading e cooldown
 * @returns {Function} Função de limpeza (removeEventListener)
 */
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

        // Bloqueia cliques adicionais imediatamente
        button.dataset.cooldownActive = 'true';
        button.disabled = true;
        button.style.pointerEvents = 'none';
        button.classList.add('is-cooldown', 'btn-cooldown');

        // Exibe feedback imediato de carregamento
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
            // Aplica contagem regressiva visual mesmo se a ação falhar, prevenindo spam
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

/**
 * Envolve uma função com cooldown em um botão alvo.
 * @param {Function} fn
 * @param {HTMLElement|string} buttonOrSelector
 * @param {number} cooldownSeconds
 * @param {Object} options
 * @returns {Function}
 */
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
