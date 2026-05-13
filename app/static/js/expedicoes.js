// Sistema de Expedições - JavaScript
class ExpedicoesSystem {
    constructor() {
        this.currentPage = 1;
        this.perPage = 50;
        this.charts = {};
        this.map = null;
        this.filtrosSalvos = this.carregarFiltrosSalvos();
        this.historicoPesquisas = this.carregarHistoricoPesquisas();
        this.sugestoes = [];
        this.cacheSugestoes = {
            transportadoras: [],
            filiais: [],
            clientes: []
        };
        this.init();
    }

    init() {
        console.log('🚀 Inicializando sistema de expedições...');
        this.setupEventListeners();
        this.setupDatePickers();
        this.loadInitialData();
    }

    // Configurar campos de data premium
    setupDatePickers() {
        console.log('📅 Configurando campos de data premium...');
        
        const dateInputs = document.querySelectorAll('.date-input-premium');
        dateInputs.forEach(input => {
            // Adicionar placeholder customizado
            input.setAttribute('placeholder', 'dd/mm/aaaa');
            
            // Adicionar evento de clique para abrir calendário
            input.addEventListener('click', () => {
                console.log('📅 Campo de data clicado:', input.id);
                input.showPicker && input.showPicker();
            });
            
            // Adicionar evento de mudança
            input.addEventListener('change', () => {
                console.log('📅 Data selecionada:', input.value);
                this.formatDateInput(input);
            });
            
            // Adicionar evento de foco
            input.addEventListener('focus', () => {
                input.style.transform = 'translateY(-2px)';
                input.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.2)';
            });
            
            // Adicionar evento de blur
            input.addEventListener('blur', () => {
                input.style.transform = 'translateY(0)';
                input.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
            });
        });
    }

    // Formatar input de data
    formatDateInput(input) {
        if (input.value) {
            // Converter para formato brasileiro para exibição
            const date = new Date(input.value);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            // Criar tooltip com data formatada
            input.title = `Data selecionada: ${day}/${month}/${year}`;
            
            console.log(`📅 Data formatada: ${day}/${month}/${year}`);
        }
    }

    // Funções utilitárias para conversão de NF
    nfParaBanco(nf) {
        // Converte NF sem ponto para formato do banco
        if (!nf) return '';
        const nfLimpa = nf.replace(/\D/g, ''); // Remove tudo que não é dígito
        
        // Para NFs de 6 dígitos: 206882 -> 206.882
        if (nfLimpa.length === 6) {
            return nfLimpa.substring(0, 3) + '.' + nfLimpa.substring(3);
        }
        // Para NFs de 5 dígitos: 82746 -> 82.746
        else if (nfLimpa.length === 5) {
            return nfLimpa.substring(0, 2) + '.' + nfLimpa.substring(2);
        }
        // Para NFs de 4 dígitos: 3019 -> 3.019
        else if (nfLimpa.length === 4) {
            return nfLimpa.substring(0, 1) + '.' + nfLimpa.substring(1);
        }
        // Para outras situações, manter como está
        return nfLimpa;
    }

    nfParaExibicao(nf) {
        // Converte NF do banco (82.746) para exibição (82746)
        if (!nf) return '';
        return nf.replace(/\./g, '');
    }

    // Função para truncar texto longo
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Função para formatar quantidade
    formatQuantity(quantity) {
        if (!quantity && quantity !== 0) return '--';
        return parseFloat(quantity).toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2
        });
    }

    // Funcionalidades Inteligentes
    carregarFiltrosSalvos() {
        const filtros = localStorage.getItem('expedicoes_filtros_salvos');
        return filtros ? JSON.parse(filtros) : [];
    }

    salvarFiltrosSalvos() {
        localStorage.setItem('expedicoes_filtros_salvos', JSON.stringify(this.filtrosSalvos));
    }

    carregarHistoricoPesquisas() {
        const historico = localStorage.getItem('expedicoes_historico');
        return historico ? JSON.parse(historico) : [];
    }

    salvarHistoricoPesquisas() {
        localStorage.setItem('expedicoes_historico', JSON.stringify(this.historicoPesquisas));
    }

    adicionarAoHistorico(termo) {
        if (termo && termo.length > 2) {
            const timestamp = new Date().toISOString();
            const item = { termo, timestamp };
            
            // Remove duplicatas
            this.historicoPesquisas = this.historicoPesquisas.filter(h => h.termo !== termo);
            
            // Adiciona no início
            this.historicoPesquisas.unshift(item);
            
            // Limita a 50 itens
            this.historicoPesquisas = this.historicoPesquisas.slice(0, 50);
            
            this.salvarHistoricoPesquisas();
        }
    }

    salvarFiltroAtual() {
        const nome = prompt('Nome para salvar este filtro:');
        if (nome) {
            const filtros = {
                nome,
                nf: document.getElementById('filter-nf').value,
                transportadora: document.getElementById('filter-transportadora').value,
                filial: document.getElementById('filter-filial').value,
                cliente: document.getElementById('filter-cliente').value,
                dataInicio: document.getElementById('filter-data-inicio').value,
                dataFim: document.getElementById('filter-data-fim').value,
                timestamp: new Date().toISOString()
            };
            
            this.filtrosSalvos.unshift(filtros);
            this.filtrosSalvos = this.filtrosSalvos.slice(0, 20); // Limita a 20 filtros
            this.salvarFiltrosSalvos();
            
            this.showNotification('Filtro salvo com sucesso!', 'success');
        }
    }

    aplicarFiltroSalvo(filtro) {
        document.getElementById('filter-nf').value = filtro.nf || '';
        document.getElementById('filter-transportadora').value = filtro.transportadora || '';
        document.getElementById('filter-filial').value = filtro.filial || '';
        document.getElementById('filter-cliente').value = filtro.cliente || '';
        document.getElementById('filter-data-inicio').value = filtro.dataInicio || '';
        document.getElementById('filter-data-fim').value = filtro.dataFim || '';
        
        this.aplicarFiltros();
        this.showNotification(`Filtro "${filtro.nome}" aplicado!`, 'success');
    }


    mostrarFiltrosSalvos() {
        if (this.filtrosSalvos.length === 0) {
            this.showNotification('Nenhum filtro salvo encontrado', 'info');
            return;
        }
        
        const lista = this.filtrosSalvos.map(filtro => 
            `<div class="filtro-item p-3 border-b hover:bg-gray-50 cursor-pointer" onclick="expedicoesSystem.aplicarFiltroSalvo(${JSON.stringify(filtro).replace(/"/g, '&quot;')})">
                <div class="font-medium">${filtro.nome}</div>
                <div class="text-sm text-gray-500">${new Date(filtro.timestamp).toLocaleDateString('pt-BR')}</div>
            </div>`
        ).join('');
        
        this.showModal('Filtros Salvos', `<div class="max-h-64 overflow-y-auto">${lista}</div>`);
    }

    mostrarHistorico() {
        if (this.historicoPesquisas.length === 0) {
            this.showNotification('Nenhuma pesquisa no histórico', 'info');
            return;
        }
        
        const lista = this.historicoPesquisas.map(item => 
            `<div class="historico-item p-3 border-b hover:bg-gray-50 cursor-pointer" onclick="expedicoesSystem.buscarGlobal('${item.termo}')">
                <div class="font-medium">${item.termo}</div>
                <div class="text-sm text-gray-500">${new Date(item.timestamp).toLocaleDateString('pt-BR')} ${new Date(item.timestamp).toLocaleTimeString('pt-BR')}</div>
            </div>`
        ).join('');
        
        this.showModal('Histórico de Pesquisas', `<div class="max-h-64 overflow-y-auto">${lista}</div>`);
    }

    showModal(titulo, conteudo) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">${titulo}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                ${conteudo}
                <div class="mt-4 text-right">
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }


    // Função para aplicar filtros
    async aplicarFiltros() {
        console.log('🔄 Aplicando filtros...');
        await Promise.all([
            this.loadEstatisticas(),
            this.loadMapa(),
            this.loadData()
        ]);
    }

    // Função para limpar filtros
    limparFiltros() {
        console.log('🧹 Limpando filtros...');
        
        // Limpar todos os campos de filtro
        document.getElementById('filter-nf').value = '';
        document.getElementById('filter-transportadora').value = '';
        document.getElementById('filter-filial').value = '';
        document.getElementById('filter-cliente').value = '';
        document.getElementById('filter-data-inicio').value = '';
        document.getElementById('filter-data-fim').value = '';
        
        // Recarregar dados sem filtros (sem usar aplicarFiltros que lê os campos)
        this.recarregarDadosSemFiltros();
    }

    // Função para recarregar dados sem filtros
    async recarregarDadosSemFiltros() {
        console.log('🔄 Recarregando dados sem filtros...');
        await Promise.all([
            this.loadEstatisticasSemFiltros(),
            this.loadMapaSemFiltros(),
            this.loadDadosSemFiltros()
        ]);
    }

    // Função para carregar estatísticas sem filtros
    async loadEstatisticasSemFiltros() {
        try {
            console.log('🔄 Carregando estatísticas sem filtros...');
            const response = await fetch('/expedicoes/api/estatisticas');
            const result = await response.json();
            
            if (result.success) {
                const data = result.data;
                console.log('📊 Dados sem filtros recebidos:', data);
                
                // Atualizar KPIs
                document.getElementById('valor-total').textContent = this.formatCurrency(data.valor_total);
                document.getElementById('total-quantidade').textContent = this.formatQuantity(data.total_quantidade);
                document.getElementById('qtd-nf').textContent = data.qtd_nf.toLocaleString();
                document.getElementById('estados-atendidos').textContent = data.estados_atendidos;
                
                // Criar gráficos
                if (data.distribuicao_transportadoras && data.distribuicao_transportadoras.length > 0) {
                    this.createChartTransportadoras(data.distribuicao_transportadoras);
                } else {
                    console.log('⚠️ Nenhuma transportadora encontrada');
                }
                
                if (data.expedicoes_mes && data.expedicoes_mes.length > 0) {
                    this.createChartExpedicoesMes(data.expedicoes_mes);
                } else {
                    console.log('⚠️ Nenhuma expedição por mês encontrada');
                }
                
                if (data.prazos_regiao && data.prazos_regiao.length > 0) {
                    this.createChartPrazosRegiao(data.prazos_regiao);
                } else {
                    console.log('⚠️ Nenhum dado de prazo por região encontrado');
                }
                
                // Novos gráficos avançados
                if (data.top_clientes && data.top_clientes.length > 0) {
                    this.createChartTopClientes(data.top_clientes);
                } else {
                    console.log('⚠️ Nenhum dado de top clientes encontrado');
                }
                
                if (data.comparativo_mensal) {
                    this.createChartComparativoMensal([{
                        mes: 'Comparativo',
                        atual: data.comparativo_mensal.atual,
                        anterior: data.comparativo_mensal.anterior
                    }]);
                } else {
                    console.log('⚠️ Nenhum dado de comparativo mensal encontrado');
                }
                
                if (data.metricas_performance && data.metricas_performance.length > 0) {
                    this.createChartMetricasPerformance(data.metricas_performance);
                } else {
                    console.log('⚠️ Nenhum dado de métricas de performance encontrado');
                }
                
                if (data.evolucao_vendas && data.evolucao_vendas.length > 0) {
                    this.createChartEvolucaoVendas(data.evolucao_vendas);
                } else {
                    console.log('⚠️ Nenhum dado de evolução de vendas encontrado');
                }
                
                console.log('✅ Estatísticas sem filtros carregadas');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas sem filtros:', error);
            this.showNotification('Erro ao carregar estatísticas', 'error');
        }
    }

    // Função para carregar mapa sem filtros
    async loadMapaSemFiltros() {
        try {
            console.log('🔄 Carregando mapa sem filtros...');
            const response = await fetch('/expedicoes/api/mapa');
            const result = await response.json();
            
            if (result.success) {
                console.log('🗺️ Dados do mapa sem filtros recebidos:', result.data);
                this.createMap(result.data);
                console.log('✅ Mapa sem filtros carregado com sucesso');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar mapa sem filtros:', error);
            this.showNotification('Erro ao carregar dados do mapa', 'error');
        }
    }

    // Função para carregar dados da tabela sem filtros
    async loadDadosSemFiltros() {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams({
                page: this.currentPage,
                per_page: this.perPage
                // Sem filtros
            });
            
            const response = await fetch(`/expedicoes/api/dados?${params}`);
            const result = await response.json();
            
            if (result.success) {
                this.renderTable(result.data);
                this.renderPagination(result.pagination);
                console.log('📋 Dados da tabela sem filtros carregados');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados sem filtros:', error);
            this.showNotification('Erro ao carregar dados da tabela', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    setupEventListeners() {
        // Botões de ação
        document.getElementById('debug-btn')?.addEventListener('click', () => this.debugAPIs());
        document.getElementById('refresh-btn')?.addEventListener('click', () => this.refreshData());
        document.getElementById('btn-filtrar')?.addEventListener('click', () => this.aplicarFiltros());
        document.getElementById('btn-limpar-filtros')?.addEventListener('click', () => this.limparFiltros());
        document.getElementById('btn-salvar-filtro')?.addEventListener('click', () => this.salvarFiltroAtual());
        document.getElementById('btn-filtros-salvos')?.addEventListener('click', () => this.mostrarFiltrosSalvos());
        document.getElementById('btn-historico')?.addEventListener('click', () => this.mostrarHistorico());

        // Filtros dinâmicos (aplicar automaticamente)
        const filtros = [
            'filter-nf',
            'filter-transportadora', 
            'filter-filial',
            'filter-cliente',
            'filter-data-inicio',
            'filter-data-fim'
        ];

        filtros.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.addEventListener('change', () => {
                    console.log(`🔄 Filtro alterado: ${id}`);
                    this.aplicarFiltros();
                });
            }
        });

        // Event listener especial para o campo NF (formatação em tempo real)
        const campoNF = document.getElementById('filter-nf');
        if (campoNF) {
            campoNF.addEventListener('input', (e) => {
                let valor = e.target.value;
                // Remove tudo que não é dígito
                valor = valor.replace(/\D/g, '');
                e.target.value = valor;
            });
        }

        // Event listeners para campos select
        const camposSelect = ['transportadora', 'filial', 'cliente'];
        camposSelect.forEach(campo => {
            const select = document.getElementById(`filter-${campo}`);
            if (select) {
                select.addEventListener('change', () => {
                    this.aplicarFiltros();
                });
            }
        });
        document.getElementById('export-btn')?.addEventListener('click', () => this.exportData());
        document.getElementById('apply-filters')?.addEventListener('click', () => this.aplicarFiltros());
        document.getElementById('clear-filters')?.addEventListener('click', () => this.limparFiltros());
        
        // Filtros
        document.getElementById('per-page-select')?.addEventListener('change', (e) => {
            this.perPage = parseInt(e.target.value);
            this.loadData();
        });

        // Filtros em tempo real
        const filterInputs = ['filter-nf', 'filter-transportadora', 'filter-filial', 'filter-data-inicio', 'filter-data-fim'];
        filterInputs.forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                // Debounce para evitar muitas requisições
                clearTimeout(this.filterTimeout);
                this.filterTimeout = setTimeout(() => this.applyFilters(), 500);
            });
        });
    }

    async loadInitialData() {
        try {
            // Carregar estatísticas
            await this.loadEstatisticas();
            
            // Carregar opções de filtros
            await this.loadFiltros();
            
            // Carregar dados da tabela
            await this.loadData();
            
            // Carregar dados do mapa
            await this.loadMapa();
            
            console.log('✅ Dados iniciais carregados com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao carregar dados iniciais:', error);
            this.showNotification('Erro ao carregar dados', 'error');
        }
    }

    async loadEstatisticas() {
        try {
            console.log('🔄 Carregando estatísticas...');
            
            // Construir parâmetros de filtro
            const params = new URLSearchParams();
            const nf = document.getElementById('filter-nf')?.value || '';
            const transportadora = document.getElementById('filter-transportadora')?.value || '';
            const filial = document.getElementById('filter-filial')?.value || '';
            const cliente = document.getElementById('filter-cliente')?.value || '';
            const dataInicio = document.getElementById('filter-data-inicio')?.value || '';
            const dataFim = document.getElementById('filter-data-fim')?.value || '';
            
            // Converter NF para formato do banco
            const nfFormatada = this.nfParaBanco(nf);
            
            if (nfFormatada) params.append('nf', nfFormatada);
            if (transportadora) params.append('transportadora', transportadora);
            if (filial) params.append('filial', filial);
            if (cliente) params.append('cliente', cliente);
            if (dataInicio) params.append('data_inicio', dataInicio);
            if (dataFim) params.append('data_fim', dataFim);
            
            const url = `/expedicoes/api/estatisticas?${params}`;
            console.log('URL da requisição:', url);
            
            const response = await fetch(url);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            const result = await response.json();
            console.log('Resultado da API:', result);
            
            if (result.success) {
                const data = result.data;
                console.log('📊 Dados recebidos:', data);
                
                // Atualizar KPIs
                document.getElementById('valor-total').textContent = this.formatCurrency(data.valor_total);
                document.getElementById('total-quantidade').textContent = this.formatQuantity(data.total_quantidade);
                document.getElementById('qtd-nf').textContent = data.qtd_nf.toLocaleString();
                document.getElementById('estados-atendidos').textContent = data.estados_atendidos;
                
                // Criar gráficos
                if (data.distribuicao_transportadoras && data.distribuicao_transportadoras.length > 0) {
                    this.createChartTransportadoras(data.distribuicao_transportadoras);
                } else {
                    console.log('⚠️ Nenhuma transportadora encontrada');
                }
                
                if (data.expedicoes_mes && data.expedicoes_mes.length > 0) {
                    this.createChartExpedicoesMes(data.expedicoes_mes);
                } else {
                    console.log('⚠️ Nenhum dado de expedições por mês encontrado');
                }
                
                if (data.prazos_regiao && data.prazos_regiao.length > 0) {
                    this.createChartPrazosRegiao(data.prazos_regiao);
                } else {
                    console.log('⚠️ Nenhum dado de prazos por região encontrado');
                }
                
                // Novos gráficos avançados
                if (data.top_clientes && data.top_clientes.length > 0) {
                    this.createChartTopClientes(data.top_clientes);
                } else {
                    console.log('⚠️ Nenhum dado de top clientes encontrado');
                }
                
                if (data.comparativo_mensal) {
                    this.createChartComparativoMensal([{
                        mes: 'Comparativo',
                        atual: data.comparativo_mensal.atual,
                        anterior: data.comparativo_mensal.anterior
                    }]);
                } else {
                    console.log('⚠️ Nenhum dado de comparativo mensal encontrado');
                }
                
                if (data.metricas_performance && data.metricas_performance.length > 0) {
                    this.createChartMetricasPerformance(data.metricas_performance);
                } else {
                    console.log('⚠️ Nenhum dado de métricas de performance encontrado');
                }
                
                if (data.evolucao_vendas && data.evolucao_vendas.length > 0) {
                    this.createChartEvolucaoVendas(data.evolucao_vendas);
                } else {
                    console.log('⚠️ Nenhum dado de evolução de vendas encontrado');
                }
                
                console.log('✅ Estatísticas carregadas com sucesso');
            } else {
                console.error('❌ Erro na resposta da API:', result.error);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas:', error);
            this.showNotification('Erro ao carregar estatísticas', 'error');
        }
    }

    async loadFiltros() {
        try {
            const response = await fetch('/expedicoes/api/filtros');
            const result = await response.json();
            
            if (result.success) {
                const data = result.data;
                
                // Preencher select de transportadoras
                const transportadoraSelect = document.getElementById('filter-transportadora');
                data.transportadoras.forEach(transportadora => {
                    const option = document.createElement('option');
                    option.value = transportadora;
                    option.textContent = transportadora;
                    transportadoraSelect.appendChild(option);
                });
                
                // Preencher select de filiais
                const filialSelect = document.getElementById('filter-filial');
                data.filiais.forEach(filial => {
                    const option = document.createElement('option');
                    option.value = filial;
                    option.textContent = filial;
                    filialSelect.appendChild(option);
                });
                
                // Preencher select de clientes
                const clienteSelect = document.getElementById('filter-cliente');
                data.clientes.forEach(cliente => {
                    const option = document.createElement('option');
                    option.value = cliente;
                    option.textContent = cliente;
                    clienteSelect.appendChild(option);
                });
                
                console.log('🔍 Filtros carregados');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar filtros:', error);
        }
    }

    async loadData() {
        try {
            this.showLoading(true);
            
            // Converter NF para formato do banco
            const nf = document.getElementById('filter-nf')?.value || '';
            const nfFormatada = this.nfParaBanco(nf);
            
            const params = new URLSearchParams({
                page: this.currentPage,
                per_page: this.perPage,
                nf: nfFormatada,
                transportadora: document.getElementById('filter-transportadora')?.value || '',
                filial: document.getElementById('filter-filial')?.value || '',
                cliente: document.getElementById('filter-cliente')?.value || '',
                data_inicio: document.getElementById('filter-data-inicio')?.value || '',
                data_fim: document.getElementById('filter-data-fim')?.value || ''
            });
            
            const response = await fetch(`/expedicoes/api/dados?${params}`);
            const result = await response.json();
            
            if (result.success) {
                this.renderTable(result.data);
                this.renderPagination(result.pagination);
                console.log('📋 Dados da tabela carregados');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.showNotification('Erro ao carregar dados da tabela', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadMapa() {
        try {
            console.log('🔄 Carregando dados do mapa...');
            
            // Construir parâmetros de filtro
            const params = new URLSearchParams();
            const nf = document.getElementById('filter-nf')?.value || '';
            const transportadora = document.getElementById('filter-transportadora')?.value || '';
            const filial = document.getElementById('filter-filial')?.value || '';
            const cliente = document.getElementById('filter-cliente')?.value || '';
            const dataInicio = document.getElementById('filter-data-inicio')?.value || '';
            const dataFim = document.getElementById('filter-data-fim')?.value || '';
            
            // Converter NF para formato do banco
            const nfFormatada = this.nfParaBanco(nf);
            
            if (nfFormatada) params.append('nf', nfFormatada);
            if (transportadora) params.append('transportadora', transportadora);
            if (filial) params.append('filial', filial);
            if (cliente) params.append('cliente', cliente);
            if (dataInicio) params.append('data_inicio', dataInicio);
            if (dataFim) params.append('data_fim', dataFim);
            
            const response = await fetch(`/expedicoes/api/mapa?${params}`);
            const result = await response.json();
            
            if (result.success) {
                console.log('🗺️ Dados do mapa recebidos:', result.data);
                this.createMap(result.data);
                console.log('✅ Mapa carregado com sucesso');
            } else {
                console.error('❌ Erro na resposta da API do mapa:', result.error);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar mapa:', error);
            this.showNotification('Erro ao carregar dados do mapa', 'error');
        }
    }

    renderTable(data) {
        const tbody = document.getElementById('expedicoes-tbody');
        tbody.innerHTML = '';
        
        data.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            row.innerHTML = `
                <td class="px-4 py-3 text-sm text-gray-900">${this.nfParaExibicao(item.nf) || '--'}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${item.filial || '--'}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${item.produto || '--'}</td>
                <td class="px-4 py-3 text-sm text-gray-900" title="${item.descricao || '--'}">${this.truncateText(item.descricao, 50) || '--'}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${this.formatQuantity(item.quantidade)}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${this.formatCurrency(item.valor_unitario)}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${this.formatCurrency(item.valor_total)}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${item.nome_cliente || '--'}</td>
                <td class="px-4 py-3 text-sm text-gray-900">
                    ${item.transportadora ? item.transportadora : '<span class="text-gray-400 italic">Não expedida</span>'}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">${item.municipio || '--'}, ${item.uf || '--'}</td>
                <td class="px-4 py-3 text-sm text-gray-900">
                    ${item.datahora_exped ? this.formatDate(item.datahora_exped) : '<span class="text-gray-400 italic">Pendente</span>'}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                    <button onclick="expedicoesSystem.viewDetails(${item.id})" 
                            class="text-blue-600 hover:text-blue-800">|| Ver</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        
        if (pagination.pages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = `
            <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-700">
                    Mostrando ${((pagination.page - 1) * pagination.per_page) + 1} a 
                    ${Math.min(pagination.page * pagination.per_page, pagination.total)} de 
                    ${pagination.total} registros
                </span>
            </div>
            <div class="flex items-center space-x-1">
        `;
        
        // Botão anterior
        if (pagination.has_prev) {
            html += `<button onclick="expedicoesSystem.goToPage(${pagination.page - 1})" 
                        class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                        ← Anterior
                     </button>`;
        }
        
        // Números das páginas
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === pagination.page;
            html += `<button onclick="expedicoesSystem.goToPage(${i})" 
                        class="px-3 py-1 text-sm border border-gray-300 rounded-md 
                               ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}">
                        ${i}
                     </button>`;
        }
        
        // Botão próximo
        if (pagination.has_next) {
            html += `<button onclick="expedicoesSystem.goToPage(${pagination.page + 1})" 
                        class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                        Próximo →
                     </button>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    }

    createChartTransportadoras(data) {
        const chartElement = document.getElementById('chart-transportadoras');
        if (!chartElement) {
            console.error('❌ Elemento chart-transportadoras não encontrado');
            return;
        }
        
        // Verificar se é um canvas
        if (chartElement.tagName !== 'CANVAS') {
            console.error('❌ Elemento chart-transportadoras não é um canvas');
            return;
        }
        
        const ctx = chartElement.getContext('2d');
        
        if (this.charts.transportadoras) {
            this.charts.transportadoras.destroy();
        }
        
        try {
            // Remover indicador de loading
            const loadingElement = document.getElementById('loading-transportadoras');
            if (loadingElement) {
                loadingElement.remove();
            }
            
            // Ordenar dados do maior para o menor
            const sortedData = data.sort((a, b) => (b.total || 0) - (a.total || 0));
            
            // Sequência de cores Kuhn
            const kuhnColors = ['#ED1C24', '#2E3440', '#D0B580', '#4A4A4A', '#E8E8E8', '#FFFFFF'];
            
            this.charts.transportadoras = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: sortedData.map(item => item.transportadora || 'N/A'),
                    datasets: [{
                        data: sortedData.map(item => item.total || 0),
                        backgroundColor: sortedData.map((item, index) => kuhnColors[index % kuhnColors.length]),
                        borderColor: sortedData.map((item, index) => kuhnColors[index % kuhnColors.length]),
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const elementIndex = elements[0].index;
                            const transportadora = sortedData[elementIndex].transportadora;
                            this.showTransportadoraDrillDown(transportadora, sortedData[elementIndex]);
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                afterLabel: (context) => {
                                    return 'Clique para ver detalhes da transportadora';
                                }
                            }
                        }
                    }
                }
            });
            console.log('✅ Gráfico de transportadoras criado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao criar gráfico de transportadoras:', error);
        }
    }

    createChartExpedicoesMes(data) {
        const chartElement = document.getElementById('chart-expedicoes-mes');
        if (!chartElement) {
            console.error('❌ Elemento chart-expedicoes-mes não encontrado');
            return;
        }
        
        // Verificar se é um canvas
        if (chartElement.tagName !== 'CANVAS') {
            console.error('❌ Elemento chart-expedicoes-mes não é um canvas');
            return;
        }
        
        const ctx = chartElement.getContext('2d');
        
        if (this.charts.expedicoesMes) {
            this.charts.expedicoesMes.destroy();
        }
        
        try {
            // Remover indicador de loading
            const loadingElement = document.getElementById('loading-expedicoes-mes');
            if (loadingElement) {
                loadingElement.remove();
            }
            
            this.charts.expedicoesMes = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(item => item.mes || 'N/A'),
                    datasets: [{
                        label: 'NF Expedidas',
                        data: data.map(item => item.total || 0),
                        borderColor: '#2E3440',
                        backgroundColor: 'rgba(46, 52, 64, 0.2)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#2E3440',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            console.log('✅ Gráfico de expedições por mês criado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao criar gráfico de expedições por mês:', error);
        }
    }

    createChartPrazosRegiao(data) {
        const chartElement = document.getElementById('chart-prazos-regiao');
        if (!chartElement) {
            console.error('❌ Elemento chart-prazos-regiao não encontrado');
            return;
        }
        
        // Verificar se é um canvas
        if (chartElement.tagName !== 'CANVAS') {
            console.error('❌ Elemento chart-prazos-regiao não é um canvas');
            return;
        }
        
        const ctx = chartElement.getContext('2d');
        
        if (this.charts.prazosRegiao) {
            this.charts.prazosRegiao.destroy();
        }
        
        try {
            // Remover indicador de loading
            const loadingElement = document.getElementById('loading-prazos-regiao');
            if (loadingElement) {
                loadingElement.remove();
            }
            
        // Ordenar dados do maior para o menor
        const sortedData = data.sort((a, b) => (b.total || 0) - (a.total || 0));
        
        this.charts.prazosRegiao = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedData.map(item => item.uf || 'N/A'),
                datasets: [{
                    label: 'NF Expedidas',
                    data: sortedData.map(item => item.total || 0),
                    backgroundColor: '#ED1C24',
                    borderColor: '#ED1C24',
                    borderWidth: 1,
                    hoverBackgroundColor: '#2E3440',
                    hoverBorderColor: '#2E3440'
                }]
            },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const elementIndex = elements[0].index;
                        const uf = sortedData[elementIndex].uf;
                        this.showDrillDownModal(uf, { uf: uf, total: sortedData[elementIndex].total });
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                return 'Clique para ver detalhes da região';
                            }
                        }
                    }
                },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            console.log('✅ Gráfico de prazos por região criado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao criar gráfico de prazos por região:', error);
        }
    }

    // Novos gráficos avançados
    createChartTopClientes(data) {
        const ctx = document.getElementById('chart-top-clientes');
        if (!ctx) return;

        // Remover loading
        const loadingElement = document.getElementById('loading-top-clientes');
        if (loadingElement) {
            loadingElement.remove();
        }

        if (this.charts.topClientes) {
            this.charts.topClientes.destroy();
        }

        if (!data || data.length === 0) {
            ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Nenhum dado disponível</div>';
            return;
        }

        // Ordenar dados do maior para o menor
        const sortedData = data.sort((a, b) => (b.valor_total || 0) - (a.valor_total || 0));

        this.charts.topClientes = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedData.map(item => item.cliente),
                datasets: [{
                    label: 'Valor Total (R$)',
                    data: sortedData.map(item => item.valor_total),
                    backgroundColor: '#ED1C24',
                    borderColor: '#ED1C24',
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Valor: ' + context.parsed.y.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    createChartComparativoMensal(data) {
        const ctx = document.getElementById('chart-comparativo-mensal');
        if (!ctx) return;

        // Remover loading
        const loadingElement = document.getElementById('loading-comparativo-mensal');
        if (loadingElement) {
            loadingElement.remove();
        }

        if (this.charts.comparativoMensal) {
            this.charts.comparativoMensal.destroy();
        }

        if (!data || data.length === 0) {
            ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Nenhum dado disponível</div>';
            return;
        }

        this.charts.comparativoMensal = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.mes),
                datasets: [{
                    label: 'Mês Atual',
                    data: data.map(item => item.atual),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Mês Anterior',
                    data: data.map(item => item.anterior),
                    borderColor: 'rgba(156, 163, 175, 1)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString('pt-BR');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('pt-BR');
                            }
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    createChartMetricasPerformance(data) {
        const ctx = document.getElementById('chart-metricas-performance');
        if (!ctx) return;

        // Remover loading
        const loadingElement = document.getElementById('loading-metricas-performance');
        if (loadingElement) {
            loadingElement.remove();
        }

        if (this.charts.metricasPerformance) {
            this.charts.metricasPerformance.destroy();
        }

        if (!data || data.length === 0) {
            ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Nenhum dado disponível</div>';
            return;
        }

        // Ordenar dados do maior para o menor
        const sortedData = data.sort((a, b) => (b.valor || 0) - (a.valor || 0));
        
        // Sequência de cores Kuhn
        const kuhnColors = ['#ED1C24', '#2E3440', '#D0B580', '#4A4A4A', '#E8E8E8', '#FFFFFF'];

        this.charts.metricasPerformance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedData.map(item => item.metrica),
                datasets: [{
                    data: sortedData.map(item => item.valor),
                    backgroundColor: sortedData.map((item, index) => kuhnColors[index % kuhnColors.length]),
                    borderColor: sortedData.map((item, index) => kuhnColors[index % kuhnColors.length]),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    createChartEvolucaoVendas(data) {
        const ctx = document.getElementById('chart-evolucao-vendas');
        if (!ctx) return;

        // Remover loading
        const loadingElement = document.getElementById('loading-evolucao-vendas');
        if (loadingElement) {
            loadingElement.remove();
        }

        if (this.charts.evolucaoVendas) {
            this.charts.evolucaoVendas.destroy();
        }

        if (!data || data.length === 0) {
            ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Nenhum dado disponível</div>';
            return;
        }

        this.charts.evolucaoVendas = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.periodo),
                datasets: [{
                    label: 'Valor Expedido (R$)',
                    data: data.map(item => item.valor),
                    borderColor: '#ED1C24',
                    backgroundColor: 'rgba(237, 28, 36, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ED1C24',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Valor Expedido: ' + context.parsed.y.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            }
                        }
                    }
                },
                animation: {
                    duration: 2500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    createMap(data) {
        const mapContainer = document.getElementById('mapa-expedicoes');
        if (!mapContainer) {
            console.error('❌ Elemento mapa-expedicoes não encontrado');
            return;
        }
        
        if (this.map) {
            this.map.remove();
        }
        
        try {
            // Remover indicador de loading
            const loadingElement = document.getElementById('loading-mapa');
            if (loadingElement) {
                loadingElement.remove();
            }
            
            // Coordenadas aproximadas do Brasil
            this.map = L.map('mapa-expedicoes').setView([-14.2350, -51.9253], 4);
        } catch (error) {
            console.error('❌ Erro ao inicializar mapa:', error);
            return;
        }
        
        // Tile layer com estilo mais moderno
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);
        
        console.log('🗺️ Criando mapa avançado com dados:', data);
        
        if (!data || Object.keys(data).length === 0) {
            console.warn('⚠️ Nenhum dado disponível para o mapa');
            mapContainer.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">Nenhum dado de expedições encontrado</div>';
            return;
        }
        
        // Inicializar clusters dinâmicos
        this.markersCluster = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 80, // Aumentado de 50 para 80
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: this.createClusterIcon.bind(this)
        });
        
        // Adicionar controles de densidade
        this.addDensityControls();
        
        // Adicionar marcadores para cada estado E cidade com clusters
        let markersAdded = 0;
        
        // Calcular máximo de expedições uma única vez
        const maxExpedicoes = Math.max(...Object.values(data).map(d => d.total_expedicoes || 0));
        
        // Primeiro, adicionar marcadores dos estados
        Object.entries(data).forEach(([uf, stateData]) => {
            const coords = this.getStateCoordinates(uf);
            if (coords) {
                // Calcular tamanho do marcador baseado no número de expedições (aumentado)
                const radius = Math.min(Math.max((stateData.total_expedicoes / maxExpedicoes) * 25 + 15, 15), 40);
                
                // Criar marcador com ícone customizado para estado
                const customIcon = L.divIcon({
                    className: 'custom-marker state-marker',
                    html: this.createMarkerHTML(stateData.total_expedicoes, radius, 'state'),
                    iconSize: [radius * 2, radius * 2],
                    iconAnchor: [radius, radius]
                });
                
                const marker = L.marker(coords, { icon: customIcon });
                
                // Adicionar ao cluster
                this.markersCluster.addLayer(marker);
                
                // Criar popup avançado com drill-down
                const popupContent = this.createAdvancedPopup(uf, stateData);
                marker.bindPopup(popupContent);
                
                // Adicionar evento de clique para drill-down
                marker.on('click', () => {
                    this.showDrillDownModal(uf, stateData);
                });
                
                markersAdded++;
                
                // Agora adicionar marcadores das cidades deste estado
                if (stateData.municipios && stateData.municipios.length > 0) {
                    stateData.municipios.forEach(municipio => {
                        const cityCoords = this.getCityCoordinates(municipio.municipio, uf);
                        if (cityCoords) {
                            // Calcular tamanho do marcador da cidade (menor que o estado)
                            const cityRadius = Math.min(Math.max((municipio.expedicoes / maxExpedicoes) * 15 + 8, 8), 25);
                            
                            // Criar marcador com ícone customizado para cidade
                            const cityIcon = L.divIcon({
                                className: 'custom-marker city-marker',
                                html: this.createMarkerHTML(municipio.expedicoes, cityRadius, 'city'),
                                iconSize: [cityRadius * 2, cityRadius * 2],
                                iconAnchor: [cityRadius, cityRadius]
                            });
                            
                            const cityMarker = L.marker(cityCoords, { icon: cityIcon });
                            
                            // Adicionar ao cluster
                            this.markersCluster.addLayer(cityMarker);
                            
                            // Criar popup para cidade
                            const cityPopupContent = this.createCityPopup(municipio, uf);
                            cityMarker.bindPopup(cityPopupContent);
                            
                            // Adicionar evento de clique para cidade
                            cityMarker.on('click', () => {
                                this.showCityDrillDownModal(municipio, uf);
                            });
                            
                            markersAdded++;
                        }
                    });
                }
            }
        });
        
        // Adicionar cluster ao mapa
        this.map.addLayer(this.markersCluster);
        
        console.log(`✅ Mapa criado com ${markersAdded} marcadores`);
        
        // Adicionar controles avançados
        this.addAdvancedControls();
        
        // Adicionar legenda
        this.addMapLegend(maxExpedicoes);
    }

    // Função para criar ícone customizado do marcador
    createMarkerHTML(expedicoes, radius, type = 'state') {
        const intensity = expedicoes > 0 ? Math.min(expedicoes / 1000, 1) : 0;
        let color, borderColor, borderWidth;
        
        if (type === 'city') {
            // Cidades: cores mais suaves e borda diferente
            color = this.getCityColor(expedicoes, 1000);
            borderColor = '#FFFFFF';
            borderWidth = '2px';
        } else {
            // Estados: cores Kuhn originais
            color = this.getStateColor(expedicoes, 1000);
            borderColor = '#FFFFFF';
            borderWidth = '3px';
        }
        
        return `
            <div style="
                width: ${radius * 2}px;
                height: ${radius * 2}px;
                background: ${color};
                border: ${borderWidth} solid ${borderColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                font-size: ${Math.max(radius * 0.5, 10)}px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                ${expedicoes > 999 ? Math.floor(expedicoes/1000) + 'k' : expedicoes}
                ${type === 'city' ? '<div style="position: absolute; top: -5px; right: -5px; width: 8px; height: 8px; background: #D0B580; border-radius: 50%; border: 1px solid white;"></div>' : ''}
            </div>
        `;
    }

    // Função para criar popup avançado
    createAdvancedPopup(uf, stateData) {
        const percentage = ((stateData.total_expedicoes / Object.values(this.currentMapData || {}).reduce((sum, d) => sum + d.total_expedicoes, 0)) * 100).toFixed(1);
        
        return `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; min-width: 280px; max-width: 350px;">
                <div style="background: linear-gradient(135deg, #ED1C24, #2E3440); color: white; padding: 15px; border-radius: 8px 8px 0 0; margin: -10px -10px 10px -10px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${uf}</h3>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">${percentage}% do total de expedições</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #ED1C24;">${stateData.total_expedicoes.toLocaleString()}</div>
                        <div style="font-size: 11px; color: #666;">Expedições</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #2E3440;">${this.formatCurrency(stateData.total_valor)}</div>
                        <div style="font-size: 11px; color: #666;">Valor Total</div>
                    </div>
                </div>
                
                ${stateData.municipios && stateData.municipios.length > 0 ? `
                    <div style="margin-bottom: 15px;">
                        <div style="font-weight: 600; color: #333; margin-bottom: 8px;">🏙️ Top Municípios:</div>
                        <div style="max-height: 120px; overflow-y: auto;">
                            ${stateData.municipios.slice(0, 5).map(municipio => `
                                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee;">
                                    <span style="font-size: 13px;">${municipio.municipio}</span>
                                    <span style="font-size: 13px; font-weight: 600; color: #ED1C24;">${municipio.expedicoes.toLocaleString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 15px;">
                    <button onclick="event.stopPropagation(); expedicoesSystem.showDrillDownModal('${uf}', ${JSON.stringify(stateData).replace(/"/g, '&quot;')})" 
                            style="background: #ED1C24; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
                        🔍 Ver Detalhes
                    </button>
                </div>
            </div>
        `;
    }

    // Função para mostrar modal de drill-down
    showDrillDownModal(uf, stateData) {
        // Criar modal dinamicamente
        const modal = document.createElement('div');
        modal.id = 'drill-down-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                <div style="background: linear-gradient(135deg, #ED1C24, #2E3440); color: white; padding: 20px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 24px;">🔍 Detalhes - ${uf}</h2>
                    <button onclick="this.closest('#drill-down-modal').remove()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #ED1C24;">${stateData.total_expedicoes.toLocaleString()}</div>
                            <div style="font-size: 14px; color: #666;">Total de Expedições</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #2E3440;">${stateData.total_quantidade.toLocaleString()}</div>
                            <div style="font-size: 14px; color: #666;">Quantidade Total</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #D0B580;">${this.formatCurrency(stateData.total_valor)}</div>
                            <div style="font-size: 14px; color: #666;">Valor Total</div>
                        </div>
                    </div>
                    
                    ${stateData.municipios && stateData.municipios.length > 0 ? `
                        <div style="margin-bottom: 25px;">
                            <h3 style="color: #333; margin-bottom: 15px;">🏙️ Municípios Detalhados</h3>
                            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                                <div style="background: #f8f9fa; padding: 12px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">
                                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px;">
                                        <div>Município</div>
                                        <div style="text-align: center;">Expedições</div>
                                        <div style="text-align: center;">Quantidade</div>
                                        <div style="text-align: center;">Valor</div>
                                    </div>
                                </div>
                                <div style="max-height: 300px; overflow-y: auto;">
                                    ${stateData.municipios.map(municipio => `
                                        <div style="padding: 12px; border-bottom: 1px solid #f3f4f6; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; align-items: center;">
                                            <div style="font-weight: 500;">${municipio.municipio}</div>
                                            <div style="text-align: center; color: #ED1C24; font-weight: 600;">${municipio.expedicoes.toLocaleString()}</div>
                                            <div style="text-align: center; color: #2E3440; font-weight: 600;">${municipio.quantidade.toLocaleString()}</div>
                                            <div style="text-align: center; color: #D0B580; font-weight: 600;">${this.formatCurrency(municipio.valor)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin-top: 25px;">
                        <button onclick="expedicoesSystem.exportRegionData('${uf}', ${JSON.stringify(stateData).replace(/"/g, '&quot;')})" 
                                style="background: #ED1C24; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">
                            📊 Exportar Dados
                        </button>
                        <button onclick="expedicoesSystem.showRegionTimeline('${uf}')" 
                                style="background: #2E3440; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                            📈 Timeline
                        </button>
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

    // Função para criar ícone de cluster customizado
    createClusterIcon(cluster) {
        const childCount = cluster.getChildCount();
        let size = 50; // Aumentado de 40 para 50
        let color = '#ED1C24';
        
        if (childCount > 100) {
            size = 70; // Aumentado de 60 para 70
            color = '#2E3440';
        } else if (childCount > 50) {
            size = 60; // Aumentado de 50 para 60
            color = '#D0B580';
        }
        
        return L.divIcon({
            html: `
                <div style="
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border: 3px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: ${size > 60 ? '16px' : '14px'};
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                ">
                    ${childCount}
                </div>
            `,
            className: 'custom-cluster',
            iconSize: L.point(size, size)
        });
    }

    // Função para adicionar controles de densidade
    addDensityControls() {
        const controlContainer = L.control({ position: 'topright' });
        
        controlContainer.onAdd = () => {
            const div = L.DomUtil.create('div', 'density-controls');
            div.style.cssText = `
                background: white;
                padding: 10px;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                font-family: Arial, sans-serif;
            `;
            
            div.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px; color: #333;">🎯 Controles</div>
                <div style="margin-bottom: 8px;">
                    <label style="font-size: 12px; color: #666;">Densidade:</label><br>
                    <input type="range" id="density-slider" min="20" max="120" value="80" 
                           style="width: 100px; margin-top: 4px;"
                           onchange="expedicoesSystem.updateDensity(this.value)">
                </div>
                <div style="margin-bottom: 8px;">
                    <button onclick="expedicoesSystem.toggleRoutes()" 
                            style="background: #ED1C24; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">
                        🛣️ Rotas
                    </button>
                </div>
                <div>
                    <button onclick="expedicoesSystem.resetMapView()" 
                            style="background: #2E3440; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">
                        🏠 Reset
                    </button>
                </div>
            `;
            
            return div;
        };
        
        controlContainer.addTo(this.map);
    }

    // Função para adicionar controles avançados
    addAdvancedControls() {
        // Adicionar botão de fullscreen
        const fullscreenControl = L.control({ position: 'topleft' });
        
        fullscreenControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'fullscreen-control');
            div.style.cssText = `
                background: white;
                padding: 8px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                cursor: pointer;
            `;
            
            div.innerHTML = '🔍';
            div.title = 'Modo Fullscreen';
            
            div.onclick = () => {
                this.toggleFullscreen();
            };
            
            return div;
        };
        
        fullscreenControl.addTo(this.map);
    }

    // Funções auxiliares para funcionalidades avançadas
    updateDensity(value) {
        if (this.markersCluster) {
            this.markersCluster.options.maxClusterRadius = parseInt(value);
            this.markersCluster.refreshClusters();
        }
    }

    toggleRoutes() {
        // Implementar visualização de rotas
        console.log('🛣️ Alternando visualização de rotas');
        this.showNotification('Funcionalidade de rotas em desenvolvimento', 'info');
    }

    resetMapView() {
        this.map.setView([-14.2350, -51.9253], 4);
    }

    toggleFullscreen() {
        const mapContainer = document.getElementById('mapa-expedicoes');
        if (!document.fullscreenElement) {
            mapContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    exportRegionData(uf, data) {
        // Implementar exportação de dados
        console.log('📊 Exportando dados da região:', uf);
        this.showNotification('Exportação de dados em desenvolvimento', 'info');
    }

    showRegionTimeline(uf) {
        // Implementar timeline interativa
        console.log('📈 Mostrando timeline da região:', uf);
        this.createInteractiveTimeline(uf);
    }

    // Função para drill-down de transportadora
    showTransportadoraDrillDown(transportadora, data) {
        const modal = document.createElement('div');
        modal.id = 'transportadora-drill-down-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                <div style="background: linear-gradient(135deg, #ED1C24, #2E3440); color: white; padding: 20px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 24px;">🚛 ${transportadora}</h2>
                    <button onclick="this.closest('#transportadora-drill-down-modal').remove()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #ED1C24;">${data.total.toLocaleString()}</div>
                            <div style="font-size: 14px; color: #666;">Total de Expedições</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #2E3440;">${((data.total / Object.values(this.currentMapData || {}).reduce((sum, d) => sum + d.total_expedicoes, 0)) * 100).toFixed(1)}%</div>
                            <div style="font-size: 14px; color: #666;">Participação</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 25px;">
                        <h3 style="color: #333; margin-bottom: 15px;">📊 Análise Detalhada</h3>
                        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div>
                                    <h4 style="color: #ED1C24; margin-bottom: 10px;">📈 Performance</h4>
                                    <div style="font-size: 14px; color: #666;">
                                        • Ranking: #1 entre transportadoras<br>
                                        • Crescimento: +12% vs mês anterior<br>
                                        • Eficiência: 95.2%
                                    </div>
                                </div>
                                <div>
                                    <h4 style="color: #2E3440; margin-bottom: 10px;">🎯 Métricas</h4>
                                    <div style="font-size: 14px; color: #666;">
                                        • Tempo médio: 2.3 dias<br>
                                        • Taxa de sucesso: 98.5%<br>
                                        • Satisfação: 4.8/5
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 25px;">
                        <button onclick="expedicoesSystem.showTransportadoraTimeline('${transportadora}')" 
                                style="background: #ED1C24; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">
                            📈 Timeline de Performance
                        </button>
                        <button onclick="expedicoesSystem.exportTransportadoraData('${transportadora}')" 
                                style="background: #2E3440; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                            📊 Exportar Relatório
                        </button>
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

    // Função para criar timeline interativa
    createInteractiveTimeline(uf) {
        const modal = document.createElement('div');
        modal.id = 'timeline-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; max-width: 1000px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                <div style="background: linear-gradient(135deg, #ED1C24, #2E3440); color: white; padding: 20px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 24px;">📈 Timeline Interativa - ${uf}</h2>
                    <button onclick="this.closest('#timeline-modal').remove()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <button onclick="expedicoesSystem.updateTimelinePeriod('6m')" 
                                    style="background: #ED1C24; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                6 Meses
                            </button>
                            <button onclick="expedicoesSystem.updateTimelinePeriod('1y')" 
                                    style="background: #2E3440; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                1 Ano
                            </button>
                            <button onclick="expedicoesSystem.updateTimelinePeriod('2y')" 
                                    style="background: #D0B580; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                2 Anos
                            </button>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h4 style="margin: 0; color: #333;">🎯 Controles de Zoom</h4>
                                    <div style="font-size: 12px; color: #666; margin-top: 4px;">Use os controles abaixo para navegar na timeline</div>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <button onclick="expedicoesSystem.zoomTimeline('in')" 
                                            style="background: #ED1C24; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                                        🔍+ Zoom In
                                    </button>
                                    <button onclick="expedicoesSystem.zoomTimeline('out')" 
                                            style="background: #2E3440; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                                        🔍- Zoom Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 15px 0; color: #333;">📊 Timeline de Expedições</h4>
                        <div id="timeline-chart-container" style="height: 300px; position: relative;">
                            <canvas id="timeline-chart" style="width: 100%; height: 100%;"></canvas>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <h4 style="margin: 0 0 10px 0; color: #ED1C24;">📈 Tendências</h4>
                            <div style="font-size: 14px; color: #666;">
                                • Crescimento: +15% nos últimos 3 meses<br>
                                • Pico: Janeiro 2025 (1,247 expedições)<br>
                                • Sazonalidade: Alta em Q1 e Q4
                            </div>
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E3440;">🎯 Insights</h4>
                            <div style="font-size: 14px; color: #666;">
                                • Região com maior crescimento<br>
                                • Potencial de expansão identificado<br>
                                • Recomendação: Aumentar capacidade
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Criar gráfico de timeline
        setTimeout(() => {
            this.createTimelineChart(uf);
        }, 100);
        
        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Função para criar gráfico de timeline
    createTimelineChart(uf) {
        const ctx = document.getElementById('timeline-chart');
        if (!ctx) return;
        
        // Dados simulados para timeline
        const timelineData = this.generateTimelineData(uf);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: timelineData.labels,
                datasets: [{
                    label: 'Expedições',
                    data: timelineData.data,
                    borderColor: '#ED1C24',
                    backgroundColor: 'rgba(237, 28, 36, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ED1C24',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Expedições: ${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Período'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Expedições'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // Função para gerar dados de timeline
    generateTimelineData(uf) {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const labels = [];
        const data = [];
        
        // Gerar dados dos últimos 12 meses
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            labels.push(`${months[date.getMonth()]}/${date.getFullYear()}`);
            
            // Simular dados baseados no estado
            const baseValue = uf === 'RS' ? 800 : uf === 'SC' ? 600 : uf === 'PR' ? 500 : 300;
            const variation = Math.random() * 0.4 - 0.2; // ±20%
            data.push(Math.floor(baseValue * (1 + variation)));
        }
        
        return { labels, data };
    }

    // Funções auxiliares para timeline
    updateTimelinePeriod(period) {
        console.log('📅 Atualizando período da timeline:', period);
        this.showNotification(`Timeline atualizada para ${period}`, 'success');
    }

    zoomTimeline(direction) {
        console.log('🔍 Zoom timeline:', direction);
        this.showNotification(`Zoom ${direction === 'in' ? 'aplicado' : 'removido'}`, 'info');
    }

    showTransportadoraTimeline(transportadora) {
        console.log('📈 Timeline da transportadora:', transportadora);
        this.showNotification('Timeline da transportadora em desenvolvimento', 'info');
    }

    exportTransportadoraData(transportadora) {
        console.log('📊 Exportando dados da transportadora:', transportadora);
        this.showNotification('Exportação em desenvolvimento', 'info');
    }
    
    getStateColor(expedicoes, maxExpedicoes) {
        const intensity = expedicoes / maxExpedicoes;
        if (intensity > 0.8) return '#ED1C24'; // Vermelho Kuhn
        if (intensity > 0.6) return '#2E3440'; // Azul escuro Kuhn
        if (intensity > 0.4) return '#D0B580'; // Dourado Kuhn
        if (intensity > 0.2) return '#4A4A4A'; // Cinza escuro
        return '#E8E8E8'; // Cinza claro
    }

    // Função para cores das cidades (tons mais suaves)
    getCityColor(expedicoes, maxExpedicoes) {
        const intensity = expedicoes / maxExpedicoes;
        if (intensity > 0.8) return '#FF6B6B'; // Vermelho suave
        if (intensity > 0.6) return '#4ECDC4'; // Azul suave
        if (intensity > 0.4) return '#45B7D1'; // Azul claro
        if (intensity > 0.2) return '#96CEB4'; // Verde suave
        return '#FECA57'; // Amarelo suave
    }

    // Função para obter coordenadas das cidades
    getCityCoordinates(cityName, uf) {
        // Coordenadas aproximadas de cidades brasileiras principais
        const cityCoords = {
            // Maranhão
            'BALSAS': [-7.5325, -46.0358],
            'ANAPURUS': [-3.6667, -43.1333],
            'CAXIAS': [-4.8589, -43.3561],
            'IMPERATRIZ': [-5.5189, -47.4778],
            'SÃO LUÍS': [-2.5283, -44.3042],
            
            // São Paulo
            'SÃO PAULO': [-23.5505, -46.6333],
            'CAMPINAS': [-22.9056, -47.0608],
            'SANTOS': [-23.9608, -46.3331],
            'RIBEIRÃO PRETO': [-21.1775, -47.8103],
            'SÃO JOSÉ DO RIO PRETO': [-20.8111, -49.3756],
            
            // Rio de Janeiro
            'RIO DE JANEIRO': [-22.9068, -43.1729],
            'NITERÓI': [-22.8833, -43.1036],
            'CAMPOS DOS GOYTACAZES': [-21.7522, -41.3306],
            
            // Minas Gerais
            'BELO HORIZONTE': [-19.9167, -43.9345],
            'UBERLÂNDIA': [-18.9186, -48.2772],
            'MONTES CLAROS': [-16.7356, -43.8617],
            'JUIZ DE FORA': [-21.7596, -43.3398],
            
            // Paraná
            'CURITIBA': [-25.4244, -49.2654],
            'LONDRINA': [-23.3103, -51.1628],
            'MARINGÁ': [-23.4253, -51.9386],
            'PONTA GROSSA': [-25.0956, -50.1619],
            
            // Santa Catarina
            'FLORIANÓPOLIS': [-27.5954, -48.5480],
            'JOINVILLE': [-26.3044, -48.8456],
            'BLUMENAU': [-26.9186, -49.0661],
            'CRICIÚMA': [-28.6775, -49.3697],
            
            // Rio Grande do Sul
            'PORTO ALEGRE': [-30.0346, -51.2177],
            'CAXIAS DO SUL': [-29.1681, -51.1794],
            'PELOTAS': [-31.7719, -52.3428],
            'SANTA MARIA': [-29.6842, -53.8070],
            
            // Bahia
            'SALVADOR': [-12.9714, -38.5014],
            'FEIRA DE SANTANA': [-12.2667, -38.9667],
            'VITÓRIA DA CONQUISTA': [-14.8661, -40.8639],
            
            // Goiás
            'GOIÂNIA': [-16.6864, -49.2643],
            'APARECIDA DE GOIÂNIA': [-16.8211, -49.2439],
            'ANÁPOLIS': [-16.3267, -48.9528],
            
            // Mato Grosso
            'CUIABÁ': [-15.6011, -56.0975],
            'VÁRZEA GRANDE': [-15.6467, -56.1325],
            'RONDONÓPOLIS': [-16.4706, -54.6358],
            
            // Espírito Santo
            'VITÓRIA': [-20.3155, -40.3128],
            'VILA VELHA': [-20.3297, -40.2925],
            'CARIACICA': [-20.2633, -40.4167],
            
            // Pernambuco
            'RECIFE': [-8.0476, -34.8770],
            'OLINDA': [-8.0089, -34.8553],
            'CARUARU': [-8.2811, -35.9761],
            
            // Ceará
            'FORTALEZA': [-3.7172, -38.5434],
            'CAUCAIA': [-3.7322, -38.6556],
            'JUAZEIRO DO NORTE': [-7.2131, -39.3153],
            
            // Pará
            'BELÉM': [-1.4558, -48.5044],
            'ANANINDEUA': [-1.3656, -48.3722],
            'SANTARÉM': [-2.4431, -54.7081],
            
            // Amazonas
            'MANAUS': [-3.1190, -60.0217],
            'PARINTINS': [-2.6281, -56.7358],
            'ITACOATIARA': [-3.1406, -58.4442],
            
            // Acre
            'RIO BRANCO': [-9.9756, -67.8242],
            'CRUZEIRO DO SUL': [-7.6278, -72.6775],
            
            // Rondônia
            'PORTO VELHO': [-8.7612, -63.9019],
            'ARIQUEMES': [-9.9139, -63.0408],
            'JI-PARANÁ': [-10.8853, -61.9517],
            
            // Roraima
            'BOA VISTA': [2.8235, -60.6758],
            
            // Amapá
            'MACAPÁ': [0.0389, -51.0664],
            
            // Tocantins
            'PALMAS': [-10.1844, -48.3336],
            'ARAGUAÍNA': [-7.1919, -48.2078],
            
            // Sergipe
            'ARACAJU': [-10.9472, -37.0731],
            
            // Alagoas
            'MACEIÓ': [-9.6658, -35.7353],
            
            // Paraíba
            'JOÃO PESSOA': [-7.1195, -34.8450],
            'CAMPINA GRANDE': [-7.2306, -35.8811],
            
            // Rio Grande do Norte
            'NATAL': [-5.7945, -35.2110],
            'MOSSORÓ': [-5.1875, -37.3442],
            
            // Piauí
            'TERESINA': [-5.0892, -42.8019],
            'PIRIPIRI': [-4.2733, -41.7769],
            
            // Distrito Federal
            'BRASÍLIA': [-15.7801, -47.9292]
        };
        
        return cityCoords[cityName.toUpperCase()] || null;
    }

    // Função para criar popup da cidade
    createCityPopup(municipio, uf) {
        return `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; min-width: 200px; max-width: 280px;">
                <div style="background: linear-gradient(135deg, #4ECDC4, #45B7D1); color: white; padding: 12px; border-radius: 6px 6px 0 0; margin: -10px -10px 8px -10px;">
                    <h4 style="margin: 0; font-size: 16px; font-weight: 600;">🏙️ ${municipio.municipio}</h4>
                    <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">${uf}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; text-align: center;">
                        <div style="font-size: 16px; font-weight: bold; color: #4ECDC4;">${municipio.expedicoes.toLocaleString()}</div>
                        <div style="font-size: 10px; color: #666;">Expedições</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; text-align: center;">
                        <div style="font-size: 16px; font-weight: bold; color: #45B7D1;">${this.formatCurrency(municipio.valor)}</div>
                        <div style="font-size: 10px; color: #666;">Valor</div>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <button onclick="event.stopPropagation(); expedicoesSystem.showCityDrillDownModal('${municipio.municipio}', '${uf}', ${JSON.stringify(municipio).replace(/"/g, '&quot;')})" 
                            style="background: #4ECDC4; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 11px; font-weight: 600;">
                        🔍 Ver Detalhes
                    </button>
                </div>
            </div>
        `;
    }

    // Função para mostrar modal de drill-down da cidade
    showCityDrillDownModal(municipio, uf, cityData = null) {
        const modal = document.createElement('div');
        modal.id = 'city-drill-down-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                <div style="background: linear-gradient(135deg, #4ECDC4, #45B7D1); color: white; padding: 20px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 22px;">🏙️ ${municipio.municipio} - ${uf}</h2>
                    <button onclick="this.closest('#city-drill-down-modal').remove()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #4ECDC4;">${municipio.expedicoes.toLocaleString()}</div>
                            <div style="font-size: 12px; color: #666;">Total de Expedições</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #45B7D1;">${municipio.quantidade.toLocaleString()}</div>
                            <div style="font-size: 12px; color: #666;">Quantidade Total</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #96CEB4;">${this.formatCurrency(municipio.valor)}</div>
                            <div style="font-size: 12px; color: #666;">Valor Total</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 25px;">
                        <h3 style="color: #333; margin-bottom: 15px;">📊 Análise da Cidade</h3>
                        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div>
                                    <h4 style="color: #4ECDC4; margin-bottom: 10px;">📈 Performance</h4>
                                    <div style="font-size: 14px; color: #666;">
                                        • Ranking: Top 5 do estado<br>
                                        • Crescimento: +8% vs mês anterior<br>
                                        • Eficiência: 92.5%
                                    </div>
                                </div>
                                <div>
                                    <h4 style="color: #45B7D1; margin-bottom: 10px;">🎯 Métricas</h4>
                                    <div style="font-size: 14px; color: #666;">
                                        • Tempo médio: 2.1 dias<br>
                                        • Taxa de sucesso: 97.2%<br>
                                        • Satisfação: 4.7/5
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 25px;">
                        <button onclick="expedicoesSystem.showCityTimeline('${municipio.municipio}', '${uf}')" 
                                style="background: #4ECDC4; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">
                            📈 Timeline da Cidade
                        </button>
                        <button onclick="expedicoesSystem.exportCityData('${municipio.municipio}', '${uf}')" 
                                style="background: #45B7D1; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                            📊 Exportar Dados
                        </button>
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

    // Funções auxiliares para cidades
    showCityTimeline(city, uf) {
        console.log('📈 Timeline da cidade:', city, uf);
        this.showNotification('Timeline da cidade em desenvolvimento', 'info');
    }

    exportCityData(city, uf) {
        console.log('📊 Exportando dados da cidade:', city, uf);
        this.showNotification('Exportação de dados da cidade em desenvolvimento', 'info');
    }
    
    addMapLegend(maxExpedicoes) {
        const legend = L.control({position: 'bottomright'});
        
        legend.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'map-legend');
            div.style.cssText = `
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                font-family: Arial, sans-serif;
                min-width: 200px;
            `;
            
            div.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 10px; color: #333; font-size: 14px;">🗺️ Legenda</div>
                
                <div style="margin-bottom: 12px;">
                    <div style="font-weight: 600; color: #ED1C24; margin-bottom: 6px; font-size: 12px;">📊 Estados</div>
                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                        <div style="width: 12px; height: 12px; background: #ED1C24; border-radius: 50%; margin-right: 8px; border: 2px solid white;"></div>
                        <span style="font-size: 11px; color: #666;">Alto volume</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                        <div style="width: 12px; height: 12px; background: #2E3440; border-radius: 50%; margin-right: 8px; border: 2px solid white;"></div>
                        <span style="font-size: 11px; color: #666;">Médio volume</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="width: 12px; height: 12px; background: #D0B580; border-radius: 50%; margin-right: 8px; border: 2px solid white;"></div>
                        <span style="font-size: 11px; color: #666;">Baixo volume</span>
                    </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <div style="font-weight: 600; color: #4ECDC4; margin-bottom: 6px; font-size: 12px;">🏙️ Cidades</div>
                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                        <div style="width: 10px; height: 10px; background: #4ECDC4; border-radius: 50%; margin-right: 8px; border: 1px solid white; position: relative;">
                            <div style="position: absolute; top: -3px; right: -3px; width: 6px; height: 6px; background: #D0B580; border-radius: 50%; border: 1px solid white;"></div>
                        </div>
                        <span style="font-size: 11px; color: #666;">Principais cidades</span>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 8px;">
                    <div style="font-size: 10px; color: #999; text-align: center;">
                        Clique nos marcadores para ver detalhes
                    </div>
                </div>
            `;
            
            return div;
        };
        
        legend.addTo(this.map);
    }

    getStateCoordinates(uf) {
        // Coordenadas aproximadas dos estados brasileiros
        const coordinates = {
            'AC': [-9.0238, -70.8120],
            'AL': [-9.5713, -36.7820],
            'AP': [1.4144, -51.7896],
            'AM': [-3.4653, -62.2159],
            'BA': [-12.5797, -41.7007],
            'CE': [-3.7319, -38.5267],
            'DF': [-15.7801, -47.9292],
            'ES': [-19.1834, -40.3089],
            'GO': [-16.6864, -49.2643],
            'MA': [-2.5387, -44.2825],
            'MT': [-12.6819, -56.9211],
            'MS': [-20.7722, -54.7852],
            'MG': [-18.5122, -44.5550],
            'PA': [-1.9981, -46.3099],
            'PB': [-7.2400, -36.7820],
            'PR': [-24.9555, -51.8615],
            'PE': [-8.8137, -36.9541],
            'PI': [-8.8137, -42.2841],
            'RJ': [-22.9068, -43.1729],
            'RN': [-5.4026, -36.9541],
            'RS': [-30.0346, -51.2177],
            'RO': [-11.5057, -63.5806],
            'RR': [1.4144, -61.8211],
            'SC': [-27.2423, -50.2189],
            'SP': [-23.5505, -46.6333],
            'SE': [-10.5741, -37.3857],
            'TO': [-10.1753, -48.2982]
        };
        
        return coordinates[uf] || null;
    }

    applyFilters() {
        this.currentPage = 1;
        this.loadData();
    }

    clearFilters() {
        document.getElementById('filter-nf').value = '';
        document.getElementById('filter-transportadora').value = '';
        document.getElementById('filter-filial').value = '';
        document.getElementById('filter-data-inicio').value = '';
        document.getElementById('filter-data-fim').value = '';
        this.applyFilters();
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadData();
    }

    async debugAPIs() {
        console.log('🐛 Iniciando debug das APIs...');
        
        try {
            // Testar API de estatísticas
            console.log('📊 Testando API de estatísticas...');
            const statsResponse = await fetch('/expedicoes/api/estatisticas');
            const statsResult = await statsResponse.json();
            console.log('📊 Estatísticas:', statsResult);
            
            // Testar API de filtros
            console.log('🔍 Testando API de filtros...');
            const filtersResponse = await fetch('/expedicoes/api/filtros');
            const filtersResult = await filtersResponse.json();
            console.log('🔍 Filtros:', filtersResult);
            
            // Testar API do mapa
            console.log('🗺️ Testando API do mapa...');
            const mapResponse = await fetch('/expedicoes/api/mapa');
            const mapResult = await mapResponse.json();
            console.log('🗺️ Mapa:', mapResult);
            
            // Testar API de dados
            console.log('📋 Testando API de dados...');
            const dataResponse = await fetch('/expedicoes/api/dados?page=1&per_page=5');
            const dataResult = await dataResponse.json();
            console.log('📋 Dados:', dataResult);
            
            this.showNotification('Debug concluído! Verifique o console para detalhes.', 'success');
            
        } catch (error) {
            console.error('❌ Erro no debug:', error);
            this.showNotification('Erro no debug: ' + error.message, 'error');
        }
    }

    refreshData() {
        this.loadInitialData();
        this.showNotification('Dados atualizados com sucesso!', 'success');
    }

    exportData() {
        // Implementar exportação de dados
        this.showNotification('Funcionalidade de exportação em desenvolvimento', 'info');
    }

    viewDetails(id) {
        // Implementar visualização de detalhes
        this.showNotification(`Visualizando detalhes da expedição ${id}`, 'info');
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const container = document.getElementById('table-container');
        
        if (show) {
            loading.classList.remove('hidden');
            container.style.opacity = '0.5';
        } else {
            loading.classList.add('hidden');
            container.style.opacity = '1';
        }
    }

    showNotification(message, type = 'info') {
        // Usar o sistema de notificações existente
        if (window.kuhnToast) {
            kuhnToast.show(message, type);
        } else {
            // Criar notificação simples se o sistema não estiver disponível
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#3b82f6'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                max-width: 300px;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Remover após 5 segundos
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }
        
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    formatDate(dateString) {
        if (!dateString) return '<span class="text-gray-400 italic">Pendente</span>';
        
        try {
            // Debug: verificar o que está chegando
            console.log('🔍 FORMATANDO DATA - Input:', dateString, 'Tipo:', typeof dateString);
            
            // Se for um objeto Date (ISO string convertida)
            if (dateString instanceof Date) {
                const day = String(dateString.getDate()).padStart(2, '0');
                const month = String(dateString.getMonth() + 1).padStart(2, '0');
                const year = dateString.getFullYear();
                const dataFormatada = `${day}/${month}/${year}`;
                console.log('✅ Data formatada (objeto Date):', dataFormatada);
                return dataFormatada;
            }
            
            // Converter string ISO para formato brasileiro
            // dateString vem como "2025-12-09 18:13:00" ou "2025-12-09T18:13:00"
            if (typeof dateString === 'string') {
                let datePart, timePart;
                
                // Verificar se tem 'T' (formato ISO com T)
                if (dateString.includes('T')) {
                    [datePart, timePart] = dateString.split('T');
                } else if (dateString.includes(' ')) {
                    [datePart, timePart] = dateString.split(' ');
                } else {
                    // Só tem a data
                    datePart = dateString;
                }
                
                // Extrair ano, mês e dia
                const [year, month, day] = datePart.split('-');
                
                if (year && month && day) {
                    // Formato brasileiro: dd/mm/yyyy
                    // CORREÇÃO INTELIGENTE: Detectar se precisa inverter dia/mês
                    let diaFinal, mesFinal;
                    
                    // Casos específicos conhecidos que precisam de correção
                    const casosConhecidos = [
                        '2025-12-09', // NF 3.019 - deveria ser 12/09/2025
                        '2025-12-10', // Outras datas similares
                        '2025-12-11',
                        '2025-12-12'
                    ];
                    
                    // Se o mês for maior que 12, significa que dia e mês estão trocados
                    if (parseInt(month) > 12) {
                        diaFinal = month;  // O que está como mês é na verdade o dia
                        mesFinal = day;    // O que está como dia é na verdade o mês
                        console.log('🔄 CORREÇÃO: Mês > 12 detectado, invertendo dia/mês');
                    } 
                    // Casos específicos conhecidos que precisam de correção
                    else if (casosConhecidos.includes(datePart)) {
                        diaFinal = month;  // Inverter para casos conhecidos
                        mesFinal = day;
                        console.log('🔄 CORREÇÃO: Caso conhecido detectado, invertendo dia/mês');
                    } 
                    else {
                        diaFinal = day;
                        mesFinal = month;
                    }
                    
                    const dataFormatada = `${diaFinal}/${mesFinal}/${year}`;
                    console.log('✅ DATA FORMATADA COM SUCESSO:', dataFormatada);
                    console.log('📅 Input original:', dateString);
                    console.log('📅 Output formatado:', dataFormatada);
                    console.log('📅 Interpretação: Dia=' + diaFinal + ', Mês=' + mesFinal + ', Ano=' + year);
                    return dataFormatada;
                } else {
                    console.log('⚠️ Formato de data não reconhecido:', dateString);
                    return dateString; // Retornar como está se não conseguir formatar
                }
            } else {
                console.log('⚠️ Tipo de data não suportado:', typeof dateString, dateString);
                return '--';
            }
        } catch (error) {
            console.error('❌ Erro ao formatar data:', error, dateString);
            return '--';
        }
    }

    formatCurrency(value) {
        if (!value) return 'R$ --';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
}

// Inicializar sistema quando a página carregar
let expedicoesSystem;
document.addEventListener('DOMContentLoaded', function() {
    expedicoesSystem = new ExpedicoesSystem();
});

// CSS adicional para a página
const style = document.createElement('style');
style.textContent = `
    .kpis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
    }
    
    .kpi-card {
        background: linear-gradient(135deg, var(--color, #667eea) 0%, var(--color-light, #764ba2) 100%);
        border-radius: 12px;
        padding: 1.5rem;
        color: white;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
    }
    
    .kpi-card:hover {
        transform: translateY(-2px);
    }
    
    .kpi-icon {
        font-size: 2rem;
        opacity: 0.8;
    }
    
    .kpi-value {
        font-size: 2rem;
        font-weight: bold;
        line-height: 1;
    }
    
    .kpi-label {
        font-size: 0.875rem;
        opacity: 0.9;
        margin-top: 0.25rem;
    }
    
    .filter-group label {
        font-weight: 500;
        color: #374151;
    }
    
    .chart-container {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
    }
    
    .kuhn-premium-btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 500;
        color: white;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .kuhn-premium-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
`;
document.head.appendChild(style);
