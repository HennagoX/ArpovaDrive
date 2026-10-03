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
    } catch (e) {}

    const switches = document.querySelectorAll('.vite-theme-switch');
    switches.forEach((btn) => {
        btn.setAttribute('aria-checked', isDark ? 'true' : 'false');
        btn.setAttribute('title', isDark ? 'Mudar para o Modo Padrão' : 'Mudar para o Modo Dark');
        
        const label = btn.querySelector('.vite-switch-text');
        if (label) {
            label.textContent = isDark ? 'Dark' : 'Padrão';
        }
    });

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

    document.addEventListener('click', (e) => {
        const switchBtn = e.target.closest('.vite-theme-switch');
        if (switchBtn) {
            e.preventDefault();
            e.stopPropagation();
            toggleTheme();
        }
    });
}
