const sidebar = document.querySelector('#sidebar');
const menuToggle = document.querySelector('#menuToggle');
const closeSidebar = document.querySelector('#closeSidebar');
const overlay = document.querySelector('#sidebarOverlay');
const navItems = document.querySelectorAll('.nav-item');
const toast = document.querySelector('#toast');

function updateHeaderTitle(activeItem) {
  const headerTitle = document.querySelector('.breadcrumb strong');
  const label = activeItem && activeItem.querySelector('span');
  if (headerTitle && label) headerTitle.textContent = label.textContent.trim();
}

// State awal aplikasi selalu berada di halaman Dasbor jika belum ada
// halaman keuangan yang dipilih.
const financeHashes = ['dasbor', 'transaksi', 'pemasukan', 'pengeluaran', 'dompet', 'transfer', 'utang', 'tabungan', 'kategori', 'laporan'];
if (!financeHashes.includes(window.location.hash.slice(1))) {
  window.history.replaceState(null, '', '#dasbor');
  const dashboardNavItem = document.querySelector('.nav-item[href="#dasbor"]');
  navItems.forEach((item) => {
    item.classList.toggle('active', item === dashboardNavItem);
    if (item === dashboardNavItem) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

const initialActiveHash = window.location.hash || '#dasbor';
const initialActiveItem = Array.from(navItems).find((item) => item.getAttribute('href') === initialActiveHash);
if (initialActiveItem) {
  navItems.forEach((item) => {
    item.classList.toggle('active', item === initialActiveItem);
    if (item === initialActiveItem) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  updateHeaderTitle(initialActiveItem);
}

function setSidebar(open) {
  const isMobile = window.innerWidth <= 700;
  sidebar.classList.toggle('is-open', isMobile && open);
  sidebar.classList.toggle('is-collapsed', !isMobile && !open);
  overlay.classList.toggle('is-visible', isMobile && open);
  menuToggle.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-lock', isMobile && open);
}

setSidebar(window.innerWidth > 700);

menuToggle.addEventListener('click', () => {
  const isMobile = window.innerWidth <= 700;
  const isOpen = isMobile
    ? sidebar.classList.contains('is-open')
    : !sidebar.classList.contains('is-collapsed');
  setSidebar(!isOpen);
});
if (closeSidebar) {
  closeSidebar.addEventListener('click', (event) => {
    event.preventDefault();
    setSidebar(false);
  });
}
overlay.addEventListener('click', () => setSidebar(false));

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    navItems.forEach((link) => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    });
    item.classList.add('active');
    item.setAttribute('aria-current', 'page');
    updateHeaderTitle(item);
    if (window.innerWidth <= 700) setSidebar(false);
  });
});

window.addEventListener('hashchange', () => {
  const activeItem = Array.from(navItems).find((item) => item.getAttribute('href') === window.location.hash);
  if (activeItem) updateHeaderTitle(activeItem);
});

const refreshDataButton = document.querySelector('#refreshDataButton');
if (refreshDataButton) {
  refreshDataButton.addEventListener('click', () => {
    refreshDataButton.classList.add('is-loading');
    document.dispatchEvent(new Event('duit:refresh-data'));
  });
  document.addEventListener('duit:data-loading', () => {
    refreshDataButton.classList.add('is-loading');
    refreshDataButton.disabled = true;
  });
  document.addEventListener('duit:data-loaded', () => {
    refreshDataButton.classList.remove('is-loading');
    refreshDataButton.disabled = false;
  });
}

const addTransaction = document.querySelector('#addTransaction');
let toastTimer;
if (addTransaction) {
  addTransaction.addEventListener('click', () => {
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  });
}

window.addEventListener('resize', () => {
  setSidebar(window.innerWidth > 700);
});

const profileMenuToggle = document.querySelector('#profileMenuToggle');
const profileMenu = document.querySelector('#profileMenu');
const profileMenuContainer = document.querySelector('#topbarProfileMenu');

function closeProfileMenu() {
  profileMenu.hidden = true;
  profileMenuToggle.setAttribute('aria-expanded', 'false');
}

profileMenuToggle.addEventListener('click', () => {
  const isOpen = !profileMenu.hidden;
  profileMenu.hidden = isOpen;
  profileMenuToggle.setAttribute('aria-expanded', String(!isOpen));
});

document.addEventListener('click', (event) => {
  if (!profileMenuContainer.contains(event.target)) closeProfileMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !profileMenu.hidden) {
    closeProfileMenu();
    profileMenuToggle.focus();
  }
});

document.querySelector('#openProfileSettings').addEventListener('click', () => {
  closeProfileMenu();
});

document.querySelectorAll('.logout-button').forEach((logoutButton) => {
  logoutButton.addEventListener('click', () => {
    document.querySelectorAll('.logout-button').forEach((button) => {
      button.disabled = true;
    });
    closeProfileMenu();
    const token = DuitAuth.getSessionToken();
    DuitAuth.clearSessionCookie();
    try {
      Object.keys(window.localStorage)
        .filter((key) => key.indexOf('duit_cache_v1_') === 0 || key.indexOf('duit_last_sync_') === 0 || key.indexOf('duit_profile_photo_v1_') === 0 || key === 'duit_current_user_id')
        .forEach((key) => window.localStorage.removeItem(key));
    } catch (storageError) {
      console.warn('Cache lokal tidak dapat dibersihkan.', storageError);
    }

    const revokeSession = token
      ? DuitAuth.callServer('logoutUser', { token }).catch(() => null)
      : Promise.resolve();
    const navigationFallback = new Promise((resolve) => window.setTimeout(resolve, 1500));
    Promise.race([revokeSession, navigationFallback])
      .finally(() => window.location.replace('login.html'));
  });
});
