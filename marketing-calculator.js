const marketingSettingsKey = 'catsoftMarketingCalculatorSettings';
const marketingSettingsApi = window.CATSOFT_TOOL_SETTINGS_API || getDefaultMarketingSettingsApiEndpoint();
const marketingSettingsRefreshMs = 10000;
const defaultMarketingSettings = {
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

const marketingInputs = {
  salePrice: document.getElementById('salePrice'),
  quantity: document.getElementById('quantity'),
  costPrice: document.getElementById('costPrice'),
  sellerDiscount: document.getElementById('sellerDiscount'),
  targetProfit: document.getElementById('targetProfit'),
  targetProfitMode: document.getElementById('targetProfitMode'),
  adminFeeRate: document.getElementById('adminFeeRate'),
  programFeeRate: document.getElementById('programFeeRate'),
  processingFee: document.getElementById('processingFee'),
  adsValue: document.getElementById('adsValue'),
  adsMethod: document.getElementById('adsMethod'),
  affiliateRate: document.getElementById('affiliateRate'),
  cashbackRate: document.getElementById('cashbackRate'),
  shippingSubsidy: document.getElementById('shippingSubsidy'),
  packingCost: document.getElementById('packingCost'),
  otherCost: document.getElementById('otherCost'),
  riskRate: document.getElementById('riskRate')
};

const marketingStatus = document.getElementById('marketingStatus');
const marketingSyncStatus = document.getElementById('marketingSyncStatus');
const defaultFeeSummary = document.getElementById('defaultFeeSummary');
const adsVatBadge = document.getElementById('adsVatBadge');
const priceSuggestionText = document.getElementById('priceSuggestionText');
const adsSuggestionText = document.getElementById('adsSuggestionText');
const fixedAdsVatRate = 11;
let latestMarketingResult = null;
const currencyInputIds = new Set([
  'salePrice',
  'costPrice',
  'sellerDiscount',
  'targetProfit',
  'processingFee',
  'shippingSubsidy',
  'packingCost',
  'otherCost'
]);

function getDefaultMarketingSettingsApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage) {
    return 'https://catsoft.store/api/tool-settings/marketing-calculator';
  }

  return '/api/tool-settings/marketing-calculator';
}

function cleanNumber(value) {
  const normalized = String(value || '').replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cleanDecimal(value) {
  const parsed = Number(String(value || '').replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function numberValue(id) {
  const value = currencyInputIds.has(id) ? cleanNumber(marketingInputs[id].value) : cleanDecimal(marketingInputs[id].value);
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function formatRupiahInput(value) {
  const amount = Math.max(Math.round(cleanNumber(value)), 0);
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount)}`;
}

function setInputValue(id, value) {
  if (currencyInputIds.has(id)) {
    marketingInputs[id].value = formatRupiahInput(value);
    return;
  }

  marketingInputs[id].value = value;
}

function normalizeCurrencyField(input) {
  input.value = formatRupiahInput(input.value);
}

function normalizeQuantityField() {
  const quantity = Math.max(1, Math.min(99, Math.trunc(numberValue('quantity')) || 1));
  marketingInputs.quantity.value = String(quantity);
  return quantity;
}

function syncTargetProfitInputMode() {
  const isProfitAmount = marketingInputs.targetProfitMode.value === 'amount';
  const currentValue = numberValue('targetProfit');

  if (isProfitAmount) {
    currencyInputIds.add('targetProfit');
    setInputValue('targetProfit', currentValue);
    return;
  }

  currencyInputIds.delete('targetProfit');
  marketingInputs.targetProfit.value = String(currentValue).replace('.', ',');
}

function roundedPrice(value, step = 500) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.ceil(value / step) * step;
}

function getTargetProfitAmount(totalHpp, netRevenue) {
  if (marketingInputs.targetProfitMode.value === 'percent') {
    return totalHpp * numberValue('targetProfit') / 100;
  }

  if (marketingInputs.targetProfitMode.value === 'netMargin') {
    return netRevenue * numberValue('targetProfit') / 100;
  }

  return numberValue('targetProfit');
}

function money(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Math.round(value || 0));
}

function rupiah(value) {
  return Math.round(Number(value) || 0);
}

function percent(value) {
  return `${(value || 0).toFixed(2).replace(/\.00$/, '')}%`;
}

function getSettingsFromInputs() {
  return {
    adminFeeRate: numberValue('adminFeeRate'),
    programFeeRate: numberValue('programFeeRate'),
    processingFee: numberValue('processingFee'),
    adsValue: numberValue('adsValue'),
    adsMethod: marketingInputs.adsMethod.value,
    affiliateRate: numberValue('affiliateRate'),
    cashbackRate: numberValue('cashbackRate'),
    shippingSubsidy: numberValue('shippingSubsidy'),
    packingCost: numberValue('packingCost'),
    otherCost: numberValue('otherCost'),
    riskRate: numberValue('riskRate')
  };
}

function applySettings(settings) {
  const nextSettings = { ...defaultMarketingSettings, ...(settings || {}) };
  setInputValue('adminFeeRate', nextSettings.adminFeeRate);
  setInputValue('programFeeRate', nextSettings.programFeeRate);
  setInputValue('processingFee', nextSettings.processingFee);
  setInputValue('adsValue', nextSettings.adsValue ?? nextSettings.adsRate ?? defaultMarketingSettings.adsValue);
  marketingInputs.adsMethod.value = nextSettings.adsMethod || defaultMarketingSettings.adsMethod;
  setInputValue('affiliateRate', nextSettings.affiliateRate);
  setInputValue('cashbackRate', nextSettings.cashbackRate);
  setInputValue('shippingSubsidy', nextSettings.shippingSubsidy);
  setInputValue('packingCost', nextSettings.packingCost);
  setInputValue('otherCost', nextSettings.otherCost);
  setInputValue('riskRate', nextSettings.riskRate);
  renderCalculation();
}

function loadLocalSettings() {
  try {
    return { ...defaultMarketingSettings, ...JSON.parse(localStorage.getItem(marketingSettingsKey) || '{}') };
  } catch (error) {
    return { ...defaultMarketingSettings };
  }
}

async function loadMarketingSettings() {
  applySettings(loadLocalSettings());

  try {
    const response = await fetch(`${marketingSettingsApi}?_=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      throw new Error(`API setting ${response.status}`);
    }

    const payload = await response.json();
    const settings = payload.settings || payload || {};
    localStorage.setItem(marketingSettingsKey, JSON.stringify(settings));
    applySettings(settings);
    marketingSyncStatus.textContent = 'Database';
    marketingStatus.textContent = 'Setting berhasil dimuat dari database.';
  } catch (error) {
    marketingSyncStatus.textContent = 'Lokal';
  }
}

function refreshMarketingSettingsIfIdle() {
  const activeElement = document.activeElement;
  const isEditing = activeElement && Object.values(marketingInputs).includes(activeElement);

  if (document.hidden || isEditing) {
    return;
  }

  loadMarketingSettings();
}

async function saveMarketingSettings() {
  const settings = getSettingsFromInputs();
  localStorage.setItem(marketingSettingsKey, JSON.stringify(settings));
  marketingStatus.textContent = 'Setting tersimpan lokal, mengirim ke database...';

  try {
    const response = await fetch(marketingSettingsApi, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    });

    if (!response.ok) {
      throw new Error(`API setting ${response.status}`);
    }

    marketingSyncStatus.textContent = 'Database';
    marketingStatus.textContent = 'Setting marketing tersimpan di database.';
  } catch (error) {
    marketingSyncStatus.textContent = 'Lokal';
    marketingStatus.textContent = `Setting lokal tersimpan. Sync database gagal: ${error.message}`;
  }
}

function getAdsRateForPrice(settings) {
  if (settings.adsMethod === 'roas') {
    const roas = Math.max(settings.adsValue, 0.1);
    return 100 / roas;
  }

  return settings.adsValue;
}

function calculateMinimumPrice(costPrice, targetProfit, settings, quantity, sellerDiscount, targetMode = 'amount', targetPercent = 0) {
  const adsRate = getAdsRateForPrice(settings);
  const feeRate = (
    settings.adminFeeRate
    + settings.programFeeRate
    + adsRate * (1 + fixedAdsVatRate / 100)
    + settings.affiliateRate
    + settings.cashbackRate
    + settings.riskRate
  ) / 100;

  if (targetMode === 'netMargin') {
    const marginRate = Math.max(targetPercent, 0) / 100;
    const netRevenueDenominator = 1 - feeRate - marginRate;
    const fixedCosts = costPrice * quantity
      + settings.processingFee
      + settings.shippingSubsidy
      + settings.packingCost
      + settings.otherCost;

    if (netRevenueDenominator <= 0 || quantity <= 0) {
      return Number.NaN;
    }

    return (fixedCosts / netRevenueDenominator + sellerDiscount) / quantity;
  }

  const denominator = quantity * (1 - feeRate);
  const fixedCosts = costPrice * quantity
    + settings.processingFee
    + settings.shippingSubsidy
    + settings.packingCost
    + settings.otherCost
    + targetProfit
    - sellerDiscount;

  if (denominator <= 0) {
    return 0;
  }

  return fixedCosts / denominator;
}

function getAdRecommendations(netRevenue, nonAdsCost, targetProfit) {
  if (netRevenue <= 0) {
    return {
      targetAdsPercent: 0,
      targetRoas: 0,
      breakEvenAdsPercent: 0,
      breakEvenRoas: 0,
      targetAdsBaseBudget: 0,
      targetAdsBudget: 0
    };
  }

  const vatMultiplier = 1 + fixedAdsVatRate / 100;
  const targetAdsTotalBudget = Math.max(netRevenue - nonAdsCost - targetProfit, 0);
  const breakEvenAdsTotalBudget = Math.max(netRevenue - nonAdsCost, 0);
  const targetAdsBaseBudget = rupiah(targetAdsTotalBudget / vatMultiplier);
  const breakEvenAdsBaseBudget = rupiah(breakEvenAdsTotalBudget / vatMultiplier);
  const targetAdsPercent = Math.min(targetAdsBaseBudget / netRevenue * 100, 100);
  const breakEvenAdsPercent = Math.min(breakEvenAdsBaseBudget / netRevenue * 100, 100);

  return {
    targetAdsPercent,
    targetRoas: targetAdsPercent > 0 ? 100 / targetAdsPercent : 0,
    breakEvenAdsPercent,
    breakEvenRoas: breakEvenAdsPercent > 0 ? 100 / breakEvenAdsPercent : 0,
    targetAdsBaseBudget,
    targetAdsBudget: targetAdsBaseBudget + rupiah(targetAdsBaseBudget * fixedAdsVatRate / 100)
  };
}

function renderSimulatorSuggestions(result) {
  if (!result) {
    return;
  }

  if (result.targetMode === 'netMargin' && !result.canReachTargetPrice) {
    priceSuggestionText.textContent = 'Target margin bersih terlalu tinggi untuk biaya dan fee saat ini.';
  } else if (result.costPrice > 0 && result.targetProfit >= 0 && result.suggestedPrice > 0) {
    const delta = result.suggestedPrice - result.salePrice;
    const targetLabel = result.targetMode === 'netMargin'
      ? `target margin bersih ${percent(result.targetPercent)}`
      : result.targetMode === 'percent'
        ? `target ${percent(result.targetPercent)} dari HPP`
        : 'target untung';
    priceSuggestionText.textContent = delta > 0
      ? `Saran harga: ${money(result.suggestedPrice)} agar ${targetLabel} tercapai.`
      : `Harga aman. Minimal ${money(result.suggestedPrice)}.`;
  } else {
    priceSuggestionText.textContent = 'Isi modal dan target untung untuk melihat saran harga.';
  }

  if (result.netRevenue > 0 && result.costPrice > 0) {
    const adsPercent = percent(result.suggestedAdsPercent);
    const roasText = result.suggestedRoas ? `${result.suggestedRoas.toFixed(2)}x` : '-';
    adsSuggestionText.textContent = !result.canReachTargetPrice && result.targetMode === 'netMargin'
      ? 'Turunkan target margin bersih agar ruang iklan bisa dihitung.'
      : result.canHitTargetBeforeAds
      ? `Batas iklan: ${adsPercent} / ROAS ${roasText}. Budget aman ${money(result.suggestedAdsBudget)}.`
      : `Naikkan harga ke ${money(result.suggestedPrice)} dulu. Belum ada ruang iklan aman.`;
  } else {
    adsSuggestionText.textContent = 'Isi harga dan modal untuk melihat batas iklan.';
  }
}

function renderCalculation() {
  const salePrice = numberValue('salePrice');
  const quantity = Math.max(1, Math.min(99, Math.trunc(numberValue('quantity')) || 1));
  const costPrice = numberValue('costPrice');
  const sellerDiscount = Math.min(numberValue('sellerDiscount'), salePrice * quantity);
  const targetMode = marketingInputs.targetProfitMode.value;
  const netRevenue = Math.max(salePrice * quantity - sellerDiscount, 0);
  const totalHpp = rupiah(costPrice * quantity);
  const targetProfit = getTargetProfitAmount(totalHpp, netRevenue);
  const targetPercent = targetMode === 'percent' || targetMode === 'netMargin' ? numberValue('targetProfit') : 0;
  const settings = getSettingsFromInputs();
  const adsMethod = settings.adsMethod;
  const adsInputValue = Math.max(settings.adsValue, adsMethod === 'roas' ? 0.1 : 0);
  const adsBaseBudget = adsMethod === 'roas'
    ? rupiah(netRevenue / adsInputValue)
    : rupiah(netRevenue * adsInputValue / 100);
  const adsVat = rupiah(adsBaseBudget * fixedAdsVatRate / 100);
  const adsBudget = adsBaseBudget + adsVat;
  const effectiveRoas = adsBaseBudget > 0 ? netRevenue / adsBaseBudget : 0;
  const effectiveAdsRate = netRevenue > 0 ? adsBaseBudget / netRevenue * 100 : 0;
  const adminFee = rupiah(netRevenue * settings.adminFeeRate / 100);
  const programFee = rupiah(netRevenue * settings.programFeeRate / 100);
  const affiliateFee = rupiah(netRevenue * settings.affiliateRate / 100);
  const cashbackFee = rupiah(netRevenue * settings.cashbackRate / 100);
  const riskCost = rupiah(netRevenue * settings.riskRate / 100);
  const roasAdsBudget = adsMethod === 'roas' ? adsBudget : 0;
  const platformCost = adminFee + programFee + settings.processingFee + adsBudget;
  const extraCost = affiliateFee + cashbackFee + settings.shippingSubsidy + settings.packingCost + settings.otherCost + riskCost;
  const totalCost = totalHpp + platformCost + extraCost;
  const shopeeIncome = netRevenue - platformCost - extraCost;
  const netProfit = netRevenue - totalCost;
  const netMargin = netRevenue > 0 ? netProfit / netRevenue * 100 : 0;
  const minimumPrice = calculateMinimumPrice(costPrice, targetProfit, settings, quantity, sellerDiscount, targetMode, targetPercent);
  const nonAdsCost = totalHpp + adminFee + programFee + settings.processingFee + affiliateFee + cashbackFee + settings.shippingSubsidy + settings.packingCost + settings.otherCost + riskCost;
  const breakEvenRoas = netRevenue > nonAdsCost
    ? netRevenue / (netRevenue - nonAdsCost)
    : 0;
  const adRecommendations = getAdRecommendations(netRevenue, nonAdsCost, targetProfit);
  const canHitTargetBeforeAds = netRevenue > nonAdsCost + targetProfit;
  const safeAdsRate = canHitTargetBeforeAds
    ? adRecommendations.targetAdsPercent
    : 0;
  const canReachTargetPrice = Number.isFinite(minimumPrice) && minimumPrice > 0;
  const suggestedPrice = roundedPrice(minimumPrice);
  const suggestedAdsPercent = Number(Math.max(safeAdsRate, 0).toFixed(2));
  const suggestedRoas = adRecommendations.targetRoas ? Number(adRecommendations.targetRoas.toFixed(2)) : 0;
  const suggestedAdsValue = adsMethod === 'roas' ? suggestedRoas : suggestedAdsPercent;
  const displayMinimumPrice = canReachTargetPrice ? (suggestedPrice || minimumPrice) : null;

  document.getElementById('netRevenue').textContent = money(netRevenue);
  document.getElementById('shopeeIncome').textContent = money(shopeeIncome);
  document.getElementById('netProfit').textContent = money(netProfit);
  document.getElementById('netMargin').textContent = percent(netMargin);
  document.getElementById('platformCost').textContent = money(platformCost + extraCost);
  document.getElementById('adsBudget').textContent = money(adsBudget);
  document.getElementById('roasAdsBudget').textContent = effectiveRoas ? `${effectiveRoas.toFixed(2)}x` : '-';
  document.getElementById('minimumPrice').textContent = displayMinimumPrice ? money(displayMinimumPrice) : '-';
  document.getElementById('breakEvenRoas').textContent = breakEvenRoas ? `${breakEvenRoas.toFixed(2)}x` : '-';
  defaultFeeSummary.textContent = percent(settings.adminFeeRate + settings.programFeeRate + (effectiveAdsRate * (1 + fixedAdsVatRate / 100)) + settings.affiliateRate + settings.cashbackRate);
  adsVatBadge.hidden = adsMethod !== 'percent';

  const advice = [];
  advice.push(displayMinimumPrice
    ? `Harga aman ${money(displayMinimumPrice)}.`
    : 'Target margin bersih belum realistis.');
  advice.push(canHitTargetBeforeAds
    ? `Iklan ${percent(suggestedAdsPercent)} / ROAS ${suggestedRoas ? suggestedRoas.toFixed(2) : '-'}x.`
    : 'Naikkan harga dulu sebelum menambah iklan.');
  advice.push(`Budget + PPN ${money(canHitTargetBeforeAds ? adRecommendations.targetAdsBudget : 0)}.`);

  document.getElementById('marketingAdvice').innerHTML = advice.map((item) => `<p>${item}</p>`).join('');
  const breakdownRows = [
    ['Omset', netRevenue],
    ['HPP Total', totalHpp],
    ['Admin', adminFee],
    ['Program', programFee],
    ['Pemrosesan', settings.processingFee],
    [adsMethod === 'roas' ? `Iklan ROAS ${adsInputValue}x` : `Iklan ${percent(adsInputValue)}`, adsBaseBudget],
    ['PPN Iklan', adsVat],
    ['Iklan + PPN', adsBudget],
    ['Affiliate', affiliateFee],
    ['Cashback', cashbackFee],
    ['Subsidi Ongkir', settings.shippingSubsidy],
    ['Packing', settings.packingCost],
    ['Biaya Lain', settings.otherCost],
    ['Risiko Retur', riskCost]
  ];

  document.getElementById('costBreakdown').innerHTML = `
    <div class="cost-line">
      <span>Rincian Biaya</span>
      <strong>${money(platformCost + extraCost + totalHpp)}</strong>
    </div>
    ${breakdownRows.map(([label, value]) => `
    <div class="cost-line">
      <span>${label}</span>
      <strong>${money(value)}</strong>
    </div>
    `).join('')}
  `;
  updateJoinedControls();

  latestMarketingResult = {
    salePrice,
    quantity,
    costPrice,
    sellerDiscount,
    netRevenue,
    shopeeIncome,
    targetMode,
    targetProfit,
    targetPercent,
    adsMethod,
    adsInputValue,
    effectiveRoas,
    effectiveAdsRate,
    adminFee,
    programFee,
    affiliateFee,
    cashbackFee,
    riskCost,
    adsBaseBudget,
    adsVat,
    processingFee: settings.processingFee,
    shippingSubsidy: settings.shippingSubsidy,
    packingCost: settings.packingCost,
    otherCost: settings.otherCost,
    adsBudget,
    roasAdsBudget,
    platformCost: platformCost + extraCost,
    totalHpp,
    netProfit,
    netMargin,
    minimumPrice,
    breakEvenRoas,
    suggestedPrice,
    suggestedAdsValue,
    suggestedAdsPercent,
    suggestedRoas,
    suggestedAdsBudget: canHitTargetBeforeAds ? adRecommendations.targetAdsBudget : 0,
    breakEvenAdsPercent: adRecommendations.breakEvenAdsPercent,
    breakEvenRoasVatAware: adRecommendations.breakEvenRoas,
    canReachTargetPrice,
    canHitTargetBeforeAds
  };

  renderSimulatorSuggestions(latestMarketingResult);
}

function updateJoinedControls() {
  const isProfitPercent = marketingInputs.targetProfitMode.value !== 'amount';
  const isAdsPercent = marketingInputs.adsMethod.value === 'percent';

  marketingInputs.targetProfit.step = isProfitPercent ? '0.5' : '500';
  marketingInputs.adsValue.step = '0.1';
  marketingInputs.adsValue.placeholder = isAdsPercent ? '10' : '3';
  adsVatBadge.hidden = !isAdsPercent;
}

function applyMarketingSuggestion() {
  renderCalculation();

  if (!latestMarketingResult) {
    return;
  }

  if (latestMarketingResult.suggestedPrice > 0) {
    setInputValue('salePrice', latestMarketingResult.suggestedPrice);
  }

  if (latestMarketingResult.adsMethod === 'percent') {
    setInputValue('adsValue', latestMarketingResult.suggestedAdsPercent);
  } else if (latestMarketingResult.suggestedRoas > 0) {
    setInputValue('adsValue', latestMarketingResult.suggestedRoas);
  }
  renderCalculation();
  marketingStatus.textContent = 'Saran harga dan iklan sudah diterapkan.';
}

function applyPriceSuggestion() {
  renderCalculation();

  if (latestMarketingResult?.suggestedPrice > 0) {
    setInputValue('salePrice', latestMarketingResult.suggestedPrice);
    renderCalculation();
    marketingStatus.textContent = 'Saran harga jual sudah diterapkan.';
  }
}

function applyAdsSuggestion() {
  renderCalculation();

  if (!latestMarketingResult) {
    return;
  }

  if (marketingInputs.adsMethod.value === 'roas') {
    setInputValue('adsValue', latestMarketingResult.suggestedRoas || latestMarketingResult.breakEvenRoasVatAware || 0);
  } else {
    setInputValue('adsValue', latestMarketingResult.suggestedAdsPercent);
  }

  renderCalculation();
  marketingStatus.textContent = 'Saran iklan sudah diterapkan.';
}

function exportMarketingCsv() {
  renderCalculation();
  const result = latestMarketingResult;
  const rows = [
    ['Metric', 'Value'],
    ['Harga Jual', result.salePrice],
    ['Qty', result.quantity],
    ['HPP', result.costPrice],
    ['Voucher Toko / Diskon', result.sellerDiscount],
    ['Omset Bersih', Math.round(result.netRevenue)],
    ['Estimasi Penghasilan Shopee', Math.round(result.shopeeIncome)],
    ['Mode Target Profit', result.targetMode],
    ['Target Profit Nominal', Math.round(result.targetProfit)],
    ['Target Profit Persen HPP', result.targetMode === 'percent' ? result.targetPercent : ''],
    ['Target Margin Bersih', result.targetMode === 'netMargin' ? result.targetPercent : ''],
    ['Metode Iklan', result.adsMethod],
    ['Nilai Iklan', result.adsInputValue],
    ['ROAS Iklan', result.effectiveRoas ? result.effectiveRoas.toFixed(2) : ''],
    ['Persen Iklan Efektif', result.effectiveAdsRate.toFixed(2)],
    ['Biaya Admin', Math.round(result.adminFee)],
    ['Biaya Program', Math.round(result.programFee)],
    ['Biaya Pemrosesan', Math.round(result.processingFee)],
    ['Iklan sebelum PPN', Math.round(result.adsBaseBudget)],
    ['PPN Iklan', Math.round(result.adsVat)],
    ['Affiliate', Math.round(result.affiliateFee)],
    ['Cashback Koin', Math.round(result.cashbackFee)],
    ['Subsidi Ongkir', Math.round(result.shippingSubsidy)],
    ['Packing / Operasional', Math.round(result.packingCost)],
    ['Biaya Lain', Math.round(result.otherCost)],
    ['Risiko Retur/Problem', Math.round(result.riskCost)],
    ['Iklan + PPN', Math.round(result.adsBudget)],
    ['Total Biaya Platform', Math.round(result.platformCost)],
    ['Profit Bersih', Math.round(result.netProfit)],
    ['Margin Bersih', result.netMargin.toFixed(2)],
    ['Harga Minimal', Math.round(result.minimumPrice)],
    ['Break even ROAS', result.breakEvenRoas ? result.breakEvenRoas.toFixed(2) : '']
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `catsoft-marketing-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  marketingStatus.textContent = 'CSV hasil marketing berhasil dibuat.';
}

document.getElementById('marketingForm').addEventListener('submit', (event) => event.preventDefault());

Object.values(marketingInputs).forEach((input) => {
  input.addEventListener('input', () => {
    if (input.id === 'quantity') {
      normalizeQuantityField();
    }
    if (currencyInputIds.has(input.id)) {
      normalizeCurrencyField(input);
    }
    renderCalculation();
  });
  input.addEventListener('change', () => {
    if (input.id === 'targetProfitMode') {
      syncTargetProfitInputMode();
    }
    if (input.id === 'quantity') {
      normalizeQuantityField();
    }
    if (currencyInputIds.has(input.id)) {
      normalizeCurrencyField(input);
    }
    renderCalculation();
  });
});

document.getElementById('saveMarketingSettings').addEventListener('click', saveMarketingSettings);
document.getElementById('applyMarketingSuggestion').addEventListener('click', applyMarketingSuggestion);
document.getElementById('applyPriceSuggestion').addEventListener('click', applyPriceSuggestion);
document.getElementById('applyAdsSuggestion').addEventListener('click', applyAdsSuggestion);
document.getElementById('resetMarketingSettings').addEventListener('click', () => {
  applySettings(defaultMarketingSettings);
  saveMarketingSettings();
});
document.getElementById('exportMarketingCsv').addEventListener('click', exportMarketingCsv);
window.addEventListener('focus', refreshMarketingSettingsIfIdle);
document.addEventListener('visibilitychange', refreshMarketingSettingsIfIdle);
window.setInterval(refreshMarketingSettingsIfIdle, marketingSettingsRefreshMs);

loadMarketingSettings();
