/**
 * Sistema de Rastreamento - JavaScript Interativo
 */

class RastreamentoManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const btnRastrear = document.getElementById('btnRastrear');
        if (btnRastrear) {
            btnRastrear.addEventListener('click', () => this.rastrear());
        }

        const inputCodigo = document.getElementById('codigoRastreamento');
        if (inputCodigo) {
            inputCodigo.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.rastrear();
                }
            });
        }
    }

    async rastrear() {
        const codigo = document.getElementById('codigoRastreamento')?.value?.trim();
        
        if (!codigo) {
            this.mostrarErro('Por favor, digite um código de rastreamento.');
            return;
        }

        this.mostrarLoading(true);
        this.limparResultados();

        try {
            // Obter CSRF token
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
                this.mostrarResultado(data);
            } else {
                this.mostrarErro(data.error || 'Erro ao rastrear encomenda.');
            }

        } catch (error) {
            console.error('Erro na requisição:', error);
            this.mostrarErro('Erro de conexão. Verifique sua internet.');
        } finally {
            this.mostrarLoading(false);
        }
    }

    mostrarResultado(data) {
        const resultadoDiv = document.getElementById('resultadoRastreamento');
        if (!resultadoDiv) return;

        // Determinar cor do status
        const statusColor = this.getStatusColor(data.status);
        
        // 🎉 CRIAR CELEBRAÇÃO PARA TODAS AS NOTAS FISCAIS
        this.criarCelebracao();
        
        let html = `
            <!-- 🚀 RESULTADO COM CELEBRAÇÃO E TIMELINE -->
            <div class="animate-fade-in-up">
                <!-- Header do resultado com efeito de sucesso -->
                <div class="text-center mb-8">
                    <div class="relative inline-block">
                        <!-- Ícone de sucesso com animação -->
                        <div class="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-bounce-in">
                            <svg class="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <!-- Efeito de partículas de sucesso -->
                        <div class="absolute inset-0 pointer-events-none">
                            <div class="success-particles"></div>
                        </div>
                    </div>
                    <h3 class="text-3xl font-black text-gray-800 mb-2 animate-slide-in-right">🎉 Encomenda Encontrada!</h3>
                    <p class="text-gray-600 text-lg">Nota Fiscal: <span class="font-bold text-red-600 text-xl">${data.nf}</span></p>
                </div>
                
                <!-- Cards de informações com glassmorphism -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">STATUS</p>
                                <span class="inline-block px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold rounded-full shadow-lg animate-pulse">
                                    ${data.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Timeline Premium de Progresso -->
                <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 mb-8 animate-fade-in-up" style="animation-delay: 0.4s">
                    <h4 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        Timeline de Progresso da Encomenda
                    </h4>
                    
                    <div class="relative">
                        <!-- Linha de progresso -->
                        <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 via-blue-400 to-purple-400"></div>
                        
                        <!-- Etapas do progresso -->
                        <div class="space-y-6">
                            <!-- Etapa 1: Coleta -->
                            <div class="flex items-center gap-4 animate-slide-in-right" style="animation-delay: 0.5s">
                                <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">Encomenda Coletada</p>
                                    <p class="text-sm text-gray-600">17/10/2025 - 08:30</p>
                                    <p class="text-sm text-gray-500">📍 Origem - ${data.cidade_destino || 'Centro de Distribuição'}</p>
                                </div>
                            </div>
                            
                            <!-- Etapa 2: Em Trânsito -->
                            <div class="flex items-center gap-4 animate-slide-in-right" style="animation-delay: 0.6s">
                                <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                                    </svg>
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">Em Trânsito</p>
                                    <p class="text-sm text-gray-600">18/10/2025 - 14:20</p>
                                    <p class="text-sm text-gray-500">🚛 A caminho do destino</p>
                                </div>
                            </div>
                            
                            <!-- Etapa 3: Chegou ao Destino -->
                            <div class="flex items-center gap-4 animate-slide-in-right" style="animation-delay: 0.7s">
                                <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    </svg>
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">Chegou ao Destino</p>
                                    <p class="text-sm text-gray-600">19/10/2025 - 09:15</p>
                                    <p class="text-sm text-gray-500">📍 ${data.cidade_destino} - ${data.uf_destino}</p>
                                </div>
                            </div>
                            
                            <!-- Etapa 4: Entrega Finalizada -->
                            <div class="flex items-center gap-4 animate-slide-in-right" style="animation-delay: 0.8s">
                                <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"></path>
                                    </svg>
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">Entrega Finalizada</p>
                                    <p class="text-sm text-gray-600">${data.previsao || '19/10/2025 23:26'}</p>
                                    <p class="text-sm text-gray-500">✅ Entregue com sucesso</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Informações detalhadas -->
                <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 mb-8 animate-fade-in-up" style="animation-delay: 0.9s">
                    <h4 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        Informações Detalhadas
                    </h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">DESTINO</p>
                            <p class="text-lg font-bold text-gray-800">${data.cidade_destino} - ${data.uf_destino}</p>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">PREVISÃO</p>
                            <p class="text-lg font-bold text-gray-800">${data.previsao}</p>
                        </div>
                    </div>
                    
                    <div class="mt-6">
                        <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">DESCRIÇÃO</p>
                        <p class="text-gray-700 leading-relaxed">${data.descricao}</p>
                    </div>
                </div>
                
                <!-- Botões de ação premium com cores vibrantes -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style="animation-delay: 1s">
                    <button onclick="rastreamentoManager.novaConsulta()" class="group relative px-8 py-4 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white font-bold rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border border-blue-400/20">
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            Nova Consulta
                        </div>
                        <div class="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    
                    <button onclick="console.log('Botão clicado!'); rastreamentoManager.compartilharResultado('${data.nf}')" class="group relative px-8 py-4 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 text-white font-bold rounded-xl hover:from-green-600 hover:via-green-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border border-green-400/20">
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                            </svg>
                            Compartilhar
                        </div>
                        <div class="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    
                    <button onclick="rastreamentoManager.enviarPorEmail('${data.nf}', '${data.transportadora}', '${data.status}', '${data.cidade_destino}', '${data.uf_destino}', '${data.previsao}', '${data.descricao}')" class="group relative px-8 py-4 bg-gradient-to-br from-purple-500 via-purple-600 to-violet-700 text-white font-bold rounded-xl hover:from-purple-600 hover:via-purple-700 hover:to-violet-800 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border border-purple-400/20">
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            Enviar por Email
                        </div>
                        <div class="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                </div>
            </div>
        `;

        resultadoDiv.innerHTML = html;
        resultadoDiv.classList.remove('hidden');
        
        // Adicionar animação de entrada escalonada
        this.animateResultItems();
    }
    
    getStatusColor(status) {
        const statusLower = status.toLowerCase();
        
        if (statusLower.includes('entregue') || statusLower.includes('recebida')) {
            return { class: 'status-entregue', color: '#10b981' };
        } else if (statusLower.includes('trânsito') || statusLower.includes('transito')) {
            return { class: 'status-transito', color: '#3b82f6' };
        } else if (statusLower.includes('pendente') || statusLower.includes('aguardando')) {
            return { class: 'status-pendente', color: '#f59e0b' };
        } else if (statusLower.includes('problema') || statusLower.includes('erro') || statusLower.includes('atraso')) {
            return { class: 'status-problema', color: '#ef4444' };
        } else {
            return { class: 'status-info', color: '#6b7280' };
        }
    }
    
    animateResultItems() {
        const items = document.querySelectorAll('.result-item, .result-description, .history-item');
        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.5s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    mostrarErro(mensagem) {
        const resultadoDiv = document.getElementById('resultadoRastreamento');
        if (!resultadoDiv) return;

        resultadoDiv.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-800">${mensagem}</p>
                    </div>
                </div>
            </div>
        `;
        resultadoDiv.classList.remove('hidden');
    }

    mostrarLoading(show) {
        const btnRastrear = document.getElementById('btnRastrear');
        const loadingDiv = document.getElementById('loadingRastreamento');
        
        if (btnRastrear) {
            btnRastrear.disabled = show;
            btnRastrear.innerHTML = show ? 
                '<span class="spinner mr-2"></span>Rastreando...' : 
                'Rastrear';
        }

        if (loadingDiv) {
            loadingDiv.classList.toggle('hidden', !show);
        }
    }

    limparResultados() {
        const resultadoDiv = document.getElementById('resultadoRastreamento');
        if (resultadoDiv) {
            resultadoDiv.innerHTML = '';
            resultadoDiv.classList.add('hidden');
        }
    }

    // 🎉 FUNÇÕES DE CELEBRAÇÃO
    criarCelebracao() {
        // Criar confetti
        this.criarConfetti();
        
        // Criar partículas de sucesso
        setTimeout(() => {
            this.criarParticulasSucesso();
        }, 500);
        
        // Animar elementos
        setTimeout(() => {
            this.animarElementos();
        }, 1000);
    }

    // 🎊 Criar efeito de confetti
    criarConfetti() {
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '8px';
            confetti.style.height = '8px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            
            document.body.appendChild(confetti);
            
            // Animar confetti
            const animation = confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight + 100}px) rotate(720deg)`, opacity: 0 }
            ], {
                duration: 3000 + Math.random() * 2000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            
            animation.onfinish = () => {
                confetti.remove();
            };
        }
    }

    // ✨ Criar partículas de sucesso
    criarParticulasSucesso() {
        const container = document.querySelector('.success-particles');
        if (!container) return;
        
        for (let i = 0; i < 20; i++) {
            const particula = document.createElement('div');
            particula.className = 'absolute w-2 h-2 bg-green-400 rounded-full animate-bounce';
            particula.style.left = Math.random() * 100 + '%';
            particula.style.top = Math.random() * 100 + '%';
            particula.style.animationDelay = Math.random() * 2 + 's';
            particula.style.animationDuration = (1 + Math.random() * 2) + 's';
            container.appendChild(particula);
            
            setTimeout(() => {
                particula.remove();
            }, 3000);
        }
    }

    // 🎨 Animar elementos
    animarElementos() {
        const cards = document.querySelectorAll('.animate-fade-in-up');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'all 0.6s ease-out';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 100);
        });
    }

    // 📤 Compartilhar resultado
    compartilharResultado(codigo) {
        console.log('Função compartilharResultado chamada com código:', codigo);
        
        const texto = `🎉 Encontrei minha encomenda! Nota Fiscal: ${codigo} - Sistema Kuhn Parts Brasil`;
        
        // Verificar se está em HTTPS (necessário para Web Share API)
        if (navigator.share && location.protocol === 'https:') {
            console.log('Usando Web Share API');
            navigator.share({
                title: 'Resultado do Rastreamento - Kuhn Parts',
                text: texto,
                url: window.location.href
            }).then(() => {
                console.log('Compartilhamento realizado com sucesso');
                this.createNotification('Compartilhado com sucesso!', 'success');
            }).catch((error) => {
                console.log('Erro no compartilhamento:', error);
                this.fallbackCompartilhar(texto);
            });
        } else {
            console.log('Usando fallback de cópia');
            this.fallbackCompartilhar(texto);
        }
    }

    // 📋 Fallback para copiar texto
    fallbackCompartilhar(texto) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(texto).then(() => {
                console.log('Texto copiado para área de transferência');
                this.createNotification('✅ Texto copiado! Cole em qualquer lugar para compartilhar.', 'success');
            }).catch((error) => {
                console.log('Erro ao copiar:', error);
                this.compartilharManual(texto);
            });
        } else {
            this.compartilharManual(texto);
        }
    }

    // 📝 Compartilhamento manual (fallback final)
    compartilharManual(texto) {
        // Criar um input temporário para copiar
        const input = document.createElement('input');
        input.value = texto;
        document.body.appendChild(input);
        input.select();
        
        try {
            document.execCommand('copy');
            this.createNotification('✅ Texto copiado! Cole em qualquer lugar para compartilhar.', 'success');
        } catch (error) {
            console.log('Erro no fallback manual:', error);
            // Mostrar o texto em um modal para o usuário copiar manualmente
            this.mostrarModalCompartilhar(texto);
        }
        
        document.body.removeChild(input);
    }

    // 🪟 Modal para compartilhar manualmente
    mostrarModalCompartilhar(texto) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
                <h3 class="text-lg font-bold text-gray-800 mb-4">📤 Compartilhar Resultado</h3>
                <p class="text-gray-600 mb-4">Copie o texto abaixo para compartilhar:</p>
                <textarea class="w-full p-3 border border-gray-300 rounded-lg resize-none" rows="3" readonly>${texto}</textarea>
                <div class="flex gap-3 mt-4">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                        Fechar
                    </button>
                    <button onclick="this.previousElementSibling.select(); document.execCommand('copy'); this.textContent='Copiado!'" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Copiar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 10000);
    }

    // 📧 Enviar resultado por email
    enviarPorEmail(nf, transportadora, status, cidade, uf, previsao, descricao) {
        console.log('Função enviarPorEmail chamada');
        
        // Criar modal para coletar email do cliente
        this.mostrarModalEmail(nf, transportadora, status, cidade, uf, previsao, descricao);
    }

    // 🪟 Modal para coletar email e enviar
    mostrarModalEmail(nf, transportadora, status, cidade, uf, previsao, descricao) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-lg mx-4 shadow-2xl">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    Enviar Resultado por Email
                </h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email do Cliente:</label>
                        <input type="email" id="emailCliente" placeholder="cliente@exemplo.com" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Seu Nome (Remetente):</label>
                        <input type="text" id="nomeRemetente" placeholder="Seu Nome" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Assunto do Email:</label>
                        <input type="text" id="assuntoEmail" value="Resultado do Rastreamento - Nota Fiscal ${nf}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        Cancelar
                    </button>
                    <button onclick="rastreamentoManager.prepararEmail('${nf}', '${transportadora}', '${status}', '${cidade}', '${uf}', '${previsao}', '${descricao.replace(/'/g, "\\'")}')" 
                            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        📧 Preparar Email
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remover após 30 segundos
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 30000);
    }

    // 📝 Preparar email com dados coletados
    prepararEmail(nf, transportadora, status, cidade, uf, previsao, descricao) {
        const emailCliente = document.getElementById('emailCliente').value;
        const nomeRemetente = document.getElementById('nomeRemetente').value;
        const assuntoEmail = document.getElementById('assuntoEmail').value;
        
        if (!emailCliente || !nomeRemetente) {
            this.createNotification('Por favor, preencha todos os campos obrigatórios!', 'error');
            return;
        }
        
        // Criar conteúdo do email
        const conteudoEmail = this.criarConteudoEmail(nf, transportadora, status, cidade, uf, previsao, descricao, nomeRemetente);
        
        // Fechar modal
        document.querySelector('.fixed').remove();
        
        // Abrir cliente de email
        this.abrirClienteEmail(emailCliente, assuntoEmail, conteudoEmail);
    }

    // 📄 Criar conteúdo HTML do email (template profissional)
    criarConteudoEmail(nf, transportadora, status, cidade, uf, previsao, descricao, nomeRemetente) {
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        
        return `
🚚 KUHN PARTS BRASIL
═══════════════════════════════════════════

Prezado(a) ${nomeRemetente},

Segue o status da sua entrega:

📋 INFORMAÇÕES DA ENCOMENDA
────────────────────────────────────────────
• Nota Fiscal: ${nf}
• Transportadora: ${transportadora}
• Status (última ocorrência): ${status}
• Descrição: ${descricao}
• Destino: ${cidade} - ${uf}
• Previsão de entrega: ${previsao}

═══════════════════════════════════════════

Este é um e-mail automático. Em caso de dúvidas, responda esta mensagem.

────────────────────────────────────────────
KUHN Parts Brasil Logística • Obrigado pela parceria 🚛 !
        `.trim();
    }

    // 🖼️ Obter logo Kuhn em base64
    getLogoKuhnBase64() {
        // Por enquanto retorna null para usar o texto "KUHN"
        // Você pode substituir por uma imagem base64 real da logo
        return null;
    }

    // 📧 Abrir cliente de email
    abrirClienteEmail(emailCliente, assunto, conteudo) {
        const mailtoLink = `mailto:${emailCliente}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(conteudo)}`;
        
        // Tentar abrir cliente de email
        window.location.href = mailtoLink;
        
        // Mostrar opções alternativas
        setTimeout(() => {
            this.mostrarOpcoesEmail(emailCliente, assunto, conteudo);
        }, 1000);
    }

    // 🔄 Mostrar opções alternativas de envio
    mostrarOpcoesEmail(emailCliente, assunto, conteudo) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-lg mx-4 shadow-2xl">
                <h3 class="text-xl font-bold text-gray-800 mb-4">📧 Opções de Envio</h3>
                
                <div class="space-y-3">
                    <p class="text-gray-600">Se o cliente de email não abriu automaticamente, você pode:</p>
                    
                    <button onclick="rastreamentoManager.copiarConteudoEmail('${conteudo.replace(/'/g, "\\'")}', '${emailCliente}')" 
                            class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left">
                        📋 Copiar Conteúdo e Email
                    </button>
                    
                    <button onclick="rastreamentoManager.abrirGmail('${emailCliente}', '${assunto}', '${conteudo.replace(/'/g, "\\'")}')" 
                            class="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-left">
                        📧 Abrir Gmail
                    </button>
                    
                    <button onclick="rastreamentoManager.abrirOutlook('${emailCliente}', '${assunto}', '${conteudo.replace(/'/g, "\\'")}')" 
                            class="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-left">
                        📧 Abrir Outlook
                    </button>
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remover após 30 segundos
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 30000);
    }

    // 📋 Copiar conteúdo do email
    copiarConteudoEmail(conteudo, emailCliente) {
        const textoParaCopiar = `Email para: ${emailCliente}

Conteúdo do email:
${conteudo}`;
        
        navigator.clipboard.writeText(textoParaCopiar).then(() => {
            this.createNotification('✅ Conteúdo copiado! Cole no seu cliente de email.', 'success');
        });
        
        document.querySelector('.fixed').remove();
    }

    // 📧 Abrir Gmail
    abrirGmail(emailCliente, assunto, conteudo) {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailCliente}&su=${encodeURIComponent(assunto)}&body=${encodeURIComponent(conteudo)}`;
        window.open(gmailUrl, '_blank');
        document.querySelector('.fixed').remove();
    }

    // 📧 Abrir Outlook
    abrirOutlook(emailCliente, assunto, conteudo) {
        const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${emailCliente}&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(conteudo)}`;
        window.open(outlookUrl, '_blank');
        document.querySelector('.fixed').remove();
    }

    // 🔄 Nova consulta
    novaConsulta() {
        const input = document.getElementById('codigoRastreamento');
        const resultadoDiv = document.getElementById('resultadoRastreamento');
        
        if (input) input.value = '';
        if (resultadoDiv) {
            resultadoDiv.innerHTML = '';
            resultadoDiv.classList.add('hidden');
        }
        
        if (input) input.focus();
    }

    // 📢 Criar notificação
    createNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ${
            type === 'error' ? 'bg-red-500 text-white' : 
            type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.rastreamentoManager = new RastreamentoManager();
});

// Adicionar estilos para o spinner
const style = document.createElement('style');
style.textContent = `
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
