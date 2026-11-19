(function setupSettings(windowObject, documentObject) {
  const navDefinitions = [
    ['dasbor', 'Dasbor'], ['transaksi', 'Transaksi'], ['transfer', 'Transfer'], ['utang', 'Utang'],
    ['tabungan', 'Tabungan'], ['dompet', 'Dompet/Akun'], ['kategori', 'Kategori'], ['laporan', 'Laporan'],
  ];
  const themeGroups = {
    general: [['light', 'Terang'], ['dark', 'Gelap'], ['system', 'Sistem'], ['amoled', 'AMOLED']],
    contrast: [['high-contrast-light', 'Kontras tinggi terang'], ['high-contrast-dark', 'Kontras tinggi gelap'], ['sepia', 'Sepia/Mode baca'], ['dim', 'Gelap redup/lembut']],
    uiux: [['classic', 'Klasik'], ['minimalist', 'Minimalis'], ['modern', 'Modern'], ['compact', 'Ringkas']],
    neutral: [['slate', 'Slate'], ['nord', 'Nord'], ['warm-sand', 'Hangat/Pasir'], ['midnight', 'Tengah malam']],
  };
  const themeNames = Object.values(themeGroups).flat().map(([id]) => id);
  const legacyThemeMap = { ocean: 'nord', forest: 'classic', rose: 'minimalist', sunset: 'warm-sand', graphite: 'slate' };
  const fontFamilies = ['DM Sans', 'Plus Jakarta Sans', 'Arial', 'Georgia', 'system-ui'];
  const knownIds = ['theme', 'language', 'font_family', 'font_size', 'sidebar_order', ...navDefinitions.map(([id]) => `sidebar_visible_${id}`)];
  const settingsToggle = documentObject.querySelector('#settingsToggle');
  const settingsModal = documentObject.querySelector('#settingsModal');
  const openResetButton = documentObject.querySelector('#openSettingsReset');
  const resetModal = documentObject.querySelector('#settingsResetModal');
  const closeResetButton = documentObject.querySelector('#closeSettingsReset');
  const cancelResetButton = documentObject.querySelector('#cancelSettingsReset');
  const confirmResetButton = documentObject.querySelector('#confirmSettingsReset');
  const resetStatus = documentObject.querySelector('#settingsResetStatus');
  const closeSettings = documentObject.querySelector('#closeSettings');
  const settingsStatus = documentObject.querySelector('#settingsSyncStatus');
  const sidebarList = documentObject.querySelector('#settingsSidebarList');
  const fontFamilyControl = documentObject.querySelector('#settingsFontFamily');
  const fontSizeControl = documentObject.querySelector('#settingsFontSize');
  const fontSizeValue = documentObject.querySelector('#settingsFontSizeValue');
  const languageControl = documentObject.querySelector('#settingsLanguage');
  const themeGroupControl = documentObject.querySelector('#settingsThemeGroup');
  const themeControl = documentObject.querySelector('#settingsTheme');
  const saveSettingsButton = documentObject.querySelector('#saveSettings');
  const cancelSettingsButton = documentObject.querySelector('#cancelSettings');
  const mainNav = documentObject.querySelector('.main-nav');
  const localPrefix = 'duit_settings_v1_';
  const savedFontSizes = new WeakMap();
  let currentScale = 1;
  let state = null;
  let currentUserId = '';
  let syncTimer = null;
  let syncQueue = Promise.resolve();
  let dragSource = null;
  let isSaving = false;
  let isResetting = false;
  let saveConfirmed = false;
  let selectedThemeGroup = 'general';
  let lastAppliedTheme = null;

  function normalizeTheme(theme) { return legacyThemeMap[theme] || theme; }

  function getThemeGroup(theme) {
    return Object.keys(themeGroups).find((group) => themeGroups[group].some(([id]) => id === theme)) || 'general';
  }

  function renderThemeOptions(activeTheme) {
    if (!themeControl) return;
    themeControl.replaceChildren();
    const placeholder = documentObject.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Pilih tema';
    themeControl.appendChild(placeholder);
    const themes = themeGroups[selectedThemeGroup] || themeGroups.general;
    themes.forEach(([id, label]) => {
      const option = documentObject.createElement('option');
      option.value = id;
      option.textContent = label;
      themeControl.appendChild(option);
    });
    themeControl.value = themes.some(([id]) => id === activeTheme) ? activeTheme : '';
  }

  function defaultValues() {
    const values = {
      theme: 'light',
      language: 'id',
      font_family: 'DM Sans',
      font_size: '14',
      sidebar_order: JSON.stringify(navDefinitions.map(([id]) => id)),
    };
    navDefinitions.forEach(([id]) => { values[`sidebar_visible_${id}`] = 'true'; });
    return values;
  }

  function localStorageKey() { return `${localPrefix}${currentUserId}`; }

  function readLocalSettings() {
    try {
      const raw = windowObject.localStorage.getItem(localStorageKey());
      if (!raw) return null;
      const value = JSON.parse(raw);
      return value && value.values && value.synced ? value : null;
    } catch (error) {
      return null;
    }
  }

  function saveLocalSettings() {
    if (!state || !currentUserId) return;
    try { windowObject.localStorage.setItem(localStorageKey(), JSON.stringify(state)); } catch (error) {
      setStatus('Penyimpanan lokal tidak tersedia.');
    }
  }

  function setStatus(message, isError) {
    if (!settingsStatus) return;
    settingsStatus.textContent = message;
    settingsStatus.classList.toggle('is-error', Boolean(isError));
  }

  function hasUnsavedChanges() {
    return Boolean(state && knownIds.some((id) => state.values[id] !== state.synced[id]));
  }

  function updateSaveButtonState() {
    if (!saveSettingsButton) return;
    const hasChanges = hasUnsavedChanges();
    saveSettingsButton.disabled = isSaving || !hasChanges;
    if (cancelSettingsButton) cancelSettingsButton.disabled = isSaving || !hasChanges;
    saveSettingsButton.classList.toggle('is-saving', isSaving);
    const isSaved = !isSaving && saveConfirmed && !hasChanges;
    saveSettingsButton.classList.toggle('is-saved', isSaved);
    saveSettingsButton.innerHTML = isSaving
      ? '<svg aria-hidden="true"><use href="#icon-refresh"></use></svg><span>Saving...</span>'
      : isSaved
        ? '<svg aria-hidden="true"><use href="#icon-check"></use></svg><span>Tersimpan</span>'
        : '<svg aria-hidden="true"><use href="#icon-check"></use></svg><span>Simpan</span>';
  }

  function markSettingsChanged() {
    saveConfirmed = false;
    updateSaveButtonState();
    if (!isSaving) setStatus('Ada perubahan yang belum disimpan.');
  }

  function safeOrder(rawOrder) {
    let order = [];
    try { order = JSON.parse(rawOrder || '[]'); } catch (error) { order = []; }
    if (!Array.isArray(order)) order = [];
    const valid = order.filter((id, index) => navDefinitions.some(([known]) => known === id) && order.indexOf(id) === index);
    navDefinitions.forEach(([id]) => { if (!valid.includes(id)) valid.push(id); });
    return valid;
  }

  function orderedNavItems() {
    const byId = new Map(Array.from(mainNav.querySelectorAll('.nav-item')).map((item) => [item.getAttribute('href').slice(1), item]));
    return safeOrder(state.values.sidebar_order).map((id) => byId.get(id)).filter(Boolean);
  }

  function applySidebarSettings() {
    if (!state || !mainNav) return;
    const ordered = orderedNavItems();
    ordered.forEach((item) => {
      const id = item.getAttribute('href').slice(1);
      item.hidden = state.values[`sidebar_visible_${id}`] === 'false';
      mainNav.appendChild(item);
    });
    const active = mainNav.querySelector('.nav-item.active');
    if (active && active.hidden) {
      const firstVisible = ordered.find((item) => !item.hidden);
      if (firstVisible) windowObject.location.hash = firstVisible.getAttribute('href');
    }
  }

  function scaleText(root, scale) {
    if (!root) return;
    const walker = documentObject.createTreeWalker(root, windowObject.NodeFilter.SHOW_TEXT);
    const elements = new Set();
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim()) elements.add(node.parentElement);
    }
    elements.forEach((element) => {
      if (!element || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(element.tagName)) return;
      let base = savedFontSizes.get(element);
      if (base == null) {
        const computed = parseFloat(windowObject.getComputedStyle(element).fontSize) || 14;
        const parentSize = element.parentElement ? parseFloat(windowObject.getComputedStyle(element.parentElement).fontSize) : NaN;
        base = currentScale !== 1 && Math.abs(computed - parentSize) < 0.1 ? computed / currentScale : computed;
        savedFontSizes.set(element, base);
      }
      element.style.fontSize = `${base * scale}px`;
    });
    currentScale = scale;
  }

  function applySettings() {
    if (!state) return;
    const values = state.values;
    const theme = themeNames.includes(normalizeTheme(values.theme)) ? normalizeTheme(values.theme) : 'light';
    const language = values.language === 'en' ? 'en' : 'id';
    const fontFamily = fontFamilies.includes(values.font_family) ? values.font_family : 'DM Sans';
    const fontSize = Math.max(12, Math.min(20, Number(values.font_size) || 14));
    if (lastAppliedTheme !== theme) {
      selectedThemeGroup = getThemeGroup(theme);
      lastAppliedTheme = theme;
    }
    documentObject.documentElement.dataset.theme = theme;
    if (windowObject.DuitI18n) windowObject.DuitI18n.setLanguage(language);
    else documentObject.documentElement.lang = language;
    documentObject.documentElement.style.setProperty('--app-font-family', `"${fontFamily}", sans-serif`);
    scaleText(documentObject.body, fontSize / 14);
    if (fontFamilyControl) fontFamilyControl.value = fontFamily;
    if (languageControl) languageControl.value = language;
    if (fontSizeControl) fontSizeControl.value = String(fontSize);
    if (fontSizeValue) fontSizeValue.value = `${fontSize} px`;
    if (themeGroupControl) themeGroupControl.value = selectedThemeGroup;
    renderThemeOptions(theme);
    applySidebarSettings();
    renderSidebarSettings();
  }

  function renderSidebarSettings() {
    if (!sidebarList || !state) return;
    sidebarList.replaceChildren();
    safeOrder(state.values.sidebar_order).forEach((id, index, order) => {
      const definition = navDefinitions.find(([route]) => route === id);
      if (!definition) return;
      const [route, label] = definition;
      const item = documentObject.createElement('li');
      item.className = 'settings-sidebar-item';
      item.draggable = true;
      item.dataset.route = route;

      const drag = documentObject.createElement('span');
      drag.className = 'settings-drag-handle';
      drag.innerHTML = '<svg viewBox="0 0 16 20" aria-hidden="true"><circle cx="5" cy="4" r="1.3"></circle><circle cx="11" cy="4" r="1.3"></circle><circle cx="5" cy="10" r="1.3"></circle><circle cx="11" cy="10" r="1.3"></circle><circle cx="5" cy="16" r="1.3"></circle><circle cx="11" cy="16" r="1.3"></circle></svg>';
      drag.title = 'Seret untuk mengurutkan';
      drag.setAttribute('aria-hidden', 'true');
      item.appendChild(drag);

      const labelElement = documentObject.createElement('label');
      labelElement.className = 'settings-sidebar-check';
      const checkbox = documentObject.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = state.values[`sidebar_visible_${route}`] !== 'false';
      checkbox.setAttribute('aria-label', `Tampilkan ${label}`);
      checkbox.addEventListener('change', () => {
        const anyOtherVisible = navDefinitions.some(([otherId]) => otherId !== route && state.values[`sidebar_visible_${otherId}`] !== 'false');
        if (!checkbox.checked && !anyOtherVisible) {
          checkbox.checked = true;
          setStatus('Sisakan setidaknya satu menu yang terlihat.');
          return;
        }
        state.values[`sidebar_visible_${route}`] = String(checkbox.checked);
        saveLocalSettings();
        applySidebarSettings();
        markSettingsChanged();
      });
      const name = documentObject.createElement('span');
      name.textContent = label;
      labelElement.append(checkbox, name);
      item.appendChild(labelElement);

      const controls = documentObject.createElement('span');
      controls.className = 'settings-order-controls';
      [['Naikkan', -1], ['Turunkan', 1]].forEach(([title, offset], directionIndex) => {
        const button = documentObject.createElement('button');
        button.type = 'button';
        button.className = 'settings-order-button';
        button.innerHTML = directionIndex === 0
          ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 12 5-5 5 5"></path></svg>'
          : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 8 5 5 5-5"></path></svg>';
        button.title = `${title} ${label}`;
        button.setAttribute('aria-label', `${title} ${label}`);
        button.disabled = directionIndex === 0 ? index === 0 : index === order.length - 1;
        button.addEventListener('click', () => moveNavItem(route, offset));
        controls.appendChild(button);
      });
      item.appendChild(controls);
      sidebarList.appendChild(item);
    });
  }

  function saveOrderFromList() {
    const order = Array.from(sidebarList.children).map((item) => item.dataset.route);
    state.values.sidebar_order = JSON.stringify(order);
    saveLocalSettings();
    applySidebarSettings();
    renderSidebarSettings();
    markSettingsChanged();
  }

  function moveNavItem(route, offset) {
    const order = safeOrder(state.values.sidebar_order);
    const index = order.indexOf(route);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    state.values.sidebar_order = JSON.stringify(order);
    saveLocalSettings();
    applySidebarSettings();
    renderSidebarSettings();
    markSettingsChanged();
  }

  function normalizeRemoteSettings(records) {
    const values = {};
    (Array.isArray(records) ? records : []).forEach((record) => {
      if (!record || !knownIds.includes(String(record.id))) return;
      values[String(record.id)] = String(record.value == null ? '' : record.value);
    });
    return values;
  }

  function mergeSettings(remote) {
    const local = readLocalSettings();
    const defaults = defaultValues();
    if (!local) {
      state = { values: { ...defaults, ...remote }, synced: { ...remote } };
      return { initializeRemote: Object.keys(defaults).some((id) => !Object.prototype.hasOwnProperty.call(remote, id)) };
    }

    const values = { ...defaults, ...local.values };
    const synced = { ...local.synced };
    knownIds.forEach((id) => {
      const hasLocal = Object.prototype.hasOwnProperty.call(local.values, id);
      const hasRemote = Object.prototype.hasOwnProperty.call(remote, id);
      const localChanged = hasLocal && local.values[id] !== local.synced[id];
      const remoteChanged = hasRemote && remote[id] !== local.synced[id];
      if (!localChanged && (remoteChanged || hasRemote)) {
        values[id] = remote[id];
      }
      if (hasRemote) synced[id] = remote[id];
    });
    state = { values, synced };
    return { initializeRemote: false };
  }

  function queueServerSync(delay) {
    windowObject.clearTimeout(syncTimer);
    syncTimer = windowObject.setTimeout(() => {
      syncQueue = syncQueue.then(runServerSync).catch(() => {});
    }, delay == null ? 450 : delay);
  }

  async function runServerSync() {
    if (!state || !windowObject.DuitAuth || !windowObject.DuitAuth.getSessionToken()) return;
    const changes = knownIds
      .filter((id) => state.values[id] !== state.synced[id])
      .map((id) => ({ id, value: state.values[id] }));
    if (!changes.length) {
      isSaving = false;
      updateSaveButtonState();
      setStatus('');
      return;
    }
    isSaving = true;
    updateSaveButtonState();
    setStatus('');
    const token = windowObject.DuitAuth.getSessionToken();
    try {
      const result = await windowObject.DuitAuth.callServer('updateUserSettings', { token, settings: JSON.stringify(changes) });
      if (!result || !result.success) throw new Error(result && result.message || 'Pengaturan belum tersimpan.');
      changes.forEach(({ id, value }) => {
        if (state.values[id] === value) state.synced[id] = value;
      });
      saveLocalSettings();
      isSaving = false;
      saveConfirmed = !hasUnsavedChanges();
      updateSaveButtonState();
      setStatus(hasUnsavedChanges() ? 'Ada perubahan lain yang belum disimpan.' : '');
    } catch (error) {
      isSaving = false;
      updateSaveButtonState();
      setStatus('Perubahan tersimpan di perangkat, tetapi gagal dikirim. Tekan Simpan untuk mencoba lagi.', true);
    }
  }

  function updateSetting(id, value) {
    if (!state || !knownIds.includes(id) || state.values[id] === value) return;
    state.values[id] = value;
    if (id === 'theme') selectedThemeGroup = getThemeGroup(normalizeTheme(value));
    saveLocalSettings();
    applySettings();
    markSettingsChanged();
  }

  function openModal() {
    if (!settingsModal) return;
    settingsModal.hidden = false;
    documentObject.body.classList.add('modal-open');
    closeSettings?.focus();
  }

  function closeModal() {
    if (!settingsModal) return;
    settingsModal.hidden = true;
    documentObject.body.classList.remove('modal-open');
    settingsToggle?.focus();
  }

  function openResetConfirmation() {
    if (!resetModal || isResetting) return;
    if (resetStatus) {
      resetStatus.textContent = '';
      resetStatus.classList.remove('is-error');
    }
    resetModal.hidden = false;
    confirmResetButton?.focus();
  }

  function closeResetConfirmation() {
    if (!resetModal || isResetting) return;
    resetModal.hidden = true;
    openResetButton?.focus();
  }

  function removeResetLocalData(userId) {
    if (!userId) return;
    try {
      const cachePrefix = `duit_cache_v1_${userId}_`;
      ['transaction', 'transfer', 'income', 'expense', 'debt', 'debt_payment', 'saving', 'saving_deposit']
        .forEach((page) => windowObject.localStorage.removeItem(`${cachePrefix}${page}`));
      windowObject.localStorage.removeItem(`duit_snapshot_old_v1_${userId}`);
      windowObject.localStorage.removeItem(`duit_snapshot_new_v1_${userId}`);
      windowObject.localStorage.removeItem(`duit_last_sync_${userId}`);
    } catch (error) {
      // Data has already been reset on the server; a reload will fetch a fresh copy.
    }
  }

  async function confirmResetTransactions() {
    if (isResetting || !confirmResetButton) return;
    const userId = currentUserId || String(windowObject.localStorage.getItem('duit_current_user_id') || '');
    const token = windowObject.DuitAuth && windowObject.DuitAuth.getSessionToken();
    if (!token) {
      if (resetStatus) {
        resetStatus.textContent = 'Sesi Anda tidak ditemukan. Silakan masuk kembali.';
        resetStatus.classList.add('is-error');
      }
      return;
    }

    isResetting = true;
    confirmResetButton.disabled = true;
    confirmResetButton.textContent = 'Sedang mereset...';
    if (cancelResetButton) cancelResetButton.disabled = true;
    if (closeResetButton) closeResetButton.disabled = true;
    if (resetStatus) {
      resetStatus.textContent = '';
      resetStatus.classList.remove('is-error');
    }

    try {
      const result = await windowObject.DuitAuth.callServer('resetUserTransactions', { token });
      if (!result || !result.success) throw new Error(result && result.message || 'Reset data gagal. Coba lagi.');
      removeResetLocalData(userId);
      if (resetStatus) resetStatus.textContent = 'Semua data transaksi berhasil direset.';
      confirmResetButton.textContent = 'Data direset';
      windowObject.setTimeout(() => windowObject.location.reload(), 900);
    } catch (error) {
      isResetting = false;
      confirmResetButton.disabled = false;
      confirmResetButton.textContent = 'Reset data saya';
      if (cancelResetButton) cancelResetButton.disabled = false;
      if (closeResetButton) closeResetButton.disabled = false;
      if (resetStatus) {
        resetStatus.textContent = error.message || 'Reset data gagal. Coba lagi.';
        resetStatus.classList.add('is-error');
      }
    }
  }

  function cancelSettingsChanges() {
    if (!state || isSaving || !hasUnsavedChanges()) return;
    const defaults = defaultValues();
    knownIds.forEach((id) => {
      const baseline = Object.prototype.hasOwnProperty.call(state.synced, id) ? state.synced[id] : defaults[id];
      state.values[id] = baseline;
      if (!Object.prototype.hasOwnProperty.call(state.synced, id)) state.synced[id] = baseline;
    });
    saveConfirmed = false;
    saveLocalSettings();
    applySettings();
    updateSaveButtonState();
    setStatus('');
  }

  async function initializeForCurrentUser() {
    const userId = String((windowObject.DuitCurrentUser && windowObject.DuitCurrentUser.id) || windowObject.localStorage.getItem('duit_current_user_id') || '');
    if (!userId || userId === currentUserId) return;
    currentUserId = userId;
    const cached = readLocalSettings();
    state = cached || { values: defaultValues(), synced: {} };
    applySettings();
    setStatus(cached ? 'Memeriksa pengaturan...' : 'Memuat pengaturan...');

    try {
      const token = windowObject.DuitAuth.getSessionToken();
      const result = await windowObject.DuitAuth.callServer('getUserSettings', { token });
      if (!result || !result.success) throw new Error(result && result.message || 'Pengaturan belum dapat dimuat.');
      const mergeResult = mergeSettings(normalizeRemoteSettings(result.settings));
      applySettings();
      saveLocalSettings();
      updateSaveButtonState();
      if (mergeResult.initializeRemote) {
        setStatus('');
        queueServerSync(0);
      } else {
        setStatus(hasUnsavedChanges() ? 'Ada perubahan yang belum disimpan.' : '');
      }
    } catch (error) {
      applySettings();
      saveLocalSettings();
      updateSaveButtonState();
      setStatus(cached ? 'Pengaturan lokal digunakan. Tekan Simpan untuk mencoba sinkronisasi.' : 'Pengaturan awal disimpan di perangkat. Tekan Simpan untuk menyinkronkan pengaturan akun.', true);
    }
  }

  settingsToggle?.addEventListener('click', openModal);
  openResetButton?.addEventListener('click', openResetConfirmation);
  closeResetButton?.addEventListener('click', closeResetConfirmation);
  cancelResetButton?.addEventListener('click', closeResetConfirmation);
  confirmResetButton?.addEventListener('click', confirmResetTransactions);
  resetModal?.addEventListener('click', (event) => { if (event.target === resetModal) closeResetConfirmation(); });
  saveSettingsButton?.addEventListener('click', () => {
    if (!hasUnsavedChanges() || isSaving) return;
    windowObject.clearTimeout(syncTimer);
    syncQueue = syncQueue.then(runServerSync).catch(() => {});
  });
  cancelSettingsButton?.addEventListener('click', cancelSettingsChanges);
  closeSettings?.addEventListener('click', closeModal);
  settingsModal?.addEventListener('click', (event) => { if (event.target === settingsModal) closeModal(); });
  documentObject.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (resetModal && !resetModal.hidden) closeResetConfirmation();
    else if (settingsModal && !settingsModal.hidden) closeModal();
  });

  themeGroupControl?.addEventListener('change', () => {
    if (!Object.prototype.hasOwnProperty.call(themeGroups, themeGroupControl.value)) return;
    selectedThemeGroup = themeGroupControl.value;
    renderThemeOptions(normalizeTheme(state && state.values.theme));
  });
  themeControl?.addEventListener('change', () => {
    if (themeNames.includes(themeControl.value)) updateSetting('theme', themeControl.value);
  });
  fontFamilyControl?.addEventListener('change', () => updateSetting('font_family', fontFamilyControl.value));
  languageControl?.addEventListener('change', () => updateSetting('language', languageControl.value));
  fontSizeControl?.addEventListener('input', () => updateSetting('font_size', fontSizeControl.value));

  sidebarList?.addEventListener('dragstart', (event) => {
    const item = event.target.closest('.settings-sidebar-item');
    if (!item) return;
    dragSource = item;
    item.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.dataset.route);
  });
  sidebarList?.addEventListener('dragover', (event) => {
    event.preventDefault();
    const target = event.target.closest('.settings-sidebar-item');
    if (!dragSource || !target || target === dragSource) return;
    const after = event.clientY > target.getBoundingClientRect().top + target.offsetHeight / 2;
    sidebarList.insertBefore(dragSource, after ? target.nextSibling : target);
  });
  sidebarList?.addEventListener('drop', (event) => { event.preventDefault(); if (dragSource) saveOrderFromList(); });
  sidebarList?.addEventListener('dragend', () => {
    dragSource?.classList.remove('is-dragging');
    dragSource = null;
  });

  documentObject.addEventListener('duit:auth-ready', initializeForCurrentUser);
  const textScaleObserver = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === 1) scaleText(node, currentScale);
      else if (node.nodeType === 3 && node.parentElement) scaleText(node.parentElement, currentScale);
    }));
  });
  const appShell = documentObject.querySelector('.app-shell');
  if (appShell) textScaleObserver.observe(appShell, { childList: true, subtree: true });
  if (windowObject.DuitCurrentUser) initializeForCurrentUser();
})(window, document);
