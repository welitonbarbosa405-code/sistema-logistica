/**
 * Sistema de Cidades Atendidas - JavaScript Interativo v2.0
 * Interface Moderna com Funcionalidades Avançadas
 */

class CidadesManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 50;
        this.totalRecords = 0;
        this.totalPages = 0;
        this.currentData = [];
        this.sortColumn = '';
        this.sortDirection = 'asc';
        this.selectedItems = new Set(); // Para bulk actions
        this.savedFilters = this.loadSavedFilters(); // Filtros salvos
        this.isDarkMode = false; // Tema fixo claro
        this.filters = {
            cidade: '',
            cidade_origem: '',
            transportadora: '',
            uf: '',
            prazo: ''
        };
        this.activeFilters = new Map();
        this.suggestions = [];
        this.charts = {};
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupCharts();
        this.initDarkMode();
        this.renderSavedFilters();
        await this.loadInitialData();
        await this.loadKPIs(); // Carregar dados dos KPIs
        this.updateKPIs();
        this.updateCharts(); // Atualizar gráficos com KPIs carregados
        this.updateLastUpdateTime();
        
        // Atualizar tempo a cada minuto
        setInterval(() => this.updateLastUpdateTime(), 60000);
    }

    // Função para inicializar dark mode
    initDarkMode() {
        document.documentElement.classList.remove('dark');
        this.updateDarkModeIcons();
    }

    // Função para alternar dark mode (desativado para tema fixo)
    toggleDarkMode() {
        this.showToast('Tema fixo disponível apenas em modo claro.', 'info');
    }

    // Função para atualizar ícones do dark mode
    updateDarkModeIcons() {
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');
        
        if (sunIcon) sunIcon.classList.remove('hidden');
        if (moonIcon) moonIcon.classList.add('hidden');
    }

    // Função para mostrar toast notifications
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `transform transition-all duration-300 translate-x-full opacity-0 bg-white border-l-4 p-4 rounded-lg shadow-lg max-w-sm`;
        
        const colors = {
            success: 'border-green-500',
            error: 'border-red-500',
            warning: 'border-yellow-500',
            info: 'border-blue-500'
        };
        
        toast.classList.add(colors[type] || colors.info);
        
        toast.innerHTML = `
            <div class="flex items-center">
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-400 hover:text-gray-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 100);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Função para criar container de toasts
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }

    setupEventListeners() {
        // Filtros
        document.getElementById('btnBuscar')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('btnLimpar')?.addEventListener('click', () => this.clearFilters());
        document.getElementById('inpCidade')?.addEventListener('input', debounce(() => this.handleCityInput(), 300));
        document.getElementById('selCidadeOrigem')?.addEventListener('change', () => {
            this.updateTransportadorasByOrigem();
            this.applyFilters();
        });
        document.getElementById('selTransp')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('selUF')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('selPrazo')?.addEventListener('change', () => this.applyFilters());

        // Novas funcionalidades (tema fixo: sem alternância de dark mode)
        document.getElementById('saveFilterBtn')?.addEventListener('click', () => this.showSaveFilterModal());
        document.getElementById('selectAll')?.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        document.getElementById('exportSelected')?.addEventListener('click', () => this.exportSelected());
        document.getElementById('clearSelection')?.addEventListener('click', () => this.clearSelection());
        
        // Paginação
        document.getElementById('btnPrev')?.addEventListener('click', () => this.previousPage());
        document.getElementById('btnNext')?.addEventListener('click', () => this.nextPage());
        document.getElementById('pageSize')?.addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadData();
        });

        // Ordenação
        document.querySelectorAll('.th-sort').forEach(th => {
            th.addEventListener('click', () => this.sortTable(th.dataset.key));
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Importação (admin)
        document.getElementById('btnImport')?.addEventListener('click', () => this.importData());

        // Exportação
        document.getElementById('btnExport')?.addEventListener('click', () => this.showExportModal());

        // Mapa
        document.getElementById('btnMapa')?.addEventListener('click', () => this.showMapModal());
        document.getElementById('closeMapModal')?.addEventListener('click', () => this.hideMapModal());

        // Fechar modal ao clicar fora
        document.getElementById('mapModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'mapModal') {
                this.hideMapModal();
            }
        });

        // Fechar sugestões ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#inpCidade') && !e.target.closest('#cidadeSuggestions')) {
                this.hideSuggestions();
            }
        });
    }

    // Função para converter siglas de volta para nomes completos (para busca no banco)
    getStateNomeCompleto(sigla) {
        const siglaMap = {
            'AC': 'ACRE',
            'AL': 'ALAGOAS',
            'AP': 'AMAPÁ',
            'AM': 'AMAZONAS',
            'BA': 'BAHIA',
            'CE': 'CEARÁ',
            'DF': 'DISTRITO FEDERAL',
            'ES': 'ESPÍRITO SANTO',
            'GO': 'GOIÁS',
            'MA': 'MARANHÃO',
            'MT': 'MATO GROSSO',
            'MS': 'MATO GROSSO DO SUL',
            'MG': 'MINAS GERAIS',
            'PA': 'PARÁ',
            'PB': 'PARAÍBA',
            'PR': 'PARANÁ',
            'PE': 'PERNAMBUCO',
            'PI': 'PIAUÍ',
            'RJ': 'RIO DE JANEIRO',
            'RN': 'RIO GRANDE DO NORTE',
            'RS': 'RIO GRANDE DO SUL',
            'RO': 'RONDÔNIA',
            'RR': 'RORAIMA',
            'SC': 'SANTA CATARINA',
            'SP': 'SÃO PAULO',
            'SE': 'SERGIPE',
            'TO': 'TOCANTINS'
        };
        
        return siglaMap[sigla] || sigla;
    }

    showLoading(show = true) {
        const skeletons = document.getElementById('kpiSkeletons');
        const cards = document.getElementById('kpiCards');
        const tableSkeleton = document.getElementById('tableSkeleton');
        const mainTable = document.getElementById('mainTable');
        
        if (show) {
            if (skeletons) skeletons.classList.remove('hidden');
            if (cards) cards.classList.add('hidden');
            if (tableSkeleton) tableSkeleton.classList.remove('hidden');
            if (mainTable) mainTable.classList.add('hidden');
        } else {
            if (skeletons) skeletons.classList.add('hidden');
            if (cards) cards.classList.remove('hidden');
            if (tableSkeleton) tableSkeleton.classList.add('hidden');
            if (mainTable) mainTable.classList.remove('hidden');
        }
    }

    // Função para carregar filtros salvos do localStorage
    loadSavedFilters() {
        try {
            const saved = localStorage.getItem('cidades_saved_filters');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Erro ao carregar filtros salvos:', error);
            return [];
        }
    }

    // Função para salvar filtros
    saveFilter(name) {
        const filterData = {
            name: name,
            filters: { ...this.filters },
            timestamp: new Date().toISOString()
        };
        
        this.savedFilters.push(filterData);
        localStorage.setItem('cidades_saved_filters', JSON.stringify(this.savedFilters));
        this.renderSavedFilters();
        this.showToast(`Filtro "${name}" salvo com sucesso!`, 'success');
    }

    // Função para aplicar filtro salvo
    applySavedFilter(filterData) {
        this.filters = { ...filterData.filters };
        
        // Atualizar campos do formulário
        document.getElementById('inpCidade').value = this.filters.cidade || '';
        document.getElementById('selCidadeOrigem').value = this.filters.cidade_origem || '';
        document.getElementById('selTransp').value = this.filters.transportadora || '';
        document.getElementById('selUF').value = this.filters.uf || '';
        document.getElementById('selPrazo').value = this.filters.prazo || '';
        
        this.applyFilters();
        this.showToast(`Filtro "${filterData.name}" aplicado!`, 'info');
    }

    // Função para renderizar filtros salvos
    renderSavedFilters() {
        const container = document.getElementById('savedFilters');
        if (!container) return;

        container.innerHTML = this.savedFilters.map(filter => `
            <button onclick="cidadesManager.applySavedFilter(${JSON.stringify(filter).replace(/"/g, '&quot;')})" 
                    class="text-xs bg-white hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-md border border-gray-300 transition-colors flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                </svg>
                ${filter.name}
            </button>
        `).join('');
    }

    // Função para converter nomes de estados para siglas
    getStateSigla(estadoNome) {
        // Mapa SEM acentos para garantir match correto
        const estadoMap = {
            'ACRE': 'AC',
            'ALAGOAS': 'AL', 
            'AMAPA': 'AP',
            'AMAZONAS': 'AM',
            'BAHIA': 'BA',
            'CEARA': 'CE',
            'DISTRITO FEDERAL': 'DF',
            'ESPIRITO SANTO': 'ES',
            'GOIAS': 'GO',
            'MARANHAO': 'MA',
            'MATO GROSSO': 'MT',
            'MATO GROSSO DO SUL': 'MS',
            'MINAS GERAIS': 'MG',
            'PARA': 'PA',
            'PARAIBA': 'PB',
            'PARANA': 'PR',
            'PERNAMBUCO': 'PE',
            'PIAUI': 'PI',
            'RIO DE JANEIRO': 'RJ',
            'RIO GRANDE DO NORTE': 'RN',
            'RIO GRANDE DO SUL': 'RS',
            'RONDONIA': 'RO',
            'RORAIMA': 'RR',
            'SANTA CATARINA': 'SC',
            'SAO PAULO': 'SP',
            'SERGIPE': 'SE',
            'TOCANTINS': 'TO'
        };
        
        if (!estadoNome) return '';
        
        // Converter para maiúsculo e remover acentos
        const estadoNormalizado = estadoNome.toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        
        // Retornar sigla se encontrar, senão retornar valor normalizado (para debug)
        return estadoMap[estadoNormalizado] || estadoNome.toUpperCase();
    }

    setupCharts() {
        console.log('=== CONFIGURANDO GRÁFICOS ===');
        console.log('Chart disponível:', typeof Chart !== 'undefined');
        
        // Aguardar Chart.js carregar se necessário
        if (typeof Chart === 'undefined') {
            console.log('Chart.js não carregado ainda, aguardando...');
            setTimeout(() => {
                if (typeof Chart !== 'undefined') {
                    console.log('Chart.js carregado, configurando gráficos...');
                    this.setupTransportadoraChart();
                    this.setupPrazoChart();
                } else {
                    console.error('Chart.js não carregou após timeout');
                }
            }, 1000);
        } else {
            console.log('Chart.js já disponível, configurando gráficos...');
            this.setupTransportadoraChart();
            this.setupPrazoChart();
        }
    }

    async loadInitialData() {
        try {
            this.showLoading(true);
            
            // Carregar dados iniciais com quantidade otimizada
            const response = await fetch('/cidades/api/search?per_page=1000');
            const data = await response.json();
            
            this.currentData = data.cidades || [];
            this.totalRecords = data.total || 0;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
            
            console.log('=== DADOS INICIAIS CARREGADOS ===');
            console.log('Total de registros:', this.totalRecords);
            console.log('Registros carregados:', this.currentData.length);
            
            this.renderTable();
            this.updatePagination();
            this.populateFilters(data.transportadoras || [], data.estados || [], data.cidades_origem || []);
            
            // KPIs e gráficos serão alimentados pela API de KPIs
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showToast('Erro ao carregar dados', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadKPIs() {
        try {
            console.log('=== CARREGANDO KPIs ===');
            console.log('Filtros atuais:', this.filters);
            
            // Construir parâmetros de filtro
            const params = new URLSearchParams();
            if (this.filters.cidade) params.append('cidade', this.filters.cidade);
            if (this.filters.cidade_origem) params.append('cidade_origem', this.filters.cidade_origem);
            if (this.filters.transportadora) params.append('transportadora', this.filters.transportadora);
            if (this.filters.uf) params.append('uf', this.filters.uf);
            if (this.filters.prazo) params.append('prazo', this.filters.prazo);
            
            const url = `/cidades/api/kpis?${params.toString()}`;
            console.log('URL dos KPIs:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            console.log('=== DADOS DOS KPIs CARREGADOS ===');
            console.log('Filtros aplicados:', data.filtros_aplicados);
            console.log('Dados filtrados:', {
                total_cidades: data.total_cidades,
                total_transportadoras: data.total_transportadoras,
                total_estados: data.total_estados,
                prazo_medio: data.prazo_medio
            });
            console.log('Dados totais do banco:', data.dados_totais);
            
            // Armazenar dados dos KPIs
            this.kpiData = data;
            
        } catch (error) {
            console.error('Erro ao carregar dados dos KPIs:', error);
            // Fallback para dados da página atual
            this.kpiData = {
                total_cidades: this.currentData.length,
                total_transportadoras: new Set(this.currentData.map(c => c.transportadora)).size,
                total_estados: new Set(this.currentData.map(c => this.getStateSigla(c.estado_atendido))).size,
                prazo_medio: 0,
                dados_totais: {
                    total_cidades: this.currentData.length,
                    total_transportadoras: new Set(this.currentData.map(c => c.transportadora)).size,
                    total_estados: new Set(this.currentData.map(c => this.getStateSigla(c.estado_atendido))).size
                }
            };
        }
    }

    async handleCityInput() {
        const input = document.getElementById('inpCidade');
        const value = input.value.trim();
        const searchIndicator = document.getElementById('searchIndicator');
        
        if (value.length < 2) {
            this.hideSuggestions();
            if (searchIndicator) searchIndicator.classList.add('hidden');
            return;
        }

        // Mostrar indicador de busca
        if (searchIndicator) searchIndicator.classList.remove('hidden');

        try {
            const response = await fetch(`/cidades/api/suggestions?q=${encodeURIComponent(value)}`);
            const suggestions = await response.json();
            this.showSuggestions(suggestions);
        } catch (error) {
            console.error('Erro ao buscar sugestões:', error);
        } finally {
            if (searchIndicator) searchIndicator.classList.add('hidden');
        }
    }

    showSuggestions(suggestions) {
        const container = document.getElementById('cidadeSuggestions');
        if (!container) return;

        if (suggestions.length === 0) {
            container.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <div class="text-2xl mb-2">🔍</div>
                    <div class="text-sm">Nenhuma cidade encontrada</div>
                    <div class="text-xs text-gray-400 mt-1">Tente outro termo de busca</div>
                </div>
            `;
        } else {
            container.innerHTML = suggestions.map((suggestion, index) => `
                <div class="suggestion-item p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200 group" 
                     data-value="${suggestion.cidade_destino}">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                                ${this.highlightMatch(suggestion.cidade_destino, document.getElementById('inpCidade').value)}
                            </div>
                            <div class="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                <span class="flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path>
                                    </svg>
                                    ${this.getStateSigla(suggestion.estado_atendido)}
                                </span>
                                <span class="flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                                    </svg>
                                    ${suggestion.transportadora}
                                </span>
                                ${suggestion.prazo_entrega ? `
                                    <span class="flex items-center gap-1">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        ${suggestion.prazo_entrega} dias
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        <div class="text-gray-400 group-hover:text-blue-500 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        container.classList.remove('hidden');

        // Adicionar eventos aos itens
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.dataset.value;
                document.getElementById('inpCidade').value = value;
                this.hideSuggestions();
                this.applyFilters();
            });
        });
    }

    hideSuggestions() {
        const container = document.getElementById('cidadeSuggestions');
        if (container) {
            container.classList.add('hidden');
        }
    }

    highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    }

    async applyFilters() {
        console.log('=== APLICANDO FILTROS ===');
        this.filters.cidade = document.getElementById('inpCidade')?.value || '';
        this.filters.cidade_origem = document.getElementById('selCidadeOrigem')?.value || '';
        this.filters.transportadora = document.getElementById('selTransp')?.value || '';
        
        // Converter sigla do estado de volta para nome completo para busca no banco
        const ufSelecionada = document.getElementById('selUF')?.value || '';
        this.filters.uf = ufSelecionada ? this.getStateNomeCompleto(ufSelecionada) : '';
        
        this.filters.prazo = document.getElementById('selPrazo')?.value || '';
        
        console.log('Filtros capturados:', this.filters);
        console.log('UF selecionada:', ufSelecionada, '→ Convertida para:', this.filters.uf);
        
        this.updateFilterChips();
        this.currentPage = 1;
        await this.loadData();
        await this.loadKPIs(); // Recarregar KPIs com filtros aplicados
        this.updateKPIs();
        this.updateCharts(); // Atualizar gráficos com novos KPIs
        
        console.log('=== FILTROS APLICADOS ===');
    }

    updateFilterChips() {
        const container = document.getElementById('filterChips');
        if (!container) return;

        this.activeFilters.clear();

        // Adicionar filtros ativos
        if (this.filters.cidade) {
            this.activeFilters.set('cidade', { label: 'Cidade', value: this.filters.cidade, type: 'cidade', color: 'blue' });
        }
        if (this.filters.cidade_origem) {
            this.activeFilters.set('cidade_origem', { label: 'Origem', value: this.filters.cidade_origem, type: 'cidade_origem', color: 'green' });
        }
        if (this.filters.transportadora) {
            this.activeFilters.set('transportadora', { label: 'Transportadora', value: this.filters.transportadora, type: 'transportadora', color: 'yellow' });
        }
        if (this.filters.uf) {
            // Converter nome completo de volta para sigla para exibição no chip
            const ufSigla = this.getStateSigla(this.filters.uf);
            this.activeFilters.set('uf', { label: 'UF', value: ufSigla, type: 'uf', color: 'red' });
        }
        if (this.filters.prazo) {
            this.activeFilters.set('prazo', { label: 'Prazo', value: `≤ ${this.filters.prazo} dias`, type: 'prazo', color: 'purple' });
        }

        // Renderizar chips com design melhorado
        const chipsHtml = Array.from(this.activeFilters.values()).map(filter => {
            const colors = {
                blue: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
                green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
                yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
                red: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
                purple: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
            };
            
            return `
                <div class="filter-chip ${colors[filter.color]} px-3 py-2 rounded-full text-sm flex items-center gap-2 border transition-all duration-200 group cursor-pointer" 
                     onclick="cidadesManager.removeFilter('${filter.type}')">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-current rounded-full"></div>
                        <span class="font-medium">${filter.label}:</span>
                        <span>${filter.value}</span>
                    </div>
                    <svg class="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>
            `;
        }).join('');

        // Atualizar contador de resultados
        this.updateResultCounter();

        container.innerHTML = chipsHtml;
    }

    updateResultCounter() {
        const counter = document.getElementById('resultCounter');
        if (!counter) return;

        const activeCount = this.activeFilters.size;
        if (activeCount === 0) {
            counter.textContent = 'Pronto para buscar';
            counter.className = 'font-medium text-gray-600';
        } else {
            counter.textContent = `${activeCount} filtro${activeCount > 1 ? 's' : ''} ativo${activeCount > 1 ? 's' : ''}`;
            counter.className = 'font-medium text-blue-600';
        }
    }

    removeFilter(type) {
        switch (type) {
            case 'cidade':
                document.getElementById('inpCidade').value = '';
                break;
            case 'cidade_origem':
                document.getElementById('selCidadeOrigem').value = '';
                break;
            case 'transportadora':
                document.getElementById('selTransp').value = '';
                break;
            case 'uf':
                document.getElementById('selUF').value = '';
                break;
            case 'prazo':
                document.getElementById('selPrazo').value = '';
                break;
        }
        this.applyFilters();
    }

    async clearFilters() {
        console.log('=== LIMPANDO FILTROS ===');
        
        // Limpar campos de filtro
        const inpCidade = document.getElementById('inpCidade');
        const selCidadeOrigem = document.getElementById('selCidadeOrigem');
        const selTransp = document.getElementById('selTransp');
        const selUF = document.getElementById('selUF');
        const selPrazo = document.getElementById('selPrazo');

        if (inpCidade) inpCidade.value = '';
        if (selCidadeOrigem) selCidadeOrigem.value = '';
        // Atualizar transportadoras para mostrar todas quando limpar origem
        await this.updateTransportadorasByOrigem();
        if (selTransp) selTransp.value = '';
        if (selUF) selUF.value = '';
        if (selPrazo) selPrazo.value = '';

        // Limpar filtros internos
        this.filters = {
            cidade: '',
            cidade_origem: '',
            transportadora: '',
            uf: '',
            prazo: ''
        };

        this.updateFilterChips();
        this.currentPage = 1;
        
        // Recarregar dados (gráficos virão dos KPIs)
        await this.loadData();
        await this.loadKPIs(); // Recarregar KPIs sem filtros
        this.updateKPIs();
        this.updateCharts(); // Atualizar gráficos com novos KPIs
        
        console.log('=== FILTROS LIMPOS ===');
    }


    async loadData() {
        try {
            this.showLoading(true);
            
            // Carregar dados da tabela com paginação normal
            const params = new URLSearchParams({
                page: this.currentPage,
                per_page: this.pageSize,
                ...this.filters
            });

            if (this.sortColumn) {
                params.append('sort', this.sortColumn);
                params.append('direction', this.sortDirection);
            }

            console.log('Carregando dados com parâmetros:', params.toString());

            const response = await fetch(`/cidades/api/search?${params}`);
            const data = await response.json();
            
            this.currentData = data.cidades || [];
            this.totalRecords = data.total || 0;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
            
            console.log('Dados carregados:', {
                registros: this.currentData.length,
                total: this.totalRecords,
                filtros: this.filters
            });
              this.renderTable();
            this.updatePagination();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showToast('Erro ao carregar dados', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderTable() {
        const tbody = document.getElementById('tbRows');
        if (!tbody) return;

        // DEBUG: Log para verificar quantos registros estão sendo renderizados
        console.log('=== RENDER TABLE ===');
        console.log('Total de registros para renderizar:', this.currentData.length);
        console.log('Registros:', this.currentData.map(c => c.transportadora));

        if (this.currentData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-12 text-gray-500">
                        <div class="text-6xl mb-4">🔍</div>
                        <div class="text-xl font-medium mb-2">Nenhuma cidade encontrada</div>
                        <div class="text-sm">Tente ajustar os filtros de busca</div>
                        <button onclick="cidadesManager.clearFilters()" class="mt-4 btn-outline text-sm">
                            Limpar Filtros
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.currentData.map((cidade, index) => `
            <tr class="border-b border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200 group" data-index="${index}" data-transportadora="${cidade.transportadora}">
                <td class="py-4 px-6">
                    <input type="checkbox" data-row-id="${cidade.id || cidade.cidade_destino}" 
                           class="rounded border-gray-300 text-red-600 focus:ring-red-500"
                           onchange="cidadesManager.toggleRowSelection(this)">
                </td>
                <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            ${cidade.transportadora?.charAt(0) || '?'}
                        </div>
                        <div class="font-medium text-gray-700 group-hover:text-gray-800 transition-colors">
                            ${cidade.transportadora || '-'}
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6 text-gray-600">${cidade.cidade_origem || '-'}</td>
                <td class="py-4 px-6">
                    <div class="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                        ${cidade.cidade_destino || '-'}
                    </div>
                </td>
                <td class="py-4 px-6">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ${this.getStateSigla(cidade.estado_atendido) || '-'}
                    </span>
                </td>
                <td class="py-4 px-6">
                    ${cidade.prazo_entrega ? 
                        `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getPrazoColor(cidade.prazo_entrega)}">
                            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                            </svg>
                            ${cidade.prazo_entrega} dias
                        </span>` : 
                        '<span class="text-gray-400">-</span>'
                    }
                </td>
                <td class="py-4 px-6 text-gray-600">${cidade.pais || 'Brasil'}</td>
            </tr>
        `).join('');
        
        // DEBUG: Verificar quantas linhas foram inseridas no DOM
        console.log('Linhas inseridas no DOM:', tbody.querySelectorAll('tr').length);
    }

    getPrazoColor(prazo) {
        if (prazo <= 2) return 'bg-gray-100 text-gray-800'; // #E8E8E8 background, #4A4A4A text
        if (prazo <= 5) return 'bg-yellow-100 text-yellow-800'; // #D0B580 inspired
        if (prazo <= 7) return 'bg-orange-100 text-orange-800'; // Warning
        return 'bg-red-100 text-red-800'; // #ED1C24 inspired
    }

    updatePagination() {
        const lblFrom = document.getElementById('lblFrom');
        const lblTo = document.getElementById('lblTo');
        const lblTotal = document.getElementById('lblTotal');
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        const pageInfo = document.getElementById('pageInfo');

        const from = this.currentPage === 1 ? 1 : (this.currentPage - 1) * this.pageSize + 1;
        const to = Math.min(this.currentPage * this.pageSize, this.totalRecords);

        if (lblFrom) lblFrom.textContent = from;
        if (lblTo) lblTo.textContent = to;
        if (lblTotal) lblTotal.textContent = this.totalRecords.toLocaleString();
        if (pageInfo) pageInfo.textContent = `${this.currentPage} / ${this.totalPages}`;

        if (btnPrev) {
            btnPrev.disabled = this.currentPage === 1;
            btnPrev.classList.toggle('opacity-50', this.currentPage === 1);
        }

        if (btnNext) {
            btnNext.disabled = this.currentPage === this.totalPages;
            btnNext.classList.toggle('opacity-50', this.currentPage === this.totalPages);
        }
    }

    updateKPIs() {
        console.log('=== ATUALIZANDO KPIs ===');
        console.log('Dados atuais:', {
            currentData: this.currentData.length,
            kpiData: this.kpiData
        });
        
        // Usar dados dos KPIs se disponíveis, senão usar dados atuais
        const totalCidades = this.kpiData?.total_cidades || this.currentData.length;
        const totalTransportadoras = this.kpiData?.total_transportadoras || new Set(this.currentData.map(c => c.transportadora)).size;
        const totalEstados = this.kpiData?.total_estados || new Set(this.currentData.map(c => this.getStateSigla(c.estado_atendido))).size;
        const prazoMedio = this.kpiData?.prazo_medio || 0;
        const dadosTotais = this.kpiData?.dados_totais;
        const filtrosAplicados = this.kpiData?.filtros_aplicados;

        console.log('KPIs calculados:', {
            totalCidades,
            totalTransportadoras,
            totalEstados,
            prazoMedio,
            filtrosAplicados
        });

        // Atualizar elementos com animação
        console.log('Atualizando elementos...');
        this.animateCounter('kpiTotal', totalCidades);
        this.animateCounter('kpiTransp', totalTransportadoras);
        this.animateCounter('kpiEstados', totalEstados);
        
        const kpiPrazo = document.getElementById('kpiPrazo');
        if (kpiPrazo) {
            kpiPrazo.textContent = prazoMedio;
            console.log('Prazo atualizado:', prazoMedio);
        }

        // Atualizar total de estados disponíveis
        const kpiEstadosTotal = document.getElementById('kpiEstadosTotal');
        if (kpiEstadosTotal) {
            const totalDisponivel = dadosTotais?.total_estados || totalEstados;
            kpiEstadosTotal.textContent = `Total disponível: ${totalDisponivel}`;
            console.log('Total estados disponível:', totalDisponivel);
        }

        // Atualizar textos descritivos com informações de filtros
        this.updateKPIDescriptions(filtrosAplicados);

        // Atualizar barras de progresso
        this.updateProgressBars();
        
        console.log('=== KPIs ATUALIZADOS ===');
    }

    updateKPIDescriptions(filtrosAplicados = {}) {
        const kpiTotalChange = document.getElementById('kpiTotalChange');
        const kpiTranspChange = document.getElementById('kpiTranspChange');
        const kpiEstadosChange = document.getElementById('kpiEstadosChange');

        // Verificar se há filtros aplicados
        const temFiltros = Object.values(filtrosAplicados).some(valor => valor && valor.trim() !== '');
        const transportadoras = new Set(this.currentData.map(c => c.transportadora)).size;
        const estados = new Set(this.currentData.map(c => this.getStateSigla(c.estado_atendido))).size;

        if (kpiTotalChange) {
            if (temFiltros) {
                const filtrosTexto = [];
                if (filtrosAplicados.cidade_origem) filtrosTexto.push(`origem: ${filtrosAplicados.cidade_origem}`);
                if (filtrosAplicados.transportadora) filtrosTexto.push(`transportadora: ${filtrosAplicados.transportadora}`);
                if (filtrosAplicados.uf) filtrosTexto.push(`estado: ${filtrosAplicados.uf}`);
                if (filtrosAplicados.cidade) filtrosTexto.push(`destino: ${filtrosAplicados.cidade}`);
                
                kpiTotalChange.textContent = filtrosTexto.length > 0 ? `Filtrado por: ${filtrosTexto.join(', ')}` : 'Cidades únicas atendidas';
                kpiTotalChange.className = 'text-xs text-blue-600 mt-1 font-medium';
            } else {
                kpiTotalChange.textContent = 'Cidades únicas atendidas';
                kpiTotalChange.className = 'text-xs text-gray-500 mt-1';
            }
        }

        if (kpiTranspChange) {
            if (temFiltros) {
                kpiTranspChange.textContent = 'Transportadora encontrada';
                kpiTranspChange.className = 'text-xs text-yellow-600 mt-1 font-medium';
            } else {
                kpiTranspChange.textContent = 'Transportadoras ativas';
                kpiTranspChange.className = 'text-xs text-yellow-500 mt-1';
            }
        }

        if (kpiEstadosChange) {
            if (temFiltros) {
                kpiEstadosChange.textContent = 'Estados com dados';
                kpiEstadosChange.className = 'text-xs text-blue-600 mt-1 font-medium';
            } else {
                kpiEstadosChange.textContent = 'Estados com cobertura';
                kpiEstadosChange.className = 'text-xs text-blue-500 mt-1';
            }
        }
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Se o elemento contém "—", começar do zero
        const startValue = element.textContent === '—' ? 0 : (parseInt(element.textContent.replace(/[^\d]/g, '')) || 0);
        const duration = 1000;
        const increment = (targetValue - startValue) / (duration / 16);
        let currentValue = startValue;

        const timer = setInterval(() => {
            currentValue += increment;
            if ((increment > 0 && currentValue >= targetValue) || (increment < 0 && currentValue <= targetValue)) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentValue).toLocaleString();
        }, 16);
    }

    updateProgressBars() {
        const hasFilters = this.activeFilters.size > 0;
        
        // Usar dados dos KPIs se disponíveis
        const totalCidades = this.kpiData?.total_cidades || this.currentData.length;
        const totalTransportadoras = this.kpiData?.total_transportadoras || new Set(this.currentData.map(c => c.transportadora)).size;
        const totalEstados = this.kpiData?.total_estados || new Set(this.currentData.map(c => this.getStateSigla(c.estado_atendido))).size;

        // Valores máximos para cálculo de percentual
        const maxTotal = hasFilters ? Math.max(totalCidades * 2, 100) : totalCidades;
        const maxTransp = Math.max(totalTransportadoras, 10);
        const maxEstados = Math.max(totalEstados, 10);

        // Animar barras de progresso
        this.animateProgressBar('kpiTotalBar', (totalCidades / maxTotal) * 100);
        this.animateProgressBar('kpiTranspBar', (totalTransportadoras / maxTransp) * 100);
        this.animateProgressBar('kpiEstadosBar', (totalEstados / maxEstados) * 100);
    }

    animateProgressBar(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (!element) return;

        setTimeout(() => {
            element.style.width = `${Math.min(percentage, 100)}%`;
        }, 100);
    }

    setupTransportadoraChart() {
        const ctx = document.getElementById('transportadoraChart');
        if (!ctx) return;

        this.charts.transportadora = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    setupPrazoChart() {
        const ctx = document.getElementById('prazoChart');
        if (!ctx) return;

        this.charts.prazo = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Prazo Médio (dias)',
                    data: [],
                    backgroundColor: '#ED1C24',
                    borderColor: '#2E3440',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + ' dias';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    updateCharts() {
        console.log('=== ATUALIZANDO GRÁFICOS ===');
        console.log('Charts disponíveis:', {
            transportadora: !!this.charts.transportadora,
            prazo: !!this.charts.prazo
        });
        
        if (!this.charts.transportadora || !this.charts.prazo) {
            console.log('Gráficos não inicializados ainda');
            return;
        }

        // Verificar se há filtros ativos (verificando também os campos do formulário)
        const inpCidade = document.getElementById('inpCidade');
        const selCidadeOrigem = document.getElementById('selCidadeOrigem');
        const selTransp = document.getElementById('selTransp');
        const selUF = document.getElementById('selUF');
        const selPrazo = document.getElementById('selPrazo');
        
        const hasFiltersInForm = (inpCidade && inpCidade.value.trim()) ||
                                 (selCidadeOrigem && selCidadeOrigem.value) ||
                                 (selTransp && selTransp.value) ||
                                 (selUF && selUF.value) ||
                                 (selPrazo && selPrazo.value);
        
        const hasFiltersInObject = Object.keys(this.filters).some(
            key => this.filters[key] && this.filters[key].toString().trim() !== ''
        );
        
        const hasFilters = hasFiltersInForm || hasFiltersInObject;
        
        // Usar dados agregados do KPI (mais eficiente que processar arrays grandes)
        const kpiDistrib = this.kpiData?.distribuicao_transportadoras || [];
        const kpiPrazos = this.kpiData?.prazos_regiao || [];

        console.log('📊 Dados KPI disponíveis:', {
            transportadoras: kpiDistrib.length,
            prazos_regiao: kpiPrazos.length
        });

        // Atualizar gráfico de transportadoras
        if (kpiDistrib.length === 0) {
            this.charts.transportadora.data.labels = ['Sem dados'];
            this.charts.transportadora.data.datasets[0].data = [1];
            this.charts.transportadora.data.datasets[0].backgroundColor = ['#E8E8E8'];
        } else {
            const transpLabels = kpiDistrib.map(item => item.transportadora);
            const transpValues = kpiDistrib.map(item => item.total);
            
            const baseColors = ['#ED1C24', '#2E3440', '#D0B580', '#4A4A4A', '#E8E8E8', '#FFFFFF'];
            const colors = transpLabels.map((_, i) => baseColors[i % baseColors.length]);

            this.charts.transportadora.data.labels = transpLabels;
            this.charts.transportadora.data.datasets[0].data = transpValues;
            this.charts.transportadora.data.datasets[0].backgroundColor = colors;
            
            console.log('✅ Gráfico transportadoras:', transpLabels.length, 'itens');
        }

        this.charts.transportadora.update();

        // Atualizar gráfico de prazos por região
        if (kpiPrazos.length === 0) {
            this.charts.prazo.data.labels = ['Sem dados'];
            this.charts.prazo.data.datasets[0].data = [0];
        } else {
            const prazoLabels = kpiPrazos.map(item => this.getStateSigla(item.uf));
            const prazoValues = kpiPrazos.map(item => item.prazo_medio);

            this.charts.prazo.data.labels = prazoLabels;
            this.charts.prazo.data.datasets[0].data = prazoValues;
            
            console.log('✅ Gráfico prazos:', prazoLabels.length, 'estados');
        }

        this.charts.prazo.update();
        console.log('=== GRÁFICOS ATUALIZADOS ===');
    }

    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Atualizar indicadores visuais
        document.querySelectorAll('.th-sort').forEach(th => {
            th.classList.remove('text-blue-600', 'bg-blue-50');
            const icon = th.querySelector('.sort-icon');
            if (icon) icon.remove();
        });

        const activeTh = document.querySelector(`[data-key="${column}"]`);
        if (activeTh) {
            activeTh.classList.add('text-blue-600', 'bg-blue-50');
            const icon = document.createElement('span');
            icon.className = 'sort-icon ml-1';
            icon.textContent = this.sortDirection === 'asc' ? '↑' : '↓';
            activeTh.appendChild(icon);
        }

        this.loadData();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadData();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadData();
        }
    }

    async updateTransportadorasByOrigem() {
        const selCidadeOrigem = document.getElementById('selCidadeOrigem');
        const selTransp = document.getElementById('selTransp');
        
        if (!selCidadeOrigem || !selTransp) return;
        
        const cidadeOrigem = selCidadeOrigem.value;
        
        try {
            // Construir URL com parâmetro cidade_origem se houver
            let url = '/api/cidades-transportadoras';
            if (cidadeOrigem) {
                url += `?cidade_origem=${encodeURIComponent(cidadeOrigem)}`;
            }
            
            const response = await fetch(url);
            const transportadoras = await response.json();
            
            // Salvar o valor atual selecionado
            const valorAnterior = selTransp.value;
            
            // Atualizar dropdown
            selTransp.innerHTML = '<option value="">Todas</option>' + 
                transportadoras.map(t => `<option value="${t}">${t}</option>`).join('');
            
            // Restaurar valor selecionado se ainda existir nas novas opções
            if (valorAnterior && transportadoras.includes(valorAnterior)) {
                selTransp.value = valorAnterior;
            } else {
                selTransp.value = '';
            }
        } catch (error) {
            console.error('Erro ao atualizar transportadoras:', error);
        }
    }

    populateFilters(transportadoras, estados, cidades_origem) {
        const selTransp = document.getElementById('selTransp');
        const selUF = document.getElementById('selUF');
        const selCidadeOrigem = document.getElementById('selCidadeOrigem');

        if (selTransp) {
            selTransp.innerHTML = '<option value="">Todas</option>' + 
                transportadoras.map(t => `<option value="${t}">${t}</option>`).join('');
        }

        if (selUF) {
            // Converter estados para siglas e remover duplicatas
            const estadosUnicos = [...new Set(estados.map(e => this.getStateSigla(e)))].sort();
            selUF.innerHTML = '<option value="">Todas</option>' + 
                estadosUnicos.map(e => `<option value="${e}">${e}</option>`).join('');
        }

        if (selCidadeOrigem) {
            selCidadeOrigem.innerHTML = '<option value="">Todas</option>' + 
                cidades_origem.map(co => `<option value="${co}">${co}</option>`).join('');
        }
    }

    showExportModal() {
        // Criar modal de exportação
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <span class="text-green-500">📤</span>
                        Exportar Dados
                    </h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <p class="text-gray-600 mb-4">Escolha o formato para exportar os dados filtrados:</p>
                    <div class="space-y-3">
                        <button onclick="cidadesManager.exportData('csv')" class="w-full btn-outline flex items-center justify-center gap-2 py-3">
                            <span class="text-green-500">📊</span>
                            Exportar como CSV
                        </button>
                        <button onclick="cidadesManager.exportData('excel')" class="w-full btn-outline flex items-center justify-center gap-2 py-3">
                            <span class="text-blue-500">📈</span>
                            Exportar como Excel
                        </button>
                        <button onclick="cidadesManager.exportData('json')" class="w-full btn-outline flex items-center justify-center gap-2 py-3">
                            <span class="text-purple-500">📋</span>
                            Exportar como JSON
                        </button>
                    </div>
                    <div class="mt-4 text-xs text-gray-500">
                        Total de registros: <span class="font-semibold">${this.totalRecords.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async exportData(format) {
        try {
            this.showToast('Preparando exportação...', 'info');
            
            const params = new URLSearchParams({
                format: format,
                ...this.filters
            });

            const response = await fetch(`/cidades/api/export?${params}`);
            
            if (!response.ok) {
                throw new Error('Erro na exportação');
            }

            // Criar link de download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cidades_atendidas.${format === 'excel' ? 'xlsx' : format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showToast(`Exportação ${format.toUpperCase()} concluída!`, 'success');
            
            // Fechar modal
            document.querySelector('.fixed.inset-0')?.remove();
            
        } catch (error) {
            console.error('Erro na exportação:', error);
            this.showToast(`Erro na exportação: ${error.message}`, 'error');
        }
    }

    showMapModal() {
        const modal = document.getElementById('mapModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.loadMap();
        }
    }

    hideMapModal() {
        const modal = document.getElementById('mapModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    loadMap() {
        // Implementar mapa interativo
        const container = document.getElementById('mapContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center text-gray-500">
                    <div class="text-6xl mb-4">🗺️</div>
                    <div class="text-xl font-medium mb-2">Mapa Interativo</div>
                    <div class="text-sm">Mostrando ${this.currentData.length} cidades atendidas</div>
                    <div class="mt-4 text-xs text-gray-400">
                        Funcionalidade em desenvolvimento
                    </div>
                </div>
            `;
        }
    }

    async importData() {
        const btnImport = document.getElementById('btnImport');
        const icnSpin = document.getElementById('icnSpin');
        const importMsg = document.getElementById('importMsg');

        if (!btnImport || !icnSpin || !importMsg) return;

        try {
            btnImport.disabled = true;
            icnSpin.style.display = 'inline-block';
            importMsg.textContent = 'Importando dados...';
            importMsg.className = 'ml-2 text-sm text-blue-600';

            const response = await fetch('/cidades/api/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (response.ok) {
                importMsg.textContent = `✅ ${result.imported} registros importados com sucesso!`;
                importMsg.className = 'ml-2 text-sm text-green-600';
                
                this.showToast(`Importação concluída: ${result.imported} registros`, 'success');
                
                // Recarregar dados
                setTimeout(() => {
                    this.loadInitialData();
                    importMsg.textContent = '';
                }, 2000);
            } else {
                throw new Error(result.error || 'Erro na importação');
            }

        } catch (error) {
            console.error('Erro na importação:', error);
            importMsg.textContent = `❌ Erro: ${error.message}`;
            importMsg.className = 'ml-2 text-sm text-red-600';
            this.showToast(`Erro na importação: ${error.message}`, 'error');
        } finally {
            btnImport.disabled = false;
            icnSpin.style.display = 'none';
            
            setTimeout(() => {
                importMsg.textContent = '';
            }, 5000);
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.toggle('hidden', !show);
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        const colors = {
            success: 'bg-green-100 border-green-400 text-green-700',
            error: 'bg-red-100 border-red-400 text-red-700',
            warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
            info: 'bg-blue-100 border-blue-400 text-blue-700'
        };

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.className = `${colors[type]} border px-4 py-3 rounded shadow-lg transform transition-all duration-300 translate-x-full`;
        toast.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">${icons[type]}</span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 hover:opacity-75">×</button>
            </div>
        `;
        
        container.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        // Remover após 5 segundos
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Função para alternar seleção de linha individual
    toggleRowSelection(checkbox) {
        const rowId = checkbox.dataset.rowId;
        if (checkbox.checked) {
            this.selectedItems.add(rowId);
        } else {
            this.selectedItems.delete(rowId);
        }
        this.updateBulkActionsBar();
    }

    // Função para mostrar modal de salvar filtro
    showSaveFilterModal() {
        const name = prompt('Digite um nome para o filtro:');
        if (name && name.trim()) {
            this.saveFilter(name.trim());
        }
    }

    // Função para selecionar/deselecionar todos os itens
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-row-id]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            if (checked) {
                this.selectedItems.add(checkbox.dataset.rowId);
            } else {
                this.selectedItems.delete(checkbox.dataset.rowId);
            }
        });
        this.updateBulkActionsBar();
    }

    // Função para atualizar barra de ações em massa
    updateBulkActionsBar() {
        const bar = document.getElementById('bulkActionsBar');
        const count = document.getElementById('selectedCount');
        
        if (this.selectedItems.size > 0) {
            if (bar) bar.classList.remove('hidden');
            if (count) count.textContent = this.selectedItems.size;
        } else {
            if (bar) bar.classList.add('hidden');
        }
    }

    // Função para exportar itens selecionados
    exportSelected() {
        if (this.selectedItems.size === 0) {
            this.showToast('Nenhum item selecionado!', 'warning');
            return;
        }
        
        const selectedData = this.currentData.filter(item => 
            this.selectedItems.has(item.id?.toString())
        );
        
        this.exportToExcel(selectedData, `cidades_selecionadas_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.showToast(`${this.selectedItems.size} itens exportados!`, 'success');
    }

    // Função para limpar seleção
    clearSelection() {
        this.selectedItems.clear();
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateBulkActionsBar();
        this.showToast('Seleção limpa!', 'info');
    }

    // Função para mostrar modal de exportação
    showExportModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Exportar Dados</h3>
                <div class="space-y-3">
                    <button onclick="cidadesManager.exportToExcel(cidadesManager.currentData, 'cidades_atendidas.xlsx')" 
                            class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Exportar Excel
                    </button>
                    <button onclick="cidadesManager.exportToPDF()" 
                            class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                        Exportar PDF
                    </button>
                    <button onclick="cidadesManager.exportToCSV()" 
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Exportar CSV
                    </button>
                </div>
                <div class="mt-4 flex justify-end">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Função para exportar para PDF
    exportToPDF() {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            this.showToast('Biblioteca PDF não carregada!', 'error');
            return;
        }

        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(20);
        doc.text('Relatório de Cidades Atendidas', 20, 20);
        
        // Data de geração
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
        
        // Dados dos KPIs
        doc.setFontSize(12);
        doc.text('Resumo dos KPIs:', 20, 45);
        
        const kpiData = [
            ['Total de Registros:', document.getElementById('kpiTotal')?.textContent || '—'],
            ['Transportadoras:', document.getElementById('kpiTransp')?.textContent || '—'],
            ['Estados Atendidos:', document.getElementById('kpiEstados')?.textContent || '—'],
            ['Prazo Médio:', document.getElementById('kpiPrazo')?.textContent || '—']
        ];
        
        doc.autoTable({
            startY: 55,
            head: [['Métrica', 'Valor']],
            body: kpiData,
            theme: 'grid',
            headStyles: { fillColor: [237, 28, 36] }
        });
        
        // Dados da tabela
        const tableData = this.currentData.map(cidade => [
            cidade.transportadora || '-',
            cidade.cidade_origem || '-',
            cidade.cidade_destino || '-',
            this.getStateSigla(cidade.estado_atendido) || '-',
            cidade.prazo_entrega || '-'
        ]);
        
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Transportadora', 'Origem', 'Destino', 'Estado', 'Prazo']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [237, 28, 36] },
            styles: { fontSize: 8 }
        });
        
        // Salvar arquivo
        doc.save(`cidades_atendidas_${new Date().toISOString().split('T')[0]}.pdf`);
        this.showToast('PDF exportado com sucesso!', 'success');
        
        // Fechar modal
        document.querySelector('.fixed')?.remove();
    }

    // Função para exportar para CSV
    exportToCSV() {
        const headers = ['Transportadora', 'Cidade Origem', 'Cidade Destino', 'Estado', 'Prazo'];
        const csvContent = [
            headers.join(','),
            ...this.currentData.map(cidade => [
                `"${cidade.transportadora || ''}"`,
                `"${cidade.cidade_origem || ''}"`,
                `"${cidade.cidade_destino || ''}"`,
                `"${this.getStateSigla(cidade.estado_atendido) || ''}"`,
                cidade.prazo_entrega || ''
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `cidades_atendidas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('CSV exportado com sucesso!', 'success');
        document.querySelector('.fixed')?.remove();
    }

    // Função para keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + F - Focar no campo de busca
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('inpCidade')?.focus();
        }
        
        // Ctrl/Cmd + S - Salvar filtro atual
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.showSaveFilterModal();
        }
        
        // Ctrl/Cmd + E - Exportar dados
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.showExportModal();
        }
        
        // Ctrl/Cmd + D - Alternar dark mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.toggleDarkMode();
        }
        
        // Escape - Limpar filtros
        if (e.key === 'Escape') {
            this.clearFilters();
        }
    }

    updateLastUpdateTime() {
        const element = document.getElementById('ultimaAtualizacao');
        if (element) {
            const now = new Date();
            element.textContent = `Última atualização: ${now.toLocaleTimeString('pt-BR')}`;
        }
    }
}

// Função utilitária para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.cidadesManager = new CidadesManager();
});

// Adicionar estilos para loading e animações
const style = document.createElement('style');
style.textContent = `
    .icon-rotate {
        animation: spin 1s linear infinite;
        display: inline-block;
    }
    
    .spinner {
        width: 24px;
        height: 24px;
        border: 3px solid #f3f4f6;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    
    .th-sort {
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
    }
    
    .th-sort:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }
    
    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        color: #6b7280;
    }
    
    .filter-chip {
        transition: all 0.2s ease;
        transform: scale(1);
    }
    
    .filter-chip:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .suggestion-item {
        transition: all 0.2s ease;
    }
    
    .suggestion-item:hover {
        background-color: #f9fafb;
        transform: translateX(4px);
    }
    
    /* Animações personalizadas */
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
    }
    
    .animate-slideIn {
        animation: slideIn 0.3s ease-out;
    }
    
    .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    /* Efeitos de hover melhorados */
    .hover-lift {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .hover-lift:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    
    /* Gradientes personalizados */
    .gradient-text {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    /* Efeitos de glassmorphism */
    .glass-effect {
        background: rgba(255, 255, 255, 0.25);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.18);
    }
    
    /* Animações de entrada para elementos */
    .stagger-animation > * {
        animation: fadeIn 0.5s ease-out forwards;
        opacity: 0;
    }
    
    .stagger-animation > *:nth-child(1) { animation-delay: 0.1s; }
    .stagger-animation > *:nth-child(2) { animation-delay: 0.2s; }
    .stagger-animation > *:nth-child(3) { animation-delay: 0.3s; }
    .stagger-animation > *:nth-child(4) { animation-delay: 0.4s; }
    .stagger-animation > *:nth-child(5) { animation-delay: 0.5s; }
    .stagger-animation > *:nth-child(6) { animation-delay: 0.6s; }
`;
document.head.appendChild(style);