/**
 * Sistema de Navegação Fluida
 * Torna a navegação entre páginas mais suave e rápida
 */

class SmoothNavigation {
    constructor() {
        this.isNavigating = false;
        this.transitionDuration = 300; // ms
        this.init();
    }

    init() {
        // Interceptar todos os links de navegação
        this.interceptNavigationLinks();
        
        // Adicionar estilos de transição
        this.addTransitionStyles();
        
        // Pré-carregar páginas em hover
        this.setupPreload();
    }

    interceptNavigationLinks() {
        // Selecionar todos os links de navegação no header
        const navLinks = document.querySelectorAll('.topnav .nav-pill[href]');
        
        navLinks.forEach(link => {
            // Ignorar links de logout/login (precisam recarregar)
            if (link.href.includes('/logout') || link.href.includes('/login')) {
                return;
            }

            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (this.isNavigating) return;
                
                const targetUrl = link.href;
                
                // Se já estiver na mesma página, não fazer nada
                if (targetUrl === window.location.href) return;
                
                this.navigateTo(targetUrl, link);
            });
        });
    }

    navigateTo(url, clickedLink) {
        this.isNavigating = true;
        
        // Adicionar classe de loading no link clicado
        clickedLink.classList.add('nav-pill--loading');
        
        // Navegar imediatamente sem animações (melhor performance)
        window.location.href = url;
    }

    addTransitionStyles() {
        // Adicionar estilos CSS dinamicamente
        const style = document.createElement('style');
        style.textContent = `
            /* Removida transição do main para melhor performance */

            /* Loading state nos links de navegação */
            .nav-pill--loading {
                position: relative;
                pointer-events: none;
                opacity: 0.7;
            }

            .nav-pill--loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 16px;
                height: 16px;
                margin: -8px 0 0 -8px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                animation: spin 0.6s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Indicador de loading global */
            .page-loading-indicator {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #ED1C24, #D0B580, #ED1C24);
                background-size: 200% 100%;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }

            .page-loading-indicator.active {
                opacity: 1;
                animation: loadingProgress 1.5s ease-in-out infinite;
            }

            @keyframes loadingProgress {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            /* Melhorar feedback visual nos links */
            .nav-pill {
                transition: all 0.2s ease;
            }

            .nav-pill:hover:not(.nav-pill--loading) {
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);
    }

    setupPreload() {
        // Pré-carregar páginas quando o mouse passar sobre os links
        const navLinks = document.querySelectorAll('.topnav .nav-pill[href]');
        
        navLinks.forEach(link => {
            if (link.href.includes('/logout') || link.href.includes('/login')) {
                return;
            }

            // Pré-carregar ao passar o mouse (mais rápido)
            link.addEventListener('mouseenter', () => {
                // Pré-conectar ao servidor (hint para o navegador)
                if (!document.querySelector(`link[rel="prefetch"][href="${link.href}"]`)) {
                    const linkElement = document.createElement('link');
                    linkElement.rel = 'prefetch';
                    linkElement.href = link.href;
                    document.head.appendChild(linkElement);
                }
            });

            // Pré-carregar ao focar (acessibilidade)
            link.addEventListener('focus', () => {
                if (!document.querySelector(`link[rel="prefetch"][href="${link.href}"]`)) {
                    const linkElement = document.createElement('link');
                    linkElement.rel = 'prefetch';
                    linkElement.href = link.href;
                    document.head.appendChild(linkElement);
                }
            });
        });
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SmoothNavigation();
    });
} else {
    new SmoothNavigation();
}

// Adicionar indicador de loading global
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'page-loading-indicator';
document.body.appendChild(loadingIndicator);

// Mostrar loading durante navegação
window.addEventListener('beforeunload', () => {
    loadingIndicator.classList.add('active');
});

// Esconder loading quando a página carregar
window.addEventListener('load', () => {
    setTimeout(() => {
        loadingIndicator.classList.remove('active');
    }, 100);
    
    // Removida animação de fade in para melhor performance
});

