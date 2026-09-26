import { qs, qsa } from '../../utils/dom.js';
import { sendChatMessage } from '../../services/aiService.js';
import { getCurrentUser } from '../../services/authService.js';
import { usuarioGlobal } from '../../services/userService.js';
import { getGamificationData, getTaxaAproveitamento } from '../../services/gamificationService.js';
import { getLocalDesempenho, fetchDesempenho } from '../../services/desempenhoService.js';

let initialized = false;
let currentRouter = null;
let conversationHistory = [];
let isSending = false;

export function initTutorIaView(router) {
    currentRouter = router;
    usuarioGlobal.updateUI();

    const chatBody = qs('#tutor-ia-chat-messages');
    const input = qs('#tutor-ia-input');

    if (input) {
        input.focus();
    }

    if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    if (initialized) return;
    initialized = true;

    const form = qs('#tutor-ia-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = input ? input.value : '';
            if (val && val.trim()) {
                handleUserSend(val.trim());
            }
        });
    }

    const btnVoltar = qs('#btn-voltar-tutor-ia');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            if (currentRouter) {
                currentRouter.navigateTo('inicio');
            }
        });
    }

    if (chatBody) {
        chatBody.addEventListener('click', (e) => {
            const chip = e.target.closest('.sugestao-chip');
            if (chip && chip.dataset.msg) {
                handleUserSend(chip.dataset.msg);
            }
        });
    }
}

async function handleUserSend(text) {
    if (!text || isSending) return;
    isSending = true;

    const input = qs('#tutor-ia-input');
    const sendBtn = qs('#tutor-ia-send-btn');
    const chatBody = qs('#tutor-ia-chat-messages');

    if (input) {
        input.value = '';
    }

    if (sendBtn) {
        sendBtn.disabled = true;
    }

    appendUserMessage(text);
    conversationHistory.push({ role: 'user', content: text });

    appendTypingIndicator();
    scrollChatBottom();

    const gamification = getGamificationData();
    const taxa = getTaxaAproveitamento();
    const desempenho = getLocalDesempenho();

    const context = {
        userId: usuarioGlobal.id || null,
        id_usuario: usuarioGlobal.id || null,
        nome: usuarioGlobal.nome,
        nivel: gamification?.lv || usuarioGlobal.lv,
        taxaAproveitamento: taxa,
        desempenho
    };

    try {
        const response = await sendChatMessage(text, conversationHistory, context);
        removeTypingIndicator();

        const botReply = response.message || 'Estou aqui para ajudar com os conteúdos da prova do DETRAN.';
        appendBotMessage(botReply);
        conversationHistory.push({ role: 'assistant', content: botReply });
    } catch (err) {
        removeTypingIndicator();
        const fallbackText = 'Estou à disposição para tirar dúvidas sobre a prova teórica do DETRAN e a plataforma AprovaDrive! Que tal revisar as matérias de Legislação e Direção Defensiva ou tentar enviar sua dúvida novamente em instantes?';
        appendBotMessage(fallbackText);
        conversationHistory.push({ role: 'assistant', content: fallbackText });
    } finally {
        isSending = false;
        if (sendBtn) {
            sendBtn.disabled = false;
        }
        if (input) {
            input.focus();
        }
        scrollChatBottom();
    }
}

function appendUserMessage(text) {
    const chatBody = qs('#tutor-ia-chat-messages');
    if (!chatBody) return;

    const user = getCurrentUser();
    const inicial = user?.nome ? user.nome.charAt(0).toUpperCase() : 'U';
    const timeStr = getHoraAtual();

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg chat-msg-user';
    msgDiv.innerHTML = `
        <div class="chat-avatar">${escapeHtml(inicial)}</div>
        <div class="chat-bubble">
            <p>${escapeHtml(text)}</p>
            <span class="chat-msg-time">${timeStr}</span>
        </div>
    `;

    chatBody.appendChild(msgDiv);
}

function appendBotMessage(text) {
    const chatBody = qs('#tutor-ia-chat-messages');
    if (!chatBody) return;

    const timeStr = getHoraAtual();
    const formattedHtml = formatBotText(text);

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg chat-msg-bot';
    msgDiv.innerHTML = `
        <div class="chat-avatar">
            <span class="material-symbols-outlined">auto_awesome</span>
        </div>
        <div class="chat-bubble">
            ${formattedHtml}
            <span class="chat-msg-time">${timeStr}</span>
        </div>
    `;

    chatBody.appendChild(msgDiv);
}

function appendTypingIndicator() {
    const chatBody = qs('#tutor-ia-chat-messages');
    if (!chatBody) return;

    removeTypingIndicator();

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg chat-msg-bot';
    typingDiv.id = 'tutor-ia-typing';
    typingDiv.innerHTML = `
        <div class="chat-avatar">
            <span class="material-symbols-outlined">auto_awesome</span>
        </div>
        <div class="chat-bubble chat-typing-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;

    chatBody.appendChild(typingDiv);
}

function removeTypingIndicator() {
    const typing = qs('#tutor-ia-typing');
    if (typing) {
        typing.remove();
    }
}

function scrollChatBottom() {
    const chatBody = qs('#tutor-ia-chat-messages');
    if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

function getHoraAtual() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

function formatBotText(raw) {
    if (!raw) return '<p></p>';
    const lines = String(raw).split('\n');
    const processed = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => `<p>${escapeHtml(line)}</p>`)
        .join('');
    return processed || `<p>${escapeHtml(raw)}</p>`;
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
