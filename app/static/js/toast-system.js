/**
 * Sistema de Notificações Toast Kuhn - Ultra Moderno
 * Notificações elegantes com animações e efeitos especiais
 */

class KuhnToastSystem {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.init();
    }

    init() {
        this.createContainer();
        this.addStyles();
        console.log('🚀 Sistema de Toast Kuhn inicializado');
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'kuhn-toast-container';
        this.container.className = 'kuhn-toast-container';
        document.body.appendChild(this.container);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .kuhn-toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
                pointer-events: none;
            }

            .kuhn-toast {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                padding: 16px 20px;
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.1),
                    0 2px 8px rgba(0, 0, 0, 0.05);
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                position: relative;
                overflow: hidden;
                min-width: 300px;
            }

            .kuhn-toast.show {
                transform: translateX(0);
                opacity: 1;
            }

            .kuhn-toast.hide {
                transform: translateX(100%);
                opacity: 0;
            }

            .kuhn-toast::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                background: linear-gradient(135deg, #ED1C24, #ff4757);
            }

            .kuhn-toast::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.3),
                    transparent
                );
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            .kuhn-toast-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }

            .kuhn-toast-icon {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                flex-shrink: 0;
                animation: pulse 2s infinite;
            }

            .kuhn-toast-icon.success {
                background: linear-gradient(135deg, #00ff88, #00cc6a);
                color: white;
            }

            .kuhn-toast-icon.error {
                background: linear-gradient(135deg, #ff4757, #ed1c24);
                color: white;
            }

            .kuhn-toast-icon.warning {
                background: linear-gradient(135deg, #ffa726, #ff9800);
                color: white;
            }

            .kuhn-toast-icon.info {
                background: linear-gradient(135deg, #42a5f5, #1976d2);
                color: white;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            .kuhn-toast-text {
                flex: 1;
            }

            .kuhn-toast-title {
                font-weight: 600;
                font-size: 14px;
                color: #1a1a1a;
                margin-bottom: 4px;
                line-height: 1.4;
            }

            .kuhn-toast-message {
                font-size: 13px;
                color: #666;
                line-height: 1.4;
                margin: 0;
            }

            .kuhn-toast-close {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                border: none;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: #666;
                transition: all 0.2s ease;
                opacity: 0.6;
            }

            .kuhn-toast-close:hover {
                background: rgba(0, 0, 0, 0.2);
                opacity: 1;
                transform: scale(1.1);
            }

            .kuhn-toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: linear-gradient(135deg, #ED1C24, #ff4757);
                border-radius: 0 0 16px 16px;
                transform-origin: left;
                animation: progress linear;
            }

            @keyframes progress {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }

            /* Variantes de tema */
            .kuhn-toast.dark {
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
            }

            .kuhn-toast.dark .kuhn-toast-title {
                color: white;
            }

            .kuhn-toast.dark .kuhn-toast-message {
                color: #ccc;
            }

            /* Responsividade */
            @media (max-width: 768px) {
                .kuhn-toast-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .kuhn-toast {
                    min-width: auto;
                    width: 100%;
                }
            }

            /* Efeitos especiais */
            .kuhn-toast.bounce {
                animation: bounceIn 0.6s ease-out;
            }

            @keyframes bounceIn {
                0% {
                    transform: translateX(100%) scale(0.3);
                    opacity: 0;
                }
                50% {
                    transform: translateX(-10px) scale(1.05);
                    opacity: 1;
                }
                70% {
                    transform: translateX(5px) scale(0.95);
                }
                100% {
                    transform: translateX(0) scale(1);
                }
            }

            .kuhn-toast.shake {
                animation: shake 0.5s ease-in-out;
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', options = {}) {
        const id = Date.now() + Math.random();
        const toast = this.createToast(id, message, type, options);
        
        this.container.appendChild(toast);
        this.toasts.set(id, toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
            if (options.animation === 'bounce') {
                toast.classList.add('bounce');
            }
        });

        // Auto remove
        if (options.duration !== false) {
            const duration = options.duration || 5000;
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }

        return id;
    }

    createToast(id, message, type, options) {
        const toast = document.createElement('div');
        toast.className = `kuhn-toast ${type}`;
        toast.dataset.toastId = id;

        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const titleMap = {
            success: 'Sucesso!',
            error: 'Erro!',
            warning: 'Atenção!',
            info: 'Informação'
        };

        toast.innerHTML = `
            <div class="kuhn-toast-content">
                <div class="kuhn-toast-icon ${type}">
                    ${iconMap[type] || iconMap.info}
                </div>
                <div class="kuhn-toast-text">
                    <div class="kuhn-toast-title">
                        ${options.title || titleMap[type]}
                    </div>
                    <div class="kuhn-toast-message">
                        ${message}
                    </div>
                </div>
            </div>
            <button class="kuhn-toast-close" onclick="kuhnToast.hide(${id})">
                ×
            </button>
            ${options.duration !== false ? '<div class="kuhn-toast-progress"></div>' : ''}
        `;

        // Adicionar efeito de progresso se especificado
        if (options.duration !== false) {
            const progress = toast.querySelector('.kuhn-toast-progress');
            if (progress) {
                const duration = options.duration || 5000;
                progress.style.animationDuration = `${duration}ms`;
            }
        }

        return toast;
    }

    hide(id) {
        const toast = this.toasts.get(id);
        if (!toast) return;

        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(id);
        }, 400);
    }

    hideAll() {
        this.toasts.forEach((toast, id) => {
            this.hide(id);
        });
    }

    // Métodos de conveniência
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    // Toast com animação especial
    bounce(message, type = 'info', options = {}) {
        options.animation = 'bounce';
        return this.show(message, type, options);
    }

    shake(message, type = 'error', options = {}) {
        options.animation = 'shake';
        const id = this.show(message, type, options);
        setTimeout(() => {
            const toast = this.toasts.get(id);
            if (toast) {
                toast.classList.add('shake');
            }
        }, 100);
        return id;
    }
}

// Inicializar sistema global
window.kuhnToast = new KuhnToastSystem();

// Métodos de conveniência globais
window.showSuccess = (message, options) => kuhnToast.success(message, options);
window.showError = (message, options) => kuhnToast.error(message, options);
window.showWarning = (message, options) => kuhnToast.warning(message, options);
window.showInfo = (message, options) => kuhnToast.info(message, options);

console.log('🎉 Sistema de Toast Kuhn carregado! Use kuhnToast.success(), showSuccess(), etc.');
