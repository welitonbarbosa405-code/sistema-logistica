/**
 * Sistema de Micro-interações Kuhn - Ultra Moderno
 * Sistema completo de micro-interações e efeitos visuais
 */

class KuhnMicroInteractions {
    constructor() {
        this.rippleElements = new Map();
        this.hoverEffects = new Map();
        this.init();
    }

    init() {
        this.addStyles();
        this.bindGlobalEvents();
        console.log('🚀 Sistema de Micro-interações Kuhn inicializado');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Efeito Ripple */
            .kuhn-ripple {
                position: relative;
                overflow: hidden;
                cursor: pointer;
            }

            .kuhn-ripple-effect {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: rippleAnimation 0.6s linear;
                pointer-events: none;
            }

            @keyframes rippleAnimation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            /* Efeito de Hover com Elevação */
            .kuhn-hover-lift {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
            }

            .kuhn-hover-lift:hover {
                transform: translateY(-8px) scale(1.02);
                box-shadow: 
                    0 20px 40px rgba(0, 0, 0, 0.15),
                    0 0 20px rgba(237, 28, 36, 0.2);
            }

            /* Efeito de Glow */
            .kuhn-glow {
                transition: all 0.3s ease;
            }

            .kuhn-glow:hover {
                box-shadow: 
                    0 0 20px rgba(237, 28, 36, 0.4),
                    0 0 40px rgba(237, 28, 36, 0.2),
                    0 0 60px rgba(237, 28, 36, 0.1);
            }

            /* Efeito de Rotação */
            .kuhn-rotate-hover {
                transition: transform 0.3s ease;
            }

            .kuhn-rotate-hover:hover {
                transform: rotate(5deg) scale(1.05);
            }

            /* Efeito de Pulse */
            .kuhn-pulse {
                animation: pulseEffect 2s ease-in-out infinite;
            }

            @keyframes pulseEffect {
                0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(237, 28, 36, 0.4);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow: 0 0 0 10px rgba(237, 28, 36, 0);
                }
            }

            /* Efeito de Shake */
            .kuhn-shake {
                animation: shakeEffect 0.5s ease-in-out;
            }

            @keyframes shakeEffect {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            /* Efeito de Bounce */
            .kuhn-bounce {
                animation: bounceEffect 0.6s ease-in-out;
            }

            @keyframes bounceEffect {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            /* Efeito de Fade In */
            .kuhn-fade-in {
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.6s ease;
            }

            .kuhn-fade-in.show {
                opacity: 1;
                transform: translateY(0);
            }

            /* Efeito de Slide In */
            .kuhn-slide-in-left {
                opacity: 0;
                transform: translateX(-50px);
                transition: all 0.6s ease;
            }

            .kuhn-slide-in-left.show {
                opacity: 1;
                transform: translateX(0);
            }

            .kuhn-slide-in-right {
                opacity: 0;
                transform: translateX(50px);
                transition: all 0.6s ease;
            }

            .kuhn-slide-in-right.show {
                opacity: 1;
                transform: translateX(0);
            }

            /* Efeito de Scale In */
            .kuhn-scale-in {
                opacity: 0;
                transform: scale(0.8);
                transition: all 0.6s ease;
            }

            .kuhn-scale-in.show {
                opacity: 1;
                transform: scale(1);
            }

            /* Efeito de Flip */
            .kuhn-flip {
                transition: transform 0.6s ease;
                transform-style: preserve-3d;
            }

            .kuhn-flip:hover {
                transform: rotateY(180deg);
            }

            /* Efeito de Tilt */
            .kuhn-tilt {
                transition: transform 0.3s ease;
            }

            .kuhn-tilt:hover {
                transform: perspective(1000px) rotateX(10deg) rotateY(10deg);
            }

            /* Efeito de Morph */
            .kuhn-morph {
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kuhn-morph:hover {
                border-radius: 20px;
                background: linear-gradient(135deg, rgba(237, 28, 36, 0.1), rgba(255, 71, 87, 0.1));
            }

            /* Efeito de Neon */
            .kuhn-neon {
                transition: all 0.3s ease;
            }

            .kuhn-neon:hover {
                text-shadow: 
                    0 0 5px rgba(237, 28, 36, 0.8),
                    0 0 10px rgba(237, 28, 36, 0.6),
                    0 0 15px rgba(237, 28, 36, 0.4),
                    0 0 20px rgba(237, 28, 36, 0.2);
            }

            /* Efeito de Gradient Shift */
            .kuhn-gradient-shift {
                background: linear-gradient(45deg, #ED1C24, #ff4757, #c41e3a, #ED1C24);
                background-size: 300% 300%;
                animation: gradientShift 3s ease infinite;
            }

            @keyframes gradientShift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }

            /* Efeito de Particle Burst */
            .kuhn-particle-burst {
                position: relative;
                overflow: hidden;
            }

            .kuhn-particle {
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(237, 28, 36, 0.8);
                border-radius: 50%;
                pointer-events: none;
                animation: particleBurst 1s ease-out forwards;
            }

            @keyframes particleBurst {
                0% {
                    transform: scale(0) translate(0, 0);
                    opacity: 1;
                }
                100% {
                    transform: scale(1) translate(var(--random-x), var(--random-y));
                    opacity: 0;
                }
            }

            /* Efeito de Liquid */
            .kuhn-liquid {
                position: relative;
                overflow: hidden;
            }

            .kuhn-liquid::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, 
                    transparent, 
                    rgba(255, 255, 255, 0.2), 
                    transparent);
                transition: left 0.5s ease;
            }

            .kuhn-liquid:hover::before {
                left: 100%;
            }

            /* Efeito de Magnetic */
            .kuhn-magnetic {
                transition: transform 0.3s ease;
            }

            /* Efeito de Elastic */
            .kuhn-elastic {
                transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            .kuhn-elastic:hover {
                transform: scale(1.1);
            }

            /* Efeito de Glitch */
            .kuhn-glitch {
                position: relative;
            }

            .kuhn-glitch::before,
            .kuhn-glitch::after {
                content: attr(data-text);
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }

            .kuhn-glitch::before {
                animation: glitch1 0.5s infinite;
                color: #ff0000;
                z-index: -1;
            }

            .kuhn-glitch::after {
                animation: glitch2 0.5s infinite;
                color: #00ff00;
                z-index: -2;
            }

            @keyframes glitch1 {
                0%, 100% { transform: translate(0); }
                20% { transform: translate(-2px, 2px); }
                40% { transform: translate(-2px, -2px); }
                60% { transform: translate(2px, 2px); }
                80% { transform: translate(2px, -2px); }
            }

            @keyframes glitch2 {
                0%, 100% { transform: translate(0); }
                20% { transform: translate(2px, 2px); }
                40% { transform: translate(2px, -2px); }
                60% { transform: translate(-2px, 2px); }
                80% { transform: translate(-2px, -2px); }
            }
        `;
        document.head.appendChild(style);
    }

    bindGlobalEvents() {
        // Auto-aplicar efeitos a elementos com classes específicas
        document.addEventListener('DOMContentLoaded', () => {
            this.autoApplyEffects();
        });

        // Re-aplicar quando novos elementos são adicionados
        const observer = new MutationObserver(() => {
            this.autoApplyEffects();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    autoApplyEffects() {
        // Aplicar ripple a botões
        document.querySelectorAll('button, .btn, .nav-link').forEach(element => {
            if (!element.classList.contains('kuhn-ripple')) {
                this.addRippleEffect(element);
            }
        });

        // Aplicar hover effects a cards
        document.querySelectorAll('.card, .result-item, .kpi-card').forEach(element => {
            if (!element.classList.contains('kuhn-hover-lift')) {
                element.classList.add('kuhn-hover-lift');
            }
        });

        // Aplicar fade-in a elementos que entram na viewport
        this.observeElements();
    }

    addRippleEffect(element) {
        element.classList.add('kuhn-ripple');
        
        element.addEventListener('click', (e) => {
            this.createRipple(e, element);
        });
    }

    createRipple(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('kuhn-ripple-effect');

        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    addHoverEffect(element, effectType = 'lift') {
        element.classList.add(`kuhn-${effectType}`);
        this.hoverEffects.set(element, effectType);
    }

    addPulseEffect(element) {
        element.classList.add('kuhn-pulse');
    }

    addShakeEffect(element) {
        element.classList.add('kuhn-shake');
        setTimeout(() => {
            element.classList.remove('kuhn-shake');
        }, 500);
    }

    addBounceEffect(element) {
        element.classList.add('kuhn-bounce');
        setTimeout(() => {
            element.classList.remove('kuhn-bounce');
        }, 600);
    }

    addFadeInEffect(element, delay = 0) {
        element.classList.add('kuhn-fade-in');
        
        setTimeout(() => {
            element.classList.add('show');
        }, delay);
    }

    addSlideInEffect(element, direction = 'left', delay = 0) {
        element.classList.add(`kuhn-slide-in-${direction}`);
        
        setTimeout(() => {
            element.classList.add('show');
        }, delay);
    }

    addScaleInEffect(element, delay = 0) {
        element.classList.add('kuhn-scale-in');
        
        setTimeout(() => {
            element.classList.add('show');
        }, delay);
    }

    addFlipEffect(element) {
        element.classList.add('kuhn-flip');
    }

    addTiltEffect(element) {
        element.classList.add('kuhn-tilt');
    }

    addMorphEffect(element) {
        element.classList.add('kuhn-morph');
    }

    addNeonEffect(element) {
        element.classList.add('kuhn-neon');
    }

    addGradientShiftEffect(element) {
        element.classList.add('kuhn-gradient-shift');
    }

    addLiquidEffect(element) {
        element.classList.add('kuhn-liquid');
    }

    addMagneticEffect(element) {
        element.classList.add('kuhn-magnetic');
        
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = 50;
            
            if (distance < maxDistance) {
                const strength = (maxDistance - distance) / maxDistance;
                element.style.transform = `translate(${x * strength * 0.1}px, ${y * strength * 0.1}px)`;
            }
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = '';
        });
    }

    addElasticEffect(element) {
        element.classList.add('kuhn-elastic');
    }

    addGlitchEffect(element, text) {
        element.classList.add('kuhn-glitch');
        element.setAttribute('data-text', text);
    }

    createParticleBurst(element, count = 10) {
        element.classList.add('kuhn-particle-burst');
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('kuhn-particle');
            
            const randomX = (Math.random() - 0.5) * 200;
            const randomY = (Math.random() - 0.5) * 200;
            
            particle.style.setProperty('--random-x', randomX + 'px');
            particle.style.setProperty('--random-y', randomY + 'px');
            
            element.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // Aplicar efeito baseado na posição
                    if (element.dataset.kuhnEffect) {
                        const effect = element.dataset.kuhnEffect;
                        const delay = parseInt(element.dataset.kuhnDelay) || 0;
                        
                        switch (effect) {
                            case 'fade-in':
                                this.addFadeInEffect(element, delay);
                                break;
                            case 'slide-left':
                                this.addSlideInEffect(element, 'left', delay);
                                break;
                            case 'slide-right':
                                this.addSlideInEffect(element, 'right', delay);
                                break;
                            case 'scale-in':
                                this.addScaleInEffect(element, delay);
                                break;
                        }
                    }
                    
                    observer.unobserve(element);
                }
            });
        }, { threshold: 0.1 });

        // Observar elementos com data attributes
        document.querySelectorAll('[data-kuhn-effect]').forEach(element => {
            observer.observe(element);
        });
    }

    // Métodos de conveniência
    enhanceButton(button) {
        this.addRippleEffect(button);
        this.addHoverEffect(button, 'lift');
    }

    enhanceCard(card) {
        this.addHoverEffect(card, 'lift');
        this.addFadeInEffect(card);
    }

    enhanceInput(input) {
        this.addLiquidEffect(input);
    }

    enhanceLink(link) {
        this.addRippleEffect(link);
        this.addNeonEffect(link);
    }
}

// Inicializar sistema global
window.kuhnMicro = new KuhnMicroInteractions();

// Exemplos de uso
window.showMicroExamples = function() {
    // Exemplo de pulse em um elemento
    const element = document.querySelector('.tracking-title');
    if (element) {
        kuhnMicro.addPulseEffect(element);
    }

    // Exemplo de particle burst
    const button = document.querySelector('.tracking-button');
    if (button) {
        button.addEventListener('click', () => {
            kuhnMicro.createParticleBurst(button, 15);
        });
    }

    // Exemplo de magnetic effect
    const cards = document.querySelectorAll('.result-item');
    cards.forEach(card => {
        kuhnMicro.addMagneticEffect(card);
    });
};

console.log('🎉 Sistema de Micro-interações Kuhn carregado! Use kuhnMicro.addRippleEffect(), kuhnMicro.addHoverEffect(), etc.');
