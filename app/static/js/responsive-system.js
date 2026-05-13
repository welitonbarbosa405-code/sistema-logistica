/**
 * Sistema de Responsividade Dinâmica Kuhn
 * Detecta automaticamente o tamanho da tela e aplica ajustes
 */

class KuhnResponsiveSystem {
    constructor() {
        this.currentBreakpoint = this.detectBreakpoint();
        this.init();
    }

    init() {
        this.bindEvents();
        this.applyResponsiveStyles();
        console.log('📱 Sistema de Responsividade Kuhn inicializado');
    }

    detectBreakpoint() {
        const width = window.innerWidth;
        
        if (width >= 1920) return '4k';
        if (width >= 1366) return 'desktop';
        if (width >= 1024) return 'laptop';
        if (width >= 768) return 'tablet';
        if (width >= 640) return 'mobile';
        return 'mobile-small';
    }

    bindEvents() {
        // Detectar mudanças de tamanho da tela
        window.addEventListener('resize', () => {
            const newBreakpoint = this.detectBreakpoint();
            if (newBreakpoint !== this.currentBreakpoint) {
                this.currentBreakpoint = newBreakpoint;
                this.applyResponsiveStyles();
                this.logBreakpointChange();
            }
        });

        // Detectar orientação do dispositivo
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.currentBreakpoint = this.detectBreakpoint();
                this.applyResponsiveStyles();
            }, 100);
        });
    }

    applyResponsiveStyles() {
        const header = document.querySelector('nav');
        const logoContainer = document.querySelector('.kuhn-premium-logo-container');
        const navLinks = document.querySelectorAll('.kuhn-premium-nav-link');

        if (!header) return;

        // Remover classes anteriores
        header.classList.remove('kuhn-responsive-4k', 'kuhn-responsive-desktop', 'kuhn-responsive-laptop', 'kuhn-responsive-tablet', 'kuhn-responsive-mobile', 'kuhn-responsive-mobile-small');

        // Aplicar classe atual
        header.classList.add(`kuhn-responsive-${this.currentBreakpoint}`);

        // Aplicar ajustes específicos por breakpoint
        switch (this.currentBreakpoint) {
            case '4k':
                this.apply4KStyles(header, logoContainer, navLinks);
                break;
            case 'desktop':
                this.applyDesktopStyles(header, logoContainer, navLinks);
                break;
            case 'laptop':
                this.applyLaptopStyles(header, logoContainer, navLinks);
                break;
            case 'tablet':
                this.applyTabletStyles(header, logoContainer, navLinks);
                break;
            case 'mobile':
                this.applyMobileStyles(header, logoContainer, navLinks);
                break;
            case 'mobile-small':
                this.applyMobileSmallStyles(header, logoContainer, navLinks);
                break;
        }
    }

    apply4KStyles(header, logoContainer, navLinks) {
        // Estilos para monitores 4K
        if (logoContainer) {
            logoContainer.style.gap = '1.5rem';
        }
        
        navLinks.forEach(link => {
            link.style.padding = '1rem 1.5rem';
            link.style.gap = '0.75rem';
        });
    }

    applyDesktopStyles(header, logoContainer, navLinks) {
        // Estilos para desktops
        if (logoContainer) {
            logoContainer.style.gap = '1rem';
        }
        
        navLinks.forEach(link => {
            link.style.padding = '0.75rem 1rem';
            link.style.gap = '0.5rem';
        });
    }

    applyLaptopStyles(header, logoContainer, navLinks) {
        // Estilos para notebooks
        if (logoContainer) {
            logoContainer.style.gap = '0.8rem';
        }
        
        navLinks.forEach(link => {
            link.style.padding = '0.6rem 0.8rem';
            link.style.gap = '0.4rem';
        });
    }

    applyTabletStyles(header, logoContainer, navLinks) {
        // Estilos para tablets
        if (logoContainer) {
            logoContainer.style.gap = '0.7rem';
        }
        
        navLinks.forEach(link => {
            link.style.padding = '0.5rem 0.7rem';
            link.style.gap = '0.3rem';
        });
    }

    applyMobileStyles(header, logoContainer, navLinks) {
        // Estilos para mobile
        if (logoContainer) {
            logoContainer.style.gap = '0.5rem';
            logoContainer.style.flexDirection = 'column';
            logoContainer.style.textAlign = 'center';
        }
        
        navLinks.forEach(link => {
            link.style.padding = '0.5rem 0.75rem';
            link.style.gap = '0.25rem';
        });
    }

    applyMobileSmallStyles(header, logoContainer, navLinks) {
        // Estilos para mobile pequeno
        if (logoContainer) {
            logoContainer.style.gap = '0.25rem';
        }
        
        navLinks.forEach(link => {
            link.style.padding = '0.4rem 0.5rem';
            const textElement = link.querySelector('.nav-text');
            if (textElement) {
                textElement.style.display = 'none';
            }
        });
    }

    logBreakpointChange() {
        console.log(`📱 Breakpoint alterado para: ${this.currentBreakpoint} (${window.innerWidth}x${window.innerHeight})`);
    }

    // Método público para obter informações de responsividade
    getResponsiveInfo() {
        return {
            breakpoint: this.currentBreakpoint,
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile: this.currentBreakpoint.includes('mobile'),
            isTablet: this.currentBreakpoint === 'tablet',
            isDesktop: ['desktop', '4k'].includes(this.currentBreakpoint)
        };
    }
}

// Inicializar sistema
window.kuhnResponsive = new KuhnResponsiveSystem();

// Adicionar estilos CSS dinâmicos
const responsiveStyles = document.createElement('style');
responsiveStyles.textContent = `
    /* Estilos dinâmicos de responsividade */
    .kuhn-responsive-4k .kuhn-premium-logo-container {
        gap: 1.5rem !important;
    }
    
    .kuhn-responsive-desktop .kuhn-premium-logo-container {
        gap: 1rem !important;
    }
    
    .kuhn-responsive-laptop .kuhn-premium-logo-container {
        gap: 0.8rem !important;
    }
    
    .kuhn-responsive-tablet .kuhn-premium-logo-container {
        gap: 0.7rem !important;
    }
    
    .kuhn-responsive-mobile .kuhn-premium-logo-container {
        gap: 0.5rem !important;
        flex-direction: column !important;
        text-align: center !important;
    }
    
    .kuhn-responsive-mobile-small .kuhn-premium-logo-container {
        gap: 0.25rem !important;
    }
    
    /* Ajustes de navegação */
    .kuhn-responsive-mobile nav .flex.items-center.gap-4 {
        flex-wrap: wrap !important;
        justify-content: center !important;
    }
    
    .kuhn-responsive-mobile-small .nav-text {
        display: none !important;
    }
    
    /* Transições suaves */
    .kuhn-premium-logo-container,
    .kuhn-premium-nav-link {
        transition: all 0.3s ease !important;
    }
`;
document.head.appendChild(responsiveStyles);

console.log('🎉 Sistema de Responsividade Kuhn carregado!');
