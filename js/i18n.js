(function setupDuitI18n(windowObject, documentObject) {
  const translations = {
    'Manajemen Keuangan Pribadi': 'Personal Finance Management', 'Duit - Manajemen Keuangan Pribadi': 'Duit - Personal Finance Management', 'Navigasi utama': 'Main navigation',
    'Menu utama': 'Main menu', 'Dasbor': 'Dashboard', 'Transaksi': 'Transactions', 'Transfer': 'Transfers',
    'Utang': 'Debts', 'Tabungan': 'Savings', 'Dompet/Akun': 'Wallets/Accounts', 'Kategori': 'Categories',
    'Laporan': 'Reports', 'Pengaturan': 'Settings', 'Keluar': 'Log out', 'Preferensi aplikasi': 'App preferences',
    'Item utang': 'Debt item', 'Urutan akun': 'Account order', 'Urutan kategori': 'Category order',
    'Pengaturan': 'Settings', 'Tema': 'Theme', 'Sidebar': 'Sidebar', 'Font': 'Font', 'Jenis font': 'Font family',
    'Ukuran font': 'Font size', 'Centang menu yang ingin ditampilkan. Seret menu untuk mengatur urutannya.': 'Select the menus you want to show. Drag items to change their order.',
    'Bahasa': 'Language', 'Bahasa aplikasi': 'App language', 'Light': 'Light', 'Midnight': 'Midnight',
    'Ocean': 'Ocean', 'Forest': 'Forest', 'Rose': 'Rose', 'Sunset': 'Sunset', 'Graphite': 'Graphite',
    'Batal': 'Cancel', 'Simpan': 'Save', 'Sinkronkan Data': 'Sync data', 'Sinkronkan data': 'Sync data',
    'Belum diperbarui': 'Not synced yet', 'Diperbarui': 'Last synced', 'Buka menu': 'Open menu',
    'Buka menu profil': 'Open profile menu', 'Profil': 'Profile', 'Pengaturan profil': 'Profile settings', 'Akun Anda': 'Your account',
    'Foto profil': 'Profile picture', 'JPG, PNG, atau WEBP. Maksimal 8 MB.': 'JPG, PNG, or WEBP. Maximum 8 MB.', 'Pilih foto': 'Choose a photo',
    'Nama profil': 'Profile name', 'Username': 'Username', 'Email': 'Email', 'Simpan profil': 'Save profile', 'Menyimpan profil...': 'Saving profile...',
    'Menyimpan...': 'Saving...', 'Memproses foto...': 'Processing photo...', 'Profil berhasil disimpan.': 'Profile saved successfully.',
    'Pilih foto JPG, PNG, atau WEBP dengan ukuran maksimal 8 MB.': 'Choose a JPG, PNG, or WEBP photo up to 8 MB.',
    'Profil gagal disimpan. Coba lagi.': 'Could not save profile. Try again.', 'Tutup': 'Close', 'Kembali ke daftar dompet': 'Back to wallet list',
    'Pemasukan': 'Income', 'Pengeluaran': 'Expenses', 'Total pemasukan': 'Total income', 'Total pengeluaran': 'Total expenses',
    'Catatan keuanganmu': 'Your financial overview', 'Pemasukan bulan ini': 'Income this month', 'Pengeluaran bulan ini': 'Expenses this month',
    'Total saldo': 'Total balance', 'Total Saldo': 'Total balance', 'Arus kas': 'Cash flow', 'Ringkasan': 'Overview',
    'Transaksi terbaru': 'Recent transactions', 'Transaksi hari ini': "Today's transactions", 'Top 3 pemasukan terbesar hari ini': "Today's top 3 income sources",
    'Top 3 pengeluaran terbesar hari ini': "Today's top 3 expenses", 'Daftar transaksi': 'Transaction list',
    'Daftar Transaksi': 'Transaction list', 'Tambah transaksi': 'Add transaction', 'Tambah Transaksi': 'Add transaction',
    'Tambah data': 'Add item', 'Daftar pemasukan yang tercatat pada akunmu.': 'Income recorded in your account.',
    'Daftar pengeluaran yang tercatat pada akunmu.': 'Expenses recorded in your account.', 'Daftar pemasukan': 'Income list',
    'Daftar pengeluaran': 'Expense list', 'Daftar akun': 'Account list', 'DAFTAR AKUN': 'ACCOUNT LIST',
    'DAFTAR PEMASUKAN': 'INCOME LIST', 'DAFTAR KATEGORI': 'CATEGORY LIST', 'Daftar kategori': 'Category list',
    'Daftar kategori transaksi milikmu.': 'Your transaction categories.', 'Daftar akun dan saldo dompetmu.': 'Your accounts and wallet balances.',
    'Daftar pemasukan yang tercatat pada akunmu.': 'Income recorded in your account.', 'Daftar pengeluaran yang tercatat pada akunmu.': 'Expenses recorded in your account.',
    'Daftar pemasukan': 'Income list', 'Daftar pengeluaran': 'Expense list', 'Daftar dompet': 'Wallet list',
    'Saldo awal': 'Opening balance', 'Saldo saat ini': 'Current balance', 'Saldo': 'Balance', 'Nama dompet': 'Wallet name',
    'Jenis akun': 'Account type', 'Nama kategori': 'Category name', 'Tipe': 'Type', 'Kategori': 'Category',
    'Sumber pemasukan': 'Income source', 'Sumber pengeluaran': 'Expense source', 'Keterangan': 'Description', 'Jenis': 'Type',
    'Tanggal': 'Date', 'Jumlah': 'Amount', 'Total transaksi': 'Total transactions', 'Total kategori': 'Total categories',
    'Total saldo dompet': 'Total wallet balance', 'Total transfer': 'Total transfers', 'Total sisa utang': 'Total debt remaining',
    'Total tabungan berjalan': 'Total savings in progress', 'Progress target tabunganmu.': 'Your savings goal progress.',
    'Riwayat transfer antar akun.': 'Transfer history between accounts.', 'Daftar utang dan sisa kewajibanmu.': 'Your debts and remaining obligations.',
    'Jumlah pemasukan': 'Income amount', 'Jumlah pengeluaran': 'Expense amount', 'Pilih periode': 'Select period',
    'Hari ini': 'Today', 'Minggu ini': 'This week', 'Bulan ini': 'This month', 'Tahun ini': 'This year',
    'Semua kategori': 'All categories', 'Semua akun': 'All accounts', 'Semua': 'All', 'Cari transaksi': 'Search transactions',
    'Tidak ada data untuk filter yang dipilih.': 'No data found for the selected filters.',
    'Tidak ada transaksi untuk filter yang dipilih.': 'No transactions found for the selected filters.',
    'Grafik transaksi': 'Transaction chart', 'Pemasukan': 'Income', 'Pengeluaran': 'Expenses', 'Cetak': 'Print',
    'Unduh CSV': 'Download CSV', 'Unduh Excel': 'Download Excel', 'Unduh PDF': 'Download PDF', 'Pratinjau cetak': 'Print preview',
    'Tambah akun': 'Add account', 'Tambah kategori': 'Add category', 'Tambah transfer': 'Add transfer', 'Tambah utang': 'Add debt',
    'Tambah target': 'Add goal', 'Tambah Target': 'Add goal', 'Simpan akun': 'Save account', 'Simpan kategori': 'Save category',
    'Simpan transaksi': 'Save transaction', 'Simpan target': 'Save goal', 'Simpan perubahan': 'Save changes', 'Ubah': 'Edit', 'Hapus': 'Delete',
    'Bayar': 'Pay', 'Setor': 'Deposit', 'Transfer': 'Transfer', 'Nama akun': 'Account name', 'Jenis akun': 'Account type',
    'Contoh: Dompet utama': 'e.g. Main wallet', 'Pilih akun': 'Select account', 'Pilih nama orang': 'Select a person',
    'Nama orang': 'Person name', 'Tanpa kategori': 'No category', 'Belum ada akun': 'No accounts yet',
    'Belum ada kategori': 'No categories yet', 'Belum ada dompet atau akun.': 'No wallets or accounts yet.',
    'Belum ada dompet atau akun': 'No wallets or accounts yet', 'Belum ada target tabungan.': 'No savings goals yet.',
    'Belum ada transaksi.': 'No transactions yet.', 'Belum ada transaksi hari ini.': 'No transactions today.',
    'Belum ada transaksi pada dompet ini.': 'No transactions in this wallet.', 'Belum ada akun.': 'No accounts yet.',
    'Belum ada kategori.': 'No categories yet.', 'Belum ada riwayat pembayaran.': 'No payment history yet.',
    'Belum ada riwayat setoran.': 'No deposit history yet.', 'Belum ada data...': 'No data yet...', 'Memuat data...': 'Loading data...',
    'Memuat data...': 'Loading data...', 'Memuat pengaturan...': 'Loading settings...',
    'Data tersimpan': 'Data saved', 'Tidak ada data': 'No data', 'Target tabungan': 'Savings goal', 'Target tabunganmu': 'Your savings goal',
    'Saldo dompet': 'Wallet balance', 'Rincian transaksi': 'Transaction details', 'Rincian': 'Details', 'Total': 'Total',
    'Dompet': 'Wallet', 'Akun': 'Account', 'Utang': 'Debt', 'Tabungan': 'Savings', 'Pembayaran utang': 'Debt payment',
    'Penerimaan utang': 'Debt received', 'Pemasukan hari ini': "Today's income", 'Pengeluaran hari ini': "Today's expenses",
    'Rincian pemasukan per kategori': 'Income by category', 'Rincian pengeluaran per kategori': 'Expenses by category',
    'Rincian pemasukan': 'Income details', 'Rincian pengeluaran': 'Expense details', 'dari': 'of',
    'Total Saldo': 'Total balance', 'Transaksi dompet': 'Wallet transactions', 'Lihat semua': 'View all', 'Lihat detail': 'View details',
    'Top 3 pemasukan terbesar hari ini': "Today's top 3 income sources", 'Top 3 pengeluaran terbesar hari ini': "Today's top 3 expenses",
    'Tambah item': 'Add item', 'Tambah Item': 'Add item', 'Ubah Item': 'Edit item', 'Hapus item': 'Delete item',
    'Ubah Target': 'Edit goal', 'Hapus target': 'Delete goal', 'Hapus akun': 'Delete account', 'Hapus kategori': 'Delete category',
    'Hapus transaksi': 'Delete transaction', 'Hapus transfer': 'Delete transfer', 'Hapus pembayaran': 'Delete payment', 'Hapus setoran': 'Delete deposit',
    'Konfirmasi': 'Confirmation', 'Hapus item utang?': 'Delete debt item?', 'Hapus pembayaran?': 'Delete payment?', 'Hapus target?': 'Delete goal?',
    'Hapus setoran?': 'Delete deposit?', 'Hapus akun?': 'Delete account?', 'Hapus kategori?': 'Delete category?',
    'Hapus transaksi?': 'Delete transaction?', 'Hapus transfer?': 'Delete transfer?', 'Catatan': 'Notes', 'Catatan tambahan': 'Additional notes',
    'Tidak ada catatan': 'No notes', 'Pilih akun asal': 'Select source account', 'Pilih akun tujuan': 'Select destination account',
    'Akun asal': 'Source account', 'Akun tujuan': 'Destination account', 'Tanggal transfer': 'Transfer date', 'Jumlah transfer': 'Transfer amount',
    'Status': 'Status', 'Status utang': 'Debt status', 'Pemberi utang': 'Lender', 'Penerima utang': 'Borrower', 'Nama pemberi utang': 'Lender name',
    'Nominal': 'Amount', 'Jatuh tempo': 'Due date', 'Sisa utang': 'Remaining debt', 'Bayar utang': 'Pay debt',
    'Jumlah pembayaran': 'Payment amount', 'Tanggal pembayaran': 'Payment date', 'Jumlah setoran': 'Deposit amount', 'Tanggal setoran': 'Deposit date',
    'Nama target': 'Goal name', 'Nama target tabungan': 'Savings goal name', 'Target amount': 'Target amount', 'Current amount': 'Current amount', 'Target date': 'Target date',
    'Pemasukan dari akun ini': 'Income in this account', 'Pengeluaran dari akun ini': 'Expenses in this account',
    'Simpan pengaturan': 'Save settings', 'Ada perubahan yang belum disimpan.': 'You have unsaved changes.',
    'Memeriksa pengaturan...': 'Checking settings...', 'Pengaturan awal disimpan di perangkat. Tekan Simpan untuk menyinkronkan pengaturan akun.': 'Initial settings are saved on this device. Select Save to sync your account settings.',
    'Pengaturan lokal digunakan. Tekan Simpan untuk mencoba sinkronisasi.': 'Using local settings. Select Save to try syncing.',
    'Perubahan tersimpan di perangkat, tetapi gagal dikirim. Tekan Simpan untuk mencoba lagi.': 'Changes are saved on this device, but could not be sent. Select Save to try again.',
    'Sisakan setidaknya satu menu yang terlihat.': 'Keep at least one menu visible.', 'Seret untuk mengurutkan': 'Drag to reorder',
    'Naikkan': 'Move up', 'Turunkan': 'Move down', 'Ada perubahan lain yang belum disimpan.': 'You have other unsaved changes.',
    'Saving...': 'Saving...', 'Tersimpan': 'Saved', 'Gagal memuat data': 'Failed to load data', 'Gagal menyimpan data': 'Failed to save data',
    'Pemasukan tercatat': 'Income recorded', 'Pengeluaran tercatat': 'Expenses recorded', 'data tercatat': 'items recorded',
    'Transaksi baru siap ditambahkan': 'Ready to add a new transaction', 'Form tambah data segera tersedia': 'The add form will be available soon',
    'Catatan keuanganmu': 'Your financial overview', 'Personal': 'Personal', 'transaksi': 'transactions', 'data': 'items',
    'Tidak ada transaksi.': 'No transactions.', 'Tanggal dan waktu': 'Date and time', 'Periode laporan': 'Report period',
    'Ringkasan laporan': 'Report summary', 'Laporan transaksi': 'Transaction report', 'Laporan keuangan': 'Financial report',
    'Dibuat pada': 'Generated on', 'Dicetak pada': 'Printed on', 'Filter laporan': 'Report filters', 'Jenis laporan': 'Report type',
    'Pilih rentang tanggal': 'Select date range', 'Dari tanggal': 'From date', 'Sampai tanggal': 'To date', 'Awal': 'Start', 'Akhir': 'End',
    'Jumlah transaksi': 'Transaction count', 'Total pemasukan': 'Total income', 'Total pengeluaran': 'Total expenses', 'Saldo bersih': 'Net balance',
    'Pengaturan berhasil disimpan.': 'Settings saved successfully.', 'Tema': 'Theme', 'Bahasa aplikasi': 'App language',
    'Ringkasan pemasukan dan pengeluaran': 'Income and expense overview', 'Ringkasan arus kas': 'Cash flow overview',
    'Pemasukan dan pengeluaran': 'Income and expenses', 'Saldo keseluruhan': 'Total balance', 'Arus kas bulan ini': 'Cash flow this month',
    'Aktivitas terbaru': 'Recent activity', 'Belum ada aktivitas.': 'No activity yet.', 'Ringkasan pemasukan': 'Income overview',
    'Ringkasan pengeluaran': 'Expense overview', 'Daftar pemasukan hari ini': "Today's income list", 'Daftar pengeluaran hari ini': "Today's expense list",
    'Progress utang': 'Debt progress', 'Progress tabungan': 'Savings progress', 'Sisa': 'Remaining', 'Sisa utang': 'Remaining debt',
    'Tidak ada utang.': 'No debts yet.', 'Tenggang waktu': 'Time remaining', 'LUNAS': 'PAID', 'Terkumpul': 'Saved so far',
    'Tanggal target': 'Target date', 'Target': 'Goal', 'Progress': 'Progress', 'Sisa waktu': 'Time remaining',
    'Atur target dan pantau perkembangan tabunganmu.': 'Set goals and track your savings progress.',
    'Tambahkan setoran ke target tabungan.': 'Add a deposit to your savings goal.', 'Setoran Tabungan': 'Savings deposit',
    'Jumlah yang ditabung': 'Deposit amount', 'Riwayat Setoran': 'Deposit history', 'Riwayat Pembayaran': 'Payment history',
    'Pembayaran Utang': 'Debt payment', 'Catat pembayaran berdasarkan nama orang.': 'Record payments by person.',
    'Catat pinjaman dan uang yang kamu pinjamkan.': 'Track money you borrow and lend.', 'Daftar Utang': 'Debt list',
    'Daftar Target Tabungan': 'Savings goals', 'Transfer antar akun': 'Transfer between accounts',
    'Daftar dompet dan saldo yang tersedia.': 'Available wallets and balances.', 'Riwayat transfer': 'Transfer history',
    'Dompet/Akun asal': 'From wallet/account', 'Dompet/Akun tujuan': 'To wallet/account', 'Nominal': 'Amount',
    'LAPORAN KEUANGAN': 'FINANCIAL REPORT', 'Laporan transaksi': 'Transaction report',
    'Tinjau pemasukan, pengeluaran, dan aktivitas keuangan berdasarkan filter.': 'Review income, expenses, and financial activity using filters.',
    'TANGGAL HARI INI': "TODAY'S DATE", 'Semua tipe': 'All types', 'Periode': 'Period', 'Semua waktu': 'Any time',
    'Tanggal tertentu': 'Specific date', 'Rentang tanggal': 'Date range', 'Bulanan': 'Monthly', 'Dari': 'From', 'Sampai': 'To',
    'Grafik transaksi': 'Transaction chart', 'Export CSV': 'Export CSV', 'Export XLS': 'Export XLS', 'Export PDF': 'Export PDF',
    'Pratinjau dokumen': 'Document preview', 'Ukuran kertas': 'Paper size', 'Orientasi': 'Orientation', 'Potret': 'Portrait',
    'Lanskap': 'Landscape', 'Kembali': 'Back', 'Cetak dokumen': 'Print document', 'Lihat per kategori': 'View by category',
    'Keterangan transfer': 'Transfer description', 'Akun tujuan': 'Destination account', 'Nama': 'Name', 'Aksi': 'Actions',
    'Tipe akun': 'Account type', 'Tipe kategori': 'Category type', 'Cash': 'Cash', 'Bank': 'Bank', 'E-wallet': 'E-wallet',
    'Investment': 'Investment', 'Pinjam': 'Borrowed', 'Meminjamkan': 'Lent', 'Jam': 'Time', 'Dari akun': 'From account', 'Ke akun': 'To account',
    'Simpan target': 'Save goal', 'Pengeluaran bulan ini': 'Expenses this month', 'Pemasukan bulan ini': 'Income this month',
    'Tampilkan semua': 'Show all', 'Lihat transaksi': 'View transactions', 'Rincian per kategori': 'Breakdown by category',
    'Rincian pemasukan': 'Income breakdown', 'Rincian pengeluaran': 'Expense breakdown', 'Sisa target': 'Goal remaining',
    'Jatuh tempo dalam': 'Due in', 'Sisa ${escapeHtml(money(remaining))}': 'Remaining: ${escapeHtml(money(remaining))}',
    'Belum ada riwayat transfer.': 'No transfer history yet.', 'Memuat data dompet...': 'Loading wallet data...',
    'Memuat riwayat transfer...': 'Loading transfer history...', 'Memuat data utang...': 'Loading debt data...',
    'Memuat riwayat pembayaran...': 'Loading payment history...', 'Memuat target tabungan...': 'Loading savings goals...',
    'Memuat riwayat setoran...': 'Loading deposit history...', 'Memuat data laporan...': 'Loading report data...',
    'Tidak ada data untuk ditampilkan.': 'No data to display.', 'Transaksi hari ini': "Today's transactions",
    'Belum ada transaksi hari ini.': 'No transactions today.', 'Total saldo': 'Total balance', 'Saldo': 'Balance',
    'Lihat semua transaksi': 'View all transactions', 'Tampilkan detail': 'Show details', 'Tutup pengaturan': 'Close settings',
    'Akun akan dihapus dari data lokal.': 'This account will be removed from local data.',
    'Transaksi akan ditandai sebagai deleted dan disembunyikan dari daftar.': 'This transaction will be marked as deleted and hidden from the list.',
    'Transfer akan ditandai sebagai deleted dan disembunyikan dari riwayat.': 'This transfer will be marked as deleted and hidden from history.',
    'Item utang akan ditandai sebagai deleted dan disembunyikan dari daftar.': 'This debt item will be marked as deleted and hidden from the list.',
    'Pembayaran akan ditandai sebagai deleted dan disembunyikan dari riwayat.': 'This payment will be marked as deleted and hidden from history.',
    'Target tabungan akan ditandai sebagai deleted dan disembunyikan dari daftar.': 'This savings goal will be marked as deleted and hidden from the list.',
    'Setoran akan ditandai sebagai deleted dan disembunyikan dari riwayat.': 'This deposit will be marked as deleted and hidden from history.',
    'DAFTAR UTANG': 'DEBT LIST', 'Daftar Utang': 'Debt list', 'Daftar utang': 'Debt list',
    'Daftar Target Tabungan': 'Savings goals', 'Daftar transfer': 'Transfer list', 'Transfer antar akun': 'Transfer between accounts',
    'Tipe akun': 'Account type', 'Tipe kategori': 'Category type', 'Saldo awal (opsional)': 'Opening balance (optional)',
    'Contoh: Makan': 'e.g. Dining', 'Catatan transaksi (opsional)': 'Transaction notes (optional)',
    'Transaksi baru siap ditambahkan': 'Ready to add a new transaction', 'Opsi transaksi': 'Transaction options',
    'Catatan keuanganmu': 'Your financial overview', 'Rincian pemasukan per kategori': 'Income by category',
    'Rincian pengeluaran per kategori': 'Expenses by category', 'Total pemasukan hari ini': "Today's total income",
    'Total pengeluaran hari ini': "Today's total expenses", 'Lihat per kategori': 'View by category',
    'Grafik transaksi': 'Transaction chart', 'Pemasukan bersih': 'Net income', 'Tidak ada transaksi untuk periode ini.': 'No transactions for this period.',
    'Akun asal': 'Source account', 'Akun tujuan': 'Destination account', 'Transfer dari': 'Transfer from', 'Transfer ke': 'Transfer to',
    'Dompet/Akun asal': 'From wallet/account', 'Dompet/Akun tujuan': 'To wallet/account', 'Daftar dompet dan saldo yang tersedia.': 'Available wallets and balances.',
    'A4 � 210 � 297 mm': 'A4 · 210 × 297 mm', 'A3 � 297 � 420 mm': 'A3 · 297 × 420 mm',
    'A5 � 148 � 210 mm': 'A5 · 148 × 210 mm', 'B4 � 250 � 353 mm': 'B4 · 250 × 353 mm',
    'B5 � 176 � 250 mm': 'B5 · 176 × 250 mm',
    'A5 · 148 × 210 mm': 'A5 · 148 × 210 mm', 'B4 · 250 × 353 mm': 'B4 · 250 × 353 mm',
    'B5 · 176 × 250 mm': 'B5 · 176 × 250 mm', 'Thermal struk · 58 mm (roll)': 'Thermal receipt · 58 mm (roll)',
    'Thermal struk · 80 mm (roll)': 'Thermal receipt · 80 mm (roll)', 'Dibuat': 'Generated',
    'A4 \u00b7 210 \u00d7 297 mm': 'A4 \u00b7 210 \u00d7 297 mm', 'A3 \u00b7 297 \u00d7 420 mm': 'A3 \u00b7 297 \u00d7 420 mm',
    'Letter \u00b7 216 \u00d7 279 mm': 'Letter \u00b7 216 \u00d7 279 mm', 'Legal \u00b7 216 \u00d7 356 mm': 'Legal \u00b7 216 \u00d7 356 mm',
    'Tabloid \u00b7 279 \u00d7 432 mm': 'Tabloid \u00b7 279 \u00d7 432 mm',
    'Daftar Utang': 'Debt list', 'Daftar Target Tabungan': 'Savings goals', 'Tabungan': 'Savings',
    'Terlambat': 'Overdue', 'Jatuh tempo hari ini': 'Due today', 'Tenggang waktu belum diatur': 'Due date not set',
    'Belum lunas': 'Unpaid', 'Lunas': 'Paid', 'Selesai': 'Completed', 'Berjalan': 'In progress',
    'Edit pembayaran': 'Edit payment', 'Edit setoran': 'Edit deposit', 'Opsi transaksi': 'Transaction options',
    'Jumlah utang': 'Debt amount', 'Jumlah pinjaman': 'Loan amount', 'Jumlah setoran': 'Deposit amount',
    'Nominal pembayaran': 'Payment amount', 'Catatan pembayaran': 'Payment notes', 'Catatan setoran': 'Deposit notes',
    'Pembayaran': 'Payment', 'Setoran': 'Deposit', 'Dibayar': 'Paid', 'Diterima': 'Received', 'Dipinjam': 'Borrowed', 'Dipinjamkan': 'Lent',
    'Tunai': 'Cash', 'Bank': 'Bank', 'Dompet digital': 'Digital wallet', 'Investasi': 'Investment',
    'Wajib diisi': 'Required', 'Opsional': 'Optional', 'Pilih tanggal': 'Select a date', 'Pilih periode': 'Select a period',
    'Cetak laporan': 'Print report', 'Pilih ukuran kertas': 'Select paper size', 'Ukuran kertas printer': 'Printer paper size',
    'Laporan': 'Reports', 'Periode laporan': 'Report period', 'Tanggal laporan': 'Report date',
    'Ringkasan transaksi': 'Transaction summary', 'Total pemasukan': 'Total income', 'Total pengeluaran': 'Total expenses',
    'Saldo bersih': 'Net balance', 'Dibuat': 'Generated', 'Dibuat pada': 'Generated on', 'DUIT · LAPORAN KEUANGAN': 'DUIT · FINANCIAL REPORT',
    'Ubah transaksi': 'Edit transaction', 'Ubah akun': 'Edit account', 'Ubah kategori': 'Edit category', 'Ubah transfer': 'Edit transfer',
    'Ubah target': 'Edit goal', 'Simpan akun': 'Save account', 'Simpan kategori': 'Save category', 'Simpan transaksi': 'Save transaction',
    'Simpan target': 'Save goal', 'Simpan perubahan': 'Save changes', 'Hapus item': 'Delete item',
    'Terjadi kesalahan saat memuat data.': 'An error occurred while loading data.', 'Coba lagi': 'Try again',
    'Pengaturan belum tersimpan.': 'Settings have not been saved.', 'Periksa koneksi internetmu.': 'Check your internet connection.',
    'DUIT � LAPORAN KEUANGAN': 'DUIT · FINANCIAL REPORT', 'DICETAK PADA': 'PRINTED ON',
    'RINGKASAN TRANSAKSI': 'TRANSACTION SUMMARY', 'Tipe transaksi': 'Transaction type',
    'Tekan Perbarui data untuk menyinkronkan.': 'Select Sync data to sync your changes.',
    'Pilih akun, tanggal, jam, dan masukkan jumlah yang valid.': 'Select an account and date, enter a time, and provide a valid amount.',
    'Pilih akun asal dan tujuan yang berbeda, lalu masukkan nominal yang valid.': 'Choose different source and destination accounts, then enter a valid amount.',
    'Pilih nama orang dan masukkan jumlah pembayaran yang valid.': 'Select a person and enter a valid payment amount.',
    'Pilih target dan masukkan jumlah setoran yang valid.': 'Select a goal and enter a valid deposit amount.',
    'Jumlah setoran melebihi sisa target tabungan.': 'The deposit exceeds the remaining savings goal amount.',
    'Lengkapi data dan pastikan sisa tidak lebih besar dari jumlah.': 'Complete the fields and make sure the remaining balance does not exceed the total.',
    'Lengkapi data dan pastikan tabungan saat ini tidak melebihi target.': 'Complete the fields and make sure current savings do not exceed the goal.',
    'Form tambah data segera tersedia': 'The add form will be available soon',
    'Pengaturan berhasil disimpan.': 'Settings saved successfully.',
    'Kelompok tema': 'Theme group', 'Pilihan tema': 'Theme option', 'Pilih tema': 'Select a theme',
    'Umum': 'General', 'Kontras': 'Contrast', 'Netral': 'Neutral',
    'Terang': 'Light', 'Gelap': 'Dark', 'Sistem': 'System', 'AMOLED': 'Amoled',
    'Kontras tinggi terang': 'High contrast light', 'Kontras tinggi gelap': 'High contrast dark',
    'Sepia/Mode baca': 'Sepia/reading mode', 'Gelap redup/lembut': 'Dim/soft dark',
    'Klasik': 'Classic', 'Minimalis': 'Minimalist', 'Ringkas': 'Compact', 'Hangat/Pasir': 'Warm/Sand', 'Tengah malam': 'Midnight',
    'Zona berbahaya': 'Danger zone',
    'Hapus permanen transaksi, transfer, utang, dan data tabungan Anda.': 'Permanently delete your transactions, transfers, debts, and savings records.',
    'Tindakan permanen': 'Permanent action', 'Reset semua data transaksi?': 'Reset all transaction data?',
    'Tindakan ini akan menghapus permanen semua transfer, transaksi, utang dan riwayat pembayaran, target tabungan, serta riwayat setoran. Dompet dan kategori tidak akan dihapus. Tindakan ini tidak dapat dibatalkan.': 'This permanently deletes all transfers, transactions, debts and payment history, savings goals, and deposit history. Wallets and categories will be kept. This cannot be undone.',
    'Reset data saya': 'Reset my data', 'Sedang mereset...': 'Resetting...', 'Data direset': 'Reset complete',
    'Semua data transaksi berhasil direset.': 'All transaction data has been reset.', 'Reset data gagal. Coba lagi.': 'Could not reset data. Try again.',
    'Sesi Anda tidak ditemukan. Silakan masuk kembali.': 'Your session could not be found. Please sign in again.',
  };

  const dynamicRules = [
    [/^Selamat pagi,\s*(.*)$/, 'Good morning, $1'],
    [/^(.*)\s·\s(\d+) transaksi$/, '$1 · $2 transactions'],
    [/^(\d+) data tercatat$/, '$1 items recorded'], [/^(\d+) data$/, '$1 items'],
    [/^Diperbarui\s+(.+)$/, 'Last synced $1'],
    [/^Dicetak\s+(.+)$/, 'Printed $1'],
    [/^Data lokal · diperbarui (.+)$/, 'Local data · updated $1'],
    [/^Sumber data: sheet (.+)$/, 'Data source: sheet $1'],
    [/^Akun disimpan di perangkat\. Tekan Sinkronkan data untuk menyimpan perubahan\.$/, 'Account saved on this device. Select Sync data to sync your changes.'],
    [/^Urutan (akun|kategori) diperbarui di data lokal\. Tekan Perbarui data untuk menyinkronkan\.$/, (_, type) => `${type === 'akun' ? 'Account' : 'Category'} order updated locally. Select Sync data to sync your changes.`],
    [/^(.+) (disimpan|diperbarui) di data lokal\. Tekan Perbarui data untuk menyinkronkan\.$/, (_, item, action) => `${translations[item] || item} ${action === 'disimpan' ? 'saved' : 'updated'} locally. Select Sync data to sync your changes.`],
    [/^(.+) dihapus dari data lokal\. Tekan Perbarui data untuk menyinkronkan\.$/, (_, item) => `${translations[item] || item} deleted locally. Select Sync data to sync your changes.`],
    [/^(.+) ditandai deleted di data lokal\. Tekan Perbarui data untuk menyinkronkan\.$/, (_, item) => `${translations[item] || item} marked as deleted locally. Select Sync data to sync your changes.`],
    [/^([\d.,]+) jt$/, '$1M'],
    [/^Sisa (.+)$/, 'Remaining: $1'],
    [/^Terlambat (\d+) hari$/, 'Overdue by $1 days'],
    [/^(\d+) hari lagi$/, '$1 days left'],
    [/^Naikkan (.+)$/, 'Move $1 up'],
    [/^Turunkan (.+)$/, 'Move $1 down'],
    [/^(\d+) transaksi$/, '$1 transactions'],
    [/^Total (.+)$/, 'Total $1'],
    [/^Pilih (.+)$/, 'Select $1'],
    [/^Memuat (.+)\.\.\.$/, 'Loading $1...'],
    [/^Daftar (.+)$/, '$1 list'],
    [/^Rincian (pemasukan|pengeluaran)(?: hari ini)?$/, (_, type) => `${type === 'pemasukan' ? 'Income' : 'Expense'} details`],
    [/^(Pemasukan|Pengeluaran) hari ini$/, (_, type) => `${type === 'Pemasukan' ? 'Income' : 'Expenses'} today`],
    [/^Daftar (.*)$/, (_, name) => `List of ${name}`],
    [/^Belum ada data (.+)\.$/, 'No $1 data yet.'],
    [/^Belum ada (.+)\.$/, 'No $1 yet.'],
    [/^Memuat (.+)\.\.\.$/, 'Loading $1...'],
    [/^Tidak ada data untuk (.+)\.$/, 'No data for $1.'],
    [/^Akun “(.*)” akan dihapus dari data lokal\.$/, 'Account “$1” will be removed from local data.'],
    [/^Transaksi “(.*)” akan ditandai sebagai deleted dan disembunyikan dari daftar\.$/, 'Transaction “$1” will be marked as deleted and hidden from the list.'],
    [/^Transfer “(.*)” akan ditandai sebagai deleted dan disembunyikan dari riwayat\.$/, 'Transfer “$1” will be marked as deleted and hidden from history.'],
    [/^Item utang “(.*)” akan ditandai sebagai deleted dan disembunyikan dari daftar\.$/, 'Debt item “$1” will be marked as deleted and hidden from the list.'],
    [/^Pembayaran untuk “(.*)” akan ditandai sebagai deleted dan disembunyikan dari riwayat\.$/, 'Payment for “$1” will be marked as deleted and hidden from history.'],
    [/^Target “(.*)” akan ditandai sebagai deleted dan disembunyikan dari daftar\.$/, 'Goal “$1” will be marked as deleted and hidden from the list.'],
    [/^Setoran untuk “(.*)” akan ditandai sebagai deleted dan disembunyikan dari riwayat\.$/, 'Deposit for “$1” will be marked as deleted and hidden from history.'],
    [/^Ubah (.*)$/, 'Edit $1'], [/^Hapus (.*)$/, 'Delete $1'], [/^Tambah (.*)$/, 'Add $1'], [/^Simpan (.*)$/, 'Save $1'],
  ];

  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const sidebarLabels = { dasbor: 'Dashboard', transaksi: 'Transactions', transfer: 'Transfers', utang: 'Debts', tabungan: 'Savings', dompet: 'Wallets/Accounts', kategori: 'Categories', laporan: 'Reports' };
  let language = 'id';

  function translated(source) {
    if (language !== 'en') return source;
    const trimmed = source.trim();
    if (Object.prototype.hasOwnProperty.call(translations, trimmed)) return source.replace(trimmed, translations[trimmed]);
    for (const [pattern, replacement] of dynamicRules) {
      const match = trimmed.match(pattern);
      if (match) {
        const result = typeof replacement === 'function' ? replacement(...match) : trimmed.replace(pattern, replacement);
        return source.replace(trimmed, result);
      }
    }
    return source;
  }

  function translateTextNode(node) {
    if (language !== 'en' && !textSources.has(node)) return;
    const record = textSources.get(node);
    const source = record && node.nodeValue === record.translated ? record.source : node.nodeValue;
    const navItem = node.parentElement && node.parentElement.closest('.nav-item');
    const sidebarSetting = node.parentElement && node.parentElement.closest('.settings-sidebar-item');
    const route = navItem && navItem.getAttribute('href') ? navItem.getAttribute('href').slice(1) : (sidebarSetting && sidebarSetting.dataset.route);
    const label = language === 'en' && route ? sidebarLabels[route] : '';
    const next = label && source.trim() ? source.replace(source.trim(), label) : translated(source);
    textSources.set(node, { source, translated: next });
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function translateAttribute(element, name) {
    if (!element.hasAttribute(name)) return;
    let records = attributeSources.get(element);
    if (!records) { records = {}; attributeSources.set(element, records); }
    const current = element.getAttribute(name);
    const record = records[name];
    const source = record && current === record.translated ? record.source : current;
    const next = translated(source);
    records[name] = { source, translated: next };
    if (current !== next) element.setAttribute(name, next);
  }

  function translate(root) {
    if (!root) return;
    const walker = documentObject.createTreeWalker(root, windowObject.NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateTextNode(node);
    if (root.nodeType === 1) {
      ['aria-label', 'title', 'placeholder', 'alt'].forEach((name) => translateAttribute(root, name));
      root.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach((element) => {
        ['aria-label', 'title', 'placeholder', 'alt'].forEach((name) => translateAttribute(element, name));
      });
    }
  }

  function setLanguage(nextLanguage) {
    const next = nextLanguage === 'en' ? 'en' : 'id';
    const changed = language !== next;
    language = next;
    documentObject.documentElement.lang = language;
    translate(documentObject.head);
    translate(documentObject.body);
    if (changed) documentObject.dispatchEvent(new CustomEvent('duit:language-changed', { detail: { language } }));
  }

  windowObject.DuitI18n = {
    setLanguage,
    getLanguage: () => language,
    locale: () => language === 'en' ? 'en-US' : 'id-ID',
    t: (source) => translated(String(source)),
  };

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === 'characterData') translateTextNode(record.target);
      record.addedNodes && record.addedNodes.forEach((node) => {
        if (node.nodeType === 1) translate(node);
        else if (node.nodeType === 3) translateTextNode(node);
      });
      if (record.type === 'attributes') translateAttribute(record.target, record.attributeName);
    });
  });
  observer.observe(documentObject.documentElement, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'title', 'placeholder', 'alt'] });
  translate(documentObject.head);
  translate(documentObject.body);
})(window, document);
