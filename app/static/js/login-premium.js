/* ============================================
   LOGIN PREMIUM - JAVASCRIPT
   Validação em Tempo Real + Mostrar Senha
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  // ========== 1. MOSTRAR/OCULTAR SENHA ==========
  const passwordInput = document.querySelector('input[type="password"]');
  
  if (passwordInput) {
    // Criar wrapper para o input
    const passwordGroup = passwordInput.closest('.form-group');
    const inputIcon = passwordGroup.querySelector('.input-icon');
    
    // Remover ícone de cadeado antigo se existir
    if (inputIcon) {
      const oldLock = inputIcon.querySelector('.icon-lock');
      if (oldLock) oldLock.remove();
    }
    
    // Criar botão toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle';
    toggleBtn.setAttribute('aria-label', 'Mostrar/ocultar senha');
    toggleBtn.innerHTML = '👁️';
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      toggleBtn.innerHTML = isPassword ? '👁️‍🗨️' : '👁️';
      toggleBtn.style.color = isPassword ? '#ED1C24' : '#666';
    });
    
    // Inserir botão após o input
    passwordInput.parentNode.insertBefore(toggleBtn, passwordInput.nextSibling);
  }

  // ========== 2. VALIDAÇÃO EM TEMPO REAL ==========
  const emailInput = document.querySelector('input[type="email"]');
  const form = document.querySelector('form');
  
  // Regex para validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      validateEmail(emailInput);
    });
    
    emailInput.addEventListener('blur', () => {
      validateEmail(emailInput);
    });
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      validatePassword(passwordInput);
    });
    
    passwordInput.addEventListener('blur', () => {
      validatePassword(passwordInput);
    });
  }
  
  function validateEmail(input) {
    const isValid = emailRegex.test(input.value);
    updateValidationUI(input, isValid && input.value.length > 0);
  }
  
  function validatePassword(input) {
    const isValid = input.value.length >= 6;
    updateValidationUI(input, isValid);
  }
  
  function updateValidationUI(input, isValid) {
    const formGroup = input.closest('.form-group');
    
    // Remover classes anteriores
    input.classList.remove('valid', 'invalid');
    
    // Remover ícone de validação anterior
    const oldIcon = formGroup.querySelector('.validation-icon');
    if (oldIcon) oldIcon.remove();
    
    if (input.value.length === 0) {
      input.classList.remove('valid', 'invalid');
      return;
    }
    
    // Criar novo ícone de validação
    const icon = document.createElement('span');
    icon.className = 'validation-icon show';
    
    if (isValid) {
      input.classList.add('valid');
      icon.classList.add('valid');
      icon.innerHTML = '✓';
    } else {
      input.classList.add('invalid');
      icon.classList.add('invalid');
      icon.innerHTML = '✗';
    }
    
    formGroup.appendChild(icon);
  }

  // ========== 3. LOADING SPINNER AO ENVIAR ==========
  if (form) {
    form.addEventListener('submit', function(e) {
      const submitBtn = form.querySelector('.btn-login');
      
      // Verificar se há erros
      if (!form.checkValidity()) {
        e.preventDefault();
        return;
      }
      
      if (submitBtn) {
        // Adicionar classe loading
        submitBtn.classList.add('loading');
        
        // Criar e inserir spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.marginRight = '8px';
        spinner.style.display = 'inline-block';
        
        // Guardar texto original
        const originalText = submitBtn.textContent;
        
        // Limpar e adicionar spinner
        submitBtn.innerHTML = '';
        submitBtn.appendChild(spinner);
        submitBtn.appendChild(document.createTextNode(' Entrando...'));
        
        // Desabilitar botão
        submitBtn.disabled = true;
        
        // Se houver erro, remover loading após 2s
        setTimeout(() => {
          // Isso será feito por um script no servidor se houver erro
          // Aqui apenas preparamos para o caso de sucesso
        }, 2000);
      }
    });
  }

  // ========== 4. FECHAR ALERT AO CLICAR ==========
  const alert = document.querySelector('.login-alert');
  if (alert && alert.classList.contains('show')) {
    alert.style.cursor = 'pointer';
    alert.addEventListener('click', () => {
      alert.classList.remove('show');
    });
    
    // Auto-fechar após 5 segundos
    setTimeout(() => {
      alert.classList.remove('show');
    }, 5000);
  }

  // ========== 5. FOCUS NO PRIMEIRO INPUT ==========
  if (emailInput) {
    setTimeout(() => {
      emailInput.focus();
    }, 500);
  }

  // ========== 6. EFEITO RIPPLE NO BOTÃO ==========
  const btn = document.querySelector('.btn-login');
  if (btn) {
    btn.addEventListener('click', function(e) {
      if (this.classList.contains('loading')) return;
      
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        animation: rippleAnimation 0.6s ease-out;
      `;
      
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  }
});

// ========== ANIMAÇÃO RIPPLE ==========
if (!document.querySelector('style[data-ripple]')) {
  const style = document.createElement('style');
  style.setAttribute('data-ripple', 'true');
  style.textContent = `
    @keyframes rippleAnimation {
      from {
        transform: scale(0);
        opacity: 1;
      }
      to {
        transform: scale(1);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
