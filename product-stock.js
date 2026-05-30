if (!window.CATSOFT_ADMIN_AUTHORIZED) {
  throw new Error('Catsoft admin authorization required.');
}

const PRODUCT_STOCK_API = window.CATSOFT_PRODUCT_STOCK_API || getDefaultProductStockApiEndpoint();
const productStockPageSizeOptions = [5, 10, 20, 50];
const productStockAutoRefreshMs = 10000;
let productStockAccounts = [];
let productStockPageSize = 10;
let activeStockDrawerAccount = null;
let isStockJoinedExpanded = false;
let selectedStockIds = new Set();
let productStockAutoRefreshTimerId = null;
let isProductStockFetching = false;
let isProductStockMutating = false;

const stockStatusLabels = {
  active: 'Aktif',
  full: 'Penuh',
  reset: 'Perlu Reset',
  paused: 'Jeda'
};

const stockTypeLabels = {
  account: 'Akun',
  team: 'Tim',
  redeem_code: 'Redeem Code'
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

function formatStockCurrency(value) {
  const amount = Number(value) || 0;
  return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
}

function getStockTeamMemberCount(account) {
  const count = Number(account?.teamMemberCount || account?.team_member_count || 1);
  return Number.isFinite(count) && count > 0 ? Math.round(count) : 1;
}

function getStockCostPerMember(account) {
  if (normalizeStockType(account?.stockType || account?.stock_type) !== 'team') {
    return Number(account?.stockCost || account?.stock_cost || 0);
  }

  return Math.round((Number(account?.stockCost || account?.stock_cost || 0) || 0) / getStockTeamMemberCount(account));
}

function getStockNetProfit(account) {
  return (Number(account?.totalRevenue) || 0) - (Number(account?.stockCost) || 0);
}

function parseStockCurrency(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  const amount = Number(String(value || '').replace(/[^\d]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeStockType(value) {
  const type = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return stockTypeLabels[type] ? type : 'account';
}

function createStockAccountId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `stock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureStockSelectOption(select, value) {
  if (!select || select.tagName !== 'SELECT') {
    return;
  }

  const cleanValue = String(value || '').trim();

  if (!cleanValue) {
    return;
  }

  const hasOption = Array.from(select.options).some((option) => option.value === cleanValue);

  if (!hasOption) {
    const option = document.createElement('option');
    option.value = cleanValue;
    option.textContent = cleanValue;
    select.appendChild(option);
  }
}

function setStockSelectValue(select, value) {
  if (!select) {
    return;
  }

  ensureStockSelectOption(select, value);
  select.value = String(value || '').trim();
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
    id: String(account.id || createStockAccountId()),
    stockType: normalizeStockType(account.stockType || account.stock_type),
    productName: String(account.productName || account.product_name || '').trim(),
    accountName: String(account.accountName || account.account_name || '').trim(),
    accountTarget: String(account.accountTarget || account.account_target || '').trim(),
    loginUsername: String(account.loginUsername || account.login_username || '').trim(),
    loginPassword: String(account.loginPassword || account.login_password || '').trim(),
    stockCost: Number(account.stockCost || account.stock_cost || 0),
    teamMemberCount: getStockTeamMemberCount(account),
    capacity: Number(account.capacity || 7),
    status: stockStatusLabels[account.status] ? account.status : 'active',
    resetAt: String(account.resetAt || account.reset_at || '').slice(0, 10),
    notes: String(account.notes || ''),
    joinedTotal: Number(account.joinedTotal || account.joined_total || 0),
    joinedActive: Number(account.joinedActive || account.joined_active || 0),
    joinedExpired: Number(account.joinedExpired || account.joined_expired || 0),
    joinedProblem: Number(account.joinedProblem || account.joined_problem || 0),
    openSlots: Number(account.openSlots || account.open_slots || 0),
    totalRevenue: Number(account.totalRevenue || account.total_revenue || 0),
    netRevenue: Number(account.netRevenue || account.net_revenue || 0),
    joinedCustomers: Array.isArray(account.joinedCustomers) ? account.joinedCustomers : [],
    createdAt: account.createdAt || account.created_at || '',
    updatedAt: account.updatedAt || account.updated_at || ''
  };
}

function getStockSearchTerm() {
  return normalizeStockValue(document.querySelector('[data-stock-search]')?.value || '');
}

function getStockFilterValue(selector, fallback = 'all') {
  return String(document.querySelector(selector)?.value || fallback).trim();
}

function getActiveStockTypeTab() {
  const activeTab = document.querySelector('[data-stock-type-tab].is-active');
  return activeTab?.dataset.stockTypeTab || 'all';
}

function setActiveStockTypeTab(type = 'all') {
  const nextType = stockTypeLabels[type] ? type : 'all';
  document.querySelectorAll('[data-stock-type-tab]').forEach((button) => {
    const isActive = (button.dataset.stockTypeTab || 'all') === nextType;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function getEffectiveStockTypeFilter() {
  const tabType = getActiveStockTypeTab();
  return tabType !== 'all' ? tabType : getStockFilterValue('[data-stock-filter-type]');
}

function getStockSortValue(account, sortBy) {
  if (sortBy === 'accountName') {
    return normalizeStockValue(account.accountName);
  }

  if (sortBy === 'productName') {
    return normalizeStockValue(account.productName);
  }

  if (sortBy === 'joinedActive') {
    return Number(account.joinedActive) || 0;
  }

  if (sortBy === 'totalRevenue') {
    return Number(account.totalRevenue) || 0;
  }

  if (sortBy === 'resetAt') {
    return account.resetAt ? Date.parse(`${account.resetAt}T00:00:00`) || 0 : 0;
  }

  if (sortBy === 'status') {
    return normalizeStockValue(stockStatusLabels[account.status] || account.status);
  }

  return Date.parse(account.updatedAt || account.createdAt || '') || 0;
}

function compareStockAccounts(first, second, sortBy, direction) {
  const firstValue = getStockSortValue(first, sortBy);
  const secondValue = getStockSortValue(second, sortBy);
  const multiplier = direction === 'asc' ? 1 : -1;

  if (typeof firstValue === 'number' && typeof secondValue === 'number') {
    return (firstValue - secondValue) * multiplier;
  }

  return String(firstValue).localeCompare(String(secondValue), 'id', { numeric: true }) * multiplier;
}

function renderStockFilterOptions() {
  const productSelect = document.querySelector('[data-stock-filter-product]');

  if (!productSelect) {
    return;
  }

  const currentValue = productSelect.value || 'all';
  const products = [...new Set(productStockAccounts.map((account) => account.productName).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, 'id', { numeric: true }));

  const hasCurrent = currentValue === 'all' || products.includes(currentValue);
  productSelect.innerHTML = [
    `<option value="all">Semua Produk</option>`,
    ...products.map((product) => `<option value="${escapeStockHtml(product)}">${escapeStockHtml(product)}</option>`)
  ].join('');
  productSelect.value = hasCurrent ? currentValue : 'all';
}

function getFilteredStockAccounts() {
  const term = getStockSearchTerm();
  const productFilter = getStockFilterValue('[data-stock-filter-product]');
  const typeFilter = getEffectiveStockTypeFilter();
  const statusFilter = getStockFilterValue('[data-stock-filter-status]');
  const sortBy = getStockFilterValue('[data-stock-sort-by]', 'updatedAt');
  const sortDirection = getStockFilterValue('[data-stock-sort-direction]', 'desc');
  let filteredAccounts = [...productStockAccounts];

  if (term) {
    filteredAccounts = filteredAccounts.filter((account) => normalizeStockValue([
      account.productName,
      account.accountName,
      account.loginUsername,
      stockTypeLabels[account.stockType] || '',
      stockStatusLabels[account.status] || account.status
    ].join(' ')).includes(term));
  }

  if (productFilter !== 'all') {
    filteredAccounts = filteredAccounts.filter((account) => account.productName === productFilter);
  }

  if (typeFilter !== 'all') {
    filteredAccounts = filteredAccounts.filter((account) => account.stockType === typeFilter);
  }

  if (statusFilter === 'reset_due') {
    filteredAccounts = filteredAccounts.filter(isStockResetDue);
  } else if (statusFilter !== 'all') {
    filteredAccounts = filteredAccounts.filter((account) => account.status === statusFilter);
  }

  return filteredAccounts.sort((first, second) => compareStockAccounts(first, second, sortBy, sortDirection));
}

function isStockDrawerOpen() {
  return document.body.classList.contains('admin-drawer-open');
}

function pruneSelectedStockIds() {
  const accountIds = new Set(productStockAccounts.map((account) => account.id));
  selectedStockIds.forEach((id) => {
    if (!accountIds.has(id)) {
      selectedStockIds.delete(id);
    }
  });
}

function getVisibleStockAccounts() {
  return getFilteredStockAccounts().slice(0, productStockPageSize);
}

function getVisibleStockIds() {
  return getVisibleStockAccounts().map((account) => account.id);
}

function getSelectedStockAccounts() {
  return productStockAccounts.filter((account) => selectedStockIds.has(account.id));
}

function setStockStatus(message, type = '') {
  const status = document.querySelector('[data-stock-status]');

  if (!status) {
    return;
  }

  status.textContent = message || '';
  status.classList.toggle('success', type === 'success');
}

function setStockSaveState(isSaving) {
  const saveButton = document.querySelector('.stock-drawer .admin-detail-save');

  if (!saveButton) {
    return;
  }

  saveButton.disabled = Boolean(isSaving);
  saveButton.classList.toggle('is-loading', Boolean(isSaving));
  saveButton.textContent = isSaving ? 'Menyimpan...' : 'Simpan';
  saveButton.setAttribute('aria-busy', String(Boolean(isSaving)));
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
  pruneSelectedStockIds();
  renderProductStockAccounts();
}

async function fetchProductStockAccounts(options = {}) {
  if (options.auto && (isProductStockMutating || isStockDrawerOpen())) {
    return productStockAccounts;
  }

  if (isProductStockFetching) {
    return productStockAccounts;
  }

  isProductStockFetching = true;

  try {
    const stockUrl = new URL(PRODUCT_STOCK_API, window.location.href);
    stockUrl.searchParams.set('limit', '300');
    stockUrl.searchParams.set('_', String(Date.now()));

    const response = await fetch(stockUrl.toString(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      throw new Error(`API stok ${response.status}`);
    }

    const data = await response.json();
    productStockAccounts = (Array.isArray(data) ? data : data.accounts || []).map(normalizeStockAccount);
    pruneSelectedStockIds();
    renderProductStockAccounts();
    return productStockAccounts;
  } finally {
    isProductStockFetching = false;
  }
}

async function pushProductStockAccounts(accounts) {
  const response = await fetch(PRODUCT_STOCK_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accounts })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `API stok ${response.status}`);
  }

  return response.json();
}

async function pushProductStockAccount(account) {
  return pushProductStockAccounts([account]);
}

function updateStockBulkState() {
  const toolbar = document.querySelector('[data-stock-bulk-toolbar]');
  const count = document.querySelector('[data-stock-selected-count]');
  const selectAll = document.querySelector('[data-stock-select-visible]');
  const statusSelect = document.querySelector('[data-stock-bulk-status]');
  const applyButton = document.querySelector('[data-stock-bulk-apply]');
  const deleteButton = document.querySelector('[data-stock-bulk-delete]');
  const selectedCount = selectedStockIds.size;
  const visibleIds = getVisibleStockIds();
  const visibleSelected = visibleIds.filter((id) => selectedStockIds.has(id)).length;

  if (toolbar) {
    toolbar.hidden = !getFilteredStockAccounts().length;
    toolbar.classList.toggle('has-selection', selectedCount > 0);
  }

  if (count) {
    count.textContent = `${selectedCount} Dipilih`;
  }

  if (selectAll) {
    selectAll.checked = Boolean(visibleIds.length && visibleSelected === visibleIds.length);
    selectAll.indeterminate = Boolean(visibleSelected && visibleSelected < visibleIds.length);
    selectAll.disabled = !visibleIds.length;
  }

  if (applyButton) {
    applyButton.disabled = !selectedCount || !statusSelect?.value;
  }

  if (deleteButton) {
    deleteButton.disabled = !selectedCount;
  }
}

function toggleVisibleStockSelection(isSelected) {
  getVisibleStockIds().forEach((id) => {
    if (isSelected) {
      selectedStockIds.add(id);
    } else {
      selectedStockIds.delete(id);
    }
  });
  renderProductStockAccounts();
}

async function applyBulkStockStatus() {
  const statusSelect = document.querySelector('[data-stock-bulk-status]');
  const nextStatus = statusSelect?.value || '';
  const selectedAccounts = getSelectedStockAccounts();

  if (!nextStatus || !selectedAccounts.length) {
    updateStockBulkState();
    return;
  }

  isProductStockMutating = true;
  setStockStatus('Memperbarui stok terpilih...');

  try {
    const updatedAt = new Date().toISOString();
    const result = await pushProductStockAccounts(selectedAccounts.map((account) => ({
      ...account,
      status: nextStatus,
      updatedAt
    })));

    if (Array.isArray(result.accounts)) {
      productStockAccounts = result.accounts.map(normalizeStockAccount);
    } else {
      mergeProductStockAccounts(selectedAccounts.map((account) => ({ ...account, status: nextStatus, updatedAt })));
    }

    selectedStockIds.clear();
    if (statusSelect) statusSelect.value = '';
    pruneSelectedStockIds();
    renderProductStockAccounts();
    setStockStatus('Bulk action selesai.', 'success');
  } catch (error) {
    setStockStatus(`Gagal bulk action: ${error.message}`);
  } finally {
    isProductStockMutating = false;
  }
}

async function deleteSelectedStockAccounts() {
  const selectedAccounts = getSelectedStockAccounts();

  if (!selectedAccounts.length) {
    updateStockBulkState();
    return;
  }

  const shouldDelete = window.confirm(`Hapus ${selectedAccounts.length} akun stok terpilih?`);
  if (!shouldDelete) {
    return;
  }

  isProductStockMutating = true;
  setStockStatus('Menghapus stok terpilih...');

  try {
    const result = await pushProductStockAccounts(selectedAccounts.map((account) => ({
      id: account.id,
      deleted: true
    })));

    if (Array.isArray(result.accounts)) {
      productStockAccounts = result.accounts.map(normalizeStockAccount);
    } else {
      productStockAccounts = productStockAccounts.filter((account) => !selectedStockIds.has(account.id));
    }

    selectedStockIds.clear();
    pruneSelectedStockIds();
    renderProductStockAccounts();
    setStockStatus('Stok terpilih dihapus.', 'success');
  } catch (error) {
    setStockStatus(`Gagal menghapus: ${error.message}`);
  } finally {
    isProductStockMutating = false;
  }
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
  const costTotal = document.querySelector('[data-stock-cost-total]');
  const profitTotal = document.querySelector('[data-stock-profit-total]');

  if (!list) {
    return;
  }

  renderStockFilterOptions();

  const visible = getFilteredStockAccounts();
  const paged = visible.slice(0, productStockPageSize);
  const visibleCost = visible.reduce((sum, account) => sum + (Number(account.stockCost) || 0), 0);
  const visibleProfit = visible.reduce((sum, account) => sum + getStockNetProfit(account), 0);

  if (total) total.textContent = String(visible.length);
  if (reset) reset.textContent = String(visible.filter(isStockResetDue).length);
  if (costTotal) costTotal.textContent = formatStockCurrency(visibleCost);
  if (profitTotal) {
    profitTotal.textContent = formatStockCurrency(visibleProfit);
    profitTotal.closest('div')?.classList.toggle('is-negative', visibleProfit < 0);
  }

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
    updateStockBulkState();
    return;
  }

  const rows = paged.map((account) => {
    const usageText = `${account.joinedActive}/${account.capacity}`;
    const resetText = isStockResetDue(account) ? 'Perlu Reset' : formatStockDate(account.resetAt);
    const statusText = stockStatusLabels[account.status] || 'Aktif';
    const typeText = stockTypeLabels[account.stockType] || 'Akun';
    const typeDetail = account.stockType === 'team'
      ? `Tim ${getStockTeamMemberCount(account)} anggota`
      : typeText;
    const costDetail = account.stockType === 'team'
      ? `Biaya ${formatStockCurrency(account.stockCost)} · ${formatStockCurrency(getStockCostPerMember(account))}/anggota`
      : `Biaya ${formatStockCurrency(account.stockCost)}`;
    const isSelected = selectedStockIds.has(account.id);
    const joinedDetail = account.joinedExpired
      ? `${account.joinedExpired} Habis`
      : `${account.openSlots} Slot Kosong`;

    return `
      <div class="admin-spectrum-row stock-spectrum-row ${isSelected ? 'is-selected' : ''}" role="row">
        <span class="admin-spectrum-check stock-row-leading">
          <label class="stock-row-select" aria-label="Pilih ${escapeStockHtml(account.accountName)}">
            <input type="checkbox" data-select-stock="${escapeStockHtml(account.id)}" ${isSelected ? 'checked' : ''} />
            <span aria-hidden="true"></span>
          </label>
          <span class="admin-spectrum-avatar stock" aria-hidden="true">${escapeStockHtml(getStockInitials(account.productName))}</span>
        </span>
        <span class="admin-spectrum-name">
          <span><strong>${escapeStockHtml(account.accountName)}</strong><small>${escapeStockHtml(account.productName)} · ${escapeStockHtml(typeDetail)}</small></span>
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
          <b>${escapeStockHtml(formatStockCurrency(account.totalRevenue))}</b>
          <small>${escapeStockHtml(costDetail)}</small>
        </span>
        <span>
          <b>${escapeStockHtml(statusText)}</b>
          <small>${escapeStockHtml(resetText)}</small>
        </span>
        <span class="admin-spectrum-row-actions">
          <button class="admin-spectrum-open stock-edit-button" type="button" data-open-stock="${escapeStockHtml(account.id)}" aria-label="Edit ${escapeStockHtml(account.accountName)}"><span>Edit</span></button>
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
        <span>Penghasilan</span>
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

  list.querySelectorAll('[data-select-stock]').forEach((input) => {
    input.addEventListener('click', (event) => event.stopPropagation());
    input.addEventListener('change', (event) => {
      const id = event.currentTarget.dataset.selectStock;
      if (!id) return;

      if (event.currentTarget.checked) {
        selectedStockIds.add(id);
      } else {
        selectedStockIds.delete(id);
      }

      event.currentTarget.closest('.stock-spectrum-row')?.classList.toggle('is-selected', event.currentTarget.checked);
      updateStockBulkState();
    });
  });

  list.querySelector('[data-stock-page-size]')?.addEventListener('change', (event) => {
    productStockPageSize = Number(event.target.value) || 10;
    renderProductStockAccounts();
  });

  updateStockBulkState();
}

function setStockDrawerOpen(isOpen) {
  const drawer = document.querySelector('[data-stock-drawer]');
  const scrim = document.querySelector('[data-stock-scrim]');

  if (drawer) drawer.hidden = !isOpen;
  if (scrim) scrim.hidden = !isOpen;
  document.body.classList.toggle('admin-drawer-open', isOpen);
  window.dispatchEvent(new Event('resize'));
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

function getDefaultStockTypeForDrawer() {
  const activeType = getActiveStockTypeTab();
  return stockTypeLabels[activeType] ? activeType : 'account';
}

function updateStockTypeFields() {
  const type = normalizeStockType(document.querySelector('[data-stock-type]')?.value || 'account');
  const teamField = document.querySelector('[data-stock-team-field]');
  const teamInput = document.querySelector('[data-stock-team-members]');
  const capacityInput = document.querySelector('[data-stock-capacity]');
  const productSelect = document.querySelector('[data-stock-product]');
  const accountNameInput = document.querySelector('[data-stock-account-name]');
  const loginUsernameInput = document.querySelector('[data-stock-login-username]');

  if (teamField) {
    teamField.hidden = type !== 'team';
  }

  if (type === 'team') {
    if (teamInput && (!Number(teamInput.value) || Number(teamInput.value) < 1)) {
      teamInput.value = '10';
    }

    if (capacityInput && (!Number(capacityInput.value) || capacityInput.value === '7')) {
      capacityInput.value = String(Number(teamInput?.value || 10) || 10);
    }

    if (accountNameInput && !accountNameInput.value.trim()) {
      accountNameInput.placeholder = 'ChatGPT Business Team';
    }
  } else if (type === 'redeem_code') {
    if (!productSelect?.value || productSelect.value === 'ChatGPT') {
      setStockSelectValue(productSelect, 'Redeem Code');
    }

    if (capacityInput && (!Number(capacityInput.value) || capacityInput.value === '7')) {
      capacityInput.value = '1';
    }

    if (accountNameInput) {
      accountNameInput.placeholder = 'Batch Redeem Code';
    }

    if (loginUsernameInput) {
      loginUsernameInput.placeholder = 'Kode redeem atau batch';
    }
  } else {
    if (accountNameInput) {
      accountNameInput.placeholder = 'ChatGPT Sharing 1';
    }

    if (loginUsernameInput) {
      loginUsernameInput.placeholder = '';
    }
  }
}

function resetStockForm() {
  const form = document.querySelector('[data-stock-form]');
  if (!form) return;
  form.reset();
  setStockSaveState(false);
  activeStockDrawerAccount = null;
  isStockJoinedExpanded = false;
  const defaultType = getDefaultStockTypeForDrawer();
  document.querySelector('[data-stock-id]').value = '';
  document.querySelector('[data-stock-capacity]').value = defaultType === 'team' ? '10' : (defaultType === 'redeem_code' ? '1' : '7');
  document.querySelector('[data-stock-team-members]').value = defaultType === 'team' ? '10' : '1';
  document.querySelector('[data-stock-type]').value = defaultType;
  setStockSelectValue(document.querySelector('[data-stock-product]'), defaultType === 'redeem_code' ? 'Redeem Code' : 'ChatGPT');
  document.querySelector('[data-stock-cost]').value = 'Rp 0';
  document.querySelector('[data-stock-status-field]').value = 'active';
  document.querySelector('[data-stock-delete-section]').hidden = true;
  updateStockTypeFields();
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
          <small>${escapeStockHtml(formatStockCurrency(customer.incomeAmount || 0))} · ${escapeStockHtml(formatStockDate(customer.expiryDate))}</small>
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
    setStockSelectValue(document.querySelector('[data-stock-product]'), account.productName);
    document.querySelector('[data-stock-type]').value = account.stockType;
    document.querySelector('[data-stock-account-name]').value = account.accountName;
    document.querySelector('[data-stock-login-username]').value = account.loginUsername;
    document.querySelector('[data-stock-login-password]').value = account.loginPassword;
    document.querySelector('[data-stock-cost]').value = formatStockCurrency(account.stockCost);
    document.querySelector('[data-stock-team-members]').value = getStockTeamMemberCount(account);
    document.querySelector('[data-stock-capacity]').value = account.capacity;
    document.querySelector('[data-stock-status-field]').value = account.status;
    document.querySelector('[data-stock-reset-at]').value = account.resetAt;
    document.querySelector('[data-stock-notes]').value = account.notes;
    document.querySelector('[data-stock-delete-section]').hidden = false;
    updateStockTypeFields();
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
    id: id || createStockAccountId(),
    stockType: document.querySelector('[data-stock-type]').value,
    productName: document.querySelector('[data-stock-product]').value.trim(),
    accountName: document.querySelector('[data-stock-account-name]').value.trim(),
    accountTarget: '',
    loginUsername: document.querySelector('[data-stock-login-username]').value.trim(),
    loginPassword: document.querySelector('[data-stock-login-password]').value.trim(),
    stockCost: parseStockCurrency(document.querySelector('[data-stock-cost]').value || ''),
    teamMemberCount: Number(document.querySelector('[data-stock-team-members]')?.value || 1),
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

  if (isProductStockMutating) {
    return;
  }

  const values = getStockFormValues();

  if (!values.productName || !values.accountName) {
    setStockStatus('Produk dan nama akun stok wajib diisi.');
    return;
  }

  setStockStatus('Menyimpan stok produk...');
  isProductStockMutating = true;
  setStockSaveState(true);

  try {
    const result = await pushProductStockAccount(values);
    if (Array.isArray(result.accounts)) {
      productStockAccounts = result.accounts.map(normalizeStockAccount);
      pruneSelectedStockIds();
      renderProductStockAccounts();
    } else {
      const savedAccounts = Array.isArray(result.saved) && result.saved.length ? result.saved : [values];
      mergeProductStockAccounts(savedAccounts);
      await fetchProductStockAccounts();
    }
    setStockStatus('Stok produk tersimpan.', 'success');
    setStockDrawerOpen(false);
  } catch (error) {
    setStockStatus(`Gagal menyimpan: ${error.message}`);
  } finally {
    isProductStockMutating = false;
    setStockSaveState(false);
  }
}

async function deleteCurrentStockAccount() {
  const id = document.querySelector('[data-stock-id]').value;

  if (!id) {
    return;
  }

  setStockStatus('Menghapus akun stok...');
  isProductStockMutating = true;

  try {
    await deleteProductStockAccount(id);
    productStockAccounts = productStockAccounts.filter((account) => account.id !== id);
    selectedStockIds.delete(id);
    renderProductStockAccounts();
    await fetchProductStockAccounts({ silent: true });
    setStockStatus('Akun stok dihapus.', 'success');
    setStockDrawerOpen(false);
  } catch (error) {
    setStockStatus(`Gagal menghapus: ${error.message}`);
  } finally {
    isProductStockMutating = false;
  }
}

function autoRefreshProductStock() {
  if (document.hidden) {
    return;
  }

  fetchProductStockAccounts({ auto: true, silent: true }).catch(() => {});
}

function startProductStockAutoRefresh() {
  if (productStockAutoRefreshTimerId) {
    window.clearInterval(productStockAutoRefreshTimerId);
  }

  productStockAutoRefreshTimerId = window.setInterval(autoRefreshProductStock, productStockAutoRefreshMs);
}

function bindProductStock() {
  document.querySelector('[data-stock-search]')?.addEventListener('input', renderProductStockAccounts);
  document.querySelectorAll('[data-stock-type-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.stockTypeTab || 'all';
      const typeSelect = document.querySelector('[data-stock-filter-type]');
      setActiveStockTypeTab(type);
      if (typeSelect) {
        typeSelect.value = type === 'all' ? 'all' : type;
      }
      selectedStockIds.clear();
      renderProductStockAccounts();
    });
  });
  document.querySelectorAll('[data-stock-filter-product], [data-stock-filter-type], [data-stock-filter-status], [data-stock-sort-by], [data-stock-sort-direction]').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.matches('[data-stock-filter-type]')) {
        setActiveStockTypeTab(input.value || 'all');
      }
      selectedStockIds.clear();
      renderProductStockAccounts();
    });
  });
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
  document.querySelector('[data-stock-select-visible]')?.addEventListener('change', (event) => {
    toggleVisibleStockSelection(event.currentTarget.checked);
  });
  document.querySelector('[data-stock-bulk-status]')?.addEventListener('change', updateStockBulkState);
  document.querySelector('[data-stock-bulk-apply]')?.addEventListener('click', applyBulkStockStatus);
  document.querySelector('[data-stock-bulk-delete]')?.addEventListener('click', deleteSelectedStockAccounts);
  document.querySelector('[data-stock-close]')?.addEventListener('click', () => setStockDrawerOpen(false));
  document.querySelector('[data-stock-scrim]')?.addEventListener('click', () => setStockDrawerOpen(false));
  document.querySelector('[data-stock-form]')?.addEventListener('submit', saveStockForm);
  document.querySelector('[data-stock-delete]')?.addEventListener('click', deleteCurrentStockAccount);
  document.querySelector('[data-stock-joined-toggle]')?.addEventListener('click', toggleStockJoinedCustomers);
  document.querySelector('[data-stock-type]')?.addEventListener('change', () => {
    updateStockTypeFields();
    updateStockDrawerTitle();
  });
  document.querySelector('[data-stock-team-members]')?.addEventListener('input', (event) => {
    const capacityInput = document.querySelector('[data-stock-capacity]');
    if (document.querySelector('[data-stock-type]')?.value === 'team' && capacityInput && (!Number(capacityInput.value) || capacityInput.value === '10')) {
      capacityInput.value = String(Number(event.target.value || 10) || 10);
    }
  });
  document.querySelectorAll('[data-stock-product], [data-stock-account-name]').forEach((input) => {
    input.addEventListener('input', () => updateStockDrawerTitle());
    input.addEventListener('change', () => updateStockDrawerTitle());
  });
  document.querySelector('[data-stock-cost]')?.addEventListener('blur', (event) => {
    event.target.value = formatStockCurrency(parseStockCurrency(event.target.value));
  });
  window.addEventListener('focus', autoRefreshProductStock);
  document.addEventListener('visibilitychange', autoRefreshProductStock);
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
    startProductStockAutoRefresh();
  } catch (error) {
    setStockStatus(`Gagal memuat stok: ${error.message}`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductStock);
} else {
  initProductStock();
}
