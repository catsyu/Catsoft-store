if (!window.CATSOFT_ADMIN_AUTHORIZED) {
  throw new Error('Catsoft admin authorization required.');
}

const PRODUCT_STOCK_API = window.CATSOFT_PRODUCT_STOCK_API || getDefaultProductStockApiEndpoint();
const productStockPageSizeOptions = [5, 10, 20, 50];
let productStockAccounts = [];
let productStockPageSize = 10;
let activeStockDrawerAccount = null;
let isStockJoinedExpanded = false;

const stockStatusLabels = {
  active: 'Aktif',
  full: 'Penuh',
  reset: 'Perlu Reset',
  paused: 'Jeda'
};

function getDefaultProductStockApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage || hostname !== 'catsoft.store') {
    return 'https://catsoft.store/api/product-stock';
  }

  return '/api/product-stock';
}

function normalizeStockValue(value) {
  return String(value || '').trim().toLowerCase();
}

function escapeStockHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStockInitials(value) {
  const clean = String(value || 'ST').replace(/[^a-z0-9 ]/gi, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : clean.replace(/[^a-z0-9]/gi, '').slice(0, 2);
  return (initials || 'ST').toUpperCase();
}

function formatStockDate(value) {
  const date = value ? new Date(`${value}T00:00:00`) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Belum Diatur';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function formatStockDateTime(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Belum Ada';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function isStockResetDue(account) {
  const resetAt = String(account.resetAt || '').slice(0, 10);
  return account.status === 'reset' || Boolean(resetAt && resetAt <= new Date().toISOString().slice(0, 10));
}

function normalizeStockAccount(account) {
  return {
    id: String(account.id || crypto.randomUUID()),
    productName: String(account.productName || account.product_name || '').trim(),
    accountName: String(account.accountName || account.account_name || '').trim(),
    accountTarget: String(account.accountTarget || account.account_target || '').trim(),
    loginUsername: String(account.loginUsername || account.login_username || '').trim(),
    loginPassword: String(account.loginPassword || account.login_password || '').trim(),
    capacity: Number(account.capacity || 7),
    status: stockStatusLabels[account.status] ? account.status : 'active',
    resetAt: String(account.resetAt || account.reset_at || '').slice(0, 10),
    notes: String(account.notes || ''),
    joinedTotal: Number(account.joinedTotal || account.joined_total || 0),
    joinedActive: Number(account.joinedActive || account.joined_active || 0),
    joinedExpired: Number(account.joinedExpired || account.joined_expired || 0),
    joinedProblem: Number(account.joinedProblem || account.joined_problem || 0),
    openSlots: Number(account.openSlots || account.open_slots || 0),
    joinedCustomers: Array.isArray(account.joinedCustomers) ? account.joinedCustomers : [],
    createdAt: account.createdAt || account.created_at || '',
    updatedAt: account.updatedAt || account.updated_at || ''
  };
}

function getStockSearchTerm() {
  return normalizeStockValue(document.querySelector('[data-stock-search]')?.value || '');
}

function getFilteredStockAccounts() {
  const term = getStockSearchTerm();

  if (!term) {
    return [...productStockAccounts];
  }

  return productStockAccounts.filter((account) => normalizeStockValue([
    account.productName,
    account.accountName,
    account.loginUsername,
    account.status
  ].join(' ')).includes(term));
}

function setStockStatus(message, type = '') {
  const status = document.querySelector('[data-stock-status]');

  if (!status) {
    return;
  }

  status.textContent = message || '';
  status.classList.toggle('success', type === 'success');
}

function mergeProductStockAccounts(accounts) {
  const nextAccounts = Array.isArray(accounts) ? accounts.map(normalizeStockAccount) : [];

  if (!nextAccounts.length) {
    return;
  }

  const byId = new Map(productStockAccounts.map((account) => [account.id, account]));
  nextAccounts.forEach((account) => byId.set(account.id, account));
  productStockAccounts = [...byId.values()].sort((first, second) => {
    const firstTime = Date.parse(first.updatedAt || first.createdAt || '') || 0;
    const secondTime = Date.parse(second.updatedAt || second.createdAt || '') || 0;
    return secondTime - firstTime;
  });
  renderProductStockAccounts();
}

async function fetchProductStockAccounts() {
  const response = await fetch(`${PRODUCT_STOCK_API}?_=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
  });

  if (!response.ok) {
    throw new Error(`API stok ${response.status}`);
  }

  const data = await response.json();
  productStockAccounts = (Array.isArray(data) ? data : data.accounts || []).map(normalizeStockAccount);
  renderProductStockAccounts();
  return productStockAccounts;
}

async function pushProductStockAccount(account) {
  const response = await fetch(PRODUCT_STOCK_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `API stok ${response.status}`);
  }

  return response.json();
}

async function deleteProductStockAccount(id) {
  const response = await fetch(`${PRODUCT_STOCK_API}/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error(`API stok ${response.status}`);
  }
}

function renderProductStockAccounts() {
  const list = document.querySelector('[data-stock-list]');
  const total = document.querySelector('[data-stock-total]');
  const reset = document.querySelector('[data-stock-reset]');

  if (!list) {
    return;
  }

  const visible = getFilteredStockAccounts();
  const paged = visible.slice(0, productStockPageSize);

  if (total) total.textContent = String(visible.length);
  if (reset) reset.textContent = String(visible.filter(isStockResetDue).length);

  if (!visible.length) {
    list.innerHTML = `
      <div class="admin-spectrum-empty stock-empty">
        <span class="stock-empty-icon" aria-hidden="true"></span>
        <div>
          <h3>Belum Ada Akun Stok</h3>
          <span>Tambah stok untuk melihat kapasitas, customer aktif, dan jadwal reset.</span>
        </div>
      </div>
    `;
    return;
  }

  const rows = paged.map((account) => {
    const usageText = `${account.joinedActive}/${account.capacity}`;
    const resetText = isStockResetDue(account) ? 'Perlu Reset' : formatStockDate(account.resetAt);
    const statusText = stockStatusLabels[account.status] || 'Aktif';
    const joinedDetail = account.joinedExpired
      ? `${account.joinedExpired} Habis`
      : `${account.openSlots} Slot Kosong`;

    return `
      <div class="admin-spectrum-row stock-spectrum-row" role="row">
        <span class="admin-spectrum-check">
          <span class="admin-spectrum-avatar stock" aria-hidden="true">${escapeStockHtml(getStockInitials(account.productName))}</span>
        </span>
        <span class="admin-spectrum-name">
          <span><strong>${escapeStockHtml(account.accountName)}</strong><small>${escapeStockHtml(account.productName)}</small></span>
        </span>
        <span class="stock-target-cell">
          <strong>${escapeStockHtml(account.loginUsername || 'Login Belum Diisi')}</strong>
          <small>${escapeStockHtml(account.loginPassword ? 'Password tersimpan' : 'Password belum diisi')}</small>
        </span>
        <span>
          <b>${escapeStockHtml(usageText)} Aktif</b>
          <small>${escapeStockHtml(joinedDetail)}</small>
        </span>
        <span>
          <b>${escapeStockHtml(statusText)}</b>
          <small>${escapeStockHtml(resetText)}</small>
        </span>
        <span class="admin-spectrum-row-actions">
          <button class="admin-spectrum-open" type="button" data-open-stock="${escapeStockHtml(account.id)}" aria-label="Edit ${escapeStockHtml(account.accountName)}"></button>
        </span>
      </div>
    `;
  }).join('');

  list.innerHTML = `
    <div class="admin-spectrum-table stock-spectrum-table" role="grid" aria-label="Daftar Stok Produk">
      <div class="admin-spectrum-row is-heading stock-spectrum-row" role="row">
        <span></span>
        <span>Akun Stok</span>
        <span>Login</span>
        <span>Join</span>
        <span>Status</span>
        <span></span>
      </div>
      ${rows}
    </div>
    <div class="admin-spectrum-pager">
      <div class="admin-spectrum-page-buttons" aria-label="Navigasi Halaman Stok">
        <button class="admin-spectrum-page-nav is-prev" type="button" disabled aria-label="Halaman Sebelumnya"><span>Sebelumnya</span></button>
        <button class="admin-spectrum-page-nav is-next" type="button" disabled aria-label="Halaman Berikutnya"><span>Berikutnya</span></button>
      </div>
      <label class="admin-spectrum-page-size">
        <span>Item Per Halaman</span>
        <select data-stock-page-size>
          ${productStockPageSizeOptions.map((size) => `<option value="${size}" ${productStockPageSize === size ? 'selected' : ''}>${size}</option>`).join('')}
        </select>
      </label>
      <span class="admin-spectrum-page-count">${paged.length ? `1-${paged.length}` : '0'} Dari ${visible.length}</span>
    </div>
  `;

  list.querySelectorAll('[data-open-stock]').forEach((button) => {
    button.addEventListener('click', () => openStockDrawer(button.dataset.openStock));
  });

  list.querySelector('[data-stock-page-size]')?.addEventListener('change', (event) => {
    productStockPageSize = Number(event.target.value) || 10;
    renderProductStockAccounts();
  });
}

function setStockDrawerOpen(isOpen) {
  const drawer = document.querySelector('[data-stock-drawer]');
  const scrim = document.querySelector('[data-stock-scrim]');

  if (drawer) drawer.hidden = !isOpen;
  if (scrim) scrim.hidden = !isOpen;
  document.body.classList.toggle('admin-drawer-open', isOpen);
}

function updateStockDrawerTitle(label = 'Tambah Akun Stok') {
  const product = document.querySelector('[data-stock-product]')?.value || '';
  const accountName = document.querySelector('[data-stock-account-name]')?.value || '';
  const title = document.querySelector('[data-stock-drawer-title]');
  const avatar = document.querySelector('[data-stock-avatar]');
  const value = accountName || product || label;

  if (title) title.textContent = value;
  if (avatar) avatar.textContent = getStockInitials(product || value);
}

function resetStockForm() {
  const form = document.querySelector('[data-stock-form]');
  if (!form) return;
  form.reset();
  activeStockDrawerAccount = null;
  isStockJoinedExpanded = false;
  document.querySelector('[data-stock-id]').value = '';
  document.querySelector('[data-stock-capacity]').value = '7';
  document.querySelector('[data-stock-status-field]').value = 'active';
  document.querySelector('[data-stock-delete-section]').hidden = true;
  renderJoinedCustomers(null);
  updateStockDrawerTitle();
}

function renderJoinedCustomers(account) {
  const summary = document.querySelector('[data-stock-joined-summary]');
  const list = document.querySelector('[data-stock-joined-list]');

  if (!summary || !list) {
    return;
  }

  const capacity = account?.capacity || 7;
  const activeTotal = account?.joinedActive || 0;
  summary.textContent = `${activeTotal}/${capacity} Aktif`;
  summary.disabled = !account;
  summary.setAttribute('aria-expanded', String(Boolean(account && isStockJoinedExpanded)));
  summary.classList.toggle('is-open', Boolean(account && isStockJoinedExpanded));
  list.hidden = !account || !isStockJoinedExpanded;

  if (!account) {
    list.innerHTML = '';
    return;
  }

  if (!account.joinedCustomers.length) {
    list.innerHTML = '<p>Belum ada customer yang terhubung lewat field Stok di database customer.</p>';
    return;
  }

  list.innerHTML = account.joinedCustomers.map((customer) => {
    const statusText = customer.isExpired ? 'Habis' : (customer.status === 'problem' ? 'Bermasalah' : 'Aktif');
    return `
      <div class="stock-joined-row">
        <span class="admin-spectrum-avatar stock-customer" aria-hidden="true">${escapeStockHtml(getStockInitials(customer.customerName || customer.activatedEmail))}</span>
        <span>
          <strong>${escapeStockHtml(customer.customerName || 'Customer')}</strong>
          <small>${escapeStockHtml(customer.orderNumber || customer.activatedEmail || 'Tanpa order')}</small>
        </span>
        <span>
          <b>${escapeStockHtml(statusText)}</b>
          <small>${escapeStockHtml(formatStockDate(customer.expiryDate))}</small>
        </span>
      </div>
    `;
  }).join('');
}

function openStockDrawer(id = '') {
  const account = productStockAccounts.find((item) => item.id === id);

  resetStockForm();

  if (account) {
    activeStockDrawerAccount = account;
    isStockJoinedExpanded = false;
    document.querySelector('[data-stock-id]').value = account.id;
    document.querySelector('[data-stock-product]').value = account.productName;
    document.querySelector('[data-stock-account-name]').value = account.accountName;
    document.querySelector('[data-stock-login-username]').value = account.loginUsername;
    document.querySelector('[data-stock-login-password]').value = account.loginPassword;
    document.querySelector('[data-stock-capacity]').value = account.capacity;
    document.querySelector('[data-stock-status-field]').value = account.status;
    document.querySelector('[data-stock-reset-at]').value = account.resetAt;
    document.querySelector('[data-stock-notes]').value = account.notes;
    document.querySelector('[data-stock-delete-section]').hidden = false;
    renderJoinedCustomers(account);
    updateStockDrawerTitle(account.accountName);
  }

  setStockDrawerOpen(true);
}

function toggleStockJoinedCustomers() {
  if (!activeStockDrawerAccount) {
    return;
  }

  isStockJoinedExpanded = !isStockJoinedExpanded;
  renderJoinedCustomers(activeStockDrawerAccount);
}

function getStockFormValues() {
  const id = document.querySelector('[data-stock-id]').value;
  const now = new Date().toISOString();
  const existing = productStockAccounts.find((account) => account.id === id);

  return {
    ...(existing || {}),
    id: id || crypto.randomUUID(),
    productName: document.querySelector('[data-stock-product]').value.trim(),
    accountName: document.querySelector('[data-stock-account-name]').value.trim(),
    accountTarget: '',
    loginUsername: document.querySelector('[data-stock-login-username]').value.trim(),
    loginPassword: document.querySelector('[data-stock-login-password]').value.trim(),
    capacity: Number(document.querySelector('[data-stock-capacity]').value || 7),
    status: document.querySelector('[data-stock-status-field]').value,
    resetAt: document.querySelector('[data-stock-reset-at]').value,
    notes: document.querySelector('[data-stock-notes]').value.trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
}

async function saveStockForm(event) {
  event.preventDefault();
  const values = getStockFormValues();

  if (!values.productName || !values.accountName) {
    setStockStatus('Produk dan nama akun stok wajib diisi.');
    return;
  }

  setStockStatus('Menyimpan stok produk...');

  try {
    const result = await pushProductStockAccount(values);
    const savedAccounts = Array.isArray(result.saved) && result.saved.length ? result.saved : [values];
    mergeProductStockAccounts(savedAccounts);
    setStockStatus('Stok produk tersimpan.', 'success');
    setStockDrawerOpen(false);
    fetchProductStockAccounts().catch(() => {});
  } catch (error) {
    setStockStatus(`Gagal menyimpan: ${error.message}`);
  }
}

async function deleteCurrentStockAccount() {
  const id = document.querySelector('[data-stock-id]').value;

  if (!id) {
    return;
  }

  setStockStatus('Menghapus akun stok...');

  try {
    await deleteProductStockAccount(id);
    productStockAccounts = productStockAccounts.filter((account) => account.id !== id);
    renderProductStockAccounts();
    setStockStatus('Akun stok dihapus.', 'success');
    setStockDrawerOpen(false);
  } catch (error) {
    setStockStatus(`Gagal menghapus: ${error.message}`);
  }
}

function bindProductStock() {
  document.querySelector('[data-stock-search]')?.addEventListener('input', renderProductStockAccounts);
  document.querySelector('[data-stock-add]')?.addEventListener('click', () => openStockDrawer());
  document.querySelector('[data-stock-refresh]')?.addEventListener('click', async () => {
    setStockStatus('Memuat ulang stok...');
    try {
      await fetchProductStockAccounts();
      setStockStatus('Stok diperbarui.', 'success');
    } catch (error) {
      setStockStatus(`Gagal refresh: ${error.message}`);
    }
  });
  document.querySelector('[data-stock-close]')?.addEventListener('click', () => setStockDrawerOpen(false));
  document.querySelector('[data-stock-scrim]')?.addEventListener('click', () => setStockDrawerOpen(false));
  document.querySelector('[data-stock-form]')?.addEventListener('submit', saveStockForm);
  document.querySelector('[data-stock-delete]')?.addEventListener('click', deleteCurrentStockAccount);
  document.querySelector('[data-stock-joined-toggle]')?.addEventListener('click', toggleStockJoinedCustomers);
  document.querySelectorAll('[data-stock-product], [data-stock-account-name]').forEach((input) => {
    input.addEventListener('input', () => updateStockDrawerTitle());
  });
}

async function initProductStock() {
  if (!window.CATSOFT_ADMIN_AUTHORIZED) {
    window.setTimeout(initProductStock, 80);
    return;
  }

  bindProductStock();
  setStockStatus('Memuat stok produk...');

  try {
    await fetchProductStockAccounts();
    setStockStatus('');
  } catch (error) {
    setStockStatus(`Gagal memuat stok: ${error.message}`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductStock);
} else {
  initProductStock();
}
