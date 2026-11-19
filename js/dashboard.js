(function loadDashboard(windowObject, documentObject) {
  const auth = windowObject.DuitAuth;
  if (!auth) return;

  const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });
  const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

  function money(value) {
    return currencyFormatter.format(Number(value) || 0).replace(/\u00a0/g, ' ');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
    }[character]));
  }

  function formatTransactionDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.getTime() === 0) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date);
  }

  function updateSummary(data) {
    const summary = data.summary || {};
    const setText = (selector, value) => {
      const element = documentObject.querySelector(selector);
      if (element) element.textContent = money(value);
    };
    setText('#totalBalance', summary.total_balance);
    setText('#monthIncome', summary.income);
    setText('#monthExpense', summary.expense);
    const netElement = documentObject.querySelector('#balanceTrend');
    if (netElement) netElement.textContent = money((Number(summary.income) || 0) - (Number(summary.expense) || 0));

    const fullName = String(data.user && data.user.full_name || '').trim();
    const firstName = fullName.split(/\s+/)[0] || 'teman';
    const heading = documentObject.querySelector('#welcomeHeading');
    if (heading) heading.innerHTML = `Selamat pagi, ${escapeHtml(firstName)} <span class="wave">âœ¦</span>`;
    const label = documentObject.querySelector('#profileAccountLabel');
    if (label) label.textContent = `${data.user.username || 'Personal'} · ${summary.transaction_count || 0} transaksi`;
    const date = documentObject.querySelector('#currentDate');
    if (date) date.textContent = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date());
  }

  function updateGoals(goals) {
    const container = documentObject.querySelector('#goalsList');
    if (!container) return;
    if (!goals || !goals.length) {
      container.innerHTML = '<p class="muted">Belum ada target tabungan.</p>';
      return;
    }
    container.innerHTML = goals.slice(0, 4).map((goal, index) => {
      const target = Number(goal.target_amount) || 0;
      const current = Number(goal.current_amount) || 0;
      const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      const icon = index % 2 === 0 ? 'icon-home' : 'icon-transfer';
      const iconClass = index % 2 === 0 ? 'home-goal' : 'travel-goal';
      return `<div class="goal"><div class="goal-icon ${iconClass}"><svg><use href="#${icon}"></use></svg></div><div class="goal-info"><div class="goal-title"><strong>${escapeHtml(goal.name || 'Target tabungan')}</strong><span>${percentage}%</span></div><div class="progress"><span style="width:${percentage}%"></span></div><small>${money(current)} <em>dari ${money(target)}</em></small></div></div>`;
    }).join('');
  }

  function updateTransactions(transactions) {
    const container = documentObject.querySelector('#transactionList');
    if (!container) return;
    if (!transactions || !transactions.length) {
      container.innerHTML = '<p class="muted">Belum ada transaksi.</p>';
      return;
    }
    container.innerHTML = transactions.slice(0, 10).map((transaction) => {
      const income = transaction.type === 'income';
      const icon = income ? 'icon-arrow-down' : 'icon-cart';
      const iconClass = income ? 'salary-bg' : 'groceries-bg';
      const amountClass = income ? 'income-text' : 'expense-text';
      const sign = income ? '+' : '-';
      const subtitle = [formatTransactionDate(transaction.date), transaction.category].filter(Boolean).join(' · ');
      return `<div class="transaction-row"><div class="transaction-icon ${iconClass}"><svg><use href="#${icon}"></use></svg></div><div class="transaction-name"><strong>${escapeHtml(transaction.note || 'Transaksi')}</strong><span>${escapeHtml(subtitle)}</span></div><div class="transaction-amount ${amountClass}">${sign} ${money(transaction.amount)}</div><button class="row-more" aria-label="Opsi transaksi"><svg><use href="#icon-more"></use></svg></button></div>`;
    }).join('');
  }

  function updateChart(cashflow) {
    if (!cashflow || !cashflow.length) return;
    const maxValue = Math.max(1, ...cashflow.flatMap((item) => [Number(item.income) || 0, Number(item.expense) || 0]));
    const points = (key) => cashflow.map((item, index) => {
      const x = cashflow.length === 1 ? 0 : (index * 600) / (cashflow.length - 1);
      const y = 160 - ((Number(item[key]) || 0) / maxValue) * 135;
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    const incomePoints = points('income');
    const expensePoints = points('expense');
    const line = (values) => `M${values.join(' L')}`;
    const incomeLine = documentObject.querySelector('#incomeLine');
    const expenseLine = documentObject.querySelector('#expenseLine');
    const incomeArea = documentObject.querySelector('#incomeArea');
    if (incomeLine) incomeLine.setAttribute('d', line(incomePoints));
    if (expenseLine) expenseLine.setAttribute('d', line(expensePoints));
    if (incomeArea) incomeArea.setAttribute('d', `${line(incomePoints)} V180 H0Z`);
    const labels = documentObject.querySelector('#cashflowLabels');
    if (labels) labels.innerHTML = cashflow.map((item) => `<span>${escapeHtml(item.label)}</span>`).join('');
    const axis = documentObject.querySelectorAll('.y-axis span');
    const steps = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0];
    axis.forEach((element, index) => { element.textContent = `${numberFormatter.format(steps[index] / 1000000)} jt`; });
  }

  const token = auth.getSessionToken();
  if (!token) return;
  auth.callServer('getDashboardData', { token })
    .then((result) => {
      if (!result || !result.success) return;
      updateSummary(result);
      updateGoals(result.goals);
      updateTransactions(result.transactions);
      updateChart(result.cashflow);
    })
    .catch((error) => console.error('Gagal memuat dashboard:', error));
})(window, document);
