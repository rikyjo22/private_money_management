// Isi URL Web App Apps Script jika halaman dijalankan di luar Apps Script.
window.DUIT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztsMlCsrvJLIWm0MRkJjl941-Ce3bjdeH3sK7Nu2Dt6K8jaBUrkapLXe4R2iXaloe_/exec';

(function setupDuitAuth(windowObject, documentObject) {
  const COOKIE_NAME = 'duit_session';
  const APPS_SCRIPT_URL = windowObject.DUIT_APPS_SCRIPT_URL || '';

  function getCookie(name) {
    const prefix = `${name}=`;
    const cookie = documentObject.cookie.split('; ').find((item) => item.startsWith(prefix));
    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
  }

  function setSessionCookie(token, remember) {
    const maxAge = remember ? 60 * 60 * 24 * 30 : '';
    const maxAgePart = maxAge ? `; Max-Age=${maxAge}` : '';
    const securePart = windowObject.location.protocol === 'https:' ? '; Secure' : '';
    documentObject.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${maxAgePart}${securePart}`;
  }

  function clearSessionCookie() {
    const securePart = windowObject.location.protocol === 'https:' ? '; Secure' : '';
    documentObject.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${securePart}`;
  }

  function getSessionToken() {
    return getCookie(COOKIE_NAME);
  }

  function callServer(action, payload = {}) {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        const runner = google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject);
        if (action === 'registerUser') runner.registerUser(payload);
        if (action === 'loginUser') runner.loginUser(payload);
        if (action === 'validateSession') runner.validateSession(payload);
        if (action === 'getUserProfile') runner.getUserProfile(payload);
        if (action === 'updateUserProfile') runner.updateUserProfile(payload);
        if (action === 'getDashboardData') runner.getDashboardData(payload);
        if (action === 'getIncomeData') runner.getIncomeData(payload);
        if (action === 'getFinancePageData') runner.getFinancePageData(payload);
        if (action === 'syncUserData') runner.syncUserData(payload);
        if (action === 'getUserSettings') runner.getUserSettings(payload);
        if (action === 'updateUserSettings') runner.updateUserSettings(payload);
        if (action === 'resetUserTransactions') runner.resetUserTransactions(payload);
        if (action === 'logoutUser') runner.logoutUser(payload);
        return;
      }

      if (!APPS_SCRIPT_URL) {
        reject(new Error('URL Web App Apps Script belum diisi.'));
        return;
      }

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: new URLSearchParams({ action, ...payload }),
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Server mengembalikan status ${response.status}.`);
          return response.json();
        })
        .then(resolve)
        .catch(reject);
    });
  }

  windowObject.DuitAuth = {
    callServer,
    clearSessionCookie,
    getSessionToken,
    setSessionCookie,
  };
})(window, document);
