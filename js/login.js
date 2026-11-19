const formMessage = document.querySelector('#formMessage');
const loginForm = document.querySelector('#loginForm');
const signupForm = document.querySelector('#signupForm');
const loginView = document.querySelector('#loginView');
const signupView = document.querySelector('#signupView');

function showMessage(message, type = '') {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`.trim();
}

function switchAuthView(target) {
  const showSignup = target === 'signup';
  loginView.classList.toggle('is-hidden', showSignup);
  signupView.classList.toggle('is-hidden', !showSignup);
  showMessage('');
  window.location.hash = showSignup ? 'signup' : 'login';
  const firstInput = showSignup ? document.querySelector('#signupUsername') : document.querySelector('#email');
  window.setTimeout(() => firstInput?.focus(), 0);
}

document.querySelectorAll('.switch-auth').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    switchAuthView(link.dataset.target);
  });
});

document.querySelectorAll('.password-toggle').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const input = document.querySelector(`#${toggle.dataset.passwordTarget}`);
    const isVisible = input.type === 'text';
    input.type = isVisible ? 'password' : 'text';
    toggle.classList.toggle('is-visible', !isVisible);
    toggle.setAttribute('aria-pressed', String(!isVisible));
    toggle.setAttribute('aria-label', isVisible ? 'Tampilkan password' : 'Sembunyikan password');
  });
});

function showRequestError(error) {
  const errorMessage = error?.message || '';
  const isFetchError = /failed to fetch|networkerror/i.test(errorMessage);
  showMessage(
    isFetchError
      ? 'Request gagal. Periksa deployment Apps Script dan akses Web App.'
      : (errorMessage || 'Permintaan gagal. Coba lagi.'),
    'error',
  );
}

signupForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!signupForm.checkValidity()) {
    signupForm.reportValidity();
    return;
  }

  const password = document.querySelector('#signupPassword').value;
  const confirmPassword = document.querySelector('#signupConfirmPassword').value;
  if (password !== confirmPassword) {
    showMessage('Confirm password harus sama dengan password.', 'error');
    document.querySelector('#signupConfirmPassword').focus();
    return;
  }

  const payload = {
    username: document.querySelector('#signupUsername').value.trim(),
    full_name: document.querySelector('#signupFullName').value.trim(),
    email: document.querySelector('#signupEmail').value.trim().toLowerCase(),
    password,
    confirm_password: confirmPassword,
  };
  const submitButton = signupForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  DuitAuth.callServer('registerUser', payload)
    .then((result) => {
      submitButton.disabled = false;
      if (!result?.success) {
        showMessage(result?.message || 'Pendaftaran gagal.', 'error');
        return;
      }
      signupForm.reset();
      document.querySelector('#email').value = payload.email;
      showMessage(result.message || 'Akun berhasil dibuat. Silakan masuk.', 'success');
      window.setTimeout(() => switchAuthView('login'), 1200);
    })
    .catch((error) => {
      submitButton.disabled = false;
      showRequestError(error);
    });
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
  }

  const payload = {
    identifier: document.querySelector('#email').value.trim(),
    password: document.querySelector('#password').value,
    remember: document.querySelector('input[name="remember"]').checked,
  };
  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  DuitAuth.callServer('loginUser', payload)
    .then((result) => {
      submitButton.disabled = false;
      if (!result?.success) {
        showMessage(result?.message || 'Email atau password salah.', 'error');
        return;
      }
      DuitAuth.setSessionCookie(result.token, payload.remember);
      window.location.replace('index.html');
    })
    .catch((error) => {
      submitButton.disabled = false;
      showRequestError(error);
    });
});

if (window.location.hash === '#signup') switchAuthView('signup');

