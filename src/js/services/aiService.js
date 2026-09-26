import { ENDPOINTS } from '../constants/routes.js';
import { getNetworkErrorMessage, getHttpErrorMessage } from '../constants/messages.js';

export async function sendChatMessage(message, history = [], context = {}) {
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('Mensagem não informada.');
  }

  try {
    const response = await fetch(ENDPOINTS.AI.CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message: message.trim(),
        history: Array.isArray(history) ? history : [],
        context: context && typeof context === 'object' ? context : {}
      }),
      signal: typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' 
        ? AbortSignal.timeout(25000) 
        : undefined
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(getHttpErrorMessage(response.status, errorData?.error, 'Erro ao comunicar com o Tutor IA.'));
    }

    const data = await response.json();
    return {
      message: data.message || 'Como posso te ajudar nos estudos para a prova do DETRAN?',
      intent: data.intent || 'conversation',
      action: data.action || { type: 'none', status: 'none', parameters: {} },
      confidence: data.confidence !== undefined ? data.confidence : 1.0
    };
  } catch (err) {
    if (err.message && err.message.includes('(Erro HTTP')) {
      throw err;
    }
    throw new Error(getNetworkErrorMessage(err));
  }
}
