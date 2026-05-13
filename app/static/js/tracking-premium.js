// 🚀 TRACKING PREMIUM - JavaScript Avançado para Interface Tailwind
// Recursos de UX de nível TOP para o sistema de rastreamento Kuhn

class TrackingPremium {
  constructor() {
    this.input = document.getElementById('codigoRastreamento');
    this.btnRastrear = document.getElementById('btnRastrear');
    this.loadingDiv = document.getElementById('loadingRastreamento');
    this.resultadoDiv = document.getElementById('resultadoRastreamento');
    this.historico = JSON.parse(localStorage.getItem('trackingHistory') || '[]');
    
    this.init();
  }

  init() {
    this.setupInputValidation();
    this.setupAutocomplete();
    this.setupKeyboardShortcuts();
    this.setupMicroInteractions();
    this.setupAccessibility();
    this.setupPWAFeatures();
  }

  // ✅ Validação em tempo real com feedback visual
  setupInputValidation() {
    this.input.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      const container = e.target.parentElement;
      
      // Limpar classes anteriores
      e.target.classList.remove('border-green-500', 'border-red-500', 'border-yellow-500', 'ring-green-500/20', 'ring-red-500/20', 'ring-yellow-500/20');
      
      if (value.length === 0) {
        // Estado neutro
        e.target.classList.add('border-gray-200');
      } else if (value.length < 3) {
        // Muito curto
        e.target.classList.add('border-yellow-500', 'ring-yellow-500/20');
        this.showTooltip('Nota fiscal deve ter pelo menos 3 dígitos', e.target);
      } else if (this.isValidNotaFiscal(value)) {
        // Válida
        e.target.classList.add('border-green-500', 'ring-green-500/20');
        this.hideTooltip();
      } else {
        // Inválida
        e.target.classList.add('border-red-500', 'ring-red-500/20');
        this.showTooltip('Formato inválido. Use apenas números', e.target);
      }
    });
  }

  // 🔍 Autocomplete inteligente com histórico
  setupAutocomplete() {
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'absolute top-full left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 hidden';
    autocompleteContainer.id = 'autocomplete-container';
    this.input.parentElement.appendChild(autocompleteContainer);

    this.input.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      if (value.length >= 2) {
        this.showAutocomplete(value);
      } else {
        this.hideAutocomplete();
      }
    });

    this.input.addEventListener('blur', () => {
      setTimeout(() => this.hideAutocomplete(), 200);
    });
  }

  showAutocomplete(query) {
    const container = document.getElementById('autocomplete-container');
    const matches = this.historico
      .filter(item => item.includes(query))
      .slice(0, 5);

    if (matches.length > 0) {
      container.innerHTML = matches.map(item => `
        <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3" data-value="${item}">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="font-medium">${item}</span>
          <span class="text-xs text-gray-500 ml-auto">Histórico</span>
        </div>
      `).join('');

      // Adicionar event listeners
      container.querySelectorAll('[data-value]').forEach(item => {
        item.addEventListener('click', (e) => {
          this.input.value = e.currentTarget.dataset.value;
          this.input.focus();
          this.hideAutocomplete();
          this.triggerValidation();
        });
      });

      container.classList.remove('hidden');
    } else {
      this.hideAutocomplete();
    }
  }

  hideAutocomplete() {
    const container = document.getElementById('autocomplete-container');
    container.classList.add('hidden');
  }

  // ⌨️ Atalhos de teclado avançados
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl + Enter para rastrear
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.rastrear();
      }
      
      // Escape para limpar
      if (e.key === 'Escape' && document.activeElement === this.input) {
        this.input.value = '';
        this.input.focus();
        this.hideAutocomplete();
      }
      
      // Setas para navegar no autocomplete
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        this.navigateAutocomplete(e.key);
      }
    });
  }

  // 🎨 Micro-interações premium
  setupMicroInteractions() {
    // Efeito de typing no input
    this.input.addEventListener('focus', () => {
      this.input.parentElement.classList.add('scale-105');
      this.input.parentElement.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });

    this.input.addEventListener('blur', () => {
      this.input.parentElement.classList.remove('scale-105');
    });

    // Efeito de ripple no botão
    this.btnRastrear.addEventListener('click', (e) => {
      this.createRippleEffect(e);
    });

    // Efeito de hover avançado
    this.btnRastrear.addEventListener('mouseenter', () => {
      this.btnRastrear.style.transform = 'scale(1.05) translateY(-2px)';
      this.btnRastrear.style.boxShadow = '0 20px 25px -5px rgba(239, 68, 68, 0.4), 0 10px 10px -5px rgba(239, 68, 68, 0.1)';
    });

    this.btnRastrear.addEventListener('mouseleave', () => {
      this.btnRastrear.style.transform = 'scale(1) translateY(0)';
      this.btnRastrear.style.boxShadow = '';
    });
  }

  // ♿ Recursos de acessibilidade
  setupAccessibility() {
    // ARIA labels
    this.input.setAttribute('aria-label', 'Número da nota fiscal para rastreamento');
    this.input.setAttribute('aria-describedby', 'help-text');
    this.btnRastrear.setAttribute('aria-label', 'Rastrear encomenda');

    // Navegação por teclado
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.rastrear();
      }
    });

    // Anúncios para screen readers
    this.createScreenReaderAnnouncements();
  }

  // 📱 Recursos PWA
  setupPWAFeatures() {
    // Detectar se é PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.body.classList.add('pwa-mode');
    }

    // Cache de dados offline
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }
  }

  // 🔧 Métodos utilitários
  isValidNotaFiscal(value) {
    return /^\d{3,12}$/.test(value);
  }

  triggerValidation() {
    this.input.dispatchEvent(new Event('input'));
  }

  createRippleEffect(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  showTooltip(message, target) {
    this.hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute top-full left-0 mt-2 px-3 py-2 bg-red-500 text-white text-sm rounded-lg shadow-lg z-50';
    tooltip.textContent = message;
    tooltip.id = 'validation-tooltip';
    
    target.parentElement.appendChild(tooltip);
    
    setTimeout(() => this.hideTooltip(), 3000);
  }

  hideTooltip() {
    const tooltip = document.getElementById('validation-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  navigateAutocomplete(direction) {
    const container = document.getElementById('autocomplete-container');
    if (container.classList.contains('hidden')) return;

    const items = container.querySelectorAll('[data-value]');
    const current = container.querySelector('.bg-gray-100');
    let index = current ? Array.from(items).indexOf(current) : -1;

    if (direction === 'ArrowDown') {
      index = Math.min(index + 1, items.length - 1);
    } else {
      index = Math.max(index - 1, -1);
    }

    items.forEach(item => item.classList.remove('bg-gray-100'));
    if (index >= 0) {
      items[index].classList.add('bg-gray-100');
      this.input.value = items[index].dataset.value;
    } else {
      this.input.value = this.input.dataset.originalValue || '';
    }
  }

  createScreenReaderAnnouncements() {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.id = 'screen-reader-announcer';
    document.body.appendChild(announcer);

    this.announcer = announcer;
  }

  announce(message) {
    if (this.announcer) {
      this.announcer.textContent = message;
    }
  }

  registerServiceWorker() {
    // Implementação básica de service worker
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker não disponível
    });
  }

  // 🚀 Função principal de rastreamento
  async rastrear() {
    const codigo = this.input.value.trim();
    
    if (!codigo) {
      this.showError('Digite o número da nota fiscal');
      this.input.focus();
      return;
    }

    if (!this.isValidNotaFiscal(codigo)) {
      this.showError('Formato inválido. Use apenas números');
      this.input.focus();
      return;
    }

    // Adicionar ao histórico
    this.addToHistory(codigo);
    
    // Mostrar loading
    this.showLoading();
    this.announce('Consultando transportadoras...');

    try {
      // Simular consulta (substituir pela lógica real)
      const resultado = await this.consultarTransportadoras(codigo);
      this.showResultado(resultado);
      this.announce('Consulta realizada com sucesso');
    } catch (error) {
      this.showError('Erro ao consultar transportadoras');
      this.announce('Erro na consulta');
    }
  }

  async consultarTransportadoras(codigo) {
    // Simular delay da consulta
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Retornar resultado simulado
    return {
      codigo,
      transportadora: 'Rodonaves',
      status: 'Em trânsito',
      descricao: 'Encomenda em trânsito para destino',
      cidade_destino: 'São Paulo',
      uf_destino: 'SP',
      previsao: '2025-01-20'
    };
  }

  showLoading() {
    this.loadingDiv.classList.remove('hidden');
    this.resultadoDiv.classList.add('hidden');
    this.btnRastrear.disabled = true;
    this.btnRastrear.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Consultando...</span>
      </div>
    `;
  }

  showResultado(resultado) {
    this.loadingDiv.classList.add('hidden');
    this.resultadoDiv.classList.remove('hidden');
    
    this.resultadoDiv.innerHTML = `
      <!-- 🚀 RESULTADO IMPRESSIONANTE COM ANIMAÇÕES -->
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
          <p class="text-gray-600 text-lg">Nota Fiscal: <span class="font-bold text-red-600 text-xl">${resultado.codigo}</span></p>
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
                <p class="text-xl font-bold text-gray-800">${resultado.codigo}</p>
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
                <p class="text-xl font-bold text-red-600">${resultado.transportadora}</p>
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
                  ${resultado.status}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Timeline de progresso animado -->
        <div class="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 mb-8 animate-fade-in-up" style="animation-delay: 0.4s">
          <h4 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            Timeline de Progresso
          </h4>
          
          <div class="relative">
            <!-- Linha de progresso -->
            <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 via-blue-400 to-purple-400"></div>
            
            <!-- Etapas do progresso -->
            <div class="space-y-6">
              <div class="flex items-center gap-4 animate-slide-in-right" style="animation-delay: 0.5s">
                <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-gray-800">Encomenda Coletada</p>
                  <p class="text-sm text-gray-600">17/10/2025 - 08:30</p>
                </div>
              </div>
              
              <div class="flex items-center gap-4 animate-slide-in-right" style="animation-delay: 0.6s">
                <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-gray-800">Em Trânsito</p>
                  <p class="text-sm text-gray-600">18/10/2025 - 14:20</p>
                </div>
              </div>
              
              <div class="flex items-center gap-4 animate-slide-in-right" style="animation-delay: 0.7s">
                <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-gray-800">Chegou ao Destino</p>
                  <p class="text-sm text-gray-600">19/10/2025 - 09:15</p>
                </div>
              </div>
              
              <div class="flex items-center gap-4 animate-slide-in-right" style="animation-delay: 0.8s">
                <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-gray-800">Entrega Finalizada</p>
                  <p class="text-sm text-gray-600">19/10/2025 - 23:26</p>
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
              <p class="text-lg font-bold text-gray-800">${resultado.cidade_destino} - ${resultado.uf_destino}</p>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">PREVISÃO</p>
              <p class="text-lg font-bold text-gray-800">${resultado.previsao}</p>
            </div>
          </div>
          
          <div class="mt-6">
            <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">DESCRIÇÃO</p>
            <p class="text-gray-700 leading-relaxed">${resultado.descricao}</p>
          </div>
        </div>
        
        <!-- Botões de ação -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style="animation-delay: 1s">
          <button onclick="trackingPremium.novaConsulta()" class="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Nova Consulta
            </div>
          </button>
          
          <button onclick="trackingPremium.compartilharResultado()" class="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
              Compartilhar
            </div>
          </button>
        </div>
      </div>
    `;
    
    this.resetButton();
    this.iniciarAnimacoes();
  }

  showError(message) {
    // Criar notificação de erro
    this.createNotification(message, 'error');
    this.input.classList.add('animate-pulse');
    setTimeout(() => this.input.classList.remove('animate-pulse'), 500);
  }

  createNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ${
      type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
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

  addToHistory(codigo) {
    if (!this.historico.includes(codigo)) {
      this.historico.unshift(codigo);
      this.historico = this.historico.slice(0, 10); // Manter apenas 10 itens
      localStorage.setItem('trackingHistory', JSON.stringify(this.historico));
    }
  }

  novaConsulta() {
    this.input.value = '';
    this.resultadoDiv.classList.add('hidden');
    this.input.focus();
    this.triggerValidation();
  }

  resetButton() {
    this.btnRastrear.disabled = false;
    this.btnRastrear.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <span>Rastrear Encomenda</span>
      </div>
    `;
  }

  // 🎨 Iniciar animações do resultado
  iniciarAnimacoes() {
    // Criar partículas de sucesso
    this.criarParticulasSucesso();
    
    // Animar cards sequencialmente
    setTimeout(() => {
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
    }, 200);
    
    // Efeito de confetti
    this.criarConfetti();
  }

  // 🎊 Criar partículas de sucesso
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

  // 🎉 Criar efeito de confetti
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

  // 📤 Compartilhar resultado
  compartilharResultado() {
    const codigo = this.input.value.trim();
    const texto = `🎉 Encontrei minha encomenda! Nota Fiscal: ${codigo} - Sistema Kuhn Parts Brasil`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Resultado do Rastreamento - Kuhn Parts',
        text: texto,
        url: window.location.href
      });
    } else {
      // Fallback para copiar link
      navigator.clipboard.writeText(texto).then(() => {
        this.createNotification('Link copiado para a área de transferência!', 'success');
      });
    }
  }
}

// 🚀 Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.trackingPremium = new TrackingPremium();
  
  // Adicionar estilos CSS dinâmicos
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in {
      animation: fade-in 0.5s ease-out;
    }
    
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;
  document.head.appendChild(style);
});
