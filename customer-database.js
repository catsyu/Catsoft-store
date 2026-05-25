const storageKey = 'catsoftCustomerDatabaseRecords';

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
const expireTodayCount = document.getElementById('expireTodayCount');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const dateFilter = document.getElementById('dateFilter');
const statusFilter = document.getElementById('statusFilter');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importJsonBtn = document.getElementById('importJsonBtn');
const importJsonInput = document.getElementById('importJsonInput');
const recordsList = document.getElementById('recordsList');

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
  problem: 'Bermasalah'
};

const statusOptions = ['active', 'expired', 'removed', 'refund', 'problem'];

const orderSourceLabels = {
  shopee: 'Shopee',
  whatsapp: 'WhatsApp'
};

let records = loadRecords();
let activeOrderSource = 'shopee';

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
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(storageKey, JSON.stringify(records));
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

function getFormRecord() {
  updateStatusByDate();
  syncOrderReferenceInput();

  const orderSource = getSelectedOrderSource();
  const orderReference = orderReferenceInput.value.trim();
  const productName = productNameInput.value.trim();

  return {
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
    createdAt: recordIdInput.value ? (records.find((record) => record.id === recordIdInput.value) || {}).createdAt || new Date().toISOString() : new Date().toISOString()
  };
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
  subscriptionStatusSelect.value = record.status || 'active';
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

function submitRecord(event) {
  event.preventDefault();

  if (!productNameInput.value.trim() || !startDateInput.value || !expiryDateInput.value) {
    ocrStatus.textContent = 'Lengkapi produk, tanggal mulai, dan tanggal expire.';
    return;
  }

  const nextRecord = getFormRecord();
  const existingIndex = records.findIndex((record) => record.id === nextRecord.id ||
    (nextRecord.orderNumber && record.orderNumber === nextRecord.orderNumber) ||
    (nextRecord.whatsappNumber && record.whatsappNumber === nextRecord.whatsappNumber && record.productName === nextRecord.productName));

  if (existingIndex >= 0) {
    nextRecord.id = records[existingIndex].id;
    nextRecord.createdAt = records[existingIndex].createdAt || nextRecord.createdAt;
    records[existingIndex] = nextRecord;
  } else {
    records.unshift(nextRecord);
  }

  saveRecords();
  renderRecords();
  resetForm();
  ocrStatus.textContent = 'Data customer berhasil disimpan.';
}

function getFilteredRecords() {
  const term = normalizeSearch(searchInput.value);
  const statusValue = statusFilter.value;
  const dateValue = dateFilter.value;
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
    const matchesStatus = statusValue === 'all' || record.status === statusValue;
    let matchesDate = true;

    // Jika user memilih tanggal, filter yang expiryDate-nya sama persis
    if (dateValue) {
      matchesDate = isSameDate(expiryDate, fromDateInput(dateValue));
    }

    return matchesSearch && matchesStatus && matchesDate;
  });
}

function renderStats() {
  const today = todayDate();
  totalCount.textContent = records.length;
  activeCount.textContent = records.filter((record) => record.status === 'active').length;
  expireTodayCount.textContent = records.filter((record) => isSameDate(fromDateInput(record.expiryDate), today)).length;
}

function applyStatsFilter(mode) {
  if (mode === 'all') {
    statusFilter.value = 'all';
    dateFilter.value = '';
  } else if (mode === 'active') {
    statusFilter.value = 'active';
    dateFilter.value = '';
  } else if (mode === 'today') {
    statusFilter.value = 'all';
    dateFilter.value = toDateInputValue(todayDate());
  }

  renderRecords();
}

function renderRecords() {
  renderStats();

  const filteredRecords = getFilteredRecords();

  if (!filteredRecords.length) {
    recordsList.innerHTML = '<p class="empty-state">Tidak ada data yang cocok.</p>';
    return;
  }

  recordsList.innerHTML = filteredRecords.map((record) => {
    const status = record.status || 'active';
    const orderSource = getRecordOrderSource(record);
    const orderReference = getOrderReferenceValue(record);
    const orderReferenceTitle = orderSource === 'shopee' ? 'No. pesanan' : 'WA';
    const whatsapp = normalizeWhatsapp(record.whatsappNumber);
    const whatsappLink = whatsapp ? `https://wa.me/${whatsapp}` : '';

    return `
      <article class="record-card status-${escapeHtml(status)}" data-id="${escapeHtml(record.id)}">
        <div class="record-top">
          <div class="record-title">
            <h3>${escapeHtml(record.productName || '-')}</h3>
            <p>${escapeHtml(record.customerName || record.activatedEmail || record.whatsappNumber || 'Customer')}</p>
          </div>
          <span class="status-badge ${escapeHtml(status)}">${escapeHtml(statusLabels[status] || status)}</span>
        </div>
        <div class="record-meta">
          <div><span>Expire</span>${escapeHtml(formatDate(record.expiryDate))}</div>
          <div><span>Mulai</span>${escapeHtml(formatDate(record.startDate))}</div>
          <div><span>Durasi</span>${escapeHtml(getDurationLabel(record.durationDays))}</div>
          <div><span>Email</span>${escapeHtml(record.activatedEmail || '-')}</div>
          <div><span>${escapeHtml(orderReferenceTitle)}</span>${escapeHtml(orderReference || '-')}</div>
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

function hasProductHint(line) {
  return /adobe|canva|chatgpt|chat\s*gpt|capcut|cap\s*cut|office|microsoft|template|after effects|aftereffects|instagram|like|view|reels|komen|pro|premium|garansi/i.test(line);
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

  if (!text) {
    return '';
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
  const match = String(text || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : '';
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
  const email = findEmail(compactText);
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
    'Catatan'
  ];
  const rows = records.map((record) => [
    record.customerName,
    record.activatedEmail,
    orderSourceLabels[getRecordOrderSource(record)] || '',
    record.whatsappNumber,
    record.orderNumber,
    record.productName,
    record.durationDays,
    record.startDate,
    record.expiryDate,
    statusLabels[record.status] || record.status,
    record.notes
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  downloadFile(`catsoft-customer-database-${toDateInputValue(new Date())}.csv`, csv, 'text/csv;charset=utf-8');
}

function exportJson() {
  downloadFile(`catsoft-customer-database-${toDateInputValue(new Date())}.json`, JSON.stringify(records, null, 2), 'application/json;charset=utf-8');
}

function importJson(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const importedRecords = JSON.parse(reader.result);

      if (!Array.isArray(importedRecords)) {
        throw new Error('Invalid JSON');
      }

      importedRecords.forEach((record) => {
        const normalizedRecord = {
          ...record,
          id: record.id || createId(),
          orderSource: record.orderSource || getRecordOrderSource(record),
          updatedAt: record.updatedAt || new Date().toISOString(),
          createdAt: record.createdAt || new Date().toISOString()
        };
        const existingIndex = records.findIndex((item) => item.id === normalizedRecord.id ||
          (normalizedRecord.orderNumber && item.orderNumber === normalizedRecord.orderNumber) ||
          (normalizedRecord.whatsappNumber && item.whatsappNumber === normalizedRecord.whatsappNumber && item.productName === normalizedRecord.productName));

        if (existingIndex >= 0) {
          records[existingIndex] = { ...records[existingIndex], ...normalizedRecord };
        } else {
          records.push(normalizedRecord);
        }
      });

      saveRecords();
      renderRecords();
      ocrStatus.textContent = 'Import JSON berhasil.';
    } catch (error) {
      ocrStatus.textContent = 'Import JSON gagal.';
    } finally {
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
exportCsvBtn.addEventListener('click', exportCsv);
exportJsonBtn.addEventListener('click', exportJson);
importJsonBtn.addEventListener('click', () => importJsonInput.click());
importJsonInput.addEventListener('change', (event) => {
  importJson(event.target.files[0]);
});

recordsList.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-action]');

  if (!actionButton) {
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

    record.status = nextStatus;
    record.updatedAt = new Date().toISOString();
    saveRecords();
    renderRecords();
    return;
  }

  if (action === 'edit') {
    fillForm(record);
    return;
  }

  if (action === 'delete' && window.confirm('Hapus data customer ini?')) {
    records = records.filter((item) => item.id !== record.id);
    saveRecords();
    renderRecords();
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
  { element: expireTodayCount.closest('.stat-card'), mode: 'today' }
];

statCards.forEach((card) => {
  card.element?.addEventListener('click', () => applyStatsFilter(card.mode));
});

updateOrderReferenceField('shopee', '');
syncPackagePreset();
renderRecords();
