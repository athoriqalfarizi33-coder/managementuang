// ================= DATA KATEGORI DINAMIS =================
const INCOME_SOURCES = [
  "Gaji / Upah Bulanan",
  "Uang Saku / Jajan",
  "Hasil Usaha / Jualan",
  "Bonus / Tunjangan",
  "Hadiah / Pemberian",
  "Sumber Lainnya"
];

const EXPENSE_PURPOSES = [
  "Makan & Minum",
  "Transportasi / Bensin",
  "Pendidikan / Buku / Alat Tulis",
  "Belanja Kebutuhan Sehari-hari",
  "Tagihan Listrik / Air / Internet",
  "Tabungan / Investasi",
  "Hiburan / Rekreasi",
  "Keperluan Lainnya"
];

const RATING_LABELS = {
  1: "1 / 5 — Kurang Suka",
  2: "2 / 5 — Cukup",
  3: "3 / 5 — Lumayan Baik",
  4: "4 / 5 — Suka",
  5: "5 / 5 — Sangat Suka"
};

// ================= STATE & PENYIMPANAN LOCALSTORAGE =================
const STORAGE_KEYS = {
  TRANSACTIONS: "duitly_transactions_v1",
  TARGET: "duitly_target_v1",
  FEEDBACKS: "duitly_feedbacks_v1"
};

function getTodayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().split("T")[0];
}

function getDefaultTransactions() {
  const today = new Date();
  const formatOffsetDate = (daysAgo) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d - offset).toISOString().split("T")[0];
  };

  return [
    {
      id: 1,
      type: "pemasukan",
      category: "Gaji / Upah Bulanan",
      note: "Gaji Utama Bulan Ini",
      amount: 3500000,
      date: formatOffsetDate(5)
    },
    {
      id: 2,
      type: "pengeluaran",
      category: "Makan & Minum",
      note: "Belanja bahan makanan mingguan",
      amount: 450000,
      date: formatOffsetDate(3)
    },
    {
      id: 3,
      type: "pemasukan",
      category: "Hasil Usaha / Jualan",
      note: "Keuntungan jualan online",
      amount: 1200000,
      date: formatOffsetDate(1)
    },
    {
      id: 4,
      type: "pengeluaran",
      category: "Transportasi / Bensin",
      note: "Isi bensin & parkir",
      amount: 150000,
      date: formatOffsetDate(0)
    }
  ];
}

function getDefaultFeedbacks() {
  return [
    {
      id: 101,
      name: "Rina Wulandari",
      role: "Guru",
      rating: 5,
      critique: "Tampilan sudah sangat jelas, semoga ke depan bisa ditambah fitur cetak laporan PDF.",
      suggestion: "Tambahkan pengingat rutin menabung setiap akhir pekan.",
      createdAt: "Hari ini"
    }
  ];
}

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || getDefaultTransactions();
let savingTarget = Number(localStorage.getItem(STORAGE_KEYS.TARGET)) || 4000000;
let feedbacks = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACKS)) || getDefaultFeedbacks();
let currentPeriod = "harian";
let financeChartInstance = null;

function saveData() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  localStorage.setItem(STORAGE_KEYS.TARGET, String(savingTarget));
  localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
}

// ================= FORMATTER RUPIAH & TANGGAL =================
function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(angka || 0);
}

function formatDateID(isoDate) {
  if (!isoDate) return "-";
  const [y, m, d] = isoDate.split("-");
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d} ${bulan[parseInt(m, 10) - 1]} ${y}`;
}

// ================= NAVIGASI TAB =================
function switchTab(tabId) {
  document.querySelectorAll(".tab-section").forEach((sec) => {
    sec.classList.remove("active");
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const targetSection = document.getElementById(tabId);
  const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);

  if (targetSection) targetSection.classList.add("active");
  if (targetBtn) targetBtn.classList.add("active");

  if (tabId === "finance") {
    renderChart();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ================= DINAMIS FORM TRANSAKSI (PEMASUKAN VS PENGELUARAN) =================
function toggleTxFields() {
  const selectedType = document.querySelector('input[name="txType"]:checked').value;
  const labelIncome = document.getElementById("labelIncome");
  const labelExpense = document.getElementById("labelExpense");
  const sourcePurposeLabel = document.getElementById("sourcePurposeLabel");
  const detailLabel = document.getElementById("detailLabel");
  const amountLabel = document.getElementById("amountLabel");
  const txNote = document.getElementById("txNote");
  const txCategory = document.getElementById("txCategory");

  txCategory.innerHTML = "";

  if (selectedType === "pemasukan") {
    labelIncome.classList.add("active-income");
    labelExpense.classList.remove("active-expense");
    sourcePurposeLabel.textContent = "Duitnya dari mana? (Sumber Pemasukan)";
    detailLabel.textContent = "Keterangan Sumber Pemasukan";
    amountLabel.textContent = "Total Pemasukan (dalam Rupiah)";
    txNote.placeholder = "Contoh: Gaji bulanan / Uang saku / Hasil jualan";

    INCOME_SOURCES.forEach((src) => {
      const opt = document.createElement("option");
      opt.value = src;
      opt.textContent = src;
      txCategory.appendChild(opt);
    });
  } else {
    labelExpense.classList.add("active-expense");
    labelIncome.classList.remove("active-income");
    sourcePurposeLabel.textContent = "Duitnya dibuat apa? (Keperluan Pengeluaran)";
    detailLabel.textContent = "Keterangan Keperluan Pengeluaran";
    amountLabel.textContent = "Jumlah Pengeluaran (dalam Rupiah)";
    txNote.placeholder = "Contoh: Beli makan siang / Bayar listrik / Beli buku";

    EXPENSE_PURPOSES.forEach((purp) => {
      const opt = document.createElement("option");
      opt.value = purp;
      opt.textContent = purp;
      txCategory.appendChild(opt);
    });
  }
}

// ================= HITUNG & UPDATE RINGKASAN KEUANGAN =================
function updateFinanceSummary() {
  const totalPemasukan = transactions
    .filter((t) => t.type === "pemasukan")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPengeluaran = transactions
    .filter((t) => t.type === "pengeluaran")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalTabungan = totalPemasukan - totalPengeluaran;

  // Hitung progres target penabungan
  let percentage = 0;
  if (savingTarget > 0) {
    percentage = Math.max(0, Math.min(100, Math.round((totalTabungan / savingTarget) * 100)));
  }

  // Update Kartu Tab Management Keuangan
  document.getElementById("totalTabungan").textContent = formatRupiah(totalTabungan);
  document.getElementById("totalPemasukan").textContent = formatRupiah(totalPemasukan);
  document.getElementById("totalPengeluaran").textContent = formatRupiah(totalPengeluaran);
  document.getElementById("displayTarget").textContent = formatRupiah(savingTarget);
  document.getElementById("targetPercentBadge").textContent = `${percentage}%`;
  document.getElementById("targetProgressBar").style.width = `${percentage}%`;

  // Update Ringkasan di Tampilan Awal (Overview)
  document.getElementById("ovTotalTabungan").textContent = formatRupiah(totalTabungan);
  document.getElementById("ovTotalPemasukan").textContent = formatRupiah(totalPemasukan);
  document.getElementById("ovTotalPengeluaran").textContent = formatRupiah(totalPengeluaran);
  document.getElementById("ovTargetPercent").textContent = `${percentage}%`;
  document.getElementById("ovTargetBar").style.width = `${percentage}%`;
  document.getElementById("ovTargetInfo").textContent = `Target: ${formatRupiah(savingTarget)}`;

  // Cek apakah sudah mencapai target penabungan -> Tampilkan Ucapan Selamat!
  const congratsBanner = document.getElementById("congratsBanner");
  const congratsText = document.getElementById("congratsText");
  const targetStatusText = document.getElementById("targetStatusText");

  if (savingTarget > 0 && totalTabungan >= savingTarget) {
    congratsBanner.style.display = "flex";
    congratsText.textContent = `Selamat! Total tabungan Anda sebesar ${formatRupiah(totalTabungan)} telah mencapai target penabungan (${formatRupiah(savingTarget)}). Terus pertahankan kebiasaan baik ini!`;
    targetStatusText.textContent = "🎉 Target penabungan telah tercapai!";
    targetStatusText.style.color = "#0f7c47";
    targetStatusText.style.fontWeight = "700";
  } else {
    congratsBanner.style.display = "none";
    const kurang = Math.max(0, savingTarget - totalTabungan);
    targetStatusText.textContent =
      savingTarget > 0
        ? `Kurang ${formatRupiah(kurang)} lagi untuk mencapai target`
        : "Atur nominal target tabungan Anda";
    targetStatusText.style.color = "";
    targetStatusText.style.fontWeight = "";
  }
}

// ================= RENDER TABEL TRANSAKSI =================
function renderTransactions() {
  const tbody = document.getElementById("transactionTableBody");
  const filter = document.getElementById("tableFilter").value;

  const filtered = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter((t) => (filter === "semua" ? true : t.type === filter));

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center muted-text" style="padding: 24px;">
          Belum ada catatan transaksi pada kategori ini.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (t) => `
      <tr>
        <td>${formatDateID(t.date)}</td>
        <td>
          <span class="badge-type ${t.type}">
            ${t.type === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
          </span>
        </td>
        <td><strong>${escapeHTML(t.category)}</strong></td>
        <td>${escapeHTML(t.note)}</td>
        <td class="text-right ${t.type === "pemasukan" ? "text-green" : "text-red"}">
          <strong>${t.type === "pemasukan" ? "+" : "−"} ${formatRupiah(t.amount)}</strong>
        </td>
        <td class="text-center">
          <button type="button" class="btn-delete-row" onclick="deleteTransaction(${t.id})">Hapus</button>
        </td>
      </tr>
    `
    )
    .join("");
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveData();
  refreshAllUI();
}

function clearAllTransactions() {
  if (confirm("Apakah Anda yakin ingin menghapus semua riwayat transaksi?")) {
    transactions = [];
    saveData();
    refreshAllUI();
  }
}

function exportCSV() {
  if (transactions.length === 0) {
    alert("Belum ada data transaksi untuk diekspor.");
    return;
  }
  const headers = ["Tanggal", "Jenis", "Dari Mana / Dibuat Apa", "Keterangan", "Jumlah (Rp)"];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    `"${t.category.replace(/"/g, '""')}"`,
    `"${t.note.replace(/"/g, '""')}"`,
    t.amount
  ]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `laporan-keuangan-duitly-${getTodayISO()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ================= GRAFIK PEMASUKAN - PENGELUARAN (4 PERIODE) =================
function changeChartPeriod(period) {
  currentPeriod = period;
  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.period === period);
  });
  renderChart();
}

function getWeekKey(isoDate) {
  const date = new Date(isoDate + "T00:00:00");
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date - startOfYear) / 86400000);
  const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function formatPeriodLabel(key, period) {
  const bulanNama = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  if (period === "harian") {
    return formatDateID(key);
  }
  if (period === "mingguan") {
    const [year, week] = key.split("-W");
    return `Minggu ${parseInt(week, 10)} (${year})`;
  }
  if (period === "bulanan") {
    const [year, month] = key.split("-");
    return `${bulanNama[parseInt(month, 10) - 1]} ${year}`;
  }
  return `Tahun ${key}`;
}

function groupTransactionsByPeriod(period) {
  const map = {};

  transactions.forEach((t) => {
    let key = t.date;
    if (period === "mingguan") key = getWeekKey(t.date);
    else if (period === "bulanan") key = t.date.slice(0, 7);
    else if (period === "tahunan") key = t.date.slice(0, 4);

    if (!map[key]) {
      map[key] = { pemasukan: 0, pengeluaran: 0 };
    }
    if (t.type === "pemasukan") map[key].pemasukan += Number(t.amount);
    else map[key].pengeluaran += Number(t.amount);
  });

  const sortedKeys = Object.keys(map).sort().slice(-10);
  return {
    labels: sortedKeys.map((k) => formatPeriodLabel(k, period)),
    incomeData: sortedKeys.map((k) => map[k].pemasukan),
    expenseData: sortedKeys.map((k) => map[k].pengeluaran)
  };
}

function renderChart() {
  const canvas = document.getElementById("financeChart");
  if (!canvas || typeof Chart === "undefined") return;

  const { labels, incomeData, expenseData } = groupTransactionsByPeriod(currentPeriod);

  if (financeChartInstance) {
    financeChartInstance.destroy();
  }

  financeChartInstance = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: labels.length ? labels : ["Belum ada data"],
      datasets: [
        {
          label: "Pemasukan (Rp)",
          data: incomeData.length ? incomeData : [0],
          backgroundColor: "#0f7c47",
          borderRadius: 6
        },
        {
          label: "Pengeluaran (Rp)",
          data: expenseData.length ? expenseData : [0],
          backgroundColor: "#1b3147",
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top"
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${formatRupiah(context.raw)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "Rp " + value.toLocaleString("id-ID");
            }
          }
        }
      }
    }
  });
}

// ================= TAB MASUKAN DARI PENGGUNA =================
function setRating(val) {
  document.getElementById("fbRating").value = val;
  document.getElementById("ratingLabelText").textContent = RATING_LABELS[val];
  document.querySelectorAll(".star-btn").forEach((btn) => {
    const starVal = Number(btn.dataset.val);
    btn.classList.toggle("active", starVal <= val);
  });
}

function renderStarsString(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function renderFeedbacks() {
  const listEl = document.getElementById("feedbackList");
  const countEl = document.getElementById("feedbackCount");
  const avgEl = document.getElementById("avgRatingText");

  // Update juga ringkasan di Tampilan Awal
  const ovAvgRating = document.getElementById("ovAvgRating");
  const ovAvgStars = document.getElementById("ovAvgStars");
  const ovTotalFeedback = document.getElementById("ovTotalFeedback");
  const ovLatestFeedback = document.getElementById("ovLatestFeedback");

  countEl.textContent = feedbacks.length;

  if (feedbacks.length === 0) {
    avgEl.textContent = "0.0";
    ovAvgRating.textContent = "0.0";
    ovAvgStars.textContent = "☆☆☆☆☆";
    ovTotalFeedback.textContent = "Belum ada masukan";
    ovLatestFeedback.innerHTML = `<p class="muted-text">Belum ada masukan pengguna.</p>`;
    listEl.innerHTML = `
      <div class="content-card text-center muted-text">
        Belum ada masukan yang dikirim. Silakan isi formulir di samping!
      </div>
    `;
    return;
  }

  const avg = feedbacks.reduce((sum, f) => sum + Number(f.rating), 0) / feedbacks.length;
  const avgFormatted = avg.toFixed(1);

  avgEl.textContent = avgFormatted;
  ovAvgRating.textContent = avgFormatted;
  ovAvgStars.textContent = renderStarsString(Math.round(avg));
  ovTotalFeedback.textContent = `Dari ${feedbacks.length} pengguna`;

  const latest = feedbacks[0];
  ovLatestFeedback.innerHTML = `
    <strong>${escapeHTML(latest.name)}</strong> <span class="fb-role-badge">${escapeHTML(latest.role)}</span>
    <p style="margin-top:4px; color:#5a6c7d;">"${escapeHTML(latest.suggestion)}"</p>
  `;

  listEl.innerHTML = feedbacks
    .map(
      (fb) => `
      <article class="feedback-item-card">
        <div class="fb-card-top">
          <div>
            <span class="fb-user-name">${escapeHTML(fb.name)}</span>
            <span class="fb-role-badge">${escapeHTML(fb.role)}</span>
          </div>
          <div class="fb-stars" title="${fb.rating} dari 5">
            ${renderStarsString(fb.rating)} (${fb.rating}/5)
          </div>
        </div>
        <div class="fb-detail-block">
          <strong>Kritik:</strong> ${escapeHTML(fb.critique)}
        </div>
        <div class="fb-detail-block">
          <strong>Saran:</strong> ${escapeHTML(fb.suggestion)}
        </div>
        <small class="fb-date">Dikirim pada: ${escapeHTML(fb.createdAt)}</small>
      </article>
    `
    )
    .join("");
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ================= EVENT LISTENERS & INISIALISASI =================
function refreshAllUI() {
  updateFinanceSummary();
  renderTransactions();
  renderChart();
  renderFeedbacks();
}

document.addEventListener("DOMContentLoaded", () => {
  // Set default tanggal hari ini
  document.getElementById("txDate").value = getTodayISO();
  document.getElementById("targetInput").value = savingTarget > 0 ? savingTarget : "";

  // Inisialisasi pilihan sumber pemasukan/pengeluaran & rating bintang
  toggleTxFields();
  setRating(5);

  // Submit Form Transaksi
  document.getElementById("transactionForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="txType"]:checked').value;
    const category = document.getElementById("txCategory").value;
    const note = document.getElementById("txNote").value.trim();
    const amount = Number(document.getElementById("txAmount").value);
    const date = document.getElementById("txDate").value;

    if (!note || amount <= 0 || !date) return;

    transactions.push({
      id: Date.now(),
      type,
      category,
      note,
      amount,
      date
    });

    saveData();
    document.getElementById("txNote").value = "";
    document.getElementById("txAmount").value = "";
    refreshAllUI();
  });

  // Submit Form Target Penabungan
  document.getElementById("targetForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const newTarget = Number(document.getElementById("targetInput").value);
    if (newTarget > 0) {
      savingTarget = newTarget;
      saveData();
      refreshAllUI();
    }
  });

  // Submit Form Masukan Pengguna (Bila diklik kirim, nama langsung muncul di website)
  document.getElementById("feedbackForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("fbName").value.trim();
    const role = document.getElementById("fbRole").value;
    const rating = Number(document.getElementById("fbRating").value);
    const critique = document.getElementById("fbCritique").value.trim();
    const suggestion = document.getElementById("fbSuggestion").value.trim();

    if (!name || !role || !critique || !suggestion) return;

    const now = new Date();
    const timestamp = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    feedbacks.unshift({
      id: Date.now(),
      name,
      role,
      rating,
      critique,
      suggestion,
      createdAt: timestamp
    });

    saveData();
    document.getElementById("feedbackForm").reset();
    setRating(5);
    refreshAllUI();
  });

  refreshAllUI();
});
