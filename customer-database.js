if (!window.CATSOFT_ADMIN_AUTHORIZED) {
  throw new Error('Catsoft admin authorization required.');
}

const productionApiEndpoint = 'https://catsoft.store/api/customer-records';
const apiEndpoint = window.CATSOFT_CUSTOMER_DATABASE_API || getDefaultApiEndpoint();
const apiTimeoutMs = 8000;
const xlsxApiTimeoutMs = 45000;
const xlsxBulkApiTimeoutMs = 120000;
const customerFetchLimit = 500;
const autoRefreshMs = 3000;
const xlsxImportBatchSize = 8;
const xlsxBulkImportChunkSize = 50;
const bulkStatusChunkSize = 500;
const bulkDeleteChunkSize = 500;
const bulkPatchFallbackConcurrency = 8;
const storageKey = 'catsoftCustomerDatabaseRecords';
const customerFetchMaxPages = 120;
const backupStorageKey = `${storageKey}:backup`;
const productRegistryStorageKey = 'catsoftCustomerDatabaseProducts';
const customerMarketingSettingsKey = 'catsoftMarketingCalculatorSettings';
const customerMarketingSettingsApi = window.CATSOFT_TOOL_SETTINGS_API || getDefaultCustomerMarketingSettingsApiEndpoint();
const defaultCustomerMarketingSettings = {
  adminFeeRate: 6.75,
  programFeeRate: 4.5,
  processingFee: 1250,
  adsValue: 10,
  adsMethod: 'percent',
  affiliateRate: 0,
  cashbackRate: 0,
  shippingSubsidy: 0,
  packingCost: 0,
  otherCost: 0,
  riskRate: 0
};
const customerAdsVatRate = 11;

const form = document.getElementById('customerForm');
const resetFormBtn = document.getElementById('resetFormBtn');
const clearBtn = document.getElementById('clearBtn');
const customerFormToggle = document.getElementById('customerFormToggle');
const customerFormFields = document.getElementById('customerFormFields');
const customerViewButtons = document.querySelectorAll('[data-customer-view-target]');
const customerViewPanels = document.querySelectorAll('[data-customer-view-panel]');
const recordIdInput = document.getElementById('recordId');
const screenshotInput = document.getElementById('screenshotInput');
const screenshotPreviewWrap = document.getElementById('screenshotPreviewWrap');
const screenshotPreview = document.getElementById('screenshotPreview');
const ocrStatus = document.getElementById('ocrStatus');
const ocrProgress = document.getElementById('ocrProgress');
const ocrProgressBar = document.getElementById('ocrProgressBar');
const customerNameInput = document.getElementById('customerName');
const activationFieldLabel = document.getElementById('activationFieldLabel');
const activatedEmailInput = document.getElementById('activatedEmail');
const stockAccountInput = document.getElementById('stockAccount');
const stockAccountList = document.getElementById('stockAccountList');
const incomeAmountInput = document.getElementById('incomeAmount');
const whatsappNumberInput = document.getElementById('whatsappNumber');
const orderNumberInput = document.getElementById('orderNumber');
const orderSourceSelect = document.getElementById('orderSource');
const orderReferenceLabel = document.getElementById('orderReferenceLabel');
const orderReferenceInput = document.getElementById('orderReference');
const productNameInput = document.getElementById('productName');
const registeredProductList = document.getElementById('registeredProductList');
const editRegisteredProductsBtn = document.getElementById('editRegisteredProductsBtn');
const registeredProductsEditor = document.getElementById('registeredProductsEditor');
const registeredProductsInput = document.getElementById('registeredProductsInput');
const registeredProductsCount = document.getElementById('registeredProductsCount');
const saveRegisteredProductsBtn = document.getElementById('saveRegisteredProductsBtn');
const cancelRegisteredProductsBtn = document.getElementById('cancelRegisteredProductsBtn');
const packagePresetSelect = document.getElementById('packagePreset');
const durationDaysGroup = document.getElementById('durationDaysGroup');
const durationDaysInput = document.getElementById('durationDays');
const startDateInput = document.getElementById('startDate');
const expiryDateInput = document.getElementById('expiryDate');
const subscriptionStatusSelect = document.getElementById('subscriptionStatus');
const adminNotesInput = document.getElementById('adminNotes');
const totalCount = document.getElementById('totalCount');
const totalIncomeAmount = document.getElementById('totalIncomeAmount');
const activeCount = document.getElementById('activeCount');
const expiredCount = document.getElementById('expiredCount');
const expireTodayCount = document.getElementById('expireTodayCount');
const incompleteCount = document.getElementById('incompleteCount');
const duplicateCount = document.getElementById('duplicateCount');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const dateFilter = document.getElementById('dateFilter');
const monthFilter = document.getElementById('monthFilter');
const statusFilter = document.getElementById('statusFilter');
const sortBySelect = document.getElementById('sortBy');
const sortDirectionSelect = document.getElementById('sortDirection');
const exportMenuBtn = document.getElementById('exportMenuBtn');
const exportMenuOptions = document.getElementById('exportMenuOptions');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importDataFileInput = document.getElementById('importDataFileInput');
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
const operationOverlayKicker = document.getElementById('operationOverlayKicker');
const xlsxImportTitle = document.getElementById('xlsxImportTitle');
const xlsxImportMessage = document.getElementById('xlsxImportMessage');
const xlsxImportProgressBar = document.getElementById('xlsxImportProgressBar');
const xlsxImportProgressText = document.getElementById('xlsxImportProgressText');
const xlsxImportSummary = document.getElementById('xlsxImportSummary');
const xlsxImportCloseBtn = document.getElementById('xlsxImportCloseBtn');
const importPreview = document.getElementById('importPreview');
const importPreviewStats = document.getElementById('importPreviewStats');
const importPreviewRows = document.getElementById('importPreviewRows');
const importPreviewActions = document.getElementById('importPreviewActions');
const importPreviewCancelBtn = document.getElementById('importPreviewCancelBtn');
const importPreviewConfirmBtn = document.getElementById('importPreviewConfirmBtn');

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

function setupMobileCollapse(toggle, panel) {
  if (!toggle || !panel) {
    return;
  }

  const toggleLabel = toggle.querySelector('strong');

  const setOpen = (isOpen) => {
    panel.classList.toggle('is-open', isOpen);
    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));

    if (toggleLabel) {
      toggleLabel.textContent = isOpen ? 'Sembunyikan' : 'Tampilkan';
    }
  };

  setOpen(true);

  toggle.addEventListener('click', () => {
    setOpen(!panel.classList.contains('is-open'));
  });
}

setupMobileCollapse(customerFormToggle, customerFormFields);

function refreshWorkspaceHeight() {
  window.requestAnimationFrame(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

function setCustomerWorkspaceMode(mode = 'input') {
  const activeMode = mode === 'database' ? 'database' : 'input';

  customerViewButtons.forEach((button) => {
    const isActive = button.dataset.customerViewTarget === activeMode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  customerViewPanels.forEach((panel) => {
    panel.hidden = panel.dataset.customerViewPanel !== activeMode;
  });

  if (activeMode === 'database') {
    renderRecords();
  }

  refreshWorkspaceHeight();
}

customerViewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setCustomerWorkspaceMode(button.dataset.customerViewTarget);
  });
});

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
  incomplete: 'Data Tidak Lengkap'
};

const statusOptions = ['active', 'expired', 'removed', 'refund', 'problem'];
const protectedStatusOptions = new Set(['removed', 'refund', 'problem']);
const statusFilterLabels = {
  ...statusLabels,
  duplicate: 'Data Ganda'
};
const resultSummaryFilterLabels = {
  ...statusFilterLabels,
  incomplete: 'Tidak Lengkap',
  duplicate: 'Ganda'
};

const orderSourceLabels = {
  shopee: 'Shopee',
  whatsapp: 'WhatsApp'
};

const defaultRegisteredProducts = [
  'ChatGPT',
  'ChatGPT Plus',
  'Canva Pro',
  'CapCut Pro',
  'Microsoft Office Original Lifetime',
  'Office Professional Plus 2016',
  'Office Professional Plus 2019',
  'Office Professional Plus 2021',
  'Office Professional Plus 2024',
  'After Effects Assets Pack',
  'After Effects Assets Pack 5000+',
  'Like IG Bergaransi Permanen',
  'View Reels IG Bergaransi',
  'Komen IG Bergaransi',
  'Instagram Like',
  'Instagram View',
  'Instagram Comment',
  'Instagram Followers'
];

let localStorageWarning = '';
let records = loadRecords();
let registeredProducts = loadRegisteredProducts();
let stockAccountOptions = [];
let customerMarketingSettings = loadCustomerMarketingSettings();
let activeOrderSource = 'shopee';
let isSyncingRecords = false;
let isMutatingRecords = false;
let isDatabaseLocked = false;
let isImportingShopeeXlsx = false;
let autoRefreshTimerId = null;
let xlsxImportHideTimerId = null;
let pendingImportJob = null;
let recordsMutationVersion = 0;
let selectedRecordIds = new Set();
let lastRenderedRecordIds = [];
let editingRecordId = '';

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function toMonthInputValue(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}`;
}

function fromDateInput(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getRecordMonthValue(record) {
  const startMonth = String(record?.startDate || '').slice(0, 7);
  const expiryMonth = String(record?.expiryDate || '').slice(0, 7);

  if (/^\d{4}-\d{2}$/.test(startMonth)) {
    return startMonth;
  }

  if (/^\d{4}-\d{2}$/.test(expiryMonth)) {
    return expiryMonth;
  }

  return '';
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

  if (isLocalPage) {
    return productionApiEndpoint;
  }

  return '/api/customer-records';
}

function getProductStockApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.CATSOFT_PRODUCT_STOCK_API) {
    return window.CATSOFT_PRODUCT_STOCK_API;
  }

  if (window.location.protocol === 'file:' || isLocalPage) {
    return 'https://catsoft.store/api/product-stock';
  }

  return '/api/product-stock';
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
  return source === 'whatsapp' ? 'Nomor WhatsApp' : 'No. Pesanan';
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
      <div class="status-options" role="listbox" aria-label="Pilih Status Langganan">
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
  let didClose = false;

  recordsList.querySelectorAll('.status-menu.is-open').forEach((menu) => {
    if (menu === exceptMenu) {
      return;
    }

    menu.classList.remove('is-open');
    menu.closest('.record-card')?.classList.remove('is-menu-open');
    menu.querySelector('.status-trigger')?.setAttribute('aria-expanded', 'false');
    didClose = true;
  });

  if (didClose) {
    refreshWorkspaceHeight();
  }
}

function toggleStatusMenu(menu) {
  const shouldOpen = !menu.classList.contains('is-open');
  closeStatusMenus(shouldOpen ? menu : null);
  menu.classList.toggle('is-open', shouldOpen);
  menu.closest('.record-card')?.classList.toggle('is-menu-open', shouldOpen);
  menu.querySelector('.status-trigger')?.setAttribute('aria-expanded', String(shouldOpen));
  refreshWorkspaceHeight();
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
    localStorageWarning = 'Cache Lokal tidak terbaca.';
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
    setSyncStatus('Cache Lokal Gagal', 'warning');
    syncStatus.title = error.message;
    return false;
  }
}

function cleanProductName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 240);
}

function normalizeProductKey(value) {
  return cleanProductName(value).toLowerCase();
}

function normalizeProductList(values) {
  const productMap = new Map();

  values.forEach((value) => {
    const productName = cleanProductName(value);
    const key = normalizeProductKey(productName);

    if (productName && !productMap.has(key)) {
      productMap.set(key, productName);
    }
  });

  return [...productMap.values()].sort((first, second) => first.localeCompare(second, 'id'));
}

function loadRegisteredProducts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(productRegistryStorageKey) || '[]');
    return normalizeProductList(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    return [];
  }
}

function saveRegisteredProducts(nextProducts = registeredProducts) {
  registeredProducts = normalizeProductList(nextProducts);

  try {
    localStorage.setItem(productRegistryStorageKey, JSON.stringify(registeredProducts));
  } catch (error) {
    setSyncStatus('Produk lokal gagal', 'warning');
    syncStatus.title = error.message;
  }

  renderProductOptions();
}

function getRecordProductNames() {
  return records.map((record) => record.productName).filter(Boolean);
}

function getRegisteredProductOptions() {
  return normalizeProductList([
    ...defaultRegisteredProducts,
    ...registeredProducts,
    ...getRecordProductNames()
  ]);
}

function registerProductsFromRecords(recordList) {
  const newProducts = normalizeProductList(recordList.map((record) => record.productName));
  const existingKeys = new Set(registeredProducts.map(normalizeProductKey));
  const productsToAdd = newProducts.filter((productName) => !existingKeys.has(normalizeProductKey(productName)));

  if (productsToAdd.length) {
    saveRegisteredProducts([...registeredProducts, ...productsToAdd]);
    return;
  }

  renderProductOptions();
}

function addRegisteredProduct(productName) {
  const cleanName = cleanProductName(productName);

  if (!cleanName) {
    return;
  }

  const exists = getRegisteredProductOptions().some((registeredProduct) => {
    return normalizeProductKey(registeredProduct) === normalizeProductKey(cleanName);
  });

  if (!exists) {
    saveRegisteredProducts([...registeredProducts, cleanName]);
    return;
  }

  renderProductOptions();
}

function buildSelectOptions(values, selectedValue = '', placeholder = 'Pilih') {
  const selected = String(selectedValue || '').trim();
  const seen = new Set();
  const options = [`<option value="" ${selected ? '' : 'selected'}>${escapeHtml(placeholder)}</option>`];

  [selected, ...(Array.isArray(values) ? values : [])].forEach((value) => {
    const cleanValue = String(value || '').trim();
    const key = cleanValue.toLowerCase();

    if (!cleanValue || seen.has(key)) {
      return;
    }

    seen.add(key);
    options.push(`<option value="${escapeHtml(cleanValue)}" ${cleanValue === selected ? 'selected' : ''}>${escapeHtml(cleanValue)}</option>`);
  });

  return options.join('');
}

function setSelectOptions(select, values, selectedValue, placeholder = 'Pilih') {
  if (!select || select.tagName !== 'SELECT') {
    return;
  }

  const selected = typeof selectedValue === 'undefined' ? select.value : selectedValue;
  select.innerHTML = buildSelectOptions(values, selected, placeholder);
}

function renderProductOptions() {
  const products = getRegisteredProductOptions();

  setSelectOptions(productNameInput, products, productNameInput?.value || '', 'Pilih Produk');

  if (registeredProductList) {
    registeredProductList.innerHTML = products
      .map((productName) => `<option value="${escapeHtml(productName)}"></option>`)
      .join('');
  }

  if (registeredProductsCount) {
    registeredProductsCount.textContent = `${products.length} Produk`;
  }
}

function getStockAccountOptionLabel(account) {
  return String(account.accountName || account.account_name || account.loginUsername || account.login_username || '').trim();
}

function getStockAccountOptionKey(account) {
  return String(
    account.loginUsername
      || account.login_username
      || account.accountName
      || account.account_name
      || account.accountTarget
      || account.account_target
      || account.id
      || ''
  ).trim();
}

function getStockAccountTypeLabel(value) {
  const type = String(value || '').trim().toLowerCase();
  return {
    account: 'Akun',
    team: 'Tim',
    redeem_code: 'Redeem Code'
  }[type] || type;
}

function getStockAccountOptionParts(account) {
  return [
    getStockAccountOptionLabel(account),
    account.productName || account.product_name,
    getStockAccountTypeLabel(account.stockType || account.stock_type),
    account.loginUsername || account.login_username,
    account.accountTarget || account.account_target
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value, index, values) => values.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);
}

function getStockAccountSearchOptions() {
  const options = new Map();
  const usedLabels = new Map();

  stockAccountOptions.forEach((account) => {
    const saveValue = getStockAccountOptionKey(account);

    if (!saveValue) {
      return;
    }

    const parts = getStockAccountOptionParts(account);
    const fallbackLabel = getStockAccountOptionLabel(account) || saveValue;
    const baseLabel = (parts.length ? parts.join(' · ') : fallbackLabel).trim();
    const count = usedLabels.get(baseLabel.toLowerCase()) || 0;
    const displayValue = count ? `${baseLabel} · ${saveValue}` : baseLabel;

    usedLabels.set(baseLabel.toLowerCase(), count + 1);
    options.set(saveValue.toLowerCase(), {
      value: displayValue,
      label: displayValue,
      saveValue,
      aliases: [displayValue, saveValue, ...parts, account.id].map((value) => String(value || '').trim()).filter(Boolean),
      searchText: [...parts, saveValue, account.id].join(' ').toLowerCase(),
      displayTitle: fallbackLabel,
      displayMeta: parts.filter((part) => part !== fallbackLabel).join(' · ')
    });
  });

  records.forEach((record) => {
    const saveValue = String(record.stockAccount || '').trim();

    if (!saveValue || options.has(saveValue.toLowerCase())) {
      return;
    }

    options.set(saveValue.toLowerCase(), {
      value: saveValue,
      label: saveValue,
      saveValue,
      aliases: [saveValue],
      searchText: saveValue.toLowerCase(),
      displayTitle: saveValue,
      displayMeta: ''
    });
  });

  return [...options.values()].sort((first, second) => {
    return first.label.localeCompare(second.label, 'id');
  });
}

function getStockAccountOptions() {
  return getStockAccountSearchOptions().map((option) => option.value);
}

function getStockAccountOptionByValue(value, options = getStockAccountSearchOptions()) {
  const text = String(value || '').trim().toLowerCase();

  if (!text) {
    return null;
  }

  return options.find((option) => {
    return (option.aliases || [option.value, option.saveValue, option.label]).some((alias) => {
      return String(alias || '').trim().toLowerCase() === text;
    });
  }) || null;
}

function getStockAccountSaveValue(value, options) {
  const text = String(value || '').trim();
  const option = getStockAccountOptionByValue(text, options);

  return option ? option.saveValue : text;
}

function getStockAccountDisplayValue(value, options) {
  const text = String(value || '').trim();
  const option = getStockAccountOptionByValue(text, options);

  return option ? option.value : text;
}

function setStockAccountFieldValue(field, value) {
  if (!field) {
    return;
  }

  if (field.tagName === 'SELECT') {
    setSelectOptions(field, getStockAccountOptions(), value, 'Pilih akun stok');
    return;
  }

  field.value = getStockAccountDisplayValue(value);
}

function renderStockAccountOptions() {
  const options = getStockAccountSearchOptions();

  if (stockAccountInput?.tagName === 'SELECT') {
    setSelectOptions(stockAccountInput, options.map((option) => option.value), stockAccountInput?.value || '', 'Pilih akun stok');
  } else if (stockAccountInput?.value) {
    setStockAccountFieldValue(stockAccountInput, getStockAccountSaveValue(stockAccountInput.value));
  }

  if (stockAccountList) {
    stockAccountList.innerHTML = options
      .map((option) => `<option value="${escapeHtml(option.value)}" label="${escapeHtml(option.label)}"></option>`)
      .join('');
  }

  refreshOpenStockAccountMenus();
}

function isStockAccountInput(field) {
  return Boolean(field?.matches?.('#stockAccount, [data-edit-field="stockAccount"]'));
}

function ensureStockAccountMenu(field) {
  if (!isStockAccountInput(field)) {
    return null;
  }

  field.removeAttribute('list');
  field.setAttribute('autocomplete', 'off');
  field.setAttribute('aria-autocomplete', 'list');

  const wrapper = field.closest('.field-group');
  if (!wrapper) {
    return null;
  }

  wrapper.classList.add('stock-account-field');
  let menu = wrapper.querySelector(':scope > .stock-account-menu');

  if (!menu) {
    menu = document.createElement('div');
    menu.className = 'stock-account-menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    field.insertAdjacentElement('afterend', menu);
  }

  return menu;
}

function getStockAccountMenuMatches(field) {
  const options = getStockAccountSearchOptions();
  const rawQuery = normalizeSearch(field?.value || '');
  const selectedOption = getStockAccountOptionByValue(field?.value || '', options);
  const query = selectedOption ? '' : rawQuery;

  if (!query) {
    return options.slice(0, 12);
  }

  return options
    .filter((option) => normalizeSearch(`${option.label} ${option.saveValue} ${option.searchText}`).includes(query))
    .slice(0, 12);
}

function renderStockAccountMenu(field, open = true) {
  const menu = ensureStockAccountMenu(field);

  if (!menu) {
    return;
  }

  const matches = getStockAccountMenuMatches(field);
  field.setAttribute('aria-expanded', String(open && matches.length > 0));

  if (!open) {
    menu.hidden = true;
    return;
  }

  if (!matches.length) {
    menu.innerHTML = '<div class="stock-account-empty">Stok tidak ditemukan.</div>';
    menu.hidden = false;
    field.setAttribute('aria-expanded', 'true');
    return;
  }

  menu.innerHTML = matches.map((option) => {
    const title = option.displayTitle || option.label || option.saveValue;
    const meta = option.displayMeta || option.saveValue;

    return `
      <button class="stock-account-option" type="button" role="option" data-stock-account-option="${escapeHtml(option.saveValue)}">
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(meta)}</small>
      </button>
    `;
  }).join('');
  menu.hidden = false;
}

function closeStockAccountMenus(exceptField = null) {
  document.querySelectorAll('.stock-account-menu').forEach((menu) => {
    const field = menu.closest('.stock-account-field')?.querySelector('#stockAccount, [data-edit-field="stockAccount"]');

    if (field && exceptField && field === exceptField) {
      return;
    }

    menu.hidden = true;
    field?.setAttribute('aria-expanded', 'false');
  });
}

function refreshOpenStockAccountMenus() {
  document.querySelectorAll('.stock-account-field > .stock-account-menu:not([hidden])').forEach((menu) => {
    const field = menu.closest('.stock-account-field')?.querySelector('#stockAccount, [data-edit-field="stockAccount"]');

    if (field) {
      renderStockAccountMenu(field, true);
    }
  });
}

function selectStockAccountOption(field, saveValue) {
  const option = getStockAccountOptionByValue(saveValue);
  field.value = option ? option.value : saveValue;
  field.dispatchEvent(new Event('change', { bubbles: true }));
  closeStockAccountMenus();
}

async function syncStockAccountOptions() {
  if (!stockAccountInput && !stockAccountList) {
    return;
  }

  try {
    const stockUrl = new URL(getProductStockApiEndpoint(), window.location.href);
    stockUrl.searchParams.set('limit', '300');
    stockUrl.searchParams.set('_', String(Date.now()));

    const response = await fetchWithTimeout(stockUrl.toString(), {
      cache: 'no-store',
      timeoutMs: 10000,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    stockAccountOptions = Array.isArray(payload.accounts) ? payload.accounts : [];
    renderStockAccountOptions();
  } catch (error) {
    renderStockAccountOptions();
  }
}

function normalizeExternalUrl(value) {
  const text = String(value || '').trim();

  if (!text) {
    return '';
  }

  if (/^https?:\/\//i.test(text)) {
    return text;
  }

  return `https://${text}`;
}

function parseCurrencyAmount(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  const text = String(value || '').replace(/[^\d,-]/g, '').replace(',', '.');
  const amount = Number(text);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
}

function formatCurrencyAmount(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(value) || 0)}`;
}

function getDefaultCustomerMarketingSettingsApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage) {
    return 'https://catsoft.store/api/tool-settings/marketing-calculator';
  }

  return '/api/tool-settings/marketing-calculator';
}

function parseMarketingNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value || '').replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCustomerMarketingSettings(settings = {}) {
  const merged = { ...defaultCustomerMarketingSettings, ...(settings || {}) };

  return {
    adminFeeRate: Math.max(parseMarketingNumber(merged.adminFeeRate), 0),
    programFeeRate: Math.max(parseMarketingNumber(merged.programFeeRate), 0),
    processingFee: Math.max(parseCurrencyAmount(merged.processingFee), 0),
    adsValue: 10,
    adsMethod: 'percent',
    affiliateRate: Math.max(parseMarketingNumber(merged.affiliateRate), 0),
    cashbackRate: Math.max(parseMarketingNumber(merged.cashbackRate), 0),
    shippingSubsidy: Math.max(parseCurrencyAmount(merged.shippingSubsidy), 0),
    packingCost: Math.max(parseCurrencyAmount(merged.packingCost), 0),
    otherCost: Math.max(parseCurrencyAmount(merged.otherCost), 0),
    riskRate: Math.max(parseMarketingNumber(merged.riskRate), 0)
  };
}

function loadCustomerMarketingSettings() {
  try {
    return normalizeCustomerMarketingSettings(JSON.parse(localStorage.getItem(customerMarketingSettingsKey) || '{}'));
  } catch (error) {
    return normalizeCustomerMarketingSettings();
  }
}

async function syncCustomerMarketingSettings() {
  customerMarketingSettings = loadCustomerMarketingSettings();

  try {
    const response = await fetch(`${customerMarketingSettingsApi}?_=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const settings = payload.settings || payload || {};
    localStorage.setItem(customerMarketingSettingsKey, JSON.stringify(settings));
    customerMarketingSettings = normalizeCustomerMarketingSettings(settings);
  } catch (error) {
    customerMarketingSettings = loadCustomerMarketingSettings();
  }
}

function calculateCustomerMarketingIncome(grossRevenue, settings = customerMarketingSettings) {
  const netRevenue = Math.max(parseCurrencyAmount(grossRevenue), 0);

  if (!netRevenue) {
    return 0;
  }

  const activeSettings = normalizeCustomerMarketingSettings(settings);
  const adminFee = Math.round(netRevenue * activeSettings.adminFeeRate / 100);
  const programFee = Math.round(netRevenue * activeSettings.programFeeRate / 100);
  const adsBaseBudget = Math.round(netRevenue * 10 / 100);
  const adsVat = Math.round(adsBaseBudget * customerAdsVatRate / 100);
  const affiliateFee = Math.round(netRevenue * activeSettings.affiliateRate / 100);
  const cashbackFee = Math.round(netRevenue * activeSettings.cashbackRate / 100);
  const riskCost = Math.round(netRevenue * activeSettings.riskRate / 100);
  const totalCost = adminFee
    + programFee
    + activeSettings.processingFee
    + adsBaseBudget
    + adsVat
    + affiliateFee
    + cashbackFee
    + activeSettings.shippingSubsidy
    + activeSettings.packingCost
    + activeSettings.otherCost
    + riskCost;

  return Math.max(0, Math.round(netRevenue - totalCost));
}

function renderActivationValue(record) {
  const value = record.activatedEmail || '';

  if (!value) {
    return '-';
  }

  if (!/^https?:\/\//i.test(value) && !/^[\w.-]+\.[a-z]{2,}(?:\/|$)/i.test(value)) {
    return escapeHtml(value);
  }

  const href = normalizeExternalUrl(value);
  return `<a class="record-link" href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(value)}</a>`;
}

function openRegisteredProductEditor() {
  if (!registeredProductsEditor || !registeredProductsInput) {
    return;
  }

  registeredProductsInput.value = getRegisteredProductOptions().join('\n');
  registeredProductsEditor.classList.remove('is-hidden');
  registeredProductsInput.focus();
}

function closeRegisteredProductEditor() {
  registeredProductsEditor?.classList.add('is-hidden');
}

function saveRegisteredProductEditor() {
  if (!registeredProductsInput) {
    return;
  }

  const nextProducts = registeredProductsInput.value
    .split(/\n+/)
    .map(cleanProductName)
    .filter(Boolean);

  saveRegisteredProducts(nextProducts);
  closeRegisteredProductEditor();
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
    stockAccount: String(record.stockAccount ?? record.stock_account ?? '').trim(),
    incomeAmount: parseCurrencyAmount(record.incomeAmount ?? record.income_amount),
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
    if (syncRecordsBtn) {
      syncRecordsBtn.disabled = isSyncingRecords;
    }
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
  xlsxImportOverlay.scrollTop = 0;
  xlsxImportCloseBtn.classList.add('is-hidden');
  importPreview?.classList.add('is-hidden');
  importPreviewActions?.classList.add('is-hidden');
  window.requestAnimationFrame(keepImportOverlayInView);
}

function keepImportOverlayInView() {
  if (window.parent === window) {
    return;
  }

  try {
    const frames = Array.from(window.parent.document.querySelectorAll('[data-console-frame]'));
    const frame = frames.find((candidate) => candidate.contentWindow === window);

    if (!frame) {
      return;
    }

    const headerOffset = 110;
    const frameTop = frame.getBoundingClientRect().top + window.parent.scrollY - headerOffset;
    window.parent.scrollTo({ top: Math.max(0, frameTop), behavior: 'smooth' });
  } catch (error) {
    // Cross-window access may fail outside the admin console; the modal still works locally.
  }
}

function updateXlsxImportOverlay({ kicker = 'Upload Database', title, message, progress, summary, mode = '', canClose = false, canConfirm = false }) {
  if (!xlsxImportOverlay) {
    return;
  }

  const progressValue = Math.min(Math.max(Number(progress) || 0, 0), 100);

  operationOverlayKicker.textContent = kicker;
  xlsxImportTitle.textContent = title;
  xlsxImportMessage.textContent = message;
  xlsxImportProgressBar.style.width = `${progressValue}%`;
  xlsxImportProgressText.textContent = `${Math.round(progressValue)}%`;
  xlsxImportSummary.textContent = summary;
  xlsxImportOverlay.classList.toggle('is-error', mode === 'error');
  xlsxImportOverlay.classList.toggle('is-success', mode === 'success');
  xlsxImportOverlay.classList.toggle('is-preview', mode === 'preview');
  xlsxImportOverlay.classList.toggle('is-finished', mode === 'success');
  xlsxImportCloseBtn.classList.toggle('is-hidden', !canClose);
  importPreviewActions?.classList.toggle('is-hidden', !canConfirm);
}

function hideXlsxImportOverlay() {
  if (!xlsxImportOverlay) {
    return;
  }

  window.clearTimeout(xlsxImportHideTimerId);
  xlsxImportOverlay.classList.add('is-hidden');
  xlsxImportOverlay.classList.remove('is-error', 'is-success', 'is-preview', 'is-finished');
  importPreview?.classList.add('is-hidden');
  importPreviewActions?.classList.add('is-hidden');
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
      credentials: fetchOptions.credentials || 'include',
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
  let pageCount = 0;

  while (pageCount < customerFetchMaxPages) {
    const pageRecords = await fetchApiRecordsPage(offset, customerFetchLimit, options);
    allRecords.push(...pageRecords);
    pageCount += 1;

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

async function pushBulkStatusToApi(ids, status, updatedAt, options = {}) {
  const response = await fetchWithTimeout(buildCustomerApiActionUrl('bulk-status'), {
    method: 'POST',
    cache: 'no-store',
    timeoutMs: options.timeoutMs,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids, status, updatedAt })
  });

  if (!response.ok) {
    const error = new Error(await getApiErrorMessage(response));
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function patchRecordInApi(id, payload, options = {}) {
  const response = await fetchWithTimeout(buildCustomerApiUrl(id), {
    method: 'PATCH',
    cache: 'no-store',
    timeoutMs: options.timeoutMs,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
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

async function deleteRecordsFromApi(ids, options = {}) {
  const response = await fetchWithTimeout(buildCustomerApiActionUrl('bulk-delete'), {
    method: 'POST',
    cache: 'no-store',
    timeoutMs: options.timeoutMs,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
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
  registerProductsFromRecords(records);
  renderStockAccountOptions();
  saveRecords();
  renderRecords();
  return records;
}

async function syncRecordsWithApi(options = {}) {
  if (isSyncingRecords || isImportingShopeeXlsx || isDatabaseLocked || (options.auto && (isMutatingRecords || editingRecordId))) {
    return;
  }

  isSyncingRecords = true;
  const syncMutationVersion = recordsMutationVersion;

  if (!options.silent) {
    setSyncStatus('Sinkron web...');
  }

  if (syncRecordsBtn) {
    syncRecordsBtn.disabled = true;
  }

  try {
    await replaceRecordsFromApi({ expectedMutationVersion: syncMutationVersion });
    setSyncStatus(`Live Web (${records.length})`, 'success');
    syncStatus.title = 'Cloudflare D1 menjadi database pusat. Cache lokal hanya dipakai saat offline.';
  } catch (error) {
    setSyncStatus(records.length ? 'Cache Lokal' : 'Web Offline', 'warning');
    syncStatus.title = error.message;
  } finally {
    if (syncRecordsBtn) {
      syncRecordsBtn.disabled = isDatabaseLocked;
    }
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

  lookupStatus.textContent = emailSet.size ? `${matchedEmails.size}/${emailSet.size} Email Cocok` : '0 Email';

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
    filters.push(`${lookupCount} Email`);
  }

  if (searchInput.value.trim()) {
    filters.push('Cari');
  }

  if (dateFilter.value) {
    filters.push('Expire');
  }

  if (monthFilter?.value) {
    filters.push('Bulan');
  }

  if (statusFilter.value !== 'all') {
    filters.push(resultSummaryFilterLabels[statusFilter.value] || statusFilterLabels[statusFilter.value] || statusFilter.value);
  }

  resultCount.textContent = `${total} Data`;
  resultContext.textContent = filters.length ? filters.join(' · ') : 'Semua Data';
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

  if (sortBy === 'incomeAmount') {
    return Number(record.incomeAmount) || 0;
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

function getVisibleRecordIdSet() {
  return new Set(lastRenderedRecordIds);
}

function getSelectedRecords() {
  const visibleIds = getVisibleRecordIdSet();
  return records.filter((record) => selectedRecordIds.has(record.id) && visibleIds.has(record.id));
}

function pruneSelection() {
  const visibleIds = getVisibleRecordIdSet();
  selectedRecordIds = new Set([...selectedRecordIds].filter((id) => visibleIds.has(id)));
}

function renderBulkState() {
  pruneSelection();

  const selectedRecords = getSelectedRecords();
  const visibleSelectedCount = lastRenderedRecordIds.filter((id) => selectedRecordIds.has(id)).length;
  const hasVisibleRecords = lastRenderedRecordIds.length > 0;
  const hasSelection = selectedRecords.length > 0;
  const isLocked = isDatabaseLocked || isImportingShopeeXlsx;

  selectedCount.textContent = `${selectedRecords.length} Dipilih`;
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
    setSyncStatus('Pilih Data & Status', 'warning');
    syncStatus.title = 'Pilih data yang tampil dan status tujuan sebelum Apply.';
    return;
  }

  const now = new Date().toISOString();
  const selectedIds = selectedRecords.map((record) => record.id);
  const selectedIdSet = new Set(selectedIds);
  const updatedRecords = [];
  const nextRecords = records.map((record) => {
    if (!selectedIdSet.has(record.id)) {
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
    setDatabaseLock(true);
    showXlsxImportOverlay();
    updateXlsxImportOverlay({
      kicker: 'Bulk Action',
      title: 'Mengubah Status',
      message: `Mengubah ${selectedIds.length} data menjadi ${statusLabels[nextStatus]}.`,
      progress: 5,
      summary: `0/${selectedIds.length} Status Tersimpan`
    });
    await updateBulkStatusWithFallback(selectedIds, nextStatus, now, (updated, total, mode = '') => {
      updateXlsxImportOverlay({
        kicker: 'Bulk Action',
        title: 'Mengubah Status',
        message: mode || `Mengubah ${total} data menjadi ${statusLabels[nextStatus]}.`,
        progress: 5 + ((updated / total) * 88),
        summary: `${updated}/${total} Status Tersimpan`
      });
    });
    records = sortRecords(nextRecords);
    selectedRecordIds.clear();
    saveRecords();
    renderRecords();
    setSyncStatus(`${updatedRecords.length} Status Tersimpan`, 'success');
    syncStatus.title = 'Update status bulk tersimpan di Cloudflare D1.';
    updateXlsxImportOverlay({
      kicker: 'Bulk Action',
      title: 'Status Tersimpan',
      message: `${updatedRecords.length} data berhasil diubah menjadi ${statusLabels[nextStatus]}.`,
      progress: 100,
      summary: `${updatedRecords.length} Status Tersimpan`,
      mode: 'success'
    });
    xlsxImportHideTimerId = window.setTimeout(hideXlsxImportOverlay, 1200);
    window.setTimeout(() => syncRecordsWithApi({ silent: true }), 1300);
  } catch (error) {
    setSyncStatus('Gagal Bulk Web', 'warning');
    syncStatus.title = error.message;
    updateXlsxImportOverlay({
      kicker: 'Bulk Action',
      title: 'Status Gagal',
      message: 'Status belum tersimpan ke database pusat.',
      progress: 100,
      summary: error.message,
      mode: 'error',
      canClose: true
    });
  } finally {
    setDatabaseLock(false);
    endRecordsMutation();
  }
}

async function updateBulkStatusWithFallback(ids, status, updatedAt, onProgress) {
  try {
    await updateRecordsStatusInBulkChunks(ids, status, updatedAt, onProgress);
  } catch (error) {
    if (error.status !== 404 && error.status !== 405) {
      throw error;
    }

    if (onProgress) {
      onProgress(0, ids.length, 'Endpoint bulk-status belum aktif, memakai mode kompatibilitas.');
    }

    await updateRecordsStatusOneByOne(ids, status, updatedAt, onProgress);
  }
}

async function updateRecordsStatusInBulkChunks(ids, status, updatedAt, onProgress) {
  let updated = 0;

  for (let index = 0; index < ids.length; index += bulkStatusChunkSize) {
    const chunk = ids.slice(index, index + bulkStatusChunkSize);
    await pushBulkStatusChunkWithFallback(chunk, status, updatedAt, { timeoutMs: xlsxBulkApiTimeoutMs });
    updated += chunk.length;

    if (onProgress) {
      onProgress(updated, ids.length);
    }
  }
}

async function pushBulkStatusChunkWithFallback(ids, status, updatedAt, options = {}) {
  try {
    await pushBulkStatusToApi(ids, status, updatedAt, { timeoutMs: options.timeoutMs });
  } catch (error) {
    if (ids.length > 25 && isAbortOrTimeoutError(error)) {
      const splitIndex = Math.ceil(ids.length / 2);
      await pushBulkStatusChunkWithFallback(ids.slice(0, splitIndex), status, updatedAt, options);
      await pushBulkStatusChunkWithFallback(ids.slice(splitIndex), status, updatedAt, options);
      return;
    }

    if (isAbortOrTimeoutError(error) && !options.isRetry) {
      await wait(900);
      await pushBulkStatusChunkWithFallback(ids, status, updatedAt, { ...options, isRetry: true });
      return;
    }

    throw error;
  }
}

async function updateRecordsStatusOneByOne(ids, status, updatedAt, onProgress) {
  let updated = 0;

  for (let index = 0; index < ids.length; index += bulkPatchFallbackConcurrency) {
    const chunk = ids.slice(index, index + bulkPatchFallbackConcurrency);
    const results = await Promise.allSettled(
      chunk.map((id) => patchRecordInApi(id, { status, updatedAt }, { timeoutMs: xlsxApiTimeoutMs }))
    );
    const failedCount = results.filter((result) => result.status === 'rejected').length;

    if (failedCount) {
      throw new Error(`${failedCount} data gagal diubah dari web.`);
    }

    updated += chunk.length;

    if (onProgress) {
      onProgress(updated, ids.length, 'Mode Kompatibilitas: status disimpan paralel.');
    }
  }
}

function getRecordsCsv(recordList) {
  const duplicateIndex = getDuplicateIndex(records);
  const header = [
    'Nama/User',
    'Target',
    'Stok',
    'Penghasilan',
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
    record.stockAccount,
    record.incomeAmount,
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

  const selectedRecords = getSelectedRecords();
  const idsToDelete = new Set(selectedRecords.map((record) => record.id));
  const selectedTotal = idsToDelete.size;

  if (!selectedTotal || !window.confirm(`Hapus ${selectedTotal} data terpilih?`)) {
    return;
  }

  try {
    beginRecordsMutation();
    setDatabaseLock(true);
    showXlsxImportOverlay();
    updateXlsxImportOverlay({
      kicker: 'Bulk Action',
      title: 'Menghapus Data',
      message: 'Data terpilih sedang dihapus dari database pusat.',
      progress: 4,
      summary: `0/${selectedTotal} Data Terhapus`
    });
    await deleteRecordsInChunks([...idsToDelete], (deleted, total) => {
      updateXlsxImportOverlay({
        kicker: 'Bulk Action',
        title: 'Menghapus Data',
        message: 'Data terpilih sedang dihapus dari database pusat.',
        progress: 4 + ((deleted / total) * 90),
        summary: `${deleted}/${total} Data Terhapus`
      });
    });

    records = records.filter((record) => !idsToDelete.has(record.id));
    selectedRecordIds.clear();
    saveRecords();
    renderRecords();
    setSyncStatus(`${selectedTotal} Data Terhapus`, 'success');
    syncStatus.title = 'Hapus bulk sudah dikirim ke Cloudflare D1.';
    updateXlsxImportOverlay({
      kicker: 'Bulk Action',
      title: 'Hapus Selesai',
      message: 'Data terpilih sudah dihapus. Tampilan mengikuti filter aktif.',
      progress: 100,
      summary: `${selectedTotal} Data Terhapus`,
      mode: 'success'
    });
    xlsxImportHideTimerId = window.setTimeout(hideXlsxImportOverlay, 1200);
    window.setTimeout(() => syncRecordsWithApi({ silent: true }), 1300);
  } catch (error) {
    setSyncStatus('Gagal hapus web', 'warning');
    syncStatus.title = error.message;
    updateXlsxImportOverlay({
      kicker: 'Bulk Action',
      title: 'Hapus Gagal',
      message: 'Sebagian data belum terhapus dari database pusat.',
      progress: 100,
      summary: error.message,
      mode: 'error',
      canClose: true
    });
  } finally {
    setDatabaseLock(false);
    endRecordsMutation();
  }
}

async function deleteRecordsInChunks(ids, onProgress) {
  let deleted = 0;

  for (let index = 0; index < ids.length; index += bulkDeleteChunkSize) {
    const chunk = ids.slice(index, index + bulkDeleteChunkSize);

    try {
      await deleteRecordsChunkWithFallback(chunk, { timeoutMs: xlsxBulkApiTimeoutMs });
    } catch (error) {
      if (error.status !== 404 && error.status !== 405) {
        throw error;
      }

      await deleteRecordsOneByOne(chunk);
    }

    deleted += chunk.length;

    if (onProgress) {
      onProgress(deleted, ids.length);
    }
  }
}

async function deleteRecordsChunkWithFallback(ids, options = {}) {
  try {
    await deleteRecordsFromApi(ids, { timeoutMs: options.timeoutMs });
  } catch (error) {
    if (ids.length > 25 && isAbortOrTimeoutError(error)) {
      const splitIndex = Math.ceil(ids.length / 2);
      await deleteRecordsChunkWithFallback(ids.slice(0, splitIndex), options);
      await deleteRecordsChunkWithFallback(ids.slice(splitIndex), options);
      return;
    }

    if (isAbortOrTimeoutError(error) && !options.isRetry) {
      await wait(900);
      await deleteRecordsChunkWithFallback(ids, { ...options, isRetry: true });
      return;
    }

    throw error;
  }
}

async function deleteRecordsOneByOne(ids) {
  for (let index = 0; index < ids.length; index += bulkPatchFallbackConcurrency) {
    const chunk = ids.slice(index, index + bulkPatchFallbackConcurrency);
    const results = await Promise.allSettled(chunk.map((id) => deleteRecordFromApi(id, { timeoutMs: xlsxApiTimeoutMs })));
    const failedCount = results.filter((result) => result.status === 'rejected').length;

    if (failedCount) {
      throw new Error(`${failedCount} data gagal dihapus dari web.`);
    }
  }
}

function autoRefreshRecords() {
  if (document.visibilityState === 'hidden' || isMutatingRecords || isDatabaseLocked || isImportingShopeeXlsx || editingRecordId) {
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
    return '1 Bulan';
  }

  if (duration === 90) {
    return '3 Bulan';
  }

  if (duration === 180) {
    return '6 Bulan';
  }

  if (duration === 365) {
    return '1 Tahun';
  }

  return `${duration} Hari`;
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
    missingFields.push(getActivationFieldConfig(record).missingLabel);
  }

  if (!record.orderNumber && !record.whatsappNumber) {
    missingFields.push('Nomor Pesanan/WA');
  }

  if (!record.productName) {
    missingFields.push('Produk');
  }

  if (!record.startDate) {
    missingFields.push('Tanggal Mulai');
  }

  if (!record.expiryDate) {
    missingFields.push('Tanggal Expire');
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
    stockAccount: getStockAccountSaveValue(stockAccountInput?.value || ''),
    incomeAmount: parseCurrencyAmount(incomeAmountInput?.value || ''),
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
  setStockAccountFieldValue(stockAccountInput, record.stockAccount || '');
  if (incomeAmountInput) incomeAmountInput.value = record.incomeAmount ? formatCurrencyAmount(record.incomeAmount) : '';
  whatsappNumberInput.value = record.whatsappNumber || '';
  orderNumberInput.value = record.orderNumber || '';
  updateOrderReferenceField(getRecordOrderSource(record), getOrderReferenceValue(record) || '');
  setSelectOptions(productNameInput, getRegisteredProductOptions(), record.productName || '', 'Pilih Produk');
  updateActivationFieldMode(record.productName || '');
  durationDaysInput.value = record.durationDays || 30;
  syncDurationPreset();
  startDateInput.value = record.startDate || '';
  expiryDateInput.value = record.expiryDate || '';
  subscriptionStatusSelect.value = getStoredStatus(record);
  adminNotesInput.value = record.notes || '';
}

function renderStatusSelectOptions(currentStatus) {
  const status = statusLabels[currentStatus] ? currentStatus : 'active';

  return statusOptions.map((optionStatus) => {
    return `<option value="${escapeHtml(optionStatus)}" ${optionStatus === status ? 'selected' : ''}>${escapeHtml(statusLabels[optionStatus])}</option>`;
  }).join('');
}

function renderInlineEditForm(record, status) {
  const orderSource = getRecordOrderSource(record);
  const orderReference = getOrderReferenceValue(record);
  const activationConfig = getActivationFieldConfig(record);

  return `
    <div class="inline-edit-form" data-inline-editor data-order-source="${escapeHtml(orderSource)}" data-shopee-reference="${escapeHtml(record.orderNumber || '')}" data-whatsapp-reference="${escapeHtml(record.whatsappNumber || '')}">
      <label class="field-group">
        <span>Nama/User</span>
        <input data-edit-field="customerName" type="text" value="${escapeHtml(record.customerName || '')}" />
      </label>
      <label class="field-group">
        <span data-inline-activation-label>${escapeHtml(activationConfig.label)}</span>
        <input data-edit-field="activatedEmail" type="${escapeHtml(activationConfig.type)}" inputmode="${escapeHtml(activationConfig.inputMode)}" placeholder="${escapeHtml(activationConfig.placeholder)}" value="${escapeHtml(record.activatedEmail || '')}" />
      </label>
      <label class="field-group">
        <span>Stok</span>
        <input data-edit-field="stockAccount" type="text" placeholder="Cari stok, produk, atau login" autocomplete="off" aria-autocomplete="list" aria-expanded="false" value="${escapeHtml(getStockAccountDisplayValue(record.stockAccount || ''))}" />
      </label>
      <label class="field-group">
        <span>Penghasilan</span>
        <input data-edit-field="incomeAmount" type="text" inputmode="numeric" value="${escapeHtml(record.incomeAmount ? formatCurrencyAmount(record.incomeAmount) : '')}" />
      </label>
      <label class="field-group">
        <span>Channel</span>
        <select data-edit-field="orderSource">
          <option value="shopee" ${orderSource === 'shopee' ? 'selected' : ''}>Shopee</option>
          <option value="whatsapp" ${orderSource === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
        </select>
      </label>
      <label class="field-group">
        <span data-order-reference-label>${escapeHtml(getOrderReferenceLabel(orderSource))}</span>
        <input data-edit-field="orderReference" type="${orderSource === 'whatsapp' ? 'tel' : 'text'}" inputmode="${orderSource === 'whatsapp' ? 'tel' : 'text'}" value="${escapeHtml(orderReference || '')}" />
      </label>
      <label class="field-group">
        <span>Produk</span>
        <select data-edit-field="productName">
          ${buildSelectOptions(getRegisteredProductOptions(), record.productName || '', 'Pilih Produk')}
        </select>
      </label>
      <label class="field-group">
        <span>Durasi</span>
        <input data-edit-field="durationDays" type="number" min="1" step="1" value="${escapeHtml(record.durationDays || 30)}" />
      </label>
      <label class="field-group">
        <span>Mulai</span>
        <input data-edit-field="startDate" type="date" data-empty-label="Pilih Tanggal" value="${escapeHtml(record.startDate || '')}" />
      </label>
      <label class="field-group">
        <span>Expire</span>
        <input data-edit-field="expiryDate" type="date" data-empty-label="Pilih Tanggal" value="${escapeHtml(record.expiryDate || '')}" />
      </label>
      <label class="field-group">
        <span>Status</span>
        <select data-edit-field="status">
          ${renderStatusSelectOptions(status)}
        </select>
      </label>
      <label class="field-group wide-field">
        <span>Catatan</span>
        <textarea data-edit-field="notes" rows="2">${escapeHtml(record.notes || '')}</textarea>
      </label>
      <p class="inline-edit-status" data-inline-edit-status></p>
    </div>
  `;
}

function getInlineEditField(editor, fieldName) {
  return editor.querySelector(`[data-edit-field="${fieldName}"]`);
}

function writeInlineOrderReferenceTo(editor, source) {
  const orderReferenceInput = getInlineEditField(editor, 'orderReference');

  if (!orderReferenceInput) {
    return;
  }

  if (source === 'whatsapp') {
    editor.dataset.whatsappReference = orderReferenceInput.value.trim();
    return;
  }

  editor.dataset.shopeeReference = orderReferenceInput.value.trim();
}

function updateInlineOrderReferenceField(editor, nextSource) {
  const previousSource = editor.dataset.orderSource === 'whatsapp' ? 'whatsapp' : 'shopee';
  const safeNextSource = nextSource === 'whatsapp' ? 'whatsapp' : 'shopee';
  const label = editor.querySelector('[data-order-reference-label]');
  const orderReferenceInput = getInlineEditField(editor, 'orderReference');

  writeInlineOrderReferenceTo(editor, previousSource);
  editor.dataset.orderSource = safeNextSource;

  if (label) {
    label.textContent = getOrderReferenceLabel(safeNextSource);
  }

  if (orderReferenceInput) {
    orderReferenceInput.type = safeNextSource === 'whatsapp' ? 'tel' : 'text';
    orderReferenceInput.inputMode = safeNextSource === 'whatsapp' ? 'tel' : 'text';
    orderReferenceInput.value = safeNextSource === 'whatsapp' ?
      editor.dataset.whatsappReference || '' :
      editor.dataset.shopeeReference || '';
  }
}

function updateInlineEditExpiry(editor) {
  const startDateInput = getInlineEditField(editor, 'startDate');
  const durationInput = getInlineEditField(editor, 'durationDays');
  const expiryInput = getInlineEditField(editor, 'expiryDate');
  const startDate = fromDateInput(startDateInput?.value || '');
  const durationDays = Number(durationInput?.value || 0);

  if (!startDate || !durationDays || !expiryInput) {
    return;
  }

  expiryInput.value = toDateInputValue(addDays(startDate, durationDays));
}

function updateInlineActivationFieldMode(editor) {
  const productName = getInlineEditField(editor, 'productName')?.value || '';
  const activationInput = getInlineEditField(editor, 'activatedEmail');
  const activationLabel = editor.querySelector('[data-inline-activation-label]');
  const config = getActivationFieldConfig(productName);

  if (activationLabel) {
    activationLabel.textContent = config.label;
  }

  if (activationInput) {
    activationInput.type = config.type;
    activationInput.inputMode = config.inputMode;
    activationInput.placeholder = config.placeholder;
  }
}

function getInlineEditRecord(recordCard, previousRecord) {
  const editor = recordCard.querySelector('[data-inline-editor]');
  const now = new Date().toISOString();
  const orderSource = getInlineEditField(editor, 'orderSource')?.value === 'whatsapp' ? 'whatsapp' : 'shopee';
  const orderReference = getInlineEditField(editor, 'orderReference')?.value.trim() || '';
  const productName = getInlineEditField(editor, 'productName')?.value.trim() || '';
  const status = getInlineEditField(editor, 'status')?.value || getStoredStatus(previousRecord);

  writeInlineOrderReferenceTo(editor, orderSource);

  return applyCompletenessStatus({
    id: previousRecord.id,
    customerName: getInlineEditField(editor, 'customerName')?.value.trim() || '',
    activatedEmail: getInlineEditField(editor, 'activatedEmail')?.value.trim() || '',
    stockAccount: getStockAccountSaveValue(getInlineEditField(editor, 'stockAccount')?.value || ''),
    incomeAmount: parseCurrencyAmount(getInlineEditField(editor, 'incomeAmount')?.value || ''),
    whatsappNumber: orderSource === 'whatsapp' ? orderReference : '',
    orderNumber: orderSource === 'shopee' ? orderReference : '',
    orderSource,
    productName: simplifyProductName(productName) || productName,
    durationDays: Number(getInlineEditField(editor, 'durationDays')?.value) || 30,
    startDate: getInlineEditField(editor, 'startDate')?.value || '',
    expiryDate: getInlineEditField(editor, 'expiryDate')?.value || '',
    status,
    notes: getInlineEditField(editor, 'notes')?.value.trim() || '',
    createdAt: previousRecord.createdAt || now,
    updatedAt: now
  }, previousRecord.status);
}

function setInlineEditStatus(recordCard, message, type = '') {
  const statusElement = recordCard.querySelector('[data-inline-edit-status]');

  if (!statusElement) {
    return;
  }

  statusElement.textContent = message;
  statusElement.dataset.type = type;
}

async function saveInlineEdit(recordCard, previousRecord) {
  const nextRecord = getInlineEditRecord(recordCard, previousRecord);
  const duplicateRecord = findDuplicateRecord(nextRecord);

  if (duplicateRecord) {
    setInlineEditStatus(recordCard, getDuplicateMessage(nextRecord, duplicateRecord), 'error');
    setSyncStatus('Data duplikat', 'warning');
    return;
  }

  try {
    beginRecordsMutation();
    setInlineEditStatus(recordCard, 'Menyimpan perubahan...', 'saving');
    await pushRecordToApi(nextRecord);
    addRegisteredProduct(nextRecord.productName);
    records = sortRecords(records.map((record) => record.id === nextRecord.id ? nextRecord : record));
    renderStockAccountOptions();
    editingRecordId = '';
    saveRecords();
    renderRecords();
    setSyncStatus('Tersimpan web', 'success');
    syncStatus.title = 'Perubahan data tersimpan di Cloudflare D1.';
    window.setTimeout(() => syncRecordsWithApi({ silent: true }), 600);
  } catch (error) {
    setInlineEditStatus(recordCard, error.message, 'error');
    setSyncStatus(error.status === 409 ? 'Data duplikat' : 'Gagal simpan web', 'warning');
    syncStatus.title = error.message;
  } finally {
    endRecordsMutation();
  }
}

function resetForm() {
  form.reset();
  recordIdInput.value = '';
  durationDaysInput.value = '30';
  packagePresetSelect.value = '30';
  subscriptionStatusSelect.value = 'active';
  whatsappNumberInput.value = '';
  orderNumberInput.value = '';
  setStockAccountFieldValue(stockAccountInput, '');
  setSelectOptions(productNameInput, getRegisteredProductOptions(), '', 'Pilih Produk');
  updateOrderReferenceField('shopee', '');
  updateActivationFieldMode('');
  syncPackagePreset();
  screenshotInput.value = '';
  screenshotPreview.removeAttribute('src');
  screenshotPreviewWrap.classList.add('is-hidden');
  ocrStatus.textContent = 'Belum ada screenshot dipilih.';
}

function findDuplicateRecord(recordToCheck, recordList = records) {
  const orderNumber = normalizeUniqueOrderNumber(recordToCheck.orderNumber);

  return recordList.find((record) => {
    if (record.id === recordToCheck.id) {
      return false;
    }

    if (orderNumber && normalizeUniqueOrderNumber(record.orderNumber) === orderNumber) {
      return true;
    }

    return false;
  });
}

function getDuplicateIndex(recordList = records) {
  const orderCounts = new Map();

  recordList.forEach((record) => {
    const orderNumber = normalizeUniqueOrderNumber(record.orderNumber);

    if (orderNumber) {
      orderCounts.set(orderNumber, (orderCounts.get(orderNumber) || 0) + 1);
    }
  });

  return { orderCounts };
}

function getDuplicateFields(record, duplicateIndex = getDuplicateIndex(records)) {
  const duplicateFields = [];
  const orderNumber = normalizeUniqueOrderNumber(record.orderNumber);

  if (orderNumber && (duplicateIndex.orderCounts.get(orderNumber) || 0) > 1) {
    duplicateFields.push(`No. Pesanan: ${record.orderNumber}`);
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

  if (recordToCheck.orderNumber &&
    normalizeUniqueOrderNumber(recordToCheck.orderNumber) === normalizeUniqueOrderNumber(duplicateRecord.orderNumber)) {
    return `Nomor pesanan ${recordToCheck.orderNumber} sudah ada di database.`;
  }

  return 'Data sudah ada di database.';
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
    orderReferenceInput.focus();
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

      orderReferenceInput.focus();

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

  addRegisteredProduct(nextRecord.productName);
  records = sortRecords(records);
  renderStockAccountOptions();
  saveRecords();
  renderRecords();
  resetForm();
  setCustomerWorkspaceMode('database');
  ocrStatus.textContent = 'Data customer berhasil disimpan.';
  setSyncStatus('Tersimpan web', 'success');
  syncStatus.title = 'Data tersimpan di Cloudflare D1.';
  syncRecordsWithApi({ silent: true });
}

function getFilteredRecords(duplicateIndex = getDuplicateIndex(records)) {
  const term = normalizeSearch(searchInput.value);
  const statusValue = statusFilter.value;
  const dateValue = dateFilter.value;
  const monthValue = monthFilter?.value || '';
  const lookupEmails = getLookupEmailSet();
  const stockOptions = getStockAccountSearchOptions();
  return records.filter((record) => {
    const haystack = normalizeSearch([
      record.customerName,
      record.activatedEmail,
      record.stockAccount,
      getStockAccountDisplayValue(record.stockAccount, stockOptions),
      record.incomeAmount,
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

    const matchesMonth = !monthValue || getRecordMonthValue(record) === monthValue;

    return matchesSearch && matchesLookup && matchesStatus && matchesDate && matchesMonth;
  });
}

function renderStats(displayedRecords = records) {
  const today = todayDate();
  const duplicateIndex = getDuplicateIndex(records);
  const incomeTotal = displayedRecords.reduce((total, record) => total + parseCurrencyAmount(record.incomeAmount ?? record.income_amount), 0);
  totalCount.textContent = records.length;
  if (totalIncomeAmount) {
    totalIncomeAmount.textContent = formatCurrencyAmount(incomeTotal);
  }
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
    if (monthFilter) {
      monthFilter.value = '';
    }
  } else if (mode === 'active') {
    statusFilter.value = 'active';
    dateFilter.value = '';
    if (monthFilter) {
      monthFilter.value = '';
    }
  } else if (mode === 'expired') {
    statusFilter.value = 'expired';
    dateFilter.value = '';
    if (monthFilter) {
      monthFilter.value = '';
    }
  } else if (mode === 'today') {
    statusFilter.value = 'all';
    dateFilter.value = toDateInputValue(todayDate());
    if (monthFilter) {
      monthFilter.value = toMonthInputValue(todayDate());
    }
  } else if (mode === 'incomplete') {
    statusFilter.value = 'incomplete';
    dateFilter.value = '';
    if (monthFilter) {
      monthFilter.value = '';
    }
  } else if (mode === 'duplicate') {
    statusFilter.value = 'duplicate';
    dateFilter.value = '';
    if (monthFilter) {
      monthFilter.value = '';
    }
  }

  renderRecords();
}

function renderRecords() {
  const duplicateIndex = getDuplicateIndex(records);
  const filteredRecords = sortFilteredRecords(getFilteredRecords(duplicateIndex), duplicateIndex);
  renderStats(filteredRecords);
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
    const orderReferenceTitle = orderSource === 'shopee' ? 'No. Pesanan' : 'WA';
    const whatsapp = normalizeWhatsapp(record.whatsappNumber);
    const whatsappLink = whatsapp ? `https://wa.me/${whatsapp}` : '';
	    const isLookupMatch = lookupEmails.has(normalizeUniqueEmail(record.activatedEmail));
	    const missingFields = getIncompleteFields(record);
	    const duplicateFields = getDuplicateFields(record, duplicateIndex);
	    const isSelected = selectedRecordIds.has(record.id);
	    const isEditing = editingRecordId === record.id;
	    const activationConfig = getActivationFieldConfig(record);

    return `
      <article class="record-card status-${escapeHtml(status)} ${missingFields.length ? 'status-incomplete' : ''} ${duplicateFields.length ? 'status-duplicate' : ''} ${isLookupMatch ? 'is-lookup-match' : ''} ${isSelected ? 'is-selected' : ''} ${isEditing ? 'is-editing' : ''}" data-id="${escapeHtml(record.id)}">
        <div class="record-top">
          <label class="record-select" aria-label="Pilih Data Customer">
            <input type="checkbox" data-select-record="${escapeHtml(record.id)}" ${isSelected ? 'checked' : ''} />
          </label>
          <div class="record-title">
            <div class="record-title-row">
              <h3>${escapeHtml(record.productName || '-')}</h3>
              ${isLookupMatch ? `<span class="match-pill">${escapeHtml(activationConfig.sortLabel)} Match</span>` : ''}
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
	          <div><span>${escapeHtml(activationConfig.label)}</span>${renderActivationValue(record)}</div>
          <div><span>Stok</span>${escapeHtml(getStockAccountDisplayValue(record.stockAccount) || '-')}</div>
          <div><span>Penghasilan</span>${escapeHtml(formatCurrencyAmount(record.incomeAmount))}</div>
          <div><span>${escapeHtml(orderReferenceTitle)}</span>${escapeHtml(orderReference || '-')}</div>
          <div><span>Last Update</span>${escapeHtml(formatDateTime(record.updatedAt || record.createdAt))}</div>
          ${missingFields.length ? `<div class="record-missing"><span>Kurang</span>${escapeHtml(missingFields.join(', '))}</div>` : ''}
          ${duplicateFields.length ? `<div class="record-duplicate"><span>Ganda</span>${escapeHtml(duplicateFields.join(', '))}</div>` : ''}
        </div>
        ${isEditing ? renderInlineEditForm(record, status) : ''}
        <div class="record-actions">
          ${isEditing ? `
            <button class="primary-button" type="button" data-action="save-inline-edit">Simpan</button>
            <button class="secondary-button" type="button" data-action="cancel-inline-edit">Batal</button>
          ` : `
            ${renderStatusMenu(status)}
            ${whatsappLink ? `<a class="secondary-button compact-button" href="${escapeHtml(whatsappLink)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
            <button class="secondary-button" type="button" data-action="edit">Edit</button>
            <button class="danger-button" type="button" data-action="delete">Hapus</button>
          `}
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

  if (/chat\s*gpt|chatgpt|openai/.test(text)) {
    return 'chatgpt';
  }

  if (hasChatAi) {
    return 'chat-ai';
  }

  if (hasVirtualAi) {
    return 'virtual-ai';
  }

  return '';
}

function getAiProductLabel(productType) {
  if (productType === 'chatgpt' || productType === 'chat-ai' || productType === 'virtual-ai') {
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
  return true;
}

function isSharedActivationEmailProduct(record) {
  return Boolean(getAiProductType(record.productName));
}

function isTargetLinkProduct(recordOrProductName) {
  const productName = typeof recordOrProductName === 'string' ? recordOrProductName : recordOrProductName?.productName;
  const text = normalizeSearch(productName)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s{2,}/g, ' ');

  if (!text) {
    return false;
  }

  const hasSocialBrand = /\b(instagram|ig|reels|tiktok|youtube|shorts)\b/.test(text);
  const hasTargetService = /\b(view|views|viewer|like|likes|komen|komentar|comment|comments|follower|followers|follow|subscriber|subscribers|share|save)\b/.test(text);

  return hasSocialBrand || hasTargetService;
}

function getActivationFieldConfig(recordOrProductName) {
  return {
    label: 'Target',
    placeholder: 'Email atau link target',
    inputMode: 'text',
    type: 'text',
    missingLabel: 'Target',
    sortLabel: 'Target'
  };
}

function updateActivationFieldMode(productName = productNameInput.value) {
  const config = getActivationFieldConfig(productName);

  if (activationFieldLabel) {
    activationFieldLabel.textContent = config.label;
  }

  activatedEmailInput.placeholder = config.placeholder;
  activatedEmailInput.type = config.type;
  activatedEmailInput.inputMode = config.inputMode;
}

function shouldCheckActivationEmailDuplicate(record) {
  return false;
}

function doSubscriptionPeriodsOverlap(firstRecord, secondRecord) {
  const firstStart = fromDateInput(firstRecord.startDate);
  const firstExpiry = fromDateInput(firstRecord.expiryDate);
  const secondStart = fromDateInput(secondRecord.startDate);
  const secondExpiry = fromDateInput(secondRecord.expiryDate);

  if (!firstStart || !firstExpiry || !secondStart || !secondExpiry) {
    return true;
  }

  return firstStart < secondExpiry && secondStart < firstExpiry;
}

function shouldBlockActivationEmailDuplicate(firstRecord, secondRecord) {
  const firstEmail = normalizeUniqueEmail(firstRecord.activatedEmail);
  const secondEmail = normalizeUniqueEmail(secondRecord.activatedEmail);

  if (!firstEmail || firstEmail !== secondEmail) {
    return false;
  }

  if (!shouldCheckActivationEmailDuplicate(firstRecord) || !shouldCheckActivationEmailDuplicate(secondRecord)) {
    return false;
  }

  return doSubscriptionPeriodsOverlap(firstRecord, secondRecord);
}

function hasProductHint(line) {
  return /adobe|canva|chatgpt|chat\s*gpt|chat\s*with|virtual\s*ai|asisten\s*virtual|assistant\s*virtual|capcut|cap\s*cut|office|microsoft|template|after effects|aftereffects|after preset|preset|lut|instagram|like|view|reels|komen|komentar|followers|follower|pro|premium|garansi/i.test(line);
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

  if (/after\s*effects|aftereffects|after\s*preset|\bae\b|\blut\b|preset/.test(text)) {
    const cleanCreativeProduct = cleanProductName(productText)
      .replace(/\b(full\s+garansi|garansi|premium)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return cleanCreativeProduct || 'After Effects Assets Pack';
  }

  if (/adobe|creative cloud|photoshop|illustrator|premiere/.test(text)) {
    return 'Adobe CC';
  }

  if (/office|microsoft|365/.test(text)) {
    return 'Microsoft 365';
  }

  if (/instagram|reels|followers|follower|like|view|komen|komentar|comment|\big\b/.test(text)) {
    if (/komen|komentar|comment/.test(text)) {
      return 'Instagram Comment';
    }

    if (/followers|follower|follow/.test(text)) {
      return 'Instagram Followers';
    }

    if (/view|views|reels|reel/.test(text)) {
      return 'Instagram View';
    }

    if (/like|likes/.test(text)) {
      return 'Instagram Like';
    }

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
    addRegisteredProduct(productName);
    setSelectOptions(productNameInput, getRegisteredProductOptions(), productName, 'Pilih Produk');
    updateActivationFieldMode(productName);
  }

  if (customerName) {
    customerNameInput.value = customerName;
  }

  if (email) {
    activatedEmailInput.value = email;
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
      lookupStatus.textContent = '0 Email';
      lookupStatus.title = 'Email tidak ditemukan dari screenshot.';
      renderRecords();
      return;
    }

    setLookupEmails(emails, `${emails.length} Email Dari Screenshot.`);
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

function getShopeeGrossOrderAmount(row) {
  return parseCurrencyAmount(getShopeeCell(row, [
    'Subtotal Pesanan',
    'Subtotal Order',
    'Subtotal Produk',
    'Total Harga Produk',
    'Total Harga Produk Setelah Diskon',
    'Harga Setelah Diskon',
    'Harga Produk',
    'Total Pembayaran',
    'Total Belanja',
    'Subtotal'
  ]));
}

function getShopeeFinalIncomeAmount(row) {
  return parseCurrencyAmount(getShopeeCell(row, [
    'Penghasilan Akhir',
    'Estimasi Total Penghasilan',
    'Total Penghasilan',
    'Dana Yang Dilepaskan',
    'Dana Dilepaskan'
  ]));
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
  const grossOrderAmount = getShopeeGrossOrderAmount(row);
  const calculatedIncomeAmount = grossOrderAmount ? calculateCustomerMarketingIncome(grossOrderAmount) : 0;
  const fallbackIncomeAmount = getShopeeFinalIncomeAmount(row);
  const noteParts = [
    orderStatus ? `Shopee: ${orderStatus}` : '',
    receiverName ? `Penerima: ${receiverName}` : ''
  ].filter(Boolean);
  const nextRecord = {
    id: existingRecord.id || createId(),
    customerName: username || existingRecord.customerName || receiverName,
    activatedEmail: existingRecord.activatedEmail || '',
    stockAccount: existingRecord.stockAccount || '',
    incomeAmount: calculatedIncomeAmount || existingRecord.incomeAmount || fallbackIncomeAmount,
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
  'stockAccount',
  'incomeAmount',
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
    await pushBulkImportChunkWithFallback(chunk, { timeoutMs: xlsxBulkApiTimeoutMs });

    if (onProgress) {
      onProgress(Math.min(index + chunk.length, total), total);
    }
  }
}

async function pushBulkImportChunkWithFallback(chunk, options = {}) {
  try {
    await pushBulkImportRecordsToApi(chunk, { timeoutMs: options.timeoutMs });
  } catch (error) {
    if (chunk.length > 10 && isAbortOrTimeoutError(error)) {
      const splitIndex = Math.ceil(chunk.length / 2);
      await pushBulkImportChunkWithFallback(chunk.slice(0, splitIndex), options);
      await pushBulkImportChunkWithFallback(chunk.slice(splitIndex), options);
      return;
    }

    if (isAbortOrTimeoutError(error) && !options.isRetry) {
      await wait(1200);
      await pushBulkImportChunkWithFallback(chunk, { ...options, isRetry: true });
      return;
    }

    throw error;
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

function getImportSummaryText(job) {
  if (!job) {
    return '';
  }

  const parts = [
    `${job.updatedCount || 0} Update`,
    `${job.createdCount || 0} Baru`
  ];

  if (job.unchangedRows) {
    parts.push(`${job.unchangedRows} Sama Dilewati`);
  }

  if (job.skippedDuplicates) {
    parts.push(`${job.skippedDuplicates} Ganda Dilewati`);
  }

  if (job.incompleteRows) {
    parts.push(`${job.incompleteRows} Tidak Lengkap`);
  }

  if (job.canceledRows) {
    parts.push(`${job.canceledRows} Batal Dilewati`);
  }

  if (job.skippedRows) {
    parts.push(`${job.skippedRows} Tanpa Nomor Dilewati`);
  }

  if (job.invalidRows) {
    parts.push(`${job.invalidRows} Tidak Valid`);
  }

  return `${parts.join(', ')}.`;
}

function getImportPreviewLabel(record, job) {
  if (!record || !job) {
    return 'Preview';
  }

  if (isRecordIncomplete(record)) {
    return statusLabels.incomplete;
  }

  const idKey = String(record.id || '');
  const orderKey = normalizeUniqueOrderNumber(record.orderNumber);

  if (job.createdIds?.has(idKey) || (orderKey && job.createdOrderNumbers?.has(orderKey))) {
    return 'Baru';
  }

  if (job.updatedIds?.has(idKey) || (orderKey && job.updatedOrderNumbers?.has(orderKey))) {
    return 'Update';
  }

  return 'Cek';
}

function renderImportPreview(job) {
  if (!importPreview || !importPreviewStats || !importPreviewRows || !importPreviewConfirmBtn) {
    return;
  }

  const previewRows = job.uploadRecords.slice(0, 8);
  const summaryItems = [
    ['Akan Diupload', job.uploadRecords.length],
    ['Baru', job.createdCount || 0],
    ['Update', job.updatedCount || 0],
    ['Tidak Lengkap', job.incompleteRows || 0],
    ['Dilewati', (job.unchangedRows || 0) + (job.skippedRows || 0) + (job.canceledRows || 0) + (job.skippedDuplicates || 0)]
  ];

  importPreviewStats.innerHTML = summaryItems.map(([label, value]) => `
    <span><strong>${escapeHtml(value)}</strong>${escapeHtml(label)}</span>
  `).join('');

  importPreviewRows.innerHTML = previewRows.length
    ? previewRows.map((record) => `
      <tr>
        <td>${escapeHtml(record.customerName || '-')}</td>
        <td>${escapeHtml(record.productName || '-')}</td>
        <td>${escapeHtml(record.orderNumber || '-')}</td>
        <td><span>${escapeHtml(getImportPreviewLabel(record, job))}</span></td>
      </tr>
    `).join('')
    : '<tr><td colspan="4">Tidak ada data baru atau update dari file ini.</td></tr>';

  importPreviewConfirmBtn.disabled = !job.uploadRecords.length;
  importPreview.classList.remove('is-hidden');
}

function buildShopeeImportPlan(rows, baseRecords, file) {
  const stagedRecords = [...baseRecords];
  const changedRecords = [];
  const createdOrderNumbers = new Set();
  const updatedOrderNumbers = new Set();
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
    const normalizedOrder = normalizeUniqueOrderNumber(orderNumber);

    if (!normalizedOrder) {
      skippedRows += 1;
      return;
    }

    const existingIndex = stagedRecords.findIndex((record) => normalizeUniqueOrderNumber(record.orderNumber) === normalizedOrder);
    const existingRecord = existingIndex >= 0 ? stagedRecords[existingIndex] : {};
    const nextRecord = buildShopeeRecord(row, existingRecord);

    if (isRecordIncomplete(nextRecord)) {
      incompleteRows += 1;
    }

    if (existingIndex >= 0) {
      if (hasShopeeRecordChanged(existingRecord, nextRecord)) {
        stagedRecords[existingIndex] = nextRecord;
        updatedCount += 1;
        updatedOrderNumbers.add(normalizedOrder);
        changedRecords.push(nextRecord);
      } else {
        unchangedRows += 1;
      }
    } else {
      stagedRecords.push(nextRecord);
      createdCount += 1;
      createdOrderNumbers.add(normalizedOrder);
      changedRecords.push(nextRecord);
    }
  });

  const uploadRecords = uniqueRecordsById(changedRecords);

  return {
    type: 'xlsx',
    kicker: 'Preview XLSX Shopee',
    fileName: file?.name || 'File XLSX',
    rowCount: rows.length,
    stagedRecords,
    uploadRecords,
    createdCount,
    updatedCount,
    incompleteRows,
    skippedRows,
    canceledRows,
    unchangedRows,
    createdOrderNumbers,
    updatedOrderNumbers
  };
}

function buildJsonImportPlan(importedRecords, baseRecords, file) {
  const stagedRecords = [...baseRecords];
  const changedRecords = [];
  const createdIds = new Set();
  const updatedIds = new Set();
  let createdCount = 0;
  let updatedCount = 0;
  let skippedDuplicates = 0;
  let invalidRows = 0;

  importedRecords.forEach((record) => {
    const normalizedRecord = normalizeStoredRecord({
      ...record,
      id: record.id || createId(),
      orderSource: record.orderSource || getRecordOrderSource(record),
      updatedAt: record.updatedAt || new Date().toISOString(),
      createdAt: record.createdAt || new Date().toISOString()
    });

    if (!normalizedRecord) {
      invalidRows += 1;
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
      updatedIds.add(normalizedRecord.id);
      updatedCount += 1;
      changedRecords.push(stagedRecords[existingIndex]);
    } else {
      stagedRecords.push(normalizedRecord);
      createdIds.add(normalizedRecord.id);
      createdCount += 1;
      changedRecords.push(normalizedRecord);
    }
  });

  const uploadRecords = uniqueRecordsById(changedRecords);

  return {
    type: 'json',
    kicker: 'Preview JSON',
    fileName: file?.name || 'File JSON',
    rowCount: importedRecords.length,
    stagedRecords,
    uploadRecords,
    createdCount,
    updatedCount,
    skippedDuplicates,
    invalidRows,
    createdIds,
    updatedIds
  };
}

async function prepareImportPreview(file) {
  if (!file) {
    return;
  }

  if (isImportingShopeeXlsx) {
    ocrStatus.textContent = 'Import file masih terbuka. Selesaikan atau batalkan dulu.';
    return;
  }

  if (guardDatabaseMutation()) {
    return;
  }

  isImportingShopeeXlsx = true;
  pendingImportJob = null;
  showXlsxImportOverlay();
  updateXlsxImportOverlay({
    title: 'Membaca File',
    message: 'File dibaca dulu untuk preview. Database belum berubah.',
    progress: 8,
    summary: file.name || 'File'
  });

  try {
    const fileName = String(file.name || '').toLowerCase();
    let importJob;

    if (fileName.endsWith('.json') || file.type === 'application/json') {
      const importedRecords = JSON.parse(await file.text());

      if (!Array.isArray(importedRecords)) {
        throw new Error('Format JSON harus berupa daftar data customer.');
      }

      updateXlsxImportOverlay({
        kicker: 'Preview JSON',
        title: 'Membandingkan Data',
        message: 'Mengambil data web terbaru untuk mengecek data baru dan update.',
        progress: 32,
        summary: `${importedRecords.length} Data Terbaca`
      });
      const baseRecords = normalizeRecordList(await fetchApiRecords({ timeoutMs: xlsxApiTimeoutMs }));
      importJob = buildJsonImportPlan(importedRecords, baseRecords, file);
    } else if (
      fileName.endsWith('.xlsx')
      || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      if (!window.XLSX) {
        throw new Error('Reader XLSX belum tersedia. Cek koneksi CDN SheetJS.');
      }

      await syncCustomerMarketingSettings();
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
      updateXlsxImportOverlay({
        kicker: 'Preview XLSX Shopee',
        title: 'Membandingkan Data',
        message: 'Mengambil data web terbaru untuk mengecek order baru dan update.',
        progress: 32,
        summary: `${rows.length} Baris Terbaca`
      });
      const baseRecords = normalizeRecordList(await fetchApiRecords({ timeoutMs: xlsxApiTimeoutMs }));
      importJob = buildShopeeImportPlan(rows, baseRecords, file);
    } else {
      throw new Error('Format file belum didukung. Gunakan JSON atau XLSX Shopee.');
    }

    pendingImportJob = importJob;
    const summaryText = getImportSummaryText(importJob);
    renderImportPreview(importJob);
    updateXlsxImportOverlay({
      kicker: importJob.kicker,
      title: 'Preview Siap',
      message: 'Cek ringkasan dan contoh data. Klik Upload kalau sudah sesuai.',
      progress: 100,
      summary: `${importJob.fileName} - ${summaryText}`,
      mode: 'preview',
      canConfirm: true
    });
    ocrStatus.textContent = `Preview siap. ${summaryText}`;
  } catch (error) {
    pendingImportJob = null;
    isImportingShopeeXlsx = false;
    const errorMessage = getFriendlyErrorMessage(error);
    ocrStatus.textContent = `Import file gagal: ${errorMessage}`;
    setSyncStatus('Gagal Baca File', 'warning');
    syncStatus.title = errorMessage;
    updateXlsxImportOverlay({
      title: 'File Tidak Bisa Dibaca',
      message: 'Periksa format file, lalu coba upload lagi.',
      progress: 100,
      summary: errorMessage,
      mode: 'error',
      canClose: true
    });
    if (importDataFileInput) {
      importDataFileInput.value = '';
    }
  }
}

async function executePendingImportJob() {
  const job = pendingImportJob;

  if (!job) {
    return;
  }

  importPreviewConfirmBtn.disabled = true;
  importPreviewCancelBtn.disabled = true;
  beginRecordsMutation();
  setDatabaseLock(true);
  updateXlsxImportOverlay({
    kicker: job.type === 'xlsx' ? 'Upload XLSX Shopee' : 'Upload JSON',
    title: 'Mengirim Ke Database',
    message: 'Data sedang dikirim ke Cloudflare D1. Jangan tutup halaman dulu.',
    progress: job.uploadRecords.length ? 28 : 90,
    summary: `0/${job.uploadRecords.length} Data Dikirim`
  });

  try {
    if (job.uploadRecords.length) {
      try {
        await pushRecordsToBulkImportInChunks(job.uploadRecords, (sent, total) => {
          updateXlsxImportOverlay({
            kicker: job.type === 'xlsx' ? 'Upload XLSX Shopee' : 'Upload JSON',
            title: 'Mengirim Ke Database',
            message: 'Data dikirim bertahap agar stabil untuk file besar.',
            progress: 28 + ((sent / total) * 60),
            summary: `${sent}/${total} Data Dikirim`
          });
        });
      } catch (error) {
        if (error.status !== 404 && error.status !== 405) {
          throw error;
        }

        await pushRecordsToApiInBatches(job.uploadRecords, (sent, total) => {
          updateXlsxImportOverlay({
            kicker: job.type === 'xlsx' ? 'Upload XLSX Shopee' : 'Upload JSON',
            title: 'Mengirim Ke Database',
            message: 'Mode kompatibilitas aktif. Data tetap dikirim bertahap.',
            progress: 28 + ((sent / total) * 60),
            summary: `${sent}/${total} Data Dikirim`
          });
        }, { timeoutMs: xlsxApiTimeoutMs });
      }
    }

    const importSummary = getImportSummaryText(job);
    updateXlsxImportOverlay({
      title: 'Final Sync',
      message: 'Memastikan tampilan memakai data terakhir dari database.',
      progress: 94,
      summary: importSummary
    });
    records = sortRecords(job.stagedRecords);
    registerProductsFromRecords(records);
    renderStockAccountOptions();
    saveRecords();
    renderRecords();
    let finalSyncMessage = '';

    try {
      await replaceRecordsFromApi({ timeoutMs: xlsxApiTimeoutMs });
    } catch (finalSyncError) {
      finalSyncMessage = ' Final sync dilewati karena koneksi lambat; upload tetap selesai.';
      syncStatus.title = finalSyncError.message;
    }

    ocrStatus.textContent = `Upload file selesai. ${importSummary}${finalSyncMessage}`;
    setSyncStatus(`Upload Selesai (${records.length})`, finalSyncMessage ? 'warning' : 'success');
    syncStatus.title = finalSyncMessage || 'Import selesai. Database sudah memakai data terbaru.';
    updateXlsxImportOverlay({
      title: 'Upload Selesai',
      message: finalSyncMessage || 'Database sudah bisa diedit lagi.',
      progress: 100,
      summary: `${importSummary}${finalSyncMessage}`,
      mode: 'success'
    });
    xlsxImportHideTimerId = window.setTimeout(hideXlsxImportOverlay, 1100);
  } catch (error) {
    const errorMessage = getFriendlyErrorMessage(error);
    ocrStatus.textContent = `Upload file gagal: ${errorMessage}`;
    setSyncStatus('Gagal Upload File', 'warning');
    syncStatus.title = errorMessage;
    updateXlsxImportOverlay({
      title: 'Upload Gagal',
      message: 'Data belum selesai dikirim. Tutup pesan ini lalu coba lagi.',
      progress: 100,
      summary: errorMessage,
      mode: 'error',
      canClose: true
    });
  } finally {
    pendingImportJob = null;
    isImportingShopeeXlsx = false;
    endRecordsMutation();
    setDatabaseLock(false);
    if (importPreviewConfirmBtn) {
      importPreviewConfirmBtn.disabled = false;
    }
    if (importPreviewCancelBtn) {
      importPreviewCancelBtn.disabled = false;
    }
    if (importDataFileInput) {
      importDataFileInput.value = '';
    }
  }
}

function cancelImportPreview() {
  pendingImportJob = null;
  isImportingShopeeXlsx = false;
  hideXlsxImportOverlay();
  ocrStatus.textContent = 'Upload file dibatalkan. Database belum berubah.';
  if (importDataFileInput) {
    importDataFileInput.value = '';
  }
}

function importShopeeXlsx(file) {
  prepareImportPreview(file);
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
  prepareImportPreview(file);
}

function toggleExportMenu(forceOpen) {
  if (!exportMenuBtn || !exportMenuOptions) {
    return;
  }

  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : exportMenuOptions.hidden;
  exportMenuOptions.hidden = !shouldOpen;
  exportMenuBtn.setAttribute('aria-expanded', String(shouldOpen));
}

function closeExportMenu() {
  toggleExportMenu(false);
}

function handleImportDataFile(file) {
  if (!file) {
    return;
  }

  const fileName = String(file.name || '').toLowerCase();

  if (fileName.endsWith('.json') || file.type === 'application/json') {
    importJson(file);
    return;
  }

  if (
    fileName.endsWith('.xlsx')
    || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    importShopeeXlsx(file);
    return;
  }

  ocrStatus.textContent = 'Format file belum didukung. Gunakan JSON atau XLSX Shopee.';
  setSyncStatus('Format file salah', 'warning');
  syncStatus.title = file.name || 'File tidak dikenali';
  importDataFileInput.value = '';
}

form.addEventListener('submit', submitRecord);
resetFormBtn.addEventListener('click', () => {
  resetForm();
  setCustomerWorkspaceMode('input');
});
clearBtn.addEventListener('click', resetForm);
screenshotInput.addEventListener('change', (event) => {
  readScreenshot(event.target.files[0]);
});
lookupScreenshotInput.addEventListener('change', (event) => {
  readLookupScreenshot(event.target.files[0]);
});
emailLookupInput.addEventListener('input', renderRecords);
clearLookupBtn.addEventListener('click', clearLookup);
productNameInput.addEventListener('input', () => {
  updateActivationFieldMode();
});
productNameInput.addEventListener('change', () => {
  updateActivationFieldMode();
  addRegisteredProduct(productNameInput.value);
});
incomeAmountInput?.addEventListener('blur', (event) => {
  const amount = parseCurrencyAmount(event.target.value);
  event.target.value = amount ? formatCurrencyAmount(amount) : '';
});
document.addEventListener('focusin', (event) => {
  const field = event.target;

  if (isStockAccountInput(field)) {
    renderStockAccountMenu(field, true);
  }
});
document.addEventListener('input', (event) => {
  const field = event.target;

  if (isStockAccountInput(field)) {
    renderStockAccountMenu(field, true);
  }
});
document.addEventListener('focusout', (event) => {
  const field = event.target;

  if (!isStockAccountInput(field)) {
    return;
  }

  setTimeout(() => {
    setStockAccountFieldValue(field, getStockAccountSaveValue(field.value));
    closeStockAccountMenus();
  }, 80);
});
document.addEventListener('pointerdown', (event) => {
  const option = event.target.closest('[data-stock-account-option]');

  if (option) {
    const field = option.closest('.stock-account-field')?.querySelector('#stockAccount, [data-edit-field="stockAccount"]');

    if (field) {
      event.preventDefault();
      selectStockAccountOption(field, option.dataset.stockAccountOption || '');
    }

    return;
  }

  if (!event.target.closest('.stock-account-field')) {
    closeStockAccountMenus();
  }
});
editRegisteredProductsBtn?.addEventListener('click', openRegisteredProductEditor);
saveRegisteredProductsBtn?.addEventListener('click', saveRegisteredProductEditor);
cancelRegisteredProductsBtn?.addEventListener('click', closeRegisteredProductEditor);
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
monthFilter?.addEventListener('change', renderRecords);
statusFilter.addEventListener('change', renderRecords);
sortBySelect.addEventListener('change', renderRecords);
sortDirectionSelect.addEventListener('change', renderRecords);
exportMenuBtn?.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleExportMenu();
});
exportCsvBtn.addEventListener('click', () => {
  closeExportMenu();
  exportCsv();
});
exportJsonBtn.addEventListener('click', () => {
  closeExportMenu();
  exportJson();
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.database-action-menu')) {
    closeExportMenu();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeExportMenu();
  }
});
syncRecordsBtn?.addEventListener('click', () => {
  if (!guardDatabaseMutation()) {
    syncRecordsWithApi();
  }
});
importDataFileInput.addEventListener('change', (event) => {
  handleImportDataFile(event.target.files[0]);
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
importPreviewConfirmBtn?.addEventListener('click', executePendingImportJob);
importPreviewCancelBtn?.addEventListener('click', cancelImportPreview);
xlsxImportCloseBtn.addEventListener('click', hideXlsxImportOverlay);
window.addEventListener('focus', autoRefreshRecords);
document.addEventListener('visibilitychange', autoRefreshRecords);

recordsList.addEventListener('change', (event) => {
  if (guardDatabaseMutation()) {
    event.preventDefault();
    return;
  }

  const inlineField = event.target.closest('[data-edit-field]');

  if (inlineField) {
    const editor = inlineField.closest('[data-inline-editor]');

    if (editor && inlineField.dataset.editField === 'orderSource') {
      updateInlineOrderReferenceField(editor, inlineField.value);
    }

    if (editor && inlineField.dataset.editField === 'productName') {
      updateInlineActivationFieldMode(editor);
      addRegisteredProduct(inlineField.value);
    }

    if (editor && (inlineField.dataset.editField === 'startDate' || inlineField.dataset.editField === 'durationDays')) {
      updateInlineEditExpiry(editor);
    }

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

recordsList.addEventListener('input', (event) => {
  const inlineField = event.target.closest('[data-edit-field]');

  if (!inlineField || (inlineField.dataset.editField !== 'durationDays' && inlineField.dataset.editField !== 'productName')) {
    return;
  }

  const editor = inlineField.closest('[data-inline-editor]');

  if (editor && inlineField.dataset.editField === 'durationDays') {
    updateInlineEditExpiry(editor);
  }

  if (editor && inlineField.dataset.editField === 'productName') {
    updateInlineActivationFieldMode(editor);
  }
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
    editingRecordId = editingRecordId === record.id ? '' : record.id;
    closeStatusMenus();
    renderRecords();

    if (editingRecordId) {
      window.requestAnimationFrame(() => {
        const editedCard = [...recordsList.querySelectorAll('.record-card')].find((card) => card.dataset.id === editingRecordId);
        const firstField = editedCard?.querySelector('[data-inline-editor] input, [data-inline-editor] select, [data-inline-editor] textarea');

        firstField?.focus();
        editedCard?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }

    return;
  }

  if (action === 'cancel-inline-edit') {
    editingRecordId = '';
    renderRecords();
    return;
  }

  if (action === 'save-inline-edit') {
    await saveInlineEdit(recordCard, record);
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
  { element: totalIncomeAmount?.closest('.stat-card'), mode: 'all' },
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
updateActivationFieldMode('');
registerProductsFromRecords(records);
renderStockAccountOptions();
renderRecords();
setCustomerWorkspaceMode('input');
setSyncStatus(localStorageWarning || (records.length ? 'Cache Lokal' : 'Menghubungkan Web'), localStorageWarning || records.length ? 'warning' : '');
syncCustomerMarketingSettings();
syncStockAccountOptions();
syncRecordsWithApi();
startAutoRefresh();
