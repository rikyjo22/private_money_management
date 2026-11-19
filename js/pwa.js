(function registerDuitPwa(windowObject, navigatorObject) {
  if (!('serviceWorker' in navigatorObject) || windowObject.location.protocol === 'file:') return;
  windowObject.addEventListener('load', () => {
    navigatorObject.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // PWA hanya aktif pada HTTPS atau localhost.
    });
  });
})(window, navigator);
