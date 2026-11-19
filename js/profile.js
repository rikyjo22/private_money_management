(function setupProfileSettings(windowObject, documentObject) {
  const modal = documentObject.querySelector('#profileModal');
  const openButton = documentObject.querySelector('#openProfileSettings');
  const closeButton = documentObject.querySelector('#closeProfileModal');
  const cancelButton = documentObject.querySelector('#cancelProfileModal');
  const form = documentObject.querySelector('#profileForm');
  const nameInput = documentObject.querySelector('#profileFullName');
  const usernameInput = documentObject.querySelector('#profileUsername');
  const emailInput = documentObject.querySelector('#profileEmail');
  const photoInput = documentObject.querySelector('#profilePhotoInput');
  const photoPreview = documentObject.querySelector('#profilePhotoPreview');
  const status = documentObject.querySelector('#profileSaveStatus');
  const saveButton = documentObject.querySelector('#saveProfileButton');
  let selectedPhoto = '';
  let currentPhoto = '';
  let profileRequest = null;
  let loadedProfileUserId = '';

  function photoCacheKey(userId) {
    return `duit_profile_photo_v1_${String(userId || '')}`;
  }

  function readCachedPhoto(userId) {
    try { return userId ? windowObject.localStorage.getItem(photoCacheKey(userId)) || '' : ''; }
    catch (error) { return ''; }
  }

  function cachePhoto(userId, photoDataUrl) {
    if (!userId) return;
    try {
      if (photoDataUrl) windowObject.localStorage.setItem(photoCacheKey(userId), photoDataUrl);
      else windowObject.localStorage.removeItem(photoCacheKey(userId));
    } catch (error) {
      // Foto tetap berfungsi selama sesi berjalan jika penyimpanan lokal penuh.
    }
  }

  function initials(name) {
    return String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map((part) => Array.from(part)[0] || '').join('').toLocaleUpperCase('id-ID') || 'U';
  }

  function setAvatar(element, user, photoDataUrl) {
    if (!element) return;
    element.textContent = photoDataUrl ? '' : initials(user && user.full_name);
    element.style.backgroundImage = photoDataUrl ? `url("${photoDataUrl}")` : '';
    element.classList.toggle('has-photo', Boolean(photoDataUrl));
    if (element.id === 'profileMenuToggle') {
      element.setAttribute('aria-label', `Buka menu profil ${String(user && user.full_name || '').trim()}`);
    }
  }

  function renderUser(user, photoDataUrl) {
    if (!user) return;
    const photo = typeof photoDataUrl === 'string' ? photoDataUrl : currentPhoto;
    currentPhoto = photo;
    windowObject.DuitCurrentUser = { ...windowObject.DuitCurrentUser, ...user };
    cachePhoto(user.id, photo);
    setAvatar(documentObject.querySelector('#profileMenuToggle'), user, photo);
    setAvatar(documentObject.querySelector('.profile-mini .avatar'), user, photo);
    const sidebarName = documentObject.querySelector('.profile-copy strong');
    if (sidebarName) sidebarName.textContent = user.full_name || '';
    setAvatar(photoPreview, user, selectedPhoto || photo);
  }

  function showModal() {
    const user = windowObject.DuitCurrentUser || {};
    nameInput.value = user.full_name || '';
    usernameInput.value = user.username || '';
    emailInput.value = user.email || '';
    selectedPhoto = '';
    photoInput.value = '';
    status.textContent = '';
    renderUser(user, currentPhoto);
    modal.hidden = false;
    documentObject.body.classList.add('menu-lock');
    nameInput.focus();
    loadProfile(user, true)
      .then((result) => {
        if (!result) return;
        nameInput.value = result.full_name || user.full_name || '';
        usernameInput.value = result.username || user.username || '';
        emailInput.value = result.email || user.email || '';
      })
      .catch((error) => { status.textContent = error.message || 'Profil tidak dapat dimuat.'; });
  }

  function hideModal() {
    modal.hidden = true;
    documentObject.body.classList.remove('menu-lock');
    openButton.focus();
  }

  function loadProfile(user, forceRefresh) {
    const userId = String(user && user.id || '');
    if (!userId) return Promise.resolve(null);
    if (!forceRefresh && loadedProfileUserId === userId) return Promise.resolve(windowObject.DuitCurrentUser);
    if (profileRequest && profileRequest.userId === userId) return profileRequest.promise;

    const cachedPhoto = readCachedPhoto(userId);
    if (cachedPhoto) renderUser(user, cachedPhoto);
    const request = windowObject.DuitAuth.callServer('getUserProfile', { token: windowObject.DuitAuth.getSessionToken() })
      .then((result) => {
        if (!result || !result.success) throw new Error(result && result.message || 'Profil tidak dapat dimuat.');
        renderUser(result.user, result.user.profile_photo_data_url || '');
        loadedProfileUserId = userId;
        return result.user;
      })
      .finally(() => { if (profileRequest && profileRequest.userId === userId) profileRequest = null; });
    profileRequest = { userId, promise: request };
    return request;
  }

  function resizeJpeg(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxEdge = 512;
        const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = documentObject.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Foto tidak dapat diproses di perangkat ini.'));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('File foto tidak dapat dibuka.'));
      };
      image.src = objectUrl;
    });
  }

  openButton.addEventListener('click', showModal);
  closeButton.addEventListener('click', hideModal);
  cancelButton.addEventListener('click', hideModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) hideModal(); });
  documentObject.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) hideModal();
  });

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) {
      status.textContent = 'Pilih foto JPG, PNG, atau WEBP dengan ukuran maksimal 8 MB.';
      photoInput.value = '';
      return;
    }
    status.textContent = 'Memproses foto...';
    try {
      selectedPhoto = await resizeJpeg(file);
      setAvatar(photoPreview, windowObject.DuitCurrentUser, selectedPhoto);
      status.textContent = '';
    } catch (error) {
      status.textContent = error.message;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    status.textContent = 'Menyimpan profil...';
    const originalLabel = saveButton.textContent;
    saveButton.textContent = 'Menyimpan...';
    try {
      const result = await windowObject.DuitAuth.callServer('updateUserProfile', {
        token: windowObject.DuitAuth.getSessionToken(),
        full_name: nameInput.value.trim(),
        photo_data_url: selectedPhoto,
      });
      if (!result || !result.success) throw new Error(result && result.message || 'Profil gagal disimpan.');
      const updatedUser = result.user;
      const photo = updatedUser.profile_photo_data_url || selectedPhoto || currentPhoto;
      renderUser(updatedUser, photo);
      selectedPhoto = '';
      status.textContent = 'Profil berhasil disimpan.';
      window.setTimeout(hideModal, 650);
    } catch (error) {
      status.textContent = error.message || 'Profil gagal disimpan. Coba lagi.';
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = originalLabel;
    }
  });

  documentObject.addEventListener('duit:auth-ready', (event) => {
    const user = event.detail && event.detail.user || windowObject.DuitCurrentUser;
    if (user) loadProfile(user, false).catch(() => {});
  });
  if (windowObject.DuitCurrentUser) loadProfile(windowObject.DuitCurrentUser, false).catch(() => {});
})(window, document);
