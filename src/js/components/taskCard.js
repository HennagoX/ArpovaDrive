export function createTaskCard(task, options = {}) {
    if (!task) return null;

    const card = document.createElement('article');

    const isDone = Boolean(task.concluida || task.status === 'done');
    const isExpired = !isDone && (task.status === 'expired' || task.expirada);
    const isLocked = !isDone && !isExpired && (task.status === 'locked' || task.bloqueada);
    const isInProgress = !isDone && !isExpired && !isLocked && (task.status === 'in_progress');
    const isCurrent = !isDone && !isExpired && !isLocked && (task.status === 'current');
    const podeConcluir = Boolean(!isDone && !isExpired && !isLocked && task.podeConcluir);
    const statusClass = isDone ? 'done' : isExpired ? 'expired' : podeConcluir ? 'claimable' : isInProgress ? 'in_progress' : isCurrent ? 'current' : isLocked ? 'locked' : 'pending';

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

    const tipo = task.tipo_validacao || 'bateria';
    let tagClass = 'tag-theory';
    let tagLabel = 'Conteúdo';
    let metaReqHtml = '';

    if (tipo === 'simulado') {
        tagClass = 'tag-simulado';
        tagLabel = 'Simulado DETRAN';
        const metaPct = task.parametros_validacao?.meta_porcentagem || 40;
        const acertosMin = task.parametros_validacao?.acertos_minimos || 12;
        metaReqHtml = `<span class="task-req-pill"><i class="fa-solid fa-graduation-cap"></i> Meta ${metaPct}%+ (${acertosMin}/30)</span>`;
    } else if (tipo === 'bateria') {
        tagClass = 'tag-quiz';
        tagLabel = 'Questões';
        const metaPct = task.parametros_validacao?.meta_porcentagem || 40;
        metaReqHtml = `<span class="task-req-pill"><i class="fa-solid fa-bullseye"></i> Meta ${metaPct}%+</span>`;
    } else if (tipo === 'modulo') {
        tagClass = 'tag-theory';
        tagLabel = 'Teoria PDF';
        const modNum = task.parametros_validacao?.modulo_minimo || 1;
        metaReqHtml = `<span class="task-req-pill"><i class="fa-solid fa-book-open"></i> Módulo ${modNum}</span>`;
    } else if (tipo === 'acertos') {
        tagClass = 'tag-review';
        tagLabel = 'Desafio de Acertos';
        const acertos = task.parametros_validacao?.acertos_minimos || 4;
        metaReqHtml = `<span class="task-req-pill"><i class="fa-solid fa-star"></i> Meta ${acertos} acertos</span>`;
    } else if (tipo === 'revisao') {
        tagClass = 'tag-review';
        tagLabel = 'Revisão';
        metaReqHtml = `<span class="task-req-pill"><i class="fa-solid fa-rotate-left"></i> Reforço (40%+)</span>`;
    }

    const isIa = Boolean(task.sugerida_por_ia || task.parametros_validacao?.sugerida_por_ia);
    const iaTagHtml = isIa
        ? `<span class="task-badge-ia" title="Missão personalizada sugerida pelo Tutor IA com base no desempenho"><i class="fa-solid fa-wand-magic-sparkles"></i> Sugerida por IA</span>`
        : '';

    let hintHtml = '';
    if (isDone) {
        hintHtml = `<div class="task-validation-hint hint-sucesso"><i class="fa-solid fa-circle-check"></i> Missão concluída e XP resgatado!</div>`;
    } else if (isExpired) {
        hintHtml = `<div class="task-validation-hint hint-expirada"><i class="fa-solid fa-clock-rotate-left"></i> ${escapeHtml(task.motivo_bloqueio || 'Missão expirada! As missões diárias devem ser realizadas rigorosamente no próprio dia.')}</div>`;
    } else if (isLocked) {
        hintHtml = `<div class="task-validation-hint hint-bloqueada"><i class="fa-solid fa-lock"></i> ${escapeHtml(task.motivo_bloqueio || 'Missão bloqueada até o dia correspondente.')}</div>`;
    } else if (podeConcluir) {
        hintHtml = `<div class="task-validation-hint hint-sucesso"><i class="fa-solid fa-circle-check"></i> ${escapeHtml(task.validacao?.motivo || 'Requisitos cumpridos! Pronto para resgatar XP.')}</div>`;
    } else if (task.motivo_bloqueio) {
        hintHtml = `<div class="task-validation-hint hint-pendente"><i class="fa-solid fa-circle-info"></i> ${escapeHtml(task.motivo_bloqueio)}</div>`;
    }

    let actionHtml = '';
    if (isDone) {
        actionHtml = '<span class="material-symbols-outlined check-icon" title="Missão concluída">check_circle</span>';
    } else if (isExpired) {
        actionHtml = '<button class="btn-action btn-expirado" disabled type="button" title="Esta missão expirou e não pode mais ser realizada"><i class="fa-solid fa-ban"></i> EXPIRADA</button>';
    } else if (isLocked) {
        actionHtml = '<button class="btn-action btn-bloqueado" disabled type="button" title="Missão bloqueada"><span class="material-symbols-outlined icone-inline" style="font-size: 1rem; margin-right: 2px;">lock</span>BLOQUEADO</button>';
    } else if (podeConcluir) {
        actionHtml = '<button class="btn-action btn-concluir btn-claimable-glow" type="button"><i class="fa-solid fa-gift"></i> CONCLUIR</button>';
    } else {
        const link = task.linkAcao || {};
        if (link.tipo === 'simulado') {
            actionHtml = `
                <button class="btn-action btn-praticar btn-simulado" type="button" title="Fazer simulado oficial agora"><i class="fa-solid fa-graduation-cap"></i> SIMULADO</button>
            `;
        } else if (link.tipo === 'questoes') {
            actionHtml = `
                <button class="btn-action btn-praticar" type="button" title="Praticar bateria de questões"><i class="fa-solid fa-play"></i> PRATICAR</button>
            `;
        } else if (link.tipo === 'modulo') {
            actionHtml = `
                <button class="btn-action btn-estudar" type="button" title="Estudar conteúdo do módulo"><i class="fa-solid fa-book-open"></i> ESTUDAR</button>
            `;
        } else if (isInProgress) {
            actionHtml = '<button class="btn-action btn-praticar" type="button"><i class="fa-solid fa-play"></i> PRATICAR</button>';
        } else if (isCurrent) {
            actionHtml = '<button class="btn-action btn-iniciar" type="button">INICIAR</button>';
        } else {
            actionHtml = '<button class="btn-action btn-bloqueado" disabled type="button" title="Missão bloqueada"><span class="material-symbols-outlined icone-inline" style="font-size: 1rem; margin-right: 2px;">lock</span>BLOQUEADO</button>';
        }
    }

    const xp = task.xp_reward || 50;

    card.innerHTML = `
        <div class="time-box">
            <div class="time">${escapeHtml(timeInfo.horario)}</div>
            <div class="duration">${escapeHtml(timeInfo.duracao)}</div>
        </div>
        <div class="task-content ${isCurrent || isInProgress ? 'active' : ''}">
            <div class="task-tags-row">
                <span class="task-tag ${tagClass}">${escapeHtml(tagLabel)}</span>
                ${iaTagHtml}
                ${metaReqHtml}
            </div>
            <div class="task-title">${escapeHtml(task.titulo || 'Tarefa sem título')}</div>
            <div class="task-desc">${escapeHtml(task.descricao || 'Sem descrição cadastrada.')}</div>
            ${hintHtml}
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

    const btnPraticar = card.querySelector('.btn-praticar');
    if (btnPraticar) {
        btnPraticar.addEventListener('click', (event) => {
            event.stopPropagation();
            if (task.linkAcao?.tipo === 'simulado' && typeof options.onSimulado === 'function') {
                options.onSimulado(task);
            } else if (typeof options.onPractice === 'function') {
                options.onPractice(task);
            }
        });
    }

    const btnEstudar = card.querySelector('.btn-estudar');
    if (btnEstudar && typeof options.onStudy === 'function') {
        btnEstudar.addEventListener('click', (event) => {
            event.stopPropagation();
            options.onStudy(task);
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

