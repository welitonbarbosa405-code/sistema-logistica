/**
 * Sistema de Consumíveis - JavaScript Interativo v1.0
 * Controle de Estoque por Filial
 */

class ConsumiveisManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 200;  // Aumentado para mostrar mais registros
        this.totalRecords = 0;
        this.totalPages = 0;
        this.currentData = [];
        this.selectedItems = new Set();
        this.filters = {
            filial: '',
            nivel: '',
            codigo: ''
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateLastUpdateTime();
        this.setupScrollIndicators();
        
        // Atualizar tempo a cada minuto
        setInterval(() => this.updateLastUpdateTime(), 60000);
    }

    setupEventListeners() {
        // Botões principais
        document.getElementById('btnCadastrar')?.addEventListener('click', () => this.showCadastroModal());
        document.getElementById('btnAtualizar')?.addEventListener('click', () => this.loadData());
        document.getElementById('btnExportarExcel')?.addEventListener('click', () => this.exportarExcel());
        
        // Filtros
        document.getElementById('filtroFilial')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filtroNivel')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filtroCodigo')?.addEventListener('input', debounce(() => this.applyFilters(), 300));
        
        // Seletor de itens por página
        document.getElementById('filtroPerPage')?.addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value) || 200;
            this.currentPage = 1;
            this.loadData();
        });
        
        // Seleção
        document.getElementById('selectAll')?.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        
        // Formulário de cadastro
        document.getElementById('formCadastro')?.addEventListener('submit', (e) => this.handleCadastro(e));
        
        // Ordenação
        document.querySelectorAll('.th-sort').forEach(th => {
            th.addEventListener('click', () => this.sortTable(th.dataset.key));
        });
    }

    async loadData() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                per_page: this.pageSize,
                ...this.filters
            });

            const response = await fetch(`/consumiveis/api/consumiveis?${params}`);
            const data = await response.json();

            if (data.error) {
                this.showToast(data.error, 'error');
                return;
            }

            this.currentData = data.consumiveis || [];
            this.totalRecords = data.total || 0;
            this.totalPages = data.pages || 0;

            this.renderTable();
            this.updatePagination();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showToast('Erro ao carregar dados dos consumíveis', 'error');
        }
    }

    renderTable() {
        const tbody = document.getElementById('tbConsumiveis');
        if (!tbody) return;

        const totalColumns = tbody.closest('table')?.querySelectorAll('thead th').length || 8;

        if (this.currentData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${totalColumns}" class="text-center py-12 text-gray-500">
                        <div class="text-6xl mb-4">📦</div>
                        <div class="text-xl font-medium mb-2">Nenhum consumível encontrado</div>
                        <div class="text-sm">Ajuste os filtros ou cadastre novos consumíveis</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.currentData.map(consumivel => {
            // Calcular classe de status baseado no nível
            let rowClass = 'hover:bg-green-50';
            let borderClass = '';
            
            if (consumivel.saldo_estoque == 0) {
                rowClass = 'bg-red-50 border-l-4 border-l-red-500';
            } else if (consumivel.saldo_estoque <= consumivel.estoque_minimo) {
                rowClass = 'bg-yellow-50 border-l-4 border-l-yellow-500';
            }
            
            // Calcular percentual para barra de progresso
            let percentual = 0;
            if (consumivel.estoque_minimo > 0) {
                percentual = Math.min((consumivel.saldo_estoque / (consumivel.estoque_minimo * 2)) * 100, 100);
            }
            
            // Cor da barra baseada no nível
            let barColor = 'bg-gradient-to-r from-green-500 to-green-600';
            if (consumivel.saldo_estoque == 0) {
                barColor = 'bg-gradient-to-r from-red-500 to-red-600';
            } else if (consumivel.saldo_estoque <= consumivel.estoque_minimo) {
                barColor = 'bg-gradient-to-r from-yellow-500 to-yellow-600';
            }
            
            // Ícone de status
            let statusIcon = '';
            if (consumivel.saldo_estoque == 0) {
                statusIcon = '<div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><span class="text-red-600 text-sm">❌</span></div>';
            } else if (consumivel.saldo_estoque <= consumivel.estoque_minimo) {
                statusIcon = '<div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center"><span class="text-yellow-600 text-sm">⚠️</span></div>';
            } else {
                statusIcon = '<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><span class="text-green-600 text-sm">✅</span></div>';
            }
            
            const unidadeMedida = (consumivel.unidade_medida || '').toUpperCase();
            const unidadesColoridas = ['KG', 'G', 'TON', 'L', 'ML', 'M'];
            const unidadeBadge = `
                <span class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold border ${unidadesColoridas.includes(unidadeMedida) ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-700 bg-gray-50'}">
                    ${unidadeMedida || '--'}
                </span>
            `;

            // Badge de nível
            let nivelBadge = '';
            if (consumivel.saldo_estoque == 0) {
                nivelBadge = '<div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-md bg-gradient-to-r from-red-500 to-red-600 text-white"><div class="w-2 h-2 bg-white rounded-full mr-2"></div>Esgotado</div>';
            } else if (consumivel.saldo_estoque <= consumivel.estoque_minimo) {
                nivelBadge = '<div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-md bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"><div class="w-2 h-2 bg-white rounded-full mr-2"></div>Crítico</div>';
            } else if (consumivel.saldo_estoque <= (consumivel.estoque_minimo * 1.5)) {
                nivelBadge = '<div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-md bg-gradient-to-r from-orange-500 to-orange-600 text-white"><div class="w-2 h-2 bg-white rounded-full mr-2"></div>Baixo</div>';
            } else {
                nivelBadge = '<div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-md bg-gradient-to-r from-green-500 to-green-600 text-white"><div class="w-2 h-2 bg-white rounded-full mr-2"></div>Normal</div>';
            }
            
            return `
            <tr class="border-b border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200 group relative overflow-hidden ${rowClass}">
                <!-- Indicador de Status Lateral -->
                <div class="absolute left-0 top-0 bottom-0 w-1 ${consumivel.saldo_estoque == 0 ? 'bg-red-500' : (consumivel.saldo_estoque <= consumivel.estoque_minimo ? 'bg-yellow-500' : 'bg-green-500')}"></div>
                <td class="py-4 px-6">
                    <input type="checkbox" data-row-id="${consumivel.id}" 
                           class="rounded border-gray-300 text-red-600 focus:ring-red-500"
                           onchange="consumiveisManager.toggleRowSelection(this)">
                </td>
                <td class="py-4 px-6">
                    <div class="font-medium text-gray-700 group-hover:text-gray-800 transition-colors">
                        ${consumivel.filial}
                    </div>
                </td>
                <td class="py-4 px-6">
                    <div class="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                        ${consumivel.codigo}
                    </div>
                </td>
                <td class="py-4 px-6 text-gray-600">${consumivel.descricao}</td>
                <td class="py-4 px-6">${unidadeBadge}</td>
                <td class="py-4 px-6">
                    <!-- Saldo de Estoque com Indicador Visual -->
                    <div class="flex items-center gap-3">
                        <div class="flex-1">
                            <div class="font-bold text-lg ${consumivel.saldo_estoque == 0 ? 'text-red-600' : (consumivel.saldo_estoque <= consumivel.estoque_minimo ? 'text-yellow-600' : 'text-green-600')}">
                                ${consumivel.saldo_estoque}
                            </div>
                            <!-- Barra de Progresso Visual -->
                            <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div class="h-2 rounded-full transition-all duration-1000 ${barColor}" 
                                     style="width: ${percentual}%"></div>
                            </div>
                        </div>
                        <!-- Ícone de Status -->
                        <div class="flex-shrink-0">
                            ${statusIcon}
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6">
                    <div class="text-gray-600 font-medium">${consumivel.estoque_minimo}</div>
                </td>
                <td class="py-4 px-6">
                    ${nivelBadge}
                </td>                <td class="py-4 px-6">
                    <div class="flex items-center gap-2">
                        <button onclick="consumiveisManager.showMovimentacaoModal(${consumivel.id}, '${consumivel.codigo}', '${this.escapeHtml(consumivel.descricao)}', ${consumivel.saldo_estoque}, ${consumivel.estoque_minimo})" 
                                class="text-green-600 hover:text-green-800 transition-colors" 
                                data-tooltip="Movimentar estoque">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                            </svg>
                        </button>
                        <button onclick="consumiveisManager.showHistoricoModal(${consumivel.id}, '${consumivel.codigo}', '${this.escapeHtml(consumivel.descricao)}', ${consumivel.saldo_estoque})" 
                                class="text-purple-600 hover:text-purple-800 transition-colors" 
                                data-tooltip="Ver histórico">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </button>
                        <button onclick="consumiveisManager.editarConsumivel(${consumivel.id})" 
                                class="text-blue-600 hover:text-blue-800 transition-colors" 
                                data-tooltip="Editar consumível">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="consumiveisManager.excluirConsumivel(${consumivel.id})" 
                                class="text-red-600 hover:text-red-800 transition-colors" 
                                data-tooltip="Excluir consumível">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');
    }    getNivelEstoqueClass(nivel) {
        const classes = {
            'Normal': 'bg-green-100 text-green-800',
            'Baixo': 'bg-yellow-100 text-yellow-800',
            'Crítico': 'bg-red-100 text-red-800',
            'Esgotado': 'bg-gray-100 text-gray-800'
        };
        return classes[nivel] || 'bg-gray-100 text-gray-800';
    }

    // Função para escapar HTML e evitar problemas com caracteres especiais
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    async applyFilters() {
        this.filters.filial = document.getElementById('filtroFilial')?.value || '';
        this.filters.nivel = document.getElementById('filtroNivel')?.value || '';
        this.filters.codigo = document.getElementById('filtroCodigo')?.value || '';
        
        this.currentPage = 1;
        await this.loadData();
    }

    showCadastroModal() {
        const modal = document.getElementById('modalCadastro');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('formCadastro').reset();
        }
    }

    closeCadastroModal() {
        const modal = document.getElementById('modalCadastro');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async handleCadastro(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        data.unidade_medida = data.unidade_medida ? data.unidade_medida.trim().toUpperCase() : '';
        if (!data.unidade_medida) {
            this.showToast('Informe a unidade de medida', 'error');
            return;
        }
        if (data.unidade_medida.length > 20) {
            this.showToast('Unidade de medida deve ter no máximo 20 caracteres', 'error');
            return;
        }

        // Adicionar CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        try {
            const response = await fetch('/consumiveis/cadastrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.closeCadastroModal();
                await this.loadData();
            } else {
                // Mostrar erro mais detalhado se disponível
                let errorMessage = result.error;
                if (result.details) {
                    errorMessage += `\n${result.details}`;
                }
                if (result.suggestion) {
                    errorMessage += `\n💡 ${result.suggestion}`;
                }
                if (result.existing_item) {
                    errorMessage += `\n\n📋 Item existente:`;
                    errorMessage += `\n• Descrição: ${result.existing_item.descricao}`;
                    errorMessage += `\n• Saldo: ${result.existing_item.saldo_estoque}`;
                    errorMessage += `\n• Nível: ${result.existing_item.nivel_estoque}`;
                    errorMessage += `\n\n🔧 Clique aqui para editar o item existente`;
                }
                this.showToast(errorMessage, 'error');
                
                // Se houver item existente, adicionar funcionalidade de edição rápida
                if (result.existing_item) {
                    setTimeout(() => {
                        this.addQuickEditOption(result.existing_item.id);
                    }, 100);
                }
            }
            
        } catch (error) {
            console.error('Erro ao cadastrar:', error);
            this.showToast('Erro ao cadastrar consumível', 'error');
        }
    }

    async editarConsumivel(id) {
        try {
            const response = await fetch(`/consumiveis/editar/${id}`);
            if (response.ok) {
                // Redirecionar para página de edição
                window.location.href = `/consumiveis/editar/${id}`;
            } else {
                this.showToast('Erro ao carregar dados para edição', 'error');
            }
        } catch (error) {
            console.error('Erro ao editar:', error);
            this.showToast('Erro ao editar consumível', 'error');
        }
    }

    async excluirConsumivel(id) {
        if (!confirm('Tem certeza que deseja excluir este consumível?')) {
            return;
        }
        
        // Adicionar CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        try {
            const response = await fetch(`/consumiveis/excluir/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                await this.loadData();
            } else {
                this.showToast(result.error, 'error');
            }
            
        } catch (error) {
            console.error('Erro ao excluir:', error);
            this.showToast('Erro ao excluir consumível', 'error');
        }
    }

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
    }

    toggleRowSelection(checkbox) {
        const rowId = checkbox.dataset.rowId;
        if (checkbox.checked) {
            this.selectedItems.add(rowId);
        } else {
            this.selectedItems.delete(rowId);
        }
    }

    updatePagination() {
        // Implementar paginação se necessário
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

    sortTable(column) {
        // Implementar ordenação se necessário
        console.log('Ordenar por:', column);
    }

    async exportarExcel() {
        try {
            // Mostrar loading no botão
            const btnExportar = document.getElementById('btnExportarExcel');
            const originalText = btnExportar.innerHTML;
            btnExportar.innerHTML = `
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Exportando...
            `;
            btnExportar.disabled = true;

            // Construir URL com filtros atuais
            const params = new URLSearchParams();
            
            if (this.filters.filial) {
                params.append('filial', this.filters.filial);
            }
            if (this.filters.nivel) {
                params.append('nivel', this.filters.nivel);
            }
            if (this.filters.codigo) {
                params.append('codigo', this.filters.codigo);
            }

            // Criar link temporário para download
            const exportUrl = `/consumiveis/exportar-excel?${params.toString()}`;
            
            // Criar elemento link temporário
            const link = document.createElement('a');
            link.href = exportUrl;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Mostrar toast de sucesso
            this.showToast('Exportação iniciada! O arquivo será baixado em breve.', 'success');

        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
            this.showToast('Erro ao exportar dados para Excel', 'error');
        } finally {
            // Restaurar botão
            const btnExportar = document.getElementById('btnExportarExcel');
            btnExportar.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Exportar Excel
            `;
            btnExportar.disabled = false;
        }
    }

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
            <div class="flex items-start">
                <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900 whitespace-pre-line">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-400 hover:text-gray-600 flex-shrink-0">
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
        
        // Remover automaticamente após 8 segundos (mais tempo para ler)
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 8000);
        
        return toast;
    }

    addQuickEditOption(itemId) {
        // Adicionar botão de edição rápida no toast de erro
        const toastContainer = document.getElementById('toastContainer');
        const lastToast = toastContainer.lastElementChild;
        
        if (lastToast && lastToast.querySelector('.text-sm.font-medium.text-gray-900')) {
            const editButton = document.createElement('button');
            editButton.className = 'mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors';
            editButton.innerHTML = '✏️ Editar Item Existente';
            editButton.onclick = () => {
                this.editarConsumivel(itemId);
                lastToast.remove();
            };
            
            const contentDiv = lastToast.querySelector('.flex-1');
            contentDiv.appendChild(editButton);
        }
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }

    updateLastUpdateTime() {
        const element = document.getElementById('ultimaAtualizacao');
        if (element) {
            const now = new Date();
            element.textContent = `Última atualização: ${now.toLocaleTimeString('pt-BR')}`;
        }
    }

    setupScrollIndicators() {
        const scrollContainer = document.querySelector('.custom-scrollbar');
        if (!scrollContainer) return;

        const updateScrollIndicators = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            
            // Remover classes existentes
            scrollContainer.classList.remove('scroll-top', 'scroll-bottom');
            
            // Adicionar classe scroll-top se não estiver no topo
            if (scrollTop > 0) {
                scrollContainer.classList.add('scroll-top');
            }
            
            // Adicionar classe scroll-bottom se não estiver no final
            if (scrollTop < scrollHeight - clientHeight - 1) {
                scrollContainer.classList.add('scroll-bottom');
            }
        };

        // Atualizar indicadores no scroll
        scrollContainer.addEventListener('scroll', updateScrollIndicators);
        
        // Atualizar indicadores inicialmente
        updateScrollIndicators();
        
        // Atualizar indicadores quando os dados mudarem
        const originalLoadData = this.loadData.bind(this);
        this.loadData = async () => {
            await originalLoadData();
            setTimeout(updateScrollIndicators, 100); // Aguardar renderização
        };
    }

    // ==================== MÉTODOS DE MOVIMENTAÇÃO DE ESTOQUE ====================
    
    showMovimentacaoModal(id, codigo, descricao, saldoAtual, estoqueMinimo) {
        const modal = document.getElementById('modalMovimentacao');
        if (!modal) return;
        
        // Preencher dados do consumível
        document.getElementById('movConsumivelId').value = id;
        document.getElementById('movConsumivel').textContent = codigo;
        document.getElementById('movDescricao').textContent = descricao;
        document.getElementById('movSaldoAtual').textContent = saldoAtual;
        document.getElementById('movEstoqueMinimo').textContent = estoqueMinimo;
        document.getElementById('movNovoSaldo').textContent = saldoAtual;
        
        // Limpar formulário
        document.getElementById('formMovimentacao').reset();
        document.getElementById('movQuantidade').value = '';
        
        // Armazenar saldo atual para cálculos
        this.movSaldoAtual = saldoAtual;
        
        // Configurar listeners para atualizar preview
        this.setupMovimentacaoListeners();
        
        modal.classList.remove('hidden');
    }
    
    closeMovimentacaoModal() {
        const modal = document.getElementById('modalMovimentacao');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    setupMovimentacaoListeners() {
        const quantidadeInput = document.getElementById('movQuantidade');
        const tipoInputs = document.querySelectorAll('input[name="tipoMovimentacao"]');
        
        const updatePreview = () => {
            const quantidade = parseInt(quantidadeInput.value) || 0;
            const tipoSelecionado = document.querySelector('input[name="tipoMovimentacao"]:checked');
            const tipo = tipoSelecionado ? tipoSelecionado.value : null;
            
            let novoSaldo = this.movSaldoAtual;
            if (tipo === 'ENTRADA') {
                novoSaldo = this.movSaldoAtual + quantidade;
            } else if (tipo === 'SAIDA') {
                novoSaldo = this.movSaldoAtual - quantidade;
            }
            
            const previewEl = document.getElementById('movNovoSaldo');
            previewEl.textContent = novoSaldo;
            
            // Mudar cor se negativo
            if (novoSaldo < 0) {
                previewEl.classList.add('text-red-600');
                previewEl.classList.remove('text-blue-700');
            } else {
                previewEl.classList.remove('text-red-600');
                previewEl.classList.add('text-blue-700');
            }
        };
        
        quantidadeInput.addEventListener('input', updatePreview);
        tipoInputs.forEach(input => input.addEventListener('change', updatePreview));
        
        // Configurar submit do formulário
        const form = document.getElementById('formMovimentacao');
        form.onsubmit = (e) => this.handleMovimentacao(e);
    }
    
    async handleMovimentacao(e) {
        e.preventDefault();
        
        const id = document.getElementById('movConsumivelId').value;
        const tipoSelecionado = document.querySelector('input[name="tipoMovimentacao"]:checked');
        const quantidade = parseInt(document.getElementById('movQuantidade').value);
        const motivo = document.getElementById('movMotivo').value;
        const observacao = document.getElementById('movObservacao').value;
        
        if (!tipoSelecionado) {
            this.showToast('Selecione o tipo de movimentação', 'error');
            return;
        }
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        try {
            const response = await fetch(`/consumiveis/movimentar/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    tipo: tipoSelecionado.value,
                    quantidade: quantidade,
                    motivo: motivo,
                    observacao: observacao
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.closeMovimentacaoModal();
                // Recarregar página para atualizar dados
                window.location.reload();
            } else {
                this.showToast(result.error, 'error');
            }
        } catch (error) {
            console.error('Erro ao registrar movimentação:', error);
            this.showToast('Erro ao registrar movimentação', 'error');
        }
    }
    
    // ==================== MÉTODOS DE HISTÓRICO ====================
    
    historicoPage = 1;
    historicoConsumivelId = null;
    
    showHistoricoModal(id, codigo, descricao, saldoAtual) {
        const modal = document.getElementById('modalHistorico');
        if (!modal) return;
        
        // Preencher dados do consumível
        document.getElementById('histConsumivel').textContent = codigo;
        document.getElementById('histDescricao').textContent = descricao;
        document.getElementById('histSaldoAtual').textContent = saldoAtual;
        
        this.historicoConsumivelId = id;
        this.historicoPage = 1;
        
        modal.classList.remove('hidden');
        this.loadHistorico();
    }
    
    closeHistoricoModal() {
        const modal = document.getElementById('modalHistorico');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    async loadHistorico() {
        try {
            const response = await fetch(`/consumiveis/historico/${this.historicoConsumivelId}?page=${this.historicoPage}&per_page=10`);
            const data = await response.json();
            
            const tbody = document.getElementById('tbHistorico');
            const vazioEl = document.getElementById('historicoVazio');
            
            if (data.movimentacoes.length === 0) {
                tbody.innerHTML = '';
                vazioEl.classList.remove('hidden');
            } else {
                vazioEl.classList.add('hidden');
                tbody.innerHTML = data.movimentacoes.map(mov => `
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm text-gray-600">${mov.data_movimentacao}</td>
                        <td class="px-4 py-3">
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${mov.tipo === 'ENTRADA' ? '📥' : '📤'} ${mov.tipo}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm font-semibold ${mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}">
                            ${mov.tipo === 'ENTRADA' ? '+' : '-'}${mov.quantidade}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-600">${mov.saldo_anterior}</td>
                        <td class="px-4 py-3 text-sm font-semibold text-gray-800">${mov.saldo_atual}</td>
                        <td class="px-4 py-3 text-sm text-gray-600">${mov.motivo}</td>
                        <td class="px-4 py-3 text-sm text-gray-500">${mov.usuario_email}</td>
                    </tr>
                `).join('');
            }
            
            // Atualizar paginação
            document.getElementById('histInfo').textContent = `Mostrando ${data.movimentacoes.length} de ${data.total} movimentações`;
            document.getElementById('histPrevBtn').disabled = !data.has_prev;
            document.getElementById('histNextBtn').disabled = !data.has_next;
            
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            this.showToast('Erro ao carregar histórico', 'error');
        }
    }
    
    loadHistoricoPrev() {
        if (this.historicoPage > 1) {
            this.historicoPage--;
            this.loadHistorico();
        }
    }
    
    loadHistoricoNext() {
        this.historicoPage++;
        this.loadHistorico();
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

// Instanciar o manager globalmente
const consumiveisManager = new ConsumiveisManager();
