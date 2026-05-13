/**
 * Sistema de Notificações Toast Kuhn - Ultra Moderno
 * Sistema completo de notificações com animações impressionantes
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
                pointer-events: none;
            }

            .kuhn-toast {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(26, 30, 38, 0.98));
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 16px 20px;
                min-width: 320px;
                max-width: 400px;
                box-shadow: 
                    0 20px 40px rgba(0, 0, 0, 0.4),
                    0 0 20px rgba(237, 28, 36, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
                pointer-events: auto;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #ED1C24, #ff4757, #c41e3a);
                animation: toastShimmer 2s ease-in-out infinite;
            }

            @keyframes toastShimmer {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
            }

            .kuhn-toast::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                animation: toastSweep 3s ease-in-out infinite;
            }

            @keyframes toastSweep {
                0% { left: -100%; }
                50% { left: 100%; }
                100% { left: 100%; }
            }

            .toast-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .toast-icon {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                margin-right: 12px;
                animation: iconPulse 2s ease-in-out infinite;
            }

            @keyframes iconPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            .toast-title {
                color: white;
                font-weight: 600;
                font-size: 14px;
                margin: 0;
                flex: 1;
            }

            .toast-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                cursor: pointer;
                font-size: 18px;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .toast-close:hover {
                color: white;
                background: rgba(255, 255, 255, 0.1);
                transform: scale(1.1);
            }

            .toast-message {
                color: rgba(255, 255, 255, 0.9);
                font-size: 13px;
                line-height: 1.4;
                margin: 0;
            }

            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: linear-gradient(90deg, #ED1C24, #ff4757);
                border-radius: 0 0 16px 16px;
                animation: toastProgress linear;
            }

            @keyframes toastProgress {
                from { width: 100%; }
                to { width: 0%; }
            }

            /* Tipos de toast */
            .toast-success .toast-icon {
                background: linear-gradient(135deg, #10B981, #059669);
                color: white;
            }

            .toast-error .toast-icon {
                background: linear-gradient(135deg, #EF4444, #DC2626);
                color: white;
            }

            .toast-warning .toast-icon {
                background: linear-gradient(135deg, #F59E0B, #D97706);
                color: white;
            }

            .toast-info .toast-icon {
                background: linear-gradient(135deg, #3B82F6, #1D4ED8);
                color: white;
            }

            /* Responsividade */
            @media (max-width: 768px) {
                .kuhn-toast-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                }

                .kuhn-toast {
                    min-width: auto;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', title = '', duration = 5000) {
        const toastId = this.generateId();
        const toast = this.createToast(toastId, message, type, title, duration);
        
        this.container.appendChild(toast);
        this.toasts.set(toastId, toast);

        // Animar entrada
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remover
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toastId);
            }, duration);
        }

        return toastId;
    }

    createToast(id, message, type, title, duration) {
        const toast = document.createElement('div');
        toast.className = `kuhn-toast toast-${type}`;
        toast.dataset.toastId = id;

        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const titleMap = {
            success: 'Sucesso',
            error: 'Erro',
            warning: 'Atenção',
            info: 'Informação'
        };

        toast.innerHTML = `
            <div class="toast-header">
                <div style="display: flex; align-items: center;">
                    <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
                    <h4 class="toast-title">${title || titleMap[type]}</h4>
                </div>
                <button class="toast-close" onclick="kuhnToast.hide('${id}')">×</button>
            </div>
            <p class="toast-message">${message}</p>
            ${duration > 0 ? `<div class="toast-progress" style="animation-duration: ${duration}ms;"></div>` : ''}
        `;

        // Efeito de hover
        toast.addEventListener('mouseenter', () => {
            toast.style.transform = 'translateX(-5px) scale(1.02)';
        });

        toast.addEventListener('mouseleave', () => {
            toast.style.transform = 'translateX(0) scale(1)';
        });

        return toast;
    }

    hide(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(toastId);
        }, 400);
    }

    hideAll() {
        this.toasts.forEach((toast, id) => {
            this.hide(id);
        });
    }

    generateId() {
        return 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Métodos de conveniência
    success(message, title = '', duration = 5000) {
        return this.show(message, 'success', title, duration);
    }

    error(message, title = '', duration = 7000) {
        return this.show(message, 'error', title, duration);
    }

    warning(message, title = '', duration = 6000) {
        return this.show(message, 'warning', title, duration);
    }

    info(message, title = '', duration = 5000) {
        return this.show(message, 'info', title, duration);
    }
}

// Inicializar sistema global
window.kuhnToast = new KuhnToastSystem();

// Exemplos de uso
window.showToastExamples = function() {
    kuhnToast.success('Operação realizada com sucesso!', 'Sucesso');
    
    setTimeout(() => {
        kuhnToast.info('Sistema atualizado automaticamente', 'Informação');
    }, 1000);
    
    setTimeout(() => {
        kuhnToast.warning('Verifique suas configurações', 'Atenção');
    }, 2000);
    
    setTimeout(() => {
        kuhnToast.error('Erro ao conectar com o servidor', 'Erro');
    }, 3000);
};

console.log('🎉 Sistema de Toast Kuhn carregado! Use kuhnToast.success(), kuhnToast.error(), etc.');
