// ==========================================================================
// MY MONEY MANAGEMENT - FRONTEND LOGIC (app.js)
// ==========================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbyaFSQZBexnPohs_3cN3SSMD7vch5Y-h6CBvRGasqXvpUvkLiQWGBYCRDlB3mz_yBbpRw/exec"; 

let DB_TRANSAKSI = [];
let DB_PENGATURAN = {};
let DATA_TERFILTER_SEKARANG = []; // Menyimpan data aktif hasil filter

const getTodayDate = () => {
    const local = new Date();
    const offset = local.getTimezoneOffset();
    const localDate = new Date(local.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

function bersihkanTanggal(tanggalRaw) {
    if (!tanggalRaw) return "";
    const d = new Date(tanggalRaw);
    if (isNaN(d.getTime())) return tanggalRaw.toString().substring(0, 10);
    const offset = d.getTimezoneOffset();
    const localD = new Date(d.getTime() - (offset * 60 * 1000));
    return localD.toISOString().split('T')[0];
}

const formatFormatKey = (text) => text.toLowerCase().replace(/ /g, "_");
const formatTampilanKey = (text) => text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('trx-tanggal').value = getTodayDate();
    initApp();
});

async function initApp() {
    try {
        const response = await fetch(`${API_URL}?action=getData`);
        const result = await response.json();
        
        DB_TRANSAKSI = result.transaksi || [];
        DB_PENGATURAN = result.pengaturan || {};
        
        renderProfil();
        renderKategoriDropdown();
        renderSumberDanaDropdown();
        sinkronisasiFilterKategori();
        hitungDashboardBeranda();
        renderTableHariIni();
        prosesFilter(); 
    } catch (e) {
        alert("Gagal memuat data dari database: " + e);
    }
}

function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.sidebar ul li a').forEach(a => a.classList.remove('active'));
    
    document.getElementById(`view-${viewName}`).style.display = 'block';
    document.getElementById(`menu-${viewName}`).classList.add('active');
}

function renderProfil() {
    document.getElementById('user-name').innerText = DB_PENGATURAN.nama_user || "Pengguna Baru";
    if(DB_PENGATURAN.foto_profil) document.getElementById('user-avatar').src = DB_PENGATURAN.foto_profil;
    
    document.getElementById('set-nama').value = DB_PENGATURAN.nama_user || "";
    document.getElementById('set-foto').value = DB_PENGATURAN.foto_profil || "";
    
    renderTagKategori('out', 'list-kat-out', DB_PENGATURAN.kategori_pengeluaran);
    renderTagKategori('in', 'list-kat-in', DB_PENGATURAN.kategori_pemasukan);
    renderDaftarRekeningSistem();
}

function renderTagKategori(type, elementId, rawData) {
    const container = document.getElementById(elementId);
    container.innerHTML = "";
    if(!rawData) return;
    rawData.split(',').map(s => s.trim()).forEach(kat => {
        if(!kat) return;
        container.innerHTML += `<span class="tag">${kat} <b onclick="hapusKategoriSistem('${type}', '${kat}')">&times;</b></span>`;
    });
}

function renderDaftarRekeningSistem() {
    const container = document.getElementById('list-rekening-sistem');
    container.innerHTML = "";
    const abaikanKey = ['nama_user', 'foto_profil', 'kategori_pemasukan', 'kategori_pengeluaran'];
    for (let key in DB_PENGATURAN) {
        if (abaikanKey.includes(key)) continue;
        container.innerHTML += `
            <span class="tag">
                ${formatTampilanKey(key)} (Awal: Rp ${parseInt(DB_PENGATURAN[key]).toLocaleString('id-ID')})
                <b onclick="hapusRekeningSistem('${key}')">&times;</b>
            </span>`;
    }
}

function renderKategoriDropdown() {
    const jenis = document.getElementById('trx-jenis').value;
    const select = document.getElementById('trx-kategori');
    select.innerHTML = "";
    const rawKategori = jenis === "Pemasukan" ? DB_PENGATURAN.kategori_pemasukan : DB_PENGATURAN.kategori_pengeluaran;
    if(rawKategori) {
        rawKategori.split(',').forEach(k => {
            select.innerHTML += `<option value="${k.trim()}">${k.trim()}</option>`;
        });
    }
}

function sinkronisasiFilterKategori() {
    const tipeSelected = document.getElementById('filter-jenis').value;
    const selectKat = document.getElementById('filter-kategori');
    selectKat.innerHTML = "<option value='Semua'>Semua Kategori</option>";
    
    let kats = [];
    if(tipeSelected === "Semua" || tipeSelected === "Pemasukan") {
        if(DB_PENGATURAN.kategori_pemasukan) kats = kats.concat(DB_PENGATURAN.kategori_pemasukan.split(','));
    }
    if(tipeSelected === "Semua" || tipeSelected === "Pengeluaran") {
        if(DB_PENGATURAN.kategori_pengeluaran) kats = kats.concat(DB_PENGATURAN.kategori_pengeluaran.split(','));
    }
    
    [...new Set(kats.map(s => s.trim()))].forEach(k => {
        if(k) selectKat.innerHTML += `<option value="${k}">${k}</option>`;
    });
}

function renderSumberDanaDropdown() {
    const select = document.getElementById('trx-sumber');
    select.innerHTML = "";
    const abaikanKey = ['nama_user', 'foto_profil', 'kategori_pemasukan', 'kategori_pengeluaran'];
    let adaRekening = false;
    for (let key in DB_PENGATURAN) {
        if (abaikanKey.includes(key)) continue;
        adaRekening = true;
        select.innerHTML += `<option value="${key}">${formatTampilanKey(key)}</option>`;
    }
    if(!adaRekening) select.innerHTML = "<option value=''>Sila tambah akaun di Pengaturan dahulu</option>";
}

function dapatkanKalkulasiSaldo() {
    let totalPemasukan = 0, totalPengeluaran = 0;
    let saldoRekeningBerjalan = {};
    let mutasiPerRekening = {};
    const abaikanKey = ['nama_user', 'foto_profil', 'kategori_pemasukan', 'kategori_pengeluaran'];
    
    for (let key in DB_PENGATURAN) {
        if (abaikanKey.includes(key)) continue;
        saldoRekeningBerjalan[key] = parseFloat(DB_PENGATURAN[key]) || 0;
        mutasiPerRekening[key] = { masuk: 0, keluar: 0 };
    }

    DB_TRANSAKSI.forEach(t => {
        const inVal = parseFloat(t.Pemasukan) || 0;
        const outVal = parseFloat(t.Pengeluaran) || 0;
        totalPemasukan += inVal;
        totalPengeluaran += outVal;
        
        const rekKey = t.Sumber_Dana;
        if (saldoRekeningBerjalan[rekKey] !== undefined) {
            saldoRekeningBerjalan[rekKey] += inVal;
            saldoRekeningBerjalan[rekKey] -= outVal;
            mutasiPerRekening[rekKey].masuk += inVal;
            mutasiPerRekening[rekKey].keluar += outVal;
        }
    });

    return { totalPemasukan, totalPengeluaran, saldoRekeningBerjalan, mutasiPerRekening };
}

function hitungDashboardBeranda() {
    const { totalPemasukan, totalPengeluaran, saldoRekeningBerjalan } = dapatkanKalkulasiSaldo();
    let inHariIni = 0, outHariIni = 0;
    const hariIni = getTodayDate();

    DB_TRANSAKSI.forEach(t => {
        if(bersihkanTanggal(t.Tanggal) === hariIni) {
            inHariIni += parseFloat(t.Pemasukan) || 0;
            outHariIni += parseFloat(t.Pengeluaran) || 0;
        }
    });

    document.getElementById('txt-saldo').innerText = "Rp " + (totalPemasukan - totalPengeluaran).toLocaleString('id-ID');
    document.getElementById('txt-in-hari').innerText = "Rp " + inHariIni.toLocaleString('id-ID');
    document.getElementById('txt-out-hari').innerText = "Rp " + outHariIni.toLocaleString('id-ID');

    const rekContainer = document.getElementById('list-rekening-saldo');
    rekContainer.innerHTML = "";
    for (let key in saldoRekeningBerjalan) {
        rekContainer.innerHTML += `
            <div class="card">
                <h3>${formatTampilanKey(key)}</h3>
                <p>Rp ${saldoRekeningBerjalan[key].toLocaleString('id-ID')}</p>
            </div>`;
    }
}

function hitungStatistikKategori(dataTerfilter) {
    let statIn = {}, statOut = {};
    
    dataTerfilter.forEach(t => {
        const inVal = parseFloat(t.Pemasukan) || 0;
        const outVal = parseFloat(t.Pengeluaran) || 0;
        
        if (inVal > 0) statIn[t.Kategori] = (statIn[t.Kategori] || 0) + inVal;
        if (outVal > 0) statOut[t.Kategori] = (statOut[t.Kategori] || 0) + outVal;
    });

    const cariEkstrim = (obj) => {
        const arr = Object.keys(obj).map(key => ({ kategori: key, jumlah: obj[key] }));
        if (arr.length === 0) return { maks: "-", min: "-" };
        arr.sort((a, b) => b.jumlah - a.jumlah);
        
        const maks = `${arr[0].kategori} (Rp ${arr[0].jumlah.toLocaleString('id-ID')})`;
        const min = `${arr[arr.length - 1].kategori} (Rp ${arr[arr.length - 1].jumlah.toLocaleString('id-ID')})`;
        return { maks, min };
    };

    const resIn = cariEkstrim(statIn);
    const resOut = cariEkstrim(statOut);

    document.getElementById('in-terbesar').innerText = resIn.maks;
    document.getElementById('in-terkecil').innerText = resIn.min;
    document.getElementById('out-terbesar').innerText = resOut.maks;
    document.getElementById('out-terkecil').innerText = resOut.min;
}

// BARU 1: FUNGSI EKSPOR EXCEL (.XLSX) ASLI TANPA MENGHAPUS DATA
function eksporKeExcel() {
    if (DATA_TERFILTER_SEKARANG.length === 0) {
        alert("Tidak ada data transaksi aktif untuk diekspor ke Excel.");
        return;
    }

    // Persiapan baris judul dan tajuk
    const dataArsip = [
        ["LAPORAN TRANSAKSI KEUANGAN"],
        [`Tanggal Unduh: ${getTodayDate()}`],
        [],
        ["Tanggal", "Kategori", "Sumber Dana", "Pemasukan (Rp)", "Pengeluaran (Rp)", "Catatan"]
    ];

    // Petakan isi data terfilter ke dalam baris tabel
    DATA_TERFILTER_SEKARANG.forEach(t => {
        dataArsip.push([
            bersihkanTanggal(t.Tanggal),
            t.Kategori,
            formatTampilanKey(t.Sumber_Dana),
            parseFloat(t.Pemasukan) || 0,
            parseFloat(t.Pengeluaran) || 0,
            t.Catatan || "-"
        ]);
    });

    // Proses pembuatan file Excel menggunakan pustaka SheetJS (xlsx)
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dataArsip);
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");
    XLSX.writeFile(wb, `Laporan_Keuangan_${getTodayDate()}.xlsx`);
}

// BARU 2: FUNGSI CETAK PDF MEMANFAATKAN ENGINE BROWSER (WYSIWYG REAL-TIME)
function eksporKePDF() {
    if (DATA_TERFILTER_SEKARANG.length === 0) {
        alert("Tabel laporan kosong, lakukan filter data terlebih dahulu.");
        return;
    }
    // Set teks metadata dinamis untuk dicetak
    document.getElementById('print-meta-date').innerText = `Dicetak pada tanggal: ${getTodayDate()}`;
    window.print();
}

// BARU 3: FUNGSI TERPISAH UNTUK MEMBERSIHKAN DATABASE JIKA DIKEHENDAKI
async function bersihkanSemuaDataTransaksi() {
    const konfirmasi1 = confirm("PERINGATAN KERAS!\nTindakan ini akan menghapus seluruh data riwayat kas di Google Sheets secara permanen.\n\nPastikan Anda sudah mengunduh berkas Excel (.xlsx) atau PDF terlebih dahulu.");
    if (!konfirmasi1) return;

    const konfirmasi2 = confirm("Apakah Anda benar-benar yakin ingin mengosongkan pembukuan sekarang?");
    if (!konfirmasi2) return;

    try {
        const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "clearTransaksi" }) });
        const json = await res.json();
        if (json.status === "success") {
            alert("Database dibersihkan! Memulai periode buku baru.");
            await initApp();
            switchView('beranda');
        } else {
            alert("Gagal mengosongkan server: " + json.message);
        }
    } catch(e) {
        alert("Koneksi gagal: " + e);
    }
}

function renderTableHariIni() {
    const tbody = document.getElementById('body-hari-ini');
    tbody.innerHTML = "";
    const hariIni = getTodayDate();
    const trxHariIni = DB_TRANSAKSI.filter(t => bersihkanTanggal(t.Tanggal) === hariIni);
    
    if(trxHariIni.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color: var(--text-muted); padding:20px;'>Belum ada transaksi hari ini.</td></tr>";
        return;
    }
    trxHariIni.forEach(t => {
        tbody.innerHTML += `
            <tr>
                <td>${t.Kategori}</td>
                <td>${formatTampilanKey(t.Sumber_Dana)}</td>
                <td style="color:var(--success-color); font-weight:600">Rp ${(parseFloat(t.Pemasukan)||0).toLocaleString('id-ID')}</td>
                <td style="color:var(--danger-color); font-weight:600">Rp ${(parseFloat(t.Pengeluaran)||0).toLocaleString('id-ID')}</td>
                <td>${t.Catatan || '-'}</td>
            </tr>`;
    });
}

async function simpanTransaksi(e) {
    e.preventDefault();
    const id = document.getElementById('trx-id').value;
    const data = {
        tanggal: document.getElementById('trx-tanggal').value,
        jenis: document.getElementById('trx-jenis').value,
        jumlah: parseInt(document.getElementById('trx-jumlah').value),
        sumber_dana: document.getElementById('trx-sumber').value,
        kategori: document.getElementById('trx-kategori').value,
        catatan: document.getElementById('trx-catatan').value
    };

    const action = id ? "updateTransaksi" : "createTransaksi";
    const payload = id ? { action, data: { id, ...data } } : { action, data };

    document.getElementById('btn-submit-trx').innerText = "Menyimpan...";
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
    const json = await res.json();
    
    if(json.status === "success") {
        resetFormTransaksi();
        await initApp();
        switchView('beranda');
    } else {
        alert("Gagal menyimpan: " + json.message);
    }
}

function editTransaksi(id) {
    const t = DB_TRANSAKSI.find(item => item.ID === id);
    if(!t) return;
    
    document.getElementById('trx-id').value = t.ID;
    document.getElementById('trx-tanggal').value = t.Tanggal.split('T')[0];
    const isPemasukan = parseFloat(t.Pemasukan) > 0;
    document.getElementById('trx-jenis').value = isPemasukan ? "Pemasukan" : "Pengeluaran";
    renderKategoriDropdown();
    
    document.getElementById('trx-jumlah').value = isPemasukan ? t.Pemasukan : t.Pengeluaran;
    document.getElementById('trx-sumber').value = t.Sumber_Dana;
    document.getElementById('trx-kategori').value = t.Kategori;
    document.getElementById('trx-catatan').value = t.Catatan;
    
    document.getElementById('form-title').innerText = "Edit Transaksi";
    document.getElementById('btn-submit-trx').innerText = "Update Transaksi";
    document.getElementById('btn-batal-trx').style.display = "block";
    switchView('transaksi');
}

async function hapusTransaksi(id) {
    if(!confirm("Hapus transaksi ini?")) return;
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "deleteTransaksi", id }) });
    const json = await res.json();
    if(json.status === "success") initApp();
}

function resetFormTransaksi() {
    document.getElementById('form-trx').reset();
    document.getElementById('trx-id').value = "";
    document.getElementById('trx-tanggal').value = getTodayDate();
    document.getElementById('form-title').innerText = "Input Transaksi";
    document.getElementById('btn-submit-trx').innerText = "Simpan Transaksi";
    document.getElementById('btn-batal-trx').style.display = "none";
    renderKategoriDropdown();
}

function prosesFilter() {
    const tglMulai = document.getElementById('filter-mulai').value;
    const tglSelesai = document.getElementById('filter-selesai').value;
    const jenis = document.getElementById('filter-jenis').value;
    const katSpesifik = document.getElementById('filter-kategori').value;
    const tbody = document.getElementById('body-table-report');
    tbody.innerHTML = "";
    
    let filtered = DB_TRANSAKSI;
    if(tglMulai) filtered = filtered.filter(t => bersihkanTanggal(t.Tanggal) >= tglMulai);
    if(tglSelesai) filtered = filtered.filter(t => bersihkanTanggal(t.Tanggal) <= tglSelesai);
    
    if(jenis === "Pemasukan") filtered = filtered.filter(t => parseFloat(t.Pemasukan) > 0);
    if(jenis === "Pengeluaran") filtered = filtered.filter(t => parseFloat(t.Pengeluaran) > 0);
    
    if(katSpesifik && katSpesifik !== "Semua") {
        filtered = filtered.filter(t => t.Kategori === katSpesifik);
    }

    // Amankan data ke variabel global agar sinkron saat diekspor sewaktu-waktu
    DATA_TERFILTER_SEKARANG = filtered;

    hitungStatistikKategori(filtered);

    if(filtered.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Tiada rekod ditemui.</td></tr>";
        return;
    }
    filtered.forEach(t => {
        tbody.innerHTML += `
            <tr>
                <td>${bersihkanTanggal(t.Tanggal)}</td>
                <td>${t.Kategori}</td>
                <td>${formatTampilanKey(t.Sumber_Dana)}</td>
                <td style="color:var(--success-color)">Rp ${(parseFloat(t.Pemasukan)||0).toLocaleString('id-ID')}</td>
                <td style="color:var(--danger-color)">Rp ${(parseFloat(t.Pengeluaran)||0).toLocaleString('id-ID')}</td>
                <td>${t.Catatan || '-'}</td>
                <td class="no-print">
                    <button class="btn-edit" onclick="editTransaksi('${t.ID}')">Edit</button>
                    <button class="btn-delete" onclick="hapusTransaksi('${t.ID}')">Hapus</button>
                </td>
            </tr>`;
    });
}

function bukaModalKategori() { document.getElementById('modal-kat').style.display = 'flex'; }
function tutupModalKategori() { document.getElementById('modal-kat').style.display = 'none'; document.getElementById('input-modal-kat').value=""; }

async function simpanKategoriCepat() {
    const namaBaru = document.getElementById('input-modal-kat').value.trim();
    if(!namaBaru) return;
    const jenis = document.getElementById('trx-jenis').value;
    const keyString = jenis === "Pemasukan" ? "kategori_pemasukan" : "kategori_pengeluaran";
    
    let dataLama = DB_PENGATURAN[keyString] || "";
    let dataBaru = dataLama ? dataLama + ", " + namaBaru : namaBaru;
    
    await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "updatePengaturan", data: { [keyString]: dataBaru } }) });
    tutupModalKategori();
    await initApp();
}

async function tambahKategoriSistem(type) {
    const input = document.getElementById(type === 'out' ? 'add-kat-out' : 'add-kat-in');
    const namaBaru = input.value.trim();
    if(!namaBaru) return;
    
    const keyString = type === 'out' ? 'kategori_pengeluaran' : 'kategori_pemasukan';
    let dataLama = DB_PENGATURAN[keyString] || "";
    let dataBaru = dataLama ? dataLama + ", " + namaBaru : namaBaru;
    
    await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "updatePengaturan", data: { [keyString]: dataBaru } }) });
    input.value = "";
    initApp();
}

async function hapusKategoriSistem(type, namaKategori) {
    if(!confirm(`Hapus kategori "${namaKategori}"?`)) return;
    const keyString = type === 'out' ? 'kategori_pengeluaran' : 'kategori_pemasukan';
    let arrayBaru = DB_PENGATURAN[keyString].split(',').map(s => s.trim()).filter(item => item !== namaKategori);
    
    await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "updatePengaturan", data: { [keyString]: arrayBaru.join(', ') } }) });
    initApp();
}

async function tambahRekeningSistem() {
    const namaInput = document.getElementById('add-rek-nama');
    const saldoInput = document.getElementById('add-rek-saldo');
    const namaRekening = namaInput.value.trim();
    const saldoAwal = parseInt(saldoInput.value) || 0;
    
    if(!namaRekening) return alert("Nama akaun tidak boleh kosong!");
    const keyRekening = formatFormatKey(namaRekening);
    
    await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "updatePengaturan", data: { [keyRekening]: saldoAwal } }) });
    namaInput.value = ""; saldoInput.value = "";
    initApp();
}

async function hapusRekeningSistem(key) {
    if(!confirm(`Hapus akaun "${formatTampilanKey(key)}"?`)) return;
    await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "deletePengaturan", key: key }) });
    initApp();
}

async function simpanPengaturan(e) {
    e.preventDefault();
    const data = {
        nama_user: document.getElementById('set-nama').value,
        foto_profil: document.getElementById('set-foto').value
    };
    await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "updatePengaturan", data }) });
    alert("Profil berjaya dikemas kini!");
    initApp();
}