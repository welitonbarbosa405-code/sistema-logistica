/**
 * 🚀 SISTEMA DE RASTREAMENTO AVANÇADO - KUHN PARTS BRASIL
 * ═══════════════════════════════════════════════════════════
 * 
 * Funcionalidades:
 * ✅ Timeline dinâmica com dados reais da API
 * ✅ Auto-refresh em tempo real
 * ✅ Geolocalização com mapa interativo
 * ✅ Interatividade avançada
 * ✅ Notificações push
 * ✅ Histórico de consultas
 * ✅ Compartilhamento e envio por email
 * 
 * @author Sistema Kuhn
 * @version 3.0.0
 */

class RastreamentoEnhanced {
    constructor() {
        this.autoRefreshInterval = null;
        this.autoRefreshTime = 60000; // 1 minuto
        this.currentData = null;
        this.map = null;
        this.markers = [];
        this.historico = this.loadHistorico();
        
        this.init();
    }

    init() {
        console.log('🚀 Inicializando Sistema de Rastreamento Avançado...');
        this.setupEventListeners();
        this.setupNotifications();
        this.loadSavedPreferences();
    }

    setupEventListeners() {
        const btnRastrear = document.getElementById('btnRastrear');
        const inputCodigo = document.getElementById('codigoRastreamento');

        if (btnRastrear) {
            btnRastrear.addEventListener('click', () => this.rastrear());
        }

        if (inputCodigo) {
            inputCodigo.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.rastrear();
                }
            });
        }
    }

    async rastrear() {
        const codigo = document.getElementById('codigoRastreamento')?.value?.trim();
        
        if (!codigo) {
            this.showNotification('Por favor, digite um código de rastreamento.', 'error');
            return;
        }

        this.showLoading(true);
        this.limparResultados();
        this.stopAutoRefresh();

        try {
            const csrfToken = document.querySelector('meta[name=csrf-token]')?.getAttribute('content') || 
                             document.querySelector('input[name=csrf_token]')?.value;
            
            const headers = {
                'Content-Type': 'application/json',
            };
            
            if (csrfToken) {
                headers['X-CSRFToken'] = csrfToken;
            }

            const response = await fetch('/rastreamento/api/track', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ codigo: codigo })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentData = data;
                this.saveToHistorico(codigo, data);
                this.mostrarResultado(data);
                this.startAutoRefresh(codigo);
                this.showNotification('✅ Rastreamento realizado com sucesso!', 'success');
            } else {
                this.showNotification(data.error || 'Erro ao rastrear encomenda.', 'error');
            }

        } catch (error) {
            console.error('Erro na requisição:', error);
            this.showNotification('Erro de conexão. Verifique sua internet.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    mostrarResultado(data) {
        const resultadoDiv = document.getElementById('resultadoRastreamento');
        if (!resultadoDiv) return;

        // 🔧 LIMPAR NF MÚLTIPLAS (formato: 208132;000208126;000208127)
        if (data.nf && typeof data.nf === 'string' && data.nf.includes(';')) {
            const nfs = data.nf.split(';');
            console.log(`⚠️ Múltiplas NFs detectadas: ${data.nf}`);
            // Pegar a primeira NF ou a NF que o usuário digitou
            const nfDigitada = document.getElementById('codigo')?.value.trim();
            const nfMatch = nfs.find(nf => nf.trim() === nfDigitada || nf.trim().includes(nfDigitada));
            data.nf = nfMatch ? nfMatch.trim() : nfs[0].trim();
            console.log(`✅ NF selecionada: ${data.nf}`);
        }

        // 🎉 CRIAR CELEBRAÇÃO
        this.criarCelebracao();
        
        // Construir HTML do resultado com dados REAIS
        let html = this.buildResultHTML(data);

        resultadoDiv.innerHTML = html;
        resultadoDiv.classList.remove('hidden');
        
        // Inicializar mapa se houver dados de localização
        setTimeout(() => {
            this.initMap(data);
        }, 1000);
        
        // Adicionar event listeners para interatividade
        this.setupResultInteractions();
    }

    buildResultHTML(data) {
        const historico = data.historico || [];
        const hasHistorico = historico.length > 0;
        
        return `
            <!-- 🚀 RESULTADO COM DADOS REAIS DA API -->
            <div class="animate-fade-in-up">
                <!-- Auto-refresh indicator -->
                <div id="autoRefreshIndicator" class="mb-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Atualização automática ativada (a cada ${this.autoRefreshTime / 1000}s)</span>
                    <button onclick="rastreamentoEnhanced.toggleAutoRefresh()" class="ml-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs">
                        Pausar
                    </button>
                </div>

                <!-- Header do resultado -->
                <div class="text-center mb-8">
                    <div class="relative inline-block">
                        <div class="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-bounce-in">
                            <svg class="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                    <h3 class="text-3xl font-black text-gray-800 mb-2">🎉 Encomenda Encontrada!</h3>
                    <p class="text-gray-600 text-lg">Nota Fiscal: <span class="font-bold text-red-600 text-xl">${data.nf}</span></p>
                    <p class="text-xs text-gray-500 mt-2">Última atualização: <span id="lastUpdate">${this.getCurrentTime()}</span></p>
                </div>
                
                <!-- Cards de informações -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    ${this.buildInfoCards(data)}
                </div>
                
                <!-- Timeline DINÂMICA com dados REAIS -->
                ${hasHistorico ? this.buildDynamicTimeline(historico, data) : this.buildNoHistoricoMessage(data)}
                
                <!-- Mapa de geolocalização -->
                <div id="mapContainer" class="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 mb-8">
                    <h4 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            </svg>
                        </div>
                        📍 Localização e Rota
                    </h4>
                    <div id="map" style="height: 400px; border-radius: 12px;" class="bg-gray-100"></div>
                    <p class="text-xs text-gray-500 mt-2">💡 Dica: Clique nos marcadores para ver detalhes</p>
                </div>
                
                <!-- 📊 BARRA DE PROGRESSO E ETA -->
                ${this.buildProgressBar(data)}
                
                <!-- Informações detalhadas -->
                ${this.buildDetailedInfo(data)}
                
                <!-- Botões de ação -->
                ${this.buildActionButtons(data)}
            </div>
        `;
    }

    buildInfoCards(data) {
        return `
            <!-- Card Nota Fiscal -->
            <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover-lift animate-fade-in-up" style="animation-delay: 0.1s">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">NOTA FISCAL</p>
                        <p class="text-xl font-bold text-gray-800">${data.nf}</p>
                    </div>
                </div>
            </div>
            
            <!-- Card Transportadora -->
            <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover-lift animate-fade-in-up" style="animation-delay: 0.2s">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">TRANSPORTADORA</p>
                        <p class="text-xl font-bold text-red-600">${data.transportadora}</p>
                    </div>
                </div>
            </div>
            
            <!-- Card Status -->
            <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover-lift animate-fade-in-up" style="animation-delay: 0.3s">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">STATUS ATUAL</p>
                        <span class="inline-block px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold rounded-full shadow-lg">
                            ${data.status}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    buildDynamicTimeline(historico, data) {
        // Ordenar histórico por data (mais antigo primeiro)
        const sortedHistorico = [...historico].sort((a, b) => {
            const dateA = this.parseDateTime(a.data_hora);
            const dateB = this.parseDateTime(b.data_hora);
            return dateA - dateB;
        });

        const timelineItems = sortedHistorico.map((evento, index) => {
            const isLast = index === sortedHistorico.length - 1;
            const icon = this.getEventIcon(evento, isLast);
            const color = this.getEventColor(evento, isLast);
            const isCompleted = !isLast;
            
            return `
                <div class="timeline-item relative flex items-start gap-4 animate-slide-in-right cursor-pointer hover:bg-gray-50 p-4 rounded-xl transition-all border-l-4 ${isCompleted ? 'border-green-400' : 'border-blue-400'}" 
                     style="animation-delay: ${0.5 + index * 0.1}s"
                     onclick="rastreamentoEnhanced.showEventDetails(${index})">
                    
                    <!-- Ícone do evento com animação -->
                    <div class="relative w-14 h-14 bg-${color}-500 rounded-full flex items-center justify-center shadow-xl flex-shrink-0 z-10 ${isLast ? 'animate-pulse ring-4 ring-blue-300' : ''}" 
                         style="animation-delay: ${0.5 + index * 0.1}s;">
                        ${icon}
                        ${isCompleted ? '<div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg">✓</div>' : ''}
                    </div>
                    
                    <!-- Conteúdo do evento -->
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <p class="font-bold text-gray-800 text-lg">${evento.ocorrencia || 'Evento'}</p>
                            ${isLast ? '<span class="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full font-bold animate-pulse shadow-lg">🔥 ATUAL</span>' : ''}
                            ${isCompleted ? '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">✓ CONCLUÍDO</span>' : ''}
                        </div>
                        <p class="text-sm text-gray-600 flex items-center gap-2 mb-1">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <strong>Data:</strong> ${evento.data_hora || 'Data não disponível'}
                        </p>
                        <p class="text-sm text-gray-500 flex items-center gap-2">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            </svg>
                            <strong>Local:</strong> ${evento.cidade || evento.filial || 'Local não disponível'}
                        </p>
                        ${evento.descricao ? `<p class="text-xs text-gray-400 mt-3 pl-4 border-l-2 border-gray-200 italic">"${evento.descricao}"</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 mb-8 animate-fade-in-up" style="animation-delay: 0.4s">
                <h4 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    ⏱️ Timeline Dinâmica (${sortedHistorico.length} eventos reais)
                </h4>
                
                <div class="relative">
                    <!-- Linha de progresso -->
                    <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 via-blue-400 to-purple-400"></div>
                    
                    <!-- Eventos do histórico REAL -->
                    <div class="space-y-4">
                        ${timelineItems}
                    </div>
                </div>
                
                <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p class="text-sm text-blue-800">
                        💡 <strong>Dica:</strong> Clique em qualquer evento para ver mais detalhes. Os dados são atualizados automaticamente.
                    </p>
                </div>
            </div>
        `;
    }

    buildNoHistoricoMessage(data) {
        return `
            <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 mb-8">
                <div class="flex items-center gap-4">
                    <svg class="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <div>
                        <p class="font-bold text-yellow-800 text-lg">Histórico Não Disponível</p>
                        <p class="text-yellow-700">A API da transportadora não retornou histórico detalhado. Mostrando apenas o status atual.</p>
                        <p class="text-sm text-yellow-600 mt-2">Status: <strong>${data.status}</strong></p>
                        <p class="text-sm text-yellow-600">Descrição: ${data.descricao || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;
    }

    buildProgressBar(data) {
        const historico = data.historico || [];
        const status = (data.status || '').toLowerCase();
        const descricao = (data.descricao || '').toLowerCase();
        
        // 🎯 LÓGICA CORRIGIDA: Verificar se foi entregue
        let progresso = 0;
        let tempoRestante = 'Calculando...';
        let etaText = data.previsao || 'Calculando...';
        let isEntregue = false;
        
        // Verificar se está entregue (múltiplas variações)
        if (status.includes('entregue') || status.includes('entrega realizada') ||
            status.includes('entrega finalizada') || status.includes('finalizada') ||
            descricao.includes('entregue') || descricao.includes('entrega realizada') ||
            descricao.includes('mercadoria entregue') || descricao.includes('entrega finalizada') ||
            descricao.includes('recebedor')) {
            progresso = 100;
            tempoRestante = '✅ Entregue';
            etaText = '✅ Mercadoria Entregue';
            isEntregue = true;
            console.log('✅ Mercadoria ENTREGUE - Progresso: 100%');
        } else {
            // Se não foi entregue, calcular baseado na data de previsão
            const previsao = data.previsao || '';
            
            if (previsao) {
                const previsaoDate = this.parsePrevisaoDate(previsao);
                if (previsaoDate) {
                    const agora = new Date();
                    const diff = previsaoDate - agora;
                    
                    if (diff > 0) {
                        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        tempoRestante = `${dias}d ${horas}h`;
                        
                        // Calcular progresso baseado no tempo decorrido
                        // Assumindo que cada evento representa um checkpoint
                        const totalEventos = historico.length;
                        progresso = Math.min(Math.round((totalEventos / (totalEventos + 2)) * 100), 95);
                        
                        console.log(`🚚 Em trânsito - Progresso: ${progresso}%`);
                    } else {
                        tempoRestante = '⚠️ Em atraso';
                        progresso = 95; // Quase 100%, mas ainda não entregue
                    }
                }
            } else {
                // Se não tem previsão, usar eventos como base
                const totalEventos = historico.length;
                progresso = Math.min(Math.round((totalEventos / (totalEventos + 2)) * 100), 90);
            }
        }
        
        return `
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl shadow-lg mb-6 animate-slide-in-up">
                <h4 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Progresso da Entrega
                </h4>
                
                <!-- Barra de Progresso -->
                <div class="mb-4">
                    <div class="flex justify-between text-sm mb-2">
                        <span class="font-semibold text-gray-700">Andamento:</span>
                        <span class="font-bold text-blue-600">${progresso}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                        <div class="h-full ${isEntregue ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'} rounded-full flex items-center justify-end pr-2 transition-all duration-1000 animate-progress" 
                             style="width: ${progresso}%;">
                            <span class="text-white text-xs font-bold">${progresso > 10 ? progresso + '%' : ''}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Informações de Tempo -->
                <div class="grid grid-cols-2 gap-4 mt-4">
                    <div class="bg-white p-4 rounded-lg shadow-sm">
                        <div class="flex items-center gap-2 mb-1">
                            <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="text-xs text-gray-600 font-medium">Tempo Restante</span>
                        </div>
                        <p class="text-xl font-bold text-gray-800">${tempoRestante}</p>
                    </div>
                    
                    <div class="bg-white p-4 rounded-lg shadow-sm">
                        <div class="flex items-center gap-2 mb-1">
                            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span class="text-xs text-gray-600 font-medium">Previsão de Chegada</span>
                        </div>
                        <p class="text-sm font-bold text-gray-800">${etaText}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    parsePrevisaoDate(previsao) {
        // Tentar parsear data no formato DD/MM/YYYY
        const match = previsao.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
            return new Date(match[3], parseInt(match[2]) - 1, match[1]);
        }
        return null;
    }

    buildDetailedInfo(data) {
        return `
            <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 mb-8 animate-fade-in-up" style="animation-delay: 0.9s">
                <h4 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    📋 Informações Detalhadas
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">DESTINO</p>
                        <p class="text-lg font-bold text-gray-800">${data.cidade_destino || 'N/A'} ${data.uf_destino ? '- ' + data.uf_destino : ''}</p>
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">PREVISÃO DE ENTREGA</p>
                        <p class="text-lg font-bold text-gray-800">${data.previsao || 'Não informado'}</p>
                    </div>
                </div>
                
                <div class="mt-6">
                    <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">DESCRIÇÃO</p>
                    <p class="text-gray-700 leading-relaxed">${data.descricao || 'Sem descrição adicional'}</p>
                </div>
            </div>
        `;
    }

    buildActionButtons(data) {
        return `
            <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style="animation-delay: 1s">
                <button onclick="rastreamentoEnhanced.novaConsulta()" 
                        class="group relative px-8 py-4 bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-xl">
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        Nova Consulta
                    </div>
                </button>
                
                <button onclick="rastreamentoEnhanced.compartilharResultado()" 
                        class="group relative px-8 py-4 bg-gradient-to-br from-green-500 to-green-700 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-xl">
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                        </svg>
                        Compartilhar
                    </div>
                </button>
                
                <button onclick="rastreamentoEnhanced.enviarPorEmail()" 
                        class="group relative px-8 py-4 bg-gradient-to-br from-purple-500 to-purple-700 text-white font-bold rounded-xl hover:from-purple-600 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 shadow-xl">
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        Enviar por Email
                    </div>
                </button>
                
                <button onclick="rastreamentoEnhanced.mostrarHistoricoConsultas()" 
                        class="group relative px-8 py-4 bg-gradient-to-br from-purple-500 to-purple-700 text-white font-bold rounded-xl hover:from-purple-600 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 shadow-xl">
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Histórico (${this.historico.length})
                    </div>
                </button>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════
    // FUNÇÕES AUXILIARES
    // ═══════════════════════════════════════════════════════════

    getEventIcon(evento, isLast) {
        const descricao = (evento.descricao || evento.ocorrencia || '').toLowerCase();
        const ocorrencia = (evento.ocorrencia || '').toLowerCase();
        
        // 📄 DOCUMENTO EMITIDO
        if (descricao.includes('documento') || descricao.includes('ct-e') || 
            ocorrencia.includes('documento') || ocorrencia.includes('emitido')) {
            return '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"></path></svg>';
        }
        // 🚚 SAÍDA DE UNIDADE / EM TRÂNSITO
        else if (descricao.includes('saida') || descricao.includes('saída') || 
                 descricao.includes('trânsito') || descricao.includes('transito') ||
                 ocorrencia.includes('saida') || ocorrencia.includes('transito')) {
            return '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5M19.5,9.5L18,9H17V6A2,2 0 0,0 15,4H5A2,2 0 0,0 3,6V9H2L1,9.5V11H2V16A2,2 0 0,0 4,18H5A2,2 0 0,0 7,16V11H17V16A2,2 0 0,0 19,18H20A2,2 0 0,0 22,16V11H23V9.5M6,6H14V9H6M6,11H14V16H6M16,11H18V16H16"></path></svg>';
        }
        // 🏢 CHEGADA EM UNIDADE
        else if (descricao.includes('chegada') || ocorrencia.includes('chegada')) {
            return '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12,3L2,12H5V20H19V12H22L12,3M12,8.75A2.25,2.25 0 0,1 14.25,11A2.25,2.25 0 0,1 12,13.25A2.25,2.25 0 0,1 9.75,11A2.25,2.25 0 0,1 12,8.75M12,15C13.5,15 16.5,15.75 16.5,17.25V18H7.5V17.25C7.5,15.75 10.5,15 12,15Z"></path></svg>';
        }
        // ✅ ENTREGA REALIZADA
        else if (descricao.includes('entregue') || descricao.includes('entrega realizada') ||
                 ocorrencia.includes('entregue') || ocorrencia.includes('mercadoria entregue')) {
            return '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"></path></svg>';
        }
        // 📦 COLETA / PICKUP
        else if (descricao.includes('coleta') || descricao.includes('pickup') ||
                 ocorrencia.includes('coleta') || ocorrencia.includes('pickup')) {
            return '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19,7H16V6A2,2 0 0,0 14,4H10A2,2 0 0,0 8,6V7H5A1,1 0 0,0 4,8V19A3,3 0 0,0 7,22H17A3,3 0 0,0 20,19V8A1,1 0 0,0 19,7M10,6H14V7H10V6M18,19A1,1 0 0,1 17,20H7A1,1 0 0,1 6,19V9H18V19Z"></path></svg>';
        }
        // 🔄 PROCESSAMENTO / CONFERÊNCIA
        else if (descricao.includes('conferencia') || descricao.includes('processamento') ||
                 descricao.includes('fiscal') || ocorrencia.includes('conferencia')) {
            return '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"></path></svg>';
        }
        // 📍 EVENTO GENÉRICO
        else {
            return '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A8,8 0 0,0 4,10C4,16 12,22 12,22S20,16 20,10A8,8 0 0,0 12,2M12,12A2,2 0 0,1 10,10A2,2 0 0,1 12,8A2,2 0 0,1 14,10A2,2 0 0,1 12,12Z"></path></svg>';
        }
    }

    getEventColor(evento, isLast) {
        const descricao = (evento.descricao || evento.ocorrencia || '').toLowerCase();
        const ocorrencia = (evento.ocorrencia || '').toLowerCase();
        
        // ✅ ENTREGA REALIZADA - Verde vibrante
        if (descricao.includes('entregue') || descricao.includes('entrega realizada') ||
            ocorrencia.includes('entregue') || ocorrencia.includes('mercadoria entregue')) {
            return 'emerald';
        }
        // 🚚 SAÍDA / TRÂNSITO - Azul dinâmico
        else if (descricao.includes('saida') || descricao.includes('saída') || 
                 descricao.includes('trânsito') || descricao.includes('transito') ||
                 ocorrencia.includes('saida') || ocorrencia.includes('transito')) {
            return 'blue';
        }
        // 🏢 CHEGADA EM UNIDADE - Laranja quente
        else if (descricao.includes('chegada') || ocorrencia.includes('chegada')) {
            return 'orange';
        }
        // 📄 DOCUMENTO EMITIDO - Roxo elegante
        else if (descricao.includes('documento') || descricao.includes('ct-e') ||
                 ocorrencia.includes('documento') || ocorrencia.includes('emitido')) {
            return 'purple';
        }
        // 📦 COLETA - Índigo profissional
        else if (descricao.includes('coleta') || descricao.includes('pickup') ||
                 ocorrencia.includes('coleta') || ocorrencia.includes('pickup')) {
            return 'indigo';
        }
        // 🔄 PROCESSAMENTO - Ciano moderno
        else if (descricao.includes('conferencia') || descricao.includes('processamento') ||
                 descricao.includes('fiscal') || ocorrencia.includes('conferencia')) {
            return 'cyan';
        }
        // 📍 EVENTO GENÉRICO - Cinza neutro
        else {
            return 'gray';
        }
    }

    parseDateTime(dateString) {
        if (!dateString) return new Date(0);
        
        // Tenta vários formatos
        const formats = [
            /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,  // 2025-01-20 14:30:00
            /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/,          // 2025-01-20 14:30
            /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/,        // 20/01/2025 14:30
            /(\d{2})\/(\d{2})\/(\d{4})/,                          // 20/01/2025
        ];

        for (let format of formats) {
            const match = dateString.match(format);
            if (match) {
                if (format.source.includes('\\d{4}') && format.source.indexOf('\\d{4}') === 1) {
                    // Formato YYYY-MM-DD
                    return new Date(match[1], parseInt(match[2]) - 1, match[3], match[4] || 0, match[5] || 0, match[6] || 0);
                } else {
                    // Formato DD/MM/YYYY
                    return new Date(match[3], parseInt(match[2]) - 1, match[1], match[4] || 0, match[5] || 0);
                }
            }
        }

        return new Date(dateString);
    }

    getCurrentTime() {
        return new Date().toLocaleString('pt-BR');
    }

    // ═══════════════════════════════════════════════════════════
    // AUTO-REFRESH EM TEMPO REAL
    // ═══════════════════════════════════════════════════════════

    startAutoRefresh(codigo) {
        this.stopAutoRefresh();
        
        console.log(`🔄 Auto-refresh ativado para NF: ${codigo}`);
        
        this.autoRefreshInterval = setInterval(async () => {
            console.log('🔄 Atualizando dados...', new Date().toLocaleString());
            
            try {
                const csrfToken = document.querySelector('meta[name=csrf-token]')?.getAttribute('content') || 
                                 document.querySelector('input[name=csrf_token]')?.value;
                
                const headers = {'Content-Type': 'application/json'};
                if (csrfToken) headers['X-CSRFToken'] = csrfToken;

                const response = await fetch('/rastreamento/api/track', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ codigo: codigo })
                });

                if (response.ok) {
                    const newData = await response.json();
                    
                    // Verificar se houve mudanças
                    if (JSON.stringify(newData) !== JSON.stringify(this.currentData)) {
                        console.log('✅ Novos dados detectados!');
                        this.currentData = newData;
                        this.mostrarResultado(newData);
                        this.showNotification('🔔 Dados atualizados!', 'info');
                    } else {
                        console.log('ℹ️ Nenhuma alteração detectada');
                    }
                    
                    // Atualizar timestamp
                    const lastUpdateEl = document.getElementById('lastUpdate');
                    if (lastUpdateEl) {
                        lastUpdateEl.textContent = this.getCurrentTime();
                    }
                }
            } catch (error) {
                console.error('Erro no auto-refresh:', error);
            }
        }, this.autoRefreshTime);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            console.log('⏸️ Auto-refresh pausado');
        }
    }

    toggleAutoRefresh() {
        if (this.autoRefreshInterval) {
            this.stopAutoRefresh();
            this.showNotification('⏸️ Auto-refresh pausado', 'info');
            const indicator = document.getElementById('autoRefreshIndicator');
            if (indicator) {
                indicator.innerHTML = `
                    <div class="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span>Atualização automática desativada</span>
                    <button onclick="rastreamentoEnhanced.startAutoRefresh('${this.currentData.nf}')" class="ml-2 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs">
                        Reativar
                    </button>
                `;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // GEOLOCALIZAÇÃO E MAPA
    // ═══════════════════════════════════════════════════════════

    async initMap(data) {
        const mapDiv = document.getElementById('map');
        if (!mapDiv) return;

        // 🔧 LIMPAR MAPA ANTERIOR SE EXISTIR
        if (this.map) {
            console.log('🗑️ Removendo mapa anterior...');
            this.map.remove();
            this.map = null;
            this.markers = [];
        }

        // Verificar se Leaflet está disponível
        if (typeof L === 'undefined') {
            await this.loadLeaflet();
        }

        try {
            console.log('🗺️ Criando novo mapa...');
            // Criar mapa centrado no Brasil
            this.map = L.map('map').setView([-15.7801, -47.9292], 4);

            // Adicionar tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            // Adicionar marcadores baseados no histórico
            await this.addMarkers(data);

        } catch (error) {
            console.error('Erro ao inicializar mapa:', error);
            mapDiv.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-100 rounded-lg"><p class="text-gray-600">Mapa não disponível no momento</p></div>';
        }
    }

    async loadLeaflet() {
        return new Promise((resolve, reject) => {
            console.log('🗺️ Carregando Leaflet...');
            
            // Carregar CSS usando CDN permitido
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
            link.onerror = () => {
                console.warn('⚠️ Erro ao carregar CSS do Leaflet, continuando sem estilos');
            };
            document.head.appendChild(link);

            // Carregar JS usando CDN permitido
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                console.log('✅ Leaflet carregado com sucesso!');
                resolve();
            };
            script.onerror = (error) => {
                console.error('❌ Erro ao carregar Leaflet:', error);
                reject(error);
            };
            document.head.appendChild(script);
        });
    }

    async addMarkers(data) {
        const historico = data.historico || [];
        const cidadesAdicionadas = new Set(); // Evitar duplicatas
        
        console.log('📍 Adicionando marcadores na ordem cronológica...');
        
        // Primeiro: adicionar marcadores dos eventos históricos em ordem cronológica
        for (let i = 0; i < historico.length; i++) {
            const evento = historico[i];
            let cidade = evento.cidade || evento.filial;
            
            // 🔍 SEMPRE TENTAR EXTRAIR CIDADE DA DESCRIÇÃO
            const cidadeExtraida = this.extractCidadeFromDescricao(evento.descricao || '');
            if (cidadeExtraida) {
                console.log(`🔍 Cidade extraída da descrição: ${cidadeExtraida}`);
                cidade = cidadeExtraida;
            } else if (!cidade || cidade === 'Local não disponível') {
                console.warn(`⚠️ Nenhuma cidade encontrada para evento ${i}`);
                continue; // Pula este evento se não tem cidade
            }
            
            if (cidade && !cidadesAdicionadas.has(cidade.toUpperCase())) {
                try {
                    const coords = await this.geocodeCidade(cidade);
                    if (coords) {
                        const icon = this.getMarkerIcon(evento, i === historico.length - 1);
                        const marker = L.marker(coords, { icon: icon }).addTo(this.map);
                        
                        marker.bindPopup(`
                            <div class="p-2">
                                <h3 class="font-bold">${evento.ocorrencia || 'Evento'}</h3>
                                <p class="text-sm">${evento.data_hora || ''}</p>
                                <p class="text-sm">${cidade}</p>
                                <p class="text-xs text-gray-600">${evento.descricao || ''}</p>
                            </div>
                        `);
                        
                        this.markers.push(marker);
                        cidadesAdicionadas.add(cidade.toUpperCase());
                        console.log(`✅ Marcador adicionado: ${cidade}`);
                    }
                } catch (error) {
                    console.error(`Erro ao geocodificar ${cidade}:`, error);
                }
            }
            
            // Verificar se há destino mencionado na descrição
            const descricao = evento.descricao || '';
            const destinoMatch = descricao.match(/chegada na unidade (\w+)/i) || 
                                descricao.match(/destino: ([^,]+)/i) ||
                                descricao.match(/para ([^,]+)/i);
            
            if (destinoMatch) {
                const destino = destinoMatch[1].trim().toUpperCase();
                if (!cidadesAdicionadas.has(destino)) {
                    try {
                        const coordsDestino = await this.geocodeCidade(destino);
                        if (coordsDestino) {
                            // Marcador especial para destino
                            const destinoIcon = L.divIcon({
                                className: 'custom-marker destino',
                                html: '<div style="background: #EF4444; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🎯</div>',
                                iconSize: [40, 40],
                                iconAnchor: [20, 20]
                            });
                            
                            const destinoMarker = L.marker(coordsDestino, { icon: destinoIcon }).addTo(this.map);
                            destinoMarker.bindPopup(`
                                <div class="p-2">
                                    <h3 class="font-bold text-red-600">🎯 Destino Final</h3>
                                    <p class="text-sm">${destino}</p>
                                    <p class="text-xs text-gray-600">Previsão de chegada</p>
                                </div>
                            `);
                            
                            this.markers.push(destinoMarker);
                            cidadesAdicionadas.add(destino);
                        }
                    } catch (error) {
                        console.error(`Erro ao geocodificar destino ${destino}:`, error);
                    }
                }
            }
        }

        // Adicionar marcador de DESTINO FINAL se existir e for diferente do último evento
        await this.addDestinoFinal(data, cidadesAdicionadas);
        
        // Desenhar rota entre os marcadores (passar data para detectar status)
        this.drawRoute(data);
        
        // Ajustar zoom para mostrar todos os marcadores
        if (this.markers.length > 0) {
            const group = L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    async addDestinoFinal(data, cidadesAdicionadas) {
        // Verificar se tem destino nas informações detalhadas
        const destinoCidade = (data.cidade_destino || '').trim().toUpperCase();
        const destinoUF = (data.uf_destino || '').trim().toUpperCase();
        
        if (!destinoCidade) {
            console.log('📍 Sem destino final nas informações');
            return;
        }
        
        // Verificar se o destino já foi adicionado (evitar duplicata)
        if (cidadesAdicionadas.has(destinoCidade)) {
            console.log(`✅ Destino "${destinoCidade}" já está no mapa como evento`);
            return;
        }
        
        console.log(`🎯 Adicionando DESTINO FINAL: ${destinoCidade}${destinoUF ? ' - ' + destinoUF : ''}`);
        
        try {
            const coords = await this.geocodeCidade(destinoCidade);
            if (coords) {
                // Criar marcador ESPECIAL para destino final (vermelho com alvo)
                const destinoIcon = L.divIcon({
                    className: 'custom-marker destino-final',
                    html: `
                        <div style="background: #EF4444; color: white; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 4px solid white; box-shadow: 0 4px 12px rgba(239,68,68,0.5); animation: pulse-ring 2s infinite;">
                            <div style="font-size: 24px;">🎯</div>
                        </div>
                    `,
                    iconSize: [45, 45],
                    iconAnchor: [22, 22]
                });
                
                const destinoMarker = L.marker(coords, { icon: destinoIcon }).addTo(this.map);
                
                destinoMarker.bindPopup(`
                    <div class="p-4 text-center">
                        <h3 class="font-bold text-red-600 text-xl mb-2">🎯 DESTINO FINAL</h3>
                        <p class="text-lg font-semibold text-gray-800">${destinoCidade}</p>
                        <p class="text-sm text-gray-600">${destinoUF || ''}</p>
                        <div class="mt-3 text-xs bg-red-50 p-2 rounded border border-red-200">
                            <strong>Status:</strong> Aguardando chegada
                        </div>
                        <div class="mt-2 text-xs text-gray-500">
                            Previsão: ${data.previsao || 'Calculando...'}
                        </div>
                    </div>
                `);
                
                // IMPORTANTE: Marcar como destino final (não conectar com linha verde)
                destinoMarker._isDestinoFinal = true;
                
                this.markers.push(destinoMarker);
                cidadesAdicionadas.add(destinoCidade);
                
                console.log(`✅ Destino final adicionado: ${destinoCidade} (sem linha até lá)`);
            }
        } catch (error) {
            console.error(`❌ Erro ao adicionar destino final ${destinoCidade}:`, error);
        }
    }

    drawRoute(data) {
        if (!this.map || this.markers.length < 2) return;
        
        try {
            console.log('🗺️ Desenhando rotas sequenciais...');
            console.log('📍 Total de marcadores:', this.markers.length);
            
            // NÃO REORDENAR! Manter ordem de inserção (cronológica)
            // Os marcadores já foram adicionados na ordem correta
            
            // Desenhar linhas APENAS entre marcadores sequenciais
            for (let i = 0; i < this.markers.length - 1; i++) {
                const startMarker = this.markers[i];
                const endMarker = this.markers[i + 1];
                
                // NÃO desenhar linha SE o próximo marcador for destino final não alcançado
                if (endMarker._isDestinoFinal && i === this.markers.length - 2) {
                    console.log(`🎯 Pulando linha para destino final (ainda não alcançado)`);
                    
                    // Mas desenhar linha tracejada indicativa do trajeto futuro
                    const startCoords = startMarker.getLatLng();
                    const endCoords = endMarker.getLatLng();
                    
                    const futureLine = L.polyline([startCoords, endCoords], {
                        color: '#3B82F6',
                        weight: 5,
                        opacity: 1,
                        dashArray: '15, 10'
                    }).addTo(this.map);
                    
                    this.addSingleArrow(startCoords, endCoords, '#3B82F6');
                    console.log('🚚 Adicionando caminhão animado...');
                    this.addAnimatedTruck(startCoords, endCoords, data);
                    continue;
                }
                
                const startCoords = startMarker.getLatLng();
                const endCoords = endMarker.getLatLng();
                
                // Último segmento = trajeto atual
                const isCurrentSegment = (i === this.markers.length - 2);
                
                console.log(`Linha ${i + 1}:`, 
                    `[${startCoords.lat.toFixed(2)}, ${startCoords.lng.toFixed(2)}]`, 
                    '→', 
                    `[${endCoords.lat.toFixed(2)}, ${endCoords.lng.toFixed(2)}]`,
                    isCurrentSegment ? '(ATUAL)' : '(COMPLETADA)');
                
                if (isCurrentSegment) {
                    // LINHA ATUAL (em progresso) - AZUL tracejado
                    const currentLine = L.polyline([startCoords, endCoords], {
                        color: '#3B82F6',
                        weight: 5,
                        opacity: 1,
                        dashArray: '15, 10'
                    }).addTo(this.map);
                    
                    this.addSingleArrow(startCoords, endCoords, '#3B82F6');
                    console.log('🚚 Adicionando caminhão animado...');
                    this.addAnimatedTruck(startCoords, endCoords, data);
                } else {
                    // LINHA COMPLETADA (já passou) - VERDE sólida
                    const completedLine = L.polyline([startCoords, endCoords], {
                        color: '#10B981',
                        weight: 4,
                        opacity: 0.7,
                        dashArray: ''
                    }).addTo(this.map);
                    
                    this.addSingleArrow(startCoords, endCoords, '#10B981');
                }
            }
            
            console.log('✅ Rotas desenhadas!');
            
        } catch (error) {
            console.error('Erro ao desenhar rota:', error);
        }
    }

    addAnimatedTruck(startCoords, endCoords, data) {
        const status = (data.status || '').toLowerCase();
        const descricao = (data.descricao || '').toLowerCase();
        
        // Verificar se foi entregue
        const isEntregue = status.includes('entregue') || status.includes('entrega finalizada') ||
                          descricao.includes('entregue') || descricao.includes('recebedor');
        
        // Se entregue, caminhão fica no destino (100%), senão no meio (40%)
        const progress = isEntregue ? 1.0 : 0.4;
        
        // Calcular ângulo do caminhão
        const angle = Math.atan2(endCoords.lng - startCoords.lng, endCoords.lat - startCoords.lat) * 180 / Math.PI;
        
        // Posição do caminhão baseada no status
        const truckLat = startCoords.lat + (endCoords.lat - startCoords.lat) * progress;
        const truckLng = startCoords.lng + (endCoords.lng - startCoords.lng) * progress;
        
        // Ícone e cor baseado no status
        const truckEmoji = isEntregue ? '📦' : '🚚';
        const truckAnimation = isEntregue ? '' : 'animation: truck-bounce 2s infinite;';
        const statusColor = isEntregue ? 'green' : 'blue';
        const statusText = isEntregue ? '✅ Entregue' : '🚚 Em Trânsito';
        const statusMessage = isEntregue ? 'Mercadoria entregue no destino' : 'Mercadoria a caminho do destino';
        
        console.log(`${isEntregue ? '✅' : '🚚'} Caminhão posicionado em ${Math.round(progress * 100)}% do trajeto`);
        
        // Criar ícone de caminhão
        const truckIcon = L.divIcon({
            className: 'animated-truck',
            html: `
                <div style="transform: rotate(${angle}deg); ${truckAnimation}">
                    <div style="font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                        ${truckEmoji}
                    </div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        
        const truckMarker = L.marker([truckLat, truckLng], { 
            icon: truckIcon,
            zIndexOffset: 1000 
        }).addTo(this.map);
        
        truckMarker.bindPopup(`
            <div class="p-3 text-center">
                <h3 class="font-bold text-${statusColor}-600 text-lg">${statusText}</h3>
                <p class="text-sm text-gray-600 mt-2">${statusMessage}</p>
                <div class="mt-2 text-xs bg-${statusColor}-50 p-2 rounded">
                    <strong>Status:</strong> ${isEntregue ? 'Entrega concluída' : 'Em rota'}
                </div>
            </div>
        `);
    }

    addSingleArrow(startCoords, endCoords, color = '#3B82F6') {
        // Calcular ângulo da seta
        const angle = Math.atan2(endCoords.lng - startCoords.lng, endCoords.lat - startCoords.lat) * 180 / Math.PI;
        
        // Posicionar seta no meio do segmento
        const midLat = (startCoords.lat + endCoords.lat) / 2;
        const midLng = (startCoords.lng + endCoords.lng) / 2;
        
        // Criar ícone de seta com cor personalizada
        const arrowIcon = L.divIcon({
            className: 'route-arrow',
            html: `<div style="transform: rotate(${angle}deg); color: ${color}; font-size: 24px; font-weight: bold; text-shadow: 0 0 3px white;">→</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        L.marker([midLat, midLng], { icon: arrowIcon }).addTo(this.map);
    }

    addRouteArrows(coords) {
        if (coords.length < 2) return;
        
        for (let i = 0; i < coords.length - 1; i++) {
            const start = coords[i];
            const end = coords[i + 1];
            
            // Calcular ângulo da seta
            const angle = Math.atan2(end.lng - start.lng, end.lat - start.lat) * 180 / Math.PI;
            
            // Criar ícone de seta
            const arrowIcon = L.divIcon({
                className: 'route-arrow',
                html: `<div style="transform: rotate(${angle}deg); color: #3B82F6; font-size: 20px;">→</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            // Posicionar seta no meio do segmento
            const midLat = (start.lat + end.lat) / 2;
            const midLng = (start.lng + end.lng) / 2;
            
            L.marker([midLat, midLng], { icon: arrowIcon }).addTo(this.map);
        }
    }

    extractCidadeFromDescricao(descricao) {
        if (!descricao) return null;
        
        console.log(`🔍 Tentando extrair cidade de: "${descricao}"`);
        
        // Padrões para extrair cidades (ordem importa - mais específico primeiro)
        const padroes = [
            // Rodonaves específicos - DESTINO
            /(?:unidade )?destino\s+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i,  // "unidade destino CUIABA"
            /desembarcada (?:na |em )?(?:unidade )?(?:de )?(?:destino )?([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i, // "desembarcada na unidade destino cuiaba"
            /mercadoria (?:desembarcada|recebida) (?:na |em )?(?:unidade )?(?:de )?(?:destino )?([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i,
            
            // Rodonaves - distribuição, trânsito e transferência  
            /saída para entrega (?:na |em )?(?:cidade de )?([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i, // "Saída para entrega na cidade de PRIMAVERA DO LESTE"
            /entrega (?:na |em )?(?:cidade de )?([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i, // "entrega na cidade de primavera do leste"
            /distribuição de ([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i,  // "distribuição de rio verde"
            /transferência de ([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i, // "transferência de ribeirão preto"
            /trânsito para (?:a unidade de )?(?:distribuição de )?(?:transferência de )?([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i, // "em trânsito para rio verde"
            /chegada em ([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i,       // "chegada em rio verde"
            /para (?:a |o )?unidade (?:de )?(?:distribuição )?(?:transferência )?(?:de )?([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i, // "para a unidade de transferência de ribeirão preto"
            
            // Carvalima específicos
            /na unidade de ([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i,    // "na unidade de sao jose"
            /transportadora na unidade de ([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i,
            /(?:cidade|local|destino):\s*([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i,
            
            // Genéricos
            /unidade (?:de )?([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s*[-,.]|$)/i,  // "unidade rio verde"
        ];
        
        for (const padrao of padroes) {
            const match = descricao.match(padrao);
            if (match && match[1]) {
                // Limpar o resultado
                let cidade = match[1].trim();
                
                // Remover sufixos de estado
                cidade = cidade.replace(/\s*[-\/]\s*[a-z]{2}$/i, '');  // Remove "-go", "/sp", etc
                cidade = cidade.replace(/\s+(mg|sp|pr|mt|ms|rj|go|to|ba|pe|ce|rs|sc|pa|am|ro|ac|rr|ap|ma|pi|al|se|pb|rn|es|df)$/i, '');
                
                // Remover palavras extras
                cidade = cidade.replace(/\s+com\s+previsão.*$/i, '');
                cidade = cidade.replace(/\s+em\s+\d{2}\/\d{2}.*$/i, '');
                
                // Limpar espaços
                cidade = cidade.trim();
                
                // Validar se é uma cidade válida (pelo menos 3 caracteres)
                if (cidade.length >= 3) {
                    console.log(`✅ Cidade extraída: "${cidade}" do padrão: ${padrao}`);
                    return cidade;
                }
            }
        }
        
        console.warn(`⚠️ Não foi possível extrair cidade de: "${descricao}"`);
        return null;
    }

    async geocodeCidade(cidade) {
        const cidadeUpper = cidade.toUpperCase().trim();
        
        console.log(`🔍 Buscando coordenadas para: ${cidade}`);
        
        // Tentar geocoding via API PRIMEIRO (dinâmico)
        try {
            console.log(`🌐 Consultando API OpenStreetMap...`);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cidade)},Brasil&format=json&limit=1`, {
                headers: {
                    'User-Agent': 'KuhnParts-Tracking/1.0'
                }
            });
            const data = await response.json();
            
            if (data && data.length > 0) {
                const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                console.log(`✅ Coordenadas encontradas via API:`, coords, `(${data[0].display_name})`);
                return coords;
            }
        } catch (error) {
            console.warn('⚠️ Erro na API, usando cache local:', error);
        }

        // Cache como FALLBACK (backup)
        console.log(`📦 Buscando no cache local...`);
        const cidades = {
            'CHAPADAO DO SUL': [-18.7906, -52.6111],
            'CAMPO GRANDE': [-20.4697, -54.6201],
            'RONDONOPOLIS': [-16.4709, -54.6358],
            'SAO JOSE DOS PINHAIS': [-25.5305, -49.2081],
            'SAO PAULO': [-23.5505, -46.6333],
            'PALMAS': [-10.1689, -48.3317],
            'RIBEIRAO PRETO': [-21.1704, -47.8103], // Ribeirão Preto/SP
            'ALFENAS': [-21.4289, -45.9472], // Alfenas/MG
            'LAVRAS': [-21.2452, -44.9998], // Lavras/MG
            'RIO VERDE': [-17.7948, -50.9181], // Rio Verde/GO
            'GOIANIA': [-16.6869, -49.2648], // Goiânia/GO
            'GOIAS': [-16.6869, -49.2648], // Estado de Goiás
            'CUIABA': [-15.6014, -56.0979], // Cuiabá/MT
            'PRIMAVERA DO LESTE': [-15.5561, -54.2956], // Primavera do Leste/MT
            'ARIQUEMES': [-9.9133, -63.0406], // Ariquemes/RO
            'RONDONIA': [-10.9472, -62.8297], // Estado de Rondônia
            'TOCANTINS': [-10.1689, -48.3317],
            'MATO GROSSO': [-15.601, -56.0974],
            'MINAS GERAIS': [-18.5122, -44.555],
            'RIO DE JANEIRO': [-22.9068, -43.1729],
            'BRASILIA': [-15.7801, -47.9292],
            'CURITIBA': [-25.4244, -49.2654],
            'PARANA': [-25.4244, -49.2654],
            'MATO GROSSO DO SUL': [-20.4697, -54.6201],
            'TANGARA DA SERRA': [-14.6218, -57.4931],
        };
        
        // Buscar correspondência exata
        if (cidades[cidadeUpper]) {
            console.log(`✅ Encontrado no cache:`, cidades[cidadeUpper]);
            return cidades[cidadeUpper];
        }
        
        // Buscar correspondência parcial
        for (const [nomeCidade, coords] of Object.entries(cidades)) {
            if (cidadeUpper.includes(nomeCidade) || nomeCidade.includes(cidadeUpper)) {
                console.log(`✅ Encontrado no cache (parcial):`, coords);
                return coords;
            }
        }

        console.error(`❌ Cidade não encontrada: ${cidade}`);
        return null;
    }

    getMarkerIcon(evento, isLast) {
        const descricao = (evento.descricao || evento.ocorrencia || '').toLowerCase();
        const ocorrencia = (evento.ocorrencia || '').toLowerCase();
        
        console.log('🎯 Criando marcador para:', {
            descricao: descricao,
            ocorrencia: ocorrencia,
            isLast: isLast
        });
        
        // Verificar se é entrega realizada
        if (descricao.includes('entregue') || descricao.includes('entrega realizada') || 
            ocorrencia.includes('entregue') || ocorrencia.includes('mercadoria entregue')) {
            console.log('✅ Marcador: ENTREGA REALIZADA');
            return L.divIcon({
                className: 'custom-marker entregue',
                html: '<div style="background: #10B981; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">✓</div>',
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            });
        } 
        // Verificar se está em trânsito
        else if (descricao.includes('trânsito') || descricao.includes('transito') || 
                 descricao.includes('saida') || descricao.includes('saída') ||
                 ocorrencia.includes('saida') || ocorrencia.includes('transito')) {
            console.log('🚚 Marcador: EM TRÂNSITO');
            return L.divIcon({
                className: 'custom-marker transito',
                html: '<div style="background: #3B82F6; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🚚</div>',
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            });
        } 
        // Verificar se é coleta ou início
        else if (descricao.includes('coleta') || descricao.includes('documento emitido') ||
                 ocorrencia.includes('coleta') || ocorrencia.includes('documento')) {
            console.log('📦 Marcador: DOCUMENTO/COLETA');
            return L.divIcon({
                className: 'custom-marker coleta',
                html: '<div style="background: #8B5CF6; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📦</div>',
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            });
        } 
        // Verificar se é chegada em unidade
        else if (descricao.includes('chegada') || ocorrencia.includes('chegada')) {
            console.log('🏢 Marcador: CHEGADA EM UNIDADE');
            return L.divIcon({
                className: 'custom-marker chegada',
                html: '<div style="background: #F59E0B; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏢</div>',
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            });
        }
        // Marcador padrão
        else {
            console.log('📍 Marcador: PADRÃO');
            return L.divIcon({
                className: 'custom-marker padrao',
                html: '<div style="background: #6B7280; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📍</div>',
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            });
        }
    }

    // ═══════════════════════════════════════════════════════════
    // INTERATIVIDADE
    // ═══════════════════════════════════════════════════════════

    setupResultInteractions() {
        // Event listeners já configurados via onclick no HTML
    }

    showEventDetails(index) {
        if (!this.currentData || !this.currentData.historico) return;
        
        const evento = this.currentData.historico[index];
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in';
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-2xl mx-4 shadow-2xl animate-scale-in">
                <div class="flex justify-between items-start mb-6">
                    <h3 class="text-2xl font-bold text-gray-800">📦 Detalhes do Evento</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm font-semibold text-gray-500 uppercase">Ocorrência</p>
                        <p class="text-lg font-bold text-gray-800">${evento.ocorrencia || 'N/A'}</p>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm font-semibold text-gray-500 uppercase">Data e Hora</p>
                        <p class="text-lg font-bold text-gray-800">${evento.data_hora || 'N/A'}</p>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm font-semibold text-gray-500 uppercase">Localização</p>
                        <p class="text-lg font-bold text-gray-800">${evento.cidade || evento.filial || 'N/A'}</p>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm font-semibold text-gray-500 uppercase">Descrição Completa</p>
                        <p class="text-gray-700 leading-relaxed">${evento.descricao || 'Sem descrição adicional'}</p>
                    </div>
                </div>
                
                <button onclick="this.closest('.fixed').remove()" 
                        class="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    Fechar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // ═══════════════════════════════════════════════════════════
    // HISTÓRICO DE CONSULTAS
    // ═══════════════════════════════════════════════════════════

    loadHistorico() {
        try {
            const stored = localStorage.getItem('rastreamentoHistorico');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    saveToHistorico(codigo, data) {
        const item = {
            codigo: codigo,
            transportadora: data.transportadora,
            status: data.status,
            timestamp: new Date().toISOString(),
            data: data
        };

        // Remover duplicatas
        this.historico = this.historico.filter(h => h.codigo !== codigo);
        
        // Adicionar no início
        this.historico.unshift(item);
        
        // Manter apenas 20 itens
        this.historico = this.historico.slice(0, 20);
        
        // Salvar
        localStorage.setItem('rastreamentoHistorico', JSON.stringify(this.historico));
    }

    mostrarHistoricoConsultas() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        const historicoHTML = this.historico.length > 0 ?
            this.historico.map((item, index) => `
                <div class="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                     onclick="rastreamentoEnhanced.consultarDoHistorico(${index})">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold text-gray-800">NF: ${item.codigo}</p>
                            <p class="text-sm text-gray-600">${item.transportadora}</p>
                            <p class="text-xs text-gray-500">${new Date(item.timestamp).toLocaleString('pt-BR')}</p>
                        </div>
                        <span class="px-2 py-1 text-xs rounded-full ${item.status.includes('Entregue') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                            ${item.status}
                        </span>
                    </div>
                </div>
            `).join('') :
            '<p class="text-center text-gray-500 py-8">Nenhuma consulta anterior</p>';
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-800">📜 Histórico de Consultas</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-3">
                    ${historicoHTML}
                </div>
                
                ${this.historico.length > 0 ? `
                    <button onclick="rastreamentoEnhanced.limparHistorico(); this.closest('.fixed').remove();" 
                            class="mt-6 w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold">
                        🗑️ Limpar Histórico
                    </button>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    consultarDoHistorico(index) {
        const item = this.historico[index];
        if (item) {
            document.querySelector('.fixed').remove(); // Fechar modal
            document.getElementById('codigoRastreamento').value = item.codigo;
            this.rastrear();
        }
    }

    limparHistorico() {
        if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
            this.historico = [];
            localStorage.removeItem('rastreamentoHistorico');
            this.showNotification('🗑️ Histórico limpo!', 'success');
        }
    }

    // ═══════════════════════════════════════════════════════════
    // COMPARTILHAMENTO E EMAIL
    // ═══════════════════════════════════════════════════════════

    compartilharResultado() {
        if (!this.currentData) return;
        
        const texto = `🎉 Rastreamento Kuhn Parts
━━━━━━━━━━━━━━━━━━━━━━━━━
📦 NF: ${this.currentData.nf}
🚚 ${this.currentData.transportadora}
📍 Status: ${this.currentData.status}
🎯 Destino: ${this.currentData.cidade_destino} - ${this.currentData.uf_destino}
📅 Previsão: ${this.currentData.previsao || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━`;

        if (navigator.share) {
            navigator.share({
                title: 'Rastreamento Kuhn Parts',
                text: texto
            }).catch(() => this.copiarTexto(texto));
        } else {
            this.copiarTexto(texto);
        }
    }

    copiarTexto(texto) {
        navigator.clipboard.writeText(texto).then(() => {
            this.showNotification('✅ Copiado para área de transferência!', 'success');
        }).catch(() => {
            this.showNotification('❌ Erro ao copiar', 'error');
        });
    }

    // 📧 ENVIAR POR EMAIL
    enviarPorEmail() {
        if (!this.currentData) return;
        
        console.log('📧 Iniciando envio por email...');
        this.mostrarModalEmail();
    }

    mostrarModalEmail() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-scale-in">
                <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    📧 Enviar Resultado por Email
                </h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            📧 Email do Cliente:
                        </label>
                        <input type="email" id="emailCliente" placeholder="cliente@exemplo.com" 
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            👤 Seu Nome (Remetente):
                        </label>
                        <input type="text" id="nomeRemetente" placeholder="Seu Nome" 
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            📝 Assunto do Email:
                        </label>
                        <input type="text" id="assuntoEmail" value="Rastreamento NF${this.currentData.nf}" 
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" readonly>
                        <p class="text-xs text-gray-500 mt-1">Assunto automático baseado na NF</p>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm font-medium text-gray-700 mb-2">📋 Preview do Email:</p>
                        <div class="text-sm text-gray-600 bg-white p-3 rounded border">
                            <p><strong>Para:</strong> <span id="previewEmail">cliente@exemplo.com</span></p>
                            <p><strong>Assunto:</strong> <span id="previewAssunto">Rastreamento NF${this.currentData.nf}</span></p>
                            <p><strong>De:</strong> <span id="previewRemetente">Seu Nome</span></p>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold">
                        Cancelar
                    </button>
                    <button onclick="rastreamentoEnhanced.prepararEmail()" 
                            class="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                        📧 Preparar Email
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Atualizar preview em tempo real
        const emailInput = modal.querySelector('#emailCliente');
        const nomeInput = modal.querySelector('#nomeRemetente');
        const assuntoInput = modal.querySelector('#assuntoEmail');
        
        emailInput.addEventListener('input', () => {
            modal.querySelector('#previewEmail').textContent = emailInput.value || 'cliente@exemplo.com';
        });
        
        nomeInput.addEventListener('input', () => {
            modal.querySelector('#previewRemetente').textContent = nomeInput.value || 'Seu Nome';
        });
        
        // Assunto é automático, não precisa de listener
        
        // Auto-remover após 30 segundos
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 30000);
    }

    prepararEmail() {
        const emailCliente = document.getElementById('emailCliente').value.trim();
        const nomeRemetente = document.getElementById('nomeRemetente').value.trim();
        const assuntoEmail = `Rastreamento NF${this.currentData.nf}`;
        
        if (!emailCliente || !nomeRemetente) {
            this.showNotification('❌ Por favor, preencha todos os campos obrigatórios!', 'error');
            return;
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailCliente)) {
            this.showNotification('❌ Email inválido!', 'error');
            return;
        }
        
        // Criar conteúdo do email
        const conteudoEmail = this.criarConteudoEmail(nomeRemetente);
        
        // Fechar modal
        document.querySelector('.fixed').remove();
        
        // Mostrar opções de envio
        this.mostrarOpcoesEmail(emailCliente, assuntoEmail, conteudoEmail);
    }

    criarConteudoEmail(nomeRemetente) {
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const historico = this.currentData.historico || [];
        
        let timelineText = '';
        if (historico.length > 0) {
            timelineText = '\n📋 HISTÓRICO DE EVENTOS:\n';
            timelineText += '────────────────────────────────────────────\n';
            
            historico.forEach((evento, index) => {
                timelineText += `${index + 1}. ${evento.data_hora || 'N/A'}\n`;
                timelineText += `   📍 ${evento.cidade || evento.filial || 'N/A'}\n`;
                timelineText += `   📝 ${evento.ocorrencia || 'Evento'}\n`;
                if (evento.descricao) {
                    timelineText += `   💬 ${evento.descricao}\n`;
                }
                timelineText += '\n';
            });
        }
        
        return `
🚚 KUHN PARTS BRASIL - RASTREAMENTO DE ENCOMENDA
═══════════════════════════════════════════════════════════

Prezado(a) ${nomeRemetente},

Segue o resultado do rastreamento da sua encomenda:

📦 INFORMAÇÕES DA ENCOMENDA
────────────────────────────────────────────
• Nota Fiscal: ${this.currentData.nf}
• Transportadora: ${this.currentData.transportadora}
• Status Atual: ${this.currentData.status}
• Descrição: ${this.currentData.descricao || 'N/A'}
• Destino: ${this.currentData.cidade_destino || 'N/A'} ${this.currentData.uf_destino ? '- ' + this.currentData.uf_destino : ''}
• Previsão de Entrega: ${this.currentData.previsao || 'N/A'}
${timelineText}
═══════════════════════════════════════════════════════════

Este é um e-mail automático do sistema Kuhn Parts Brasil.
Em caso de dúvidas, responda esta mensagem.

────────────────────────────────────────────
KUHN Parts Brasil Logística
📞 Suporte: Sistema de Rastreamento Online
🌐 www.kuhnparts.com.br
═══════════════════════════════════════════════════════════

Data do envio: ${dataAtual}
Última atualização: ${this.getCurrentTime()}
        `.trim();
    }

    mostrarOpcoesEmail(emailCliente, assunto, conteudo) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-scale-in">
                <h3 class="text-xl font-bold text-gray-800 mb-4">📧 Opções de Envio</h3>
                
                <div class="space-y-3">
                    <p class="text-gray-600">Escolha como deseja enviar o email:</p>
                    
                    <button onclick="rastreamentoEnhanced.abrirClienteEmail('${emailCliente}', '${assunto}', \`${conteudo.replace(/`/g, '\\`')}\`)" 
                            class="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left flex items-center gap-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        📧 Abrir Cliente de Email Padrão
                    </button>
                    
                    <button onclick="rastreamentoEnhanced.abrirGmail('${emailCliente}', '${assunto}', \`${conteudo.replace(/`/g, '\\`')}\`)" 
                            class="w-full px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-left flex items-center gap-3">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h3.819v9.273L12 8.155l6.545 4.939V3.821h3.819c.904 0 1.636.732 1.636 1.636z"/>
                        </svg>
                        📧 Abrir Gmail
                    </button>
                    
                    <button onclick="rastreamentoEnhanced.abrirOutlook('${emailCliente}', '${assunto}', \`${conteudo.replace(/`/g, '\\`')}\`)" 
                            class="w-full px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-left flex items-center gap-3">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.462 0H0v24h7.462V0zM24 0h-7.462v24H24V0z"/>
                        </svg>
                        📧 Abrir Outlook
                    </button>
                    
                    <button onclick="rastreamentoEnhanced.copiarConteudoEmail(\`${conteudo.replace(/`/g, '\\`')}\`, '${emailCliente}')" 
                            class="w-full px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-left flex items-center gap-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        📋 Copiar Conteúdo e Email
                    </button>
                </div>
                
                <button onclick="this.closest('.fixed').remove()" 
                        class="mt-6 w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold">
                    Fechar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    abrirClienteEmail(emailCliente, assunto, conteudo) {
        const mailtoLink = `mailto:${emailCliente}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(conteudo)}`;
        
        try {
            window.location.href = mailtoLink;
            this.showNotification('📧 Cliente de email aberto!', 'success');
        } catch (error) {
            console.error('Erro ao abrir cliente de email:', error);
            this.showNotification('❌ Erro ao abrir cliente de email', 'error');
        }
        
        document.querySelector('.fixed').remove();
    }

    abrirGmail(emailCliente, assunto, conteudo) {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailCliente}&su=${encodeURIComponent(assunto)}&body=${encodeURIComponent(conteudo)}`;
        
        try {
            window.open(gmailUrl, '_blank');
            this.showNotification('📧 Gmail aberto!', 'success');
        } catch (error) {
            console.error('Erro ao abrir Gmail:', error);
            this.showNotification('❌ Erro ao abrir Gmail', 'error');
        }
        
        document.querySelector('.fixed').remove();
    }

    abrirOutlook(emailCliente, assunto, conteudo) {
        const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${emailCliente}&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(conteudo)}`;
        
        try {
            window.open(outlookUrl, '_blank');
            this.showNotification('📧 Outlook aberto!', 'success');
        } catch (error) {
            console.error('Erro ao abrir Outlook:', error);
            this.showNotification('❌ Erro ao abrir Outlook', 'error');
        }
        
        document.querySelector('.fixed').remove();
    }

    copiarConteudoEmail(conteudo, emailCliente) {
        const textoParaCopiar = `Email para: ${emailCliente}

Conteúdo do email:
${conteudo}`;
        
        navigator.clipboard.writeText(textoParaCopiar).then(() => {
            this.showNotification('✅ Conteúdo copiado! Cole no seu cliente de email.', 'success');
        }).catch(() => {
            this.showNotification('❌ Erro ao copiar', 'error');
        });
        
        document.querySelector('.fixed').remove();
    }

    // ═══════════════════════════════════════════════════════════
    // NOTIFICAÇÕES E UI
    // ═══════════════════════════════════════════════════════════

    setupNotifications() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    showNotification(message, type = 'info') {
        const colors = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'info': 'bg-blue-500',
            'warning': 'bg-yellow-500'
        };

        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl z-50 transform translate-x-full transition-transform duration-300 max-w-md`;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.remove('translate-x-full'), 100);
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Notificação do sistema
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Kuhn Parts - Rastreamento', {
                body: message,
                icon: '/static/img/logo_kuhn.png'
            });
        }
    }

    showLoading(show) {
        const loadingDiv = document.getElementById('loadingRastreamento');
        const btnRastrear = document.getElementById('btnRastrear');
        
        if (loadingDiv) {
            loadingDiv.classList.toggle('hidden', !show);
        }

        if (btnRastrear) {
            btnRastrear.disabled = show;
            if (show) {
                btnRastrear.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Rastreando...</span>
                    </div>
                `;
            } else {
                btnRastrear.innerHTML = `
                    <div class="flex items-center gap-3">
                        <svg class="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <span>Rastrear Encomenda</span>
                    </div>
                `;
            }
        }
    }

    limparResultados() {
        const resultadoDiv = document.getElementById('resultadoRastreamento');
        if (resultadoDiv) {
            resultadoDiv.innerHTML = '';
            resultadoDiv.classList.add('hidden');
        }
    }

    novaConsulta() {
        this.stopAutoRefresh();
        this.currentData = null;
        
        const input = document.getElementById('codigoRastreamento');
        if (input) {
            input.value = '';
            input.focus();
        }
        
        this.limparResultados();
    }

    loadSavedPreferences() {
        try {
            const prefs = localStorage.getItem('rastreamentoPrefs');
            if (prefs) {
                const parsed = JSON.parse(prefs);
                this.autoRefreshTime = parsed.autoRefreshTime || 60000;
            }
        } catch {}
    }

    // ═══════════════════════════════════════════════════════════
    // CELEBRAÇÃO
    // ═══════════════════════════════════════════════════════════

    criarCelebracao() {
        this.criarConfetti();
    }

    criarConfetti() {
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * window.innerWidth}px;
                top: -10px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
            `;
            
            document.body.appendChild(confetti);
            
            const animation = confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight + 100}px) rotate(720deg)`, opacity: 0 }
            ], {
                duration: 3000 + Math.random() * 2000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            
            animation.onfinish = () => confetti.remove();
        }
    }
}

// ═══════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    window.rastreamentoEnhanced = new RastreamentoEnhanced();
    console.log('✅ Sistema de Rastreamento Avançado iniciado!');
});

// Adicionar CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes scale-in {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
    .animate-scale-in { animation: scale-in 0.3s ease-out; }
    .hover-lift { transition: all 0.3s; }
    .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
`;
document.head.appendChild(style);

