/* ============================================
   SmartPay - Main Application JavaScript
   All data stored in localStorage
   ============================================ */

// ============ DATA MANAGER ============
const DataManager = {
    getUsers() {
        return JSON.parse(localStorage.getItem('sp_users') || '[]');
    },
    saveUsers(users) {
        localStorage.setItem('sp_users', JSON.stringify(users));
    },
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('sp_currentUser') || 'null');
    },
    setCurrentUser(user) {
        localStorage.setItem('sp_currentUser', JSON.stringify(user));
    },
    clearCurrentUser() {
        localStorage.removeItem('sp_currentUser');
    },
    getTransactions() {
        const user = this.getCurrentUser();
        if (!user) return [];
        return JSON.parse(localStorage.getItem(`sp_transactions_${user.email}`) || '[]');
    },
    saveTransactions(transactions) {
        const user = this.getCurrentUser();
        if (!user) return;
        localStorage.setItem(`sp_transactions_${user.email}`, JSON.stringify(transactions));
    },
    getBudgets() {
        const user = this.getCurrentUser();
        if (!user) return [];
        return JSON.parse(localStorage.getItem(`sp_budgets_${user.email}`) || '[]');
    },
    saveBudgets(budgets) {
        const user = this.getCurrentUser();
        if (!user) return;
        localStorage.setItem(`sp_budgets_${user.email}`, JSON.stringify(budgets));
    }
};

// ============ UTILITY FUNCTIONS ============
function formatRupiah(num) {
    if (num === undefined || num === null) return 'Rp. 0';
    return 'Rp. ' + Number(num).toLocaleString('id-ID');
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) +
        ' • ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function getCurrentMonthStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function showToast(title, message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastIcon = document.getElementById('toastIcon');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');

    toastTitle.textContent = title;
    toastMessage.textContent = message;

    toastIcon.className = 'bi me-2';
    if (type === 'success') {
        toastIcon.classList.add('bi-check-circle-fill', 'text-success');
    } else if (type === 'error') {
        toastIcon.classList.add('bi-x-circle-fill', 'text-danger');
    } else if (type === 'warning') {
        toastIcon.classList.add('bi-exclamation-triangle-fill', 'text-warning');
    } else {
        toastIcon.classList.add('bi-info-circle-fill', 'text-primary');
    }

    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
}

// Category icon/color mapping
const CATEGORY_META = {
    'Gaji':          { icon: 'bi-cash-stack',      bg: '#dcfce7', color: '#16a34a' },
    'Freelance':     { icon: 'bi-laptop',          bg: '#dbeafe', color: '#2563eb' },
    'Investasi':     { icon: 'bi-graph-up-arrow',  bg: '#ede9fe', color: '#7c3aed' },
    'Hadiah':        { icon: 'bi-gift',            bg: '#fce7f3', color: '#db2777' },
    'Makanan':       { icon: 'bi-basket-fill',     bg: '#fef3c7', color: '#d97706' },
    'Transportasi':  { icon: 'bi-car-front-fill',  bg: '#dbeafe', color: '#2563eb' },
    'Belanja':       { icon: 'bi-bag-fill',        bg: '#fce7f3', color: '#db2777' },
    'Tagihan':       { icon: 'bi-receipt',          bg: '#fee2e2', color: '#dc2626' },
    'Hiburan':       { icon: 'bi-controller',       bg: '#ede9fe', color: '#7c3aed' },
    'Kesehatan':     { icon: 'bi-heart-pulse-fill', bg: '#fef2f2', color: '#ef4444' },
    'Pendidikan':    { icon: 'bi-book-fill',        bg: '#dbeafe', color: '#1d4ed8' },
    'Tabungan':      { icon: 'bi-piggy-bank-fill',  bg: '#dcfce7', color: '#15803d' },
    'Lainnya':       { icon: 'bi-three-dots',       bg: '#f1f5f9', color: '#64748b' },
};

function getCategoryMeta(kategori) {
    return CATEGORY_META[kategori] || CATEGORY_META['Lainnya'];
}

// ============ PAGE MANAGER ============
const PageManager = {
    cache: {},
    initFunctions: {},

    register(pageName, initFn) {
        this.initFunctions[pageName] = initFn;
    },

    async loadPage(pageName) {
        const container = document.getElementById('page-container');

        if (!this.cache[pageName]) {
            try {
                const response = await fetch(`pages/${pageName}.html?v=${Date.now()}`);
                if (!response.ok) throw new Error('Page not found');
                this.cache[pageName] = await response.text();
            } catch (err) {
                container.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
                        <h5>Halaman tidak ditemukan</h5>
                        <p>Gagal memuat halaman "${pageName}"</p>
                    </div>`;
                return;
            }
        }

        container.innerHTML = this.cache[pageName];

        if (this.initFunctions[pageName]) {
            this.initFunctions[pageName]();
        }
    }
};

// ============ NAVIGATION ============
function navigateTo(pageName) {
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar-nav .nav-link[data-page="${pageName}"]`);
    if (activeLink) activeLink.classList.add('active');

    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');

    PageManager.loadPage(pageName);
}

// ============ AUTH UI ============
function updateAuthUI() {
    const user = DataManager.getCurrentUser();
    const authBtns = document.getElementById('authButtons');
    const userInfoEl = document.getElementById('userInfo');

    if (user) {
        authBtns.classList.add('d-none');
        userInfoEl.classList.remove('d-none');
        userInfoEl.classList.add('d-flex');
        document.getElementById('userGreeting').textContent = `Halo, ${user.nama}`;
    } else {
        authBtns.classList.remove('d-none');
        userInfoEl.classList.add('d-none');
        userInfoEl.classList.remove('d-flex');
    }
}

// ============================================================
//  AUTH (Login / Register / Logout)
// ============================================================
function initAuth() {
    document.getElementById('formRegister').addEventListener('submit', handleRegister);
    document.getElementById('formLogin').addEventListener('submit', handleLogin);

    document.getElementById('switchToRegister').addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterPage();
    });
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginPage();
    });

    document.getElementById('btn-masuk').addEventListener('click', () => showLoginPage());
    document.getElementById('btn-daftar').addEventListener('click', () => showRegisterPage());
}

function showLoginPage() {
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('registerPage').classList.remove('active');
}

function showRegisterPage() {
    document.getElementById('registerPage').classList.add('active');
    document.getElementById('loginPage').classList.remove('active');
}

function handleRegister(e) {
    e.preventDefault();
    const nama = document.getElementById('regNama').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const telepon = document.getElementById('regTelepon').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    if (!nama || !email || !password) {
        showToast('Error', 'Semua field harus diisi!', 'error');
        return;
    }
    if (password.length < 8) {
        showToast('Error', 'Password minimal 8 karakter!', 'error');
        return;
    }
    if (password !== passwordConfirm) {
        showToast('Error', 'Konfirmasi password tidak cocok!', 'error');
        return;
    }

    const users = DataManager.getUsers();
    if (users.find(u => u.email === email)) {
        showToast('Error', 'Email sudah terdaftar!', 'error');
        return;
    }

    const newUser = { nama, email, password, telepon };
    users.push(newUser);
    DataManager.saveUsers(users);
    DataManager.setCurrentUser(newUser);

    document.getElementById('registerPage').classList.remove('active');
    document.getElementById('formRegister').reset();
    updateAuthUI();
    navigateTo('beranda');
    showToast('Berhasil', `Selamat datang, ${nama}!`, 'success');
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    const users = DataManager.getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showToast('Error', 'Email atau password salah!', 'error');
        return;
    }

    DataManager.setCurrentUser(user);
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('formLogin').reset();
    updateAuthUI();
    navigateTo('beranda');
    showToast('Berhasil', `Selamat datang kembali, ${user.nama}!`, 'success');
}

function handleLogout() {
    if (!confirm('Yakin ingin keluar?')) return;
    DataManager.clearCurrentUser();
    updateAuthUI();
    navigateTo('beranda');
    showToast('Berhasil', 'Anda telah keluar.', 'info');
}

// ============================================================
//  BERANDA (Dashboard)
// ============================================================
PageManager.register('beranda', function () {
    refreshDashboard();
});

function refreshDashboard() {
    const user = DataManager.getCurrentUser();
    const welcomeTitle = document.getElementById('welcomeTitle');
    if (welcomeTitle) {
        welcomeTitle.textContent = user
            ? `Selamat Datang, ${user.nama}!`
            : 'Selamat Datang, Siapa Ya?';
    }

    const transactions = DataManager.getTransactions();
    const currentMonth = getCurrentMonthStr();
    const monthlyTx = transactions.filter(t => t.tanggal.startsWith(currentMonth));

    const totalPemasukan = monthlyTx.filter(t => t.tipe === 'pemasukan').reduce((sum, t) => sum + t.jumlah, 0);
    const totalPengeluaran = monthlyTx.filter(t => t.tipe === 'pengeluaran').reduce((sum, t) => sum + t.jumlah, 0);
    const totalSaldo = totalPemasukan - totalPengeluaran;

    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('totalPemasukan', formatRupiah(totalPemasukan));
    el('totalPengeluaran', formatRupiah(totalPengeluaran));
    el('totalSaldo', formatRupiah(totalSaldo));
}

// ============================================================
//  CATAT TRANSAKSI
// ============================================================
PageManager.register('catat-transaksi', function () {
    document.getElementById('tanggalTransaksi').value = new Date().toISOString().split('T')[0];
    document.getElementById('formTransaksi').addEventListener('submit', handleAddTransaction);
});

function handleAddTransaction(e) {
    e.preventDefault();
    const user = DataManager.getCurrentUser();
    if (!user) {
        showToast('Error', 'Silakan masuk terlebih dahulu!', 'error');
        return;
    }

    const judul = document.getElementById('judulTransaksi').value.trim();
    const tipe = document.querySelector('input[name="tipeTransaksi"]:checked').value;
    const jumlah = parseInt(document.getElementById('jumlahTransaksi').value);
    const kategori = document.getElementById('kategoriTransaksi').value;
    const tanggal = document.getElementById('tanggalTransaksi').value;
    const catatan = document.getElementById('catatanTransaksi').value.trim();

    if (!judul || !jumlah || !kategori || !tanggal) {
        showToast('Error', 'Mohon lengkapi semua field!', 'error');
        return;
    }

    const transactions = DataManager.getTransactions();
    transactions.unshift({
        id: generateId(),
        judul,
        tipe,
        jumlah,
        kategori,
        tanggal,
        catatan: catatan || '-',
        createdAt: new Date().toISOString()
    });
    DataManager.saveTransactions(transactions);

    document.getElementById('formTransaksi').reset();
    document.getElementById('tipePemasukan').checked = true;
    document.getElementById('tanggalTransaksi').value = new Date().toISOString().split('T')[0];

    showToast('Berhasil', `${tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} berhasil dicatat!`, 'success');
}

// ============================================================
//  ANGGARAN (Budget)
// ============================================================
PageManager.register('anggaran', function () {
    document.getElementById('formAnggaran').addEventListener('submit', handleAddBudget);
    refreshBudgets();
});

function handleAddBudget(e) {
    e.preventDefault();
    const user = DataManager.getCurrentUser();
    if (!user) {
        showToast('Error', 'Silakan masuk terlebih dahulu!', 'error');
        return;
    }

    const kategori = document.getElementById('namaAnggaran').value;
    const jumlah = parseInt(document.getElementById('jumlahAnggaran').value);
    const bulan = getCurrentMonthStr();

    if (!kategori || !jumlah) {
        showToast('Error', 'Mohon lengkapi semua field!', 'error');
        return;
    }

    const budgets = DataManager.getBudgets();
    const existingIdx = budgets.findIndex(b => b.kategori === kategori && b.bulan === bulan);
    if (existingIdx >= 0) {
        budgets[existingIdx].jumlah = jumlah;
    } else {
        budgets.push({ id: generateId(), kategori, jumlah, bulan });
    }

    DataManager.saveBudgets(budgets);
    document.getElementById('formAnggaran').reset();
    refreshBudgets();
    showToast('Berhasil', 'Anggaran berhasil disimpan!', 'success');
}

function deleteBudget(id) {
    if (!confirm('Hapus anggaran ini?')) return;
    let budgets = DataManager.getBudgets();
    budgets = budgets.filter(b => b.id !== id);
    DataManager.saveBudgets(budgets);
    refreshBudgets();
    showToast('Berhasil', 'Anggaran berhasil dihapus.', 'success');
}

function refreshBudgets() {
    const container = document.getElementById('listAnggaran');
    if (!container) return;

    const currentMonth = getCurrentMonthStr();
    const budgets = DataManager.getBudgets().filter(b => b.bulan === currentMonth);
    const transactions = DataManager.getTransactions();

    if (budgets.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-wallet fs-1 d-block mb-2"></i>
                Belum ada anggaran untuk bulan ini
            </div>`;
        return;
    }

    container.innerHTML = budgets.map(b => {
        const spent = transactions
            .filter(t => t.tipe === 'pengeluaran' && t.kategori === b.kategori && t.tanggal.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.jumlah, 0);

        const percentage = Math.min(Math.round((spent / b.jumlah) * 100), 100);
        let barColor = 'bg-success';
        if (percentage > 75) barColor = 'bg-danger';
        else if (percentage > 50) barColor = 'bg-warning';

        const meta = getCategoryMeta(b.kategori);

        return `
            <div class="anggaran-card" onclick="event.stopPropagation()">
                <div class="anggaran-card-header">
                    <div class="anggaran-icon" style="background:${meta.bg};color:${meta.color}">
                        <i class="bi ${meta.icon}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="anggaran-card-title">${b.kategori}</div>
                        <p class="anggaran-card-subtitle">Anggaran Bulan Ini</p>
                    </div>
                    <button class="btn-delete" onclick="deleteBudget('${b.id}')" title="Hapus">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
                <div class="anggaran-progress-info">
                    <span>${formatRupiah(spent)} / ${formatRupiah(b.jumlah)}</span>
                    <span class="${percentage > 75 ? 'text-danger' : percentage > 50 ? 'text-warning' : 'text-success'}">${percentage}%</span>
                </div>
                <div class="progress" style="height:6px;border-radius:3px;">
                    <div class="progress-bar ${barColor}" style="width:${percentage}%;border-radius:3px;"></div>
                </div>
                <div class="anggaran-sisa">Sisa: <strong>${formatRupiah(Math.max(b.jumlah - spent, 0))}</strong></div>
            </div>`;
    }).join('');
}

// ============================================================
//  LAPORAN (Report) - Monthly Table
// ============================================================
PageManager.register('laporan', function () {
    refreshReport();
});

function refreshReport() {
    const transactions = DataManager.getTransactions();
    const currentMonth = getCurrentMonthStr();

    // Summary for current month
    const monthlyTx = transactions.filter(t => t.tanggal.startsWith(currentMonth));
    const totalIn = monthlyTx.filter(t => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0);
    const totalOut = monthlyTx.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0);

    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('laporanPemasukan', formatRupiah(totalIn));
    el('laporanPengeluaran', formatRupiah(totalOut));
    el('laporanSelisih', formatRupiah(totalIn - totalOut));

    // Monthly table - generate for all months that have data
    const monthSet = new Set();
    transactions.forEach(t => { monthSet.add(t.tanggal.substring(0, 7)); });

    // Also include current month even if no data
    monthSet.add(currentMonth);

    const sortedMonths = Array.from(monthSet).sort().reverse();
    const tbody = document.getElementById('listLaporanBulanan');
    if (!tbody) return;

    if (sortedMonths.length === 0 || transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4"><i class="bi bi-inbox fs-1 d-block mb-2"></i>Belum ada data laporan</td></tr>`;
        return;
    }

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    tbody.innerHTML = sortedMonths.map(m => {
        const mTx = transactions.filter(t => t.tanggal.startsWith(m));
        const mIn = mTx.filter(t => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0);
        const mOut = mTx.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0);
        const saldo = mIn - mOut;
        const [y, mo] = m.split('-');
        const mName = monthNames[parseInt(mo) - 1];

        return `<tr>
            <td class="fw-semibold">${mName}</td>
            <td class="text-success fw-semibold">${formatRupiah(mIn)}</td>
            <td class="text-danger fw-semibold">${formatRupiah(mOut)}</td>
            <td class="fw-bold">${formatRupiah(saldo)}</td>
            <td><span class="badge-${saldo >= 0 ? 'surplus' : 'defisit'}">${saldo >= 0 ? 'Surplus' : 'Defisit'}</span></td>
        </tr>`;
    }).join('');
}

// ============================================================
//  STATISTIK (Statistics / Charts)
// ============================================================
let chartBar = null, chartDoughnut = null;

PageManager.register('statistik', function () {
    refreshStatistics();
});

function refreshStatistics() {
    const transactions = DataManager.getTransactions();
    const currentMonth = getCurrentMonthStr();
    const monthlyTx = transactions.filter(t => t.tanggal.startsWith(currentMonth));

    // --- Doughnut Chart: Pengeluaran per kategori ---
    const pengeluaranByCategory = {};
    monthlyTx.filter(t => t.tipe === 'pengeluaran').forEach(t => {
        pengeluaranByCategory[t.kategori] = (pengeluaranByCategory[t.kategori] || 0) + t.jumlah;
    });

    const categoryLabels = Object.keys(pengeluaranByCategory);
    const categoryValues = Object.values(pengeluaranByCategory);
    const chartColors = ['#4e54c8', '#22c55e', '#ef4444', '#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'];

    if (chartDoughnut) chartDoughnut.destroy();
    const ctxDoughnut = document.getElementById('chartDoughnut').getContext('2d');
    chartDoughnut = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: categoryLabels.length ? categoryLabels : ['Belum ada data'],
            datasets: [{
                data: categoryValues.length ? categoryValues : [1],
                backgroundColor: categoryValues.length ? chartColors.slice(0, categoryLabels.length) : ['#e2e8f0'],
                borderWidth: 2, borderColor: '#fff',
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 11, family: 'Inter' } } },
                tooltip: { callbacks: { label: ctx => categoryValues.length ? `${ctx.label}: ${formatRupiah(ctx.raw)}` : 'Belum ada data' } }
            }
        }
    });

    // --- Bar Chart: Perbandingan Bulanan (6 months) ---
    const months = [], incomeTrend = [], expenseTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push(d.toLocaleDateString('id-ID', { month: 'short' }));
        const mTx = transactions.filter(t => t.tanggal.startsWith(monthStr));
        incomeTrend.push(mTx.filter(t => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0));
        expenseTrend.push(mTx.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0));
    }

    if (chartBar) chartBar.destroy();
    const ctxBar = document.getElementById('chartBar').getContext('2d');
    chartBar = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                { label: 'Pemasukan', data: incomeTrend, backgroundColor: 'rgba(34,197,94,0.8)', borderRadius: 6, barPercentage: 0.5 },
                { label: 'Pengeluaran', data: expenseTrend, backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 6, barPercentage: 0.5 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11, family: 'Inter' } } },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatRupiah(ctx.raw)}` } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { callback: v => 'Rp ' + (v / 1000) + 'K' }, grid: { color: 'rgba(0,0,0,0.04)' } },
                x: { grid: { display: false } }
            }
        }
    });

    // --- Stat Cards ---
    const totalOut = monthlyTx.filter(t => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = Math.min(now.getDate(), daysInMonth);
    const avgDaily = currentDay > 0 ? Math.round(totalOut / currentDay) : 0;

    // Previous month comparison
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    const prevTotalOut = transactions.filter(t => t.tipe === 'pengeluaran' && t.tanggal.startsWith(prevMonthStr)).reduce((s, t) => s + t.jumlah, 0);
    const prevDays = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
    const prevAvgDaily = prevDays > 0 ? Math.round(prevTotalOut / prevDays) : 0;

    let changePercent = 0;
    if (prevAvgDaily > 0) changePercent = Math.round(((avgDaily - prevAvgDaily) / prevAvgDaily) * 100);

    document.getElementById('statAvgDaily').textContent = formatRupiah(avgDaily);
    const changeEl = document.getElementById('statAvgChange');
    if (changeEl) {
        if (changePercent > 0) {
            changeEl.innerHTML = `<span class="text-danger">↑ ${changePercent}% dari bulan lalu</span>`;
        } else if (changePercent < 0) {
            changeEl.innerHTML = `<span class="text-success">↓ ${Math.abs(changePercent)}% dari bulan lalu</span>`;
        } else {
            changeEl.innerHTML = `<span class="text-muted">Sama dengan bulan lalu</span>`;
        }
    }

    // Top category
    let topCat = '-', topPercent = '';
    if (categoryLabels.length > 0) {
        const maxIdx = categoryValues.indexOf(Math.max(...categoryValues));
        topCat = categoryLabels[maxIdx];
        topPercent = `${((categoryValues[maxIdx] / totalOut) * 100).toFixed(1)}% dari total pengeluaran`;
    }
    document.getElementById('statTopCategory').textContent = topCat;
    document.getElementById('statTopPercent').textContent = topPercent;

    // Total transactions
    document.getElementById('statTotalTx').textContent = monthlyTx.length;
}

// ============================================================
//  RIWAYAT (Transaction History) - Card List
// ============================================================
let riwayatFilter = 'semua';

PageManager.register('riwayat', function () {
    riwayatFilter = 'semua';

    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', function () {
            riwayatFilter = this.getAttribute('data-filter');

            // Update active state
            document.getElementById('filterSemua').classList.remove('active');
            document.getElementById('filterPemasukan').classList.remove('active');
            document.getElementById('filterPengeluaran').classList.remove('active');
            this.classList.add('active');

            refreshHistory();
        });
    });

    // Search
    document.getElementById('searchRiwayat').addEventListener('input', function () {
        refreshHistory();
    });

    refreshHistory();
});

function refreshHistory() {
    const container = document.getElementById('listRiwayat');
    if (!container) return;

    let transactions = DataManager.getTransactions();
    const searchVal = (document.getElementById('searchRiwayat') || {}).value || '';

    // Apply filter
    if (riwayatFilter === 'pemasukan') {
        transactions = transactions.filter(t => t.tipe === 'pemasukan');
    } else if (riwayatFilter === 'pengeluaran') {
        transactions = transactions.filter(t => t.tipe === 'pengeluaran');
    }

    // Apply search
    if (searchVal.trim()) {
        const q = searchVal.toLowerCase();
        transactions = transactions.filter(t =>
            (t.judul || '').toLowerCase().includes(q) ||
            t.kategori.toLowerCase().includes(q) ||
            (t.catatan || '').toLowerCase().includes(q)
        );
    }

    // Sort by date desc
    transactions.sort((a, b) => new Date(b.createdAt || b.tanggal) - new Date(a.createdAt || a.tanggal));

    if (transactions.length === 0) {
        container.innerHTML = `<div class="text-center text-muted py-5"><i class="bi bi-inbox fs-1 d-block mb-2"></i>Tidak ada data transaksi</div>`;
        return;
    }

    container.innerHTML = transactions.map(t => {
        const meta = getCategoryMeta(t.kategori);
        const title = t.judul || t.kategori;
        const isIn = t.tipe === 'pemasukan';
        const amountColor = isIn ? 'text-success' : 'text-danger';
        const prefix = isIn ? '+' : '-';

        return `
            <div class="riwayat-item">
                <div class="riwayat-icon" style="background:${meta.bg};color:${meta.color}">
                    <i class="bi ${meta.icon}"></i>
                </div>
                <div class="riwayat-info">
                    <div class="riwayat-title">${title}</div>
                    <div class="riwayat-meta">
                        <span class="riwayat-kategori ${t.tipe}">${t.kategori}</span>
                        <span>•</span>
                        <span>${formatDateTime(t.createdAt)}</span>
                    </div>
                </div>
                <div class="riwayat-amount ${amountColor}">${prefix} ${formatRupiah(t.jumlah)}</div>
            </div>`;
    }).join('');
}

// ============================================================
//  TIPS KEUANGAN
// ============================================================
PageManager.register('tips', function () {
    document.getElementById('btnHitungAlokasi').addEventListener('click', function () {
        const pendapatan = parseInt(document.getElementById('inputPendapatan').value);
        if (!pendapatan || pendapatan <= 0) {
            showToast('Error', 'Masukkan pendapatan yang valid!', 'error');
            return;
        }

        document.getElementById('alokasiKebutuhan').textContent = formatRupiah(Math.round(pendapatan * 0.5));
        document.getElementById('alokasiKeinginan').textContent = formatRupiah(Math.round(pendapatan * 0.3));
        document.getElementById('alokasiTabungan').textContent = formatRupiah(Math.round(pendapatan * 0.2));
        document.getElementById('hasilAlokasi').classList.remove('d-none');
    });
});

// ============================================================
//  PROFIL (Profile)
// ============================================================
PageManager.register('profil', function () {
    document.getElementById('formProfil').addEventListener('submit', handleUpdateProfile);
    refreshProfile();
});

function refreshProfile() {
    const user = DataManager.getCurrentUser();

    const elNama = document.getElementById('profilNama');
    const elEmail = document.getElementById('profilEmail');
    const elEditNama = document.getElementById('editNama');
    const elEditEmail = document.getElementById('editEmail');
    const elEditTelepon = document.getElementById('editTelepon');

    if (!user) {
        if (elNama) elNama.textContent = '-';
        if (elEmail) elEmail.textContent = '-';
        if (elEditNama) elEditNama.value = '';
        if (elEditEmail) elEditEmail.value = '';
        if (elEditTelepon) elEditTelepon.value = '';
        return;
    }

    if (elNama) elNama.textContent = user.nama;
    if (elEmail) elEmail.textContent = user.email;
    if (elEditNama) elEditNama.value = user.nama;
    if (elEditEmail) elEditEmail.value = user.email;
    if (elEditTelepon) elEditTelepon.value = user.telepon || '';
}

function handleUpdateProfile(e) {
    e.preventDefault();
    const user = DataManager.getCurrentUser();
    if (!user) {
        showToast('Error', 'Silakan masuk terlebih dahulu!', 'error');
        return;
    }

    const nama = document.getElementById('editNama').value.trim();
    const email = document.getElementById('editEmail').value.trim().toLowerCase();
    const telepon = document.getElementById('editTelepon').value.trim();

    if (!nama || !email) {
        showToast('Error', 'Nama dan email wajib diisi!', 'error');
        return;
    }

    const users = DataManager.getUsers();
    const idx = users.findIndex(u => u.email === user.email);
    if (idx >= 0) {
        users[idx].nama = nama;
        users[idx].telepon = telepon;
        if (email !== user.email) {
            const oldEmail = user.email;
            users[idx].email = email;
            const tx = localStorage.getItem(`sp_transactions_${oldEmail}`);
            const bg = localStorage.getItem(`sp_budgets_${oldEmail}`);
            if (tx) { localStorage.setItem(`sp_transactions_${email}`, tx); localStorage.removeItem(`sp_transactions_${oldEmail}`); }
            if (bg) { localStorage.setItem(`sp_budgets_${email}`, bg); localStorage.removeItem(`sp_budgets_${oldEmail}`); }
        }
        DataManager.saveUsers(users);
        DataManager.setCurrentUser(users[idx]);
    }

    updateAuthUI();
    refreshProfile();
    showToast('Berhasil', 'Profil berhasil diperbarui!', 'success');
}

// ============================================================
//  INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {

    // --- Load auth pages ---
    try {
        const [loginRes, registerRes] = await Promise.all([
            fetch('pages/login.html'),
            fetch('pages/register.html')
        ]);
        document.getElementById('loginPage').innerHTML = await loginRes.text();
        document.getElementById('registerPage').innerHTML = await registerRes.text();
        initAuth();
    } catch (err) {
        console.error('Failed to load auth pages:', err);
    }

    // --- Event delegation for [data-page] navigation ---
    document.addEventListener('click', (e) => {
        const pageLink = e.target.closest('[data-page]');
        if (pageLink) {
            e.preventDefault();
            navigateTo(pageLink.getAttribute('data-page'));
        }
    });

    // --- Mobile Sidebar ---
    document.getElementById('mobileSidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    });

    document.getElementById('sidebarOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
    });

    document.getElementById('sidebarToggle').addEventListener('click', () => {
        if (window.innerWidth < 992) {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebarOverlay').classList.remove('active');
        }
    });

    // --- Logout ---
    document.getElementById('btn-keluar').addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });

    // --- User avatar click -> profile ---
    document.getElementById('userAvatar').addEventListener('click', () => navigateTo('profil'));

    // --- Initialize UI ---
    updateAuthUI();
    navigateTo('beranda');
});
