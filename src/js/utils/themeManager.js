/**
 * AprovaDrive - Theme Manager (Vite Dark / Default Light Mode)
 * Inspired by Vite.dev theme switcher
 */

const THEME_STORAGE_KEY = 'aprovadrive_theme';
export const THEME_DARK = 'dark';
export const THEME_DEFAULT = 'default';

export function getStoredTheme() {
    try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === THEME_DARK || saved === THEME_DEFAULT) {
            return saved;
        }
    } catch (e) {
        console.warn('[ThemeManager] LocalStorage indisponível:', e);
    }
    // Padrão atual: Vite Dark Mode
    return THEME_DARK;
}

export function applyTheme(theme) {
    const isDark = theme === THEME_DARK;
    const targetTheme = isDark ? THEME_DARK : THEME_DEFAULT;

    document.documentElement.setAttribute('data-theme', targetTheme);
    if (document.body) {
        document.body.setAttribute('data-theme', targetTheme);
    }

    try {
        localStorage.setItem(THEME_STORAGE_KEY, targetTheme);
    } catch (e) {
        // Ignora erro em modo privado estrito
    }

    // Atualiza estado visual de todos os switches presentes na interface
    const switches = document.querySelectorAll('.vite-theme-switch');
    switches.forEach((btn) => {
        btn.setAttribute('aria-checked', isDark ? 'true' : 'false');
        btn.setAttribute('title', isDark ? 'Mudar para o Modo Padrão' : 'Mudar para o Modo Dark');
        
        const label = btn.querySelector('.vite-switch-text');
        if (label) {
            label.textContent = isDark ? 'Dark' : 'Padrão';
        }
    });

    // Dispara evento global para outros componentes se necessário
    window.dispatchEvent(new CustomEvent('aprovadrive:theme-change', { detail: { theme: targetTheme, isDark } }));
}

export function toggleTheme() {
    const current = getStoredTheme();
    const nextTheme = current === THEME_DARK ? THEME_DEFAULT : THEME_DARK;
    applyTheme(nextTheme);
    return nextTheme;
}

export function initTheme() {
    const currentTheme = getStoredTheme();
    applyTheme(currentTheme);

    // Event delegation para qualquer botão switch com a classe .vite-theme-switch
    document.addEventListener('click', (e) => {
        const switchBtn = e.target.closest('.vite-theme-switch');
        if (switchBtn) {
            e.preventDefault();
            e.stopPropagation();
            toggleTheme();
        }
    });
}
