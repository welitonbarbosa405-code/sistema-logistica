/**
 * 📊 DASHBOARD DE MÉTRICAS EM TEMPO REAL
 * Versão: 2.0 - Kuhn Parts Brasil Analytics
 * 
 * Funcionalidades:
 * - Métricas em tempo real
 * - Gráficos animados
 * - Indicadores de performance
 * - Estatísticas da empresa
 * - Sistema de alertas inteligentes
 */

class KuhnAnalyticsDashboard {
    constructor() {
        this.metrics = {
            system: {
                uptime: 0,
                memory: 0,
                cpu: 0,
                connections: 0
            },
            user: {
                sessions: 0,
                interactions: 0,
                pageViews: 0,
                uniqueVisitors: 0
            },
            business: {
                orders: 0,
                deliveries: 0,
                revenue: 0,
                satisfaction: 0
            }
        };
        
        this.charts = {};
        this.alerts = [];
        this.isVisible = false;
        
        this.init();
    }
    
    init() {
        console.log('📊 Inicializando Dashboard Kuhn Analytics...');
        
        // Criar container do dashboard
        this.createDashboardContainer();
        
        // Iniciar coleta de métricas
        this.startMetricsCollection();
        
        // Criar botão de toggle
        this.createToggleButton();
        
        // Configurar atualizações automáticas
        this.setupAutoUpdates();
        
        console.log('✅ Dashboard Kuhn Analytics ativo!');
    }
    
    createDashboardContainer() {
        const container = document.createElement('div');
        container.id = 'kuhn-analytics-dashboard';
        container.className = 'fixed top-4 left-4 z-40';
        container.style.cssText = `
            width: 350px;
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px;
            color: white;
            font-family: 'Segoe UI', sans-serif;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            transform: translateX(-100%);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            pointer-events: none;
        `;
        
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #ED1C24;">
                    📊 Kuhn Analytics
                </h3>
                <p style="font-size: 12px; opacity: 0.8;">
                    Métricas em tempo real do sistema
                </p>
            </div>
            
            <div id="analytics-content" style="space-y: 16px;">
                <!-- Conteúdo será inserido aqui -->
            </div>
            
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; opacity: 0.7;">Última atualização:</span>
                    <span id="last-update" style="font-size: 12px; font-weight: 600;">--:--:--</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        this.container = container;
    }
    
    createToggleButton() {
        const button = document.createElement('div');
        button.id = 'kuhn-analytics-toggle';
        button.className = 'fixed top-4 left-4 z-50';
        button.style.cssText = `
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #ED1C24, #FF4757);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 30px rgba(237, 28, 36, 0.3);
            font-size: 20px;
            color: white;
            user-select: none;
        `;
        
        button.innerHTML = '📊';
        
        // Efeitos de hover
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 15px 40px rgba(237, 28, 36, 0.5)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 10px 30px rgba(237, 28, 36, 0.3)';
        });
        
        // Clique para toggle
        button.addEventListener('click', () => {
            this.toggle();
        });
        
        document.body.appendChild(button);
        this.toggleButton = button;
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
        
        if (this.isVisible) {
            this.show();
        } else {
            this.hide();
        }
    }
    
    show() {
        this.container.style.transform = 'translateX(0)';
        this.container.style.opacity = '1';
        this.container.style.pointerEvents = 'auto';
        
        // Atualizar conteúdo
        this.updateContent();
        
        // Notificar
        if (window.kuhnNotifications) {
            window.kuhnNotifications.showNotification(
                'Dashboard Aberto',
                'Analytics Kuhn Parts Brasil ativo',
                'info',
                2000
            );
        }
    }
    
    hide() {
        this.container.style.transform = 'translateX(-100%)';
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';
    }
    
    startMetricsCollection() {
        // Simular métricas do sistema
        setInterval(() => {
            this.metrics.system.uptime += 1;
            this.metrics.system.memory = Math.random() * 100;
            this.metrics.system.cpu = Math.random() * 100;
            this.metrics.system.connections = Math.floor(Math.random() * 50) + 10;
            
            // Métricas de usuário
            this.metrics.user.sessions += Math.floor(Math.random() * 3);
            this.metrics.user.interactions += Math.floor(Math.random() * 5);
            this.metrics.user.pageViews += Math.floor(Math.random() * 10);
            
            // Métricas de negócio
            this.metrics.business.orders += Math.floor(Math.random() * 2);
            this.metrics.business.deliveries += Math.floor(Math.random() * 3);
            this.metrics.business.revenue += Math.floor(Math.random() * 1000);
            this.metrics.business.satisfaction = Math.min(100, this.metrics.business.satisfaction + Math.random() * 2);
            
            // Atualizar dashboard se visível
            if (this.isVisible) {
                this.updateContent();
            }
        }, 2000);
    }
    
    updateContent() {
        const content = document.getElementById('analytics-content');
        if (!content) return;
        
        const uptime = this.formatUptime(this.metrics.system.uptime);
        
        content.innerHTML = `
            <!-- Sistema -->
            <div style="margin-bottom: 16px;">
                <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #60A5FA;">
                    🖥️ Sistema
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                    <div style="opacity: 0.8;">Uptime:</div>
                    <div style="font-weight: 600;">${uptime}</div>
                    <div style="opacity: 0.8;">Memória:</div>
                    <div style="font-weight: 600;">${this.metrics.system.memory.toFixed(1)}%</div>
                    <div style="opacity: 0.8;">CPU:</div>
                    <div style="font-weight: 600;">${this.metrics.system.cpu.toFixed(1)}%</div>
                    <div style="opacity: 0.8;">Conexões:</div>
                    <div style="font-weight: 600;">${this.metrics.system.connections}</div>
                </div>
            </div>
            
            <!-- Usuários -->
            <div style="margin-bottom: 16px;">
                <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #10B981;">
                    👥 Usuários
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                    <div style="opacity: 0.8;">Sessões:</div>
                    <div style="font-weight: 600;">${this.metrics.user.sessions}</div>
                    <div style="opacity: 0.8;">Interações:</div>
                    <div style="font-weight: 600;">${this.metrics.user.interactions}</div>
                    <div style="opacity: 0.8;">Páginas:</div>
                    <div style="font-weight: 600;">${this.metrics.user.pageViews}</div>
                    <div style="opacity: 0.8;">Visitantes:</div>
                    <div style="font-weight: 600;">${this.metrics.user.uniqueVisitors}</div>
                </div>
            </div>
            
            <!-- Negócio -->
            <div style="margin-bottom: 16px;">
                <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #F59E0B;">
                    🚛 Negócio
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                    <div style="opacity: 0.8;">Pedidos:</div>
                    <div style="font-weight: 600;">${this.metrics.business.orders}</div>
                    <div style="opacity: 0.8;">Entregas:</div>
                    <div style="font-weight: 600;">${this.metrics.business.deliveries}</div>
                    <div style="opacity: 0.8;">Receita:</div>
                    <div style="font-weight: 600;">R$ ${this.metrics.business.revenue.toLocaleString()}</div>
                    <div style="opacity: 0.8;">Satisfação:</div>
                    <div style="font-weight: 600;">${this.metrics.business.satisfaction.toFixed(1)}%</div>
                </div>
            </div>
            
            <!-- Gráfico de Performance -->
            <div style="margin-bottom: 16px;">
                <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #8B5CF6;">
                    📈 Performance
                </h4>
                <div style="height: 60px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 8px;">
                    <div style="display: flex; align-items: end; height: 100%; gap: 2px;">
                        ${this.generateMiniChart()}
                    </div>
                </div>
            </div>
        `;
        
        // Atualizar timestamp
        const lastUpdate = document.getElementById('last-update');
        if (lastUpdate) {
            lastUpdate.textContent = new Date().toLocaleTimeString('pt-BR');
        }
    }
    
    generateMiniChart() {
        const data = [];
        for (let i = 0; i < 20; i++) {
            data.push(Math.random() * 100);
        }
        
        return data.map(value => `
            <div style="
                width: 4px;
                height: ${value}%;
                background: linear-gradient(to top, #ED1C24, #FF4757);
                border-radius: 2px;
                opacity: 0.8;
            "></div>
        `).join('');
    }
    
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    setupAutoUpdates() {
        // Atualizar dashboard a cada 5 segundos
        setInterval(() => {
            if (this.isVisible) {
                this.updateContent();
            }
        }, 5000);
        
        // Verificar alertas a cada 10 segundos
        setInterval(() => {
            this.checkAlerts();
        }, 10000);
    }
    
    checkAlerts() {
        // Alerta de alta CPU
        if (this.metrics.system.cpu > 80) {
            this.addAlert('CPU Alta', 'Uso de CPU acima de 80%', 'warning');
        }
        
        // Alerta de alta memória
        if (this.metrics.system.memory > 90) {
            this.addAlert('Memória Alta', 'Uso de memória acima de 90%', 'error');
        }
        
        // Alerta de satisfação baixa
        if (this.metrics.business.satisfaction < 70) {
            this.addAlert('Satisfação Baixa', 'Satisfação do cliente abaixo de 70%', 'warning');
        }
    }
    
    addAlert(title, message, type) {
        const alertId = `${title}-${Date.now()}`;
        
        // Evitar alertas duplicados
        if (this.alerts.some(alert => alert.title === title && Date.now() - alert.timestamp < 30000)) {
            return;
        }
        
        this.alerts.push({
            id: alertId,
            title,
            message,
            type,
            timestamp: Date.now()
        });
        
        // Notificar
        if (window.kuhnNotifications) {
            window.kuhnNotifications.showNotification(title, message, type, 5000);
        }
        
        // Remover alerta após 30 segundos
        setTimeout(() => {
            this.alerts = this.alerts.filter(alert => alert.id !== alertId);
        }, 30000);
    }
    
    // Métodos públicos
    getMetrics() {
        return { ...this.metrics };
    }
    
    getAlerts() {
        return [...this.alerts];
    }
    
    showDashboard() {
        this.show();
    }
    
    hideDashboard() {
        this.hide();
    }
}

// Inicializar sistema automaticamente
const kuhnAnalytics = new KuhnAnalyticsDashboard();

// Exportar para uso global
window.KuhnAnalytics = KuhnAnalyticsDashboard;
window.kuhnAnalytics = kuhnAnalytics;

console.log('📊 Dashboard Kuhn Analytics carregado!');
