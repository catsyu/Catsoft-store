const form = document.getElementById('refundForm');
const resetBtn = document.getElementById('resetBtn');
const screenshotInput = document.getElementById('screenshotInput');
const screenshotPreviewWrap = document.getElementById('screenshotPreviewWrap');
const screenshotPreview = document.getElementById('screenshotPreview');
const ocrStatus = document.getElementById('ocrStatus');
const ocrProgress = document.getElementById('ocrProgress');
const ocrProgressBar = document.getElementById('ocrProgressBar');
const incomeAmountInput = document.getElementById('incomeAmount');
const productNameInput = document.getElementById('productName');
const packagePresetSelect = document.getElementById('packagePreset');
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
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(date) {
  if (!date) {
    return '-';
  }

  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function parseCurrency(value) {
  const digits = String(value || '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

function packageLabel(durationDays) {
  if (durationDays === 30) {
    return '1 bulan (30 hari)';
  }

  if (durationDays === 90) {
    return '3 bulan (90 hari)';
  }

  if (durationDays === 180) {
    return '6 bulan (180 hari)';
  }

  if (durationDays === 365) {
    return '1 tahun (365 hari)';
  }

  return `${durationDays} hari`;
}

function getCalculation() {
  const income = parseCurrency(incomeAmountInput.value);
  const durationDays = Number(durationDaysInput.value);
  const startDate = fromDateInput(startDateInput.value);
  const stopDate = fromDateInput(stopDateInput.value);
  const refundCut = Number(refundCutInput.value);

  if (!income || !durationDays || !startDate || !stopDate || !Number.isFinite(refundCut)) {
    return null;
  }

  const percentageAfterCut = Math.max(0, Math.min(100, 100 - refundCut));
  const refundBase = Math.round(income * (percentageAfterCut / 100));
  const usedDays = diffDays(startDate, stopDate);
  const remainingDays = Math.max(0, durationDays - usedDays);
  const expiryDate = addDays(startDate, durationDays);
  const refundAmount = Math.round(refundBase * (remainingDays / durationDays));

  return {
    income,
    durationDays,
    startDate,
    stopDate,
    refundCut,
    percentageAfterCut,
    refundBase,
    usedDays,
    remainingDays,
    expiryDate,
    refundAmount,
    productName: productNameInput.value.trim() || '-',
    orderNumber: orderNumberInput.value.trim() || '-'
  };
}

function buildResultText(calculation) {
  if (!calculation) {
    return 'Isi data order untuk melihat rincian refund.';
  }

  return [
    'Data:',
    '',
    `* Penghasilan akhir: ${formatCurrency(calculation.income)}`,
    `* Produk: ${calculation.productName}`,
    `* No. pesanan: ${calculation.orderNumber}`,
    `* Paket: ${packageLabel(calculation.durationDays)}`,
    `* Mulai: ${formatDate(calculation.startDate)}`,
    `* Berhenti: ${formatDate(calculation.stopDate)}`,
    `* Potongan refund: ${calculation.refundCut}%`,
    '',
    `1. Setelah potongan ${calculation.refundCut}%`,
    '',
    `${formatCurrency(calculation.income)} x ${calculation.percentageAfterCut}% = ${formatCurrency(calculation.refundBase)}`,
    '',
    '2. Pemakaian',
    '',
    `${formatDate(calculation.startDate)} -> ${formatDate(calculation.stopDate)} = ${calculation.usedDays} hari`,
    '',
    'Sisa masa aktif:',
    `${calculation.durationDays} - ${calculation.usedDays} = ${calculation.remainingDays} hari`,
    '',
    `Tanggal habis: ${formatDate(calculation.expiryDate)}`,
    '',
    '3. Refund',
    '',
    `${formatCurrency(calculation.refundBase)} x ${calculation.remainingDays}/${calculation.durationDays}`,
    `= ${formatCurrency(calculation.refundAmount)}`
  ].join('\n');
}

function renderCalculation() {
  const calculation = getCalculation();

  if (!calculation) {
    refundValue.textContent = 'Rp0';
    remainingValue.textContent = '0 hari';
    expiryValue.textContent = '-';
    resultText.textContent = buildResultText(null);
    return;
  }

  refundValue.textContent = formatCurrency(calculation.refundAmount);
  remainingValue.textContent = `${calculation.remainingDays} hari`;
  expiryValue.textContent = formatDate(calculation.expiryDate);
  resultText.textContent = buildResultText(calculation);
}

function syncPackagePreset() {
  if (packagePresetSelect.value === 'custom') {
    durationDaysInput.focus();
    return;
  }

  durationDaysInput.value = packagePresetSelect.value;
  renderCalculation();
}

function syncDurationPreset() {
  const matchingOption = Array.from(packagePresetSelect.options).find((option) => option.value === durationDaysInput.value);
  packagePresetSelect.value = matchingOption ? matchingOption.value : 'custom';
}

function setTodayStopDate() {
  stopDateInput.value = toDateInputValue(new Date());
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
  const pattern = new RegExp(`${labelPattern}[\\s\\S]{0,140}?Rp\\s*([0-9][0-9.\\s]*)`, 'i');
  const match = text.match(pattern);

  return match ? parseCurrency(match[1]) : 0;
}

function findFirstAmount(text) {
  const match = text.match(/Rp\s*([0-9][0-9.\s]*)/i);
  return match ? parseCurrency(match[1]) : 0;
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
    const hasProductHint = /canva|chatgpt|capcut|office|template|after effects|like|view|reels|komen/i.test(line);
    const hasLabelNoise = /penghasilan|pembayaran|pesanan|waktu|metode|hubungi|salin|subtotal|ongkos/i.test(line);
    return hasProductHint && !hasLabelNoise && line.length > 8;
  });

  return productLine || '';
}

function findOrderNumber(text) {
  const match = text.match(/No\.?\s*Pesanan\s*([A-Z0-9]+)/i);
  return match ? match[1].trim() : '';
}

function applyOcrText(rawText) {
  const normalizedText = rawText
    .replace(/[|]/g, 'I')
    .replace(/[“”]/g, '"')
    .replace(/\r/g, '\n');

  const compactText = normalizedText.replace(/[ \t]+/g, ' ');
  const income = findAmountAfterLabel(compactText, 'Penghasilan\\s*Akhir') ||
    findAmountAfterLabel(compactText, 'Lihat\\s+Rincian\\s+Penghasilan') ||
    findFirstAmount(compactText);
  const duration = getDurationFromPackageText(compactText);
  const startDate = findDateAfterLabel(compactText, 'Waktu pemesanan') ||
    findDateAfterLabel(compactText, 'Waktu pembayaran') ||
    findDateAfterLabel(compactText, 'Waktu pengiriman') ||
    parseIndonesianDate(compactText);
  const productName = findProductName(normalizedText);
  const orderNumber = findOrderNumber(compactText);

  if (income) {
    incomeAmountInput.value = formatCurrency(income);
  }

  if (duration) {
    durationDaysInput.value = duration;
    syncDurationPreset();
  }

  if (startDate) {
    startDateInput.value = toDateInputValue(startDate);
  }

  if (productName) {
    productNameInput.value = productName;
  }

  if (orderNumber) {
    orderNumberInput.value = orderNumber;
  }

  renderCalculation();
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

    applyOcrText(result.data.text || '');
    ocrStatus.textContent = 'Screenshot berhasil dibaca. Cek kembali field sebelum copy hasil.';
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
  refundCutInput.value = '30';
  setTodayStopDate();
  startDateInput.value = '';
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
  productNameInput,
  durationDaysInput,
  startDateInput,
  stopDateInput,
  refundCutInput,
  orderNumberInput
].forEach((input) => {
  input.addEventListener('input', () => {
    if (input === durationDaysInput) {
      syncDurationPreset();
    }

    renderCalculation();
  });

  input.addEventListener('change', () => {
    if (input === durationDaysInput) {
      syncDurationPreset();
    }

    renderCalculation();
  });
});

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

setTodayStopDate();
renderCalculation();
