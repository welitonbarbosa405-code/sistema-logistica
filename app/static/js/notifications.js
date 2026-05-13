/**
 * 🚀 SISTEMA DE NOTIFICAÇÕES E EFEITOS IMPRESSIONANTES
 * Versão: 2.0 - Kuhn Parts Brasil Ultra Premium
 * 
 * Funcionalidades:
 * - Notificações em tempo real
 * - Efeitos sonoros sutis
 * - Feedback tátil
 * - Animações avançadas
 * - Sistema de métricas dinâmicas
 */

class KuhnNotificationSystem {
    constructor() {
        this.notifications = [];
        this.soundEnabled = true;
        this.vibrationEnabled = true;
        this.metrics = {
            pageViews: 0,
            interactions: 0,
            notifications: 0,
            startTime: Date.now()
        };
        
        this.init();
    }
    
    init() {
        console.log('🚀 Inicializando Sistema de Notificações Kuhn...');
        
        // Criar container de notificações
        this.createNotificationContainer();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Iniciar métricas em tempo real
        this.startMetricsTracking();
        
        // Notificação de boas-vindas
        this.showWelcomeNotification();
        
        console.log('✅ Sistema de Notificações Kuhn ativo!');
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'kuhn-notifications';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        container.style.cssText = `
            max-width: 400px;
            pointer-events: none;
        `;
        
        document.body.appendChild(container);
        this.container = container;
    }
    
    setupEventListeners() {
        // Detectar interações do usuário
        document.addEventListener('click', () => {
            this.metrics.interactions++;
            this.playSound('click');
            this.vibrate(10);
        });
        
        // Detectar scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.playSound('scroll');
            }, 100);
        });
        
        // Detectar mudanças de foco
        window.addEventListener('focus', () => {
            this.showNotification('Sistema Online', 'Sistema Kuhn Parts Brasil ativo e funcionando perfeitamente!', 'success');
        });
        
        window.addEventListener('blur', () => {
            this.showNotification('Sistema em Background', 'Sistema continua rodando em segundo plano.', 'info');
        });
    }
    
    showNotification(title, message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `kuhn-notification kuhn-notification-${type}`;
        notification.style.cssText = `
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 8px;
            color: white;
            font-family: 'Segoe UI', sans-serif;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            position: relative;
            overflow: hidden;
        `;
        
        // Ícone baseado no tipo
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            kuhn: '🚛'
        };
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 20px;">${icons[type] || icons.info}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #ED1C24;">${title}</div>
                    <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none; 
                    border: none; 
                    color: white; 
                    cursor: pointer; 
                    font-size: 18px; 
                    opacity: 0.7;
                    transition: opacity 0.2s;
                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</button>
            </div>
            <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: linear-gradient(90deg, #ED1C24, #FF4757);
                animation: notificationProgress ${duration}ms linear;
            "></div>
        `;
        
        // Adicionar estilos CSS para animação
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes notificationProgress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                
                .kuhn-notification-success {
                    border-left: 4px solid #10B981;
                }
                
                .kuhn-notification-error {
                    border-left: 4px solid #EF4444;
                }
                
                .kuhn-notification-warning {
                    border-left: 4px solid #F59E0B;
                }
                
                .kuhn-notification-info {
                    border-left: 4px solid #3B82F6;
                }
                
                .kuhn-notification-kuhn {
                    border-left: 4px solid #ED1C24;
                }
            `;
            document.head.appendChild(style);
        }
        
        this.container.appendChild(notification);
        
        // Animação de entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remover
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 400);
        }, duration);
        
        // Efeitos sonoros
        this.playSound(type);
        
        // Vibração
        if (type === 'error' || type === 'warning') {
            this.vibrate(200);
        }
        
        this.metrics.notifications++;
    }
    
    playSound(type) {
        if (!this.soundEnabled) return;
        
        // Criar contexto de áudio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const frequencies = {
            success: [523, 659, 784], // C-E-G
            error: [220, 185, 147],   // A-F#-D
            warning: [440, 370],      // A-F#
            info: [523, 659],        // C-E
            click: [800],
            scroll: [400],
            kuhn: [523, 659, 784, 1047] // C-E-G-C
        };
        
        const freq = frequencies[type] || frequencies.info;
        
        freq.forEach((frequency, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            }, index * 50);
        });
    }
    
    vibrate(duration) {
        if (!this.vibrationEnabled || !navigator.vibrate) return;
        
        navigator.vibrate(duration);
    }
    
    startMetricsTracking() {
        // Atualizar métricas a cada segundo
        setInterval(() => {
            this.updateMetricsDisplay();
        }, 1000);
        
        // Mostrar métricas a cada 30 segundos
        setInterval(() => {
            this.showMetricsNotification();
        }, 30000);
    }
    
    updateMetricsDisplay() {
        const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000);
        const minutes = Math.floor(uptime / 60);
        const seconds = uptime % 60;
        
        // Atualizar título da página com métricas
        document.title = `Kuhn Parts Brasil • ${minutes}:${seconds.toString().padStart(2, '0')} • ${this.metrics.interactions} interações`;
    }
    
    showMetricsNotification() {
        const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000);
        const minutes = Math.floor(uptime / 60);
        
        this.showNotification(
            'Métricas do Sistema',
            `Tempo online: ${minutes}min • Interações: ${this.metrics.interactions} • Notificações: ${this.metrics.notifications}`,
            'info',
            3000
        );
    }
    
    showWelcomeNotification() {
        setTimeout(() => {
            this.showNotification(
                'Bem-vindo ao Kuhn Parts Brasil!',
                'Sistema de logística premium com efeitos impressionantes ativado.',
                'kuhn',
                4000
            );
        }, 1000);
    }
    
    // Métodos públicos
    enableSound() {
        this.soundEnabled = true;
        this.showNotification('Som Ativado', 'Efeitos sonoros habilitados.', 'success');
    }
    
    disableSound() {
        this.soundEnabled = false;
        this.showNotification('Som Desativado', 'Efeitos sonoros desabilitados.', 'info');
    }
    
    enableVibration() {
        this.vibrationEnabled = true;
        this.showNotification('Vibração Ativada', 'Feedback tátil habilitado.', 'success');
    }
    
    disableVibration() {
        this.vibrationEnabled = false;
        this.showNotification('Vibração Desativada', 'Feedback tátil desabilitado.', 'info');
    }
    
    getMetrics() {
        return { ...this.metrics };
    }
}

// Inicializar sistema automaticamente
const kuhnNotifications = new KuhnNotificationSystem();

// Exportar para uso global
window.KuhnNotifications = KuhnNotificationSystem;
window.kuhnNotifications = kuhnNotifications;

console.log('🚀 Sistema de Notificações Kuhn carregado!');
