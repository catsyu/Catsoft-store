const productionApiEndpoint = 'https://catsoft.store/api/customer-records';
const apiEndpoint = window.CATSOFT_CUSTOMER_DATABASE_API || getDefaultApiEndpoint();
const apiTimeoutMs = 8000;
const xlsxApiTimeoutMs = 45000;
const xlsxBulkApiTimeoutMs = 120000;
const customerFetchLimit = 500;
const autoRefreshMs = 10000;
const xlsxImportBatchSize = 8;
const xlsxBulkImportChunkSize = 300;
const storageKey = 'catsoftCustomerDatabaseRecords';
const backupStorageKey = `${storageKey}:backup`;

const form = document.getElementById('customerForm');
const resetFormBtn = document.getElementById('resetFormBtn');
const clearBtn = document.getElementById('clearBtn');
const recordIdInput = document.getElementById('recordId');
const screenshotInput = document.getElementById('screenshotInput');
const screenshotPreviewWrap = document.getElementById('screenshotPreviewWrap');
const screenshotPreview = document.getElementById('screenshotPreview');
const ocrStatus = document.getElementById('ocrStatus');
const ocrProgress = document.getElementById('ocrProgress');
const ocrProgressBar = document.getElementById('ocrProgressBar');
const customerNameInput = document.getElementById('customerName');
const activatedEmailInput = document.getElementById('activatedEmail');
const whatsappNumberInput = document.getElementById('whatsappNumber');
const orderNumberInput = document.getElementById('orderNumber');
const orderSourceSelect = document.getElementById('orderSource');
const orderReferenceLabel = document.getElementById('orderReferenceLabel');
const orderReferenceInput = document.getElementById('orderReference');
const productNameInput = document.getElementById('productName');
const packagePresetSelect = document.getElementById('packagePreset');
const durationDaysGroup = document.getElementById('durationDaysGroup');
const durationDaysInput = document.getElementById('durationDays');
const startDateInput = document.getElementById('startDate');
const expiryDateInput = document.getElementById('expiryDate');
const subscriptionStatusSelect = document.getElementById('subscriptionStatus');
const adminNotesInput = document.getElementById('adminNotes');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const expiredCount = document.getElementById('expiredCount');
const expireTodayCount = document.getElementById('expireTodayCount');
const incompleteCount = document.getElementById('incompleteCount');
const duplicateCount = document.getElementById('duplicateCount');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const dateFilter = document.getElementById('dateFilter');
const statusFilter = document.getElementById('statusFilter');
const sortBySelect = document.getElementById('sortBy');
const sortDirectionSelect = document.getElementById('sortDirection');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importJsonBtn = document.getElementById('importJsonBtn');
const importJsonInput = document.getElementById('importJsonInput');
const importShopeeXlsxBtn = document.getElementById('importShopeeXlsxBtn');
const importShopeeXlsxInput = document.getElementById('importShopeeXlsxInput');
const syncRecordsBtn = document.getElementById('syncRecordsBtn');
const syncStatus = document.getElementById('syncStatus');
const lookupScreenshotInput = document.getElementById('lookupScreenshotInput');
const emailLookupInput = document.getElementById('emailLookupInput');
const clearLookupBtn = document.getElementById('clearLookupBtn');
const lookupStatus = document.getElementById('lookupStatus');
const lookupChips = document.getElementById('lookupChips');
const resultCount = document.getElementById('resultCount');
const resultContext = document.getElementById('resultContext');
const bulkToolbar = document.getElementById('bulkToolbar');
const selectVisibleRecords = document.getElementById('selectVisibleRecords');
const selectedCount = document.getElementById('selectedCount');
const bulkStatusSelect = document.getElementById('bulkStatusSelect');
const bulkApplyStatusBtn = document.getElementById('bulkApplyStatusBtn');
const bulkExportCsvBtn = document.getElementById('bulkExportCsvBtn');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const clearSelectionBtn = document.getElementById('clearSelectionBtn');
const recordsList = document.getElementById('recordsList');
const xlsxImportOverlay = document.getElementById('xlsxImportOverlay');
const xlsxImportTitle = document.getElementById('xlsxImportTitle');
const xlsxImportMessage = document.getElementById('xlsxImportMessage');
const xlsxImportProgressBar = document.getElementById('xlsxImportProgressBar');
const xlsxImportProgressText = document.getElementById('xlsxImportProgressText');
const xlsxImportSummary = document.getElementById('xlsxImportSummary');
const xlsxImportCloseBtn = document.getElementById('xlsxImportCloseBtn');

const monthMap = {
  januari: 0,
  jan: 0,
  februari: 1,
  feb: 1,
  maret: 2,
  mar: 2,
  april: 3,
  apr: 3,
  mei: 4,
  may: 4,
  juni: 5,
  jun: 5,
  juli: 6,
  jul: 6,
  agustus: 7,
  agu: 7,
  aug: 7,
  september: 8,
  sep: 8,
  oktober: 9,
  okt: 9,
  oct: 9,
  november: 10,
  nov: 10,
  desember: 11,
  des: 11,
  dec: 11
};

const monthNames = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const statusLabels = {
  active: 'Aktif',
  expired: 'Expired',
  removed: 'Removed',
  refund: 'Refund',
  problem: 'Bermasalah',
  incomplete: 'Data tidak lengkap'
};

const statusOptions = ['active', 'expired', 'removed', 'refund', 'problem'];
const protectedStatusOptions = new Set(['removed', 'refund', 'problem']);
const statusFilterLabels = {
  ...statusLabels,
  duplicate: 'Data ganda'
};

const orderSourceLabels = {
  shopee: 'Shopee',
  whatsapp: 'WhatsApp'
};

let localStorageWarning = '';
let records = loadRecords();
let activeOrderSource = 'shopee';
let isSyncingRecords = false;
let isMutatingRecords = false;
let isDatabaseLocked = false;
let isImportingShopeeXlsx = false;
let autoRefreshTimerId = null;
let xlsxImportHideTimerId = null;
let recordsMutationVersion = 0;
let selectedRecordIds = new Set();
let lastRenderedRecordIds = [];

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function fromDateInput(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function diffDays(startDate, endDate) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((endDate - startDate) / dayMs);
}

function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isSameDate(firstDate, secondDate) {
  return firstDate &&
    secondDate &&
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate();
}

function formatDate(dateValue) {
  const date = typeof dateValue === 'string' ? fromDateInput(dateValue) : dateValue;

  if (!date) {
    return '-';
  }

  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateTime(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function createId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeSearch(value) {
  return String(value || '').toLowerCase().trim();
}

function normalizeUniqueEmail(value) {
  return String(value || '').toLowerCase().trim();
}

function normalizeUniqueOrderNumber(value) {
  return String(value || '').toUpperCase().trim();
}

function extractEmails(text) {
  const matches = String(text || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  const seen = new Set();

  return matches
    .map((email) => email.toLowerCase().trim())
    .filter((email) => {
      if (seen.has(email)) {
        return false;
      }

      seen.add(email);
      return true;
    });
}

function getDefaultApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalPage || hostname !== 'catsoft.store') {
    return productionApiEndpoint;
  }

  return '/api/customer-records';
}

function getSelectedOrderSource() {
  return orderSourceSelect.value === 'whatsapp' ? 'whatsapp' : 'shopee';
}

function getRecordOrderSource(record) {
  if (record.orderSource === 'whatsapp' || record.orderSource === 'shopee') {
    return record.orderSource;
  }

  return record.orderNumber ? 'shopee' : (record.whatsappNumber ? 'whatsapp' : 'shopee');
}

function getOrderReferenceLabel(source) {
  return source === 'whatsapp' ? 'Nomor WhatsApp' : 'No. pesanan';
}

function getOrderReferencePlaceholder(source) {
  return source === 'whatsapp' ? '08xxxxxxxxxx' : '26052127RS304V';
}

function getOrderReferenceValue(record) {
  return getRecordOrderSource(record) === 'whatsapp' ? record.whatsappNumber : record.orderNumber;
}

function writeOrderReferenceTo(source, value) {
  if (source === 'whatsapp') {
    whatsappNumberInput.value = value.trim();
  } else {
    orderNumberInput.value = value.trim();
  }
}

function updateOrderReferenceField(source, value) {
  const nextSource = source === 'whatsapp' ? 'whatsapp' : 'shopee';
  orderSourceSelect.value = nextSource;
  activeOrderSource = nextSource;
  orderReferenceLabel.textContent = getOrderReferenceLabel(nextSource);
  orderReferenceInput.placeholder = getOrderReferencePlaceholder(nextSource);
  orderReferenceInput.type = nextSource === 'whatsapp' ? 'tel' : 'text';
  orderReferenceInput.inputMode = nextSource === 'whatsapp' ? 'tel' : 'text';
  orderReferenceInput.autocomplete = nextSource === 'whatsapp' ? 'tel' : 'off';
  orderReferenceInput.value = value || '';
}

function handleOrderSourceChange() {
  writeOrderReferenceTo(activeOrderSource, orderReferenceInput.value);

  const nextSource = getSelectedOrderSource();
  const nextValue = nextSource === 'whatsapp' ? whatsappNumberInput.value : orderNumberInput.value;
  updateOrderReferenceField(nextSource, nextValue);
}

function syncOrderReferenceInput() {
  writeOrderReferenceTo(activeOrderSource, orderReferenceInput.value);
}

function renderStatusMenu(currentStatus) {
  const status = statusLabels[currentStatus] ? currentStatus : 'active';

  return `
    <div class="status-menu status-${escapeHtml(status)}">
      <button class="status-trigger" type="button" data-action="toggle-status" aria-haspopup="listbox" aria-expanded="false">
        <span class="status-choice">
          <span class="status-dot" aria-hidden="true"></span>
          <span>${escapeHtml(statusLabels[status])}</span>
        </span>
        <span class="status-chevron" aria-hidden="true"></span>
      </button>
      <div class="status-options" role="listbox" aria-label="Pilih status langganan">
        ${statusOptions.map((optionStatus) => `
          <button class="status-option ${optionStatus === status ? 'is-selected' : ''}" type="button" data-action="set-status" data-status="${escapeHtml(optionStatus)}" role="option" aria-selected="${optionStatus === status}">
            <span class="status-dot" aria-hidden="true"></span>
            <span>${escapeHtml(statusLabels[optionStatus])}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function closeStatusMenus(exceptMenu) {
  recordsList.querySelectorAll('.status-menu.is-open').forEach((menu) => {
    if (menu === exceptMenu) {
      return;
    }

    menu.classList.remove('is-open');
    menu.closest('.record-card')?.classList.remove('is-menu-open');
    menu.querySelector('.status-trigger')?.setAttribute('aria-expanded', 'false');
  });
}

function toggleStatusMenu(menu) {
  const shouldOpen = !menu.classList.contains('is-open');
  closeStatusMenus(shouldOpen ? menu : null);
  menu.classList.toggle('is-open', shouldOpen);
  menu.closest('.record-card')?.classList.toggle('is-menu-open', shouldOpen);
  menu.querySelector('.status-trigger')?.setAttribute('aria-expanded', String(shouldOpen));
}

function loadRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorageWarning = '';
    return normalizeRecordList(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    localStorageWarning = 'Cache utama rusak, memakai cache terakhir.';
    return loadBackupRecords();
  }
}

function loadBackupRecords() {
  try {
    const parsedBackup = JSON.parse(localStorage.getItem(backupStorageKey) || '[]');
    const backupRecords = Array.isArray(parsedBackup) ? parsedBackup : parsedBackup.records;
    return normalizeRecordList(Array.isArray(backupRecords) ? backupRecords : []);
  } catch (error) {
    localStorageWarning = 'Cache lokal tidak terbaca.';
    return [];
  }
}

function saveRecords(nextRecords = records) {
  try {
    const previousRecords = localStorage.getItem(storageKey);

    if (previousRecords) {
      localStorage.setItem(backupStorageKey, previousRecords);
    }

    localStorage.setItem(storageKey, JSON.stringify(nextRecords));
    return true;
  } catch (error) {
    setSyncStatus('Cache lokal gagal', 'warning');
    syncStatus.title = error.message;
    return false;
  }
}

function normalizeRecordList(recordList) {
  return recordList
    .map(normalizeStoredRecord)
    .filter(Boolean);
}

function normalizeStoredRecord(record) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const rawDuration = Number(record.durationDays ?? record.duration_days);
  const createdAt = String(record.createdAt || record.created_at || new Date().toISOString());
  const status = String(record.status || 'active');
  const rawOrderSource = record.orderSource || record.order_source;
  const rawProductName = String(record.productName ?? record.product_name ?? '').trim();
  const hasWhatsappReference = Boolean(record.whatsappNumber || record.whatsapp_number);
  const hasOrderReference = Boolean(record.orderNumber || record.order_number);
  const orderSource = rawOrderSource === 'whatsapp' || (!rawOrderSource && hasWhatsappReference && !hasOrderReference) ? 'whatsapp' : 'shopee';

  const normalizedRecord = {
    id: String(record.id || createId()),
    customerName: String(record.customerName ?? record.customer_name ?? '').trim(),
    activatedEmail: String(record.activatedEmail ?? record.activated_email ?? '').trim(),
    whatsappNumber: String(record.whatsappNumber ?? record.whatsapp_number ?? '').trim(),
    orderNumber: String(record.orderNumber ?? record.order_number ?? '').trim(),
    orderSource,
    productName: normalizeStoredProductName(rawProductName),
    durationDays: Number.isFinite(rawDuration) && rawDuration > 0 ? Math.trunc(rawDuration) : 30,
    startDate: String(record.startDate ?? record.start_date ?? '').slice(0, 10),
    expiryDate: String(record.expiryDate ?? record.expiry_date ?? '').slice(0, 10),
    status: statusLabels[status] ? status : 'active',
    notes: String(record.notes ?? '').trim(),
    createdAt,
    updatedAt: String(record.updatedAt || record.updated_at || createdAt)
  };

  return applyCompletenessStatus(normalizedRecord, status);
}

function getRecordUpdatedTime(record) {
  const updatedAt = Date.parse(record.updatedAt || record.createdAt || '');
  return Number.isNaN(updatedAt) ? 0 : updatedAt;
}

function sortRecords(nextRecords) {
  return [...nextRecords].sort((first, second) => getRecordUpdatedTime(second) - getRecordUpdatedTime(first));
}

function parseRecordsResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.records)) {
    return data.records;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  return [];
}

function buildCustomerApiUrl(id, params = {}) {
  const url = new URL(apiEndpoint, window.location.href);

  if (id) {
    url.pathname = `${url.pathname.replace(/\/$/, '')}/${encodeURIComponent(id)}`;
  } else {
    url.searchParams.set('limit', String(params.limit || customerFetchLimit));

    if (params.offset) {
      url.searchParams.set('offset', String(params.offset));
    }
  }

  url.searchParams.set('_', String(Date.now()));
  return url;
}

function buildCustomerApiActionUrl(action) {
  const url = new URL(apiEndpoint, window.location.href);
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${action}`;
  url.searchParams.set('_', String(Date.now()));
  return url;
}

function setSyncStatus(message, mode = '') {
  syncStatus.textContent = message;
  syncStatus.classList.toggle('success', mode === 'success');
  syncStatus.classList.toggle('warning', mode === 'warning');
}

function beginRecordsMutation() {
  recordsMutationVersion += 1;
  isMutatingRecords = true;
}

function endRecordsMutation() {
  isMutatingRecords = false;
}

function applyDatabaseLockState() {
  const pageControls = document.querySelectorAll('.customer-page input, .customer-page select, .customer-page textarea, .customer-page button');

  pageControls.forEach((control) => {
    if (isDatabaseLocked) {
      if (!Object.prototype.hasOwnProperty.call(control.dataset, 'databaseLockWasDisabled')) {
        control.dataset.databaseLockWasDisabled = control.disabled ? 'true' : 'false';
      }

      control.disabled = true;
      return;
    }

    if (Object.prototype.hasOwnProperty.call(control.dataset, 'databaseLockWasDisabled')) {
      control.disabled = control.dataset.databaseLockWasDisabled === 'true';
      delete control.dataset.databaseLockWasDisabled;
    }
  });

  if (!isDatabaseLocked) {
    syncRecordsBtn.disabled = isSyncingRecords;
    renderBulkState();
  }
}

function setDatabaseLock(locked) {
  isDatabaseLocked = locked;
  document.body.classList.toggle('is-database-locked', locked);
  applyDatabaseLockState();
}

function showXlsxImportOverlay() {
  if (!xlsxImportOverlay) {
    return;
  }

  window.clearTimeout(xlsxImportHideTimerId);
  xlsxImportOverlay.classList.remove('is-hidden', 'is-error', 'is-success', 'is-finished');
  xlsxImportCloseBtn.classList.add('is-hidden');
}

function updateXlsxImportOverlay({ title, message, progress, summary, mode = '', canClose = false }) {
  if (!xlsxImportOverlay) {
    return;
  }

  const progressValue = Math.min(Math.max(Number(progress) || 0, 0), 100);

  xlsxImportTitle.textContent = title;
  xlsxImportMessage.textContent = message;
  xlsxImportProgressBar.style.width = `${progressValue}%`;
  xlsxImportProgressText.textContent = `${Math.round(progressValue)}%`;
  xlsxImportSummary.textContent = summary;
  xlsxImportOverlay.classList.toggle('is-error', mode === 'error');
  xlsxImportOverlay.classList.toggle('is-success', mode === 'success');
  xlsxImportOverlay.classList.toggle('is-finished', mode === 'success');
  xlsxImportCloseBtn.classList.toggle('is-hidden', !canClose);
}

function hideXlsxImportOverlay() {
  if (!xlsxImportOverlay) {
    return;
  }

  window.clearTimeout(xlsxImportHideTimerId);
  xlsxImportOverlay.classList.add('is-hidden');
  xlsxImportOverlay.classList.remove('is-error', 'is-success', 'is-finished');
}

function guardDatabaseMutation(message = 'Tunggu update XLSX selesai, database sedang dikunci sementara.') {
  if (!isDatabaseLocked && !isImportingShopeeXlsx) {
    return false;
  }

  ocrStatus.textContent = message;
  setSyncStatus('Update XLSX berjalan', 'warning');
  syncStatus.title = message;
  return true;
}

function isAbortOrTimeoutError(error) {
  const message = String(error && error.message ? error.message : '').toLowerCase();
  return error && (error.name === 'AbortError' || error.name === 'TimeoutError' || /abort|aborted|timeout|signal/.test(message));
}

function getFriendlyErrorMessage(error) {
  if (isAbortOrTimeoutError(error)) {
    return 'Koneksi database timeout saat upload. Sistem sudah mengirim XLSX bertahap; coba ulang setelah koneksi stabil.';
  }

  return error && error.message ? error.message : 'Terjadi error tidak dikenal.';
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getCustomerApiErrorMessage(status) {
  const messages = {
    401: 'API 401 unauthorized, cek Cloudflare Access atau ALLOW_UNAUTHENTICATED_API',
    403: 'API 403 forbidden, cek permission Access/route Worker',
    404: 'API 404, route /api/customer-records belum menuju Worker',
    409: 'Data duplikat',
    500: 'API 500, cek D1 binding/schema dan Worker logs'
  };

  return messages[status] || `API ${status}`;
}

async function getApiErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload.error || payload.message || getCustomerApiErrorMessage(response.status);
  } catch (error) {
    return getCustomerApiErrorMessage(response.status);
  }
}

async function fetchWithTimeout(url, options = {}) {
  const { timeoutMs = apiTimeoutMs, ...fetchOptions } = options;
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
  } catch (error) {
    if (timedOut || error.name === 'AbortError') {
      const timeoutSeconds = Math.round(timeoutMs / 1000);
      throw new Error(`Koneksi database timeout setelah ${timeoutSeconds} detik. Coba ulang; jika file besar, sistem akan mengirim data bertahap lebih kecil.`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchApiRecordsPage(offset = 0, limit = customerFetchLimit, options = {}) {
  const response = await fetchWithTimeout(buildCustomerApiUrl(null, { limit, offset }), {
    cache: 'no-store',
    timeoutMs: options.timeoutMs,
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

  if (!response.ok) {
    const error = new Error(await getApiErrorMessage(response));
    error.status = response.status;
    throw error;
  }

  return parseRecordsResponse(await response.json());
}

async function fetchApiRecords(options = {}) {
  const allRecords = [];
  let offset = 0;

  while (offset <= 10000) {
    const pageRecords = await fetchApiRecordsPage(offset, customerFetchLimit, options);
    allRecords.push(...pageRecords);

    if (pageRecords.length < customerFetchLimit) {
      break;
    }

    offset += pageRecords.length;
  }

  return allRecords;
}

async function pushRecordToApi(record, options = {}) {
  const response = await fetchWithTimeout(buildCustomerApiUrl(), {
    method: 'POST',
    cache: 'no-store',
    timeoutMs: options.timeoutMs,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(normalizeStoredRecord(record))
  });

  if (!response.ok) {
    const error = new Error(await getApiErrorMessage(response));
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function pushRecordsToApi(nextRecords, options = {}) {
  const response = await fetchWithTimeout(buildCustomerApiUrl(), {
    method: 'POST',
    cache: 'no-store',
    timeoutMs: options.timeoutMs,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ records: normalizeRecordList(nextRecords) })
  });

  if (!response.ok) {
    const error = new Error(await getApiErrorMessage(response));
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function pushBulkImportRecordsToApi(nextRecords, options = {}) {
  const response = await fetchWithTimeout(buildCustomerApiActionUrl('bulk-import'), {
    method: 'POST',
    cache: 'no-store',
    timeoutMs: options.timeoutMs,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: 'shopee-xlsx',
      records: normalizeRecordList(nextRecords)
    })
  });

  if (!response.ok) {
    const error = new Error(await getApiErrorMessage(response));
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function deleteRecordFromApi(id, options = {}) {
  const response = await fetchWithTimeout(buildCustomerApiUrl(id), {
    method: 'DELETE',
    cache: 'no-store',
    timeoutMs: options.timeoutMs
  });

  if (!response.ok) {
    const error = new Error(await getApiErrorMessage(response));
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function replaceRecordsFromApi(options = {}) {
  const apiRecords = await fetchApiRecords({ timeoutMs: options.timeoutMs });

  if (typeof options.expectedMutationVersion === 'number' && options.expectedMutationVersion !== recordsMutationVersion) {
    return records;
  }

  records = sortRecords(normalizeRecordList(apiRecords));
  saveRecords();
  renderRecords();
  return records;
}

async function syncRecordsWithApi(options = {}) {
  if (isSyncingRecords || isImportingShopeeXlsx || isDatabaseLocked || (options.auto && isMutatingRecords)) {
    return;
  }

  isSyncingRecords = true;
  const syncMutationVersion = recordsMutationVersion;

  if (!options.silent) {
    setSyncStatus('Sinkron web...');
  }

  syncRecordsBtn.disabled = true;

  try {
    await replaceRecordsFromApi({ expectedMutationVersion: syncMutationVersion });
    setSyncStatus(`Live web (${records.length})`, 'success');
    syncStatus.title = 'Cloudflare D1 menjadi database pusat. Cache lokal hanya dipakai saat offline.';
  } catch (error) {
    setSyncStatus(records.length ? 'Cache lokal' : 'Web offline', 'warning');
    syncStatus.title = error.message;
  } finally {
    syncRecordsBtn.disabled = isDatabaseLocked;
    isSyncingRecords = false;
  }
}

async function syncSingleRecord(record) {
  try {
    await pushRecordToApi(record);
    setSyncStatus('Tersimpan web', 'success');
    syncStatus.title = 'Data tersimpan di Cloudflare D1.';
    await syncRecordsWithApi({ silent: true });
    return true;
  } catch (error) {
    setSyncStatus('Gagal simpan web', 'warning');
    syncStatus.title = error.message;
    return false;
  }
}

async function removeSingleRecordFromApi(id) {
  try {
    await deleteRecordFromApi(id);
    setSyncStatus('Terhapus web', 'success');
    syncStatus.title = 'Data terhapus dari Cloudflare D1.';
    await syncRecordsWithApi({ silent: true });
    return true;
  } catch (error) {
    setSyncStatus('Gagal hapus web', 'warning');
    syncStatus.title = error.message;
    return false;
  }
}

function getLookupEmailSet() {
  return new Set(extractEmails(emailLookupInput.value).map(normalizeUniqueEmail));
}

function setLookupEmails(emails, title = '') {
  emailLookupInput.value = emails.join('\n');
  lookupStatus.title = title;
  renderRecords();
}

function clearLookup() {
  emailLookupInput.value = '';
  lookupScreenshotInput.value = '';
  lookupStatus.title = '';
  renderRecords();
}

function renderLookupState(filteredRecords = []) {
  const emails = extractEmails(emailLookupInput.value);
  const emailSet = new Set(emails.map(normalizeUniqueEmail));
  const matchedEmails = new Set(
    filteredRecords
      .map((record) => normalizeUniqueEmail(record.activatedEmail))
      .filter((email) => emailSet.has(email))
  );

  lookupStatus.textContent = emailSet.size ? `${matchedEmails.size}/${emailSet.size} email cocok` : '0 email';

  if (!emails.length) {
    lookupChips.innerHTML = '';
    return;
  }

  const visibleEmails = emails.slice(0, 8);
  const moreCount = Math.max(0, emails.length - visibleEmails.length);

  lookupChips.innerHTML = [
    ...visibleEmails.map((email) => `<span class="lookup-chip">${escapeHtml(email)}</span>`),
    moreCount ? `<span class="lookup-chip is-more">+${moreCount}</span>` : ''
  ].join('');
}

function renderResultSummary(filteredRecords) {
  const total = filteredRecords.length;
  const lookupCount = getLookupEmailSet().size;
  const filters = [];

  if (lookupCount) {
    filters.push(`${lookupCount} email`);
  }

  if (searchInput.value.trim()) {
    filters.push('search');
  }

  if (dateFilter.value) {
    filters.push('expire');
  }

  if (statusFilter.value !== 'all') {
    filters.push(statusFilterLabels[statusFilter.value] || statusFilter.value);
  }

  resultCount.textContent = `${total} data`;
  resultContext.textContent = filters.length ? filters.join(' / ') : 'Semua data';
}

function getRecordSortValue(record, sortBy, duplicateIndex = getDuplicateIndex(records)) {
  if (sortBy === 'expiryDate' || sortBy === 'startDate') {
    const date = fromDateInput(record[sortBy]);
    return date ? date.getTime() : null;
  }

  if (sortBy === 'updatedAt') {
    const time = Date.parse(record.updatedAt || record.createdAt || '');
    return Number.isNaN(time) ? null : time;
  }

  if (sortBy === 'status') {
    return getRecordStatusSummary(record, duplicateIndex);
  }

  return normalizeSearch(record[sortBy]);
}

function sortFilteredRecords(recordList, duplicateIndex = getDuplicateIndex(records)) {
  const sortBy = sortBySelect.value || 'updatedAt';
  const direction = sortDirectionSelect.value === 'asc' ? 1 : -1;

  return [...recordList].sort((first, second) => {
    const firstValue = getRecordSortValue(first, sortBy, duplicateIndex);
    const secondValue = getRecordSortValue(second, sortBy, duplicateIndex);

    if (firstValue === secondValue) {
      return getRecordUpdatedTime(second) - getRecordUpdatedTime(first);
    }

    if (firstValue === null || firstValue === '') {
      return 1;
    }

    if (secondValue === null || secondValue === '') {
      return -1;
    }

    return firstValue > secondValue ? direction : -direction;
  });
}

function getSelectedRecords() {
  return records.filter((record) => selectedRecordIds.has(record.id));
}

function pruneSelection() {
  const existingIds = new Set(records.map((record) => record.id));
  selectedRecordIds = new Set([...selectedRecordIds].filter((id) => existingIds.has(id)));
}

function renderBulkState() {
  pruneSelection();

  const selectedRecords = getSelectedRecords();
  const visibleSelectedCount = lastRenderedRecordIds.filter((id) => selectedRecordIds.has(id)).length;
  const hasVisibleRecords = lastRenderedRecordIds.length > 0;
  const hasSelection = selectedRecords.length > 0;
  const isLocked = isDatabaseLocked || isImportingShopeeXlsx;

  selectedCount.textContent = `${selectedRecords.length} dipilih`;
  bulkToolbar.classList.toggle('has-selection', hasSelection);
  selectVisibleRecords.checked = hasVisibleRecords && visibleSelectedCount === lastRenderedRecordIds.length;
  selectVisibleRecords.indeterminate = visibleSelectedCount > 0 && visibleSelectedCount < lastRenderedRecordIds.length;
  selectVisibleRecords.disabled = isLocked || !hasVisibleRecords;
  bulkApplyStatusBtn.disabled = isLocked || !hasSelection;
  bulkExportCsvBtn.disabled = !hasSelection;
  bulkDeleteBtn.disabled = isLocked || !hasSelection;
  clearSelectionBtn.disabled = !hasSelection;
}

function clearSelection() {
  selectedRecordIds.clear();
  renderRecords();
}

function toggleVisibleSelection(checked) {
  lastRenderedRecordIds.forEach((id) => {
    if (checked) {
      selectedRecordIds.add(id);
    } else {
      selectedRecordIds.delete(id);
    }
  });

  renderRecords();
}

async function bulkApplyStatus() {
  if (guardDatabaseMutation()) {
    return;
  }

  const nextStatus = bulkStatusSelect.value;
  const selectedRecords = getSelectedRecords();

  if (!nextStatus || !statusLabels[nextStatus] || !selectedRecords.length) {
    return;
  }

  const now = new Date().toISOString();
  const updatedRecords = [];
  const nextRecords = records.map((record) => {
    if (!selectedRecordIds.has(record.id)) {
      return record;
    }

    const updatedRecord = applyCompletenessStatus({
      ...record,
      status: nextStatus,
      updatedAt: now
    }, nextStatus);
    updatedRecords.push(updatedRecord);
    return updatedRecord;
  });

  try {
    beginRecordsMutation();
    await pushRecordsToApi(updatedRecords);
    records = sortRecords(nextRecords);
    saveRecords();
    renderRecords();
    setSyncStatus(`${updatedRecords.length} status tersimpan`, 'success');
    syncStatus.title = 'Update status bulk tersimpan di Cloudflare D1.';
    syncRecordsWithApi({ silent: true });
  } catch (error) {
    setSyncStatus('Gagal bulk web', 'warning');
    syncStatus.title = error.message;
  } finally {
    endRecordsMutation();
  }
}

function getRecordsCsv(recordList) {
  const duplicateIndex = getDuplicateIndex(records);
  const header = [
    'Nama/User',
    'Email Aktivasi',
    'Sumber Order',
    'WhatsApp',
    'No Pesanan',
    'Produk',
    'Durasi Hari',
    'Tanggal Mulai',
    'Tanggal Expire',
    'Status',
    'Last Update',
    'Catatan'
  ];
  const rows = recordList.map((record) => [
    record.customerName,
    record.activatedEmail,
    orderSourceLabels[getRecordOrderSource(record)] || '',
    record.whatsappNumber,
    record.orderNumber,
    record.productName,
    record.durationDays,
    record.startDate,
    record.expiryDate,
    getRecordStatusSummary(record, duplicateIndex),
    record.updatedAt,
    record.notes
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

function exportSelectedCsv() {
  const selectedRecords = getSelectedRecords();

  if (!selectedRecords.length) {
    return;
  }

  downloadFile(`catsoft-customer-selected-${toDateInputValue(new Date())}.csv`, getRecordsCsv(selectedRecords), 'text/csv;charset=utf-8');
}

async function bulkDeleteSelected() {
  if (guardDatabaseMutation()) {
    return;
  }

  const idsToDelete = new Set(selectedRecordIds);
  const selectedTotal = idsToDelete.size;

  if (!selectedTotal || !window.confirm(`Hapus ${selectedTotal} data terpilih?`)) {
    return;
  }

  try {
    beginRecordsMutation();
    const results = await Promise.allSettled([...idsToDelete].map((id) => deleteRecordFromApi(id)));
    const failedCount = results.filter((result) => result.status === 'rejected').length;

    if (failedCount) {
      throw new Error(`${failedCount} data gagal dihapus dari web.`);
    }

    records = records.filter((record) => !idsToDelete.has(record.id));
    selectedRecordIds.clear();
    saveRecords();
    renderRecords();
    setSyncStatus(`${selectedTotal} data terhapus`, 'success');
    syncStatus.title = 'Hapus bulk sudah dikirim ke Cloudflare D1.';
    syncRecordsWithApi({ silent: true });
  } catch (error) {
    setSyncStatus('Gagal hapus web', 'warning');
    syncStatus.title = error.message;
  } finally {
    endRecordsMutation();
  }
}

function debounce(callback, delay = 350) {
  let timerId;

  return (...args) => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => callback(...args), delay);
  };
}

function autoRefreshRecords() {
  if (document.visibilityState === 'hidden' || isMutatingRecords || isDatabaseLocked || isImportingShopeeXlsx) {
    return;
  }

  syncRecordsWithApi({ silent: true, auto: true });
}

function startAutoRefresh() {
  if (autoRefreshTimerId) {
    window.clearInterval(autoRefreshTimerId);
  }

  autoRefreshTimerId = window.setInterval(autoRefreshRecords, autoRefreshMs);
}

function getDurationLabel(days) {
  const duration = Number(days) || 0;

  if (duration === 30) {
    return '1 bulan';
  }

  if (duration === 90) {
    return '3 bulan';
  }

  if (duration === 180) {
    return '6 bulan';
  }

  if (duration === 365) {
    return '1 tahun';
  }

  return `${duration} hari`;
}

function syncPackagePreset() {
  durationDaysGroup.classList.toggle('is-hidden', packagePresetSelect.value !== 'custom');

  if (packagePresetSelect.value !== 'custom') {
    durationDaysInput.value = packagePresetSelect.value;
  }

  updateExpiryFromStart();
}

function syncDurationPreset() {
  const match = Array.from(packagePresetSelect.options).find((option) => option.value === durationDaysInput.value);
  packagePresetSelect.value = match ? match.value : 'custom';
  durationDaysGroup.classList.toggle('is-hidden', packagePresetSelect.value !== 'custom');
}

function updateExpiryFromStart() {
  const startDate = fromDateInput(startDateInput.value);
  const durationDays = Number(durationDaysInput.value);

  if (!startDate || !durationDays) {
    return;
  }

  expiryDateInput.value = toDateInputValue(addDays(startDate, durationDays));
}

function updateStatusByDate() {
  const expiryDate = fromDateInput(expiryDateInput.value);

  if (!expiryDate || subscriptionStatusSelect.value !== 'active') {
    return;
  }

  if (expiryDate < todayDate()) {
    subscriptionStatusSelect.value = 'expired';
  }
}

function getIncompleteFields(record) {
  const missingFields = [];

  if (!record.activatedEmail && isActivationEmailRequired(record)) {
    missingFields.push('email aktivasi');
  }

  if (!record.orderNumber && !record.whatsappNumber) {
    missingFields.push('nomor pesanan/WA');
  }

  if (!record.productName) {
    missingFields.push('produk');
  }

  if (!record.startDate) {
    missingFields.push('tanggal mulai');
  }

  if (!record.expiryDate) {
    missingFields.push('tanggal expire');
  }

  return missingFields;
}

function isRecordIncomplete(record) {
  return getIncompleteFields(record).length > 0;
}

function getStoredStatus(record) {
  const status = record.status || 'active';
  return statusLabels[status] && status !== 'incomplete' ? status : 'active';
}

function getLifecycleStatus(record) {
  const status = getStoredStatus(record);

  if (status === 'removed' || status === 'refund' || status === 'problem') {
    return status;
  }

  const expiryDate = fromDateInput(record.expiryDate);

  if (status === 'expired' || (expiryDate && expiryDate < todayDate())) {
    return 'expired';
  }

  return 'active';
}

function getRecordStatusSummary(record, duplicateIndex = null) {
  const labels = [statusLabels[getLifecycleStatus(record)] || 'Aktif'];

  if (isRecordIncomplete(record)) {
    labels.push(statusLabels.incomplete);
  }

  if (duplicateIndex && isRecordDuplicate(record, duplicateIndex)) {
    labels.push(statusFilterLabels.duplicate);
  }

  return labels.join(' + ');
}

function applyCompletenessStatus(record, previousStatus = '') {
  const fallbackStatus = previousStatus && previousStatus !== 'incomplete' ? previousStatus : 'active';
  const status = record.status === 'incomplete' ? fallbackStatus : record.status;

  return {
    ...record,
    status: statusLabels[status] && status !== 'incomplete' ? status : 'active'
  };
}

function getFormRecord() {
  updateStatusByDate();
  syncOrderReferenceInput();

  const orderSource = getSelectedOrderSource();
  const orderReference = orderReferenceInput.value.trim();
  const productName = productNameInput.value.trim();

  const previousRecord = records.find((record) => record.id === recordIdInput.value) || {};
  const formRecord = {
    id: recordIdInput.value || createId(),
    customerName: customerNameInput.value.trim(),
    activatedEmail: activatedEmailInput.value.trim(),
    whatsappNumber: orderSource === 'whatsapp' ? orderReference : '',
    orderNumber: orderSource === 'shopee' ? orderReference : '',
    orderSource,
    productName: simplifyProductName(productName) || productName,
    durationDays: Number(durationDaysInput.value) || 30,
    startDate: startDateInput.value,
    expiryDate: expiryDateInput.value,
    status: subscriptionStatusSelect.value,
    notes: adminNotesInput.value.trim(),
    updatedAt: new Date().toISOString(),
    createdAt: recordIdInput.value ? previousRecord.createdAt || new Date().toISOString() : new Date().toISOString()
  };

  return applyCompletenessStatus(formRecord, previousRecord.status);
}

function fillForm(record) {
  recordIdInput.value = record.id;
  customerNameInput.value = record.customerName || '';
  activatedEmailInput.value = record.activatedEmail || '';
  whatsappNumberInput.value = record.whatsappNumber || '';
  orderNumberInput.value = record.orderNumber || '';
  updateOrderReferenceField(getRecordOrderSource(record), getOrderReferenceValue(record) || '');
  productNameInput.value = record.productName || '';
  durationDaysInput.value = record.durationDays || 30;
  syncDurationPreset();
  startDateInput.value = record.startDate || '';
  expiryDateInput.value = record.expiryDate || '';
  subscriptionStatusSelect.value = getStoredStatus(record);
  adminNotesInput.value = record.notes || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  form.reset();
  recordIdInput.value = '';
  durationDaysInput.value = '30';
  packagePresetSelect.value = '30';
  subscriptionStatusSelect.value = 'active';
  whatsappNumberInput.value = '';
  orderNumberInput.value = '';
  updateOrderReferenceField('shopee', '');
  syncPackagePreset();
  screenshotInput.value = '';
  screenshotPreview.removeAttribute('src');
  screenshotPreviewWrap.classList.add('is-hidden');
  ocrStatus.textContent = 'Belum ada screenshot dipilih.';
}

function findDuplicateRecord(recordToCheck, recordList = records) {
  const activatedEmail = normalizeUniqueEmail(recordToCheck.activatedEmail);
  const orderNumber = normalizeUniqueOrderNumber(recordToCheck.orderNumber);

  return recordList.find((record) => {
    if (record.id === recordToCheck.id) {
      return false;
    }

    if (activatedEmail && normalizeUniqueEmail(record.activatedEmail) === activatedEmail) {
      return true;
    }

    return orderNumber && normalizeUniqueOrderNumber(record.orderNumber) === orderNumber;
  });
}

function getDuplicateIndex(recordList = records) {
  const emailCounts = new Map();
  const orderCounts = new Map();

  recordList.forEach((record) => {
    const activatedEmail = normalizeUniqueEmail(record.activatedEmail);
    const orderNumber = normalizeUniqueOrderNumber(record.orderNumber);

    if (activatedEmail) {
      emailCounts.set(activatedEmail, (emailCounts.get(activatedEmail) || 0) + 1);
    }

    if (orderNumber) {
      orderCounts.set(orderNumber, (orderCounts.get(orderNumber) || 0) + 1);
    }
  });

  return { emailCounts, orderCounts };
}

function getDuplicateFields(record, duplicateIndex = getDuplicateIndex(records)) {
  const duplicateFields = [];
  const activatedEmail = normalizeUniqueEmail(record.activatedEmail);
  const orderNumber = normalizeUniqueOrderNumber(record.orderNumber);

  if (activatedEmail && (duplicateIndex.emailCounts.get(activatedEmail) || 0) > 1) {
    duplicateFields.push(`Email: ${record.activatedEmail}`);
  }

  if (orderNumber && (duplicateIndex.orderCounts.get(orderNumber) || 0) > 1) {
    duplicateFields.push(`No. pesanan: ${record.orderNumber}`);
  }

  return duplicateFields;
}

function isRecordDuplicate(record, duplicateIndex = getDuplicateIndex(records)) {
  return getDuplicateFields(record, duplicateIndex).length > 0;
}

function getDuplicateMessage(recordToCheck, duplicateRecord) {
  if (!duplicateRecord) {
    return '';
  }

  if (recordToCheck.activatedEmail &&
    normalizeUniqueEmail(recordToCheck.activatedEmail) === normalizeUniqueEmail(duplicateRecord.activatedEmail)) {
    return `Email aktivasi ${recordToCheck.activatedEmail} sudah ada di database.`;
  }

  return `Nomor pesanan ${recordToCheck.orderNumber} sudah ada di database.`;
}

async function submitRecord(event) {
  event.preventDefault();

  if (guardDatabaseMutation()) {
    return;
  }

  if (!productNameInput.value.trim() || !startDateInput.value || !expiryDateInput.value) {
    ocrStatus.textContent = 'Lengkapi produk, tanggal mulai, dan tanggal expire.';
    return;
  }

  const nextRecord = getFormRecord();
  const duplicateRecord = findDuplicateRecord(nextRecord);

  if (duplicateRecord) {
    ocrStatus.textContent = getDuplicateMessage(nextRecord, duplicateRecord);

    if (nextRecord.activatedEmail &&
      normalizeUniqueEmail(nextRecord.activatedEmail) === normalizeUniqueEmail(duplicateRecord.activatedEmail)) {
      activatedEmailInput.focus();
    } else {
      orderReferenceInput.focus();
    }

    return;
  }

  try {
    beginRecordsMutation();
    await pushRecordToApi(nextRecord);
  } catch (error) {
    if (error.status === 409) {
      ocrStatus.textContent = error.message;
      setSyncStatus('Data duplikat', 'warning');
      syncStatus.title = error.message;

      if (normalizeUniqueEmail(nextRecord.activatedEmail) && error.message.toLowerCase().includes('email')) {
        activatedEmailInput.focus();
      } else {
        orderReferenceInput.focus();
      }

      return;
    }

    ocrStatus.textContent = 'Data belum tersimpan karena database web tidak bisa diakses.';
    setSyncStatus('Gagal simpan web', 'warning');
    syncStatus.title = error.message;
    return;
  } finally {
    endRecordsMutation();
  }

  const existingIndex = records.findIndex((record) => record.id === nextRecord.id);

  if (existingIndex >= 0) {
    nextRecord.id = records[existingIndex].id;
    nextRecord.createdAt = records[existingIndex].createdAt || nextRecord.createdAt;
    records[existingIndex] = nextRecord;
  } else {
    records.unshift(nextRecord);
  }

  records = sortRecords(records);
  saveRecords();
  renderRecords();
  resetForm();
  ocrStatus.textContent = 'Data customer berhasil disimpan.';
  setSyncStatus('Tersimpan web', 'success');
  syncStatus.title = 'Data tersimpan di Cloudflare D1.';
  syncRecordsWithApi({ silent: true });
}

function getFilteredRecords(duplicateIndex = getDuplicateIndex(records)) {
  const term = normalizeSearch(searchInput.value);
  const statusValue = statusFilter.value;
  const dateValue = dateFilter.value;
  const lookupEmails = getLookupEmailSet();
  return records.filter((record) => {
    const haystack = normalizeSearch([
      record.customerName,
      record.activatedEmail,
      record.whatsappNumber,
      record.orderNumber,
      record.productName,
      record.notes
    ].join(' '));
    const expiryDate = fromDateInput(record.expiryDate);
    const matchesSearch = !term || haystack.includes(term);
    const matchesLookup = !lookupEmails.size || lookupEmails.has(normalizeUniqueEmail(record.activatedEmail));
    const matchesStatus = statusValue === 'all' ||
      (statusValue === 'incomplete' ? isRecordIncomplete(record) :
        statusValue === 'duplicate' ? isRecordDuplicate(record, duplicateIndex) :
          getLifecycleStatus(record) === statusValue);
    let matchesDate = true;

    // Jika user memilih tanggal, filter yang expiryDate-nya sama persis
    if (dateValue) {
      matchesDate = isSameDate(expiryDate, fromDateInput(dateValue));
    }

    return matchesSearch && matchesLookup && matchesStatus && matchesDate;
  });
}

function renderStats() {
  const today = todayDate();
  const duplicateIndex = getDuplicateIndex(records);
  totalCount.textContent = records.length;
  activeCount.textContent = records.filter((record) => getLifecycleStatus(record) === 'active').length;
  expiredCount.textContent = records.filter((record) => getLifecycleStatus(record) === 'expired').length;
  expireTodayCount.textContent = records.filter((record) => isSameDate(fromDateInput(record.expiryDate), today)).length;
  incompleteCount.textContent = records.filter(isRecordIncomplete).length;
  if (duplicateCount) {
    duplicateCount.textContent = records.filter((record) => isRecordDuplicate(record, duplicateIndex)).length;
  }
}

function applyStatsFilter(mode) {
  if (mode === 'all') {
    statusFilter.value = 'all';
    dateFilter.value = '';
  } else if (mode === 'active') {
    statusFilter.value = 'active';
    dateFilter.value = '';
  } else if (mode === 'expired') {
    statusFilter.value = 'expired';
    dateFilter.value = '';
  } else if (mode === 'today') {
    statusFilter.value = 'all';
    dateFilter.value = toDateInputValue(todayDate());
  } else if (mode === 'incomplete') {
    statusFilter.value = 'incomplete';
    dateFilter.value = '';
  } else if (mode === 'duplicate') {
    statusFilter.value = 'duplicate';
    dateFilter.value = '';
  }

  renderRecords();
}

function renderRecords() {
  renderStats();

  const duplicateIndex = getDuplicateIndex(records);
  const filteredRecords = sortFilteredRecords(getFilteredRecords(duplicateIndex), duplicateIndex);
  const lookupEmails = getLookupEmailSet();
  lastRenderedRecordIds = filteredRecords.map((record) => record.id);
  renderLookupState(filteredRecords);
  renderResultSummary(filteredRecords);
  renderBulkState();

  if (!filteredRecords.length) {
    recordsList.innerHTML = '<p class="empty-state">Tidak ada data yang cocok.</p>';
    applyDatabaseLockState();
    return;
  }

  recordsList.innerHTML = filteredRecords.map((record) => {
    const status = getLifecycleStatus(record);
    const orderSource = getRecordOrderSource(record);
    const orderReference = getOrderReferenceValue(record);
    const orderReferenceTitle = orderSource === 'shopee' ? 'No. pesanan' : 'WA';
    const whatsapp = normalizeWhatsapp(record.whatsappNumber);
    const whatsappLink = whatsapp ? `https://wa.me/${whatsapp}` : '';
    const isLookupMatch = lookupEmails.has(normalizeUniqueEmail(record.activatedEmail));
    const missingFields = getIncompleteFields(record);
    const duplicateFields = getDuplicateFields(record, duplicateIndex);
    const isSelected = selectedRecordIds.has(record.id);

    return `
      <article class="record-card status-${escapeHtml(status)} ${missingFields.length ? 'status-incomplete' : ''} ${duplicateFields.length ? 'status-duplicate' : ''} ${isLookupMatch ? 'is-lookup-match' : ''} ${isSelected ? 'is-selected' : ''}" data-id="${escapeHtml(record.id)}">
        <div class="record-top">
          <label class="record-select" aria-label="Pilih data customer">
            <input type="checkbox" data-select-record="${escapeHtml(record.id)}" ${isSelected ? 'checked' : ''} />
          </label>
          <div class="record-title">
            <div class="record-title-row">
              <h3>${escapeHtml(record.productName || '-')}</h3>
              ${isLookupMatch ? '<span class="match-pill">Email match</span>' : ''}
            </div>
            <p>${escapeHtml(record.customerName || record.activatedEmail || record.whatsappNumber || 'Customer')}</p>
          </div>
          <div class="status-badges">
            <span class="status-badge ${escapeHtml(status)}">${escapeHtml(statusLabels[status] || status)}</span>
            ${missingFields.length ? `<span class="status-badge incomplete">${escapeHtml(statusLabels.incomplete)}</span>` : ''}
            ${duplicateFields.length ? `<span class="status-badge duplicate">${escapeHtml(statusFilterLabels.duplicate)}</span>` : ''}
          </div>
        </div>
        <div class="record-meta">
          <div><span>Expire</span>${escapeHtml(formatDate(record.expiryDate))}</div>
          <div><span>Mulai</span>${escapeHtml(formatDate(record.startDate))}</div>
          <div><span>Durasi</span>${escapeHtml(getDurationLabel(record.durationDays))}</div>
          <div><span>Email</span>${escapeHtml(record.activatedEmail || '-')}</div>
          <div><span>${escapeHtml(orderReferenceTitle)}</span>${escapeHtml(orderReference || '-')}</div>
          <div><span>Last update</span>${escapeHtml(formatDateTime(record.updatedAt || record.createdAt))}</div>
          ${missingFields.length ? `<div class="record-missing"><span>Kurang</span>${escapeHtml(missingFields.join(', '))}</div>` : ''}
          ${duplicateFields.length ? `<div class="record-duplicate"><span>Ganda</span>${escapeHtml(duplicateFields.join(', '))}</div>` : ''}
        </div>
        <div class="record-actions">
          ${renderStatusMenu(status)}
          ${whatsappLink ? `<a class="secondary-button compact-button" href="${escapeHtml(whatsappLink)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
          <button class="secondary-button" type="button" data-action="edit">Edit</button>
          <button class="danger-button" type="button" data-action="delete">Hapus</button>
        </div>
      </article>
    `;
  }).join('');
  applyDatabaseLockState();
}

function normalizeWhatsapp(value) {
  const digits = String(value || '').replace(/[^\d]/g, '');

  if (!digits) {
    return '';
  }

  if (digits.startsWith('62')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }

  return digits;
}

function parseIndonesianDate(text) {
  const datePattern = /(\d{1,2})\s+(Januari|Jan|Februari|Feb|Maret|Mar|April|Apr|Mei|May|Juni|Jun|Juli|Jul|Agustus|Agu|Aug|September|Sep|Oktober|Okt|Oct|November|Nov|Desember|Des|Dec)\s+(\d{4})/i;
  const match = String(text || '').match(datePattern);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = monthMap[match[2].toLowerCase()];
  const year = Number(match[3]);

  if (!day || month === undefined || !year) {
    return null;
  }

  return new Date(year, month, day);
}

function parseSlashDate(text) {
  const match = String(text || '').match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;

  if (!day || month < 0 || month > 11 || !year) {
    return null;
  }

  return new Date(year, month, day);
}

function findDateAfterLabel(text, label) {
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(label.toLowerCase());

  if (index === -1) {
    return null;
  }

  const slice = text.slice(index, index + 180);
  return parseIndonesianDate(slice) || parseSlashDate(slice);
}

function getDurationFromPackageText(text) {
  const match = String(text || '').match(/\b(\d{1,2})\s*(Bulan|Tahun|Hari|Minggu)\b/i);

  if (!match) {
    return 30;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 'tahun') {
    return amount * 365;
  }

  if (unit === 'bulan') {
    return amount * 30;
  }

  if (unit === 'minggu') {
    return amount * 7;
  }

  return amount;
}

function getAiProductType(productText) {
  const text = normalizeSearch(productText)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s{2,}/g, ' ');

  if (!text) {
    return '';
  }

  const hasVirtualAi = /\b(asisten|assistant)?\s*virtual\s*ai\b/.test(text) ||
    /\bvirtual\s*(asisten|assistant)?\s*ai\b/.test(text);
  const hasChatAi = /\bchat\s*(with|bot)?\b.*\b(ai|asisten virtual|assistant virtual|virtual ai)\b/.test(text) ||
    /\b(ai|asisten virtual|assistant virtual|virtual ai)\b.*\bchat\b/.test(text);

  if (hasChatAi) {
    return 'chat-ai';
  }

  if (hasVirtualAi) {
    return 'virtual-ai';
  }

  return '';
}

function getAiProductLabel(productType) {
  if (productType === 'chat-ai' || productType === 'virtual-ai') {
    return 'ChatGPT';
  }

  return '';
}

function normalizeStoredProductName(productText) {
  const text = String(productText || '').trim();
  const aiProductLabel = getAiProductLabel(getAiProductType(text));
  return aiProductLabel || text;
}

function isActivationEmailRequired(record) {
  return !getAiProductType(record.productName);
}

function hasProductHint(line) {
  return /adobe|canva|chatgpt|chat\s*gpt|chat\s*with|virtual\s*ai|asisten\s*virtual|assistant\s*virtual|capcut|cap\s*cut|office|microsoft|template|after effects|aftereffects|instagram|like|view|reels|komen|pro|premium|garansi/i.test(line);
}

function hasProductLineNoise(line) {
  return /rincian|penghasilan|pembayaran|pesanan|waktu|metode|hubungi|salin|subtotal|ongkos|biaya|catatan|pembeli|penyesuaian/i.test(line);
}

function findProductLineIndex(lines) {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];

    if (hasProductHint(line) && !hasProductLineNoise(line) && line.length > 5) {
      return index;
    }
  }

  return -1;
}

function simplifyProductName(productText) {
  const text = String(productText || '').toLowerCase();
  const aiProductLabel = getAiProductLabel(getAiProductType(productText));

  if (!text) {
    return '';
  }

  if (aiProductLabel) {
    return aiProductLabel;
  }

  if (/canva/.test(text)) {
    return /pro/.test(text) ? 'Canva Pro' : 'Canva';
  }

  if (/chat\s*gpt|chatgpt/.test(text)) {
    return /plus/.test(text) ? 'ChatGPT Plus' : 'ChatGPT';
  }

  if (/cap\s*cut|capcut/.test(text)) {
    return /pro/.test(text) ? 'CapCut Pro' : 'CapCut';
  }

  if (/after\s*effects|aftereffects/.test(text)) {
    return 'After Effects';
  }

  if (/adobe|creative cloud|photoshop|illustrator|premiere/.test(text)) {
    return 'Adobe CC';
  }

  if (/office|microsoft|365/.test(text)) {
    return 'Microsoft 365';
  }

  if (/instagram|reels|followers|like|view|komen/.test(text)) {
    return 'Instagram';
  }

  return productText
    .replace(/\s*[-–|].*$/, '')
    .replace(/\b(full\s+garansi|garansi|template|premium)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function findProductName(text) {
  const lines = getCleanLines(text);
  const productIndex = findProductLineIndex(lines);
  const productLine = productIndex >= 0 ? lines[productIndex] : '';

  return simplifyProductName(productLine);
}

function findCustomerName(text, productName) {
  const lines = getCleanLines(text);
  const normalizedProductName = normalizeSearch(productName);
  const productIndexByHint = findProductLineIndex(lines);
  const productIndexByName = normalizedProductName ? lines.findIndex((line) => normalizeSearch(line).includes(normalizedProductName)) : -1;
  const productIndex = productIndexByHint >= 0 ? productIndexByHint : productIndexByName;
  const candidates = productIndex > 0 ? lines.slice(Math.max(0, productIndex - 5), productIndex).reverse() : lines;
  const candidate = candidates.find((line) => {
    const hasNoise = /rincian|penghasilan|pembayaran|metode|pesanan|waktu|produk|subtotal|ongkos|biaya|catatan|hubungi|salin|bulan|tahun|hari|rp|online payment|payment|no\./i.test(line);
    const usernameMatch = line.replace(/[^\w@.-]/g, ' ').match(/@?[a-z0-9][a-z0-9._-]{3,39}/i);
    return !hasNoise && usernameMatch;
  });

  if (!candidate) {
    return '';
  }

  const usernameMatch = candidate.replace(/[^\w@.-]/g, ' ').match(/@?[a-z0-9][a-z0-9._-]{3,39}/i);
  return usernameMatch ? usernameMatch[0].replace(/^@/, '') : '';
}

function findEmail(text) {
  return extractEmails(text)[0] || '';
}

function findWhatsapp(text) {
  const lines = getCleanLines(text);

  for (const line of lines) {
    const matches = line.match(/(?:\+?62|0)8(?:[\s-]?\d){7,13}/g);

    if (!matches) {
      continue;
    }

    const phoneNumber = matches
      .map((match) => match.replace(/[^\d]/g, ''))
      .find((digits) => digits.length >= 10 && digits.length <= 15);

    if (phoneNumber) {
      return phoneNumber;
    }
  }

  return '';
}

function findOrderNumber(text) {
  const match = String(text || '').match(/(?:No\.?\s*Pesanan|Nomor\s*Pesanan|Order\s*ID)\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{5,})/i);
  return match ? match[1].trim() : '';
}

function getCleanLines(text) {
  return String(text || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function applyOcrText(rawText) {
  const normalizedText = rawText
    .replace(/[|]/g, 'I')
    .replace(/[“”]/g, '"')
    .replace(/\r/g, '\n');
  const compactText = normalizedText.replace(/[ \t]+/g, ' ');
  const duration = getDurationFromPackageText(compactText);
  const startDate = findDateAfterLabel(compactText, 'Waktu pengiriman') ||
    findDateAfterLabel(compactText, 'Waktu pembayaran') ||
    findDateAfterLabel(compactText, 'Waktu pemesanan') ||
    parseIndonesianDate(compactText) ||
    parseSlashDate(compactText);
  const productName = findProductName(normalizedText);
  const customerName = findCustomerName(normalizedText, productName);
  const detectedEmails = extractEmails(compactText);
  const email = detectedEmails[0] || '';
  const whatsapp = findWhatsapp(normalizedText);
  const orderNumber = findOrderNumber(compactText);

  durationDaysInput.value = duration;
  syncDurationPreset();

  if (startDate) {
    startDateInput.value = toDateInputValue(startDate);
    updateExpiryFromStart();
  }

  if (productName) {
    productNameInput.value = productName;
  }

  if (customerName) {
    customerNameInput.value = customerName;
  }

  if (email) {
    activatedEmailInput.value = email;
  }

  if (detectedEmails.length) {
    setLookupEmails(detectedEmails, `${detectedEmails.length} email dari OCR input.`);
  }

  if (whatsapp) {
    whatsappNumberInput.value = whatsapp;
  }

  if (orderNumber) {
    orderNumberInput.value = orderNumber;
    updateOrderReferenceField('shopee', orderNumber);
  } else if (whatsapp) {
    updateOrderReferenceField('whatsapp', whatsapp);
  }

  return Boolean(productName || startDate || orderNumber || email || whatsapp);
}

async function readScreenshot(file) {
  if (!file) {
    return;
  }

  const previewUrl = URL.createObjectURL(file);
  screenshotPreview.src = previewUrl;
  screenshotPreviewWrap.classList.remove('is-hidden');

  if (!window.Tesseract) {
    ocrStatus.textContent = 'OCR belum tersedia. Isi data secara manual.';
    return;
  }

  ocrProgress.hidden = false;
  ocrProgressBar.style.width = '0%';
  ocrStatus.textContent = 'Membaca screenshot...';

  try {
    const result = await Tesseract.recognize(file, 'eng+ind', {
      logger(message) {
        if (message.status === 'recognizing text' && Number.isFinite(message.progress)) {
          ocrProgressBar.style.width = `${Math.round(message.progress * 100)}%`;
        }
      }
    });
    const applied = applyOcrText(result.data.text || '');
    ocrStatus.textContent = applied ? 'Screenshot berhasil dibaca. Cek kembali data sebelum disimpan.' : 'OCR selesai, tetapi data utama belum ditemukan.';
    ocrProgressBar.style.width = '100%';
  } catch (error) {
    ocrStatus.textContent = 'OCR gagal membaca screenshot. Isi data secara manual.';
  } finally {
    window.setTimeout(() => {
      ocrProgress.hidden = true;
    }, 700);
  }
}

async function readLookupScreenshot(file) {
  if (!file) {
    return;
  }

  if (!window.Tesseract) {
    lookupStatus.textContent = 'OCR belum tersedia';
    return;
  }

  lookupStatus.textContent = 'Membaca screenshot...';

  try {
    const result = await Tesseract.recognize(file, 'eng+ind');
    const emails = extractEmails(result.data.text || '');

    if (!emails.length) {
      lookupStatus.textContent = '0 email';
      lookupStatus.title = 'Email tidak ditemukan dari screenshot.';
      renderRecords();
      return;
    }

    setLookupEmails(emails, `${emails.length} email dari screenshot.`);
  } catch (error) {
    lookupStatus.textContent = 'OCR gagal';
    lookupStatus.title = error.message;
  }
}

function getShopeeCell(row, labels) {
  const entries = Object.entries(row);
  const normalizedLabels = labels.map(normalizeSearch);
  const match = entries.find(([key]) => normalizedLabels.includes(normalizeSearch(key)));
  return match ? String(match[1] || '').trim() : '';
}

function parseShopeeDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);

  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4] || 0), Number(match[5] || 0));
  }

  return parseIndonesianDate(text) || parseSlashDate(text);
}

function isShopeeCanceledRow(row) {
  const orderStatus = getShopeeCell(row, ['Status Pesanan']);
  const cancelReason = getShopeeCell(row, ['Alasan Pembatalan']);
  const cancelReturnStatus = getShopeeCell(row, ['Status Pembatalan/ Pengembalian', 'Status Pembatalan/Pengembalian']);
  const haystack = normalizeSearch(`${orderStatus} ${cancelReason} ${cancelReturnStatus}`);

  return Boolean(cancelReason) || /dibatalkan|pembatalan|batal|cancel|cancelled|canceled/.test(haystack);
}

function buildShopeeRecord(row, existingRecord = {}) {
  const now = new Date().toISOString();
  const existingStatus = getStoredStatus(existingRecord);
  const orderNumber = getShopeeCell(row, ['No. Pesanan', 'Nomor Pesanan', 'Order ID']);
  const productText = getShopeeCell(row, ['Nama Produk', 'Produk']);
  const variationText = getShopeeCell(row, ['Nama Variasi', 'Variasi']);
  const username = getShopeeCell(row, ['Username (Pembeli)', 'Username Pembeli']);
  const receiverName = getShopeeCell(row, ['Nama Penerima']);
  const phone = getShopeeCell(row, ['No. Telepon', 'Nomor Telepon', 'No Telepon']).replace(/[^\d+]/g, '');
  const orderStatus = getShopeeCell(row, ['Status Pesanan']);
  const startDate = parseShopeeDate(
    getShopeeCell(row, ['Waktu Pembayaran Dilakukan']) ||
    getShopeeCell(row, ['Waktu Pesanan Dibuat']) ||
    getShopeeCell(row, ['Waktu Pengiriman Diatur'])
  );
  const durationDays = getDurationFromPackageText(`${variationText} ${productText}`);
  const startDateValue = startDate ? toDateInputValue(startDate) : existingRecord.startDate || '';
  const expiryDateValue = startDate ? toDateInputValue(addDays(startDate, durationDays)) : existingRecord.expiryDate || '';
  const noteParts = [
    orderStatus ? `Shopee: ${orderStatus}` : '',
    receiverName ? `Penerima: ${receiverName}` : ''
  ].filter(Boolean);
  const nextRecord = {
    id: existingRecord.id || createId(),
    customerName: username || existingRecord.customerName || receiverName,
    activatedEmail: existingRecord.activatedEmail || '',
    whatsappNumber: phone || existingRecord.whatsappNumber || '',
    orderNumber: orderNumber || existingRecord.orderNumber || '',
    orderSource: 'shopee',
    productName: simplifyProductName(productText) || existingRecord.productName || productText,
    durationDays: durationDays || existingRecord.durationDays || 30,
    startDate: startDateValue,
    expiryDate: expiryDateValue,
    status: protectedStatusOptions.has(existingStatus) ? existingStatus : 'active',
    notes: existingRecord.notes || noteParts.join(' | '),
    createdAt: existingRecord.createdAt || now,
    updatedAt: now
  };

  return applyCompletenessStatus(nextRecord, existingRecord.status);
}

const shopeeImportCompareFields = [
  'customerName',
  'activatedEmail',
  'whatsappNumber',
  'orderNumber',
  'orderSource',
  'productName',
  'durationDays',
  'startDate',
  'expiryDate',
  'status',
  'notes'
];

function normalizeComparableRecordValue(value) {
  return String(value ?? '').trim();
}

function hasShopeeRecordChanged(existingRecord, nextRecord) {
  if (!existingRecord || !existingRecord.id) {
    return true;
  }

  return shopeeImportCompareFields.some((field) => {
    return normalizeComparableRecordValue(existingRecord[field]) !== normalizeComparableRecordValue(nextRecord[field]);
  });
}

function uniqueRecordsById(recordList) {
  const recordMap = new Map();

  recordList.forEach((record) => {
    recordMap.set(record.id, record);
  });

  return [...recordMap.values()];
}

async function pushRecordsToBulkImportInChunks(nextRecords, onProgress) {
  const total = nextRecords.length;

  for (let index = 0; index < total; index += xlsxBulkImportChunkSize) {
    const chunk = nextRecords.slice(index, index + xlsxBulkImportChunkSize);
    await pushBulkImportRecordsToApi(chunk, { timeoutMs: xlsxBulkApiTimeoutMs });

    if (onProgress) {
      onProgress(Math.min(index + chunk.length, total), total);
    }
  }
}

async function pushRecordsToApiInBatches(nextRecords, onProgress, options = {}) {
  const total = nextRecords.length;

  for (let index = 0; index < total; index += xlsxImportBatchSize) {
    const batch = nextRecords.slice(index, index + xlsxImportBatchSize);
    await pushXlsxBatchWithFallback(batch, options);

    if (onProgress) {
      onProgress(Math.min(index + batch.length, total), total);
    }
  }
}

async function pushXlsxBatchWithFallback(batch, options = {}) {
  try {
    await pushRecordsToApi(batch, { timeoutMs: options.timeoutMs });
  } catch (error) {
    if (batch.length > 1 && isAbortOrTimeoutError(error)) {
      const splitIndex = Math.ceil(batch.length / 2);
      await pushXlsxBatchWithFallback(batch.slice(0, splitIndex), options);
      await pushXlsxBatchWithFallback(batch.slice(splitIndex), options);
      return;
    }

    if (isAbortOrTimeoutError(error) && !options.isRetry) {
      await wait(900);
      await pushXlsxBatchWithFallback(batch, { ...options, isRetry: true });
      return;
    }

    throw error;
  }
}

async function importShopeeXlsx(file) {
  if (!file) {
    return;
  }

  if (isImportingShopeeXlsx) {
    ocrStatus.textContent = 'Update XLSX masih berjalan. Tunggu sampai selesai.';
    return;
  }

  if (guardDatabaseMutation()) {
    return;
  }

  if (!window.XLSX) {
    ocrStatus.textContent = 'Reader XLSX belum tersedia. Cek koneksi CDN SheetJS.';
    return;
  }

  isImportingShopeeXlsx = true;
  beginRecordsMutation();
  setDatabaseLock(true);
  showXlsxImportOverlay();
  updateXlsxImportOverlay({
    title: 'Membaca file XLSX',
    message: 'Database dikunci sementara. Jangan tutup halaman sampai proses selesai.',
    progress: 5,
    summary: file.name || 'File Shopee'
  });

  try {
    ocrStatus.textContent = 'Membaca file Shopee XLSX...';

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
    updateXlsxImportOverlay({
      title: 'Mengambil data pusat',
      message: 'Menyamakan data terbaru dari Cloudflare D1 sebelum import.',
      progress: 18,
      summary: `${rows.length} baris XLSX terbaca`
    });
    await replaceRecordsFromApi({ timeoutMs: xlsxApiTimeoutMs });

    const stagedRecords = [...records];
    const changedRecords = [];
    let createdCount = 0;
    let updatedCount = 0;
    let incompleteRows = 0;
    let skippedRows = 0;
    let canceledRows = 0;
    let unchangedRows = 0;

    rows.forEach((row) => {
      if (isShopeeCanceledRow(row)) {
        canceledRows += 1;
        return;
      }

      const orderNumber = getShopeeCell(row, ['No. Pesanan', 'Nomor Pesanan', 'Order ID']);

      if (!orderNumber) {
        skippedRows += 1;
        return;
      }

      const existingIndex = stagedRecords.findIndex((record) => normalizeUniqueOrderNumber(record.orderNumber) === normalizeUniqueOrderNumber(orderNumber));
      const existingRecord = existingIndex >= 0 ? stagedRecords[existingIndex] : {};
      const nextRecord = buildShopeeRecord(row, existingRecord);

      if (isRecordIncomplete(nextRecord)) {
        incompleteRows += 1;
      }

      if (existingIndex >= 0) {
        if (hasShopeeRecordChanged(existingRecord, nextRecord)) {
          stagedRecords[existingIndex] = nextRecord;
          updatedCount += 1;
          changedRecords.push(nextRecord);
        } else {
          unchangedRows += 1;
        }
      } else {
        stagedRecords.push(nextRecord);
        createdCount += 1;
        changedRecords.push(nextRecord);
      }
    });

    const uploadRecords = uniqueRecordsById(changedRecords);
    const importSummary = `${updatedCount} update, ${createdCount} baru${unchangedRows ? `, ${unchangedRows} sama dilewati` : ''}, ${incompleteRows} tidak lengkap${canceledRows ? `, ${canceledRows} batal dilewati` : ''}${skippedRows ? `, ${skippedRows} tanpa nomor dilewati` : ''}.`;

    if (uploadRecords.length) {
      updateXlsxImportOverlay({
        title: 'Mengirim update ke web',
        message: 'Data besar dikirim lewat jalur bulk import. Edit, hapus, dan bulk action dikunci sementara.',
        progress: 35,
        summary: `0/${uploadRecords.length} data dikirim`
      });

      try {
        await pushRecordsToBulkImportInChunks(uploadRecords, (sent, total) => {
          updateXlsxImportOverlay({
            title: 'Mengirim update ke web',
            message: 'Data besar dikirim lewat jalur bulk import. Edit, hapus, dan bulk action dikunci sementara.',
            progress: 35 + ((sent / total) * 55),
            summary: `${sent}/${total} data dikirim`
          });
        });
      } catch (error) {
        if (error.status !== 404 && error.status !== 405) {
          throw error;
        }

        updateXlsxImportOverlay({
          title: 'Mode kompatibilitas',
          message: 'Endpoint bulk import belum aktif. Data dikirim dengan mode lama yang lebih pelan.',
          progress: 35,
          summary: `0/${uploadRecords.length} data dikirim`
        });
        await pushRecordsToApiInBatches(uploadRecords, (sent, total) => {
          updateXlsxImportOverlay({
            title: 'Mode kompatibilitas',
            message: 'Endpoint bulk import belum aktif. Data dikirim dengan mode lama yang lebih pelan.',
            progress: 35 + ((sent / total) * 55),
            summary: `${sent}/${total} data dikirim`
          });
        }, { timeoutMs: xlsxApiTimeoutMs });
      }
    }

    updateXlsxImportOverlay({
      title: 'Final sync',
      message: 'Memastikan tampilan memakai data terakhir dari database pusat.',
      progress: 94,
      summary: importSummary
    });
    records = sortRecords(stagedRecords);
    saveRecords();
    renderRecords();
    await replaceRecordsFromApi({ timeoutMs: xlsxApiTimeoutMs });
    ocrStatus.textContent = `XLSX Shopee diproses. ${importSummary}`;
    setSyncStatus(`Update XLSX selesai (${records.length})`, 'success');
    syncStatus.title = 'Import XLSX selesai. Tidak ada proses update XLSX yang berjalan di latar belakang.';
    updateXlsxImportOverlay({
      title: 'Update selesai',
      message: 'Database sudah bisa diedit lagi. File XLSX tidak akan diproses ulang otomatis.',
      progress: 100,
      summary: importSummary,
      mode: 'success'
    });
    xlsxImportHideTimerId = window.setTimeout(hideXlsxImportOverlay, 1100);
  } catch (error) {
    const errorMessage = getFriendlyErrorMessage(error);
    ocrStatus.textContent = `Import XLSX Shopee gagal: ${errorMessage}`;
    setSyncStatus('Gagal import web', 'warning');
    syncStatus.title = errorMessage;
    updateXlsxImportOverlay({
      title: 'Update gagal',
      message: 'Proses sudah dihentikan. Klik Tutup sebelum mencoba import ulang.',
      progress: 100,
      summary: errorMessage,
      mode: 'error',
      canClose: true
    });
  } finally {
    isImportingShopeeXlsx = false;
    endRecordsMutation();
    setDatabaseLock(false);
    importShopeeXlsxInput.value = '';
  }
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value || '').replace(/"/g, '""')}"`;
}

function exportCsv() {
  downloadFile(`catsoft-customer-database-${toDateInputValue(new Date())}.csv`, getRecordsCsv(records), 'text/csv;charset=utf-8');
}

function exportJson() {
  downloadFile(`catsoft-customer-database-${toDateInputValue(new Date())}.json`, JSON.stringify(records, null, 2), 'application/json;charset=utf-8');
}

function importJson(file) {
  if (!file) {
    return;
  }

  if (guardDatabaseMutation()) {
    importJsonInput.value = '';
    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const importedRecords = JSON.parse(reader.result);

      if (!Array.isArray(importedRecords)) {
        throw new Error('Invalid JSON');
      }

      await replaceRecordsFromApi();

      const stagedRecords = [...records];
      const changedRecords = [];
      let skippedDuplicates = 0;

      importedRecords.forEach((record) => {
        const normalizedRecord = normalizeStoredRecord({
          ...record,
          id: record.id || createId(),
          orderSource: record.orderSource || getRecordOrderSource(record),
          updatedAt: record.updatedAt || new Date().toISOString(),
          createdAt: record.createdAt || new Date().toISOString()
        });

        if (!normalizedRecord) {
          return;
        }

        const duplicateRecord = findDuplicateRecord(normalizedRecord, stagedRecords);

        if (duplicateRecord) {
          skippedDuplicates += 1;
          return;
        }

        const existingIndex = stagedRecords.findIndex((item) => item.id === normalizedRecord.id);

        if (existingIndex >= 0) {
          stagedRecords[existingIndex] = { ...stagedRecords[existingIndex], ...normalizedRecord };
          changedRecords.push(stagedRecords[existingIndex]);
        } else {
          stagedRecords.push(normalizedRecord);
          changedRecords.push(normalizedRecord);
        }
      });

      if (changedRecords.length) {
        beginRecordsMutation();
        await pushRecordsToApi(changedRecords);
      }

      records = sortRecords(stagedRecords);
      saveRecords();
      renderRecords();
      syncRecordsWithApi({ silent: true });
      ocrStatus.textContent = skippedDuplicates ? `Import JSON berhasil. ${skippedDuplicates} data duplikat dilewati.` : 'Import JSON berhasil.';
    } catch (error) {
      ocrStatus.textContent = `Import JSON gagal: ${error.message}`;
      setSyncStatus('Gagal import web', 'warning');
      syncStatus.title = error.message;
    } finally {
      endRecordsMutation();
      importJsonInput.value = '';
    }
  };

  reader.readAsText(file);
}

form.addEventListener('submit', submitRecord);
resetFormBtn.addEventListener('click', resetForm);
clearBtn.addEventListener('click', resetForm);
screenshotInput.addEventListener('change', (event) => {
  readScreenshot(event.target.files[0]);
});
lookupScreenshotInput.addEventListener('change', (event) => {
  readLookupScreenshot(event.target.files[0]);
});
emailLookupInput.addEventListener('input', renderRecords);
clearLookupBtn.addEventListener('click', clearLookup);
activatedEmailInput.addEventListener('input', debounce(() => {
  const emails = extractEmails(activatedEmailInput.value);

  if (emails.length) {
    setLookupEmails(emails, 'Email input dicari.');
  }
}));
packagePresetSelect.addEventListener('change', syncPackagePreset);
durationDaysInput.addEventListener('input', () => {
  syncDurationPreset();
  updateExpiryFromStart();
});
startDateInput.addEventListener('change', updateExpiryFromStart);
expiryDateInput.addEventListener('change', updateStatusByDate);
orderSourceSelect.addEventListener('change', handleOrderSourceChange);
orderReferenceInput.addEventListener('input', syncOrderReferenceInput);
searchInput.addEventListener('input', renderRecords);
searchBtn.addEventListener('click', renderRecords);
dateFilter.addEventListener('change', renderRecords);
statusFilter.addEventListener('change', renderRecords);
sortBySelect.addEventListener('change', renderRecords);
sortDirectionSelect.addEventListener('change', renderRecords);
exportCsvBtn.addEventListener('click', exportCsv);
exportJsonBtn.addEventListener('click', exportJson);
importJsonBtn.addEventListener('click', () => {
  if (!guardDatabaseMutation()) {
    importJsonInput.click();
  }
});
importShopeeXlsxBtn.addEventListener('click', () => {
  if (!guardDatabaseMutation()) {
    importShopeeXlsxInput.click();
  }
});
syncRecordsBtn.addEventListener('click', () => {
  if (!guardDatabaseMutation()) {
    syncRecordsWithApi();
  }
});
importJsonInput.addEventListener('change', (event) => {
  importJson(event.target.files[0]);
});
importShopeeXlsxInput.addEventListener('change', (event) => {
  importShopeeXlsx(event.target.files[0]);
});
selectVisibleRecords.addEventListener('change', (event) => {
  if (guardDatabaseMutation()) {
    event.target.checked = false;
    return;
  }

  toggleVisibleSelection(event.target.checked);
});
bulkApplyStatusBtn.addEventListener('click', bulkApplyStatus);
bulkExportCsvBtn.addEventListener('click', exportSelectedCsv);
bulkDeleteBtn.addEventListener('click', bulkDeleteSelected);
clearSelectionBtn.addEventListener('click', clearSelection);
xlsxImportCloseBtn.addEventListener('click', hideXlsxImportOverlay);
window.addEventListener('focus', autoRefreshRecords);
document.addEventListener('visibilitychange', autoRefreshRecords);

recordsList.addEventListener('change', (event) => {
  if (guardDatabaseMutation()) {
    event.preventDefault();
    return;
  }

  const checkbox = event.target.closest('[data-select-record]');

  if (!checkbox) {
    return;
  }

  if (checkbox.checked) {
    selectedRecordIds.add(checkbox.dataset.selectRecord);
  } else {
    selectedRecordIds.delete(checkbox.dataset.selectRecord);
  }

  renderRecords();
});

recordsList.addEventListener('click', async (event) => {
  const actionButton = event.target.closest('[data-action]');

  if (!actionButton) {
    return;
  }

  if (guardDatabaseMutation()) {
    return;
  }

  const action = actionButton.dataset.action;

  if (action === 'toggle-status') {
    const menu = actionButton.closest('.status-menu');

    if (menu) {
      toggleStatusMenu(menu);
    }

    return;
  }

  const recordCard = actionButton.closest('.record-card');

  if (!recordCard) {
    return;
  }

  const record = records.find((item) => item.id === recordCard.dataset.id);

  if (!record) {
    return;
  }

  if (action === 'set-status') {
    const nextStatus = actionButton.dataset.status;

    if (!statusLabels[nextStatus]) {
      return;
    }

    if (record.status === nextStatus) {
      closeStatusMenus();
      return;
    }

    const updatedRecord = applyCompletenessStatus({
      ...record,
      status: nextStatus,
      updatedAt: new Date().toISOString()
    }, nextStatus);

    beginRecordsMutation();
    const saved = await syncSingleRecord(updatedRecord);
    endRecordsMutation();

    if (saved) {
      records = sortRecords(records.map((item) => item.id === updatedRecord.id ? updatedRecord : item));
      saveRecords();
      renderRecords();
    }

    return;
  }

  if (action === 'edit') {
    fillForm(record);
    return;
  }

  if (action === 'delete' && window.confirm('Hapus data customer ini?')) {
    beginRecordsMutation();
    const deleted = await removeSingleRecordFromApi(record.id);
    endRecordsMutation();

    if (deleted) {
      records = records.filter((item) => item.id !== record.id);
      selectedRecordIds.delete(record.id);
      saveRecords();
      renderRecords();
    }
  }
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.status-menu')) {
    closeStatusMenus();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeStatusMenus();
  }
});

// Klik statistik untuk menampilkan subset data terkait
const statCards = [
  { element: totalCount.closest('.stat-card'), mode: 'all' },
  { element: activeCount.closest('.stat-card'), mode: 'active' },
  { element: expiredCount.closest('.stat-card'), mode: 'expired' },
  { element: expireTodayCount.closest('.stat-card'), mode: 'today' },
  { element: incompleteCount.closest('.stat-card'), mode: 'incomplete' },
  { element: duplicateCount?.closest('.stat-card'), mode: 'duplicate' }
];

statCards.forEach((card) => {
  card.element?.addEventListener('click', () => applyStatsFilter(card.mode));
});

updateOrderReferenceField('shopee', '');
syncPackagePreset();
renderRecords();
setSyncStatus(localStorageWarning || (records.length ? 'Cache lokal' : 'Menghubungkan web'), localStorageWarning || records.length ? 'warning' : '');
syncRecordsWithApi();
startAutoRefresh();
