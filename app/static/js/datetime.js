/**
 * 🚀 SISTEMA DE DATA/HORA IMPRESSIONANTE - Kuhn Parts Brasil
 * Versão: 2.0 - Ultra Otimizada e Visualmente Espetacular
 * 
 * Funcionalidades:
 * - Data e hora em tempo real
 * - Formatação brasileira completa
 * - Efeitos visuais impressionantes
 * - Sincronização precisa
 * - Performance otimizada
 */

class DateTimeManager {
    constructor() {
        this.elements = {
            data: null,
            hora: null,
            diaSemana: null
        };
        
        this.config = {
            updateInterval: 1000, // 1 segundo
            animationDuration: 300,
            glowIntensity: 0.8,
            timezone: 'America/Sao_Paulo'
        };
        
        this.isRunning = false;
        this.lastUpdate = null;
        
        this.init();
    }
    
    init() {
        console.log('🚀 Inicializando DateTimeManager...');
        
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }
    
    start() {
        console.log('⏰ Iniciando sistema de data/hora...');
        
        // Buscar elementos
        this.findElements();
        
        if (this.elements.data && this.elements.hora) {
            console.log('✅ Elementos encontrados!');
            
            // Primeira atualização imediata
            this.updateDateTime();
            
            // Configurar atualização contínua
            this.startInterval();
            
            // Adicionar efeitos visuais
            this.addVisualEffects();
            
            // Adicionar eventos especiais
            this.addSpecialEvents();
            
            this.isRunning = true;
            console.log('🎉 Sistema de data/hora ativo!');
        } else {
            console.error('❌ Elementos não encontrados!');
            this.retryInit();
        }
    }
    
    findElements() {
        // Buscar elementos do rodapé padrão (outras páginas)
        this.elements.data = document.getElementById('footerData');
        this.elements.hora = document.getElementById('footerHora');
        this.elements.diaSemana = document.getElementById('footerDia');
        
        // Se não encontrar, buscar elementos da tela de login
        if (!this.elements.data) {
            this.elements.data = document.getElementById('statusDate');
        }
        if (!this.elements.hora) {
            this.elements.hora = document.getElementById('statusTime');
        }
        if (!this.elements.diaSemana) {
            this.elements.diaSemana = document.getElementById('statusDay');
        }
        
        // Atualizar ano também
        const yearElement = document.getElementById('footerYear') || document.getElementById('statusYear');
        if (yearElement) {
            const now = new Date();
            yearElement.textContent = `© ${now.getFullYear()}`;
        }
    }
    
    createDayOfWeekElement() {
        const dayContainer = document.createElement('div');
        dayContainer.className = 'flex items-center gap-2';
        
        const dayLabel = document.createElement('span');
        dayLabel.className = 'text-white font-semibold text-sm opacity-80';
        dayLabel.textContent = 'Dia:';
        
        const dayValue = document.createElement('span');
        dayValue.id = 'footerDiaSemana';
        dayValue.className = 'footer-info-box px-3 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg';
        
        dayContainer.appendChild(dayLabel);
        dayContainer.appendChild(dayValue);
        
        // Inserir antes do elemento de data
        this.elements.data.parentElement.parentElement.insertBefore(dayContainer, this.elements.data.parentElement);
        
        this.elements.diaSemana = dayValue;
    }
    
    updateDateTime() {
        const now = new Date();
        
        // Formatação brasileira completa
        const dateOptions = {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            timeZone: this.config.timezone
        };
        
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: this.config.timezone,
            hour12: false
        };
        
        const dayOptions = {
            weekday: 'long',
            timeZone: this.config.timezone
        };
        
        const dataFormatada = now.toLocaleDateString('pt-BR', dateOptions);
        const horaFormatada = now.toLocaleTimeString('pt-BR', timeOptions);
        const diaSemana = now.toLocaleDateString('pt-BR', dayOptions);
        
        // Atualizar elementos com animação
        this.updateElement(this.elements.data, dataFormatada, 'data');
        this.updateElement(this.elements.hora, horaFormatada, 'hora');
        
        if (this.elements.diaSemana) {
            this.updateElement(this.elements.diaSemana, diaSemana, 'dia');
        }
        
        this.lastUpdate = now;
    }
    
    updateElement(element, value, type) {
        if (!element) return;
        
        // Efeito de transição suave
        element.style.transition = `all ${this.config.animationDuration}ms ease-in-out`;
        element.style.transform = 'scale(0.95)';
        element.style.opacity = '0.7';
        
        setTimeout(() => {
            element.textContent = value;
            element.style.transform = 'scale(1)';
            element.style.opacity = '1';
            
            // Efeito especial baseado no tipo
            this.addSpecialEffect(element, type);
        }, this.config.animationDuration / 2);
    }
    
    addSpecialEffect(element, type) {
        switch(type) {
            case 'hora':
                // Efeito de pulso a cada segundo
                element.classList.add('animate-pulse');
                setTimeout(() => element.classList.remove('animate-pulse'), 500);
                
                // Glow effect especial para hora
                element.style.boxShadow = '0 0 20px rgba(237, 28, 36, 0.6)';
                setTimeout(() => element.style.boxShadow = '', 1000);
                break;
                
            case 'data':
                // Efeito de brilho suave
                element.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
                setTimeout(() => element.style.textShadow = '', 2000);
                break;
                
            case 'dia':
                // Efeito de rotação sutil
                element.style.transform = 'rotateY(360deg)';
                setTimeout(() => element.style.transform = '', 1000);
                break;
        }
    }
    
    addVisualEffects() {
        // Efeito de hover nos elementos de data/hora
        [this.elements.data, this.elements.hora, this.elements.diaSemana].forEach(element => {
            if (!element) return;
            
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'scale(1.1)';
                element.style.filter = 'brightness(1.3) saturate(1.2)';
                element.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.3)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'scale(1)';
                element.style.filter = '';
                element.style.boxShadow = '';
            });
        });
        
        // Efeito de clique para mostrar informações extras
        if (this.elements.hora) {
            this.elements.hora.addEventListener('click', () => {
                this.showTimeInfo();
            });
        }
    }
    
    showTimeInfo() {
        const now = new Date();
        const info = {
            timestamp: now.getTime(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            utc: now.toISOString(),
            unix: Math.floor(now.getTime() / 1000)
        };
        
        // Criar tooltip informativo
        const tooltip = document.createElement('div');
        tooltip.className = 'fixed top-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-2xl z-50 border border-gray-700';
        tooltip.innerHTML = `
            <div class="text-sm space-y-2">
                <div><strong>Timestamp:</strong> ${info.timestamp}</div>
                <div><strong>UTC:</strong> ${info.utc}</div>
                <div><strong>Unix:</strong> ${info.unix}</div>
                <div><strong>Timezone:</strong> ${info.timezone}</div>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Remover após 3 segundos
        setTimeout(() => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'scale(0.8)';
            setTimeout(() => document.body.removeChild(tooltip), 300);
        }, 3000);
    }
    
    addSpecialEvents() {
        // Atualização especial a cada minuto
        setInterval(() => {
            const now = new Date();
            if (now.getSeconds() === 0) {
                this.updateDateTime();
                console.log('🔄 Atualização especial do minuto:', now.toLocaleTimeString('pt-BR'));
            }
        }, 1000);
        
        // Efeito especial na virada do dia
        setInterval(() => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
                this.celebrateNewDay();
            }
        }, 1000);
    }
    
    celebrateNewDay() {
        console.log('🎉 NOVO DIA!');
        
        // Efeito de confete virtual
        const celebration = document.createElement('div');
        celebration.className = 'fixed inset-0 pointer-events-none z-50';
        celebration.innerHTML = `
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl animate-bounce">
                🎉
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        setTimeout(() => {
            celebration.style.opacity = '0';
            setTimeout(() => document.body.removeChild(celebration), 1000);
        }, 2000);
    }
    
    startInterval() {
        setInterval(() => {
            this.updateDateTime();
        }, this.config.updateInterval);
    }
    
    retryInit() {
        console.log('🔄 Tentando novamente em 2 segundos...');
        setTimeout(() => {
            this.findElements();
            if (this.elements.data && this.elements.hora) {
                this.start();
            } else {
                this.retryInit();
            }
        }, 2000);
    }
    
    // Método público para parar o sistema
    stop() {
        this.isRunning = false;
        console.log('⏹️ Sistema de data/hora parado');
    }
    
    // Método público para reiniciar
    restart() {
        this.stop();
        setTimeout(() => this.start(), 1000);
    }
}

// Inicializar automaticamente
const dateTimeManager = new DateTimeManager();

// Exportar para uso global
window.DateTimeManager = DateTimeManager;
window.dateTimeManager = dateTimeManager;

console.log('🚀 Sistema de Data/Hora Impressionante carregado!');
