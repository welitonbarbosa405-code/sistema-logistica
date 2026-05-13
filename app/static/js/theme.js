/**
 * 🌙 SISTEMA DE MODO ESCURO/CLARO DINÂMICO
 * Versão: 2.0 - Kuhn Parts Brasil Premium
 * 
 * Funcionalidades:
 * - Alternância automática baseada no horário
 * - Controle manual pelo usuário
 * - Transições suaves
 * - Persistência de preferências
 * - Efeitos especiais para cada modo
 */

class KuhnThemeManager {
    constructor() {
        this.currentTheme = 'auto';
        this.themes = {
            light: {
                name: 'Claro',
                icon: '☀️',
                colors: {
                    primary: '#ED1C24',
                    secondary: '#2E3440',
                    background: '#F8FAFC',
                    surface: '#FFFFFF',
                    text: '#1A1E26',
                    accent: '#D0B580'
                }
            },
            dark: {
                name: 'Escuro',
                icon: '🌙',
                colors: {
                    primary: '#FF4757',
                    secondary: '#1A1E26',
                    background: '#0F172A',
                    surface: '#1E293B',
                    text: '#F8FAFC',
                    accent: '#E8D199'
                }
            },
            auto: {
                name: 'Automático',
                icon: '🔄',
                colors: null // Será determinado dinamicamente
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('🌙 Inicializando Sistema de Temas Kuhn...');
        
        // Carregar preferência salva
        this.loadSavedTheme();
        
        // Criar botão de alternância
        this.createThemeToggle();
        
        // Aplicar tema inicial
        this.applyTheme();
        
        // Configurar alternância automática
        this.setupAutoToggle();
        
        console.log('✅ Sistema de Temas Kuhn ativo!');
    }
    
    loadSavedTheme() {
        const saved = localStorage.getItem('kuhn-theme');
        if (saved && this.themes[saved]) {
            this.currentTheme = saved;
        }
    }
    
    saveTheme(theme) {
        localStorage.setItem('kuhn-theme', theme);
    }
    
    createThemeToggle() {
        const toggle = document.createElement('div');
        toggle.id = 'kuhn-theme-toggle';
        toggle.className = 'fixed bottom-4 left-4 z-50';
        toggle.style.cssText = `
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 50px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            user-select: none;
        `;
        
        toggle.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                color: white;
                font-weight: 600;
                font-size: 14px;
            ">
                <span id="theme-icon">${this.themes[this.currentTheme].icon}</span>
                <span id="theme-name">${this.themes[this.currentTheme].name}</span>
            </div>
        `;
        
        // Efeitos de hover
        toggle.addEventListener('mouseenter', () => {
            toggle.style.transform = 'scale(1.05)';
            toggle.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.4)';
        });
        
        toggle.addEventListener('mouseleave', () => {
            toggle.style.transform = 'scale(1)';
            toggle.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        });
        
        // Clique para alternar
        toggle.addEventListener('click', () => {
            this.cycleTheme();
        });
        
        document.body.appendChild(toggle);
        this.toggleElement = toggle;
    }
    
    cycleTheme() {
        const themes = Object.keys(this.themes);
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.setTheme(themes[nextIndex]);
    }
    
    setTheme(theme) {
        if (!this.themes[theme]) return;
        
        this.currentTheme = theme;
        this.saveTheme(theme);
        this.applyTheme();
        this.updateToggleDisplay();
        
        // Notificar mudança
        if (window.kuhnNotifications) {
            window.kuhnNotifications.showNotification(
                'Tema Alterado',
                `Modo ${this.themes[theme].name} ativado`,
                'info',
                2000
            );
        }
    }
    
    updateToggleDisplay() {
        const icon = document.getElementById('theme-icon');
        const name = document.getElementById('theme-name');
        
        if (icon && name) {
            icon.textContent = this.themes[this.currentTheme].icon;
            name.textContent = this.themes[this.currentTheme].name;
        }
    }
    
    applyTheme() {
        const theme = this.getEffectiveTheme();
        const colors = theme.colors;
        
        if (!colors) return;
        
        // Aplicar variáveis CSS
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', colors.primary);
        root.style.setProperty('--theme-secondary', colors.secondary);
        root.style.setProperty('--theme-background', colors.background);
        root.style.setProperty('--theme-surface', colors.surface);
        root.style.setProperty('--theme-text', colors.text);
        root.style.setProperty('--theme-accent', colors.accent);
        
        // Aplicar classes ao body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${this.currentTheme}`);
        
        // Efeito de transição
        document.body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Adicionar estilos específicos do tema
        this.addThemeStyles();
        
        console.log(`🎨 Tema aplicado: ${theme.name}`);
    }
    
    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            const hour = new Date().getHours();
            return hour >= 6 && hour < 18 ? this.themes.light : this.themes.dark;
        }
        return this.themes[this.currentTheme];
    }
    
    addThemeStyles() {
        // Remover estilos anteriores
        const existingStyle = document.getElementById('kuhn-theme-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        const style = document.createElement('style');
        style.id = 'kuhn-theme-styles';
        
        const theme = this.getEffectiveTheme();
        const colors = theme.colors;
        
        style.textContent = `
            /* Estilos do tema ${theme.name} */
            .theme-light {
                background: linear-gradient(135deg, ${colors.background} 0%, #F5F5F5 100%) !important;
            }
            
            .theme-dark {
                background: linear-gradient(135deg, ${colors.background} 0%, #0F172A 100%) !important;
            }
            
            .theme-light footer {
                background: linear-gradient(135deg, 
                    rgba(30, 41, 59, 0.95) 0%, 
                    rgba(15, 23, 42, 0.98) 50%, 
                    rgba(30, 41, 59, 0.95) 100%) !important;
            }
            
            .theme-dark footer {
                background: linear-gradient(135deg, 
                    rgba(0, 0, 0, 0.95) 0%, 
                    rgba(15, 23, 42, 0.98) 50%, 
                    rgba(0, 0, 0, 0.95) 100%) !important;
            }
            
            .theme-light .footer-company {
                background: linear-gradient(45deg, #ED1C24, #FF4757, #C41E3A, #ED1C24) !important;
            }
            
            .theme-dark .footer-company {
                background: linear-gradient(45deg, #FF4757, #ED1C24, #FF6B7A, #FF4757) !important;
            }
            
            /* Efeitos especiais para cada tema */
            .theme-light .footer-info-box {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1)) !important;
                border: 1px solid rgba(0, 0, 0, 0.1) !important;
            }
            
            .theme-dark .footer-info-box {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    setupAutoToggle() {
        if (this.currentTheme !== 'auto') return;
        
        // Verificar a cada minuto se precisa alternar
        setInterval(() => {
            if (this.currentTheme === 'auto') {
                const hour = new Date().getHours();
                const shouldBeLight = hour >= 6 && hour < 18;
                const currentIsLight = document.body.classList.contains('theme-light');
                
                if (shouldBeLight && !currentIsLight) {
                    this.applyTheme();
                } else if (!shouldBeLight && currentIsLight) {
                    this.applyTheme();
                }
            }
        }, 60000); // Verificar a cada minuto
    }
    
    // Métodos públicos
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    getEffectiveThemeName() {
        return this.getEffectiveTheme().name;
    }
    
    isDarkMode() {
        return this.getEffectiveTheme() === this.themes.dark;
    }
    
    isLightMode() {
        return this.getEffectiveTheme() === this.themes.light;
    }
}

// Inicializar sistema automaticamente
const kuhnTheme = new KuhnThemeManager();

// Exportar para uso global
window.KuhnTheme = KuhnThemeManager;
window.kuhnTheme = kuhnTheme;

console.log('🌙 Sistema de Temas Kuhn carregado!');
