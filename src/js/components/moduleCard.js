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

    card.innerHTML = `
        <div class="module-index-box">
            <span class="module-number">${numeroFormatado}</span>
        </div>

        <div class="module-content">
            <div class="module-meta">
                <span class="module-tag">Módulo ${numeroFormatado}</span>
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

        actionArea.innerHTML = `${statusBadgeHtml}${actionButtonHtml}`;
    }

    bindCardEvents(card, modulo, options);
}

function bindCardEvents(card, modulo, options = {}) {
    const isLocked = Boolean(modulo.bloqueado || modulo.status === 'locked');

    if (isLocked) {
        card.style.cursor = 'default';
        const triggerLocked = (event) => {
            if (event) event.stopPropagation();
            card.classList.remove('shake');
            void card.offsetWidth;
            card.classList.add('shake');
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
            if (event.target.closest('.btn-ler')) return;
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
