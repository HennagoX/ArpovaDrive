import { qs, qsa } from '../../utils/dom.js';
import { sendChatMessage } from '../../services/aiService.js';
import { getCurrentUser } from '../../services/authService.js';
import { usuarioGlobal } from '../../services/userService.js';
import { getGamificationData, getTaxaAproveitamento } from '../../services/gamificationService.js';
import { getLocalDesempenho, fetchDesempenho } from '../../services/desempenhoService.js';
import { startCooldown } from '../../utils/debounce.js';

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

    const btnSend = qs('#tutor-ia-send-btn');
    const sendMsg = () => {
        const val = input ? input.value : '';
        if (val && val.trim()) {
            handleUserSend(val.trim());
        }
    };
    if (btnSend) {
        btnSend.addEventListener('click', (e) => {
            e.preventDefault();
            sendMsg();
        });
    }
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMsg();
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
        if (input) {
            input.focus();
        }
        scrollChatBottom();
        if (sendBtn) {
            startCooldown(sendBtn, 2, {
                originalHtml: '<i class="fa-solid fa-paper-plane"></i>',
                originalDisabled: false,
                formatText: (s) => `<span style="font-size: 11px; font-weight: bold;">${s}s</span>`,
                preserveIcon: false
            });
        }
    }
}

function appendUserMessage(text) {
    const chatBody = qs('#tutor-ia-chat-messages');
    if (!chatBody) return;

    const user = getCurrentUser();
    const inicial = user?.nome ? user.nome.charAt(0).toUpperCase() : 'U';
    const timeStr = getHoraAtual();
    const userContent = escapeHtml(text).replace(/\n/g, '<br>');

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg chat-msg-user';
    msgDiv.innerHTML = `
        <div class="chat-avatar">${escapeHtml(inicial)}</div>
        <div class="chat-bubble">
            <p>${userContent}</p>
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
            <div class="bot-msg-content">
                ${formattedHtml}
            </div>
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
    if (!chatBody) return;
    chatBody.scrollTop = chatBody.scrollHeight;
}

function getHoraAtual() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

export function formatBotText(raw) {
    if (!raw) return '<p class="bot-paragraph"></p>';

    const escaped = escapeHtml(String(raw).trim());
    const rawLines = escaped.split(/\r?\n/);
    const lines = preprocessListLines(rawLines);

    const htmlBlocks = [];
    let currentParagraph = [];
    let currentList = null; // { type: 'ul' | 'ol', items: [], start?: number, isLetter?: boolean }
    let currentQuote = [];
    let currentTable = [];
    let inCodeBlock = false;
    let codeBlockLines = [];

    const flushParagraph = () => {
        if (currentParagraph.length > 0) {
            const content = currentParagraph.map(formatKeyValueLine).join('<br>');
            htmlBlocks.push(`<p class="bot-paragraph">${content}</p>`);
            currentParagraph = [];
        }
    };

    const flushList = () => {
        if (currentList) {
            const tag = currentList.type;
            let cls = tag === 'ol' ? 'bot-list bot-ordered-list' : 'bot-list';
            if (currentList.isLetter) cls += ' bot-letter-list';
            const startAttr = (tag === 'ol' && currentList.start && currentList.start !== 1 && !currentList.isLetter) ? ` start="${currentList.start}"` : '';
            const itemsHtml = currentList.items
                .map(item => `<li>${formatInline(item)}</li>`)
                .join('');
            htmlBlocks.push(`<${tag} class="${cls}"${startAttr}>${itemsHtml}</${tag}>`);
            currentList = null;
        }
    };

    const flushQuote = () => {
        if (currentQuote.length > 0) {
            const content = currentQuote.map(formatInline).join('<br>');
            htmlBlocks.push(`<blockquote class="bot-blockquote"><p>${content}</p></blockquote>`);
            currentQuote = [];
        }
    };

    const flushTable = () => {
        if (currentTable.length >= 2) {
            const isSep = (l) => /^\|[\s:?-]+(?:\|[\s:?-]+)*\|$/.test(l.trim());
            if (isSep(currentTable[1])) {
                const parseCells = (row) => row.split('|').slice(1, -1).map(c => c.trim());
                const headers = parseCells(currentTable[0]);
                const thead = `<thead><tr>${headers.map(h => `<th>${formatInline(h)}</th>`).join('')}</tr></thead>`;
                const rows = currentTable.slice(2).map(row => {
                    const cells = parseCells(row);
                    return `<tr>${cells.map(c => `<td>${formatInline(c)}</td>`).join('')}</tr>`;
                }).join('');
                htmlBlocks.push(`<div class="bot-table-wrapper"><table class="bot-table">${thead}<tbody>${rows}</tbody></table></div>`);
                currentTable = [];
                return;
            }
        }
        if (currentTable.length > 0) {
            currentTable.forEach(row => currentParagraph.push(row));
            currentTable = [];
            flushParagraph();
        }
    };

    const flushAll = () => {
        flushParagraph();
        flushList();
        flushQuote();
        flushTable();
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Code block (```)
        if (trimmed.startsWith('```')) {
            if (inCodeBlock) {
                const codeContent = codeBlockLines.join('\n');
                htmlBlocks.push(`<pre class="bot-code-block"><code>${codeContent}</code></pre>`);
                inCodeBlock = false;
                codeBlockLines = [];
            } else {
                flushAll();
                inCodeBlock = true;
                codeBlockLines = [];
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockLines.push(line);
            continue;
        }

        // Empty line
        if (!trimmed) {
            flushAll();
            continue;
        }

        // Table row
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            flushParagraph();
            flushList();
            flushQuote();
            currentTable.push(trimmed);
            continue;
        } else if (currentTable.length > 0) {
            flushTable();
        }

        // Horizontal divider (---, ***, ___)
        if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
            flushAll();
            htmlBlocks.push('<hr class="bot-divider" />');
            continue;
        }

        // Headings (#, ##, ###, ####)
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            flushAll();
            const level = headingMatch[1].length;
            const headingText = formatInline(headingMatch[2]);
            const tag = level <= 2 ? 'h3' : 'h4';
            htmlBlocks.push(`<${tag} class="bot-heading bot-${tag}">${headingText}</${tag}>`);
            continue;
        }

        // Blockquotes (> or &gt;)
        const quoteMatch = trimmed.match(/^(&gt;|>)\s?(.*)$/);
        if (quoteMatch) {
            flushParagraph();
            flushList();
            currentQuote.push(quoteMatch[2]);
            continue;
        } else if (currentQuote.length > 0) {
            flushQuote();
        }

        // List lead-in title (ends with ":" and is followed by a list item)
        let nextNonEmpty = '';
        for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim()) {
                nextNonEmpty = lines[j].trim();
                break;
            }
        }
        if (isListLeadIn(trimmed, nextNonEmpty)) {
            flushAll();
            const formattedLead = formatInline(trimmed);
            const content = formattedLead.includes('<strong>') ? formattedLead : `<strong>${formattedLead}</strong>`;
            htmlBlocks.push(`<p class="bot-paragraph bot-list-lead">${content}</p>`);
            continue;
        }

        // Unordered list (- item, * item, • item, etc.)
        const ulMatch = parseUnorderedLine(line);
        if (ulMatch) {
            flushParagraph();
            flushQuote();
            if (!currentList || currentList.type !== 'ul') {
                flushList();
                currentList = { type: 'ul', items: [] };
            }
            currentList.items.push(ulMatch.text);
            continue;
        }

        // Ordered list (1. item, 2. item, 1) item, etc.)
        const olMatch = parseOrderedLine(line);
        if (olMatch) {
            flushParagraph();
            flushQuote();
            if (!currentList || currentList.type !== 'ol' || currentList.isLetter) {
                flushList();
                currentList = { type: 'ol', items: [], start: olMatch.num };
            }
            currentList.items.push(olMatch.text);
            continue;
        }

        // Lettered list (A) item, B) item)
        const letterMatch = parseLetteredLine(line);
        if (letterMatch) {
            flushParagraph();
            flushQuote();
            if (!currentList || currentList.type !== 'ol' || !currentList.isLetter) {
                flushList();
                currentList = { type: 'ol', items: [], isLetter: true };
            }
            currentList.items.push(letterMatch.text);
            continue;
        }

        // Indented continuation of list item
        if (currentList && (/^\s{2,}/.test(line) || /^\t/.test(line))) {
            if (currentList.items.length > 0) {
                currentList.items[currentList.items.length - 1] += ' ' + trimmed;
                continue;
            }
        }

        // Regular paragraph line
        flushList();
        flushQuote();
        currentParagraph.push(trimmed);
    }

    if (inCodeBlock && codeBlockLines.length > 0) {
        htmlBlocks.push(`<pre class="bot-code-block"><code>${codeBlockLines.join('\n')}</code></pre>`);
    }

    flushAll();

    return htmlBlocks.join('') || `<p class="bot-paragraph">${formatInline(escaped)}</p>`;
}

function preprocessListLines(rawLines) {
    const lines = [...rawLines];
    for (let i = 0; i < lines.length - 1; i++) {
        const cur = lines[i].trim();
        if (!cur) continue;

        let nextIdx = -1;
        for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim()) {
                nextIdx = j;
                break;
            }
        }

        if (nextIdx !== -1) {
            const nextTrimmed = lines[nextIdx].trim();
            const nextIsTwo = /^(\s*)(2)(?:[º°\)]|(?:\.(?!\d))|(?:\s*[-–—:]))\s*(.*)$/.test(nextTrimmed);
            const isCurSpecial = /^(\s*)(?:[-*•–—+▫▪]|\d+|#{1,6}|>|&gt;|\||```)/.test(cur) || /(?::|\:\*{1,2}|:\_{1,2})$/.test(cur);
            if (nextIsTwo && !isCurSpecial) {
                lines[i] = '1. ' + cur;
            }
        }
    }
    return lines;
}

function parseOrderedLine(line) {
    const m = line.match(/^(\s*)(\d+)(?:[º°\)]|(?:\.(?!\d))|(?:\s*[-–—:]))\s*(.*)$/);
    if (m && m[3] !== undefined && m[3].trim().length > 0) {
        return { num: parseInt(m[2], 10), text: m[3] };
    }
    return null;
}

function parseLetteredLine(line) {
    const m = line.match(/^(\s*)([A-Da-d])[\.\)]\s+(.*)$/);
    if (m && m[3] !== undefined) {
        return { letter: m[2].toUpperCase(), text: m[3] };
    }
    return null;
}

function parseUnorderedLine(line) {
    const m = line.match(/^(\s*)[-*•–—+▫▪]\s+(.*)$/);
    if (m && m[2] !== undefined) {
        return { text: m[2] };
    }
    return null;
}

function isListLeadIn(trimmed, nextLine) {
    if (!/(?::|\:\*{1,2}|:\_{1,2})$/.test(trimmed)) return false;
    if (!nextLine) return false;
    const next = nextLine.trim();
    return !!(parseOrderedLine(next) || parseUnorderedLine(next) || parseLetteredLine(next));
}

function formatKeyValueLine(line) {
    const m = line.match(/^(\*\*|__)?([A-ZÀ-Úa-z][\w\sÀ-ÿ\(\)\/\-]{1,35})(\*\*|__)?:\s+(.+)$/) ||
              line.match(/^(\*\*|__)([A-ZÀ-Úa-z][\w\sÀ-ÿ\(\)\/\-]{1,35}):(\*\*|__)\s+(.+)$/);
    if (m) {
        const key = m[2];
        let val = m[4];
        if (/tempo|duraç[ãa]o|hor[aá]rio|carga/i.test(key)) {
            val = val.replace(/(\b\d+[\s\u00a0\u202f]*(?:min(?:utos)?|h(?:oras)?|s(?:egundos)?)\b)/gi, '<span class="bot-time-pill"><i class="fa-regular fa-clock"></i> $1</span>');
        }
        return `<strong>${key}:</strong> ${formatInline(val)}`;
    }
    return formatInline(line);
}

function formatInline(text) {
    if (!text) return '';

    // Protect inline code snippets
    const codeTokens = [];
    let formatted = text.replace(/`([^`]+)`/g, (_match, code) => {
        const id = `___CODE_TOKEN_${codeTokens.length}___`;
        codeTokens.push(`<code class="bot-inline-code">${code}</code>`);
        return id;
    });

    // Markdown Links: [text](https://...)
    formatted = formatted.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="bot-link">$1</a>'
    );

    // Bold + Italic: ***text*** or ___text___
    formatted = formatted.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    formatted = formatted.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');

    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__([^_]+?)__/g, '<strong>$1</strong>');

    // Italic: *text* (word boundaries)
    formatted = formatted.replace(/(^|[^\w*])\*([^\s*](?:[^*\n]*?[^\s*])?)\*(?=[^\w*]|$)/g, '$1<em>$2</em>');
    formatted = formatted.replace(/(^|[^\w_])_([^\s_](?:[^_\n]*?[^\s_])?)_(?=[^\w_]|$)/g, '$1<em>$2</em>');

    // Time durations in parentheses: e.g. (5 min), (12 min)
    formatted = formatted.replace(
        /\((\d+[\s\u00a0\u202f]*(?:min(?:utos)?|h(?:oras)?|s(?:egundos)?))\)/gi,
        '<span class="bot-time-pill"><i class="fa-regular fa-clock"></i> $1</span>'
    );

    // Restore inline code tokens
    codeTokens.forEach((token, index) => {
        formatted = formatted.replace(`___CODE_TOKEN_${index}___`, token);
    });

    return formatted;
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
