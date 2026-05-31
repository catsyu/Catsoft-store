if (!window.CATSOFT_ADMIN_AUTHORIZED) {
  throw new Error('Catsoft admin authorization required.');
}

const FINANCE_API = window.CATSOFT_FINANCE_API || getDefaultFinanceApiEndpoint();
const FINANCE_STOCK_API = window.CATSOFT_PRODUCT_STOCK_API || getDefaultFinanceStockApiEndpoint();
const financeStorageKey = 'catsoftFinanceTransactions';
const financeFetchLimit = 500;
const financeFetchMaxPages = 120;
const financeAutoRefreshMs = 5000;
let financeRecords = [];
let financeStockAccounts = [];
let stagedFinanceImport = null;
let isFinanceBusy = false;
let financeAutoRefreshTimerId = null;

const financeEls = {
  total: document.querySelector('[data-finance-total]'),
  shopee: document.querySelector('[data-finance-shopee]'),
  gopay: document.querySelector('[data-finance-gopay]'),
  stockCost: document.querySelector('[data-finance-stock-cost]'),
  profit: document.querySelector('[data-finance-profit]'),
  search: document.querySelector('[data-finance-search]'),
  month: document.querySelector('[data-finance-month]'),
  source: document.querySelector('[data-finance-source]'),
  uploadButton: document.querySelector('[data-finance-upload]'),
  fileInput: document.querySelector('[data-finance-file]'),
  gopayToggle: document.querySelector('[data-finance-gopay-toggle]'),
  gopayForm: document.querySelector('[data-finance-gopay-form]'),
  gopayDate: document.querySelector('[data-gopay-date]'),
  gopayAmount: document.querySelector('[data-gopay-amount]'),
  gopayNote: document.querySelector('[data-gopay-note]'),
  refresh: document.querySelector('[data-finance-refresh]'),
  status: document.querySelector('[data-finance-status]'),
  monthly: document.querySelector('[data-finance-monthly]'),
  monthContext: document.querySelector('[data-finance-month-context]'),
  dashboardNote: document.querySelector('[data-finance-dashboard-note]'),
  dashboardRange: document.querySelector('[data-finance-dashboard-range]'),
  kpiProfit: document.querySelector('[data-finance-kpi-profit]'),
  kpiProfitNote: document.querySelector('[data-finance-kpi-profit-note]'),
  kpiAverage: document.querySelector('[data-finance-kpi-average]'),
  kpiAverageNote: document.querySelector('[data-finance-kpi-average-note]'),
  kpiCount: document.querySelector('[data-finance-kpi-count]'),
  kpiCountNote: document.querySelector('[data-finance-kpi-count-note]'),
  kpiMargin: document.querySelector('[data-finance-kpi-margin]'),
  kpiMarginNote: document.querySelector('[data-finance-kpi-margin-note]'),
  monthlyChart: document.querySelector('[data-finance-monthly-chart]'),
  sourceBars: document.querySelector('[data-finance-source-bars]'),
  insights: document.querySelector('[data-finance-insights]'),
  count: document.querySelector('[data-finance-result-count]'),
  list: document.querySelector('[data-finance-list]'),
  previewModal: document.querySelector('[data-finance-preview-modal]'),
  previewMessage: document.querySelector('[data-finance-preview-message]'),
  previewStats: document.querySelector('[data-finance-preview-stats]'),
  previewRows: document.querySelector('[data-finance-preview-rows]'),
  previewClose: document.querySelector('[data-finance-preview-close]'),
  previewCancel: document.querySelector('[data-finance-preview-cancel]'),
  previewConfirm: document.querySelector('[data-finance-preview-confirm]')
};

function getDefaultFinanceApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage) {
    return 'https://catsoft.store/api/finance-records';
  }

  return '/api/finance-records';
}

function getDefaultFinanceStockApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage) {
    return 'https://catsoft.store/api/product-stock';
  }

  return '/api/product-stock';
}

function financeNowMonth() {
  return new Date().toISOString().slice(0, 7);
}

function escapeFinanceHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeFinanceText(value) {
  return String(value || '').trim();
}

function normalizeFinanceSearch(value) {
  return normalizeFinanceText(value).toLowerCase();
}

function parseFinanceAmount(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.abs(Math.round(value)) : 0;
  }

  const digits = String(value || '').replace(/[^\d]/g, '');
  if (!digits) {
    return 0;
  }

  const amount = Number(digits);
  return Number.isFinite(amount) ? Math.abs(Math.round(amount)) : 0;
}

function formatFinanceCurrency(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(value) || 0)}`;
}

function formatFinancePercent(value) {
  return `${new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1
  }).format(Number(value) || 0)}%`;
}

function normalizeFinanceDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const slashMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function getFinanceMonthKey(value) {
  const date = normalizeFinanceDate(value);
  return date ? date.slice(0, 7) : financeNowMonth();
}

function getFinanceIdSeed(record, fallbackIndex = 0) {
  const parts = [
    record.source,
    record.transactionDate,
    record.reference,
    record.description,
    record.amount,
    fallbackIndex
  ];
  return parts
    .map((part) => String(part || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    .filter(Boolean)
    .join('-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

function createFinanceRecordId(record, fallbackIndex = 0) {
  const prefix = record.source === 'gopay' ? 'gopay' : 'shopee';
  const seed = getFinanceIdSeed(record, fallbackIndex) || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${seed}`;
}

function normalizeFinanceRecord(record, fallbackIndex = 0) {
  const source = normalizeFinanceSearch(record.source) === 'gopay' ? 'gopay' : 'shopee';
  const transactionDate = normalizeFinanceDate(record.transactionDate || record.transaction_date || record.date) || new Date().toISOString().slice(0, 10);
  const amount = parseFinanceAmount(record.amount || record.nominal || record.jumlah);
  const description = normalizeFinanceText(record.description || record.deskripsi || (source === 'gopay' ? 'Penarikan GoPay' : 'Penarikan Dana Shopee'));
  const reference = normalizeFinanceText(record.reference || record.noPesanan || record.no_pesanan || record.orderNumber || record.order_number);
  const now = new Date().toISOString();
  const normalized = {
    id: normalizeFinanceText(record.id) || '',
    source,
    transactionDate,
    monthKey: normalizeFinanceText(record.monthKey || record.month_key) || transactionDate.slice(0, 7),
    transactionType: 'withdrawal',
    description,
    reference,
    amount,
    status: normalizeFinanceText(record.status) || 'posted',
    importBatch: normalizeFinanceText(record.importBatch || record.import_batch),
    createdAt: normalizeFinanceText(record.createdAt || record.created_at) || now,
    updatedAt: normalizeFinanceText(record.updatedAt || record.updated_at) || now
  };

  normalized.id = normalized.id || createFinanceRecordId(normalized, fallbackIndex);
  return normalized;
}

function loadLocalFinanceRecords() {
  try {
    return JSON.parse(localStorage.getItem(financeStorageKey) || '[]').map(normalizeFinanceRecord);
  } catch (error) {
    return [];
  }
}

function saveLocalFinanceRecords(records) {
  try {
    localStorage.setItem(financeStorageKey, JSON.stringify(records.slice(0, 5000)));
  } catch (error) {
    // Local cache is only a fallback.
  }
}

function setFinanceStatus(message = '', tone = '') {
  if (!financeEls.status) {
    return;
  }

  financeEls.status.textContent = message;
  financeEls.status.dataset.tone = tone;
}

function setFinanceBusy(isBusy, label = 'Memproses') {
  isFinanceBusy = isBusy;
  [financeEls.uploadButton, financeEls.gopayToggle, financeEls.refresh, financeEls.previewConfirm].forEach((button) => {
    if (button) {
      button.disabled = isBusy;
    }
  });

  if (financeEls.previewConfirm) {
    financeEls.previewConfirm.textContent = isBusy ? label : 'Upload Ke Database';
  }
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: options.credentials || 'include',
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        ...(options.headers || {})
      }
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || `Request gagal (${response.status}).`);
    }

    return payload;
  } finally {
    window.clearTimeout(timeout);
  }
}

function buildFinanceApiUrl(params = {}) {
  const url = new URL(FINANCE_API, window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  url.searchParams.set('_', String(Date.now()));
  return url.toString();
}

async function fetchFinanceRecordsPage(offset = 0, limit = financeFetchLimit) {
  const payload = await fetchJsonWithTimeout(buildFinanceApiUrl({ limit, offset }));
  return Array.isArray(payload.records) ? payload.records.map(normalizeFinanceRecord) : [];
}

async function fetchFinanceRecords() {
  const allRecords = [];
  let offset = 0;
  let pageCount = 0;

  while (pageCount < financeFetchMaxPages) {
    const pageRecords = await fetchFinanceRecordsPage(offset, financeFetchLimit);
    allRecords.push(...pageRecords);
    pageCount += 1;

    if (pageRecords.length < financeFetchLimit) {
      break;
    }

    offset += pageRecords.length;
  }

  financeRecords = allRecords;
  saveLocalFinanceRecords(financeRecords);
}

async function fetchFinanceStockAccounts() {
  try {
    const payload = await fetchJsonWithTimeout(`${FINANCE_STOCK_API}?limit=300&_=${Date.now()}`);
    financeStockAccounts = Array.isArray(payload.accounts) ? payload.accounts : [];
  } catch (error) {
    financeStockAccounts = [];
  }
}

async function refreshFinanceData(showMessage = false) {
  setFinanceBusy(true, 'Memuat');

  try {
    await Promise.all([fetchFinanceRecords(), fetchFinanceStockAccounts()]);
    if (showMessage) {
      setFinanceStatus('Database keuangan diperbarui.', 'success');
    }
  } catch (error) {
    financeRecords = loadLocalFinanceRecords();
    await fetchFinanceStockAccounts();
    setFinanceStatus(`Memakai cache lokal. ${error.message}`, 'warning');
  } finally {
    setFinanceBusy(false);
    renderFinance();
  }
}

async function syncFinanceDataFromApi() {
  await Promise.all([fetchFinanceRecords(), fetchFinanceStockAccounts()]);
  renderFinance();
}

function autoRefreshFinanceData() {
  if (document.visibilityState === 'hidden' || isFinanceBusy || stagedFinanceImport) {
    return;
  }

  syncFinanceDataFromApi().catch((error) => {
    setFinanceStatus(financeRecords.length ? 'Cache lokal aktif.' : 'Database belum terhubung.', 'warning');
    if (financeEls.status) {
      financeEls.status.title = error.message || '';
    }
  });
}

function startFinanceAutoRefresh() {
  if (financeAutoRefreshTimerId) {
    window.clearInterval(financeAutoRefreshTimerId);
  }

  financeAutoRefreshTimerId = window.setInterval(autoRefreshFinanceData, financeAutoRefreshMs);
}

function getFinanceStockMonth(account) {
  const value = account.createdAt || account.created_at || account.updatedAt || account.updated_at || account.resetAt || account.reset_at;
  return getFinanceMonthKey(value);
}

function getFinanceStockCost(account) {
  return Number(account.stockCost || account.stock_cost || 0) || 0;
}

function getFilteredFinanceRecords() {
  const search = normalizeFinanceSearch(financeEls.search?.value);
  const month = normalizeFinanceText(financeEls.month?.value);
  const source = normalizeFinanceText(financeEls.source?.value || 'all');

  return financeRecords.filter((record) => {
    if (month && record.monthKey !== month) {
      return false;
    }

    if (source !== 'all' && record.source !== source) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      record.source,
      record.description,
      record.reference,
      record.status,
      record.amount,
      record.transactionDate
    ].some((value) => normalizeFinanceSearch(value).includes(search));
  });
}

function sumFinanceRecords(records, source = '') {
  return records.reduce((sum, record) => {
    if (source && record.source !== source) {
      return sum;
    }

    return sum + (Number(record.amount) || 0);
  }, 0);
}

function getStockCostForMonths(months) {
  if (!months.size) {
    return 0;
  }

  return financeStockAccounts.reduce((sum, account) => {
    return months.has(getFinanceStockMonth(account)) ? sum + getFinanceStockCost(account) : sum;
  }, 0);
}

function buildFinanceMonthlySummary() {
  const summary = new Map();
  const ensureMonth = (monthKey) => {
    const key = monthKey || financeNowMonth();

    if (!summary.has(key)) {
      summary.set(key, {
        monthKey: key,
        shopee: 0,
        gopay: 0,
        stockCost: 0
      });
    }

    return summary.get(key);
  };

  financeRecords.forEach((record) => {
    const item = ensureMonth(record.monthKey);
    item[record.source === 'gopay' ? 'gopay' : 'shopee'] += Number(record.amount) || 0;
  });

  financeStockAccounts.forEach((account) => {
    ensureMonth(getFinanceStockMonth(account)).stockCost += getFinanceStockCost(account);
  });

  return Array.from(summary.values())
    .map((item) => ({
      ...item,
      totalWithdrawal: item.shopee + item.gopay,
      profit: item.shopee + item.gopay - item.stockCost
    }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

function formatFinanceMonth(monthKey) {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return 'Bulan Aktif';
  }

  const date = new Date(`${monthKey}-01T00:00:00`);
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function formatFinanceDate(value) {
  const date = normalizeFinanceDate(value);

  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
}

function renderFinanceStats(visibleRecords) {
  const selectedMonth = normalizeFinanceText(financeEls.month?.value);
  const months = new Set(visibleRecords.map((record) => record.monthKey).filter(Boolean));

  if (selectedMonth) {
    months.add(selectedMonth);
  }

  const shopee = sumFinanceRecords(visibleRecords, 'shopee');
  const gopay = sumFinanceRecords(visibleRecords, 'gopay');
  const total = shopee + gopay;
  const stockCost = getStockCostForMonths(months);
  const profit = total - stockCost;

  if (financeEls.total) financeEls.total.textContent = formatFinanceCurrency(total);
  if (financeEls.shopee) financeEls.shopee.textContent = formatFinanceCurrency(shopee);
  if (financeEls.gopay) financeEls.gopay.textContent = formatFinanceCurrency(gopay);
  if (financeEls.stockCost) financeEls.stockCost.textContent = formatFinanceCurrency(stockCost);
  if (financeEls.profit) financeEls.profit.textContent = formatFinanceCurrency(profit);
  if (financeEls.monthContext) {
    financeEls.monthContext.textContent = selectedMonth ? formatFinanceMonth(selectedMonth) : 'Semua Bulan';
  }
}

function getVisibleFinanceMonthlySummary(visibleRecords) {
  const selectedMonth = normalizeFinanceText(financeEls.month?.value);
  const source = normalizeFinanceText(financeEls.source?.value || 'all');
  const summary = new Map();
  const ensureMonth = (monthKey) => {
    const key = monthKey || financeNowMonth();

    if (!summary.has(key)) {
      summary.set(key, {
        monthKey: key,
        shopee: 0,
        gopay: 0,
        stockCost: 0
      });
    }

    return summary.get(key);
  };

  visibleRecords.forEach((record) => {
    const item = ensureMonth(record.monthKey);
    item[record.source === 'gopay' ? 'gopay' : 'shopee'] += Number(record.amount) || 0;
  });

  const months = new Set(summary.keys());

  if (selectedMonth) {
    months.add(selectedMonth);
  }

  financeStockAccounts.forEach((account) => {
    const monthKey = getFinanceStockMonth(account);

    if ((selectedMonth && monthKey !== selectedMonth) || (!selectedMonth && months.size && !months.has(monthKey))) {
      return;
    }

    ensureMonth(monthKey).stockCost += getFinanceStockCost(account);
  });

  if (selectedMonth) {
    ensureMonth(selectedMonth);
  }

  return Array.from(summary.values())
    .map((item) => {
      const totalWithdrawal = (source === 'gopay' ? 0 : item.shopee) + (source === 'shopee' ? 0 : item.gopay);
      return {
        ...item,
        totalWithdrawal,
        profit: totalWithdrawal - item.stockCost
      };
    })
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

function renderFinanceDashboard(visibleRecords) {
  const rows = getVisibleFinanceMonthlySummary(visibleRecords);
  const chartRows = rows.slice(0, 6).reverse();
  const selectedMonth = normalizeFinanceText(financeEls.month?.value);
  const shopee = sumFinanceRecords(visibleRecords, 'shopee');
  const gopay = sumFinanceRecords(visibleRecords, 'gopay');
  const total = shopee + gopay;
  const stockCost = rows.reduce((sum, row) => sum + row.stockCost, 0);
  const profit = total - stockCost;
  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.profit, 0) / rows.length) : 0;
  const margin = total ? (profit / total) * 100 : 0;
  const bestMonth = rows.reduce((best, row) => (!best || row.profit > best.profit ? row : best), null);

  if (financeEls.dashboardNote) {
    financeEls.dashboardNote.textContent = selectedMonth
      ? `Ringkasan usaha ${formatFinanceMonth(selectedMonth)}`
      : 'Ringkasan semua bulan yang tercatat';
  }

  if (financeEls.dashboardRange) {
    financeEls.dashboardRange.textContent = chartRows.length > 1
      ? `${formatFinanceMonth(chartRows[0].monthKey)} - ${formatFinanceMonth(chartRows[chartRows.length - 1].monthKey)}`
      : '6 Bulan Terakhir';
  }

  if (financeEls.kpiProfit) financeEls.kpiProfit.textContent = formatFinanceCurrency(profit);
  if (financeEls.kpiProfitNote) financeEls.kpiProfitNote.textContent = `${formatFinanceCurrency(total)} penarikan - ${formatFinanceCurrency(stockCost)} stok`;
  if (financeEls.kpiAverage) financeEls.kpiAverage.textContent = formatFinanceCurrency(average);
  if (financeEls.kpiAverageNote) financeEls.kpiAverageNote.textContent = rows.length ? `${rows.length} bulan tercatat` : 'Belum ada bulan tercatat';
  if (financeEls.kpiCount) financeEls.kpiCount.textContent = new Intl.NumberFormat('id-ID').format(visibleRecords.length);
  if (financeEls.kpiCountNote) financeEls.kpiCountNote.textContent = `${visibleRecords.filter((record) => record.source === 'shopee').length} Shopee, ${visibleRecords.filter((record) => record.source === 'gopay').length} GoPay`;
  if (financeEls.kpiMargin) financeEls.kpiMargin.textContent = formatFinancePercent(margin);
  if (financeEls.kpiMarginNote) financeEls.kpiMarginNote.textContent = total ? `${formatFinanceCurrency(stockCost)} biaya stok` : 'Butuh data penarikan';

  if (financeEls.monthlyChart) {
    const maxProfit = Math.max(...chartRows.map((row) => Math.abs(row.profit)), 1);
    financeEls.monthlyChart.innerHTML = chartRows.length
      ? chartRows.map((row) => {
        const height = Math.max(8, Math.round((Math.abs(row.profit) / maxProfit) * 100));
        const tone = row.profit < 0 ? 'is-loss' : 'is-gain';
        return `
          <div class="finance-chart-item ${tone}">
            <span class="finance-chart-value">${formatFinanceCurrency(row.profit)}</span>
            <i style="--bar-height:${height}%"></i>
            <small>${escapeFinanceHtml(formatFinanceMonth(row.monthKey).replace(/ .*/, ''))}</small>
          </div>
        `;
      }).join('')
      : `
        <div class="finance-empty is-dashboard-empty">
          <div>
            <strong>Belum Ada Tren</strong>
            <span>Upload penarikan untuk melihat grafik profit.</span>
          </div>
        </div>
      `;
  }

  if (financeEls.sourceBars) {
    const shopeePercent = total ? (shopee / total) * 100 : 0;
    const gopayPercent = total ? (gopay / total) * 100 : 0;
    financeEls.sourceBars.innerHTML = `
      <div class="finance-source-bar">
        <div><b>Shopee</b><span>${formatFinanceCurrency(shopee)}</span></div>
        <i><span style="width:${Math.round(shopeePercent)}%"></span></i>
        <small>${formatFinancePercent(shopeePercent)} dari penarikan</small>
      </div>
      <div class="finance-source-bar is-gopay">
        <div><b>GoPay</b><span>${formatFinanceCurrency(gopay)}</span></div>
        <i><span style="width:${Math.round(gopayPercent)}%"></span></i>
        <small>${formatFinancePercent(gopayPercent)} dari penarikan</small>
      </div>
    `;
  }

  if (financeEls.insights) {
    financeEls.insights.innerHTML = `
      <div><b>Bulan terbaik</b><span>${bestMonth ? `${escapeFinanceHtml(formatFinanceMonth(bestMonth.monthKey))} · ${formatFinanceCurrency(bestMonth.profit)}` : 'Belum ada data'}</span></div>
      <div><b>Biaya stok</b><span>${formatFinanceCurrency(stockCost)}</span></div>
      <div><b>Sumber dominan</b><span>${total ? (shopee >= gopay ? 'Shopee' : 'GoPay') : 'Belum ada data'}</span></div>
    `;
  }
}

function renderFinanceMonthly() {
  if (!financeEls.monthly) {
    return;
  }

  const rows = buildFinanceMonthlySummary();

  if (!rows.length) {
    financeEls.monthly.innerHTML = `
      <div class="finance-empty">
        <div>
          <strong>Belum Ada Data Bulanan</strong>
          <span>Upload laporan Shopee atau input GoPay untuk melihat profit bulanan.</span>
        </div>
      </div>
    `;
    return;
  }

  financeEls.monthly.innerHTML = `
    ${rows.map((row) => `
      <article class="finance-month-card">
        <div class="finance-month-card-head">
          <div>
            <span>Bulan laporan</span>
            <h4>${escapeFinanceHtml(formatFinanceMonth(row.monthKey))}</h4>
          </div>
          <div>
            <span>Profit bersih</span>
            <strong>${formatFinanceCurrency(row.profit)}</strong>
          </div>
        </div>

        <div class="finance-month-flow" aria-label="Rumus profit bulanan">
          <div>
            <span>Penarikan Shopee</span>
            <b>${formatFinanceCurrency(row.shopee)}</b>
          </div>
          <div>
            <span>Penarikan GoPay</span>
            <b>${formatFinanceCurrency(row.gopay)}</b>
          </div>
          <div class="is-total">
            <span>Total Penarikan</span>
            <b>${formatFinanceCurrency(row.totalWithdrawal)}</b>
          </div>
          <div class="is-cost">
            <span>Biaya Stok</span>
            <b>${formatFinanceCurrency(row.stockCost)}</b>
          </div>
          <div class="is-profit">
            <span>Profit Bersih</span>
            <b>${formatFinanceCurrency(row.profit)}</b>
          </div>
        </div>

        <p class="finance-month-formula">
          Profit bersih = Total Penarikan ${formatFinanceCurrency(row.totalWithdrawal)} - Biaya Stok ${formatFinanceCurrency(row.stockCost)}.
        </p>
      </article>
    `).join('')}
  `;
}

function renderFinanceRecords(visibleRecords) {
  if (!financeEls.list) {
    return;
  }

  if (financeEls.count) {
    financeEls.count.textContent = `${visibleRecords.length} Data`;
  }

  if (!visibleRecords.length) {
    financeEls.list.innerHTML = `
      <div class="finance-empty">
        <div>
          <strong>Belum Ada Transaksi</strong>
          <span>Data penarikan akan tampil setelah XLSX Shopee atau GoPay tersimpan.</span>
        </div>
      </div>
    `;
    return;
  }

  const rows = visibleRecords
    .slice()
    .sort((a, b) => String(b.transactionDate).localeCompare(String(a.transactionDate)))
    .map((record) => `
      <div class="finance-record-row">
        <span class="finance-record-date">${escapeFinanceHtml(formatFinanceDate(record.transactionDate))}</span>
        <span class="finance-source-pill is-${escapeFinanceHtml(record.source)}">${escapeFinanceHtml(record.source === 'gopay' ? 'GoPay' : 'Shopee')}</span>
        <span class="finance-record-main">
          <b>${escapeFinanceHtml(record.description || 'Penarikan Dana')}</b>
          <small>${escapeFinanceHtml(record.reference || record.id)}</small>
        </span>
        <b class="finance-record-amount">${formatFinanceCurrency(record.amount)}</b>
        <span class="finance-status-pill">${escapeFinanceHtml(record.status || 'posted')}</span>
      </div>
    `);

  financeEls.list.innerHTML = `
    <div class="finance-record-row is-head">
      <span>Tanggal</span>
      <span>Sumber</span>
      <span>Deskripsi</span>
      <span>Nominal</span>
      <span>Status</span>
    </div>
    ${rows.join('')}
  `;
}

function renderFinance() {
  const visibleRecords = getFilteredFinanceRecords();
  renderFinanceStats(visibleRecords);
  renderFinanceDashboard(visibleRecords);
  renderFinanceMonthly();
  renderFinanceRecords(visibleRecords);
  window.requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}

function getRowValue(row, headerMap, candidates) {
  const index = candidates
    .map((candidate) => headerMap.get(normalizeFinanceSearch(candidate)))
    .find((value) => Number.isInteger(value));
  return Number.isInteger(index) ? row[index] : '';
}

function parseShopeeFinanceRows(rows, fileName = '') {
  const headerIndex = rows.findIndex((row) => {
    const normalized = row.map(normalizeFinanceSearch);
    return normalized.includes('tanggal transaksi') && normalized.includes('jumlah');
  });

  if (headerIndex < 0) {
    throw new Error('Header Rincian Transaksi tidak ditemukan.');
  }

  const headers = rows[headerIndex].map(normalizeFinanceSearch);
  const headerMap = new Map(headers.map((header, index) => [header, index]));
  const importBatch = `shopee-${Date.now()}`;

  return rows.slice(headerIndex + 1)
    .map((row, index) => {
      const type = getRowValue(row, headerMap, ['Tipe Transaksi', 'Jenis Transaksi']);
      const description = getRowValue(row, headerMap, ['Deskripsi']);
      const combinedText = normalizeFinanceSearch(`${type} ${description}`);

      if (!combinedText.includes('penarikan dana')) {
        return null;
      }

      const amount = parseFinanceAmount(getRowValue(row, headerMap, ['Jumlah']));
      const transactionDate = normalizeFinanceDate(getRowValue(row, headerMap, ['Tanggal Transaksi']));

      if (!amount || !transactionDate) {
        return null;
      }

      const record = normalizeFinanceRecord({
        source: 'shopee',
        transactionDate,
        description: description || 'Penarikan Dana Shopee',
        reference: getRowValue(row, headerMap, ['No. Pesanan']) || `${fileName || 'xlsx'}-${index + 1}`,
        amount,
        status: getRowValue(row, headerMap, ['Status']) || 'Transaksi Selesai',
        importBatch
      }, index);

      record.id = createFinanceRecordId(record, index + 1);
      return record;
    })
    .filter(Boolean);
}

function openFinancePreview(records, fileName) {
  stagedFinanceImport = { records, fileName };
  const existingIds = new Set(financeRecords.map((record) => record.id));
  const updateCount = records.filter((record) => existingIds.has(record.id)).length;
  const newCount = records.length - updateCount;
  const totalAmount = sumFinanceRecords(records);

  if (financeEls.previewMessage) {
    financeEls.previewMessage.textContent = `${fileName} siap diupload. Cek ringkasan dan contoh transaksi sebelum masuk database.`;
  }

  if (financeEls.previewStats) {
    financeEls.previewStats.innerHTML = `
      <div><b>${records.length}</b><span>Akan Diunggah</span></div>
      <div><b>${newCount}</b><span>Baru</span></div>
      <div><b>${updateCount}</b><span>Update</span></div>
      <div><b>${formatFinanceCurrency(totalAmount)}</b><span>Total Penarikan</span></div>
    `;
  }

  if (financeEls.previewRows) {
    const sampleRows = records.slice(0, 8).map((record) => `
      <div class="finance-preview-row">
        <span>${escapeFinanceHtml(formatFinanceDate(record.transactionDate))}</span>
        <span class="finance-source-pill is-shopee">Shopee</span>
        <span>
          <b>${escapeFinanceHtml(record.description)}</b>
          <small>${escapeFinanceHtml(record.reference || record.id)}</small>
        </span>
        <b>${formatFinanceCurrency(record.amount)}</b>
        <span class="finance-status-pill">${existingIds.has(record.id) ? 'Update' : 'Baru'}</span>
      </div>
    `).join('');

    financeEls.previewRows.innerHTML = `
      <div class="finance-preview-row is-head">
        <span>Tanggal</span>
        <span>Sumber</span>
        <span>Deskripsi</span>
        <span>Nominal</span>
        <span>Status</span>
      </div>
      ${sampleRows}
    `;
  }

  if (financeEls.previewModal) {
    financeEls.previewModal.hidden = false;
  }
}

function closeFinancePreview() {
  if (financeEls.previewModal) {
    financeEls.previewModal.hidden = true;
  }

  stagedFinanceImport = null;
}

async function handleFinanceFile(file) {
  if (!file || isFinanceBusy) {
    return;
  }

  if (!window.XLSX) {
    setFinanceStatus('Library XLSX belum siap. Coba refresh halaman.', 'warning');
    return;
  }

  setFinanceStatus('Membaca file Shopee...', 'info');

  try {
    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    const records = parseShopeeFinanceRows(rows, file.name);

    if (!records.length) {
      throw new Error('Tidak ada transaksi Penarikan Dana Shopee di file ini.');
    }

    openFinancePreview(records, file.name);
    setFinanceStatus('Preview siap. Klik Upload kalau datanya sudah sesuai.', 'success');
  } catch (error) {
    setFinanceStatus(error.message || 'File tidak bisa dibaca.', 'warning');
  } finally {
    if (financeEls.fileInput) {
      financeEls.fileInput.value = '';
    }
  }
}

async function uploadStagedFinanceImport() {
  if (!stagedFinanceImport || !stagedFinanceImport.records.length || isFinanceBusy) {
    return;
  }

  setFinanceBusy(true, 'Upload');
  setFinanceStatus('Mengupload transaksi ke database...', 'info');

  try {
    const payload = await fetchJsonWithTimeout(`${FINANCE_API}/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'shopee-xlsx',
        fileName: stagedFinanceImport.fileName,
        records: stagedFinanceImport.records
      })
    }, 60000);

    const records = Array.isArray(payload.records) ? payload.records : stagedFinanceImport.records;
    const byId = new Map(financeRecords.map((record) => [record.id, record]));
    records.map(normalizeFinanceRecord).forEach((record) => byId.set(record.id, record));
    financeRecords = Array.from(byId.values());
    saveLocalFinanceRecords(financeRecords);
    closeFinancePreview();
    setFinanceStatus(`${records.length} transaksi Shopee tersimpan.`, 'success');
    await syncFinanceDataFromApi();
  } catch (error) {
    setFinanceStatus(error.message || 'Upload gagal.', 'warning');
  } finally {
    setFinanceBusy(false);
    renderFinance();
  }
}

async function saveGopayWithdrawal(event) {
  event.preventDefault();

  if (isFinanceBusy) {
    return;
  }

  const record = normalizeFinanceRecord({
    source: 'gopay',
    transactionDate: financeEls.gopayDate?.value,
    amount: financeEls.gopayAmount?.value,
    description: financeEls.gopayNote?.value || 'Penarikan GoPay ke rekening',
    status: 'Transaksi Selesai'
  });

  if (!record.transactionDate || !record.amount) {
    setFinanceStatus('Tanggal dan nominal GoPay wajib diisi.', 'warning');
    return;
  }

  setFinanceBusy(true, 'Simpan');
  setFinanceStatus('Menyimpan penarikan GoPay...', 'info');

  try {
    const payload = await fetchJsonWithTimeout(FINANCE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record })
    });
    const saved = normalizeFinanceRecord(payload.record || record);
    const byId = new Map(financeRecords.map((item) => [item.id, item]));
    byId.set(saved.id, saved);
    financeRecords = Array.from(byId.values());
    saveLocalFinanceRecords(financeRecords);
    financeEls.gopayForm.reset();
    financeEls.gopayDate.value = new Date().toISOString().slice(0, 10);
    setFinanceStatus('Penarikan GoPay tersimpan.', 'success');
    await syncFinanceDataFromApi();
  } catch (error) {
    setFinanceStatus(error.message || 'GoPay gagal disimpan.', 'warning');
  } finally {
    setFinanceBusy(false);
  }
}

function setupFinanceEvents() {
  financeEls.month.value = financeNowMonth();
  financeEls.gopayDate.value = new Date().toISOString().slice(0, 10);

  financeEls.search?.addEventListener('input', renderFinance);
  financeEls.month?.addEventListener('change', renderFinance);
  financeEls.source?.addEventListener('change', renderFinance);
  financeEls.uploadButton?.addEventListener('click', () => financeEls.fileInput?.click());
  financeEls.fileInput?.addEventListener('change', () => handleFinanceFile(financeEls.fileInput.files?.[0]));
  financeEls.refresh?.addEventListener('click', () => refreshFinanceData(true));
  financeEls.gopayToggle?.addEventListener('click', () => {
    financeEls.gopayForm.hidden = !financeEls.gopayForm.hidden;
    if (!financeEls.gopayForm.hidden) {
      financeEls.gopayAmount?.focus();
    }
  });
  financeEls.gopayForm?.addEventListener('submit', saveGopayWithdrawal);
  financeEls.gopayAmount?.addEventListener('input', () => {
    const amount = parseFinanceAmount(financeEls.gopayAmount.value);
    financeEls.gopayAmount.value = amount ? formatFinanceCurrency(amount) : '';
  });
  [financeEls.previewClose, financeEls.previewCancel].forEach((button) => {
    button?.addEventListener('click', closeFinancePreview);
  });
  financeEls.previewConfirm?.addEventListener('click', uploadStagedFinanceImport);
  window.addEventListener('focus', autoRefreshFinanceData);
  document.addEventListener('visibilitychange', autoRefreshFinanceData);
}

setupFinanceEvents();
financeRecords = loadLocalFinanceRecords();
renderFinance();
refreshFinanceData(false);
startFinanceAutoRefresh();
