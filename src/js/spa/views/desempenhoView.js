import { qs, qsa, setText, setHTML } from '../../utils/dom.js';
import { getCurrentUser } from '../../services/authService.js';
import { getGamificationData, getTaxaAproveitamento } from '../../services/gamificationService.js';
import { fetchDesempenho, getLocalDesempenho } from '../../services/desempenhoService.js';
import { usuarioGlobal } from '../../services/userService.js';
import { SELECTORS } from '../../constants/selectors.js';

let initialized = false;
let currentRouter = null;

export function initDesempenhoView(router) {
    currentRouter = router;
    if (initialized) return;
    initialized = true;

    const btnIa = qs('#view-desempenho .ia-botao');
    if (btnIa && router) {
        btnIa.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigateTo('tutor-ia');
        });
    }

    const viewDesempenho = qs('#view-desempenho');
    if (viewDesempenho && router) {
        viewDesempenho.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-nav]');
            if (navLink) {
                const navKey = navLink.getAttribute('data-nav');
                if (navKey && router) {
                    e.preventDefault();
                    router.navigateTo(navKey);
                }
            }
        });
    }
}

function aplicarDesempenhoNaTela(desempenho) {
    if (!desempenho || !desempenho.resumo) return;

    usuarioGlobal.updateUI();

    const tituloSaudacao = qs('#inicio-saudacao');
    const subtitulo = qs('#inicio-subtitulo');

    const nomeAluno = usuarioGlobal.nome || desempenho.usuario?.nome || 'Aluno';

    if (tituloSaudacao) {
        setText(tituloSaudacao, `Desempenho de ${nomeAluno}`);
    }

    if (subtitulo) {
        setText(subtitulo, 'Monitore suas estatísticas detalhadas e prepare-se para o DETRAN');
    }

    const { resumo, materias, ultimosSimulados, diagnosticoIa } = desempenho;
    const taxa = Number(resumo.taxaAproveitamento ?? 0);

    // 1. Atualizar KPIs do Topo
    const taxaEl = qs(SELECTORS.DESEMPENHO_APROVEITAMENTO);
    if (taxaEl) {
        setText(taxaEl, `${taxa}%`);
    }

    const totalQuestoesEl = qs(SELECTORS.DESEMPENHO_QUESTOES);
    if (totalQuestoesEl) {
        setText(totalQuestoesEl, String(resumo.totalQuestoes ?? 0));
    }

    const totalAcertosEl = qs(SELECTORS.DESEMPENHO_ACERTOS);
    if (totalAcertosEl) {
        setText(totalAcertosEl, String(resumo.totalAcertos ?? 0));
    }

    const totalErrosEl = qs(SELECTORS.DESEMPENHO_ERROS);
    if (totalErrosEl) {
        setText(totalErrosEl, String(resumo.totalErros ?? 0));
    }

    const totalSimuladosEl = qs(SELECTORS.DESEMPENHO_SIMULADOS);
    if (totalSimuladosEl) {
        setText(totalSimuladosEl, String(resumo.totalSimulados ?? 0));
    }

    // 2. Atualizar Círculo de Destaque
    const circuloEl = qs(SELECTORS.DESEMPENHO_CIRCULO);
    const circuloTaxaEl = qs('#circuloTaxa');
    const circuloStatusEl = qs('#circuloStatusLabel');
    const circuloDescEl = qs('#circuloStatusDesc');

    if (circuloTaxaEl) {
        setText(circuloTaxaEl, `${taxa}%`);
    }

    if (circuloEl) {
        const deg = Math.round((Math.max(0, Math.min(100, taxa)) / 100) * 360);
        const corFill = resumo.statusCor || (taxa >= 70 ? '#16a34a' : (taxa >= 50 ? '#f59e0b' : '#dc2626'));
        circuloEl.style.background = `conic-gradient(${corFill} 0deg ${deg}deg, #e5e7eb ${deg}deg 360deg)`;
    }

    if (circuloStatusEl) {
        setText(circuloStatusEl, resumo.statusGeral || (taxa >= 70 ? 'Apto' : (taxa >= 50 ? 'Médio' : 'Atenção')));
        circuloStatusEl.style.color = resumo.statusCor || (taxa >= 70 ? '#16a34a' : (taxa >= 50 ? '#f59e0b' : '#dc2626'));
    }

    if (circuloDescEl) {
        setText(circuloDescEl, resumo.statusDescricao || 'Acompanhe seu desempenho para conquistar sua CNH de primeira!');
    }

    // 3. Atualizar Lista de Matérias
    const materiasContainer = qs('#view-desempenho .materias-lista');
    if (materiasContainer && Array.isArray(materias) && materias.length > 0) {
        materiasContainer.innerHTML = materias.map(m => {
            const pct = Math.max(0, Math.min(100, Number(m.porcentagem || 0)));
            return `
                <div class="materia-linha">
                    <div class="materia-linha-topo">
                        <span class="materia-nome">
                            <i class="${escapeHtml(m.icone || 'fa-solid fa-book')}"></i> ${escapeHtml(m.nome)}
                        </span>
                        <div class="materia-stats">
                            <span class="badge-status ${escapeHtml(m.statusClasse || 'badge-revisao')}">${escapeHtml(m.status || 'Revisão')}</span>
                            <strong>${pct}%</strong>
                        </div>
                    </div>
                    <div class="barra-progresso">
                        <div class="barra-progresso-fill ${escapeHtml(m.fillClasse || 'fill-revisao')}" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 4. Atualizar Diagnóstico do Tutor IA
    const diagnosticoEl = qs('#view-desempenho .ia-card p');
    if (diagnosticoEl && diagnosticoIa) {
        setText(diagnosticoEl, diagnosticoIa);
    }

    // 5. Atualizar Lista de Últimos Simulados
    const simuladosContainer = qs('#view-desempenho .simulados-lista');
    if (simuladosContainer) {
        if (Array.isArray(ultimosSimulados) && ultimosSimulados.length > 0) {
            simuladosContainer.innerHTML = ultimosSimulados.map(sim => `
                <div class="simulado-item">
                    <div class="simulado-info">
                        <strong>${escapeHtml(sim.titulo)}</strong>
                        <span>${escapeHtml(sim.dataTexto)} • ${escapeHtml(sim.tempoTexto)}</span>
                    </div>
                    <div class="simulado-resultado">
                        <span class="simulado-nota ${escapeHtml(sim.notaClasse || 'nota-aprovado')}">${escapeHtml(sim.notaTexto)}</span>
                        <span class="badge-status ${escapeHtml(sim.statusClasse || 'badge-excelente')}">${escapeHtml(sim.statusTexto)}</span>
                    </div>
                </div>
            `).join('');
        } else {
            simuladosContainer.innerHTML = `
                <div style="padding: 24px 16px; text-align: center; color: #64748b; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
                    <span class="material-symbols-outlined" style="font-size: 36px; color: #94a3b8; display: block; margin-bottom: 8px;">assignment_late</span>
                    <strong style="display: block; font-size: 15px; color: #334155; margin-bottom: 4px;">Nenhum simulado realizado ainda</strong>
                    <p style="font-size: 13px; margin-bottom: 12px; line-height: 1.4;">Realize seu primeiro simulado com 30 questões no modelo oficial do DETRAN para testar seu tempo e precisão.</p>
                    <a href="#simulado" class="ia-botao" data-nav="simulado" style="font-size: 13px; padding: 8px 14px;">
                        <span class="material-symbols-outlined" style="font-size: 18px;">play_arrow</span> Iniciar Simulado Agora
                    </a>
                </div>
            `;
        }
    }
}

export async function renderDesempenho() {
    // Renderização imediata com cache/local (sem piscar nem travar UI)
    const local = getLocalDesempenho();
    aplicarDesempenhoNaTela(local);

    // Consulta assíncrona na API com atualização suave
    const user = getCurrentUser();
    const userId = user?.id_usuario || null;

    try {
        const remoto = await fetchDesempenho(userId, true);
        if (remoto && remoto.resumo) {
            aplicarDesempenhoNaTela(remoto);
        }
    } catch (err) {
        console.warn('[DesempenhoView] Erro ao sincronizar dados remotos:', err.message);
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
