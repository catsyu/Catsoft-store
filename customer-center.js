const CUSTOMER_RECORDS_API = window.CUSTOMER_RECORDS_API || getDefaultCustomerRecordsApiEndpoint();
let customerCenterRecords = [];

function getDefaultCustomerRecordsApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage) {
    return 'https://catsoft.store/api/customer-records';
  }

  return '/api/customer-records';
}

function escapeCustomerCenterHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCustomerDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function normalizeCustomerCenterValue(value) {
  return String(value || '').trim().toLowerCase();
}

function getCustomerRecordValue(record, keys, fallback = '') {
  for (const key of keys) {
    const value = record?.[key];

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return fallback;
}

function isCustomerRecordActive(status) {
  const normalized = normalizeCustomerCenterValue(status || 'active');
  return normalized === 'active' || normalized === 'aktif';
}

function getStatusLabel(status) {
  const labels = {
    active: 'Aktif',
    aktif: 'Aktif',
    expired: 'Expired',
    removed: 'Removed',
    refund: 'Refund',
    problem: 'Problem',
    incomplete: 'Belum Lengkap'
  };
  return labels[normalizeCustomerCenterValue(status)] || 'Aktif';
}

function getTargetText(record) {
  return getCustomerRecordValue(record, [
    'target',
    'activatedEmail',
    'activated_email',
    'whatsappNumber',
    'whatsapp_number',
    'orderNumber',
    'order_number'
  ], '-');
}

function customerHasEmailAccess() {
  const access = window.CatsoftCustomerAuth?.getInboxAccess?.();
  return Boolean(access && (access.all || (Array.isArray(access.rules) && access.rules.length)));
}

function updateCustomerEmailAccessView() {
  const hasEmailAccess = customerHasEmailAccess();

  document.querySelectorAll('[data-customer-email-nav], [data-customer-email-panel]').forEach((element) => {
    element.hidden = !hasEmailAccess;
  });

  return hasEmailAccess;
}

async function fetchCustomerRecords() {
  const customer = window.CatsoftCustomerAuth?.getCurrentCustomer?.();

  if (!customer) {
    return [];
  }

  const url = new URL(CUSTOMER_RECORDS_API, window.location.href);
  url.searchParams.set('customer', customer.username);
  url.searchParams.set('limit', '500');
  url.searchParams.set('_', Date.now());

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
  });

  if (!response.ok) {
    throw new Error(`API customer ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.records) ? data.records : [];
}

function renderCustomerSummary(records) {
  const activeCount = records.filter((record) => isCustomerRecordActive(record.status)).length;
  const expiryDates = records
    .map((record) => getCustomerRecordValue(record, ['expiryDate', 'expiry_date', 'expireDate', 'expire_date']))
    .filter(Boolean)
    .sort();
  const totalEl = document.querySelector('[data-customer-summary="total"]');
  const activeEl = document.querySelector('[data-customer-summary="active"]');
  const expiryEl = document.querySelector('[data-customer-summary="expiry"]');

  if (totalEl) totalEl.textContent = String(records.length);
  if (activeEl) activeEl.textContent = String(activeCount);
  if (expiryEl) expiryEl.textContent = expiryDates.length ? formatCustomerDate(expiryDates[0]) : '-';
}

function renderCustomerRecordRow(record) {
  const status = normalizeCustomerCenterValue(record.status) || 'active';
  const target = getTargetText(record);
  const productName = getCustomerRecordValue(record, ['productName', 'product_name', 'product'], 'Produk Catsoft');
  const orderText = getCustomerRecordValue(record, ['orderNumber', 'order_number', 'orderSource', 'order_source'], 'Order Catsoft');
  const expiryDate = getCustomerRecordValue(record, ['expiryDate', 'expiry_date', 'expireDate', 'expire_date']);

  return `
    <article class="customer-order-row">
      <div class="customer-order-main">
        <span class="customer-order-icon" aria-hidden="true"></span>
        <span class="customer-order-copy">
          <strong>${escapeCustomerCenterHtml(productName)}</strong>
          <small>${escapeCustomerCenterHtml(orderText)}</small>
        </span>
      </div>
      <div class="customer-order-target">
        <strong>${escapeCustomerCenterHtml(target)}</strong><br />
        <span>Expire ${escapeCustomerCenterHtml(formatCustomerDate(expiryDate))}</span>
      </div>
      <span class="customer-order-status ${isCustomerRecordActive(status) ? 'is-active' : ''}">${escapeCustomerCenterHtml(getStatusLabel(status))}</span>
    </article>
  `;
}

function renderCustomerRecords(records) {
  const overview = document.querySelector('[data-customer-overview-list]');
  const allOrders = document.querySelector('[data-customer-order-list]');
  const limited = records.slice(0, 4);
  const empty = '<p class="customer-empty">Belum ada akses yang terhubung ke akun ini.</p>';

  if (overview) {
    overview.innerHTML = limited.length ? limited.map(renderCustomerRecordRow).join('') : empty;
  }

  if (allOrders) {
    allOrders.innerHTML = records.length ? records.map(renderCustomerRecordRow).join('') : empty;
  }
}

async function loadCustomerCenterData() {
  document.querySelectorAll('[data-customer-refresh]').forEach((button) => {
    button.disabled = true;
    button.textContent = 'Memuat...';
  });

  try {
    customerCenterRecords = await fetchCustomerRecords();
    renderCustomerSummary(customerCenterRecords);
    renderCustomerRecords(customerCenterRecords);
  } catch (error) {
    renderCustomerSummary([]);
    renderCustomerRecords([]);
  } finally {
    document.querySelectorAll('[data-customer-refresh]').forEach((button) => {
      button.disabled = false;
      button.textContent = 'Refresh';
    });
  }
}

function showCustomerView(viewName) {
  const allowedViews = ['overview', 'orders', 'help'];

  if (customerHasEmailAccess()) {
    allowedViews.push('email');
  }

  const activeView = allowedViews.includes(viewName) ? viewName : 'overview';
  document.querySelectorAll('[data-customer-view-target]').forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('data-customer-view-target') === activeView);
  });
  document.querySelectorAll('[data-customer-view]').forEach((section) => {
    section.hidden = section.getAttribute('data-customer-view') !== activeView;
  });

  if (window.location.hash !== `#${activeView}`) {
    window.history.replaceState(null, '', `#${activeView}`);
  }
}

function bindCustomerCenter() {
  updateCustomerEmailAccessView();
  document.querySelectorAll('[data-customer-view-target]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showCustomerView(link.getAttribute('data-customer-view-target'));
    });
  });

  document.querySelectorAll('[data-customer-refresh]').forEach((button) => {
    button.addEventListener('click', loadCustomerCenterData);
  });

  showCustomerView(String(window.location.hash || '#overview').replace(/^#/, ''));
  loadCustomerCenterData();
}

function waitForCustomerReady() {
  if (window.CATSOFT_CUSTOMER_AUTHORIZED) {
    bindCustomerCenter();
    return;
  }

  document.addEventListener('catsoft-customer-ready', bindCustomerCenter, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForCustomerReady);
} else {
  waitForCustomerReady();
}
