/**
 * Sistema de Temas Dinâmicos Kuhn - Ultra Moderno
 * Sistema completo de temas com transições suaves e personalização
 */

class KuhnThemeSystem {
    constructor() {
        this.currentTheme = 'dark';
        this.themes = {
            dark: {
                name: 'Escuro Kuhn',
                primary: '#ED1C24',
                secondary: '#ff4757',
                accent: '#c41e3a',
                background: '#000000',
                surface: '#1a1a1a',
                text: '#ffffff',
                textSecondary: '#cccccc',
                border: 'rgba(255, 255, 255, 0.1)',
                shadow: 'rgba(0, 0, 0, 0.4)',
                gradient: 'linear-gradient(135deg, #000000 0%, #1a1a1a 30%, #2a2a2a 70%, #000000 100%)'
            },
            light: {
                name: 'Claro Kuhn',
                primary: '#ED1C24',
                secondary: '#ff4757',
                accent: '#c41e3a',
                background: '#ffffff',
                surface: '#f8fafc',
                text: '#1a1a1a',
                textSecondary: '#4a4a4a',
                border: 'rgba(0, 0, 0, 0.1)',
                shadow: 'rgba(0, 0, 0, 0.1)',
                gradient: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 30%, #e2e8f0 70%, #ffffff 100%)'
            },
            neon: {
                name: 'Neon Kuhn',
                primary: '#00ff88',
                secondary: '#ff0080',
                accent: '#8000ff',
                background: '#000000',
                surface: '#0a0a0a',
                text: '#ffffff',
                textSecondary: '#cccccc',
                border: 'rgba(0, 255, 136, 0.3)',
                shadow: 'rgba(0, 255, 136, 0.2)',
                gradient: 'linear-gradient(135deg, #000000 0%, #0a0a0a 30%, #1a1a1a 70%, #000000 100%)'
            },
            sunset: {
                name: 'Pôr do Sol',
                primary: '#ff6b35',
                secondary: '#f7931e',
                accent: '#ffd23f',
                background: '#1a1a2e',
                surface: '#16213e',
                text: '#ffffff',
                textSecondary: '#e0e0e0',
                border: 'rgba(255, 107, 53, 0.2)',
                shadow: 'rgba(255, 107, 53, 0.3)',
                gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)'
            },
            ocean: {
                name: 'Oceano',
                primary: '#00d4ff',
                secondary: '#0099cc',
                accent: '#006699',
                background: '#001122',
                surface: '#002244',
                text: '#ffffff',
                textSecondary: '#b3d9ff',
                border: 'rgba(0, 212, 255, 0.2)',
                shadow: 'rgba(0, 212, 255, 0.3)',
                gradient: 'linear-gradient(135deg, #001122 0%, #002244 30%, #003366 70%, #001122 100%)'
            }
        };
        
        this.customThemes = new Map();
        this.init();
    }

    init() {
        this.loadSavedTheme();
        this.addStyles();
        this.createThemeSelector();
        this.bindEvents();
        console.log('🚀 Sistema de Temas Kuhn inicializado');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Transições de tema */
            * {
                transition: background-color 0.3s ease, 
                           color 0.3s ease, 
                           border-color 0.3s ease,
                           box-shadow 0.3s ease;
            }

            /* Seletor de temas */
            .kuhn-theme-selector {
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 1000;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }

            .kuhn-theme-toggle {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 8px;
                border-radius: 8px;
                transition: all 0.3s ease;
                font-size: 18px;
            }

            .kuhn-theme-toggle:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: scale(1.1);
            }

            .kuhn-theme-menu {
                position: absolute;
                top: 100%;
                left: 0;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 8px;
                min-width: 200px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }

            .kuhn-theme-menu.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .kuhn-theme-option {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                color: white;
                text-decoration: none;
            }

            .kuhn-theme-option:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateX(5px);
            }

            .kuhn-theme-option.active {
                background: rgba(237, 28, 36, 0.2);
                border: 1px solid rgba(237, 28, 36, 0.3);
            }

            .kuhn-theme-preview {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.3);
                position: relative;
                overflow: hidden;
            }

            .kuhn-theme-preview::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: 50%;
            }

            .kuhn-theme-name {
                font-weight: 500;
                font-size: 14px;
            }

            /* Indicador de tema ativo */
            .kuhn-theme-indicator {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 12px;
                color: white;
                font-size: 12px;
                font-weight: 500;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 1000;
            }

            .kuhn-theme-indicator.show {
                opacity: 1;
                visibility: visible;
            }

            /* Animações de mudança de tema */
            .kuhn-theme-transition {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, 
                    rgba(237, 28, 36, 0.1), 
                    rgba(255, 71, 87, 0.1), 
                    rgba(196, 30, 58, 0.1));
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.5s ease;
                pointer-events: none;
            }

            .kuhn-theme-transition.active {
                opacity: 1;
                visibility: visible;
            }

            /* Responsividade */
            @media (max-width: 768px) {
                .kuhn-theme-selector {
                    top: 10px;
                    left: 10px;
                    padding: 8px;
                }

                .kuhn-theme-menu {
                    min-width: 180px;
                }

                .kuhn-theme-indicator {
                    right: 10px;
                    padding: 8px;
                    font-size: 11px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createThemeSelector() {
        const selector = document.createElement('div');
        selector.className = 'kuhn-theme-selector';
        selector.innerHTML = `
            <button class="kuhn-theme-toggle" id="theme-toggle">
                🎨
            </button>
            <div class="kuhn-theme-menu" id="theme-menu">
                ${Object.entries(this.themes).map(([key, theme]) => `
                    <div class="kuhn-theme-option ${key === this.currentTheme ? 'active' : ''}" 
                         data-theme="${key}">
                        <div class="kuhn-theme-preview" style="background: ${theme.gradient}"></div>
                        <span class="kuhn-theme-name">${theme.name}</span>
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(selector);

        // Indicador de tema
        const indicator = document.createElement('div');
        indicator.className = 'kuhn-theme-indicator';
        indicator.id = 'theme-indicator';
        document.body.appendChild(indicator);

        // Overlay de transição
        const transition = document.createElement('div');
        transition.className = 'kuhn-theme-transition';
        transition.id = 'theme-transition';
        document.body.appendChild(transition);
    }

    bindEvents() {
        const toggle = document.getElementById('theme-toggle');
        const menu = document.getElementById('theme-menu');

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            menu.classList.remove('show');
        });

        // Eventos de mudança de tema
        document.querySelectorAll('.kuhn-theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                this.setTheme(theme);
                menu.classList.remove('show');
            });
        });

        // Atalho de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.cycleTheme();
            }
        });
    }

    setTheme(themeName) {
        if (!this.themes[themeName] && !this.customThemes.has(themeName)) {
            console.warn(`Tema '${themeName}' não encontrado`);
            return;
        }

        const theme = this.themes[themeName] || this.customThemes.get(themeName);
        
        // Mostrar transição
        this.showTransition();

        setTimeout(() => {
            this.applyTheme(theme);
            this.currentTheme = themeName;
            this.saveTheme(themeName);
            this.updateActiveOption();
            this.showThemeIndicator(theme.name);
            
            setTimeout(() => {
                this.hideTransition();
            }, 100);
        }, 250);
    }

    applyTheme(theme) {
        const root = document.documentElement;
        
        // Aplicar variáveis CSS
        root.style.setProperty('--theme-primary', theme.primary);
        root.style.setProperty('--theme-secondary', theme.secondary);
        root.style.setProperty('--theme-accent', theme.accent);
        root.style.setProperty('--theme-background', theme.background);
        root.style.setProperty('--theme-surface', theme.surface);
        root.style.setProperty('--theme-text', theme.text);
        root.style.setProperty('--theme-text-secondary', theme.textSecondary);
        root.style.setProperty('--theme-border', theme.border);
        root.style.setProperty('--theme-shadow', theme.shadow);
        root.style.setProperty('--theme-gradient', theme.gradient);

        // Aplicar ao body
        document.body.style.background = theme.gradient;
        document.body.style.color = theme.text;

        // Aplicar ao footer
        const footer = document.querySelector('footer');
        if (footer) {
            footer.style.background = theme.gradient;
            footer.style.color = theme.text;
        }

        // Aplicar aos cards
        document.querySelectorAll('.card, .result-item, .kpi-card').forEach(card => {
            card.style.background = theme.surface;
            card.style.color = theme.text;
            card.style.borderColor = theme.border;
        });

        // Aplicar aos inputs
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.style.background = theme.surface;
            input.style.color = theme.text;
            input.style.borderColor = theme.border;
        });

        // Aplicar aos botões
        document.querySelectorAll('button, .btn').forEach(button => {
            if (!button.classList.contains('btn-primary')) {
                button.style.background = theme.surface;
                button.style.color = theme.text;
                button.style.borderColor = theme.border;
            }
        });

        // Disparar evento customizado
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: theme, themeName: this.currentTheme }
        }));
    }

    showTransition() {
        const transition = document.getElementById('theme-transition');
        transition.classList.add('active');
    }

    hideTransition() {
        const transition = document.getElementById('theme-transition');
        transition.classList.remove('active');
    }

    showThemeIndicator(themeName) {
        const indicator = document.getElementById('theme-indicator');
        indicator.textContent = themeName;
        indicator.classList.add('show');

        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }

    updateActiveOption() {
        document.querySelectorAll('.kuhn-theme-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === this.currentTheme) {
                option.classList.add('active');
            }
        });
    }

    cycleTheme() {
        const themeNames = Object.keys(this.themes);
        const currentIndex = themeNames.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        this.setTheme(themeNames[nextIndex]);
    }

    createCustomTheme(name, colors) {
        const customTheme = {
            name: name,
            primary: colors.primary || '#ED1C24',
            secondary: colors.secondary || '#ff4757',
            accent: colors.accent || '#c41e3a',
            background: colors.background || '#000000',
            surface: colors.surface || '#1a1a1a',
            text: colors.text || '#ffffff',
            textSecondary: colors.textSecondary || '#cccccc',
            border: colors.border || 'rgba(255, 255, 255, 0.1)',
            shadow: colors.shadow || 'rgba(0, 0, 0, 0.4)',
            gradient: colors.gradient || 'linear-gradient(135deg, #000000 0%, #1a1a1a 30%, #2a2a2a 70%, #000000 100%)'
        };

        this.customThemes.set(name, customTheme);
        this.addCustomThemeToMenu(name, customTheme);
        
        return customTheme;
    }

    addCustomThemeToMenu(name, theme) {
        const menu = document.getElementById('theme-menu');
        const option = document.createElement('div');
        option.className = 'kuhn-theme-option';
        option.dataset.theme = name;
        option.innerHTML = `
            <div class="kuhn-theme-preview" style="background: ${theme.gradient}"></div>
            <span class="kuhn-theme-name">${theme.name}</span>
        `;

        option.addEventListener('click', () => {
            this.setTheme(name);
            document.getElementById('theme-menu').classList.remove('show');
        });

        menu.appendChild(option);
    }

    saveTheme(themeName) {
        localStorage.setItem('kuhn-theme', themeName);
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('kuhn-theme');
        if (savedTheme && (this.themes[savedTheme] || this.customThemes.has(savedTheme))) {
            this.currentTheme = savedTheme;
        }
    }

    getCurrentTheme() {
        return this.themes[this.currentTheme] || this.customThemes.get(this.currentTheme);
    }

    // Métodos de conveniência
    setDarkTheme() {
        this.setTheme('dark');
    }

    setLightTheme() {
        this.setTheme('light');
    }

    setNeonTheme() {
        this.setTheme('neon');
    }

    setSunsetTheme() {
        this.setTheme('sunset');
    }

    setOceanTheme() {
        this.setTheme('ocean');
    }
}

// Inicializar sistema global
window.kuhnTheme = new KuhnThemeSystem();

// Aplicar tema salvo ao carregar
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('kuhn-theme');
    if (savedTheme) {
        kuhnTheme.setTheme(savedTheme);
    }
});

// Exemplos de uso
window.showThemeExamples = function() {
    // Criar tema personalizado
    kuhnTheme.createCustomTheme('Midnight Purple', {
        primary: '#8B5CF6',
        secondary: '#A78BFA',
        accent: '#C4B5FD',
        background: '#0F0B1E',
        surface: '#1A1625',
        text: '#FFFFFF',
        textSecondary: '#D1D5DB',
        border: 'rgba(139, 92, 246, 0.2)',
        shadow: 'rgba(139, 92, 246, 0.3)',
        gradient: 'linear-gradient(135deg, #0F0B1E 0%, #1A1625 30%, #2D1B69 70%, #0F0B1E 100%)'
    });

    // Alternar entre temas
    setTimeout(() => kuhnTheme.setNeonTheme(), 2000);
    setTimeout(() => kuhnTheme.setSunsetTheme(), 4000);
    setTimeout(() => kuhnTheme.setOceanTheme(), 6000);
    setTimeout(() => kuhnTheme.setDarkTheme(), 8000);
};

console.log('🎉 Sistema de Temas Kuhn carregado! Use kuhnTheme.setTheme(), kuhnTheme.createCustomTheme(), etc.');
console.log('💡 Atalho: Ctrl+Shift+T para alternar temas');
