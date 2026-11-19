(function protectDashboard(windowObject, documentObject) {
  function updateProfile(user) {
    const fullName = String(user && user.full_name || '').trim();
    if (!fullName) return;

    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const initials = nameParts
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join('')
      .toLocaleUpperCase('id-ID');

    const sidebarAvatar = documentObject.querySelector('#profileAvatar');
    if (sidebarAvatar) sidebarAvatar.textContent = initials;

    const profileSettingsButton = documentObject.querySelector('#openProfileSettings');
    if (profileSettingsButton) profileSettingsButton.setAttribute('aria-label', `Buka pengaturan profil ${fullName}`);

    const legacySidebarAvatar = documentObject.querySelector('.profile-mini .avatar');
    if (legacySidebarAvatar) legacySidebarAvatar.textContent = initials;

    const sidebarName = documentObject.querySelector('#sidebarProfileName, .profile-copy strong');
    if (sidebarName) sidebarName.textContent = fullName;
  }

  const token = windowObject.DuitAuth && windowObject.DuitAuth.getSessionToken();
  if (!token) {
    windowObject.location.replace('login.html');
    return;
  }

  windowObject.DuitAuth.callServer('validateSession', { token })
    .then((result) => {
      if (!result || !result.success) {
        windowObject.DuitAuth.clearSessionCookie();
        windowObject.location.replace('login.html');
        return;
      }
      windowObject.DuitCurrentUser = result.user;
      try {
        windowObject.localStorage.setItem('duit_current_user_id', String(result.user.id || ''));
      } catch (storageError) {
        console.warn('Cache user lokal tidak tersedia.', storageError);
      }
      updateProfile(result.user);
      documentObject.documentElement.classList.remove('auth-checking');
      documentObject.dispatchEvent(new CustomEvent('duit:auth-ready', { detail: { user: result.user } }));
    })
    .catch(() => {
      windowObject.DuitAuth.clearSessionCookie();
      windowObject.location.replace('login.html');
    });
})(window, document);
