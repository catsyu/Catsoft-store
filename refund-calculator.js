if (!window.CATSOFT_ADMIN_AUTHORIZED) {
  throw new Error('Catsoft admin authorization required.');
}

const form = document.getElementById('refundForm');
const resetBtn = document.getElementById('resetBtn');
const screenshotInput = document.getElementById('screenshotInput');
const screenshotPreviewWrap = document.getElementById('screenshotPreviewWrap');
const screenshotPreview = document.getElementById('screenshotPreview');
const ocrStatus = document.getElementById('ocrStatus');
const ocrProgress = document.getElementById('ocrProgress');
const ocrProgressBar = document.getElementById('ocrProgressBar');
const incomeAmountInput = document.getElementById('incomeAmount');
const paymentMethodSelect = document.getElementById('paymentMethod');
const productNameInput = document.getElementById('productName');
const packagePresetSelect = document.getElementById('packagePreset');
const durationDaysGroup = document.getElementById('durationDaysGroup');
const durationDaysInput = document.getElementById('durationDays');
const startDateInput = document.getElementById('startDate');
const stopDateInput = document.getElementById('stopDate');
const todayBtn = document.getElementById('todayBtn');
const refundCutInput = document.getElementById('refundCut');
const orderNumberInput = document.getElementById('orderNumber');
const copyBtn = document.getElementById('copyBtn');
const refundValue = document.getElementById('refundValue');
const remainingValue = document.getElementById('remainingValue');
const expiryValue = document.getElementById('expiryValue');
const resultText = document.getElementById('resultText');

const qrisMdrRate = 0.3;
const maxAutoDetectedIncome = 50000000;
const ocrCurrencyAmountPattern = '([0-9OoIl]{1,3}(?:(?:[.,]|[^\\S\\r\\n])[0-9OoIl]{3})+(?:[,.][0-9OoIl]{2})?|[0-9OoIl]+)';
const ocrStandaloneCurrencyPattern = '([0-9OoIl]{1,3}(?:(?:[.,]|[^\\S\\r\\n])[0-9OoIl]{3})+(?:[,.][0-9OoIl]{2})?)';

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

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function syncDateInputVisual(input) {
  if (!input) {
    return;
  }

  if (!input.dataset.emptyLabel) {
    input.dataset.emptyLabel = 'Pilih Tanggal';
  }

  input.classList.add('soft-date-input');
  input.classList.toggle('has-date-value', Boolean(input.value));
}

function setDateInputValue(input, value) {
  if (!input) {
    return;
  }

  input.value = value || '';
  syncDateInputVisual(input);
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

function diffDays(startDate, stopDate) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((stopDate - startDate) / dayMs));
}

function formatCurrency(value) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return `Rp${new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0
  }).format(safeValue)}`;
}

function formatPercent(value) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return `${new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2
  }).format(safeValue)}%`;
}

function formatDate(date) {
  if (!date) {
    return '-';
  }

  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatShortDate(date) {
  if (!date) {
    return '-';
  }

  return `${date.getDate()} ${monthNames[date.getMonth()]}`;
}

function parseCurrency(value) {
  const digits = String(value || '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

function parseOcrCurrency(value) {
  const groups = String(value || '')
    .replace(/[Oo]/g, '0')
    .replace(/[Il]/g, '1')
    .match(/\d+/g);

  if (!groups) {
    return 0;
  }

  if (groups.length > 1 && groups[groups.length - 1].length === 2) {
    groups.pop();
  }

  let amount = Number(groups.join(''));

  while (amount > maxAutoDetectedIncome && groups.length > 1) {
    groups.pop();
    amount = Number(groups.join(''));
  }

  return Number.isFinite(amount) ? amount : 0;
}

function packageLabel(durationDays) {
  if (durationDays === 30) {
    return '1 Bulan = 30 Hari';
  }

  if (durationDays === 90) {
    return '3 Bulan = 90 Hari';
  }

  if (durationDays === 180) {
    return '6 Bulan = 180 Hari';
  }

  if (durationDays === 365) {
    return '1 Tahun = 365 Hari';
  }

  return `${durationDays} Hari`;
}

function paymentMethodLabel(paymentMethod) {
  if (paymentMethod === 'qris' || paymentMethod === 'qris-gopay') {
    return `QRIS / bukti bayar bank (MDR ${formatPercent(qrisMdrRate)})`;
  }

  return 'Reguler / marketplace';
}

function getMdrRate(paymentMethod) {
  return paymentMethod === 'qris' || paymentMethod === 'qris-gopay' ? qrisMdrRate : 0;
}

function getCalculation() {
  const income = parseCurrency(incomeAmountInput.value);
  const paymentMethod = paymentMethodSelect.value;
  const durationDays = Number(durationDaysInput.value);
  const startDate = fromDateInput(startDateInput.value);
  const stopDate = fromDateInput(stopDateInput.value);
  const refundCut = Number(refundCutInput.value);

  if (!income || !durationDays || !startDate || !stopDate || !Number.isFinite(refundCut)) {
    return null;
  }

  const usedDays = diffDays(startDate, stopDate);
  const remainingDays = Math.max(0, durationDays - usedDays);
  const expiryDate = addDays(startDate, durationDays);
  const mdrRate = getMdrRate(paymentMethod);
  const mdrAmount = Math.round(income * mdrRate / 100);
  const incomeAfterMdr = Math.max(0, income - mdrAmount);
  const remainingSubscriptionValue = Math.round(incomeAfterMdr * remainingDays / durationDays);
  const operationalCutAmount = Math.round(remainingSubscriptionValue * refundCut / 100);
  const refundAmount = Math.max(0, remainingSubscriptionValue - operationalCutAmount);

  return {
    income,
    paymentMethod,
    mdrRate,
    mdrAmount,
    incomeAfterMdr,
    durationDays,
    startDate,
    stopDate,
    refundCut,
    remainingSubscriptionValue,
    operationalCutAmount,
    usedDays,
    remainingDays,
    expiryDate,
    refundAmount,
    productName: productNameInput.value.trim() || 'xxx',
    orderNumber: orderNumberInput.value.trim() || 'xxxx'
  };
}

function buildResultText(calculation) {
  if (!calculation) {
    return 'Lengkapi data order untuk melihat rincian refund.';
  }

  const lines = [
    `* Penghasilan akhir tercatat: ${formatCurrency(calculation.incomeAfterMdr)}`,
    `* Durasi langganan: ${packageLabel(calculation.durationDays)}`,
    `* Masa terpakai: ${calculation.usedDays} hari (${formatShortDate(calculation.startDate)} → ${formatShortDate(calculation.stopDate)})`,
    `* Sisa masa aktif: ${calculation.remainingDays} hari`,
    `* Nomor Pesanan : ${calculation.orderNumber}`,
    `* Produk : ${calculation.productName}`
  ];

  lines.push(
    '',
    'Nilai sisa langganan:',
    '',
    `= ${formatCurrency(calculation.incomeAfterMdr)} × ${calculation.remainingDays} ÷ ${calculation.durationDays}`,
    `= ${formatCurrency(calculation.remainingSubscriptionValue)}`,
    '',
    `Potongan administrasi & operasional ${formatPercent(calculation.refundCut)}:`,
    '',
    `= ${formatCurrency(calculation.remainingSubscriptionValue)} × ${formatPercent(calculation.refundCut)}`,
    `= ${formatCurrency(calculation.operationalCutAmount)}`,
    '',
    'Nominal refund:',
    '',
    `= ${formatCurrency(calculation.remainingSubscriptionValue)} − ${formatCurrency(calculation.operationalCutAmount)}`,
    `= ${formatCurrency(calculation.refundAmount)}`,
    '',
    `✅ Nominal refund: ${formatCurrency(calculation.refundAmount)}`
  );

  return lines.join('\n');
}

function renderCalculation() {
  const calculation = getCalculation();

  if (!calculation) {
    refundValue.textContent = 'Rp0';
    remainingValue.textContent = '0 Hari';
    expiryValue.textContent = '-';
    resultText.classList.add('is-empty');
    resultText.textContent = buildResultText(null);
    return;
  }

  resultText.classList.remove('is-empty');
  refundValue.textContent = formatCurrency(calculation.refundAmount);
  remainingValue.textContent = `${calculation.remainingDays} Hari`;
  expiryValue.textContent = formatDate(calculation.expiryDate);
  resultText.textContent = buildResultText(calculation);
}

function syncDurationVisibility() {
  durationDaysGroup.classList.toggle('is-hidden', packagePresetSelect.value !== 'custom');
}

function syncPackagePreset() {
  syncDurationVisibility();

  if (packagePresetSelect.value === 'custom') {
    durationDaysInput.focus();
    renderCalculation();
    return;
  }

  durationDaysInput.value = packagePresetSelect.value;
  renderCalculation();
}

function syncDurationPreset() {
  const matchingOption = Array.from(packagePresetSelect.options).find((option) => option.value === durationDaysInput.value);
  packagePresetSelect.value = matchingOption ? matchingOption.value : 'custom';
  syncDurationVisibility();
}

function setTodayStopDate() {
  setDateInputValue(stopDateInput, toDateInputValue(new Date()));
  renderCalculation();
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

function findDateAfterLabel(text, label) {
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(label.toLowerCase());

  if (index === -1) {
    return null;
  }

  return parseIndonesianDate(text.slice(index, index + 180));
}

function findAmountAfterLabel(text, labelPattern) {
  const pattern = new RegExp(`${labelPattern}[\\s\\S]{0,140}?Rp\\s*${ocrCurrencyAmountPattern}`, 'i');
  const match = text.match(pattern);

  return match ? parseOcrCurrency(match[1]) : 0;
}

function findFirstAmount(text) {
  const pattern = new RegExp(`Rp\\s*${ocrCurrencyAmountPattern}`, 'i');
  const match = text.match(pattern);
  return match ? parseOcrCurrency(match[1]) : 0;
}

function findFirstStandaloneAmount(text) {
  const pattern = new RegExp(ocrStandaloneCurrencyPattern, 'i');
  const match = text.match(pattern);

  return match ? parseOcrCurrency(match[1]) : 0;
}

function getDurationFromPackageText(text) {
  const match = text.match(/\b(\d{1,2})\s*(Bulan|Tahun|Hari|Minggu)\b/i);

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

function findProductName(text) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const productLine = lines.find((line) => {
    const hasProductHint = /adobe|canva|chatgpt|capcut|office|template|after effects|like|view|reels|komen/i.test(line);
    const hasLabelNoise = /penghasilan|pembayaran|pesanan|waktu|metode|hubungi|salin|subtotal|ongkos/i.test(line);
    return hasProductHint && !hasLabelNoise && line.length > 8;
  });

  return productLine || '';
}

function findOrderNumber(text) {
  const match = text.match(/(?:No\.?\s*Pesanan|Transaction\s*ID|Reference\s*Number)\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{3,})/i);
  return match ? match[1].trim() : '';
}

function detectQrisPayment(text) {
  const compactText = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');
  const bankReceiptSignals = [
    /\bqris\b/,
    /pembayaran qris berhasil/,
    /pembayaran berhasil/,
    /merchant pan/,
    /customer pan/,
    /terminal id/,
    /\brrn\b/,
    /\bref\b/,
    /pengakuisisi/,
    /lokasi merchant/,
    /pembayaran ke/,
    /\bbca\b/,
    /\bbri\b/,
    /\bbni\b/,
    /\bmandiri\b/,
    /\bcimb\b/,
    /\bpermata\b/,
    /\bseabank\b/,
    /\bgopay\b|\bgo pay\b/,
    /\bovo\b/,
    /\bdana\b/,
    /shopeepay/
  ];
  const signalCount = bankReceiptSignals.filter((pattern) => pattern.test(compactText)).length;

  return /\bqris\b/.test(compactText) || signalCount >= 2;
}

function applyOcrText(rawText) {
  const normalizedText = rawText
    .replace(/[|]/g, 'I')
    .replace(/[“”]/g, '"')
    .replace(/\r/g, '\n');

  const compactText = normalizedText.replace(/[ \t]+/g, ' ');
  const isQrisPayment = detectQrisPayment(compactText);
  const income = findAmountAfterLabel(compactText, 'Penghasilan\\s*Akhir') ||
    findAmountAfterLabel(compactText, 'Lihat\\s+Rincian\\s+Penghasilan') ||
    findFirstAmount(compactText) ||
    (isQrisPayment ? findFirstStandaloneAmount(compactText) : 0);
  const duration = getDurationFromPackageText(compactText);
  const startDate = findDateAfterLabel(compactText, 'Waktu pemesanan') ||
    findDateAfterLabel(compactText, 'Waktu pembayaran') ||
    findDateAfterLabel(compactText, 'Waktu pengiriman') ||
    parseIndonesianDate(compactText);
  const productName = findProductName(normalizedText);
  const orderNumber = findOrderNumber(compactText);

  paymentMethodSelect.value = isQrisPayment ? 'qris' : 'regular';

  if (income) {
    incomeAmountInput.value = formatCurrency(income);
  }

  if (duration) {
    durationDaysInput.value = duration;
    syncDurationPreset();
  }

  if (startDate) {
    setDateInputValue(startDateInput, toDateInputValue(startDate));
  }

  if (productName) {
    productNameInput.value = productName;
  }

  if (orderNumber) {
    orderNumberInput.value = orderNumber;
  }

  renderCalculation();

  return {
    isQrisPayment
  };
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

    const ocrResult = applyOcrText(result.data.text || '');
    ocrStatus.textContent = ocrResult.isQrisPayment
      ? 'Screenshot berhasil dibaca. QRIS atau bukti bayar bank terdeteksi, MDR 0,3% diterapkan.'
      : 'Screenshot berhasil dibaca. Cek kembali field sebelum copy hasil.';
    ocrProgressBar.style.width = '100%';
  } catch (error) {
    ocrStatus.textContent = 'OCR gagal membaca screenshot. Isi atau koreksi data secara manual.';
  } finally {
    window.setTimeout(() => {
      ocrProgress.hidden = true;
    }, 700);
  }
}

function resetForm() {
  form.reset();
  durationDaysInput.value = '30';
  packagePresetSelect.value = '30';
  syncDurationVisibility();
  paymentMethodSelect.value = 'regular';
  refundCutInput.value = '30';
  setTodayStopDate();
  setDateInputValue(startDateInput, '');
  screenshotInput.value = '';
  screenshotPreviewWrap.classList.add('is-hidden');
  screenshotPreview.removeAttribute('src');
  ocrStatus.textContent = 'Belum ada screenshot dipilih.';
  renderCalculation();
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Copy failed');
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  renderCalculation();
});

[
  incomeAmountInput,
  paymentMethodSelect,
  productNameInput,
  durationDaysInput,
  startDateInput,
  stopDateInput,
  refundCutInput,
  orderNumberInput
].forEach((input) => {
  input.addEventListener('input', () => {
    if (input.type === 'date') {
      syncDateInputVisual(input);
    }

    if (input === durationDaysInput) {
      syncDurationPreset();
    }

    renderCalculation();
  });

  input.addEventListener('change', () => {
    if (input.type === 'date') {
      syncDateInputVisual(input);
    }

    if (input === durationDaysInput) {
      syncDurationPreset();
    }

    renderCalculation();
  });
});

syncDateInputVisual(startDateInput);
syncDateInputVisual(stopDateInput);
packagePresetSelect.addEventListener('change', syncPackagePreset);
todayBtn.addEventListener('click', setTodayStopDate);
resetBtn.addEventListener('click', resetForm);
screenshotInput.addEventListener('change', (event) => {
  readScreenshot(event.target.files[0]);
});

copyBtn.addEventListener('click', async () => {
  renderCalculation();

  try {
    await copyText(resultText.textContent);
    copyBtn.textContent = 'Tersalin';
    window.setTimeout(() => {
      copyBtn.textContent = 'Copy Hasil';
    }, 1400);
  } catch (error) {
    copyBtn.textContent = 'Gagal Copy';
    window.setTimeout(() => {
      copyBtn.textContent = 'Copy Hasil';
    }, 1400);
  }
});

syncDurationVisibility();
setTodayStopDate();
renderCalculation();
