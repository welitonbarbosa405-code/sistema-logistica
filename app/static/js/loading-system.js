/**
 * Sistema de Loading Kuhn - Skeleton Screens Ultra Modernos
 * Sistema completo de loading com animações impressionantes
 */

class KuhnLoadingSystem {
    constructor() {
        this.loadingOverlays = new Map();
        this.skeletonElements = new Map();
        this.init();
    }

    init() {
        this.addStyles();
        console.log('🚀 Sistema de Loading Kuhn inicializado');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Loading Overlay Global */
            .kuhn-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .kuhn-loading-overlay.show {
                opacity: 1;
                visibility: visible;
            }

            .kuhn-loading-content {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(26, 30, 38, 0.95));
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                box-shadow: 
                    0 20px 40px rgba(0, 0, 0, 0.4),
                    0 0 20px rgba(237, 28, 36, 0.2);
                position: relative;
                overflow: hidden;
                min-width: 300px;
            }

            .kuhn-loading-content::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #ED1C24, #ff4757, #c41e3a);
                animation: loadingShimmer 2s ease-in-out infinite;
            }

            @keyframes loadingShimmer {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
            }

            .kuhn-spinner {
                position: relative;
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
            }

            .kuhn-spinner-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid transparent;
                border-radius: 50%;
                animation: kuhnSpin 2s linear infinite;
            }

            .kuhn-spinner-ring:nth-child(1) {
                border-top-color: #ED1C24;
                animation-delay: 0s;
            }

            .kuhn-spinner-ring:nth-child(2) {
                width: 80%;
                height: 80%;
                top: 10%;
                left: 10%;
                border-top-color: #ff4757;
                animation-delay: 0.2s;
            }

            .kuhn-spinner-ring:nth-child(3) {
                width: 60%;
                height: 60%;
                top: 20%;
                left: 20%;
                border-top-color: #c41e3a;
                animation-delay: 0.4s;
            }

            @keyframes kuhnSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .kuhn-loading-text {
                color: white;
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            }

            .kuhn-loading-subtext {
                color: rgba(255, 255, 255, 0.7);
                font-size: 14px;
                margin-bottom: 20px;
            }

            .kuhn-progress-bar {
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
                margin-top: 20px;
            }

            .kuhn-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #ED1C24, #ff4757);
                border-radius: 3px;
                width: 0%;
                transition: width 0.3s ease;
            }

            /* Skeleton Screens */
            .kuhn-skeleton {
                background: linear-gradient(90deg, 
                    rgba(255, 255, 255, 0.1) 25%, 
                    rgba(255, 255, 255, 0.2) 50%, 
                    rgba(255, 255, 255, 0.1) 75%);
                background-size: 200% 100%;
                animation: skeletonShimmer 1.5s infinite;
                border-radius: 8px;
            }

            @keyframes skeletonShimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            .kuhn-skeleton-text {
                height: 16px;
                margin-bottom: 8px;
            }

            .kuhn-skeleton-text:last-child {
                margin-bottom: 0;
            }

            .kuhn-skeleton-title {
                height: 24px;
                margin-bottom: 12px;
            }

            .kuhn-skeleton-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
            }

            .kuhn-skeleton-button {
                height: 40px;
                width: 120px;
                border-radius: 8px;
            }

            .kuhn-skeleton-card {
                height: 200px;
                border-radius: 12px;
                margin-bottom: 16px;
            }

            .kuhn-skeleton-table {
                height: 300px;
                border-radius: 12px;
            }

            /* Loading States para elementos específicos */
            .kuhn-loading-element {
                position: relative;
                overflow: hidden;
            }

            .kuhn-loading-element::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, 
                    transparent, 
                    rgba(255, 255, 255, 0.1), 
                    transparent);
                animation: elementShimmer 1.5s infinite;
            }

            @keyframes elementShimmer {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            /* Responsividade */
            @media (max-width: 768px) {
                .kuhn-loading-content {
                    margin: 20px;
                    padding: 30px 20px;
                    min-width: auto;
                }

                .kuhn-spinner {
                    width: 60px;
                    height: 60px;
                }

                .kuhn-loading-text {
                    font-size: 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    showGlobalLoading(text = 'Carregando...', subtext = 'Aguarde um momento') {
        const overlayId = this.generateId();
        const overlay = document.createElement('div');
        overlay.className = 'kuhn-loading-overlay';
        overlay.id = overlayId;

        overlay.innerHTML = `
            <div class="kuhn-loading-content">
                <div class="kuhn-spinner">
                    <div class="kuhn-spinner-ring"></div>
                    <div class="kuhn-spinner-ring"></div>
                    <div class="kuhn-spinner-ring"></div>
                </div>
                <div class="kuhn-loading-text">${text}</div>
                <div class="kuhn-loading-subtext">${subtext}</div>
                <div class="kuhn-progress-bar">
                    <div class="kuhn-progress-fill" id="progress-${overlayId}"></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.loadingOverlays.set(overlayId, overlay);

        // Animar entrada
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });

        return overlayId;
    }

    hideGlobalLoading(overlayId) {
        const overlay = this.loadingOverlays.get(overlayId);
        if (!overlay) return;

        overlay.classList.remove('show');
        
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            this.loadingOverlays.delete(overlayId);
        }, 300);
    }

    updateProgress(overlayId, percentage) {
        const overlay = this.loadingOverlays.get(overlayId);
        if (!overlay) return;

        const progressFill = overlay.querySelector('.kuhn-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    createSkeletonElement(type, count = 1) {
        const skeletons = [];
        
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = `kuhn-skeleton kuhn-skeleton-${type}`;
            skeletons.push(skeleton);
        }

        return count === 1 ? skeletons[0] : skeletons;
    }

    showSkeletonCard(container, count = 3) {
        const skeletons = this.createSkeletonElement('card', count);
        const skeletonContainer = document.createElement('div');
        
        if (Array.isArray(skeletons)) {
            skeletons.forEach(skeleton => skeletonContainer.appendChild(skeleton));
        } else {
            skeletonContainer.appendChild(skeletons);
        }

        skeletonContainer.className = 'kuhn-skeleton-container';
        container.innerHTML = '';
        container.appendChild(skeletonContainer);
    }

    showSkeletonTable(container) {
        const skeleton = this.createSkeletonElement('table');
        container.innerHTML = '';
        container.appendChild(skeleton);
    }

    showSkeletonText(container, lines = 3) {
        const skeletons = this.createSkeletonElement('text', lines);
        const skeletonContainer = document.createElement('div');
        
        if (Array.isArray(skeletons)) {
            skeletons.forEach(skeleton => skeletonContainer.appendChild(skeleton));
        } else {
            skeletonContainer.appendChild(skeletons);
        }

        skeletonContainer.className = 'kuhn-skeleton-container';
        container.innerHTML = '';
        container.appendChild(skeletonContainer);
    }

    hideSkeleton(container) {
        const skeletonContainer = container.querySelector('.kuhn-skeleton-container');
        if (skeletonContainer) {
            skeletonContainer.remove();
        }
    }

    // Simulação de carregamento com progresso
    simulateLoading(duration = 3000, onProgress = null, onComplete = null) {
        const overlayId = this.showGlobalLoading('Processando...', 'Aguarde enquanto processamos sua solicitação');
        let progress = 0;
        const interval = 50;
        const increment = (100 / duration) * interval;

        const progressInterval = setInterval(() => {
            progress += increment;
            this.updateProgress(overlayId, progress);

            if (onProgress) {
                onProgress(progress);
            }

            if (progress >= 100) {
                clearInterval(progressInterval);
                setTimeout(() => {
                    this.hideGlobalLoading(overlayId);
                    if (onComplete) {
                        onComplete();
                    }
                }, 500);
            }
        }, interval);

        return overlayId;
    }

    generateId() {
        return 'loading_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Métodos de conveniência
    showCardLoading(container, count = 3) {
        this.showSkeletonCard(container, count);
    }

    showTableLoading(container) {
        this.showSkeletonTable(container);
    }

    showTextLoading(container, lines = 3) {
        this.showSkeletonText(container, lines);
    }
}

// Inicializar sistema global
window.kuhnLoading = new KuhnLoadingSystem();

// Exemplos de uso
window.showLoadingExamples = function() {
    // Loading global com progresso
    kuhnLoading.simulateLoading(5000, 
        (progress) => console.log(`Progresso: ${progress.toFixed(1)}%`),
        () => {
            kuhnToast.success('Carregamento concluído!');
        }
    );

    // Skeleton cards
    setTimeout(() => {
        const container = document.querySelector('.result-grid');
        if (container) {
            kuhnLoading.showCardLoading(container, 4);
        }
    }, 1000);
};

console.log('🎉 Sistema de Loading Kuhn carregado! Use kuhnLoading.showGlobalLoading(), kuhnLoading.showCardLoading(), etc.');
