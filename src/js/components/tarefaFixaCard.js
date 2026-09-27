export function createTarefaFixaCard(task, options = {}) {
    if (!task) return null;

    const card = document.createElement('article');

    const isSimulado = task.tipo === 'simulado' || Boolean(task.isSimulado);
    const isQuestao = task.tipo === 'questao';
    const isDone = Boolean(task.concluida || task.status === 'done');
    const isClaimable = !isDone && Boolean(task.podeReivindicar);
    const isInProgress = !isDone && (task.status === 'in_progress');
    const isLocked = !isDone && (task.status === 'locked' || task.bloqueada);

    const statusClass = isDone ? 'done' : isClaimable ? 'claimable' : isInProgress ? 'in_progress' : 'locked';
    const typeClass = isSimulado ? 'tarefa-tipo-simulado' : isQuestao ? 'tarefa-tipo-questao' : 'tarefa-tipo-modulo';

    card.className = `tarefa-fixa-card ${typeClass} ${statusClass}`;
    card.dataset.taskId = task.id;
    card.dataset.tipo = task.tipo;
    card.dataset.conteudoId = task.conteudoId;

    const xpAmount = task.xp_reward || (isSimulado ? 600 : isQuestao ? 350 : 150);

    let tagHtml = '';
    if (isSimulado) {
        tagHtml = `
            <div class="tarefa-badge-desafio" style="background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3);">
                <i class="fa-solid fa-graduation-cap"></i>
                <span>SIMULADO OFICIAL • META ${task.percentualAlvo || 67}%+ (${task.acertosNecessarios || 20}/30)</span>
            </div>
        `;
    } else if (isQuestao) {
        tagHtml = `
            <div class="tarefa-badge-desafio">
                <i class="fa-solid fa-bolt"></i>
                <span>DESAFIO DE QUESTÕES • META ${task.percentualAlvo || 70}%+</span>
            </div>
        `;
    } else {
        const modNumStr = String(task.moduloNumero || 1).padStart(2, '0');
        tagHtml = `
            <div class="tarefa-badge-modulo">
                <i class="fa-solid fa-book-bookmark"></i>
                <span>MÓDULO ${modNumStr}</span>
            </div>
        `;
    }

    let metaRefHtml = '';
    if (isSimulado) {
        metaRefHtml += `<span class="tarefa-meta-pill"><i class="fa-solid fa-clipboard-check"></i> 30 Questões Oficiais</span>`;
        if (isDone) {
            metaRefHtml += `<span class="tarefa-meta-pill pill-sucesso"><i class="fa-solid fa-circle-check"></i> Aprovado (${task.porcentagemAcertos !== null && task.porcentagemAcertos !== undefined ? task.porcentagemAcertos : 67}%)</span>`;
        } else if (isClaimable) {
            metaRefHtml += `<span class="tarefa-meta-pill pill-sucesso"><i class="fa-solid fa-circle-check"></i> Aproveitamento: ${task.porcentagemAcertos}% (${task.acertosObtidos || 20}/30)</span>`;
        } else if (isInProgress && task.porcentagemAcertos !== null && task.porcentagemAcertos !== undefined) {
            metaRefHtml += `<span class="tarefa-meta-pill pill-alerta"><i class="fa-solid fa-rotate-left"></i> Aproveitamento anterior: ${task.porcentagemAcertos}% (Meta: ${task.percentualAlvo || 67}%)</span>`;
        }
    } else if (isQuestao) {
        if (task.modulosReferencia) {
            metaRefHtml += `<span class="tarefa-meta-pill"><i class="fa-solid fa-layer-group"></i> ${escapeHtml(task.modulosReferencia)}</span>`;
        }
        if (isDone) {
            metaRefHtml += `<span class="tarefa-meta-pill pill-sucesso"><i class="fa-solid fa-circle-check"></i> Concluído (${task.porcentagemAcertos !== null && task.porcentagemAcertos !== undefined ? task.porcentagemAcertos : 100}%)</span>`;
        } else if (isClaimable) {
            metaRefHtml += `<span class="tarefa-meta-pill pill-sucesso"><i class="fa-solid fa-circle-check"></i> Aproveitamento: ${task.porcentagemAcertos}%</span>`;
        } else if (isInProgress && task.porcentagemAcertos !== null && task.porcentagemAcertos !== undefined) {
            metaRefHtml += `<span class="tarefa-meta-pill pill-alerta"><i class="fa-solid fa-rotate-left"></i> Aproveitamento anterior: ${task.porcentagemAcertos}% (Meta: ${task.percentualAlvo || 70}%)</span>`;
        }
    }

    if (task.is_custom) {
        metaRefHtml += `<span class="tarefa-meta-pill pill-custom"><i class="fa-solid fa-sparkles"></i> Customizada</span>`;
    }

    let actionHtml = '';
    if (isDone) {
        actionHtml = `
            <div class="tarefa-status-done" title="Missão concluída com sucesso!">
                <i class="fa-solid fa-circle-check"></i>
                <span>Concluída</span>
            </div>
        `;
    } else if (isClaimable) {
        actionHtml = `
            <button type="button" class="btn-tarefa btn-reivindicar" title="Reivindicar sua recompensa de XP!">
                <i class="fa-solid fa-gift"></i>
                <span>Reivindicar +${xpAmount} XP</span>
            </button>
        `;
    } else if (isInProgress) {
        if (isSimulado) {
            const jaTentou = task.porcentagemAcertos !== null && task.porcentagemAcertos !== undefined;
            const btnText = jaTentou ? `Refazer Simulado (${task.porcentagemAcertos}%)` : 'Fazer Simulado';
            const btnTitle = jaTentou
                ? `Você obteve ${task.porcentagemAcertos}%. Refaça e alcance ${task.percentualAlvo || 67}%+ (20 acertos) para liberar a recompensa!`
                : `Resolver Simulado de 30 questões e atingir no mínimo ${task.percentualAlvo || 67}% (20 acertos)`;
            actionHtml = `
                <div class="tarefa-actions-group">
                    <button type="button" class="btn-tarefa btn-praticar" title="${escapeHtml(btnTitle)}">
                        <i class="fa-solid ${jaTentou ? 'fa-rotate-left' : 'fa-circle-play'}"></i>
                        <span>${escapeHtml(btnText)}</span>
                    </button>
                </div>
            `;
        } else if (isQuestao) {
            const jaTentou = task.porcentagemAcertos !== null && task.porcentagemAcertos !== undefined;
            const btnText = jaTentou ? `Refazer Bateria (${task.porcentagemAcertos}%)` : 'Fazer Questões';
            const btnTitle = jaTentou
                ? `Você obteve ${task.porcentagemAcertos}%. Refaça e alcance ${task.percentualAlvo || 70}%+ para liberar a recompensa!`
                : `Resolver Bateria ${task.bateriaNumero || 1} e atingir no mínimo ${task.percentualAlvo || 70}% de acertos`;
            actionHtml = `
                <div class="tarefa-actions-group">
                    <button type="button" class="btn-tarefa btn-praticar" title="${escapeHtml(btnTitle)}">
                        <i class="fa-solid ${jaTentou ? 'fa-rotate-left' : 'fa-circle-play'}"></i>
                        <span>${escapeHtml(btnText)}</span>
                    </button>
                </div>
            `;
        } else {
            actionHtml = `
                <div class="tarefa-actions-group">
                    <button type="button" class="btn-tarefa btn-estudar" title="Ler material do módulo">
                        <i class="fa-solid fa-book-open-reader"></i>
                        <span>Estudar Módulo</span>
                    </button>
                    <button type="button" class="btn-tarefa btn-reivindicar" title="Concluir módulo e coletar XP">
                        <i class="fa-solid fa-check"></i>
                        <span>Concluir</span>
                    </button>
                </div>
            `;
        }
    } else {
        const lockTitle = escapeHtml(task.motivo || 'Complete as etapas anteriores para desbloquear.');
        actionHtml = `
            <button type="button" class="btn-tarefa btn-bloqueado" title="${lockTitle}">
                <i class="fa-solid fa-lock"></i>
                <span>Bloqueada</span>
            </button>
        `;
    }

    const iconePrincipal = isSimulado ? 'fa-solid fa-graduation-cap' : isQuestao ? 'fa-solid fa-trophy' : 'fa-solid fa-book-open';

    card.innerHTML = `
        <div class="tarefa-left-col">
            <div class="tarefa-icon-box">
                <i class="${iconePrincipal}"></i>
            </div>
        </div>

        <div class="tarefa-main-col">
            <div class="tarefa-header-row">
                ${tagHtml}
                ${metaRefHtml}
            </div>

            <h4 class="tarefa-titulo">${escapeHtml(task.titulo || 'Tarefa de Conteúdo')}</h4>
            <p class="tarefa-descricao">${escapeHtml(task.descricao || 'Conclua para acumular XP permanente.')}</p>

            ${task.motivo && !isDone ? `
                <div class="tarefa-locked-hint ${isClaimable ? 'hint-sucesso' : isInProgress ? 'hint-progresso' : 'hint-locked'}">
                    <i class="fa-solid ${isClaimable ? 'fa-circle-check' : isInProgress ? 'fa-circle-info' : 'fa-lock'}"></i>
                    <span>${escapeHtml(task.motivo)}</span>
                </div>
            ` : ''}
        </div>

        <div class="tarefa-reward-col">
            <div class="tarefa-xp-badge ${isQuestao ? 'xp-gold' : 'xp-blue'}">
                <i class="fa-solid fa-star"></i>
                <span>+${xpAmount} XP</span>
            </div>
            <div class="tarefa-action-container">
                <div style="display: flex; gap: 8px; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
                    ${actionHtml}
                    ${task.is_custom && typeof options.onDelete === 'function' ? `
                        <button type="button" class="btn-tarefa-admin-delete" title="Excluir tarefa fixa criada por administrador">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    // Event Listeners
    const btnDelete = card.querySelector('.btn-tarefa-admin-delete');
    if (btnDelete && typeof options.onDelete === 'function') {
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            options.onDelete(task, btnDelete);
        });
    }

    const btnReivindicar = card.querySelector('.btn-reivindicar');
    if (btnReivindicar && typeof options.onClaim === 'function') {
        btnReivindicar.addEventListener('click', (e) => {
            e.stopPropagation();
            options.onClaim(task, btnReivindicar);
        });
    }

    const btnEstudar = card.querySelector('.btn-estudar');
    if (btnEstudar && typeof options.onStudy === 'function') {
        btnEstudar.addEventListener('click', (e) => {
            e.stopPropagation();
            options.onStudy(task);
        });
    }

    const btnPraticar = card.querySelector('.btn-praticar');
    if (btnPraticar && typeof options.onPractice === 'function') {
        btnPraticar.addEventListener('click', (e) => {
            e.stopPropagation();
            options.onPractice(task);
        });
    }

    const btnBloqueado = card.querySelector('.btn-bloqueado');
    if (btnBloqueado && typeof options.onLockedClick === 'function') {
        btnBloqueado.addEventListener('click', (e) => {
            e.stopPropagation();
            card.classList.remove('shake');
            requestAnimationFrame(() => {
                card.classList.add('shake');
            });
            options.onLockedClick(task);
        });
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
