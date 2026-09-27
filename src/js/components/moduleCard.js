import { usuarioGlobal } from '../services/userService.js';

export function createModuleCard(modulo, options = {}) {
    if (!modulo) return null;

    const card = document.createElement('article');

    const isLocked = Boolean(modulo.bloqueado || modulo.status === 'locked');
    const isDone = Boolean(modulo.status === 'done');
    const statusClass = isLocked ? 'locked' : (isDone ? 'done' : 'available');

    card.className = `module-card ${statusClass}`;
    if (modulo.id) {
        card.dataset.moduleId = modulo.id;
    }
    card.dataset.moduleNumber = String(modulo.numero || 1);

    const numeroFormatado = String(modulo.numero || 1).padStart(2, '0');
    const duracao = modulo.duracao || '20 min';
    const topicos = modulo.topicos ? `${modulo.topicos} tópicos` : 'Aulas práticas';
    const isAdmin = Boolean(usuarioGlobal.isAdmin);

    let statusIconHtml = '';
    if (isDone) {
        statusIconHtml = '<i class="fa-solid fa-circle-check icon-done"></i>';
    } else if (isLocked) {
        statusIconHtml = '<i class="fa-solid fa-lock icon-locked"></i>';
    } else {
        statusIconHtml = '<i class="fa-solid fa-book-open icon-open"></i>';
    }

    let statusBadgeHtml = '';
    if (isDone) {
        statusBadgeHtml = '<span class="module-badge badge-done"><i class="fa-solid fa-check"></i> Concluído</span>';
    } else if (isLocked) {
        statusBadgeHtml = '<span class="module-badge badge-locked"><i class="fa-solid fa-lock"></i> Bloqueado</span>';
    } else {
        statusBadgeHtml = '<span class="module-badge badge-available"><i class="fa-solid fa-unlock"></i> Liberado</span>';
    }

    let actionButtonHtml = '';
    if (isLocked) {
        actionButtonHtml = `
            <button type="button" class="btn-action btn-bloqueado" title="Módulo bloqueado. Conclua o anterior para desbloquear.">
                <i class="fa-solid fa-lock icone-inline"></i> Bloqueado
            </button>
        `;
    } else if (modulo.pdfUrl) {
        actionButtonHtml = `
            <button type="button" class="btn-action btn-ler" title="Abrir material em PDF do módulo">
                <i class="fa-solid fa-file-pdf icone-inline"></i> Ler Módulo
            </button>
        `;
    } else {
        actionButtonHtml = `
            <button type="button" class="btn-action btn-ler" title="Iniciar leitura deste módulo">
                <i class="fa-solid fa-book-open icone-inline"></i> Ler Módulo
            </button>
        `;
    }

    const pdfBadgeHtml = modulo.pdfNome
        ? `<span class="module-meta-pdf"><i class="fa-solid fa-file-pdf"></i> Material PDF</span>`
        : '';

    const customBadgeHtml = modulo.is_custom
        ? `<span class="module-tag-custom" title="Módulo adicionado pelo Administrador"><i class="fa-solid fa-sparkles"></i> Módulo Único</span>`
        : '';

    const isCurrentPointer = modulo.status === 'available';
    const adminActionsHtml = isAdmin
        ? `
        <div class="module-admin-actions">
            <button type="button" class="btn-module-admin-btn btn-admin-set-pointer ${isCurrentPointer ? 'is-current-pointer' : ''}" title="Definir ponteiro neste módulo (${numeroFormatado})">
                <i class="fa-solid fa-location-crosshairs"></i>
            </button>
            <button type="button" class="btn-module-admin-btn btn-admin-edit" title="Editar ou substituir PDF">
                <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn-module-admin-btn btn-admin-delete" title="Remover este módulo ou PDF">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
        `
        : '';

    card.innerHTML = `
        <div class="module-index-box">
            <span class="module-number">${numeroFormatado}</span>
        </div>

        <div class="module-content">
            <div class="module-meta">
                <span class="module-tag">Módulo ${numeroFormatado}</span>
                ${customBadgeHtml}
                <span class="module-meta-item"><i class="fa-regular fa-clock"></i> ${escapeHtml(duracao)}</span>
                <span class="module-meta-item"><i class="fa-regular fa-file-lines"></i> ${escapeHtml(topicos)}</span>
                ${pdfBadgeHtml}
            </div>
            <h4 class="module-title">${escapeHtml(modulo.titulo || 'Módulo sem título')}</h4>
            <p class="module-desc">${escapeHtml(modulo.descricao || 'Sem descrição para este módulo.')}</p>
        </div>

        <div class="module-action-area">
            ${statusBadgeHtml}
            ${actionButtonHtml}
            ${adminActionsHtml}
        </div>
    `;

    bindCardEvents(card, modulo, options);

    return card;
}

export function updateModuleCard(card, modulo, options = {}) {
    if (!card || !modulo) return;

    const isLocked = Boolean(modulo.bloqueado || modulo.status === 'locked');
    const isDone = Boolean(modulo.status === 'done');
    const statusClass = isLocked ? 'locked' : (isDone ? 'done' : 'available');
    const isAdmin = Boolean(usuarioGlobal.isAdmin);

    if (card.classList.contains(statusClass) && !card.classList.contains(isLocked ? 'available' : 'locked')) {
        return;
    }

    card.classList.remove('locked', 'available', 'done');
    card.classList.add(statusClass);

    const actionArea = card.querySelector('.module-action-area');
    if (actionArea) {
        let statusBadgeHtml = '';
        if (isDone) {
            statusBadgeHtml = '<span class="module-badge badge-done"><i class="fa-solid fa-check"></i> Concluído</span>';
        } else if (isLocked) {
            statusBadgeHtml = '<span class="module-badge badge-locked"><i class="fa-solid fa-lock"></i> Bloqueado</span>';
        } else {
            statusBadgeHtml = '<span class="module-badge badge-available"><i class="fa-solid fa-unlock"></i> Liberado</span>';
        }

        let actionButtonHtml = '';
        if (isLocked) {
            actionButtonHtml = `
                <button type="button" class="btn-action btn-bloqueado" title="Módulo bloqueado. Conclua o anterior para desbloquear.">
                    <i class="fa-solid fa-lock icone-inline"></i> Bloqueado
                </button>
            `;
        } else if (modulo.pdfUrl) {
            actionButtonHtml = `
                <button type="button" class="btn-action btn-ler" title="Abrir material em PDF do módulo">
                    <i class="fa-solid fa-file-pdf icone-inline"></i> Ler Módulo
                </button>
            `;
        } else {
            actionButtonHtml = `
                <button type="button" class="btn-action btn-ler" title="Iniciar leitura deste módulo">
                    <i class="fa-solid fa-book-open icone-inline"></i> Ler Módulo
                </button>
            `;
        }

        const isCurrentPointer = modulo.status === 'available';
        const adminActionsHtml = isAdmin
            ? `
            <div class="module-admin-actions">
                <button type="button" class="btn-module-admin-btn btn-admin-set-pointer ${isCurrentPointer ? 'is-current-pointer' : ''}" title="Definir ponteiro neste módulo">
                    <i class="fa-solid fa-location-crosshairs"></i>
                </button>
                <button type="button" class="btn-module-admin-btn btn-admin-edit" title="Editar ou substituir PDF">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button type="button" class="btn-module-admin-btn btn-admin-delete" title="Remover este módulo ou PDF">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
            `
            : '';

        actionArea.innerHTML = `${statusBadgeHtml}${actionButtonHtml}${adminActionsHtml}`;
    }

    bindCardEvents(card, modulo, options);
}

function bindCardEvents(card, modulo, options = {}) {
    const isLocked = Boolean(modulo.bloqueado || modulo.status === 'locked');

    const btnAdminSetPointer = card.querySelector('.btn-admin-set-pointer');
    if (btnAdminSetPointer && typeof options.onSetPointer === 'function') {
        btnAdminSetPointer.onclick = (event) => {
            event.stopPropagation();
            options.onSetPointer(modulo, card);
        };
    }

    const btnAdminEdit = card.querySelector('.btn-admin-edit');
    if (btnAdminEdit && typeof options.onAdminEdit === 'function') {
        btnAdminEdit.onclick = (event) => {
            event.stopPropagation();
            options.onAdminEdit(modulo, card);
        };
    }

    const btnAdminDelete = card.querySelector('.btn-admin-delete');
    if (btnAdminDelete && typeof options.onAdminDelete === 'function') {
        btnAdminDelete.onclick = (event) => {
            event.stopPropagation();
            options.onAdminDelete(modulo, card);
        };
    }

    if (isLocked) {
        card.style.cursor = 'default';
        const triggerLocked = (event) => {
            if (event) event.stopPropagation();
            card.classList.remove('shake');
            requestAnimationFrame(() => {
                card.classList.add('shake');
            });
            if (typeof options.onLockedClick === 'function') {
                options.onLockedClick(modulo, card);
            }
        };

        const btnBloqueado = card.querySelector('.btn-bloqueado');
        if (btnBloqueado) {
            btnBloqueado.onclick = triggerLocked;
        }
        card.onclick = triggerLocked;
    } else {
        card.style.cursor = 'pointer';
        const triggerRead = (event) => {
            if (event) event.stopPropagation();
            if (typeof options.onRead === 'function') {
                options.onRead(modulo, card);
            }
        };

        const btnLer = card.querySelector('.btn-ler');
        if (btnLer) {
            btnLer.onclick = (event) => {
                event.stopPropagation();
                if (typeof options.onRead === 'function') {
                    options.onRead(modulo, btnLer);
                }
            };
        }
        card.onclick = (event) => {
            if (event.target.closest('.btn-ler') || event.target.closest('.module-admin-actions')) return;
            triggerRead(event);
        };
    }
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
}
