/**
 * Componente Reutilizável: Card de Bateria de Questões (Question Module Card)
 * Padrão: Factory / View Component
 * 
 * Cria e retorna um elemento DOM para a lista de baterias de questões de uma matéria,
 * desbloqueadas sequencialmente a cada 3 módulos de estudo concluídos.
 * 
 * @param {Object} bateria - Dados da bateria de questões
 * @param {string} bateria.id - Identificador único
 * @param {number} bateria.numero - Número da bateria (1, 2, 3...)
 * @param {string} bateria.titulo - Título da bateria
 * @param {string} bateria.descricao - Descrição dos assuntos
 * @param {Array<string>} [bateria.topicos] - Lista de tópicos abordados
 * @param {number} bateria.questoesCount - Total de questões da bateria (ex: 15)
 * @param {string} [bateria.duracao] - Duração estimada (ex: '20 min')
 * @param {string} [bateria.modulosReferencia] - Módulos cobertos (ex: 'Módulos 01 a 03')
 * @param {number} [bateria.modulosNecessarios] - Quantidade de módulos concluídos necessária
 * @param {string} [bateria.status] - 'available' ou 'locked'
 * @param {boolean} [bateria.bloqueado] - Se a bateria está bloqueada
 * @param {string} [bateria.motivoBloqueio] - Explicação do requisito de desbloqueio
 * @param {Object} [options] - Callbacks de interação
 * @param {Function} [options.onStart] - Callback ao clicar em "Iniciar Simulado"
 * @param {Function} [options.onLockedClick] - Callback ao clicar em bateria bloqueada
 * @returns {HTMLElement} Elemento <article class="bateria-card ...">
 */
export function createQuestionModuleCard(bateria, options = {}) {
    if (!bateria) return null;

    const card = document.createElement('article');

    const isLocked = Boolean(bateria.bloqueado || bateria.status === 'locked');
    const isDone = Boolean(bateria.status === 'done');
    const statusClass = isLocked ? 'locked' : (isDone ? 'done' : 'available');

    card.className = `bateria-card ${statusClass}`;
    if (bateria.id) {
        card.dataset.bateriaId = bateria.id;
    }
    card.dataset.bateriaNumber = String(bateria.numero || 1);

    const numeroFormatado = String(bateria.numero || 1).padStart(2, '0');
    const duracao = bateria.duracao || '20 min';
    const totalQuestoes = bateria.questoesCount ? `${bateria.questoesCount} questões` : '15 questões';
    const tagTexto = bateria.modulosReferencia || `Módulos ${(bateria.numero - 1) * 3 + 1} a ${bateria.numero * 3}`;
    const modulosNecessarios = bateria.modulosNecessarios || (bateria.numero * 3);

    // Badge de status
    let statusBadgeHtml = '';
    if (isDone) {
        statusBadgeHtml = '<span class="bateria-status-badge available"><i class="fa-solid fa-check"></i> Concluído</span>';
    } else if (isLocked) {
        statusBadgeHtml = '<span class="bateria-status-badge locked"><i class="fa-solid fa-lock"></i> Bloqueada</span>';
    } else {
        statusBadgeHtml = '<span class="bateria-status-badge available"><i class="fa-solid fa-unlock"></i> Pronta para Treinar</span>';
    }

    // Botão de ação
    let actionButtonHtml = '';
    if (isLocked) {
        const titleHelp = escapeHtml(bateria.motivoBloqueio || `Requer a conclusão de ao menos ${modulosNecessarios} módulos.`);
        actionButtonHtml = `
            <button type="button" class="btn-bateria-locked" title="${titleHelp}">
                <i class="fa-solid fa-lock"></i> Requer ${modulosNecessarios} Módulos
            </button>
        `;
    } else {
        actionButtonHtml = `
            <button type="button" class="btn-bateria-start" title="Iniciar resolução desta bateria de questões">
                <i class="fa-solid fa-play"></i> Iniciar Questão
            </button>
        `;
    }

    // Pill de requisito de módulos
    const reqPillHtml = isLocked
        ? `<span class="bateria-req-badge locked"><i class="fa-solid fa-lock"></i> Requer ${modulosNecessarios} módulos</span>`
        : `<span class="bateria-req-badge available"><i class="fa-solid fa-circle-check"></i> Desbloqueada</span>`;

    // Chips de tópicos abordados
    const topicosList = Array.isArray(bateria.topicos) && bateria.topicos.length > 0
        ? bateria.topicos.map(t => `<span class="bateria-topic-chip">${escapeHtml(t)}</span>`).join('')
        : `<span class="bateria-topic-chip">${escapeHtml(tagTexto)}</span>`;

    card.innerHTML = `
        <div class="bateria-badge-box">
            <span class="bateria-badge-label">BAT</span>
            <span class="bateria-badge-num">${numeroFormatado}</span>
        </div>

        <div class="bateria-content">
            <div class="bateria-meta-row">
                <span class="bateria-ref-tag">${escapeHtml(tagTexto)}</span>
                <span class="bateria-meta-item"><i class="fa-solid fa-list-check"></i> ${escapeHtml(totalQuestoes)}</span>
                <span class="bateria-meta-item"><i class="fa-regular fa-clock"></i> ${escapeHtml(duracao)}</span>
                ${reqPillHtml}
            </div>
            <h4 class="bateria-title">${escapeHtml(bateria.titulo || 'Bateria de Questões')}</h4>
            <p class="bateria-desc">${escapeHtml(bateria.descricao || 'Resolva questões simuladas dos módulos estudados.')}</p>
            <div class="bateria-topics-row">
                ${topicosList}
            </div>
        </div>

        <div class="bateria-action-area">
            ${statusBadgeHtml}
            ${actionButtonHtml}
        </div>
    `;

    // Vincula eventos
    if (isLocked) {
        const triggerLocked = (event) => {
            if (event) event.stopPropagation();

            // Adiciona classe de tremor para feedback tátil/visual imediato
            card.classList.remove('shake');
            void card.offsetWidth;
            card.classList.add('shake');

            if (typeof options.onLockedClick === 'function') {
                options.onLockedClick(bateria, card);
            }
        };

        const lockedBtn = card.querySelector('.btn-bateria-locked');
        if (lockedBtn) {
            lockedBtn.addEventListener('click', triggerLocked);
        }
        card.addEventListener('click', (event) => {
            if (event.target.closest('.btn-bateria-locked')) return;
            triggerLocked(event);
        });
    } else {
        const startBtn = card.querySelector('.btn-bateria-start');
        if (startBtn && typeof options.onStart === 'function') {
            startBtn.addEventListener('click', (event) => {
                event.preventDefault();
                options.onStart(bateria, startBtn);
            });
        }
    }

    return card;
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
