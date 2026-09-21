/**
 * Componente Reutilizável: Card de Tarefas (Task Card)
 * Padrão: Factory / View Component
 * 
 * Cria e retorna um elemento DOM para o card de tarefas da plataforma AprovaDrive,
 * manipulando dinamicamente os estados visuais (concluída/done, atual/current e pendente/pending).
 * 
 * @param {Object} task - Dados da tarefa
 * @param {string} task.id - Identificador único
 * @param {string} task.titulo - Título descritivo da tarefa
 * @param {string} task.descricao - Descrição do que deve ser estudado
 * @param {number} task.xp_reward - Recompensa de XP ao concluir
 * @param {string} task.status - Estado da tarefa ('done', 'current', 'pending')
 * @param {boolean} task.concluida - Se já foi concluída
 * @param {number} [task.sort] - Ordem/posição da tarefa no dia (1, 2, 3...)
 * @param {string} [task.horario] - Horário de estudo sugerido (ex: '08:00')
 * @param {string} [task.duracao] - Tempo estimado de estudo (ex: '20 min')
 * @param {Object} [options] - Configurações e callbacks adicionais
 * @param {Function} [options.onStart] - Callback disparado ao clicar em "INICIAR"
 * @returns {HTMLElement} Elemento <article class="schedule-item ..."> pronto para inserção no DOM
 */
export function createTaskCard(task, options = {}) {
    if (!task) return null;

    const card = document.createElement('article');

    // Determina o estado da tarefa
    const isDone = Boolean(task.concluida || task.status === 'done');
    const isInProgress = !isDone && (task.status === 'in_progress');
    const isCurrent = !isDone && (task.status === 'current');
    const statusClass = isDone ? 'done' : isInProgress ? 'in_progress' : isCurrent ? 'current' : 'pending';

    card.className = `schedule-item ${statusClass}`;
    if (task.id) {
        card.dataset.taskId = task.id;
    }

    // Horários e durações padrão baseados na posição/sort
    const horariosPadrao = [
        { horario: '08:00', duracao: '20 min' },
        { horario: '12:30', duracao: '15 min' },
        { horario: '19:00', duracao: '40 min' }
    ];
    const index = Math.max(0, ((task.sort || 1) - 1) % horariosPadrao.length);
    const timeInfo = {
        horario: task.horario || horariosPadrao[index].horario,
        duracao: task.duracao || horariosPadrao[index].duracao
    };

    // Classificação da tag visual com base no título/conteúdo
    const tituloLower = (task.titulo || '').toLowerCase();
    let tagClass = 'tag-theory';
    let tagLabel = 'Videoaula';

    if (tituloLower.includes('quiz') || tituloLower.includes('simulado') || tituloLower.includes('questões') || tituloLower.includes('questoes')) {
        tagClass = 'tag-quiz';
        tagLabel = 'Prática';
    } else if (tituloLower.includes('placas') || tituloLower.includes('revisão') || tituloLower.includes('revisao') || tituloLower.includes('flashcard')) {
        tagClass = 'tag-review';
        tagLabel = 'Fixação';
    }

    // Botão ou ícone de ação conforme o estado
    let actionHtml = '';
    if (isDone) {
        actionHtml = '<span class="material-symbols-outlined check-icon" title="Missão concluída">check_circle</span>';
    } else if (isInProgress) {
        actionHtml = '<button class="btn-action btn-concluir" type="button">CONCLUIR</button>';
    } else if (isCurrent) {
        actionHtml = '<button class="btn-action btn-iniciar" type="button">INICIAR</button>';
    } else {
        // Envia requisição para a API ao ser clicado para validação centralizada no backend
        actionHtml = '<button class="btn-action btn-bloqueado" type="button" title="Clique para iniciar missão"><span class="material-symbols-outlined icone-inline" style="font-size: 1rem; margin-right: 2px;">lock</span>BLOQUEADO</button>';
    }

    const xp = task.xp_reward || 30;

    card.innerHTML = `
        <div class="time-box">
            <div class="time">${escapeHtml(timeInfo.horario)}</div>
            <div class="duration">${escapeHtml(timeInfo.duracao)}</div>
        </div>
        <div class="task-content ${isCurrent || isInProgress ? 'active' : ''}">
            <span class="task-tag ${tagClass}">${escapeHtml(tagLabel)}</span>
            <div class="task-title">${escapeHtml(task.titulo || 'Tarefa sem título')}</div>
            <div class="task-desc">${escapeHtml(task.descricao || 'Sem descrição cadastrada.')}</div>
        </div>
        <div class="task-reward">
            <span class="xp-badge">+${xp} XP</span>
            ${actionHtml}
        </div>
    `;

    // Vincula handlers de clique para as ações
    // INICIAR (tarefa atual)
    const btnIniciar = card.querySelector('.btn-iniciar');
    if (btnIniciar && typeof options.onStart === 'function') {
        btnIniciar.addEventListener('click', (event) => {
            event.stopPropagation();
            options.onStart(task, btnIniciar);
        });
    }

    // BLOQUEADO (tarefa pendente de hoje ou de outro dia - envia para API validar)
    const btnBloqueado = card.querySelector('.btn-bloqueado');
    if (btnBloqueado && typeof options.onStart === 'function') {
        btnBloqueado.addEventListener('click', (event) => {
            event.stopPropagation();
            options.onStart(task, btnBloqueado);
        });
    }

    // CONCLUIR (tarefa em andamento)
    const btnConcluir = card.querySelector('.btn-concluir');
    const handleConclude = options.onComplete || options.onConclude;
    if (btnConcluir && typeof handleConclude === 'function') {
        btnConcluir.addEventListener('click', (event) => {
            event.stopPropagation();
            handleConclude(task, btnConcluir);
        });
    }

    return card;
}

/**
 * Utilitário de escape de strings para prevenir problemas de XSS.
 * @param {string} str 
 * @returns {string}
 */
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
