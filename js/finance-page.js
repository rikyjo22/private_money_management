(function loadFinancePage(windowObject, documentObject) {
  const auth = windowObject.DuitAuth;
  if (!auth) return;

  const configs = {
    transaksi: { key: 'transaction', title: 'Transaksi', description: 'Daftar pemasukan, pengeluaran, transfer, utang, dan tabunganmu.', summary: 'Total transaksi', titleHeader: 'Keterangan', subtitleHeader: 'Jenis' },
    kategori: { key: 'category', title: 'Kategori', description: 'Daftar kategori transaksi milikmu.', summary: 'Total kategori', titleHeader: 'Nama kategori', subtitleHeader: 'Tipe' },
    pemasukan: { key: 'income', title: 'Pemasukan', description: 'Daftar pemasukan yang tercatat pada akunmu.', summary: 'Total pemasukan', titleHeader: 'Sumber pemasukan', subtitleHeader: 'Kategori' },
    pengeluaran: { key: 'expense', title: 'Pengeluaran', description: 'Daftar pengeluaran yang tercatat pada akunmu.', summary: 'Total pengeluaran', titleHeader: 'Sumber pengeluaran', subtitleHeader: 'Kategori' },
    dompet: { key: 'wallet', title: 'Dompet/Akun', description: 'Daftar akun dan saldo dompetmu.', summary: 'Total saldo dompet', titleHeader: 'Nama dompet', subtitleHeader: 'Jenis akun' },
    transfer: { key: 'transfer', title: 'Transfer', description: 'Riwayat transfer antar akun.', summary: 'Total transfer', titleHeader: 'Keterangan transfer', subtitleHeader: 'Akun tujuan' },
    utang: { key: 'debt', title: 'Utang', description: 'Daftar utang dan sisa kewajibanmu.', summary: 'Total sisa utang', titleHeader: 'Nama pemberi utang', subtitleHeader: 'Status' },
    tabungan: { key: 'saving', title: 'Tabungan', description: 'Progress target tabunganmu.', summary: 'Total tabungan berjalan', titleHeader: 'Target tabungan', subtitleHeader: 'Status' },
  };
  const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  const locale = () => windowObject.DuitI18n ? windowObject.DuitI18n.locale() : 'id-ID';
  const money = (value) => currency.format(Number(value) || 0).replace(/\u00a0/g, ' ');
  const escapeHtml = (value) => String(value == null ? '' : value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) || date.getTime() === 0 ? '-' : new Intl.DateTimeFormat(locale(), { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };
  const dateInputValue = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    const pad = (number) => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  const timeInputValue = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    const pad = (number) => String(number).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  const formatHistoryTimestamp = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (number) => String(number).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  const appendHistoryLog = (existing, action, value) => {
    const entry = `${action}(${formatHistoryTimestamp(value || new Date())})`;
    return String(existing || '').trim() ? `${String(existing).trim()}, ${entry}` : entry;
  };
  const capitalizeFirst = (value) => {
    const text = String(value || '-');
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  const categoryTypeLabel = (value) => ({ income: 'Pemasukan', expense: 'Pengeluaran', transfer: 'Transfer', debt_payment: 'Pembayaran utang', debt_receive: 'Penerimaan utang', saving: 'Tabungan' }[String(value || '').toLowerCase()] || capitalizeFirst(value));
  const pageContainer = () => documentObject.querySelector('#pemasukan');
  const setText = (selector, text) => { const element = documentObject.querySelector(selector); if (element) element.textContent = text; };
  const cachePrefix = 'duit_cache_v1_';
  const syncTimePrefix = 'duit_last_sync_';
  const snapshotOldPrefix = 'duit_snapshot_old_v1_';
  const snapshotNewPrefix = 'duit_snapshot_new_v1_';

  function currentUserId() {
    try {
      return String((windowObject.DuitCurrentUser && windowObject.DuitCurrentUser.id)
        || windowObject.localStorage.getItem('duit_current_user_id') || '');
    } catch (error) {
      return String((windowObject.DuitCurrentUser && windowObject.DuitCurrentUser.id) || '');
    }
  }

  function renderLastUpdated(value) {
    const button = documentObject.querySelector('#refreshDataButton');
    if (!button) return;
    if (!value) {
      button.title = 'Belum diperbarui';
      return;
    }
    const date = new Date(value);
    button.title = Number.isNaN(date.getTime())
      ? 'Belum diperbarui'
      : `${windowObject.DuitI18n?.getLanguage() === 'en' ? 'Last synced' : 'Diperbarui'} ${new Intl.DateTimeFormat(locale(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)}`;
  }

  function restoreLastUpdated() {
    const userId = currentUserId();
    if (!userId) return;
    try { renderLastUpdated(windowObject.localStorage.getItem(`${syncTimePrefix}${userId}`)); } catch (error) { /* Cache waktu tidak tersedia. */ }
  }

  function markLastUpdated() {
    const value = new Date().toISOString();
    const userId = currentUserId();
    if (userId) {
      try { windowObject.localStorage.setItem(`${syncTimePrefix}${userId}`, value); } catch (error) { /* Abaikan jika storage penuh. */ }
    }
    renderLastUpdated(value);
  }

  function readCache(page) {
    const userId = currentUserId();
    if (!userId) return null;
    try {
      const value = windowObject.localStorage.getItem(`${cachePrefix}${userId}_${page}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function snapshotData(result) {
    const source = result || {};
    return {
      items: Array.isArray(source.items) ? source.items : [],
      deleted_ids: Array.isArray(source.deleted_ids) ? source.deleted_ids : [],
      deleted_records: source.deleted_records && typeof source.deleted_records === 'object' ? source.deleted_records : {},
    };
  }

  function snapshotKey(prefix) {
    const userId = currentUserId();
    return userId ? `${prefix}${userId}` : '';
  }

  function readSnapshot(prefix) {
    const key = snapshotKey(prefix);
    if (!key) return null;
    try {
      const value = windowObject.localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function writeSnapshot(prefix, data) {
    const key = snapshotKey(prefix);
    if (!key) return;
    try { windowObject.localStorage.setItem(key, JSON.stringify(data || {})); } catch (error) { /* Abaikan jika storage penuh. */ }
  }

  function collectSnapshotFromCaches() {
    const local = collectLocalData();
    const snapshot = {};
    Object.keys(local).forEach((page) => { snapshot[page] = snapshotData(local[page]); });
    return snapshot;
  }

  function canonicalValue(value) {
    if (Array.isArray(value)) return value.map(canonicalValue);
    if (value && typeof value === 'object') return Object.keys(value).sort().reduce((result, key) => { result[key] = canonicalValue(value[key]); return result; }, {});
    return value;
  }

  function itemsChanged(oldItem, newItem) {
    return JSON.stringify(canonicalValue(oldItem || null)) !== JSON.stringify(canonicalValue(newItem || null));
  }

  function buildChangedLocalData() {
    const oldSnapshot = readSnapshot(snapshotOldPrefix);
    const newSnapshot = readSnapshot(snapshotNewPrefix);
    if (!oldSnapshot || !newSnapshot) return null;
    const changed = {};
    const pages = new Set([...Object.keys(oldSnapshot), ...Object.keys(newSnapshot)]);
    pages.forEach((page) => {
      const oldPage = oldSnapshot[page] || snapshotData({});
      const newPage = newSnapshot[page] || snapshotData({});
      const oldItems = Array.isArray(oldPage.items) ? oldPage.items : [];
      const newItems = Array.isArray(newPage.items) ? newPage.items : [];
      const oldById = new Map(oldItems.map((item) => [String(item.id || ''), item]));
      const changedItems = newItems.filter((item) => {
        const id = String(item.id || '');
        return !oldById.has(id) || itemsChanged(oldById.get(id), item);
      });
      const oldDeleted = new Set((oldPage.deleted_ids || []).map((id) => String(id)));
      const newDeleted = (newPage.deleted_ids || []).map((id) => String(id));
      const deletedIds = newDeleted.filter((id) => !oldDeleted.has(id));
      const orderSensitive = page === 'wallet' || page === 'category';
      if (orderSensitive && (changedItems.length || deletedIds.length)) {
        changed[page] = { ...newPage, items: newItems };
      } else if (changedItems.length || deletedIds.length) {
        changed[page] = { ...newPage, items: changedItems, deleted_ids: deletedIds };
      }
    });
    return changed;
  }

  function writeCache(page, result, options) {
    const userId = String((result.user && result.user.id) || currentUserId());
    if (!userId) return;
    try {
      windowObject.localStorage.setItem(`${cachePrefix}${userId}_${page}`, JSON.stringify({ ...result, cached_at: new Date().toISOString() }));
      windowObject.localStorage.setItem('duit_current_user_id', userId);
      windowObject.DuitCurrentUser = result.user || windowObject.DuitCurrentUser;
      if (!(options && options.fromServer) && readSnapshot(snapshotOldPrefix)) {
        const currentNew = readSnapshot(snapshotNewPrefix) || {};
        currentNew[page] = snapshotData(result);
        writeSnapshot(snapshotNewPrefix, currentNew);
      }
      restoreLastUpdated();
    } catch (error) {
      console.warn('Data lokal tidak dapat disimpan.', error);
    }
  }

  function collectLocalData() {
    const userId = currentUserId();
    const result = {};
    if (!userId) return result;
    try {
      const prefix = `${cachePrefix}${userId}_`;
      Object.keys(windowObject.localStorage).filter((key) => key.indexOf(prefix) === 0).forEach((key) => {
        const page = key.slice(prefix.length);
        try { result[page] = JSON.parse(windowObject.localStorage.getItem(key)); } catch (error) { /* Abaikan cache rusak. */ }
      });
    } catch (error) {
      console.warn('Data lokal tidak dapat dibaca.', error);
    }
    return result;
  }

  function syncWithSpreadsheet(token, localData, changedOnly) {
    return auth.callServer('syncUserData', {
      token,
      local_data: JSON.stringify(localData || collectLocalData()),
      changed_only: changedOnly ? 'true' : 'false',
    });
  }

  let editingAccountId = '';
  let editingCategoryId = '';
  let editingTransactionId = '';
  let pendingTransactionDelete = null;
  let editingTransferId = '';
  let pendingTransferDelete = null;
  let pendingAccountDelete = null;
  let editingDebtId = '';
  let pendingDebtDelete = null;
  let editingDebtPaymentId = '';
  let pendingDebtPaymentDelete = null;
  let editingSavingId = '';
  let pendingSavingDelete = null;
  let editingSavingDepositId = '';
  let pendingSavingDepositDelete = null;
  let dashboardWalletModalBound = false;
  let dashboardBreakdownModalBound = false;
  let refreshInProgress = false;

  function refreshPageCache(page, token) {
    const config = Object.values(configs).find((item) => item.key === page) || (page === 'debt_payment' || page === 'saving_deposit' ? { key: page } : null);
    if (!config) return Promise.resolve();
    return auth.callServer('getFinancePageData', { token, page: config.key }).then((result) => {
      if (result && result.success) writeCache(config.key, result, { fromServer: true });
    });
  }

  function refreshAllCaches(token) {
    const financePages = Object.values(configs)
      .filter((config) => !['income', 'expense'].includes(config.key) || readCache(config.key))
      .map((config) => refreshPageCache(config.key, token));
    if (readCache('debt_payment')) financePages.push(refreshPageCache('debt_payment', token));
    if (readCache('saving_deposit')) financePages.push(refreshPageCache('saving_deposit', token));
    return Promise.all(financePages);
  }

  function refreshFromSpreadsheet() {
    const token = auth.getSessionToken();
    if (!token || refreshInProgress) return;
    refreshInProgress = true;
    documentObject.dispatchEvent(new Event('duit:data-loading'));
    const hasBaseline = Boolean(readSnapshot(snapshotOldPrefix) && readSnapshot(snapshotNewPrefix));
    const changedData = hasBaseline ? buildChangedLocalData() : null;
    const changedPages = changedData ? Object.keys(changedData) : [];
    const syncPromise = !hasBaseline || changedPages.length
      ? syncWithSpreadsheet(token, hasBaseline ? changedData : collectLocalData(), hasBaseline)
      : Promise.resolve({ success: true, appended: [], updated: [], deleted: [], pulled: [] });
    syncPromise.then((result) => {
      if (!result || !result.success) throw new Error(result && result.message || 'Sinkronisasi gagal.');
      return refreshAllCaches(token).then(() => {
        const synchronizedSnapshot = collectSnapshotFromCaches();
        writeSnapshot(snapshotOldPrefix, synchronizedSnapshot);
        writeSnapshot(snapshotNewPrefix, synchronizedSnapshot);
        markLastUpdated();
        return result;
      });
    }).then((result) => {
      if (!result || !result.success) throw new Error(result && result.message || 'Sinkronisasi gagal.');
      load(false);
      documentObject.dispatchEvent(new Event('duit:data-loaded'));
    }).catch((error) => {
      documentObject.dispatchEvent(new Event('duit:data-loaded'));
      windowObject.alert(error.message || 'Sinkronisasi gagal.');
    }).finally(() => {
      refreshInProgress = false;
      documentObject.dispatchEvent(new Event('duit:data-loaded'));
    });
  }

  function updateActiveMenu() {
    const activeHash = windowObject.location.hash || '#dasbor';
    const activeItem = Array.from(documentObject.querySelectorAll('.nav-item')).find((item) => item.getAttribute('href') === activeHash);
    if (!activeItem) return;
    documentObject.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item === activeItem);
      if (item === activeItem) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  }

  function financeShell(config) {
    const compactPage = config.key === 'wallet' || config.key === 'income' || config.key === 'transaction' || config.key === 'category';
    const walletPage = config.key === 'wallet';
    const categoryPage = config.key === 'category';
    const intro = compactPage ? '' : `<section class="welcome-row income-welcome"><div><p class="eyebrow">Catatan keuanganmu</p><h1 id="financeHeading">${config.title}</h1><p class="muted" id="financeDescription"></p></div><button class="primary-button" id="addFinance"><svg><use href="#icon-plus"></use></svg> Tambah data</button></section>`;
    const summary = compactPage ? '' : `<section class="overview-grid income-overview" aria-label="Ringkasan"><article class="balance-card income-total-card"><div class="card-heading"><span id="financeSummaryLabel"></span></div><div class="balance-value" id="financeTotal">Rp 0</div><div class="balance-meta"><span id="financeCount">0 data</span></div></article></section>`;
    const addButton = walletPage ? '<div class="wallet-actions"><button class="primary-button" id="addFinance"><svg><use href="#icon-plus"></use></svg> Tambah akun</button></div>' : (categoryPage ? '<div class="wallet-actions"><button class="primary-button" id="addFinance"><svg><use href="#icon-plus"></use></svg> Tambah kategori</button></div>' : ((config.key === 'income' || config.key === 'transaction') ? `<div class="wallet-actions"><button class="primary-button" id="addFinance"><svg><use href="#icon-plus"></use></svg> ${config.key === 'transaction' ? 'Tambah transaksi' : 'Tambah pemasukan'}</button></div>` : ''));
    const transactionPage = config.key === 'transaction';
    const tableHead = walletPage ? '<tr><th>Nama akun</th><th>Tipe</th><th class="amount-column">Saldo</th><th class="account-actions-header">Aksi</th></tr>' : (categoryPage ? '<tr><th>Nama kategori</th><th>Tipe</th><th class="account-actions-header">Aksi</th></tr>' : (transactionPage ? '<tr><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th class="amount-column">Jumlah</th><th>Keterangan</th><th class="account-actions-header">Aksi</th></tr>' : `<tr><th id="financeTitleHeader">${config.titleHeader}</th><th id="financeSubtitleHeader">${config.subtitleHeader}</th><th>Tanggal</th><th class="amount-column">Jumlah</th></tr>`));
    const tableColumns = categoryPage ? 3 : (transactionPage ? 6 : 4);
    const initialHeading = config.key === 'wallet' ? 'DAFTAR AKUN' : (config.key === 'income' ? 'DAFTAR PEMASUKAN' : (config.key === 'transaction' ? 'Daftar Transaksi' : (categoryPage ? 'DAFTAR KATEGORI' : `Daftar ${config.title.toLowerCase()}`)));
    if (walletPage) return `${intro}${summary}<section class="panel wallet-panel wallet-card-panel wallet-screen"><div class="panel-heading"><div><h2 id="financeListHeading">${initialHeading}</h2><p class="muted" id="financeSourceLabel" hidden></p></div>${addButton}</div><div id="financeList" class="wallet-card-grid"><p class="muted wallet-empty">Memuat data...</p></div></section>`;
    return `${intro}${summary}<section class="panel income-panel${walletPage ? ' wallet-panel' : ''}${categoryPage ? ' category-panel category-screen' : ''}${compactPage && !walletPage ? ' income-list-panel' : ''}${transactionPage ? ' transaction-screen' : ''}"><div class="panel-heading"><div><h2 id="financeListHeading">${initialHeading}</h2><p class="muted" id="financeSourceLabel" hidden></p></div>${addButton}</div><div class="income-table-wrap"><table class="income-table${walletPage ? ' wallet-table' : ''}${categoryPage ? ' category-table' : ''}${transactionPage ? ' transaction-table' : ''}${compactPage && !walletPage ? ' compact-finance-table' : ''}"><thead>${tableHead}</thead><tbody id="financeList"><tr><td colspan="${tableColumns}" class="income-empty">Memuat data...</td></tr></tbody></table></div></section>`;
  }

  function dashboardShell() {
    return '<section class="dashboard-screen"><div class="dashboard-card-grid"><div class="dashboard-today-grid"><button type="button" class="dashboard-summary-card dashboard-today-income-card" data-dashboard-today="income" aria-haspopup="dialog"><span class="dashboard-summary-label">Pemasukan hari ini</span><strong id="dashboardTodayIncomeTotal">Rp 0</strong></button><button type="button" class="dashboard-summary-card dashboard-today-expense-card" data-dashboard-today="expense" aria-haspopup="dialog"><span class="dashboard-summary-label">Pengeluaran hari ini</span><strong id="dashboardTodayExpenseTotal">Rp 0</strong></button></div><button type="button" class="primary-button dashboard-add-transaction" id="dashboardAddTransaction"><svg><use href="#icon-plus"></use></svg> Tambah transaksi</button><div class="dashboard-detail-grid"><section class="panel dashboard-detail-panel"><h2>Top 3 pemasukan terbesar hari ini</h2><div id="dashboardTopIncomeList" class="dashboard-ranking-list"></div></section><section class="panel dashboard-detail-panel"><h2>Top 3 pengeluaran terbesar hari ini</h2><div id="dashboardTopExpenseList" class="dashboard-ranking-list"></div></section><section class="panel dashboard-detail-panel"><h2>Progress utang</h2><div id="dashboardDebtProgress" class="dashboard-progress-list"></div></section><section class="panel dashboard-detail-panel"><h2>Progress tabungan</h2><div id="dashboardSavingProgress" class="dashboard-progress-list"></div></section></div></div></section>';
  }

  function dashboardTransactionItems() {
    const transactionCache = readCache('transaction');
    const incomeCache = readCache('income');
    const expenseCache = readCache('expense');
    const transferCache = readCache('transfer');
    const items = [
      ...(transactionCache && Array.isArray(transactionCache.items) ? transactionCache.items : []),
      ...(incomeCache && Array.isArray(incomeCache.items) ? incomeCache.items.map((item) => ({ ...item, type: item.type || 'income' })) : []),
      ...(expenseCache && Array.isArray(expenseCache.items) ? expenseCache.items.map((item) => ({ ...item, type: item.type || 'expense' })) : []),
      ...(transferCache && Array.isArray(transferCache.items) ? transferCache.items : []),
    ];
    const unique = new Map();
    items.forEach((item) => {
      if (String(item.status || 'active').toLowerCase() === 'deleted') return;
      const id = String(item.id || '');
      const key = id || `${item.date || ''}|${item.account_id || ''}|${item.amount || ''}|${item.note || item.title || ''}`;
      if (!unique.has(key)) unique.set(key, item);
    });
    return [...unique.values()];
  }

  function dashboardWalletBalances() {
    const walletCache = readCache('wallet');
    const wallets = walletCache && Array.isArray(walletCache.items) ? walletCache.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted') : [];
    const transactions = dashboardTransactionItems();
    const balances = new Map(wallets.map((wallet) => [String(wallet.id), Number(wallet.amount) || 0]));
    transactions.forEach((item) => {
      const type = dashboardTransactionType(item);
      const amount = Number(item.amount) || 0;
      const accountId = String(item.account_id || '');
      if (type === 'income' && balances.has(accountId)) balances.set(accountId, balances.get(accountId) + amount);
      if (type === 'expense' && balances.has(accountId)) balances.set(accountId, balances.get(accountId) - amount);
      if (type === 'transfer') {
        const fromId = String(item.from_account_id || item.account_id || '');
        const toId = String(item.to_account_id || '');
        if (balances.has(fromId)) balances.set(fromId, balances.get(fromId) - amount);
        if (balances.has(toId)) balances.set(toId, balances.get(toId) + amount);
      }
    });
    const currentWallets = wallets.map((wallet) => ({ ...wallet, current_balance: balances.get(String(wallet.id)) ?? (Number(wallet.amount) || 0) }));
    const total = wallets.reduce((sum, wallet) => sum + (Number(wallet.amount) || 0), 0) + transactions.reduce((sum, item) => {
      const type = dashboardTransactionType(item);
      const amount = Number(item.amount) || 0;
      return sum + (type === 'income' ? amount : type === 'expense' ? -amount : 0);
    }, 0);
    return { wallets: currentWallets, transactions, total };
  }

  function dashboardTransactionTypeLabel(item) {
    const type = String(item.type || item.transaction_type || item.subtitle || '').toLowerCase();
    if (['transfer', 'transfers', 'mutasi'].includes(type) || (item.from_account_id && item.to_account_id && !['income', 'expense'].includes(type))) return 'Transfer';
    return categoryTypeLabel(type || 'transaksi');
  }

  function dashboardTransactionType(item) {
    const type = String(item.type || item.transaction_type || item.subtitle || '').toLowerCase();
    if (['transfer', 'transfers', 'mutasi'].includes(type) || (item.from_account_id && item.to_account_id && !['income', 'expense'].includes(type))) return 'transfer';
    if (['income', 'pemasukan'].includes(type)) return 'income';
    if (['expense', 'pengeluaran'].includes(type)) return 'expense';
    return type;
  }

  function dashboardBreakdownItems(type) {
    return dashboardTransactionItems().filter((item) => dashboardTransactionType(item) === type);
  }

  function dashboardCategoryName(item) {
    const categoryCache = readCache('category');
    const categories = categoryCache && Array.isArray(categoryCache.items) ? categoryCache.items : [];
    const category = categories.find((entry) => String(entry.id || '') === String(item.category_id || ''));
    const fallback = String(item.category_name || item.category || item.subtitle || '');
    return String((category && category.title) || (['income', 'expense', 'pemasukan', 'pengeluaran'].includes(fallback.toLowerCase()) ? 'Tanpa kategori' : fallback) || 'Tanpa kategori');
  }

  function dashboardBreakdownTotal(type) {
    return dashboardBreakdownItems(type).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }

  function dashboardIsToday(value) {
    const date = new Date(value);
    const today = new Date();
    return !Number.isNaN(date.getTime()) && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  }

  function dashboardTodayTotal(type) {
    return dashboardBreakdownItems(type).filter((item) => dashboardIsToday(item.date)).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }

  function renderDashboardSummaryTotals() {
    setText('#dashboardIncomeTotal', money(dashboardBreakdownTotal('income')));
    setText('#dashboardExpenseTotal', money(dashboardBreakdownTotal('expense')));
    setText('#dashboardTodayIncomeTotal', money(dashboardTodayTotal('income')));
    setText('#dashboardTodayExpenseTotal', money(dashboardTodayTotal('expense')));
  }

  function renderDashboardRanking(type, selector) {
    const list = documentObject.querySelector(selector);
    if (!list) return;
    const items = dashboardBreakdownItems(type).filter((item) => dashboardIsToday(item.date)).sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)).slice(0, 3);
    list.innerHTML = items.length ? items.map((item, index) => `<div class="dashboard-ranking-row"><span class="dashboard-ranking-number">${index + 1}</span><div><strong>${escapeHtml(item.note || item.title || dashboardCategoryName(item))}</strong><small>${escapeHtml(dashboardCategoryName(item))} - ${escapeHtml(formatDate(item.date))}</small></div><b>${escapeHtml(money(item.amount))}</b></div>`).join('') : '<p class="muted dashboard-detail-empty">Belum ada transaksi hari ini.</p>';
  }

  function renderDashboardProgress() {
    const debtList = documentObject.querySelector('#dashboardDebtProgress');
    const savingList = documentObject.querySelector('#dashboardSavingProgress');
    const debtCache = readCache('debt');
    const savingCache = readCache('saving');
    const debts = debtCache && Array.isArray(debtCache.items) ? debtCache.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted') : [];
    const savings = savingCache && Array.isArray(savingCache.items) ? savingCache.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted') : [];
    if (debtList) debtList.innerHTML = debts.length ? debts.slice(0, 3).map((item) => {
      const total = Number(item.amount) || 0;
      const remaining = Number(item.remaining_amount == null ? item.amount : item.remaining_amount) || 0;
      const percentage = total > 0 ? Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100))) : 0;
      return `<div class="dashboard-progress-row"><div class="dashboard-progress-heading"><strong>${escapeHtml(item.title || 'Utang')}</strong><span>${percentage}%</span></div><div class="dashboard-progress-track debt"><span style="width:${percentage}%"></span></div><small>Sisa ${escapeHtml(money(remaining))}</small></div>`;
    }).join('') : '<p class="muted dashboard-detail-empty">Tidak ada utang.</p>';
    if (savingList) savingList.innerHTML = savings.length ? savings.slice(0, 3).map((item) => {
      const target = Number(item.target_amount == null ? item.amount : item.target_amount) || 0;
      const current = Number(item.current_amount == null ? item.amount : item.current_amount) || 0;
      const percentage = target > 0 ? Math.max(0, Math.min(100, Math.round((current / target) * 100))) : 0;
      return `<div class="dashboard-progress-row"><div class="dashboard-progress-heading"><strong>${escapeHtml(item.title || 'Target tabungan')}</strong><span>${percentage}%</span></div><div class="dashboard-progress-track saving"><span style="width:${percentage}%"></span></div><small>${escapeHtml(money(current))} dari ${escapeHtml(money(target))}</small></div>`;
    }).join('') : '<p class="muted dashboard-detail-empty">Belum ada target tabungan.</p>';
  }

  function renderDashboardDetails() {
    renderDashboardRanking('income', '#dashboardTopIncomeList');
    renderDashboardRanking('expense', '#dashboardTopExpenseList');
    renderDashboardProgress();
  }

  function dashboardPiePathData(percentage, offset) {
    return { percentage: Number(percentage.toFixed(2)), offset: Number(offset.toFixed(2)) };
  }

  function renderDashboardBreakdown(type) {
    const modal = documentObject.querySelector('#dashboardBreakdownModal');
    const title = documentObject.querySelector('#dashboardBreakdownModalTitle');
    const eyebrow = documentObject.querySelector('#dashboardBreakdownModalEyebrow');
    const chart = documentObject.querySelector('#dashboardBreakdownChart');
    const legend = documentObject.querySelector('#dashboardBreakdownLegend');
    const list = documentObject.querySelector('#dashboardBreakdownTransactions');
    const overview = documentObject.querySelector('.dashboard-breakdown-overview');
    if (!modal || !chart || !legend || !list) return;
    chart.hidden = false;
    legend.hidden = false;
    if (overview) overview.hidden = false;
    const label = type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    const items = dashboardBreakdownItems(type).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const groups = new Map();
    items.forEach((item) => {
      const name = dashboardCategoryName(item);
      groups.set(name, (groups.get(name) || 0) + (Number(item.amount) || 0));
    });
    const total = [...groups.values()].reduce((sum, amount) => sum + amount, 0);
    const colors = ['#7769ed', '#55b995', '#e89b54', '#df6f78', '#5b9ed0', '#a879c9', '#d3bd55', '#6d879b'];
    if (title) title.textContent = label;
    if (eyebrow) eyebrow.textContent = `Rincian ${label.toLowerCase()}`;
    if (!total) {
      chart.innerHTML = '<div class="dashboard-breakdown-empty">Belum ada data untuk ditampilkan.</div>';
      legend.innerHTML = '';
    } else {
      let offset = 0;
      const entries = [...groups.entries()].map(([name, amount], index) => {
        const percentage = (amount / total) * 100;
        const path = dashboardPiePathData(percentage, offset);
        offset += percentage;
        return { name, amount, percentage, color: colors[index % colors.length], path };
      });
      chart.innerHTML = `<svg class="dashboard-pie-chart" viewBox="0 0 220 220" role="img" aria-label="Rincian ${escapeHtml(label.toLowerCase())} per kategori"><circle cx="110" cy="110" r="78" pathLength="100" fill="none" stroke="#f0eff7" stroke-width="50"></circle>${entries.map((entry) => `<circle cx="110" cy="110" r="78" pathLength="100" fill="none" stroke="${entry.color}" stroke-width="50" stroke-dasharray="${entry.path.percentage} ${100 - entry.path.percentage}" stroke-dashoffset="${-entry.path.offset}" transform="rotate(-90 110 110)"></circle>`).join('')}<circle cx="110" cy="110" r="51" fill="#fff"></circle><text x="110" y="106" text-anchor="middle" class="dashboard-pie-total-label">Total</text><text x="110" y="124" text-anchor="middle" class="dashboard-pie-total-value">${escapeHtml(money(total))}</text></svg>`;
      legend.innerHTML = entries.map((entry) => `<div class="dashboard-breakdown-legend-row"><span><i style="background:${entry.color}"></i><strong>${escapeHtml(entry.name)}</strong></span><b>${escapeHtml(money(entry.amount))}<small>${entry.percentage.toFixed(1)}%</small></b></div>`).join('');
    }
    list.innerHTML = items.length ? items.map((item) => `<div class="dashboard-breakdown-transaction"><div><strong>${escapeHtml(item.note || item.title || dashboardCategoryName(item))}</strong><small>${escapeHtml(dashboardCategoryName(item))} · ${escapeHtml(formatDate(item.date))}</small></div><b>${escapeHtml(money(item.amount))}</b></div>`).join('') : '<p class="muted dashboard-modal-empty">Belum ada transaksi.</p>';
    modal.hidden = false;
  }

  function renderDashboardTodayTransactions(type) {
    const modal = documentObject.querySelector('#dashboardBreakdownModal');
    const title = documentObject.querySelector('#dashboardBreakdownModalTitle');
    const eyebrow = documentObject.querySelector('#dashboardBreakdownModalEyebrow');
    const chart = documentObject.querySelector('#dashboardBreakdownChart');
    const legend = documentObject.querySelector('#dashboardBreakdownLegend');
    const list = documentObject.querySelector('#dashboardBreakdownTransactions');
    const overview = documentObject.querySelector('.dashboard-breakdown-overview');
    if (!modal || !chart || !legend || !list) return;
    const label = type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    const items = dashboardBreakdownItems(type).filter((item) => dashboardIsToday(item.date)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (title) title.textContent = `${label} hari ini`;
    if (eyebrow) eyebrow.textContent = 'Transaksi hari ini';
    chart.hidden = true;
    legend.hidden = true;
    if (overview) overview.hidden = true;
    list.innerHTML = items.length ? items.map((item) => `<div class="dashboard-breakdown-transaction"><div><strong>${escapeHtml(item.note || item.title || dashboardCategoryName(item))}</strong><small>${escapeHtml(dashboardCategoryName(item))} - ${escapeHtml(formatDate(item.date))}</small></div><b>${escapeHtml(money(item.amount))}</b></div>`).join('') : '<p class="muted dashboard-modal-empty">Belum ada transaksi hari ini.</p>';
    modal.hidden = false;
  }

  function closeDashboardBreakdownModal() {
    const modal = documentObject.querySelector('#dashboardBreakdownModal');
    if (modal) modal.hidden = true;
  }

  function setupDashboardBreakdownModal() {
    documentObject.querySelectorAll('[data-dashboard-breakdown]').forEach((card) => {
      if (card.dataset.bound === 'true') return;
      card.dataset.bound = 'true';
      card.addEventListener('click', () => renderDashboardBreakdown(card.dataset.dashboardBreakdown));
    });
    documentObject.querySelectorAll('[data-dashboard-today]').forEach((card) => {
      if (card.dataset.bound === 'true') return;
      card.dataset.bound = 'true';
      card.addEventListener('click', () => renderDashboardTodayTransactions(card.dataset.dashboardToday));
    });
    if (dashboardBreakdownModalBound) return;
    dashboardBreakdownModalBound = true;
    documentObject.querySelector('#closeDashboardBreakdownModal')?.addEventListener('click', closeDashboardBreakdownModal);
  }

  function setupDashboardAddTransaction() {
    const button = documentObject.querySelector('#dashboardAddTransaction');
    if (!button || button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => openTransactionModal());
  }

  function renderDashboardWallets() {
    const walletList = documentObject.querySelector('#dashboardWalletList');
    const transactionList = documentObject.querySelector('#dashboardWalletTransactions');
    const title = documentObject.querySelector('#dashboardWalletModalTitle');
    const eyebrow = documentObject.querySelector('#dashboardWalletModalEyebrow');
    const back = documentObject.querySelector('#dashboardWalletBack');
    const selection = documentObject.querySelector('#dashboardWalletSelection');
    if (!walletList || !transactionList) return;
    const data = dashboardWalletBalances();
    setText('#dashboardTotalMoney', money(data.total));
    renderDashboardSummaryTotals();
    renderDashboardDetails();
    if (eyebrow) eyebrow.textContent = 'Total Saldo';
    if (title) title.textContent = 'Daftar dompet';
    if (selection) selection.hidden = true;
    if (back) back.hidden = false;
    transactionList.hidden = true;
    transactionList.classList.remove('is-wallet-selected');
    walletList.hidden = false;
    walletList.innerHTML = data.wallets.length ? data.wallets.map((wallet) => `<button type="button" class="dashboard-wallet-option" data-dashboard-wallet-id="${escapeHtml(wallet.id)}"><span><strong>${escapeHtml(wallet.title || 'Dompet')}</strong><small>${escapeHtml(capitalizeFirst(wallet.subtitle || 'Akun'))}</small></span><b>${money(wallet.current_balance)}</b></button>`).join('') : '<p class="muted dashboard-modal-empty">Belum ada dompet atau akun.</p>';
  }

  function renderDashboardWalletTransactions(walletId) {
    const walletList = documentObject.querySelector('#dashboardWalletList');
    const transactionList = documentObject.querySelector('#dashboardWalletTransactions');
    const title = documentObject.querySelector('#dashboardWalletModalTitle');
    const eyebrow = documentObject.querySelector('#dashboardWalletModalEyebrow');
    const back = documentObject.querySelector('#dashboardWalletBack');
    const selection = documentObject.querySelector('#dashboardWalletSelection');
    const selected = documentObject.querySelector('#dashboardWalletSelected');
    if (!walletList || !transactionList) return;
    const data = dashboardWalletBalances();
    const wallet = data.wallets.find((item) => String(item.id) === String(walletId));
    if (!wallet) return;
    const transactions = data.transactions.filter((item) => [item.account_id, item.from_account_id, item.to_account_id].some((id) => String(id || '') === String(walletId)));
    const rowsById = new Map();
    transactions.forEach((item) => {
      const id = String(item.id || '');
      const key = id || `${item.date || ''}|${item.account_id || item.from_account_id || ''}|${item.amount || ''}|${item.note || item.title || ''}`;
      if (!rowsById.has(key)) rowsById.set(key, item);
    });
    const rows = [...rowsById.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (title) title.textContent = wallet.title || 'Dompet';
    if (eyebrow) eyebrow.textContent = 'Transaksi dompet';
    if (selected) selected.innerHTML = `<button type="button" class="dashboard-wallet-option dashboard-wallet-selected" aria-current="true" disabled><span><strong>${escapeHtml(wallet.title || 'Dompet')}</strong><small>${escapeHtml(capitalizeFirst(wallet.subtitle || 'Akun'))}</small></span><b>${money(wallet.current_balance)}</b></button>`;
    if (selection) selection.hidden = false;
    if (back) back.hidden = false;
    walletList.hidden = true;
    transactionList.hidden = false;
    transactionList.classList.add('is-wallet-selected');
    const renderedRows = rows.map((item) => {
      const type = dashboardTransactionType(item);
      const amount = Number(item.amount) || 0;
      const fromId = String(item.from_account_id || item.account_id || '');
      const toId = String(item.to_account_id || '');
      const signedAmount = type === 'income' || (type === 'transfer' && toId === String(walletId) && fromId !== String(walletId))
        ? amount
        : type === 'expense' || (type === 'transfer' && fromId === String(walletId) && toId !== String(walletId))
          ? -amount
          : amount;
      const sign = signedAmount > 0 ? '+' : signedAmount < 0 ? '-' : '';
      const amountClass = signedAmount >= 0 ? 'income-text' : 'expense-text';
      return `<div class="dashboard-wallet-transaction"><div><strong>${escapeHtml(item.note || item.title || dashboardTransactionTypeLabel(item))}</strong><small>${escapeHtml(formatDate(item.date))} · ${escapeHtml(dashboardTransactionTypeLabel(item))}</small></div><b class="${amountClass}">${sign} ${money(Math.abs(signedAmount))}</b></div>`;
    }).join('');
    transactionList.innerHTML = renderedRows || '<p class="muted dashboard-modal-empty">Belum ada transaksi pada dompet ini.</p>';
    return;
  }

  function closeDashboardWalletModal() {
    const modal = documentObject.querySelector('#dashboardWalletModal');
    if (modal) modal.hidden = true;
  }

  function setupDashboardWalletModal() {
    const card = documentObject.querySelector('#dashboardTotalCard');
    if (card && card.dataset.bound !== 'true') {
      card.dataset.bound = 'true';
      card.addEventListener('click', () => {
        const modal = documentObject.querySelector('#dashboardWalletModal');
        if (!modal) return;
        renderDashboardWallets();
        modal.hidden = false;
      });
    }
    if (dashboardWalletModalBound) return;
    dashboardWalletModalBound = true;
    documentObject.querySelector('#closeDashboardWalletModal')?.addEventListener('click', closeDashboardWalletModal);
    documentObject.querySelector('#dashboardWalletBack')?.addEventListener('click', renderDashboardWallets);
    documentObject.querySelector('#dashboardWalletList')?.addEventListener('click', (event) => {
      const option = event.target.closest('[data-dashboard-wallet-id]');
      if (option) renderDashboardWalletTransactions(option.dataset.dashboardWalletId);
    });
  }

  function showToast(message) {
    const toast = documentObject.querySelector('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    windowObject.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function openAccountModal(account) {
    const modal = documentObject.querySelector('#accountModal');
    const form = documentObject.querySelector('#accountForm');
    if (!modal) return;
    form?.reset();
    editingAccountId = account ? String(account.id || '') : '';
    const title = documentObject.querySelector('#accountModalTitle');
    const submit = documentObject.querySelector('#accountSubmitButton');
    if (title) title.textContent = editingAccountId ? 'Ubah akun' : 'Tambah akun';
    if (submit) submit.textContent = editingAccountId ? 'Simpan perubahan' : 'Simpan akun';
    if (account && form) {
      form.elements.name.value = account.title || '';
      form.elements.type.value = account.subtitle || 'cash';
      form.elements.balance.value = Number(account.amount) || 0;
    }
    modal.hidden = false;
    windowObject.setTimeout(() => form?.querySelector('input[name="name"]')?.focus(), 0);
  }

  function closeAccountModal() {
    const modal = documentObject.querySelector('#accountModal');
    if (modal) modal.hidden = true;
    editingAccountId = '';
  }

  function saveLocalAccount(form) {
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const type = String(formData.get('type') || 'cash');
    const balance = Number(formData.get('balance') || 0);
    if (!name) return;
    const now = new Date().toISOString();
    const cached = readCache('wallet') || {
      success: true,
      user: windowObject.DuitCurrentUser || {},
      source_sheet: 'accounts',
      summary: { total: 0, count: 0 },
      items: [],
    };
    const item = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: name,
      subtitle: type,
      amount: Number.isFinite(balance) && balance >= 0 ? balance : 0,
      sort_order: 0,
      date: now,
      updated_at: now,
      note: '',
      status: '',
    };
    cached.items = Array.isArray(cached.items) ? cached.items : [];
    const existingIndex = cached.items.findIndex((row) => String(row.id || '') === editingAccountId);
    const existingOrder = existingIndex >= 0 ? cached.items[existingIndex].sort_order : null;
    item.sort_order = existingIndex >= 0 && existingOrder !== null && existingOrder !== '' && Number.isFinite(Number(existingOrder))
      ? Number(existingOrder)
      : existingIndex >= 0 ? existingIndex : cached.items.length;
    if (existingIndex >= 0) {
      item.id = editingAccountId;
      cached.items[existingIndex] = item;
    } else {
      cached.items.push(item);
    }
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids.filter((id) => String(id) !== item.id) : [];
    cached.summary = {
      total: cached.items.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
      count: cached.items.length,
    };
    writeCache('wallet', cached);
    closeAccountModal();
    if (String(windowObject.location.hash).slice(1) === 'dompet') renderFinance(cached, configs.dompet);
    showToast('Akun disimpan di perangkat. Tekan Sinkronkan data untuk menyimpan perubahan.');
  }

  function bindWalletActions() {
    const list = documentObject.querySelector('#financeList');
    if (!list) return;
    if (list.dataset.walletActionsBound === 'true') return;
    list.dataset.walletActionsBound = 'true';
    list.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-account-action]');
      if (!button) return;
      const cached = readCache('wallet');
      if (!cached || !Array.isArray(cached.items)) return;
      const id = button.dataset.accountId;
      const account = cached.items.find((item) => String(item.id) === id);
      if (!account) return;
      if (button.dataset.accountAction === 'edit') {
        openAccountModal(account);
        return;
      }
      openAccountDeleteModal(account);
    });

    let draggedId = '';
    list.addEventListener('dragstart', (event) => {
      const row = event.target.closest('[data-account-row-id]');
      if (!row) return;
      draggedId = row.dataset.accountRowId || '';
      row.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedId);
      }
    });
    list.addEventListener('dragend', () => {
      draggedId = '';
      list.querySelectorAll('[data-account-row-id].is-dragging, [data-account-row-id].drag-over').forEach((row) => row.classList.remove('is-dragging', 'drag-over'));
    });
    list.addEventListener('dragover', (event) => {
      const row = event.target.closest('[data-account-row-id]');
      if (!row || row.dataset.accountRowId === draggedId) return;
      event.preventDefault();
      list.querySelectorAll('[data-account-row-id].drag-over').forEach((item) => item.classList.remove('drag-over'));
      row.classList.add('drag-over');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    });
    list.addEventListener('drop', (event) => {
      const targetRow = event.target.closest('[data-account-row-id]');
      if (!targetRow) return;
      event.preventDefault();
      const sourceId = draggedId || (event.dataTransfer && event.dataTransfer.getData('text/plain')) || '';
      if (!sourceId || sourceId === targetRow.dataset.accountRowId) return;
      const cached = readCache('wallet');
      if (!cached || !Array.isArray(cached.items)) return;
      const sourceIndex = cached.items.findIndex((item) => String(item.id) === String(sourceId));
      const targetIndex = cached.items.findIndex((item) => String(item.id) === String(targetRow.dataset.accountRowId));
      if (sourceIndex < 0 || targetIndex < 0) return;
      const [moved] = cached.items.splice(sourceIndex, 1);
      const targetAfterRemoval = cached.items.findIndex((item) => String(item.id) === String(targetRow.dataset.accountRowId));
      const insertAfter = event.clientY > targetRow.getBoundingClientRect().top + targetRow.getBoundingClientRect().height / 2;
      const insertIndex = Math.max(0, targetAfterRemoval + (insertAfter ? 1 : 0));
      cached.items.splice(insertIndex, 0, moved);
      const now = new Date().toISOString();
      cached.items.forEach((item, index) => {
        item.sort_order = index;
        item.updated_at = now;
      });
      cached.summary = { total: cached.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), count: cached.items.length };
      writeCache('wallet', cached);
      list.querySelectorAll('[data-account-row-id].is-dragging, [data-account-row-id].drag-over').forEach((row) => row.classList.remove('is-dragging', 'drag-over'));
      draggedId = '';
      renderFinance(cached, configs.dompet);
      showToast('Urutan akun diperbarui di data lokal. Tekan Perbarui data untuk menyinkronkan.');
    });
  }

  function openAccountDeleteModal(account) {
    const modal = documentObject.querySelector('#accountDeleteModal');
    if (!modal || !account) return;
    pendingAccountDelete = { ...account };
    const message = documentObject.querySelector('#accountDeleteMessage');
    if (message) message.textContent = `Akun “${account.title || 'Akun'}” akan dihapus dari data lokal.`;
    modal.hidden = false;
    windowObject.setTimeout(() => documentObject.querySelector('#confirmAccountDelete')?.focus(), 0);
  }

  function closeAccountDeleteModal() {
    const modal = documentObject.querySelector('#accountDeleteModal');
    if (modal) modal.hidden = true;
    pendingAccountDelete = null;
  }

  function confirmAccountDeleteAction() {
    if (!pendingAccountDelete) return;
    const cached = readCache('wallet');
    const id = String(pendingAccountDelete.id || '');
    if (!cached || !Array.isArray(cached.items)) {
      closeAccountDeleteModal();
      return;
    }
    cached.items = cached.items.filter((item) => String(item.id) !== id);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids : [];
    if (!cached.deleted_ids.includes(id) && !id.startsWith('local_')) cached.deleted_ids.push(id);
    cached.summary = { total: cached.items.reduce((sum, row) => sum + (Number(row.amount) || 0), 0), count: cached.items.length };
    writeCache('wallet', cached);
    closeAccountDeleteModal();
    renderFinance(cached, configs.dompet);
    showToast('Akun dihapus dari data lokal. Tekan Perbarui data untuk menyinkronkan.');
  }

  function openCategoryModal(category) {
    const modal = documentObject.querySelector('#categoryModal');
    const form = documentObject.querySelector('#categoryForm');
    if (!modal) return;
    form?.reset();
    editingCategoryId = category ? String(category.id || '') : '';
    const title = documentObject.querySelector('#categoryModalTitle');
    const submit = documentObject.querySelector('#categorySubmitButton');
    if (title) title.textContent = editingCategoryId ? 'Ubah kategori' : 'Tambah kategori';
    if (submit) submit.textContent = editingCategoryId ? 'Simpan perubahan' : 'Simpan kategori';
    if (category && form) {
      form.elements.name.value = category.title || '';
      form.elements.type.value = ['income', 'expense'].includes(String(category.subtitle || '').toLowerCase()) ? String(category.subtitle).toLowerCase() : 'expense';
    }
    modal.hidden = false;
    windowObject.setTimeout(() => form?.querySelector('input[name="name"]')?.focus(), 0);
  }

  function closeCategoryModal() {
    const modal = documentObject.querySelector('#categoryModal');
    if (modal) modal.hidden = true;
    editingCategoryId = '';
  }

  function saveLocalCategory(form) {
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const type = String(formData.get('type') || 'expense').toLowerCase();
    if (!name) return;
    const now = new Date().toISOString();
    const cached = readCache('category') || { success: true, user: windowObject.DuitCurrentUser || {}, source_sheet: 'categories', summary: { total: 0, count: 0 }, items: [] };
    const item = { id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, title: name, subtitle: type, amount: 0, sort_order: 0, date: now, updated_at: now, note: '', status: '' };
    cached.items = Array.isArray(cached.items) ? cached.items : [];
    const existingIndex = cached.items.findIndex((row) => String(row.id || '') === editingCategoryId);
    const existingOrder = existingIndex >= 0 ? cached.items[existingIndex].sort_order : null;
    item.sort_order = existingIndex >= 0 && existingOrder !== null && existingOrder !== '' && Number.isFinite(Number(existingOrder))
      ? Number(existingOrder)
      : existingIndex >= 0 ? existingIndex : cached.items.length;
    if (existingIndex >= 0) { item.id = editingCategoryId; cached.items[existingIndex] = item; } else cached.items.push(item);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids.filter((id) => String(id) !== item.id) : [];
    cached.summary = { total: cached.items.length, count: cached.items.length };
    writeCache('category', cached);
    closeCategoryModal();
    if (String(windowObject.location.hash).slice(1) === 'kategori') renderFinance(cached, configs.kategori);
    showToast('Kategori disimpan di data lokal. Tekan Perbarui data untuk menyinkronkan.');
  }

  function bindCategoryActions() {
    const list = documentObject.querySelector('#financeList');
    if (!list) return;
    if (list.dataset.categoryActionsBound === 'true') return;
    list.dataset.categoryActionsBound = 'true';
    list.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-category-action]');
      if (!button) return;
      const cached = readCache('category');
      const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === button.dataset.categoryId) : null;
      if (!item) return;
      if (button.dataset.categoryAction === 'edit') { openCategoryModal(item); return; }
      if (!windowObject.confirm(`Hapus kategori ${item.title || ''}?`)) return;
      cached.items = cached.items.filter((row) => String(row.id) !== button.dataset.categoryId);
      cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids : [];
      if (!cached.deleted_ids.includes(button.dataset.categoryId) && !button.dataset.categoryId.startsWith('local_')) cached.deleted_ids.push(button.dataset.categoryId);
      cached.summary = { total: cached.items.length, count: cached.items.length };
      writeCache('category', cached);
      renderFinance(cached, configs.kategori);
      showToast('Kategori dihapus dari data lokal. Tekan Perbarui data untuk menyinkronkan.');
    });

    let draggedId = '';
    list.addEventListener('dragstart', (event) => {
      const row = event.target.closest('tr[data-category-row-id]');
      if (!row) return;
      draggedId = row.dataset.categoryRowId || '';
      row.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedId);
      }
    });
    list.addEventListener('dragend', () => {
      draggedId = '';
      list.querySelectorAll('tr.is-dragging, tr.drag-over').forEach((row) => row.classList.remove('is-dragging', 'drag-over'));
    });
    list.addEventListener('dragover', (event) => {
      const row = event.target.closest('tr[data-category-row-id]');
      if (!row || row.dataset.categoryRowId === draggedId) return;
      event.preventDefault();
      list.querySelectorAll('tr.drag-over').forEach((item) => item.classList.remove('drag-over'));
      row.classList.add('drag-over');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    });
    list.addEventListener('drop', (event) => {
      const targetRow = event.target.closest('tr[data-category-row-id]');
      if (!targetRow) return;
      event.preventDefault();
      const sourceId = draggedId || (event.dataTransfer && event.dataTransfer.getData('text/plain')) || '';
      if (!sourceId || sourceId === targetRow.dataset.categoryRowId) return;
      const cached = readCache('category');
      if (!cached || !Array.isArray(cached.items)) return;
      const sourceIndex = cached.items.findIndex((item) => String(item.id) === String(sourceId));
      const targetIndex = cached.items.findIndex((item) => String(item.id) === String(targetRow.dataset.categoryRowId));
      if (sourceIndex < 0 || targetIndex < 0) return;
      const [moved] = cached.items.splice(sourceIndex, 1);
      const targetAfterRemoval = cached.items.findIndex((item) => String(item.id) === String(targetRow.dataset.categoryRowId));
      const targetBox = targetRow.getBoundingClientRect();
      const insertAfter = event.clientY > targetBox.top + targetBox.height / 2;
      cached.items.splice(Math.max(0, targetAfterRemoval + (insertAfter ? 1 : 0)), 0, moved);
      const now = new Date().toISOString();
      cached.items.forEach((item, index) => {
        item.sort_order = index;
        item.updated_at = now;
      });
      cached.summary = { total: cached.items.length, count: cached.items.length };
      writeCache('category', cached);
      list.querySelectorAll('tr.is-dragging, tr.drag-over').forEach((row) => row.classList.remove('is-dragging', 'drag-over'));
      draggedId = '';
      renderFinance(cached, configs.kategori);
      showToast('Urutan kategori diperbarui di data lokal. Tekan Perbarui data untuk menyinkronkan.');
    });
  }

  function setupCategoryModal() {
    documentObject.querySelector('#closeCategoryModal')?.addEventListener('click', closeCategoryModal);
    documentObject.querySelector('#cancelCategoryModal')?.addEventListener('click', closeCategoryModal);
    documentObject.querySelector('#categoryModal')?.addEventListener('click', (event) => { if (event.target.id === 'categoryModal') closeCategoryModal(); });
    documentObject.querySelector('#categoryForm')?.addEventListener('submit', (event) => { event.preventDefault(); saveLocalCategory(event.currentTarget); });
  }

  function openTransactionModal(transaction) {
    const modal = documentObject.querySelector('#transactionModal');
    const form = documentObject.querySelector('#transactionForm');
    if (!modal || !form) return;
    transaction = transaction && transaction.id ? transaction : null;
    form.reset();
    editingTransactionId = transaction ? String(transaction.id || '') : '';
    const modalTitle = documentObject.querySelector('#transactionModalTitle');
    if (modalTitle) modalTitle.textContent = editingTransactionId ? 'Ubah transaksi' : 'Tambah transaksi';
    const submitButton = documentObject.querySelector('#transactionSubmitButton');
    if (submitButton) submitButton.textContent = editingTransactionId ? 'Simpan perubahan' : 'Simpan transaksi';
    const wallet = readCache('wallet');
    const category = readCache('category');
    const accountSelect = documentObject.querySelector('#transactionAccount');
    const categorySelect = documentObject.querySelector('#transactionCategory');
    if (form.elements.date) form.elements.date.value = dateInputValue(transaction && transaction.date);
    if (form.elements.time) form.elements.time.value = timeInputValue(transaction && transaction.date);
    if (accountSelect) {
      const accounts = wallet && Array.isArray(wallet.items) ? wallet.items : [];
      accountSelect.innerHTML = accounts.length ? accounts.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`).join('') : '<option value="">Belum ada akun</option>';
      if (accounts.length) accountSelect.value = String(accounts[0].id || '');
    }
    const transactionType = transaction && ['income', 'expense'].includes(String(transaction.subtitle || '').toLowerCase()) ? String(transaction.subtitle).toLowerCase() : 'expense';
    form.elements.type.value = transactionType;
    populateTransactionCategories(form.elements.type.value, categorySelect, category);
    if (transaction) {
      form.elements.account_id.value = transaction.account_id || '';
      form.elements.category_id.value = transaction.category_id || '';
      form.elements.amount.value = Number(transaction.amount) || 0;
      form.elements.note.value = transaction.note || transaction.title || '';
    }
    modal.hidden = false;
    windowObject.setTimeout(() => form.querySelector('select[name="account_id"]')?.focus(), 0);
  }

  function populateTransactionCategories(type, select, cachedCategories) {
    const category = cachedCategories || readCache('category');
    if (!select) return;
    const categories = category && Array.isArray(category.items) ? category.items.filter((item) => String(item.subtitle || '').toLowerCase() === String(type || '').toLowerCase()) : [];
    select.innerHTML = '<option value="">Tanpa kategori</option>' + categories.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`).join('');
  }

  function closeTransactionModal() {
    const modal = documentObject.querySelector('#transactionModal');
    if (modal) modal.hidden = true;
    editingTransactionId = '';
    const modalTitle = documentObject.querySelector('#transactionModalTitle');
    if (modalTitle) modalTitle.textContent = 'Tambah transaksi';
    const submitButton = documentObject.querySelector('#transactionSubmitButton');
    if (submitButton) submitButton.textContent = 'Simpan transaksi';
  }

  function openTransactionDeleteModal(item) {
    const modal = documentObject.querySelector('#transactionDeleteModal');
    if (!modal || !item) return;
    pendingTransactionDelete = { ...item };
    const message = documentObject.querySelector('#transactionDeleteMessage');
    if (message) message.textContent = `Transaksi “${item.title || 'Transaksi'}” akan ditandai sebagai deleted dan disembunyikan dari daftar.`;
    modal.hidden = false;
    windowObject.setTimeout(() => documentObject.querySelector('#confirmTransactionDelete')?.focus(), 0);
  }

  function closeTransactionDeleteModal() {
    const modal = documentObject.querySelector('#transactionDeleteModal');
    if (modal) modal.hidden = true;
    pendingTransactionDelete = null;
  }

  function confirmTransactionDeleteAction() {
    if (!pendingTransactionDelete) return;
    const cached = readCache('transaction');
    const id = String(pendingTransactionDelete.id || '');
    const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
    if (!cached || !item) {
      closeTransactionDeleteModal();
      return;
    }
    const deletedAt = new Date().toISOString();
    item.status = 'deleted';
    item.updated_at = deletedAt;
    item.log = appendHistoryLog(item.log, 'deleted', deletedAt);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids : [];
    if (!cached.deleted_ids.includes(id) && !id.startsWith('local_')) cached.deleted_ids.push(id);
    cached.deleted_records = cached.deleted_records && typeof cached.deleted_records === 'object' ? cached.deleted_records : {};
    cached.deleted_records[id] = { ...item, deleted_at: deletedAt };
    cached.summary = { total: cached.items.filter((row) => String(row.status || 'active').toLowerCase() !== 'deleted').reduce((sum, row) => sum + (Number(row.amount) || 0), 0), count: cached.items.filter((row) => String(row.status || 'active').toLowerCase() !== 'deleted').length };
    writeCache('transaction', cached);
    closeTransactionDeleteModal();
    if (String(windowObject.location.hash).slice(1) === 'transaksi') renderFinance(cached, configs.transaksi);
    showToast('Transaksi ditandai deleted di data lokal. Tekan Perbarui data untuk menyinkronkan.');
  }

  function saveLocalTransaction(form) {
    const formData = new FormData(form);
    const accountId = String(formData.get('account_id') || '');
    const type = String(formData.get('type') || 'expense').toLowerCase();
    const categoryId = String(formData.get('category_id') || '');
    const amount = Number(formData.get('amount') || 0);
    const dateValue = String(formData.get('date') || '');
    const timeValue = String(formData.get('time') || '');
    const note = String(formData.get('note') || '').trim();
    if (!accountId || !dateValue || !timeValue || !Number.isFinite(amount) || amount < 0) {
      showToast('Pilih akun, tanggal, jam, dan masukkan jumlah yang valid.');
      return;
    }
    const now = new Date().toISOString();
    const transactionDate = new Date(`${dateValue}T${timeValue}:00`).toISOString();
    const cached = readCache('transaction') || { success: true, user: windowObject.DuitCurrentUser || {}, source_sheet: 'transactions', summary: { total: 0, count: 0 }, items: [] };
    const category = readCache('category');
    const account = readCache('wallet');
    const categoryItem = category && category.items ? category.items.find((item) => String(item.id) === categoryId) : null;
    const accountItem = account && account.items ? account.items.find((item) => String(item.id) === accountId) : null;
    cached.items = Array.isArray(cached.items) ? cached.items : [];
    const existingIndex = cached.items.findIndex((row) => String(row.id || '') === editingTransactionId);
    const previousItem = existingIndex >= 0 ? cached.items[existingIndex] : null;
    const item = { id: editingTransactionId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, title: note || (categoryItem && categoryItem.title) || 'Transaksi', subtitle: type, amount, date: transactionDate, updated_at: now, note, status: 'active', log: previousItem && previousItem.log ? previousItem.log : `created(${formatHistoryTimestamp(now)})`, account_id: accountId, category_id: categoryId, category_name: categoryItem && categoryItem.title || '', account_name: accountItem && accountItem.title || '' };
    if (existingIndex >= 0) cached.items[existingIndex] = item;
    else cached.items.push(item);
    const activeItems = cached.items.filter((row) => String(row.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, row) => sum + (Number(row.amount) || 0), 0), count: activeItems.length };
    writeCache('transaction', cached);
    closeTransactionModal();
    if (String(windowObject.location.hash).slice(1) === 'transaksi') renderFinance(cached, configs.transaksi);
    showToast(`${existingIndex >= 0 ? 'Transaksi diperbarui' : 'Transaksi disimpan'} di data lokal. Tekan Perbarui data untuk menyinkronkan.`);
  }

  function bindTransactionActions() {
    const list = documentObject.querySelector('#financeList');
    if (!list || list.dataset.transactionActionsBound === 'true') return;
    list.dataset.transactionActionsBound = 'true';
    list.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-transaction-action]');
      if (!button) return;
      const cached = readCache('transaction');
      const id = button.dataset.transactionId || '';
      const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
      if (!item) return;
      if (button.dataset.transactionAction === 'edit') {
        openTransactionModal(item);
        return;
      }
      openTransactionDeleteModal(item);
    });
  }

  function setupTransactionModal() {
    documentObject.querySelector('#closeTransactionModal')?.addEventListener('click', closeTransactionModal);
    documentObject.querySelector('#cancelTransactionModal')?.addEventListener('click', closeTransactionModal);
    documentObject.querySelector('#transactionForm select[name="type"]')?.addEventListener('change', (event) => populateTransactionCategories(event.target.value, documentObject.querySelector('#transactionCategory')));
    documentObject.querySelector('#transactionForm')?.addEventListener('submit', (event) => { event.preventDefault(); saveLocalTransaction(event.currentTarget); });
  }

  function setupTransactionDeleteModal() {
    documentObject.querySelector('#closeTransactionDeleteModal')?.addEventListener('click', closeTransactionDeleteModal);
    documentObject.querySelector('#cancelTransactionDeleteModal')?.addEventListener('click', closeTransactionDeleteModal);
    documentObject.querySelector('#confirmTransactionDelete')?.addEventListener('click', confirmTransactionDeleteAction);
  }

  function setupAccountModal() {
    documentObject.querySelector('#closeAccountModal')?.addEventListener('click', closeAccountModal);
    documentObject.querySelector('#cancelAccountModal')?.addEventListener('click', closeAccountModal);
    documentObject.querySelector('#accountModal')?.addEventListener('click', (event) => {
      if (event.target.id === 'accountModal') closeAccountModal();
    });
    documentObject.querySelector('#accountForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      saveLocalAccount(event.currentTarget);
    });
    documentObject.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAccountModal();
    });
  }

  function bindAddButton(config) {
    const addButton = documentObject.querySelector('#addFinance');
    if (!addButton) return;
    if (config.key === 'wallet') {
      addButton.textContent = '';
      addButton.innerHTML = '<svg><use href="#icon-plus"></use></svg> Tambah akun';
      addButton.addEventListener('click', openAccountModal);
      return;
    }
    if (config.key === 'category') {
      addButton.textContent = '';
      addButton.innerHTML = '<svg><use href="#icon-plus"></use></svg> Tambah kategori';
      addButton.addEventListener('click', openCategoryModal);
      return;
    }
    if (config.key === 'transaction') {
      addButton.textContent = '';
      addButton.innerHTML = '<svg><use href="#icon-plus"></use></svg> Tambah transaksi';
      addButton.addEventListener('click', () => openTransactionModal());
      return;
    }
    addButton.addEventListener('click', () => showToast('Form tambah data segera tersedia'));
  }

  function renderFinance(result, config) {
    setText('#financeHeading', config.title);
    setText('#financeDescription', config.description);
    setText('#financeSummaryLabel', config.summary);
    setText('#financeListHeading', config.key === 'wallet' ? 'DAFTAR AKUN' : (config.key === 'income' ? 'DAFTAR PEMASUKAN' : (config.key === 'transaction' ? 'Daftar Transaksi' : (config.key === 'category' ? 'DAFTAR KATEGORI' : `Daftar ${config.title.toLowerCase()}`))));
    setText('#financeTitleHeader', config.titleHeader);
    setText('#financeSubtitleHeader', config.subtitleHeader);
    setText('#financeTotal', money(result.summary && result.summary.total));
    setText('#financeCount', `${Number(result.summary && result.summary.count) || 0} data tercatat`);
    const sourceText = result.cached_at
      ? `Data lokal · diperbarui ${formatDate(result.cached_at)}`
      : `Sumber data: sheet ${result.source_sheet || config.title.toLowerCase()}`;
    const sourceLabel = documentObject.querySelector('#financeSourceLabel');
    if (sourceLabel) {
      sourceLabel.hidden = config.key === 'wallet' || config.key === 'income' || config.key === 'transaction' || config.key === 'category';
      sourceLabel.textContent = sourceText;
    }
    const list = documentObject.querySelector('#financeList');
    if (!list) return;
    const items = Array.isArray(result.items) ? result.items : [];
    const visibleItems = config.key === 'transaction'
      ? items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted')
      : items;
    if (config.key === 'wallet') {
      const currentBalances = new Map(dashboardWalletBalances().wallets.map((wallet) => [String(wallet.id), wallet.current_balance]));
      list.innerHTML = items.length ? items.map((item) => `<article class="wallet-account-card" draggable="true" data-account-row-id="${escapeHtml(item.id)}"><div class="wallet-account-card-head"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(capitalizeFirst(item.subtitle))}</span></div><span class="wallet-account-grip" aria-hidden="true">⋮⋮</span></div><div class="wallet-account-balances"><div class="wallet-account-balance"><small>Saldo awal</small><strong>${money(item.amount)}</strong></div><div class="wallet-account-balance is-current"><small>Saldo saat ini</small><strong>${money(currentBalances.get(String(item.id)) ?? item.amount)}</strong></div></div><div class="wallet-account-actions"><button type="button" data-account-action="edit" data-account-id="${escapeHtml(item.id)}" aria-label="Ubah ${escapeHtml(item.title)}" title="Ubah"><svg><use href="#icon-edit"></use></svg><span>Ubah</span></button><button type="button" data-account-action="delete" data-account-id="${escapeHtml(item.id)}" aria-label="Hapus ${escapeHtml(item.title)}" title="Hapus"><svg><use href="#icon-trash"></use></svg><span>Hapus</span></button></div></article>`).join('') : '<p class="muted wallet-empty">Belum ada akun.</p>';
      return;
    }
    if (config.key === 'category') {
      list.innerHTML = items.length ? items.map((item) => `<tr draggable="true" data-category-row-id="${escapeHtml(item.id)}"><td><strong>${escapeHtml(item.title)}</strong></td><td>${escapeHtml(categoryTypeLabel(item.subtitle))}</td><td class="account-actions"><button type="button" data-category-action="edit" data-category-id="${escapeHtml(item.id)}" aria-label="Ubah ${escapeHtml(item.title)}" title="Ubah"><svg><use href="#icon-edit"></use></svg></button><button type="button" data-category-action="delete" data-category-id="${escapeHtml(item.id)}" aria-label="Hapus ${escapeHtml(item.title)}" title="Hapus"><svg><use href="#icon-trash"></use></svg></button></td></tr>`).join('') : '<tr><td colspan="3" class="income-empty">Belum ada kategori.</td></tr>';
      return;
    }
    if (config.key === 'transaction') {
      const categories = readCache('category');
      const categoryItems = categories && Array.isArray(categories.items) ? categories.items : [];
      list.innerHTML = visibleItems.length ? visibleItems.map((item) => {
        const categoryItem = categoryItems.find((category) => String(category.id) === String(item.category_id));
        const categoryName = categoryItem ? categoryItem.title : (item.category_name || item.category || '-');
        return `<tr><td>${escapeHtml(formatDate(item.date))}</td><td>${escapeHtml(categoryTypeLabel(item.subtitle || item.type))}</td><td>${escapeHtml(categoryName)}</td><td class="amount-column">${money(item.amount)}</td><td><strong>${escapeHtml(item.note || item.title || 'Transaksi')}</strong></td><td class="account-actions"><button type="button" data-transaction-action="edit" data-transaction-id="${escapeHtml(item.id)}" aria-label="Ubah transaksi" title="Ubah"><svg><use href="#icon-edit"></use></svg></button><button type="button" data-transaction-action="delete" data-transaction-id="${escapeHtml(item.id)}" aria-label="Hapus transaksi" title="Hapus"><svg><use href="#icon-trash"></use></svg></button></td></tr>`;
      }).join('') : '<tr><td colspan="6" class="income-empty">Belum ada transaksi.</td></tr>';
      return;
    }
    list.innerHTML = items.length ? items.map((item) => `<tr><td><strong>${escapeHtml(item.title)}</strong>${item.note ? `<small>${escapeHtml(item.note)}</small>` : ''}</td><td>${escapeHtml(item.subtitle || item.status || '-')}</td><td>${escapeHtml(formatDate(item.date))}</td><td class="amount-column">${money(item.amount)}</td></tr>`).join('') : `<tr><td colspan="4" class="income-empty">Belum ada data ${config.title.toLowerCase()}.</td></tr>`;
  }

  function renderDashboard(result) {
    const summary = result.summary || {};
    setText('#dashboardBalance', money(summary.total_balance));
    setText('#dashboardIncome', money(summary.income));
    setText('#dashboardExpense', money(summary.expense));
    const list = documentObject.querySelector('#dashboardTransactions');
    if (!list) return;
    const items = Array.isArray(result.transactions) ? result.transactions : [];
    list.innerHTML = items.length ? items.slice(0, 10).map((item) => `<tr><td><strong>${escapeHtml(item.note || 'Transaksi')}</strong></td><td>${escapeHtml(item.category || '-')}</td><td>${escapeHtml(formatDate(item.date))}</td><td class="amount-column ${item.type === 'income' ? 'income-text' : 'expense-text'}">${item.type === 'income' ? '+' : '-'} ${money(item.amount)}</td></tr>`).join('') : '<tr><td colspan="4" class="income-empty">Belum ada transaksi.</td></tr>';
    const goals = documentObject.querySelector('#dashboardGoals');
    if (goals) {
      const goalItems = Array.isArray(result.goals) ? result.goals : [];
      goals.innerHTML = goalItems.length ? goalItems.map((goal) => {
        const target = Number(goal.target_amount) || 0;
        const current = Number(goal.current_amount) || 0;
        const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        return `<div class="goal"><div class="goal-info"><div class="goal-title"><strong>${escapeHtml(goal.name || 'Target tabungan')}</strong><span>${percentage}%</span></div><div class="progress"><span style="width:${percentage}%"></span></div><small>${money(current)} <em>dari ${money(target)}</em></small></div></div>`;
      }).join('') : '<p class="muted">Belum ada target tabungan.</p>';
    }
  }

  function loadDashboard(token, forceRefresh) {
    const container = pageContainer();
    if (container) container.innerHTML = dashboardShell();
    setText('.breadcrumb strong', 'Dasbor');
    setText('#currentDate', new Intl.DateTimeFormat(locale(), { dateStyle: 'full' }).format(new Date()));
    setupDashboardWalletModal();
    setupDashboardBreakdownModal();
    setupDashboardAddTransaction();
    const render = () => { renderDashboardWallets(); };
    const wallet = readCache('wallet');
    const transaction = readCache('transaction');
    const transfer = readCache('transfer');
    const debt = readCache('debt');
    const saving = readCache('saving');
    if (wallet && transaction && transfer && debt && saving) {
      render();
      return;
    }
    Promise.all([
      wallet ? Promise.resolve(wallet) : auth.callServer('getFinancePageData', { token, page: 'wallet' }).then((result) => { if (result && result.success) writeCache('wallet', result, { fromServer: true }); return result; }),
      transaction ? Promise.resolve(transaction) : auth.callServer('getFinancePageData', { token, page: 'transaction' }).then((result) => { if (result && result.success) writeCache('transaction', result, { fromServer: true }); return result; }),
      transfer ? Promise.resolve(transfer) : auth.callServer('getFinancePageData', { token, page: 'transfer' }).then((result) => { if (result && result.success) writeCache('transfer', result, { fromServer: true }); return result; }),
      debt ? Promise.resolve(debt) : auth.callServer('getFinancePageData', { token, page: 'debt' }).then((result) => { if (result && result.success) writeCache('debt', result, { fromServer: true }); return result; }),
      saving ? Promise.resolve(saving) : auth.callServer('getFinancePageData', { token, page: 'saving' }).then((result) => { if (result && result.success) writeCache('saving', result, { fromServer: true }); return result; }),
    ]).then(render).catch(() => render());
  }

  function transferShell() {
    return '<section class="transfer-screen"><div class="transfer-screen-heading"><h1>Transfer antar akun</h1><p class="muted">Daftar dompet dan saldo yang tersedia.</p></div><section class="transfer-wallet-section"><h2>Daftar dompet</h2><div class="transfer-wallet-grid" id="transferWalletGrid"><p class="muted">Memuat data dompet...</p></div><form id="accountTransferForm" class="account-transfer-form"><label><span>Dompet/Akun asal</span><select id="transferFromAccount" name="from_account_id" required></select></label><label><span>Dompet/Akun tujuan</span><select id="transferToAccount" name="to_account_id" required></select></label><label><span>Nominal</span><input type="number" name="amount" min="1" step="1" placeholder="0" required></label><button type="submit" class="primary-button" id="transferFormButton"><svg><use href="#icon-transfer"></use></svg> Transfer</button></form></section><section class="transfer-history-section"><h2>Riwayat transfer</h2><div id="transferHistoryList" class="transfer-history-list"><p class="muted transfer-empty">Memuat riwayat transfer...</p></div></section></section>';
  }

  function renderTransfer(result, transferResult) {
    const grid = documentObject.querySelector('#transferWalletGrid');
    if (!grid) return;
    const items = calculateTransferWalletBalances(result && Array.isArray(result.items) ? result.items : []);
    const walletIcon = (type) => ({ bank: 'icon-bank', ewallet: 'icon-ewallet', cash: 'icon-cash', investment: 'icon-investment' }[String(type || '').toLowerCase()] || 'icon-wallet');
    grid.innerHTML = items.length ? items.map((item) => `<article class="transfer-wallet-card transfer-wallet-${escapeHtml(String(item.subtitle || 'cash').toLowerCase())}"><div class="transfer-wallet-card-top"><div><strong>${escapeHtml(item.title || 'Dompet')}</strong><span>${escapeHtml(capitalizeFirst(item.subtitle || 'Akun'))}</span></div><svg aria-hidden="true"><use href="#${walletIcon(item.subtitle)}"></use></svg></div><div class="transfer-wallet-balance"><small>Saldo</small><strong>${money(item.amount)}</strong></div></article>`).join('') : '<p class="muted transfer-empty">Belum ada dompet atau akun.</p>';
    const accountOptions = items.length ? items.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`).join('') : '<option value="">Belum ada akun</option>';
    const fromSelect = documentObject.querySelector('#transferFromAccount');
    const toSelect = documentObject.querySelector('#transferToAccount');
    if (fromSelect) fromSelect.innerHTML = accountOptions;
    if (toSelect) {
      toSelect.innerHTML = accountOptions;
      if (items.length > 1) toSelect.selectedIndex = 1;
    }
    const historyList = documentObject.querySelector('#transferHistoryList');
    if (!historyList) return;
    const historyItems = transferResult && Array.isArray(transferResult.items) ? transferResult.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted') : [];
    const accountNames = {};
    items.forEach((item) => { accountNames[String(item.id)] = item.title; });
    historyList.innerHTML = historyItems.length ? historyItems.map((item) => {
      const fromId = item.from_account_id || item.account_id || '';
      const toId = item.to_account_id || '';
      const titleMatch = String(item.title || item.note || '').match(/^Transfer\s+(.+?)\s+ke\s+(.+)$/i);
      const fromName = accountNames[String(fromId)] || item.from_account_name || (titleMatch && titleMatch[1]) || 'Akun asal';
      const toName = accountNames[String(toId)] || item.to_account_name || (titleMatch && titleMatch[2]) || 'Akun tujuan';
      return `<article class="transfer-history-item"><div class="transfer-history-copy"><strong>${escapeHtml(fromName)} <span>→</span> ${escapeHtml(toName)}</strong><small>${escapeHtml(formatDate(item.date))}</small></div><strong class="transfer-history-amount">${money(item.amount)}</strong><div class="transfer-history-actions"><button type="button" data-transfer-action="edit" data-transfer-id="${escapeHtml(item.id)}" aria-label="Ubah transfer" title="Ubah"><svg><use href="#icon-edit"></use></svg></button><button type="button" data-transfer-action="delete" data-transfer-id="${escapeHtml(item.id)}" aria-label="Hapus transfer" title="Hapus"><svg><use href="#icon-trash"></use></svg></button></div></article>`;
    }).join('') : '<p class="muted transfer-empty">Belum ada riwayat transfer.</p>';
  }

  function calculateTransferWalletBalances(walletItems) {
    const items = walletItems.map((item) => ({ ...item, amount: Number(item.amount) || 0 }));
    const byId = {};
    items.forEach((item) => { byId[String(item.id)] = item; });
    const adjust = (id, amount, accountName) => {
      const namedAccount = accountName ? items.find((item) => String(item.title || '').trim().toLowerCase() === String(accountName).trim().toLowerCase()) : null;
      const account = namedAccount || byId[String(id || '')];
      if (account) account.amount += amount;
    };
    const transferNames = (item) => {
      const match = String(item.title || item.note || '').match(/^Transfer\s+(.+?)\s+ke\s+(.+)$/i);
      return { from: match ? match[1] : '', to: match ? match[2] : '' };
    };
    const transactionCache = readCache('transaction');
    const transactionItems = transactionCache && Array.isArray(transactionCache.items) ? transactionCache.items : [];
    const appliedTransferIds = new Set();
    transactionItems.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted').forEach((item) => {
      const type = String(item.subtitle || item.type || '').toLowerCase();
      const amount = Number(item.amount) || 0;
      if (type === 'income') adjust(item.account_id, amount);
      if (type === 'expense') adjust(item.account_id, -amount);
      if (type === 'transfer') {
        const names = transferNames(item);
        adjust(item.account_id || item.from_account_id, -amount, item.from_account_name || names.from);
        adjust(item.to_account_id, amount, item.to_account_name || names.to);
        appliedTransferIds.add(String(item.id || ''));
      }
    });
    const transferCache = readCache('transfer');
    const transferItems = transferCache && Array.isArray(transferCache.items) ? transferCache.items : [];
    transferItems.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted' && !appliedTransferIds.has(String(item.id || ''))).forEach((item) => {
      const amount = Number(item.amount) || 0;
      const names = transferNames(item);
      adjust(item.from_account_id || item.account_id, -amount, item.from_account_name || names.from);
      adjust(item.to_account_id, amount, item.to_account_name || names.to);
    });
    return items;
  }

  function saveLocalTransfer(form) {
    const formData = new FormData(form);
    const fromAccountId = String(formData.get('from_account_id') || '');
    const toAccountId = String(formData.get('to_account_id') || '');
    const amount = Number(formData.get('amount') || 0);
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId || !Number.isFinite(amount) || amount <= 0) {
      showToast('Pilih akun asal dan tujuan yang berbeda, lalu masukkan nominal yang valid.');
      return;
    }
    const wallet = readCache('wallet');
    const accounts = wallet && Array.isArray(wallet.items) ? wallet.items : [];
    const fromAccount = accounts.find((item) => String(item.id) === fromAccountId);
    const toAccount = accounts.find((item) => String(item.id) === toAccountId);
    const now = new Date().toISOString();
    const cached = readCache('transfer') || { success: true, user: windowObject.DuitCurrentUser || {}, source_sheet: 'transfer', summary: { total: 0, count: 0 }, items: [] };
    cached.items = Array.isArray(cached.items) ? cached.items : [];
    const existingIndex = cached.items.findIndex((item) => String(item.id || '') === editingTransferId);
    const previousItem = existingIndex >= 0 ? cached.items[existingIndex] : null;
    const transferItem = { id: editingTransferId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, title: `Transfer ${fromAccount ? fromAccount.title : 'Akun asal'} ke ${toAccount ? toAccount.title : 'Akun tujuan'}`, subtitle: 'transfer', amount, date: previousItem && previousItem.date ? previousItem.date : now, updated_at: now, note: `Transfer ${fromAccount ? fromAccount.title : 'Akun asal'} ke ${toAccount ? toAccount.title : 'Akun tujuan'}`, status: 'active', log: previousItem && previousItem.log ? previousItem.log : `created(${formatHistoryTimestamp(now)})`, account_id: fromAccountId, from_account_id: fromAccountId, to_account_id: toAccountId, category_id: '' };
    if (existingIndex >= 0) cached.items[existingIndex] = transferItem;
    else cached.items.push(transferItem);
    const activeItems = cached.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), count: activeItems.length };
    writeCache('transfer', cached);
    form.reset();
    editingTransferId = '';
    const button = documentObject.querySelector('#transferFormButton');
    if (button) button.innerHTML = '<svg><use href="#icon-transfer"></use></svg> Transfer';
    renderTransfer(wallet, cached);
    showToast(`${existingIndex >= 0 ? 'Transfer diperbarui' : 'Transfer disimpan'} di data lokal. Tekan Perbarui data untuk menyinkronkan.`);
  }

  function openTransferDeleteModal(item) {
    const modal = documentObject.querySelector('#transferDeleteModal');
    if (!modal || !item) return;
    pendingTransferDelete = { ...item };
    const message = documentObject.querySelector('#transferDeleteMessage');
    if (message) message.textContent = `Transfer “${item.title || 'Transfer'}” akan ditandai sebagai deleted dan disembunyikan dari riwayat.`;
    modal.hidden = false;
    windowObject.setTimeout(() => documentObject.querySelector('#confirmTransferDelete')?.focus(), 0);
  }

  function closeTransferDeleteModal() {
    const modal = documentObject.querySelector('#transferDeleteModal');
    if (modal) modal.hidden = true;
    pendingTransferDelete = null;
  }

  function confirmTransferDeleteAction() {
    if (!pendingTransferDelete) return;
    const cached = readCache('transfer');
    const id = String(pendingTransferDelete.id || '');
    const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
    if (!cached || !item) {
      closeTransferDeleteModal();
      return;
    }
    const now = new Date().toISOString();
    item.status = 'deleted';
    item.updated_at = now;
    item.log = appendHistoryLog(item.log, 'deleted', now);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids : [];
    if (!cached.deleted_ids.includes(id) && !id.startsWith('local_')) cached.deleted_ids.push(id);
    const activeItems = cached.items.filter((row) => String(row.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, row) => sum + (Number(row.amount) || 0), 0), count: activeItems.length };
    writeCache('transfer', cached);
    closeTransferDeleteModal();
    renderTransfer(readCache('wallet'), cached);
    showToast('Transfer ditandai deleted di data lokal. Tekan Perbarui data untuk menyinkronkan.');
  }

  function bindTransferHistory() {
    const list = documentObject.querySelector('#transferHistoryList');
    if (!list) return;
    list.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-transfer-action]');
      if (!button) return;
      const cached = readCache('transfer');
      const id = button.dataset.transferId || '';
      const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
      if (!item) return;
      if (button.dataset.transferAction === 'edit') {
        editingTransferId = id;
        const form = documentObject.querySelector('#accountTransferForm');
        if (form) {
          form.elements.from_account_id.value = item.from_account_id || item.account_id || '';
          form.elements.to_account_id.value = item.to_account_id || '';
          form.elements.amount.value = Number(item.amount) || 0;
        }
        const submit = documentObject.querySelector('#transferFormButton');
        if (submit) submit.innerHTML = '<svg><use href="#icon-edit"></use></svg> Simpan perubahan';
        form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      openTransferDeleteModal(item);
    });
  }

  function bindTransferForm() {
    documentObject.querySelector('#accountTransferForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      saveLocalTransfer(event.currentTarget);
    });
  }

  function setupTransferDeleteModal() {
    documentObject.querySelector('#closeTransferDeleteModal')?.addEventListener('click', closeTransferDeleteModal);
    documentObject.querySelector('#cancelTransferDeleteModal')?.addEventListener('click', closeTransferDeleteModal);
    documentObject.querySelector('#confirmTransferDelete')?.addEventListener('click', confirmTransferDeleteAction);
  }

  function setupAccountDeleteModal() {
    documentObject.querySelector('#closeAccountDeleteModal')?.addEventListener('click', closeAccountDeleteModal);
    documentObject.querySelector('#cancelAccountDeleteModal')?.addEventListener('click', closeAccountDeleteModal);
    documentObject.querySelector('#confirmAccountDelete')?.addEventListener('click', confirmAccountDeleteAction);
  }

  function loadTransfer(token, forceRefresh) {
    const container = pageContainer();
    if (container) container.innerHTML = transferShell();
    bindTransferForm();
    bindTransferHistory();
    setText('.breadcrumb strong', 'Transfer');
    setText('#currentDate', new Intl.DateTimeFormat(locale(), { dateStyle: 'full' }).format(new Date()));
    const cached = forceRefresh ? null : readCache('wallet');
    const transferCached = forceRefresh ? null : readCache('transfer');
    const transactionCached = forceRefresh ? null : readCache('transaction');
    if (cached && transferCached && transactionCached) {
      renderTransfer(cached, transferCached);
      return;
    }
    documentObject.dispatchEvent(new Event('duit:data-loading'));
    Promise.all([
      cached ? Promise.resolve(cached) : auth.callServer('getFinancePageData', { token, page: 'wallet' }),
      transferCached ? Promise.resolve(transferCached) : auth.callServer('getFinancePageData', { token, page: 'transfer' }),
      transactionCached ? Promise.resolve(transactionCached) : auth.callServer('getFinancePageData', { token, page: 'transaction' }),
    ]).then(([walletResult, transferResult, transactionResult]) => {
      if (!walletResult || !walletResult.success || !transferResult || !transferResult.success || !transactionResult || !transactionResult.success) throw new Error('Data transfer tidak dapat dimuat.');
      if (!cached) writeCache('wallet', walletResult, { fromServer: true });
      if (!transferCached) writeCache('transfer', transferResult, { fromServer: true });
      if (!transactionCached) writeCache('transaction', transactionResult, { fromServer: true });
      renderTransfer(walletResult, transferResult);
    }).catch((error) => {
      const grid = documentObject.querySelector('#transferWalletGrid');
      if (grid) grid.innerHTML = `<p class="muted transfer-empty">${escapeHtml(error.message)}</p>`;
    }).finally(() => documentObject.dispatchEvent(new Event('duit:data-loaded')));
  }

  function loadEmptyFinance(config) {
    const container = pageContainer();
    if (container) container.innerHTML = '';
    setText('.breadcrumb strong', config.title);
    setText('#currentDate', new Intl.DateTimeFormat(locale(), { dateStyle: 'full' }).format(new Date()));
  }

  function debtShell() {
    return '<section class="debt-screen"><div class="debt-screen-heading"><div><h1>Utang</h1><p class="muted">Catat pinjaman dan uang yang kamu pinjamkan.</p></div><button type="button" class="primary-button" id="addDebtItem"><svg><use href="#icon-plus"></use></svg> Tambah Item</button></div><section class="debt-card-section"><h2>Daftar Utang</h2><div id="debtCardGrid" class="debt-card-grid"><p class="muted debt-empty">Memuat data utang...</p></div></section><section class="debt-payment-section"><div class="debt-payment-heading"><div><h2>Pembayaran Utang</h2><p class="muted">Catat pembayaran berdasarkan nama orang.</p></div></div><form id="debtPaymentForm" class="debt-payment-form"><label>Nama orang<select name="debt_id" id="debtPaymentDebt" required><option value="">Pilih nama orang</option></select></label><label>Jumlah pembayaran<input name="amount" type="number" min="1" step="1" placeholder="0" required></label><div class="debt-payment-form-actions"><button type="button" class="secondary-button" id="cancelDebtPaymentEdit" hidden>Batal</button><button type="submit" class="primary-button" id="debtPaymentSubmit"><svg><use href="#icon-arrow-down"></use></svg> Bayar</button></div></form></section><section class="debt-payment-history-section"><h2>Riwayat Pembayaran</h2><div class="debt-payment-table-wrap"><table class="debt-payment-table"><thead><tr><th>Tanggal</th><th>Nama</th><th class="amount-column">Jumlah</th><th class="debt-payment-actions-header">Aksi</th></tr></thead><tbody id="debtPaymentList"><tr><td colspan="4" class="income-empty">Memuat riwayat pembayaran...</td></tr></tbody></table></div></section></section>';
  }

  function renderDebt(result) {
    const grid = documentObject.querySelector('#debtCardGrid');
    if (!grid) return;
    const rawItems = result && Array.isArray(result.items) ? result.items : (result && Array.isArray(result.goals) ? result.goals : []);
    const items = rawItems
      ? rawItems.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted')
      : [];
    const dueInfo = (value) => {
      const due = new Date(value);
      if (Number.isNaN(due.getTime())) return { label: 'Tenggang waktu belum diatur', state: 'unknown' };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      const days = Math.round((due.getTime() - today.getTime()) / 86400000);
      if (days < 0) return { label: `Terlambat ${Math.abs(days)} hari`, state: 'overdue' };
      if (days === 0) return { label: 'Jatuh tempo hari ini', state: 'today' };
      return { label: `${days} hari lagi`, state: 'upcoming' };
    };
    grid.innerHTML = items.length ? items.map((item) => {
      const type = String(item.subtitle || 'pinjam').toLowerCase() === 'meminjamkan' ? 'meminjamkan' : 'pinjam';
      const due = dueInfo(item.date);
      const icon = type === 'meminjamkan' ? 'icon-hand-coins' : 'icon-arrow-up';
      const remaining = Number(item.remaining_amount == null ? item.amount : item.remaining_amount) || 0;
      const debtStatus = String(item.debt_status || (remaining <= 0 ? 'paid' : 'unpaid')).toLowerCase() === 'paid' ? 'paid' : 'unpaid';
      return `<article class="debt-card debt-${type}" data-debt-id="${escapeHtml(item.id)}">${debtStatus === 'paid' ? '<span class="debt-paid-stamp" aria-label="Lunas">LUNAS</span>' : ''}<div class="debt-card-head"><div><strong>${escapeHtml(item.title || 'Nama orang')}</strong><span>${type === 'meminjamkan' ? 'Meminjamkan' : 'Pinjam'}</span></div><div class="debt-card-head-actions"><svg aria-hidden="true"><use href="#${icon}"></use></svg><div class="debt-card-actions"><button type="button" data-debt-action="edit" data-debt-id="${escapeHtml(item.id)}" aria-label="Ubah ${escapeHtml(item.title || 'utang')}" title="Ubah"><svg><use href="#icon-edit"></use></svg></button><button type="button" data-debt-action="delete" data-debt-id="${escapeHtml(item.id)}" aria-label="Hapus ${escapeHtml(item.title || 'utang')}" title="Hapus"><svg><use href="#icon-trash"></use></svg></button></div></div></div><div class="debt-card-values"><div><small>Jumlah</small><strong>${money(item.amount)}</strong></div><div><small>Sisa</small><strong>${money(remaining)}</strong></div></div><div class="debt-card-due"><div><small>Tenggang waktu</small><strong>${escapeHtml(formatDate(item.date))}</strong></div><div class="debt-card-badges"><span class="debt-status-badge ${debtStatus}">${debtStatus === 'paid' ? 'Lunas' : 'Belum lunas'}</span><span class="debt-due-badge ${due.state}">${escapeHtml(due.label)}</span></div></div></article>`;
    }).join('') : '<p class="muted debt-empty">Tidak ada utang.</p>';
  }

  function activeDebtItems() {
    const cached = readCache('debt');
    return cached && Array.isArray(cached.items)
      ? cached.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted')
      : [];
  }

  function populateDebtPaymentDebts(selectedId) {
    const select = documentObject.querySelector('#debtPaymentDebt');
    if (!select) return;
    const items = activeDebtItems();
    const current = selectedId || select.value || '';
    select.innerHTML = '<option value="">Pilih nama orang</option>' + items.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title || 'Nama orang')}</option>`).join('');
    if (items.some((item) => String(item.id) === String(current))) select.value = current;
  }

  function renderDebtPayments(result) {
    const list = documentObject.querySelector('#debtPaymentList');
    if (!list) return;
    const items = result && Array.isArray(result.items)
      ? result.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted')
      : [];
    populateDebtPaymentDebts();
    list.innerHTML = items.length ? items.map((item) => `<tr><td>${escapeHtml(formatDate(item.date))}</td><td>${escapeHtml(item.title || 'Utang')}</td><td class="amount-cell">${money(item.amount)}</td><td class="debt-payment-actions"><button type="button" data-debt-payment-action="edit" data-debt-payment-id="${escapeHtml(item.id)}" aria-label="Ubah pembayaran" title="Ubah"><svg><use href="#icon-edit"></use></svg></button><button type="button" data-debt-payment-action="delete" data-debt-payment-id="${escapeHtml(item.id)}" aria-label="Hapus pembayaran" title="Hapus"><svg><use href="#icon-trash"></use></svg></button></td></tr>`).join('') : '<tr><td colspan="4" class="income-empty">Belum ada riwayat pembayaran.</td></tr>';
    recalculateLocalDebtFromPayments();
  }

  function resetDebtPaymentForm() {
    const form = documentObject.querySelector('#debtPaymentForm');
    const button = documentObject.querySelector('#debtPaymentSubmit');
    const cancel = documentObject.querySelector('#cancelDebtPaymentEdit');
    editingDebtPaymentId = '';
    form?.reset();
    populateDebtPaymentDebts();
    if (button) button.innerHTML = '<svg><use href="#icon-arrow-down"></use></svg> Bayar';
    if (cancel) cancel.hidden = true;
  }

  function openDebtPaymentEdit(item) {
    const form = documentObject.querySelector('#debtPaymentForm');
    if (!form || !item) return;
    editingDebtPaymentId = String(item.id || '');
    populateDebtPaymentDebts(item.debt_id);
    form.elements.debt_id.value = item.debt_id || '';
    form.elements.amount.value = Number(item.amount) || 0;
    const button = documentObject.querySelector('#debtPaymentSubmit');
    const cancel = documentObject.querySelector('#cancelDebtPaymentEdit');
    if (button) button.innerHTML = '<svg><use href="#icon-edit"></use></svg> Simpan perubahan';
    if (cancel) cancel.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function recalculateLocalDebtFromPayments() {
    const debtCache = readCache('debt');
    const paymentCache = readCache('debt_payment');
    if (!debtCache || !Array.isArray(debtCache.items) || !paymentCache || !Array.isArray(paymentCache.items)) return;
    const allPayments = paymentCache.items;
    if (!allPayments.length) return;
    debtCache.items.forEach((debt) => {
      const total = Number(debt.amount) || 0;
      const debtPayments = allPayments.filter((payment) => String(payment.debt_id || '') === String(debt.id || ''));
      if (!debtPayments.length) return;
      const paid = debtPayments.filter((payment) => String(payment.status || 'active').toLowerCase() !== 'deleted').reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
      debt.remaining_amount = Math.max(0, total - paid);
      debt.debt_status = debt.remaining_amount <= 0 ? 'paid' : 'unpaid';
    });
    const activeDebts = debtCache.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted');
    debtCache.summary = { total: activeDebts.reduce((sum, item) => sum + (Number(item.remaining_amount == null ? item.amount : item.remaining_amount) || 0), 0), count: activeDebts.length };
    writeCache('debt', debtCache);
    renderDebt(debtCache);
  }

  function openDebtModal(debt) {
    const modal = documentObject.querySelector('#debtModal');
    const form = documentObject.querySelector('#debtForm');
    if (!modal || !form) return;
    form.reset();
    editingDebtId = debt ? String(debt.id || '') : '';
    const title = documentObject.querySelector('#debtModalTitle');
    const submit = documentObject.querySelector('#debtSubmitButton');
    if (title) title.textContent = editingDebtId ? 'Ubah Item' : 'Tambah Item';
    if (submit) submit.textContent = editingDebtId ? 'Simpan perubahan' : 'Simpan';
    if (debt) {
      form.elements.person_name.value = debt.title || '';
      form.elements.type.value = String(debt.subtitle || 'pinjam').toLowerCase() === 'meminjamkan' ? 'meminjamkan' : 'pinjam';
      form.elements.total_amount.value = Number(debt.amount) || 0;
      form.elements.remaining_amount.value = Number(debt.remaining_amount == null ? debt.amount : debt.remaining_amount) || 0;
      const dateValue = String(debt.date || '').slice(0, 10);
      form.elements.due_date.value = dateValue;
    }
    modal.hidden = false;
    windowObject.setTimeout(() => form.elements.person_name?.focus(), 0);
  }

  function closeDebtModal() {
    const modal = documentObject.querySelector('#debtModal');
    if (modal) modal.hidden = true;
    editingDebtId = '';
    const title = documentObject.querySelector('#debtModalTitle');
    const submit = documentObject.querySelector('#debtSubmitButton');
    if (title) title.textContent = 'Tambah Item';
    if (submit) submit.textContent = 'Simpan';
  }

  function saveLocalDebt(form) {
    const formData = new FormData(form);
    const personName = String(formData.get('person_name') || '').trim();
    const type = String(formData.get('type') || 'pinjam').toLowerCase();
    const totalAmount = Number(formData.get('total_amount') || 0);
    const remainingAmount = Number(formData.get('remaining_amount') || 0);
    const dueDate = String(formData.get('due_date') || '');
    if (!personName || !Number.isFinite(totalAmount) || totalAmount < 0 || !Number.isFinite(remainingAmount) || remainingAmount < 0 || remainingAmount > totalAmount || !dueDate) {
      showToast('Lengkapi data dan pastikan sisa tidak lebih besar dari jumlah.');
      return;
    }
    const now = new Date().toISOString();
    const cached = readCache('debt') || { success: true, user: windowObject.DuitCurrentUser || {}, source_sheet: 'debts', summary: { total: 0, count: 0 }, items: [] };
    cached.items = Array.isArray(cached.items) ? cached.items : [];
    const existingIndex = cached.items.findIndex((item) => String(item.id || '') === editingDebtId);
    const previous = existingIndex >= 0 ? cached.items[existingIndex] : null;
    const changedFields = previous ? [
      String(previous.title || '') !== personName ? 'nama orang' : '',
      String(previous.subtitle || '').toLowerCase() !== type ? 'tipe' : '',
      Number(previous.amount) !== totalAmount ? 'jumlah' : '',
      Number(previous.remaining_amount == null ? previous.amount : previous.remaining_amount) !== remainingAmount ? 'sisa' : '',
      String(previous.date || '').slice(0, 10) !== dueDate ? 'tenggang waktu' : '',
    ].filter(Boolean) : [];
    const item = {
      id: editingDebtId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: personName,
      subtitle: type,
      amount: totalAmount,
      remaining_amount: remainingAmount,
      debt_status: remainingAmount <= 0 ? 'paid' : 'unpaid',
      date: dueDate,
      updated_at: now,
      status: 'active',
      log: previous
        ? appendHistoryLog(previous.log || '', changedFields.length ? `edited(${changedFields.join(', ')})` : 'edited', now)
        : `created(${formatHistoryTimestamp(now)})`,
      note: previous && previous.note || '',
    };
    if (existingIndex >= 0) cached.items[existingIndex] = item;
    else cached.items.push(item);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids.filter((id) => String(id) !== item.id) : [];
    const activeItems = cached.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, item) => sum + (Number(item.remaining_amount == null ? item.amount : item.remaining_amount) || 0), 0), count: activeItems.length };
    writeCache('debt', cached);
    closeDebtModal();
    renderDebt(cached);
    showToast(`${existingIndex >= 0 ? 'Item utang diperbarui' : 'Item utang disimpan'} di data lokal. Tekan Perbarui data untuk menyinkronkan.`);
  }

  function openDebtDeleteModal(item) {
    const modal = documentObject.querySelector('#debtDeleteModal');
    if (!modal || !item) return;
    pendingDebtDelete = { ...item };
    const message = documentObject.querySelector('#debtDeleteMessage');
    if (message) message.textContent = `Item utang “${item.title || 'Utang'}” akan ditandai sebagai deleted dan disembunyikan dari daftar.`;
    modal.hidden = false;
    windowObject.setTimeout(() => documentObject.querySelector('#confirmDebtDelete')?.focus(), 0);
  }

  function closeDebtDeleteModal() {
    const modal = documentObject.querySelector('#debtDeleteModal');
    if (modal) modal.hidden = true;
    pendingDebtDelete = null;
  }

  function confirmDebtDeleteAction() {
    if (!pendingDebtDelete) return;
    const cached = readCache('debt');
    const id = String(pendingDebtDelete.id || '');
    const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
    if (!cached || !item) {
      closeDebtDeleteModal();
      return;
    }
    const now = new Date().toISOString();
    item.status = 'deleted';
    item.updated_at = now;
    item.log = appendHistoryLog(item.log, 'deleted', now);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids : [];
    if (!cached.deleted_ids.includes(id) && !id.startsWith('local_')) cached.deleted_ids.push(id);
    const activeItems = cached.items.filter((row) => String(row.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, row) => sum + (Number(row.remaining_amount == null ? row.amount : row.remaining_amount) || 0), 0), count: activeItems.length };
    writeCache('debt', cached);
    closeDebtDeleteModal();
    renderDebt(cached);
    showToast('Item utang ditandai deleted di data lokal. Tekan Perbarui data untuk menyinkronkan.');
  }

  function saveLocalDebtPayment(form) {
    const formData = new FormData(form);
    const debtId = String(formData.get('debt_id') || '').trim();
    const amount = Number(formData.get('amount') || 0);
    const debt = activeDebtItems().find((item) => String(item.id || '') === debtId);
    if (!debtId || !debt || !Number.isFinite(amount) || amount <= 0) {
      showToast('Pilih nama orang dan masukkan jumlah pembayaran yang valid.');
      return;
    }
    const now = new Date().toISOString();
    const cached = readCache('debt_payment') || { success: true, user: windowObject.DuitCurrentUser || {}, source_sheet: 'debt_transactions', summary: { total: 0, count: 0 }, items: [] };
    cached.items = Array.isArray(cached.items) ? cached.items : [];
    const existingIndex = cached.items.findIndex((item) => String(item.id || '') === editingDebtPaymentId);
    const previous = existingIndex >= 0 ? cached.items[existingIndex] : null;
    const changedFields = previous ? [
      String(previous.debt_id || '') !== debtId ? 'utang' : '',
      Number(previous.amount) !== amount ? 'jumlah' : '',
    ].filter(Boolean) : [];
    const payment = {
      id: editingDebtPaymentId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: debt.title || 'Utang',
      debt_id: debtId,
      amount,
      date: previous && previous.date ? previous.date : now,
      updated_at: now,
      status: 'active',
      log: previous ? appendHistoryLog(previous.log || '', changedFields.length ? `edited(${changedFields.join(', ')})` : 'edited', now) : `created(${formatHistoryTimestamp(now)})`,
      note: '',
    };
    if (existingIndex >= 0) cached.items[existingIndex] = payment;
    else cached.items.push(payment);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids.filter((id) => String(id) !== payment.id) : [];
    const activeItems = cached.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), count: activeItems.length };
    writeCache('debt_payment', cached);
    recalculateLocalDebtFromPayments();
    renderDebtPayments(cached);
    resetDebtPaymentForm();
    showToast(`${existingIndex >= 0 ? 'Pembayaran diperbarui' : 'Pembayaran disimpan'} di data lokal. Tekan Perbarui data untuk menyinkronkan.`);
  }

  function openDebtPaymentDeleteModal(item) {
    const modal = documentObject.querySelector('#debtPaymentDeleteModal');
    if (!modal || !item) return;
    pendingDebtPaymentDelete = { ...item };
    const message = documentObject.querySelector('#debtPaymentDeleteMessage');
    if (message) message.textContent = `Pembayaran untuk “${item.title || 'Utang'}” akan ditandai sebagai deleted dan disembunyikan dari riwayat.`;
    modal.hidden = false;
    windowObject.setTimeout(() => documentObject.querySelector('#confirmDebtPaymentDelete')?.focus(), 0);
  }

  function closeDebtPaymentDeleteModal() {
    const modal = documentObject.querySelector('#debtPaymentDeleteModal');
    if (modal) modal.hidden = true;
    pendingDebtPaymentDelete = null;
  }

  function confirmDebtPaymentDeleteAction() {
    if (!pendingDebtPaymentDelete) return;
    const cached = readCache('debt_payment');
    const id = String(pendingDebtPaymentDelete.id || '');
    const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
    if (!cached || !item) {
      closeDebtPaymentDeleteModal();
      return;
    }
    const now = new Date().toISOString();
    item.status = 'deleted';
    item.updated_at = now;
    item.log = appendHistoryLog(item.log, 'deleted', now);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids : [];
    if (!cached.deleted_ids.includes(id) && !id.startsWith('local_')) cached.deleted_ids.push(id);
    const activeItems = cached.items.filter((row) => String(row.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, row) => sum + (Number(row.amount) || 0), 0), count: activeItems.length };
    writeCache('debt_payment', cached);
    closeDebtPaymentDeleteModal();
    recalculateLocalDebtFromPayments();
    renderDebtPayments(cached);
    showToast('Pembayaran ditandai deleted di data lokal. Tekan Perbarui data untuk menyinkronkan.');
  }

  function bindDebtPaymentActions() {
    const list = documentObject.querySelector('#debtPaymentList');
    if (!list || list.dataset.bound === 'true') return;
    list.dataset.bound = 'true';
    list.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-debt-payment-action]');
      if (!button) return;
      const cached = readCache('debt_payment');
      const id = button.dataset.debtPaymentId || '';
      const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
      if (!item) return;
      if (button.dataset.debtPaymentAction === 'edit') openDebtPaymentEdit(item);
      else openDebtPaymentDeleteModal(item);
    });
  }

  function bindDebtActions() {
    const grid = documentObject.querySelector('#debtCardGrid');
    if (!grid || grid.dataset.debtActionsBound === 'true') return;
    grid.dataset.debtActionsBound = 'true';
    grid.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-debt-action]');
      if (!button) return;
      const cached = readCache('debt');
      const id = button.dataset.debtId || '';
      const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
      if (!item) return;
      if (button.dataset.debtAction === 'edit') openDebtModal(item);
      else openDebtDeleteModal(item);
    });
  }

  function setupDebtModal() {
    const form = documentObject.querySelector('#debtForm');
    const addButton = documentObject.querySelector('#addDebtItem');
    if (addButton && addButton.dataset.bound !== 'true') {
      addButton.dataset.bound = 'true';
      addButton.addEventListener('click', () => openDebtModal());
    }
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';
    documentObject.querySelector('#closeDebtModal')?.addEventListener('click', closeDebtModal);
    documentObject.querySelector('#cancelDebtModal')?.addEventListener('click', closeDebtModal);
    form.addEventListener('submit', (event) => { event.preventDefault(); saveLocalDebt(event.currentTarget); });
  }

  function setupDebtPaymentForm() {
    const form = documentObject.querySelector('#debtPaymentForm');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', (event) => { event.preventDefault(); saveLocalDebtPayment(event.currentTarget); });
    documentObject.querySelector('#cancelDebtPaymentEdit')?.addEventListener('click', resetDebtPaymentForm);
  }

  function setupDebtDeleteModal() {
    documentObject.querySelector('#closeDebtDeleteModal')?.addEventListener('click', closeDebtDeleteModal);
    documentObject.querySelector('#cancelDebtDeleteModal')?.addEventListener('click', closeDebtDeleteModal);
    documentObject.querySelector('#confirmDebtDelete')?.addEventListener('click', confirmDebtDeleteAction);
  }

  function setupDebtPaymentDeleteModal() {
    documentObject.querySelector('#closeDebtPaymentDeleteModal')?.addEventListener('click', closeDebtPaymentDeleteModal);
    documentObject.querySelector('#cancelDebtPaymentDeleteModal')?.addEventListener('click', closeDebtPaymentDeleteModal);
    documentObject.querySelector('#confirmDebtPaymentDelete')?.addEventListener('click', confirmDebtPaymentDeleteAction);
  }

  function loadDebtPayments(token, forceRefresh) {
    const cached = forceRefresh ? null : readCache('debt_payment');
    if (cached) {
      renderDebtPayments(cached);
      return Promise.resolve(cached);
    }
    return auth.callServer('getFinancePageData', { token, page: 'debt_payment' }).then((result) => {
      if (!result || !result.success) throw new Error(result && result.message || 'Riwayat pembayaran tidak dapat dimuat.');
      writeCache('debt_payment', result, { fromServer: true });
      renderDebtPayments(result);
      return result;
    }).catch((error) => {
      const list = documentObject.querySelector('#debtPaymentList');
      if (list) list.innerHTML = `<tr><td colspan="4" class="income-empty">${escapeHtml(error.message)}</td></tr>`;
      return null;
    });
  }

  function loadDebt(token, forceRefresh) {
    const container = pageContainer();
    if (container) container.innerHTML = debtShell();
    setText('.breadcrumb strong', 'Utang');
    setText('#currentDate', new Intl.DateTimeFormat(locale(), { dateStyle: 'full' }).format(new Date()));
    setupDebtModal();
    setupDebtPaymentForm();
    bindDebtActions();
    bindDebtPaymentActions();
    const cached = forceRefresh ? null : readCache('debt');
    if (cached) {
      renderDebt(cached);
      loadDebtPayments(token, forceRefresh);
      return;
    }
    documentObject.dispatchEvent(new Event('duit:data-loading'));
    auth.callServer('getFinancePageData', { token, page: 'debt' }).then((result) => {
      if (!result || !result.success) throw new Error(result && result.message || 'Data utang tidak dapat dimuat.');
      writeCache('debt', result, { fromServer: true });
      renderDebt(result);
      return loadDebtPayments(token, forceRefresh);
    }).catch((error) => {
      const grid = documentObject.querySelector('#debtCardGrid');
      if (grid) grid.innerHTML = `<p class="muted debt-empty">${escapeHtml(error.message)}</p>`;
    }).finally(() => documentObject.dispatchEvent(new Event('duit:data-loaded')));
  }

  function savingShell() {
    return '<section class="debt-screen saving-screen"><div class="debt-screen-heading"><div><h1>Tabungan</h1><p class="muted">Atur target dan pantau perkembangan tabunganmu.</p></div><button type="button" class="primary-button" id="addSavingItem"><svg><use href="#icon-plus"></use></svg> Tambah Target</button></div><section class="debt-card-section saving-card-section"><h2>Daftar Target Tabungan</h2><div id="savingCardGrid" class="debt-card-grid saving-card-grid"><p class="muted debt-empty">Memuat target tabungan...</p></div></section><section class="debt-payment-section saving-deposit-section"><div class="debt-payment-heading"><div><h2>Setoran Tabungan</h2><p class="muted">Tambahkan setoran ke target tabungan.</p></div></div><form id="savingDepositForm" class="debt-payment-form saving-deposit-form"><label>Target tabungan<select name="goal_id" id="savingDepositGoal" required><option value="">Pilih target</option></select></label><label>Jumlah yang ditabung<input name="amount" type="number" min="1" step="1" placeholder="0" required></label><div class="debt-payment-form-actions"><button type="button" class="secondary-button" id="cancelSavingDepositEdit" hidden>Batal</button><button type="submit" class="primary-button" id="savingDepositSubmit"><svg><use href="#icon-arrow-down"></use></svg> Setor</button></div></form></section><section class="debt-payment-history-section saving-deposit-history-section"><h2>Riwayat Setoran</h2><div class="debt-payment-table-wrap"><table class="debt-payment-table saving-deposit-table"><thead><tr><th>Tanggal</th><th>Target</th><th class="amount-column">Jumlah</th><th class="debt-payment-actions-header">Aksi</th></tr></thead><tbody id="savingDepositList"><tr><td colspan="4" class="income-empty">Memuat riwayat setoran...</td></tr></tbody></table></div></section></section>';
  }

  function renderSaving(result) {
    const grid = documentObject.querySelector('#savingCardGrid');
    if (!grid) return;
    const items = result && Array.isArray(result.items)
      ? result.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted')
      : [];
    grid.innerHTML = items.length ? items.map((item) => {
      const target = Number(item.target_amount == null ? (item.target == null ? (item.goal_amount == null ? item.amount : item.goal_amount) : item.target) : item.target_amount) || 0;
      const current = Number(item.current_amount == null ? (item.saved_amount == null ? item.amount : item.saved_amount) : item.current_amount) || 0;
      const title = item.title || item.name || item.goal_name || item.saving_goal || 'Target tabungan';
      const targetDate = item.date || item.target_date;
      const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      const savingStatus = String(item.saving_status || (current >= target && target > 0 ? 'completed' : 'on_progress')).toLowerCase() === 'completed' ? 'completed' : 'on_progress';
      return `<article class="saving-card ${savingStatus}" data-saving-id="${escapeHtml(item.id)}"><div class="saving-card-head"><div><strong>${escapeHtml(title)}</strong><span>Target tabungan</span></div><div class="saving-card-actions"><svg aria-hidden="true"><use href="#icon-piggy"></use></svg><button type="button" data-saving-action="edit" data-saving-id="${escapeHtml(item.id)}" aria-label="Ubah ${escapeHtml(title)}" title="Ubah"><svg><use href="#icon-edit"></use></svg></button><button type="button" data-saving-action="delete" data-saving-id="${escapeHtml(item.id)}" aria-label="Hapus ${escapeHtml(title)}" title="Hapus"><svg><use href="#icon-trash"></use></svg></button></div></div><div class="saving-card-progress"><div class="saving-progress-label"><small>Progress</small><strong>${percentage}%</strong></div><div class="saving-progress-bar"><span style="width:${percentage}%"></span></div></div><div class="saving-card-values"><div><small>Terkumpul</small><strong>${money(current)}</strong></div><div><small>Target</small><strong>${money(target)}</strong></div></div><div class="saving-card-due"><div><small>Tanggal target</small><strong>${escapeHtml(formatDate(targetDate))}</strong></div><span class="saving-status-badge ${savingStatus}">${savingStatus === 'completed' ? 'Selesai' : 'Berjalan'}</span></div></article>`;
    }).join('') : '<p class="muted debt-empty">Belum ada target tabungan.</p>';
    populateSavingDepositGoals();
  }

  function openSavingModal(saving) {
    const modal = documentObject.querySelector('#savingModal');
    const form = documentObject.querySelector('#savingForm');
    if (!modal || !form) return;
    form.reset();
    editingSavingId = saving ? String(saving.id || '') : '';
    const title = documentObject.querySelector('#savingModalTitle');
    const submit = documentObject.querySelector('#savingSubmitButton');
    if (title) title.textContent = editingSavingId ? 'Ubah Target' : 'Tambah Target';
    if (submit) submit.textContent = editingSavingId ? 'Simpan perubahan' : 'Simpan target';
    if (saving) {
      form.elements.name.value = saving.title || '';
      form.elements.target_amount.value = Number(saving.target_amount == null ? saving.amount : saving.target_amount) || 0;
      form.elements.current_amount.value = Number(saving.current_amount == null ? saving.amount : saving.current_amount) || 0;
      form.elements.target_date.value = String(saving.date || '').slice(0, 10);
    }
    modal.hidden = false;
    windowObject.setTimeout(() => form.elements.name?.focus(), 0);
  }

  function closeSavingModal() {
    const modal = documentObject.querySelector('#savingModal');
    if (modal) modal.hidden = true;
    editingSavingId = '';
    const title = documentObject.querySelector('#savingModalTitle');
    const submit = documentObject.querySelector('#savingSubmitButton');
    if (title) title.textContent = 'Tambah Target';
    if (submit) submit.textContent = 'Simpan target';
  }

  function saveLocalSaving(form) {
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const targetAmount = Number(formData.get('target_amount') || 0);
    const currentAmount = Number(formData.get('current_amount') || 0);
    const targetDate = String(formData.get('target_date') || '');
    if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0 || !Number.isFinite(currentAmount) || currentAmount < 0 || currentAmount > targetAmount || !targetDate) {
      showToast('Lengkapi data dan pastikan tabungan saat ini tidak melebihi target.');
      return;
    }
    const now = new Date().toISOString();
    const cached = readCache('saving') || { success: true, user: windowObject.DuitCurrentUser || {}, source_sheet: 'saving_goals', summary: { total: 0, count: 0 }, items: [] };
    cached.items = Array.isArray(cached.items) ? cached.items : [];
    const existingIndex = cached.items.findIndex((item) => String(item.id || '') === editingSavingId);
    const previous = existingIndex >= 0 ? cached.items[existingIndex] : null;
    const changedFields = previous ? [
      String(previous.title || '') !== name ? 'nama target' : '',
      Number(previous.target_amount == null ? previous.amount : previous.target_amount) !== targetAmount ? 'target' : '',
      Number(previous.current_amount == null ? previous.amount : previous.current_amount) !== currentAmount ? 'tabungan saat ini' : '',
      String(previous.date || '').slice(0, 10) !== targetDate ? 'tanggal target' : '',
    ].filter(Boolean) : [];
    const saving = {
      id: editingSavingId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: name,
      amount: currentAmount,
      target_amount: targetAmount,
      current_amount: currentAmount,
      date: targetDate,
      updated_at: now,
      status: 'active',
      saving_status: currentAmount >= targetAmount ? 'completed' : 'on_progress',
      log: previous ? appendHistoryLog(previous.log || '', changedFields.length ? `edited(${changedFields.join(', ')})` : 'edited', now) : `created(${formatHistoryTimestamp(now)})`,
      note: previous && previous.note || '',
    };
    if (existingIndex >= 0) cached.items[existingIndex] = saving;
    else cached.items.push(saving);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids.filter((id) => String(id) !== saving.id) : [];
    const activeItems = cached.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, item) => sum + (Number(item.current_amount == null ? item.amount : item.current_amount) || 0), 0), count: activeItems.length };
    writeCache('saving', cached);
    closeSavingModal();
    renderSaving(cached);
    showToast(`${existingIndex >= 0 ? 'Target tabungan diperbarui' : 'Target tabungan disimpan'} di data lokal. Tekan Perbarui data untuk menyinkronkan.`);
  }

  function openSavingDeleteModal(item) {
    const modal = documentObject.querySelector('#savingDeleteModal');
    if (!modal || !item) return;
    pendingSavingDelete = { ...item };
    const message = documentObject.querySelector('#savingDeleteMessage');
    if (message) message.textContent = `Target “${item.title || 'Tabungan'}” akan ditandai sebagai deleted dan disembunyikan dari daftar.`;
    modal.hidden = false;
    windowObject.setTimeout(() => documentObject.querySelector('#confirmSavingDelete')?.focus(), 0);
  }

  function closeSavingDeleteModal() {
    const modal = documentObject.querySelector('#savingDeleteModal');
    if (modal) modal.hidden = true;
    pendingSavingDelete = null;
  }

  function confirmSavingDeleteAction() {
    if (!pendingSavingDelete) return;
    const cached = readCache('saving');
    const id = String(pendingSavingDelete.id || '');
    const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
    if (!cached || !item) {
      closeSavingDeleteModal();
      return;
    }
    const now = new Date().toISOString();
    item.status = 'deleted';
    item.updated_at = now;
    item.log = appendHistoryLog(item.log, 'deleted', now);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids : [];
    if (!cached.deleted_ids.includes(id) && !id.startsWith('local_')) cached.deleted_ids.push(id);
    const activeItems = cached.items.filter((row) => String(row.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, row) => sum + (Number(row.current_amount == null ? row.amount : row.current_amount) || 0), 0), count: activeItems.length };
    writeCache('saving', cached);
    closeSavingDeleteModal();
    renderSaving(cached);
    showToast('Target tabungan ditandai deleted di data lokal. Tekan Perbarui data untuk menyinkronkan.');
  }

  function bindSavingActions() {
    const grid = documentObject.querySelector('#savingCardGrid');
    if (!grid || grid.dataset.bound === 'true') return;
    grid.dataset.bound = 'true';
    grid.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-saving-action]');
      if (!button) return;
      const cached = readCache('saving');
      const id = button.dataset.savingId || '';
      const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
      if (!item) return;
      if (button.dataset.savingAction === 'edit') openSavingModal(item);
      else openSavingDeleteModal(item);
    });
  }

  function activeSavingItems() {
    const cached = readCache('saving');
    return cached && Array.isArray(cached.items)
      ? cached.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted')
      : [];
  }

  function populateSavingDepositGoals(selectedId) {
    const select = documentObject.querySelector('#savingDepositGoal');
    if (!select) return;
    const items = activeSavingItems();
    const current = selectedId || select.value || '';
    select.innerHTML = '<option value="">Pilih target</option>' + items.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title || 'Target tabungan')}</option>`).join('');
    if (items.some((item) => String(item.id) === String(current))) select.value = current;
  }

  function renderSavingDeposits(result) {
    const list = documentObject.querySelector('#savingDepositList');
    if (!list) return;
    const items = result && Array.isArray(result.items)
      ? result.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted')
      : [];
    populateSavingDepositGoals();
    list.innerHTML = items.length ? items.map((item) => `<tr><td>${escapeHtml(formatDate(item.date))}</td><td>${escapeHtml(item.title || 'Target tabungan')}</td><td class="amount-cell">${money(item.amount)}</td><td class="debt-payment-actions"><button type="button" data-saving-deposit-action="edit" data-saving-deposit-id="${escapeHtml(item.id)}" aria-label="Ubah setoran" title="Ubah"><svg><use href="#icon-edit"></use></svg></button><button type="button" data-saving-deposit-action="delete" data-saving-deposit-id="${escapeHtml(item.id)}" aria-label="Hapus setoran" title="Hapus"><svg><use href="#icon-trash"></use></svg></button></td></tr>`).join('') : '<tr><td colspan="4" class="income-empty">Belum ada riwayat setoran.</td></tr>';
  }

  function resetSavingDepositForm() {
    const form = documentObject.querySelector('#savingDepositForm');
    const button = documentObject.querySelector('#savingDepositSubmit');
    const cancel = documentObject.querySelector('#cancelSavingDepositEdit');
    editingSavingDepositId = '';
    form?.reset();
    populateSavingDepositGoals();
    if (button) button.innerHTML = '<svg><use href="#icon-arrow-down"></use></svg> Setor';
    if (cancel) cancel.hidden = true;
  }

  function openSavingDepositEdit(item) {
    const form = documentObject.querySelector('#savingDepositForm');
    if (!form || !item) return;
    editingSavingDepositId = String(item.id || '');
    populateSavingDepositGoals(item.goal_id);
    form.elements.goal_id.value = item.goal_id || '';
    form.elements.amount.value = Number(item.amount) || 0;
    const button = documentObject.querySelector('#savingDepositSubmit');
    const cancel = documentObject.querySelector('#cancelSavingDepositEdit');
    if (button) button.innerHTML = '<svg><use href="#icon-edit"></use></svg> Simpan perubahan';
    if (cancel) cancel.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function updateLocalSavingBalance(goalId, delta) {
    const cached = readCache('saving');
    if (!cached || !Array.isArray(cached.items)) return;
    const goal = cached.items.find((item) => String(item.id || '') === String(goalId));
    if (!goal) return;
    const target = Number(goal.target_amount == null ? goal.amount : goal.target_amount) || 0;
    const current = Number(goal.current_amount == null ? goal.amount : goal.current_amount) || 0;
    goal.current_amount = Math.max(0, Math.min(target, current + delta));
    goal.amount = goal.current_amount;
    goal.saving_status = goal.current_amount >= target && target > 0 ? 'completed' : 'on_progress';
    goal.updated_at = new Date().toISOString();
    const activeItems = cached.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, item) => sum + (Number(item.current_amount == null ? item.amount : item.current_amount) || 0), 0), count: activeItems.length };
    writeCache('saving', cached);
    renderSaving(cached);
  }

  function saveLocalSavingDeposit(form) {
    const formData = new FormData(form);
    const goalId = String(formData.get('goal_id') || '').trim();
    const amount = Number(formData.get('amount') || 0);
    const goal = activeSavingItems().find((item) => String(item.id || '') === goalId);
    if (!goal || !Number.isFinite(amount) || amount <= 0) {
      showToast('Pilih target dan masukkan jumlah setoran yang valid.');
      return;
    }
    const cached = readCache('saving_deposit') || { success: true, user: windowObject.DuitCurrentUser || {}, source_sheet: 'saving_goal_transactions', summary: { total: 0, count: 0 }, items: [] };
    cached.items = Array.isArray(cached.items) ? cached.items : [];
    const existingIndex = cached.items.findIndex((item) => String(item.id || '') === editingSavingDepositId);
    const previous = existingIndex >= 0 ? cached.items[existingIndex] : null;
    const oldAmount = previous ? Number(previous.amount) || 0 : 0;
    const currentGoal = Number(goal.current_amount == null ? goal.amount : goal.current_amount) || 0;
    const target = Number(goal.target_amount == null ? goal.amount : goal.target_amount) || 0;
    const adjustment = amount - (previous && String(previous.goal_id || '') === goalId ? oldAmount : 0);
    if (currentGoal + adjustment > target) {
      showToast('Jumlah setoran melebihi sisa target tabungan.');
      return;
    }
    const now = new Date().toISOString();
    const changedFields = previous ? [
      String(previous.goal_id || '') !== goalId ? 'target tabungan' : '',
      Number(previous.amount) !== amount ? 'jumlah setoran' : '',
    ].filter(Boolean) : [];
    const deposit = {
      id: editingSavingDepositId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: goal.title || 'Target tabungan',
      goal_id: goalId,
      amount,
      date: previous && previous.date ? previous.date : now,
      updated_at: now,
      status: 'active',
      log: previous ? appendHistoryLog(previous.log || '', changedFields.length ? `edited(${changedFields.join(', ')})` : 'edited', now) : `created(${formatHistoryTimestamp(now)})`,
      note: '',
    };
    if (existingIndex >= 0) cached.items[existingIndex] = deposit;
    else cached.items.push(deposit);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids.filter((id) => String(id) !== deposit.id) : [];
    const activeItems = cached.items.filter((item) => String(item.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), count: activeItems.length };
    writeCache('saving_deposit', cached);
    if (previous && String(previous.goal_id || '') !== goalId) {
      updateLocalSavingBalance(previous.goal_id, -oldAmount);
      updateLocalSavingBalance(goalId, amount);
    } else {
      updateLocalSavingBalance(goalId, adjustment);
    }
    renderSavingDeposits(cached);
    resetSavingDepositForm();
    showToast(`${existingIndex >= 0 ? 'Setoran diperbarui' : 'Setoran disimpan'} di data lokal. Tekan Perbarui data untuk menyinkronkan.`);
  }

  function openSavingDepositDeleteModal(item) {
    const modal = documentObject.querySelector('#savingDepositDeleteModal');
    if (!modal || !item) return;
    pendingSavingDepositDelete = { ...item };
    const message = documentObject.querySelector('#savingDepositDeleteMessage');
    if (message) message.textContent = `Setoran untuk “${item.title || 'Target tabungan'}” akan ditandai sebagai deleted dan disembunyikan dari riwayat.`;
    modal.hidden = false;
    windowObject.setTimeout(() => documentObject.querySelector('#confirmSavingDepositDelete')?.focus(), 0);
  }

  function closeSavingDepositDeleteModal() {
    const modal = documentObject.querySelector('#savingDepositDeleteModal');
    if (modal) modal.hidden = true;
    pendingSavingDepositDelete = null;
  }

  function confirmSavingDepositDeleteAction() {
    if (!pendingSavingDepositDelete) return;
    const cached = readCache('saving_deposit');
    const id = String(pendingSavingDepositDelete.id || '');
    const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
    if (!cached || !item) {
      closeSavingDepositDeleteModal();
      return;
    }
    const now = new Date().toISOString();
    item.status = 'deleted';
    item.updated_at = now;
    item.log = appendHistoryLog(item.log, 'deleted', now);
    cached.deleted_ids = Array.isArray(cached.deleted_ids) ? cached.deleted_ids : [];
    if (!cached.deleted_ids.includes(id) && !id.startsWith('local_')) cached.deleted_ids.push(id);
    const activeItems = cached.items.filter((row) => String(row.status || 'active').toLowerCase() !== 'deleted');
    cached.summary = { total: activeItems.reduce((sum, row) => sum + (Number(row.amount) || 0), 0), count: activeItems.length };
    writeCache('saving_deposit', cached);
    updateLocalSavingBalance(item.goal_id, -(Number(item.amount) || 0));
    closeSavingDepositDeleteModal();
    renderSavingDeposits(cached);
    showToast('Setoran ditandai deleted di data lokal. Tekan Perbarui data untuk menyinkronkan.');
  }

  function bindSavingDepositActions() {
    const list = documentObject.querySelector('#savingDepositList');
    if (!list || list.dataset.bound === 'true') return;
    list.dataset.bound = 'true';
    list.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-saving-deposit-action]');
      if (!button) return;
      const cached = readCache('saving_deposit');
      const id = button.dataset.savingDepositId || '';
      const item = cached && Array.isArray(cached.items) ? cached.items.find((row) => String(row.id) === id) : null;
      if (!item) return;
      if (button.dataset.savingDepositAction === 'edit') openSavingDepositEdit(item);
      else openSavingDepositDeleteModal(item);
    });
  }

  function setupSavingModal() {
    const form = documentObject.querySelector('#savingForm');
    const addButton = documentObject.querySelector('#addSavingItem');
    if (addButton && addButton.dataset.bound !== 'true') {
      addButton.dataset.bound = 'true';
      addButton.addEventListener('click', () => openSavingModal());
    }
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';
    documentObject.querySelector('#closeSavingModal')?.addEventListener('click', closeSavingModal);
    documentObject.querySelector('#cancelSavingModal')?.addEventListener('click', closeSavingModal);
    form.addEventListener('submit', (event) => { event.preventDefault(); saveLocalSaving(event.currentTarget); });
  }

  function setupSavingDepositForm() {
    const form = documentObject.querySelector('#savingDepositForm');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', (event) => { event.preventDefault(); saveLocalSavingDeposit(event.currentTarget); });
    documentObject.querySelector('#cancelSavingDepositEdit')?.addEventListener('click', resetSavingDepositForm);
  }

  function setupSavingDeleteModal() {
    documentObject.querySelector('#closeSavingDeleteModal')?.addEventListener('click', closeSavingDeleteModal);
    documentObject.querySelector('#cancelSavingDeleteModal')?.addEventListener('click', closeSavingDeleteModal);
    documentObject.querySelector('#confirmSavingDelete')?.addEventListener('click', confirmSavingDeleteAction);
  }

  function setupSavingDepositDeleteModal() {
    documentObject.querySelector('#closeSavingDepositDeleteModal')?.addEventListener('click', closeSavingDepositDeleteModal);
    documentObject.querySelector('#cancelSavingDepositDeleteModal')?.addEventListener('click', closeSavingDepositDeleteModal);
    documentObject.querySelector('#confirmSavingDepositDelete')?.addEventListener('click', confirmSavingDepositDeleteAction);
  }

  function loadSavingDeposits(token, forceRefresh) {
    const cached = forceRefresh ? null : readCache('saving_deposit');
    if (cached) {
      renderSavingDeposits(cached);
      return Promise.resolve(cached);
    }
    return auth.callServer('getFinancePageData', { token, page: 'saving_deposit' }).then((result) => {
      if (!result || !result.success) throw new Error(result && result.message || 'Riwayat setoran tidak dapat dimuat.');
      writeCache('saving_deposit', result, { fromServer: true });
      renderSavingDeposits(result);
      return result;
    }).catch((error) => {
      const list = documentObject.querySelector('#savingDepositList');
      if (list) list.innerHTML = `<tr><td colspan="4" class="income-empty">${escapeHtml(error.message)}</td></tr>`;
      return null;
    });
  }

  function loadSaving(token, forceRefresh) {
    const container = pageContainer();
    if (container) container.innerHTML = savingShell();
    setText('.breadcrumb strong', 'Tabungan');
    setText('#currentDate', new Intl.DateTimeFormat(locale(), { dateStyle: 'full' }).format(new Date()));
    setupSavingModal();
    setupSavingDepositForm();
    bindSavingActions();
    bindSavingDepositActions();
    const cached = forceRefresh ? null : readCache('saving');
    if (cached) {
      renderSaving(cached);
      loadSavingDeposits(token, forceRefresh);
      return;
    }
    documentObject.dispatchEvent(new Event('duit:data-loading'));
    auth.callServer('getFinancePageData', { token, page: 'saving' }).then((result) => {
      if (!result || !result.success) throw new Error(result && result.message || 'Data tabungan tidak dapat dimuat.');
      writeCache('saving', result, { fromServer: true });
      renderSaving(result);
      return loadSavingDeposits(token, forceRefresh);
    }).catch((error) => {
      const grid = documentObject.querySelector('#savingCardGrid');
      if (grid) grid.innerHTML = `<p class="muted debt-empty">${escapeHtml(error.message)}</p>`;
    }).finally(() => documentObject.dispatchEvent(new Event('duit:data-loaded')));
  }

  function loadFinance(token, config, forceRefresh) {
    const container = pageContainer();
    if (container) container.innerHTML = financeShell(config);
    setText('.breadcrumb strong', config.title);
    setText('#currentDate', new Intl.DateTimeFormat(locale(), { dateStyle: 'full' }).format(new Date()));
    bindAddButton(config);
    if (config.key === 'wallet') bindWalletActions();
    if (config.key === 'category') bindCategoryActions();
    if (config.key === 'transaction') bindTransactionActions();
    const cached = forceRefresh ? null : readCache(config.key);
    if (cached) {
      renderFinance(cached, config);
      return;
    }
    documentObject.dispatchEvent(new Event('duit:data-loading'));
    auth.callServer('getFinancePageData', { token, page: config.key }).then((result) => {
      if (!result || !result.success) throw new Error(result && result.message || 'Data tidak dapat dimuat.');
      writeCache(config.key, result, { fromServer: true });
      renderFinance(result, config);
    }).catch((error) => {
      const list = documentObject.querySelector('#financeList');
      if (list) list.innerHTML = `<tr><td colspan="4" class="income-empty">${escapeHtml(error.message)}</td></tr>`;
    }).finally(() => documentObject.dispatchEvent(new Event('duit:data-loaded')));
  }

  function reportShell() {
    return `<section class="report-screen">
      <div class="report-content">
        <div class="dashboard-card-grid">
          <button type="button" class="dashboard-total-card" id="dashboardTotalCard" aria-haspopup="dialog"><span class="dashboard-total-label">Total Saldo</span><strong id="dashboardTotalMoney">Rp 0</strong></button>
          <button type="button" class="dashboard-summary-card dashboard-income-card" data-dashboard-breakdown="income" aria-haspopup="dialog"><span class="dashboard-summary-label">Pemasukan</span><strong id="dashboardIncomeTotal">Rp 0</strong><small>Lihat per kategori</small></button>
          <button type="button" class="dashboard-summary-card dashboard-expense-card" data-dashboard-breakdown="expense" aria-haspopup="dialog"><span class="dashboard-summary-label">Pengeluaran</span><strong id="dashboardExpenseTotal">Rp 0</strong><small>Lihat per kategori</small></button>
        </div>
        <section class="panel report-filter-panel">
          <div class="report-filter-heading"><div><p class="eyebrow">LAPORAN KEUANGAN</p><h1>Laporan transaksi</h1><p class="report-page-intro">Tinjau pemasukan, pengeluaran, dan aktivitas keuangan berdasarkan filter.</p></div><div class="report-header-date"><span>TANGGAL HARI INI</span><strong id="reportHeaderDate"></strong></div></div>
          <div class="report-filters">
            <label>Tipe<select id="reportType"><option value="all">Semua tipe</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></label>
            <label>Kategori<select id="reportCategory"><option value="all">Semua kategori</option></select></label>
            <label>Periode<select id="reportPeriod"><option value="all">Semua waktu</option><option value="date">Tanggal tertentu</option><option value="range">Rentang tanggal</option><option value="month">Bulanan</option></select></label>
            <label id="reportDateField" hidden>Tanggal<input id="reportDate" type="date"></label>
            <label id="reportStartField" hidden>Dari<input id="reportStartDate" type="date"></label>
            <label id="reportEndField" hidden>Sampai<input id="reportEndDate" type="date"></label>
            <label id="reportMonthField" hidden>Bulan<input id="reportMonth" type="month"></label>
          </div>
        </section>
        <section class="panel report-chart-panel"><div class="report-panel-heading"><div><h2>Grafik transaksi</h2><p class="muted" id="reportResultSummary">0 transaksi</p></div></div><div id="reportChart" class="report-chart"></div></section>
        <section class="panel report-list-panel"><div class="report-panel-heading"><h2>Daftar transaksi</h2></div><div id="reportList" class="report-list"></div></section>
        <div class="report-export-actions report-export-footer" aria-label="Ekspor dan cetak laporan">
          <button type="button" class="report-action-button report-action-csv" id="reportExportCsv">Export CSV</button>
          <button type="button" class="report-action-button report-action-xls" id="reportExportXls">Export XLS</button>
          <button type="button" class="report-action-button report-action-pdf" id="reportExportPdf">Export PDF</button>
          <button type="button" class="report-action-button report-action-print" id="reportPrint"><svg aria-hidden="true"><use href="#icon-printer"></use></svg><span>Cetak</span></button>
        </div>
        <div class="modal-backdrop report-print-preview-backdrop" id="reportPrintPreview" hidden>
          <section class="data-modal report-print-preview-modal" role="dialog" aria-modal="true" aria-labelledby="reportPrintPreviewTitle">
            <div class="data-modal-header"><div><p class="eyebrow">Pratinjau dokumen</p><h2 id="reportPrintPreviewTitle">Laporan transaksi</h2></div><button type="button" class="modal-close" id="closeReportPrintPreview" aria-label="Tutup pratinjau">&times;</button></div>
            <div class="report-print-options">
              <label for="reportPrintPaper">Ukuran kertas<select id="reportPrintPaper"><option value="A4">A4 · 210 × 297 mm</option><option value="A3">A3 · 297 × 420 mm</option><option value="A5">A5 · 148 × 210 mm</option><option value="B4">B4 · 250 × 353 mm</option><option value="B5">B5 · 176 × 250 mm</option><option value="Letter">Letter · 216 × 279 mm</option><option value="Legal">Legal · 216 × 356 mm</option><option value="Tabloid">Tabloid · 279 × 432 mm</option><option value="Thermal58">Thermal struk · 58 mm (roll)</option><option value="Thermal80">Thermal struk · 80 mm (roll)</option></select></label>
              <label for="reportPrintOrientation">Orientasi<select id="reportPrintOrientation"><option value="portrait">Potret</option><option value="landscape">Lanskap</option></select></label>
            </div>
            <div class="report-print-preview-scroll"><div class="report-print-preview-document" id="reportPrintPreviewDocument"></div></div>
            <div class="report-print-preview-actions"><button type="button" class="secondary-button" id="cancelReportPrint">Kembali</button><button type="button" class="primary-button" id="confirmReportPrint"><svg><use href="#icon-printer"></use></svg>Cetak dokumen</button></div>
          </section>
        </div>
      </div>
    </section>`;
  }

  function reportCategoryLabel(item) {
    return dashboardCategoryName(item);
  }

  function reportFilteredItems() {
    const type = documentObject.querySelector('#reportType')?.value || 'all';
    const category = documentObject.querySelector('#reportCategory')?.value || 'all';
    const period = documentObject.querySelector('#reportPeriod')?.value || 'all';
    const date = documentObject.querySelector('#reportDate')?.value || '';
    const start = documentObject.querySelector('#reportStartDate')?.value || '';
    const end = documentObject.querySelector('#reportEndDate')?.value || '';
    const month = documentObject.querySelector('#reportMonth')?.value || '';
    return dashboardTransactionItems().filter((item) => {
      if (type !== 'all' && dashboardTransactionType(item) !== type) return false;
      if (category !== 'all' && reportCategoryLabel(item) !== category) return false;
      const itemDate = dateInputValue(item.date);
      if (period === 'date' && itemDate !== date) return false;
      if (period === 'range' && ((start && itemDate < start) || (end && itemDate > end))) return false;
      if (period === 'month' && itemDate.slice(0, 7) !== month) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  function renderReportChart(items) {
    const chart = documentObject.querySelector('#reportChart');
    if (!chart) return;
    if (!items.length) {
      chart.innerHTML = '<p class="muted report-empty">Tidak ada data untuk filter yang dipilih.</p>';
      return;
    }
    const grouped = new Map();
    items.forEach((item) => {
      const key = dateInputValue(item.date);
      const current = grouped.get(key) || { income: 0, expense: 0 };
      const type = dashboardTransactionType(item);
      if (type === 'income') current.income += Number(item.amount) || 0;
      if (type === 'expense') current.expense += Number(item.amount) || 0;
      grouped.set(key, current);
    });
    const points = [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const width = 760;
    const height = 280;
    const pad = { top: 20, right: 20, bottom: 42, left: 62 };
    const max = Math.max(1, ...points.map(([, value]) => Math.max(value.income, value.expense)));
    const x = (index) => pad.left + (points.length === 1 ? (width - pad.left - pad.right) / 2 : index * ((width - pad.left - pad.right) / (points.length - 1)));
    const y = (value) => height - pad.bottom - (value / max) * (height - pad.top - pad.bottom);
    const incomePoints = points.map(([, value], index) => `${x(index)},${y(value.income)}`).join(' ');
    const expensePoints = points.map(([, value], index) => `${x(index)},${y(value.expense)}`).join(' ');
    const labels = points.map(([date], index) => index % Math.max(1, Math.ceil(points.length / 7)) === 0 ? `<text x="${x(index)}" y="${height - 15}" text-anchor="middle">${escapeHtml(formatDate(date))}</text>` : '').join('');
    chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" class="report-line-chart" role="img" aria-label="Grafik transaksi"><line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" class="report-axis"></line><line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}" class="report-axis"></line><polyline points="${incomePoints}" class="report-line report-income-line"></polyline><polyline points="${expensePoints}" class="report-line report-expense-line"></polyline>${points.map(([, value], index) => `<circle cx="${x(index)}" cy="${y(value.income)}" r="3.5" class="report-income-point"></circle><circle cx="${x(index)}" cy="${y(value.expense)}" r="3.5" class="report-expense-point"></circle>`).join('')}${labels}</svg><div class="report-chart-legend"><span><i class="report-income-key"></i>Pemasukan</span><span><i class="report-expense-key"></i>Pengeluaran</span></div>`;
  }

  function renderReportList(items) {
    const list = documentObject.querySelector('#reportList');
    const summary = documentObject.querySelector('#reportResultSummary');
    if (summary) summary.textContent = `${items.length} transaksi`;
    if (!list) return;
    list.innerHTML = items.length ? items.map((item) => `<div class="report-list-row"><div><strong>${escapeHtml(item.note || item.title || reportCategoryLabel(item))}</strong><small>${escapeHtml(formatDate(item.date))} - ${escapeHtml(categoryTypeLabel(dashboardTransactionType(item)))} - ${escapeHtml(reportCategoryLabel(item))}</small></div><b>${escapeHtml(money(item.amount))}</b></div>`).join('') : '<p class="muted report-empty">Tidak ada transaksi untuk filter yang dipilih.</p>';
  }

  function renderReport() {
    const items = reportFilteredItems();
    renderReportChart(items);
    renderReportList(items);
  }

  function populateReportCategories(type) {
    const select = documentObject.querySelector('#reportCategory');
    if (!select) return;
    const selectedType = type || documentObject.querySelector('#reportType')?.value || 'all';
    const names = [...new Set(dashboardTransactionItems().filter((item) => selectedType === 'all' || dashboardTransactionType(item) === selectedType).map(reportCategoryLabel))].sort((a, b) => a.localeCompare(b, 'id'));
    select.innerHTML = '<option value="all">Semua kategori</option>' + names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
    select.value = 'all';
  }

  function updateReportPeriodFields() {
    const period = documentObject.querySelector('#reportPeriod')?.value || 'all';
    const fields = { date: '#reportDateField', range: '#reportStartField,#reportEndField', month: '#reportMonthField' };
    Object.values(fields).forEach((selector) => selector.split(',').forEach((item) => { const field = documentObject.querySelector(item); if (field) field.hidden = true; }));
    if (fields[period]) fields[period].split(',').forEach((selector) => { const field = documentObject.querySelector(selector); if (field) field.hidden = false; });
  }

  function reportExportRows() {
    return reportFilteredItems().map((item) => {
      const type = dashboardTransactionType(item);
      const category = type === 'transfer' ? (String(item.note || '').trim() || '-') : reportCategoryLabel(item);
      return [formatDate(item.date), categoryTypeLabel(type), category, Number(item.amount) || 0, item.note || item.title || ''];
    });
  }

  function downloadReportFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = windowObject.URL.createObjectURL(blob);
    const anchor = documentObject.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    documentObject.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    windowObject.setTimeout(() => windowObject.URL.revokeObjectURL(url), 500);
  }

  function exportReportCsv() {
    const rows = [['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Keterangan'], ...reportExportRows()];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${String(value == null ? '' : value).replace(/"/g, '""')}"`).join(',')).join('\r\n')}`;
    downloadReportFile(csv, 'laporan-transaksi.csv', 'text/csv;charset=utf-8');
  }

  function exportReportXls() {
    const rows = [['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Keterangan'], ...reportExportRows()];
    const table = `<table><thead><tr>${rows[0].map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    downloadReportFile(`<!doctype html><html><meta charset="utf-8"><body>${table}</body></html>`, 'laporan-transaksi.xls', 'application/vnd.ms-excel;charset=utf-8');
  }

  function reportPrintContentHtml(paper) {
    const items = reportFilteredItems();
    const rows = reportExportRows();
    const typeLabel = documentObject.querySelector('#reportType')?.selectedOptions[0]?.textContent || 'Semua tipe';
    const categoryLabel = documentObject.querySelector('#reportCategory')?.selectedOptions[0]?.textContent || 'Semua kategori';
    const periodLabel = documentObject.querySelector('#reportPeriod')?.selectedOptions[0]?.textContent || 'Semua waktu';
    const dateDetails = [
      documentObject.querySelector('#reportDate')?.value,
      documentObject.querySelector('#reportStartDate')?.value,
      documentObject.querySelector('#reportEndDate')?.value,
      documentObject.querySelector('#reportMonth')?.value,
    ].filter(Boolean).join(' – ');
    const periodInfo = [periodLabel, dateDetails].filter(Boolean).join(' · ');
    const filters = [typeLabel, categoryLabel, periodInfo].filter(Boolean).map(escapeHtml).join(' · ');
    const totals = items.reduce((summary, item) => {
      const amount = Number(item.amount) || 0;
      const type = dashboardTransactionType(item);
      if (type === 'income') summary.income += amount;
      else if (type === 'expense') summary.expense += amount;
      else if (type === 'transfer') summary.transfer += amount;
      return summary;
    }, { income: 0, expense: 0, transfer: 0 });
    const generatedAt = escapeHtml(new Intl.DateTimeFormat(locale(), { dateStyle: 'long', timeStyle: 'short' }).format(new Date()));
    const ownerName = String(windowObject.DuitCurrentUser && windowObject.DuitCurrentUser.full_name || '').trim();
    if (paper && paper.thermal) {
      const receiptRows = rows.map((row) => `<article class="print-receipt-item"><div class="print-receipt-heading"><strong>${escapeHtml(row[1])}</strong><span>${escapeHtml(row[0])}</span></div><p><span>Kategori</span><b>${escapeHtml(row[2])}</b></p><p><span>Catatan</span><b>${escapeHtml(row[4] || '-')}</b></p><p class="print-receipt-amount"><span>Jumlah</span><b>${escapeHtml(money(row[3]))}</b></p></article>`).join('');
      return `<article class="print-report-document print-thermal"><div class="print-thermal-brand">DUIT · LAPORAN KEUANGAN</div><h1>Laporan transaksi</h1><p class="print-report-meta">Dicetak ${generatedAt}</p><div class="print-thermal-summary"><p><span>Transaksi</span><b>${items.length}</b></p><p><span>Pemasukan</span><b>${escapeHtml(money(totals.income))}</b></p><p><span>Pengeluaran</span><b>${escapeHtml(money(totals.expense))}</b></p><p><span>Transfer</span><b>${escapeHtml(money(totals.transfer))}</b></p></div><p class="print-thermal-period">${filters}</p><div class="print-receipt-list">${receiptRows || '<p class="print-receipt-empty">Tidak ada transaksi.</p>'}</div></article>`;
    }
    return `<article class="print-report-document"><div class="print-report-brand"><strong>DUIT</strong><span>LAPORAN KEUANGAN</span></div><header class="print-report-heading"><div><p class="print-report-kicker">RINGKASAN TRANSAKSI</p><h1>Laporan transaksi</h1><p class="print-report-subtitle">Ringkasan aktivitas keuangan berdasarkan filter yang dipilih.</p></div><div class="print-report-generated"><span>DICETAK PADA</span><strong>${generatedAt}</strong>${ownerName ? `<small>${escapeHtml(ownerName)}</small>` : ''}</div></header><section class="print-report-summary"><div><span>Jumlah transaksi</span><strong>${items.length}</strong></div><div><span>Total pemasukan</span><strong>${escapeHtml(money(totals.income))}</strong></div><div><span>Total pengeluaran</span><strong>${escapeHtml(money(totals.expense))}</strong></div><div><span>Total transfer</span><strong>${escapeHtml(money(totals.transfer))}</strong></div></section><section class="print-report-filters"><div><span>Periode</span><strong>${escapeHtml(periodInfo)}</strong></div><div><span>Tipe transaksi</span><strong>${escapeHtml(typeLabel)}</strong></div><div><span>Kategori</span><strong>${escapeHtml(categoryLabel)}</strong></div></section><table><thead><tr><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Jumlah</th><th>Keterangan</th></tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></article>`;
  }

  const reportPaperSizes = {
    A4: { width: 210, height: 297, css: 'A4' },
    A3: { width: 297, height: 420, css: 'A3' },
    A5: { width: 148, height: 210, css: 'A5' },
    B4: { width: 250, height: 353, css: 'B4' },
    B5: { width: 176, height: 250, css: 'B5' },
    Letter: { width: 215.9, height: 279.4, css: 'Letter' },
    Legal: { width: 215.9, height: 355.6, css: 'Legal' },
    Tabloid: { width: 279.4, height: 431.8, css: 'Tabloid' },
    Thermal58: { width: 58, height: 120, css: 'Thermal58', thermal: true },
    Thermal80: { width: 80, height: 120, css: 'Thermal80', thermal: true },
  };

  function selectedReportPaper() {
    const key = documentObject.querySelector('#reportPrintPaper')?.value || 'A4';
    const selected = reportPaperSizes[key] || reportPaperSizes.A4;
    const orientation = !selected.thermal && documentObject.querySelector('#reportPrintOrientation')?.value === 'landscape' ? 'landscape' : 'portrait';
    if (selected.thermal) {
      const charsPerLine = selected.width < 70 ? 18 : 28;
      const contentHeight = reportFilteredItems().reduce((height, item) => {
        const note = String(item.note || item.title || '').length;
        return height + 24 + Math.max(0, Math.ceil(note / charsPerLine) - 1) * 3.5;
      }, 70);
      const filterHeight = Math.max(0, Math.ceil(reportPrintFilterLabel().length / charsPerLine) - 1) * 3.5;
      return { ...selected, orientation, height: Math.max(80, contentHeight + filterHeight) };
    }
    return { ...selected, orientation, width: orientation === 'landscape' ? selected.height : selected.width, height: orientation === 'landscape' ? selected.width : selected.height };
  }

  function reportPrintFilterLabel() {
    return [
      documentObject.querySelector('#reportType')?.selectedOptions[0]?.textContent || 'Semua tipe',
      documentObject.querySelector('#reportCategory')?.selectedOptions[0]?.textContent || 'Semua kategori',
      documentObject.querySelector('#reportPeriod')?.selectedOptions[0]?.textContent || 'Semua waktu',
    ].join(' · ');
  }

  function updateReportPreviewPaper() {
    const preview = documentObject.querySelector('#reportPrintPreviewDocument');
    const scroll = documentObject.querySelector('.report-print-preview-scroll');
    if (!preview || !scroll) return;
    const paper = selectedReportPaper();
    const orientationControl = documentObject.querySelector('#reportPrintOrientation');
    if (orientationControl) {
      orientationControl.disabled = Boolean(paper.thermal);
      if (paper.thermal) orientationControl.value = 'portrait';
    }
    const widthPx = paper.width * 96 / 25.4;
    const previewHeight = paper.height;
    const heightPx = previewHeight * 96 / 25.4;
    const zoom = Math.min(1, Math.max(.25, (scroll.clientWidth - 8) / widthPx));
    preview.style.width = `${widthPx}px`;
    preview.style.maxWidth = 'none';
    preview.style.minHeight = `${heightPx}px`;
    preview.style.zoom = String(zoom);
    preview.style.aspectRatio = `${paper.width} / ${previewHeight}`;
    preview.classList.toggle('is-thermal', Boolean(paper.thermal));
  }

  function reportPrintDocumentHtml() {
    const paper = selectedReportPaper();
    const pageSize = paper.thermal ? `${paper.width}mm ${paper.height}mm` : `${paper.css} ${paper.orientation}`;
    const pageMargin = paper.thermal ? '3mm' : '12mm';
    const styles = `@page{size:${pageSize};margin:${pageMargin}}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#222;background:#f3f4f8;padding:24px}.print-report-document{width:100%;max-width:900px;margin:0 auto;padding:24px;background:#fff}.print-report-brand{display:flex;align-items:center;gap:8px;padding-bottom:12px;border-bottom:2px solid #6254dc;color:#6254dc;font-size:10px;font-weight:bold;letter-spacing:.7px}.print-report-brand strong{font-size:14px}.print-report-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding:18px 0 14px}.print-report-kicker{margin:0 0 5px;color:#6254dc;font-size:9px;font-weight:bold;letter-spacing:1px}.print-report-heading h1{margin:0 0 5px;font-size:23px}.print-report-subtitle{margin:0;color:#666;font-size:10px}.print-report-generated{display:flex;flex-direction:column;gap:4px;max-width:220px;text-align:right}.print-report-generated span{color:#777;font-size:8px;font-weight:bold;letter-spacing:.7px}.print-report-generated strong{font-size:10px}.print-report-generated small{color:#666;font-size:9px}.print-report-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:4px 0 12px}.print-report-summary div{display:flex;flex-direction:column;gap:5px;padding:9px;border:1px solid #e1e3e9;border-radius:6px;background:#fafbfc}.print-report-summary span,.print-report-filters span{color:#777;font-size:8px}.print-report-summary strong{font-size:11px}.print-report-filters{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:8px;margin:0 0 16px;padding:9px 0;border-top:1px solid #e1e3e9;border-bottom:1px solid #e1e3e9}.print-report-filters div{display:flex;flex-direction:column;gap:4px;min-width:0}.print-report-filters strong{font-size:9px;overflow-wrap:anywhere}table{width:100%;table-layout:fixed;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:6px;text-align:left;vertical-align:top;overflow-wrap:anywhere;word-break:break-word}th{background:#f2f2f2;font-size:9px}td{font-size:9px}tr{break-inside:avoid}th:nth-child(1){width:13%}th:nth-child(2){width:12%}th:nth-child(3){width:20%}th:nth-child(4){width:16%}th:nth-child(5){width:39%}.print-thermal{max-width:none;padding:3mm}.print-thermal .print-thermal-brand{justify-content:center;padding-bottom:5px;font-size:8px}.print-thermal .print-thermal-brand strong{font-size:9px}.print-thermal h1{margin:5px 0;text-align:center;font-size:12px}.print-thermal .print-report-meta{text-align:center;font-size:8px}.print-thermal-summary{margin:7px 0;padding:5px 0;border-top:1px dashed #888;border-bottom:1px dashed #888}.print-thermal-summary p{display:flex;justify-content:space-between;gap:4px;margin:3px 0;font-size:8px}.print-thermal-period{margin:5px 0;font-size:8px;overflow-wrap:anywhere}.print-receipt-item{padding:7px 0;border-top:1px dashed #888;break-inside:avoid}.print-receipt-heading,.print-receipt-item p{display:flex;justify-content:space-between;gap:5px;margin:3px 0;font-size:9px}.print-receipt-heading{font-size:10px}.print-receipt-item p span{flex:0 0 auto}.print-receipt-item p b{text-align:right;overflow-wrap:anywhere}.print-receipt-amount{padding-top:4px;border-top:1px dotted #aaa;font-weight:bold}.print-receipt-empty{text-align:center;font-size:9px}@media print{body{padding:0;background:#fff}.print-report-document{max-width:none;padding:0}.print-thermal{padding:0}}`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>Laporan transaksi</title><style>${styles}</style></head><body>${reportPrintContentHtml(paper)}</body></html>`;
  }

  function openReportPrintPreview() {
    const modal = documentObject.querySelector('#reportPrintPreview');
    const content = documentObject.querySelector('#reportPrintPreviewDocument');
    if (!modal || !content) return;
    content.innerHTML = reportPrintContentHtml(selectedReportPaper());
    modal.hidden = false;
    documentObject.body.classList.add('modal-open');
    updateReportPreviewPaper();
    documentObject.querySelector('#closeReportPrintPreview')?.focus();
  }

  function closeReportPrintPreview() {
    const modal = documentObject.querySelector('#reportPrintPreview');
    if (!modal) return;
    modal.hidden = true;
    documentObject.body.classList.remove('modal-open');
    documentObject.querySelector('#reportPrint')?.focus();
  }

  function refreshReportPrintPreview() {
    const content = documentObject.querySelector('#reportPrintPreviewDocument');
    if (content) content.innerHTML = reportPrintContentHtml(selectedReportPaper());
    updateReportPreviewPaper();
  }

  function printReportDocument() {
    const printWindow = windowObject.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(reportPrintDocumentHtml());
    printWindow.document.close();
    printWindow.focus();
    windowObject.setTimeout(() => { try { printWindow.print(); } catch (error) { /* Tunggu jika jendela cetak belum siap. */ } }, 400);
  }

  function exportReportPdf() {
    printReportDocument();
  }

  function setupReportPage() {
    populateReportCategories();
    documentObject.querySelectorAll('#reportType,#reportCategory,#reportPeriod,#reportDate,#reportStartDate,#reportEndDate,#reportMonth').forEach((field) => {
      if (field.dataset.bound === 'true') return;
      field.dataset.bound = 'true';
      field.addEventListener('change', () => { if (field.id === 'reportPeriod') updateReportPeriodFields(); if (field.id === 'reportType') populateReportCategories(field.value); renderReport(); });
    });
    documentObject.querySelector('#reportExportCsv')?.addEventListener('click', exportReportCsv);
    documentObject.querySelector('#reportExportXls')?.addEventListener('click', exportReportXls);
    documentObject.querySelector('#reportExportPdf')?.addEventListener('click', exportReportPdf);
    documentObject.querySelector('#reportPrint')?.addEventListener('click', openReportPrintPreview);
    documentObject.querySelector('#confirmReportPrint')?.addEventListener('click', printReportDocument);
    documentObject.querySelector('#closeReportPrintPreview')?.addEventListener('click', closeReportPrintPreview);
    documentObject.querySelector('#cancelReportPrint')?.addEventListener('click', closeReportPrintPreview);
    documentObject.querySelector('#reportPrintPreview')?.addEventListener('click', (event) => { if (event.target.id === 'reportPrintPreview') closeReportPrintPreview(); });
    documentObject.querySelector('#reportPrintPaper')?.addEventListener('change', refreshReportPrintPreview);
    documentObject.querySelector('#reportPrintOrientation')?.addEventListener('change', refreshReportPrintPreview);
    updateReportPeriodFields();
    renderReport();
  }

  function loadReports() {
    const container = pageContainer();
    if (container) container.innerHTML = reportShell();
    setText('.breadcrumb strong', 'Laporan');
    setText('#currentDate', new Intl.DateTimeFormat(locale(), { dateStyle: 'full' }).format(new Date()));
    setText('#reportHeaderDate', new Intl.DateTimeFormat(locale(), { dateStyle: 'long' }).format(new Date()));
    setupDashboardWalletModal();
    setupDashboardBreakdownModal();
    setupReportPage();
    const token = auth.getSessionToken();
    const wallet = readCache('wallet');
    const transaction = readCache('transaction');
    const category = readCache('category');
    const render = () => { renderDashboardWallets(); populateReportCategories(); renderReport(); };
    if (wallet && transaction && category) {
      render();
      return;
    }
    Promise.all([
      wallet ? Promise.resolve(wallet) : auth.callServer('getFinancePageData', { token, page: 'wallet' }).then((result) => { if (result && result.success) writeCache('wallet', result, { fromServer: true }); return result; }),
      transaction ? Promise.resolve(transaction) : auth.callServer('getFinancePageData', { token, page: 'transaction' }).then((result) => { if (result && result.success) writeCache('transaction', result, { fromServer: true }); return result; }),
      category ? Promise.resolve(category) : auth.callServer('getFinancePageData', { token, page: 'category' }).then((result) => { if (result && result.success) writeCache('category', result, { fromServer: true }); return result; }),
    ]).then(render).catch(render);
  }

  function load(forceRefresh) {
    closeDashboardWalletModal();
    closeDashboardBreakdownModal();
    updateActiveMenu();
    const token = auth.getSessionToken();
    if (!token) return;
    const route = String(windowObject.location.hash || '#dasbor').slice(1);
    if (route === 'dasbor') loadDashboard(token, forceRefresh);
    else if (route === 'transfer') loadTransfer(token, forceRefresh);
    else if (route === 'utang') loadDebt(token, forceRefresh);
    else if (route === 'tabungan') loadSaving(token, forceRefresh);
    else if (route === 'laporan') loadReports();
    else if (configs[route]) loadFinance(token, configs[route], forceRefresh);
  }

  windowObject.addEventListener('hashchange', () => load(false));
  documentObject.addEventListener('duit:language-changed', () => load(false));
  documentObject.addEventListener('duit:refresh-data', refreshFromSpreadsheet);
  setupAccountModal();
  setupCategoryModal();
  setupTransactionModal();
  setupTransactionDeleteModal();
  setupTransferDeleteModal();
  setupAccountDeleteModal();
  setupDebtDeleteModal();
  setupDebtPaymentDeleteModal();
  setupSavingDeleteModal();
  setupSavingDepositDeleteModal();
  restoreLastUpdated();
  load();
})(window, document);
