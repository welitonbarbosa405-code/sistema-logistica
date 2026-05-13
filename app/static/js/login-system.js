/**
 * Sistema de Login Kuhn - Ultra Impressionante
 * Sistema completo de login com animações e efeitos visuais modernos
 */

class KuhnLoginSystem {
    constructor() {
        this.form = null;
        this.inputs = [];
        this.button = null;
        this.isAnimating = false;
        this.init();
    }

    init() {
        this.addStyles();
        this.bindEvents();
        console.log('🚀 Sistema de Login Kuhn inicializado');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Container principal do login */
            .kuhn-login-container {
                position: relative;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.98));
                backdrop-filter: blur(20px);
                border-radius: 24px;
                box-shadow: 
                    0 25px 50px rgba(0, 0, 0, 0.15),
                    0 0 0 1px rgba(255, 255, 255, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
                padding: 3rem 2.5rem;
                max-width: 420px;
                margin: 2rem auto;
                position: relative;
                overflow: hidden;
                animation: loginSlideIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes loginSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            /* Efeito de brilho no fundo */
            .kuhn-login-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, 
                    rgba(237, 28, 36, 0.05) 0%, 
                    rgba(255, 71, 87, 0.03) 50%, 
                    rgba(196, 30, 58, 0.05) 100%);
                border-radius: 24px;
                animation: backgroundShimmer 3s ease-in-out infinite;
                pointer-events: none;
            }

            @keyframes backgroundShimmer {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.6; }
            }

            /* Título do login */
            .kuhn-login-title {
                font-size: 2rem;
                font-weight: 700;
                color: #1a1a1a;
                text-align: center;
                margin-bottom: 2rem;
                position: relative;
                animation: titleGlow 2s ease-in-out infinite alternate;
            }

            @keyframes titleGlow {
                0% { 
                    text-shadow: 0 0 10px rgba(237, 28, 36, 0.3);
                }
                100% { 
                    text-shadow: 0 0 20px rgba(237, 28, 36, 0.5);
                }
            }

            /* Container dos campos */
            .kuhn-form-group {
                position: relative;
                margin-bottom: 1.5rem;
                animation: fieldSlideIn 0.6s ease-out;
                animation-fill-mode: both;
            }

            .kuhn-form-group:nth-child(1) { animation-delay: 0.2s; }
            .kuhn-form-group:nth-child(2) { animation-delay: 0.4s; }
            .kuhn-form-group:nth-child(3) { animation-delay: 0.6s; }

            @keyframes fieldSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            /* Labels dos campos */
            .kuhn-form-label {
                display: block;
                font-size: 0.875rem;
                font-weight: 600;
                color: #374151;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                transition: all 0.3s ease;
                position: relative;
            }

            .kuhn-form-label::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 0;
                height: 2px;
                background: linear-gradient(90deg, #ED1C24, #ff4757);
                transition: width 0.3s ease;
            }

            .kuhn-form-group:focus-within .kuhn-form-label::after {
                width: 100%;
            }

            /* Inputs modernos */
            .kuhn-form-input {
                width: 100%;
                padding: 1rem 1.25rem;
                font-size: 1rem;
                border: 2px solid rgba(209, 213, 219, 0.5);
                border-radius: 12px;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8));
                backdrop-filter: blur(10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }

            .kuhn-form-input:focus {
                outline: none;
                border-color: #ED1C24;
                box-shadow: 
                    0 0 0 3px rgba(237, 28, 36, 0.1),
                    0 8px 25px rgba(237, 28, 36, 0.15);
                transform: translateY(-2px);
                background: rgba(255, 255, 255, 0.95);
            }

            .kuhn-form-input::placeholder {
                color: #9CA3AF;
                font-weight: 400;
                transition: all 0.3s ease;
            }

            .kuhn-form-input:focus::placeholder {
                color: #6B7280;
                transform: translateY(-2px);
            }

            /* Efeito de partículas nos inputs */
            .kuhn-form-input::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(237, 28, 36, 0.1), transparent);
                transition: left 0.6s ease;
                border-radius: 12px;
            }

            .kuhn-form-input:focus::before {
                left: 100%;
            }

            /* Ícones dos campos */
            .kuhn-field-icon {
                position: absolute;
                right: 1rem;
                top: 50%;
                transform: translateY(-50%);
                font-size: 1.2rem;
                color: #9CA3AF;
                transition: all 0.3s ease;
                pointer-events: none;
            }

            .kuhn-form-group:focus-within .kuhn-field-icon {
                color: #ED1C24;
                transform: translateY(-50%) scale(1.1);
            }

            /* Botão de login impressionante */
            .kuhn-login-button {
                width: 100%;
                padding: 1rem 2rem;
                font-size: 1.1rem;
                font-weight: 600;
                color: white;
                background: linear-gradient(135deg, #ED1C24, #ff4757, #c41e3a);
                background-size: 200% 200%;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                position: relative;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 8px 25px rgba(237, 28, 36, 0.3);
                animation: buttonPulse 2s ease-in-out infinite;
                margin-top: 1rem;
            }

            @keyframes buttonPulse {
                0%, 100% { 
                    box-shadow: 0 8px 25px rgba(237, 28, 36, 0.3);
                }
                50% { 
                    box-shadow: 0 8px 35px rgba(237, 28, 36, 0.5);
                }
            }

            .kuhn-login-button:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 12px 35px rgba(237, 28, 36, 0.4);
                background-position: 100% 0;
            }

            .kuhn-login-button:active {
                transform: translateY(-1px) scale(1.01);
            }

            /* Efeito de brilho no botão */
            .kuhn-login-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                transition: left 0.6s ease;
            }

            .kuhn-login-button:hover::before {
                left: 100%;
            }

            /* Estados de loading */
            .kuhn-login-button.loading {
                pointer-events: none;
                opacity: 0.8;
            }

            .kuhn-login-button.loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                margin: -10px 0 0 -10px;
                border: 2px solid transparent;
                border-top: 2px solid white;
                border-radius: 50%;
                animation: buttonSpinner 1s linear infinite;
            }

            @keyframes buttonSpinner {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Validação visual */
            .kuhn-form-input.valid {
                border-color: #10B981;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            }

            .kuhn-form-input.invalid {
                border-color: #EF4444;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                animation: shakeInput 0.5s ease-in-out;
            }

            @keyframes shakeInput {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            /* Mensagens de erro */
            .kuhn-error-message {
                color: #EF4444;
                font-size: 0.875rem;
                margin-top: 0.5rem;
                padding: 0.5rem 0.75rem;
                background: rgba(239, 68, 68, 0.1);
                border-radius: 8px;
                border-left: 3px solid #EF4444;
                animation: errorSlideIn 0.3s ease-out;
            }

            @keyframes errorSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Mensagens de sucesso */
            .kuhn-success-message {
                color: #10B981;
                font-size: 0.875rem;
                margin-top: 0.5rem;
                padding: 0.5rem 0.75rem;
                background: rgba(16, 185, 129, 0.1);
                border-radius: 8px;
                border-left: 3px solid #10B981;
                animation: successSlideIn 0.3s ease-out;
            }

            @keyframes successSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Efeito de partículas flutuantes */
            .kuhn-login-particles {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                overflow: hidden;
                border-radius: 24px;
            }

            .kuhn-particle {
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(237, 28, 36, 0.3);
                border-radius: 50%;
                animation: particleFloat 8s linear infinite;
            }

            .kuhn-particle:nth-child(2n) {
                background: rgba(255, 71, 87, 0.2);
                animation-duration: 12s;
            }

            .kuhn-particle:nth-child(3n) {
                background: rgba(196, 30, 58, 0.25);
                animation-duration: 10s;
            }

            @keyframes particleFloat {
                0% {
                    transform: translateY(100vh) translateX(0) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100px) translateX(100px) rotate(360deg);
                    opacity: 0;
                }
            }

            /* Responsividade */
            @media (max-width: 768px) {
                .kuhn-login-container {
                    margin: 1rem;
                    padding: 2rem 1.5rem;
                    border-radius: 20px;
                }

                .kuhn-login-title {
                    font-size: 1.75rem;
                }

                .kuhn-form-input {
                    padding: 0.875rem 1rem;
                }
            }

            /* Efeito de foco global */
            .kuhn-login-container:focus-within {
                box-shadow: 
                    0 25px 50px rgba(0, 0, 0, 0.2),
                    0 0 0 1px rgba(237, 28, 36, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4);
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // Aguardar o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeForm());
        } else {
            this.initializeForm();
        }
    }

    initializeForm() {
        this.form = document.querySelector('form');
        if (!this.form) return;

        // Encontrar elementos
        this.inputs = Array.from(this.form.querySelectorAll('input[type="email"], input[type="password"]'));
        this.button = this.form.querySelector('input[type="submit"], button[type="submit"]');

        if (!this.button) return;

        // Aplicar classes e efeitos
        this.applyStyles();
        this.addParticles();
        this.bindFormEvents();
    }

    applyStyles() {
        // Aplicar classes ao container
        const container = this.form.closest('.max-w-md');
        if (container) {
            container.classList.add('kuhn-login-container');
        }

        // Aplicar classes ao título
        const title = this.form.previousElementSibling;
        if (title && title.tagName === 'H2') {
            title.classList.add('kuhn-login-title');
        }

        // Aplicar classes aos campos
        this.inputs.forEach((input, index) => {
            const group = input.closest('div') || input.parentElement;
            group.classList.add('kuhn-form-group');

            const label = group.querySelector('label');
            if (label) {
                label.classList.add('kuhn-form-label');
            }

            input.classList.add('kuhn-form-input');

            // Adicionar ícone
            const icon = document.createElement('div');
            icon.className = 'kuhn-field-icon';
            icon.textContent = input.type === 'email' ? '📧' : '🔒';
            group.appendChild(icon);
        });

        // Aplicar classes ao botão
        this.button.classList.add('kuhn-login-button');
    }

    addParticles() {
        const container = this.form.closest('.kuhn-login-container');
        if (!container) return;

        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'kuhn-login-particles';

        // Criar partículas
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'kuhn-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particlesContainer.appendChild(particle);
        }

        container.appendChild(particlesContainer);
    }

    bindFormEvents() {
        // Eventos dos inputs
        this.inputs.forEach(input => {
            input.addEventListener('focus', () => this.onInputFocus(input));
            input.addEventListener('blur', () => this.onInputBlur(input));
            input.addEventListener('input', () => this.onInputChange(input));
        });

        // Evento do formulário
        this.form.addEventListener('submit', (e) => this.onFormSubmit(e));
    }

    onInputFocus(input) {
        input.parentElement.classList.add('focused');
        this.addRippleEffect(input);
    }

    onInputBlur(input) {
        input.parentElement.classList.remove('focused');
        this.validateInput(input);
    }

    onInputChange(input) {
        this.validateInput(input);
    }

    validateInput(input) {
        const value = input.value.trim();
        const isValid = this.isValidInput(input, value);

        input.classList.remove('valid', 'invalid');
        input.classList.add(isValid ? 'valid' : 'invalid');

        // Remover mensagens existentes
        const existingMessage = input.parentElement.querySelector('.kuhn-error-message, .kuhn-success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Adicionar mensagem se necessário
        if (value && !isValid) {
            this.showInputMessage(input, this.getValidationMessage(input), 'error');
        } else if (value && isValid) {
            this.showInputMessage(input, this.getSuccessMessage(input), 'success');
        }
    }

    isValidInput(input, value) {
        if (!value) return true; // Campo vazio é válido

        if (input.type === 'email') {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }

        if (input.type === 'password') {
            return value.length >= 6;
        }

        return true;
    }

    getValidationMessage(input) {
        if (input.type === 'email') {
            return 'Por favor, insira um e-mail válido';
        }
        if (input.type === 'password') {
            return 'A senha deve ter pelo menos 6 caracteres';
        }
        return 'Campo inválido';
    }

    getSuccessMessage(input) {
        if (input.type === 'email') {
            return 'E-mail válido ✓';
        }
        if (input.type === 'password') {
            return 'Senha válida ✓';
        }
        return 'Campo válido ✓';
    }

    showInputMessage(input, message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `kuhn-${type}-message`;
        messageDiv.textContent = message;
        input.parentElement.appendChild(messageDiv);
    }

    addRippleEffect(element) {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(237, 28, 36, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (rect.width / 2 - size / 2) + 'px';
        ripple.style.top = (rect.height / 2 - size / 2) + 'px';

        element.style.position = 'relative';
        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    onFormSubmit(e) {
        if (this.isAnimating) {
            e.preventDefault();
            return;
        }

        // Validar todos os campos
        let isValid = true;
        this.inputs.forEach(input => {
            if (!this.isValidInput(input, input.value.trim())) {
                isValid = false;
                input.classList.add('invalid');
                this.showInputMessage(input, this.getValidationMessage(input), 'error');
            }
        });

        if (!isValid) {
            e.preventDefault();
            this.shakeForm();
            return;
        }

        // Mostrar loading
        this.showLoading();
    }

    showLoading() {
        this.isAnimating = true;
        this.button.classList.add('loading');
        this.button.value = 'Entrando...';

        // Simular loading (remover em produção)
        setTimeout(() => {
            this.button.classList.remove('loading');
            this.button.value = 'Entrar';
            this.isAnimating = false;
        }, 2000);
    }

    shakeForm() {
        const container = this.form.closest('.kuhn-login-container');
        if (container) {
            container.style.animation = 'shakeForm 0.5s ease-in-out';
            setTimeout(() => {
                container.style.animation = '';
            }, 500);
        }
    }
}

// Adicionar animação de shake ao CSS
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shakeForm {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(shakeStyle);

// Inicializar sistema
window.kuhnLogin = new KuhnLoginSystem();

console.log('🎉 Sistema de Login Kuhn carregado!');
