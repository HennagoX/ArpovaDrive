export function getLocalItem(key, fallback = null) {
    try {
        const item = localStorage.getItem(key);
        if (item === null) return fallback;
        return JSON.parse(item);
    } catch {
        return fallback;
    }
}

export function setLocalItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

export function removeLocalItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

export function clearAllLocalStorage() {
    try {
        localStorage.clear();
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
        }
        return true;
    } catch (err) {
        console.warn('Falha ao limpar armazenamento local:', err);
        return false;
    }
}
