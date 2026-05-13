document.addEventListener('DOMContentLoaded', () => {
  const dayNames = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];

  const statusDay = document.getElementById('statusDay');
  const statusDate = document.getElementById('statusDate');
  const statusTime = document.getElementById('statusTime');
  const statusYear = document.getElementById('statusYear');
  const loginAlert = document.getElementById('loginAlert');
  const form = document.querySelector('.login-card__form form');
  const emailInput = form ? form.querySelector('input[name="email"]') : null;
  const passwordInput = form ? form.querySelector('input[name="password"]') : null;
  const submitButton = form ? form.querySelector('.btn-login') : null;

  function updateClock() {
    const now = new Date();

    if (statusDay) {
      statusDay.textContent = dayNames[now.getDay()];
    }

    if (statusDate) {
      statusDate.textContent = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }

    if (statusTime) {
      statusTime.textContent = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    if (statusYear) {
      statusYear.textContent = `© ${now.getFullYear()}`;
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  if (loginAlert) {
    const text = loginAlert.textContent.trim();
    if (!text) {
      loginAlert.classList.remove('show');
    }
  }

  const removeFieldError = (input) => {
    if (!input) return;
    const group = input.closest('.form-group');
    if (!group) return;
    const error = group.querySelector('.field-error');
    if (error) {
      error.remove();
    }
  };

  if (emailInput) {
    emailInput.addEventListener('input', () => removeFieldError(emailInput));
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => removeFieldError(passwordInput));
  }

  if (form && submitButton) {
    form.addEventListener('submit', () => {
      submitButton.disabled = true;
      submitButton.dataset.originalValue = submitButton.value;
      submitButton.value = 'Entrando...';
      submitButton.classList.add('is-loading');
    });
  }

  // micro animation for features
  const featureItems = document.querySelectorAll('.features li');
  featureItems.forEach((item, index) => {
    item.style.animation = `fadeInUp 0.6s ease ${index * 0.15}s both`;
  });
});

