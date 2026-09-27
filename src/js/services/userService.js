import { STORAGE_KEYS } from '../constants/storage.js';
import { getLocalItem, setLocalItem } from '../utils/storage.js';

function getRawUser() {
    try {
        const authUser = getLocalItem(STORAGE_KEYS.AUTH_USER, null);
        if (authUser && typeof authUser === 'object') return authUser;
    } catch {}
    return null;
}

function getGamification() {
    try {
        return getLocalItem(STORAGE_KEYS.GAMIFICATION, null) || {};
    } catch {}
    return {};
}

const updateListeners = new Set();

/**
 * Objeto global de usuário com acesso dinâmico às informações básicas e sincronização de UI.
 */
export const usuarioGlobal = {
    get id() {
        const u = getRawUser();
        return u?.id_usuario || u?.id || '';
    },

    get id_usuario() {
        return this.id;
    },

    get nome() {
        const u = getRawUser();
        return u?.nome || u?.name || 'Aluno';
    },

    get primeiroNome() {
        const n = String(this.nome || '').trim();
        return n ? n.split(' ')[0] : 'Aluno';
    },

    get email() {
        const u = getRawUser();
        return u?.email || '';
    },

    get inicial() {
        const n = this.primeiroNome || this.nome;
        return n ? n.charAt(0).toUpperCase() : 'A';
    },

    get avatar() {
        return this.inicial;
    },

    get exp() {
        const u = getRawUser();
        const g = getGamification();
        return Number(u?.exp ?? g.totalExp ?? 0);
    },

    get totalExp() {
        return this.exp;
    },

    get lv() {
        const u = getRawUser();
        const g = getGamification();
        return Number(u?.lv ?? u?.nivel ?? g.nivel ?? g.lv ?? 1);
    },

    get nivel() {
        return this.lv;
    },

    get tituloNivel() {
        const u = getRawUser();
        const g = getGamification();
        return u?.tituloNivel || g.tituloNivel || 'Futuro Condutor';
    },

    get diasOfensiva() {
        const g = getGamification();
        return Number(g.diasOfensiva ?? 5);
    },

    get autenticado() {
        return Boolean(getRawUser());
    },

    get isAuthenticated() {
        return this.autenticado;
    },

    get isAdmin() {
        const u = getRawUser();
        return Boolean(u?.is_admin === true || u?.isAdmin === true);
    },

    get is_admin() {
        return this.isAdmin;
    },

    /**
     * Retorna uma cópia plana com todos os dados básicos do usuário.
     */
    get() {
        return {
            id: this.id,
            id_usuario: this.id,
            nome: this.nome,
            primeiroNome: this.primeiroNome,
            email: this.email,
            inicial: this.inicial,
            avatar: this.avatar,
            exp: this.exp,
            totalExp: this.totalExp,
            lv: this.lv,
            nivel: this.nivel,
            tituloNivel: this.tituloNivel,
            diasOfensiva: this.diasOfensiva,
            isAdmin: this.isAdmin,
            is_admin: this.isAdmin,
            autenticado: this.autenticado
        };
    },

    /**
     * Sincroniza dados parciais no perfil armazenado e atualiza a interface.
     */
    sync(partialData = {}) {
        if (!partialData || typeof partialData !== 'object') return this.get();
        const current = getRawUser() || {};

        // Se partialData for de outro usuário diferente do autenticado, NÃO sobrescreve a sessão do admin!
        const partialId = partialData.id_usuario || partialData.id || partialData.userId;
        const currentId = current.id_usuario || current.id || current.userId;
        if (partialId && currentId && String(partialId).toLowerCase() !== String(currentId).toLowerCase()) {
            return this.get();
        }

        const merged = { ...current, ...partialData };
        // Preserva o status de administrador
        if (current.is_admin || current.isAdmin) {
            merged.is_admin = true;
            merged.isAdmin = true;
        }

        setLocalItem(STORAGE_KEYS.AUTH_USER, merged);
        this.updateUI();
        this._notify();
        return this.get();
    },

    /**
     * Atualiza automaticamente os elementos visuais de perfil e avatar na página.
     */
    updateUI(container = document) {
        if (typeof document === 'undefined') return;

        const nome = this.nome;
        const inicial = this.inicial;
        const isAdmin = this.isAdmin;

        try {
            if (document.body) {
                if (isAdmin) {
                    document.body.classList.add('usuario-is-admin');
                } else {
                    document.body.classList.remove('usuario-is-admin');
                }
            }

            // Atualiza o nome exibido em 'Meu perfil' (ou qualquer .perfil-nome strong)
            const perfilNomes = container.querySelectorAll
                ? container.querySelectorAll('.perfil-nome strong')
                : document.querySelectorAll('.perfil-nome strong');

            perfilNomes.forEach(el => {
                if (el && nome) {
                    el.textContent = nome;
                }
            });

            // Gerencia badge de Administrador no topo
            const perfis = container.querySelectorAll
                ? container.querySelectorAll('.perfil-nome')
                : document.querySelectorAll('.perfil-nome');

            perfis.forEach(perf => {
                let badge = perf.querySelector('.badge-admin-topo');
                if (isAdmin) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'badge-admin-topo';
                        badge.title = 'Acesso Administrativo Ativo';
                        badge.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Admin';
                        perf.appendChild(badge);
                    }
                } else if (badge) {
                    badge.remove();
                }
            });

            // Atualiza a letra do avatar (.avatar)
            const avatares = container.querySelectorAll
                ? container.querySelectorAll('.perfil .avatar, .topo .avatar')
                : document.querySelectorAll('.perfil .avatar, .topo .avatar');

            avatares.forEach(el => {
                if (el && inicial) {
                    el.textContent = inicial;
                    if (isAdmin) {
                        el.classList.add('avatar-admin');
                    } else {
                        el.classList.remove('avatar-admin');
                    }
                }
            });
        } catch (err) {
            console.warn('[usuarioGlobal] Erro ao sincronizar UI de perfil:', err);
        }
    },

    /**
     * Registra callback para atualizações do perfil do usuário.
     */
    onUpdate(fn) {
        if (typeof fn === 'function') {
            updateListeners.add(fn);
            return () => updateListeners.delete(fn);
        }
        return () => {};
    },

    _notify() {
        const snapshot = this.get();
        updateListeners.forEach(fn => {
            try {
                fn(snapshot);
            } catch (err) {
                console.warn('[usuarioGlobal] Erro no listener:', err);
            }
        });
    }
};

// Aliases para conveniência
export const currentUser = usuarioGlobal;
export const userGlobal = usuarioGlobal;
export function getUserProfile() {
    return usuarioGlobal.get();
}
export function updateUserProfileUI(container) {
    return usuarioGlobal.updateUI(container);
}

// Expõe globalmente no objeto window para acessibilidade total
if (typeof window !== 'undefined') {
    window.usuarioGlobal = usuarioGlobal;
    window.currentUser = usuarioGlobal;

    // Sincronização inicial automática na carga da página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            usuarioGlobal.updateUI();
        });
    } else {
        usuarioGlobal.updateUI();
    }
}

export default usuarioGlobal;
