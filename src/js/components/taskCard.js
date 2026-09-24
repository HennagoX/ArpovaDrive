export function createTaskCard(task, options = {}) {
    if (!task) return null;

    const card = document.createElement('article');

    const isDone = Boolean(task.concluida || task.status === 'done');
    const isInProgress = !isDone && (task.status === 'in_progress');
    const isCurrent = !isDone && (task.status === 'current');
    const statusClass = isDone ? 'done' : isInProgress ? 'in_progress' : isCurrent ? 'current' : 'pending';

    card.className = `schedule-item ${statusClass}`;
    if (task.id) {
        card.dataset.taskId = task.id;
    }

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

    let actionHtml = '';
    if (isDone) {
        actionHtml = '<span class="material-symbols-outlined check-icon" title="Missão concluída">check_circle</span>';
    } else if (isInProgress) {
        actionHtml = '<button class="btn-action btn-concluir" type="button">CONCLUIR</button>';
    } else if (isCurrent) {
        actionHtml = '<button class="btn-action btn-iniciar" type="button">INICIAR</button>';
    } else {
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

    const btnIniciar = card.querySelector('.btn-iniciar');
    if (btnIniciar && typeof options.onStart === 'function') {
        btnIniciar.addEventListener('click', (event) => {
            event.stopPropagation();
            options.onStart(task, btnIniciar);
        });
    }

    const btnBloqueado = card.querySelector('.btn-bloqueado');
    if (btnBloqueado && typeof options.onStart === 'function') {
        btnBloqueado.addEventListener('click', (event) => {
            event.stopPropagation();
            options.onStart(task, btnBloqueado);
        });
    }

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
