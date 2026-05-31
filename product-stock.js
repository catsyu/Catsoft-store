if (!window.CATSOFT_ADMIN_AUTHORIZED) {
  throw new Error('Catsoft admin authorization required.');
}

const PRODUCT_STOCK_API = window.CATSOFT_PRODUCT_STOCK_API || getDefaultProductStockApiEndpoint();
const CUSTOMER_RECORDS_API = window.CATSOFT_CUSTOMER_RECORDS_API || getDefaultCustomerRecordsApiEndpoint();
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
let stockTeamMemberDrafts = [];
let stockTeamMemberOriginalIds = new Set();

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

function getDefaultCustomerRecordsApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage || hostname !== 'catsoft.store') {
    return 'https://catsoft.store/api/customer-records';
  }

  return '/api/customer-records';
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

function escapeStockSelector(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(String(value || ''));
  }

  return String(value || '').replace(/["\\]/g, '\\$&');
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

function getTeamMemberAccounts(parentStockId) {
  const cleanParentId = String(parentStockId || '').trim();
  if (!cleanParentId) {
    return [];
  }

  return productStockAccounts
    .filter((account) => account.parentStockId === cleanParentId)
    .sort((first, second) => {
      const firstIndex = Number(first.teamMemberIndex) || 0;
      const secondIndex = Number(second.teamMemberIndex) || 0;
      return firstIndex - secondIndex || first.accountName.localeCompare(second.accountName, 'id', { numeric: true });
    });
}

function getParentTeamAccount(parentStockId) {
  const cleanParentId = String(parentStockId || '').trim();
  if (!cleanParentId) {
    return null;
  }

  return productStockAccounts.find((account) => account.id === cleanParentId && account.stockType === 'team') || null;
}

function getAvailableTeamAccounts(excludedId = '') {
  const cleanExcludedId = String(excludedId || '').trim();
  return productStockAccounts
    .filter((account) => account.stockType === 'team' && account.id !== cleanExcludedId)
    .sort((first, second) => first.accountName.localeCompare(second.accountName, 'id', { numeric: true }));
}

function getNextTeamMemberIndex(parentStockId) {
  return getTeamMemberAccounts(parentStockId)
    .reduce((max, account) => Math.max(max, Number(account.teamMemberIndex) || 0), 0) + 1;
}

function getTeamMemberDisplayName(parentAccount, index) {
  const baseName = String(parentAccount?.accountName || parentAccount?.productName || 'Member Tim').trim();
  return `${baseName} ${index}`;
}

function createTeamMemberDraft(parentAccount = null, overrides = {}) {
  const index = Number(overrides.teamMemberIndex) || stockTeamMemberDrafts.length + 1;
  const parentCost = Number(parentAccount?.stockCost) || parseStockCurrency(document.querySelector('[data-stock-cost]')?.value || '');
  const parentMemberCount = Math.max(
    Number(parentAccount?.teamMemberCount) || Number(document.querySelector('[data-stock-team-members]')?.value || 1) || 1,
    1
  );
  const defaultCost = Math.round(parentCost / parentMemberCount);
  const defaultCapacity = Number(parentAccount?.capacity || document.querySelector('[data-stock-capacity]')?.value || 7) || 7;

  return {
    id: overrides.id || createStockAccountId(),
    draftKey: overrides.draftKey || overrides.id || createStockAccountId(),
    parentStockId: overrides.parentStockId || parentAccount?.id || '',
    teamMemberIndex: index,
    stockType: 'account',
    productName: overrides.productName || parentAccount?.productName || document.querySelector('[data-stock-product]')?.value || '',
    accountName: overrides.accountName || getTeamMemberDisplayName(parentAccount, index),
    loginUsername: overrides.loginUsername || '',
    loginPassword: overrides.loginPassword || '',
    stockCost: Number(overrides.stockCost || defaultCost || 0),
    stockDate: overrides.stockDate || parentAccount?.stockDate || document.querySelector('[data-stock-date]')?.value || getStockToday(),
    capacity: Number(overrides.capacity || defaultCapacity || 1),
    status: overrides.status || parentAccount?.status || 'active',
    resetAt: overrides.resetAt || parentAccount?.resetAt || '',
    notes: overrides.notes || ''
  };
}

function getStockDisplayMetrics(account, visibleAccounts = productStockAccounts) {
  const children = account?.stockType === 'team' ? getTeamMemberAccounts(account.id) : [];
  const visibleIds = new Set((visibleAccounts || []).map((item) => item.id));
  const visibleChildren = children.filter((child) => visibleIds.has(child.id));
  const activeChildren = visibleChildren.length ? visibleChildren : children;

  if (account?.stockType === 'team' && activeChildren.length) {
    const capacity = activeChildren.reduce((sum, child) => sum + (Number(child.capacity) || 0), 0);
    const joinedActive = activeChildren.reduce((sum, child) => sum + (Number(child.joinedActive) || 0), 0);
    const joinedExpired = activeChildren.reduce((sum, child) => sum + (Number(child.joinedExpired) || 0), 0);
    const openSlots = activeChildren.reduce((sum, child) => sum + (Number(child.openSlots) || 0), 0);
    const totalRevenue = activeChildren.reduce((sum, child) => sum + (Number(child.totalRevenue) || 0), 0);

    return {
      capacity: capacity || Number(account.capacity) || 0,
      joinedActive,
      joinedExpired,
      openSlots,
      totalRevenue
    };
  }

  return {
    capacity: Number(account?.capacity) || 0,
    joinedActive: Number(account?.joinedActive) || 0,
    joinedExpired: Number(account?.joinedExpired) || 0,
    openSlots: Number(account?.openSlots) || 0,
    totalRevenue: Number(account?.totalRevenue) || 0
  };
}

function getStockCostForTotals(account, visibleAccounts = productStockAccounts) {
  const visibleIds = new Set((visibleAccounts || []).map((item) => item.id));

  if (account?.parentStockId && visibleIds.has(account.parentStockId)) {
    return 0;
  }

  return Number(account?.stockCost) || 0;
}

function getStockProfitForTotals(account, visibleAccounts = productStockAccounts) {
  const visibleIds = new Set((visibleAccounts || []).map((item) => item.id));

  if (account?.parentStockId && visibleIds.has(account.parentStockId)) {
    return 0;
  }

  const metrics = getStockDisplayMetrics(account, visibleAccounts);
  return (Number(metrics.totalRevenue) || 0) - (Number(account?.stockCost) || 0);
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

function getStockToday() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function getStockMonthValue(value) {
  return String(value || '').slice(0, 7);
}

function getStockAccountDate(account) {
  return String(account?.stockDate || account?.stock_date || account?.createdAt || account?.created_at || '').slice(0, 10);
}

function isStockResetDue(account) {
  const resetAt = String(account.resetAt || '').slice(0, 10);
  return account.status === 'reset' || Boolean(resetAt && resetAt <= getStockToday());
}

function isStockResetToday(account) {
  const resetAt = String(account.resetAt || '').slice(0, 10);
  return Boolean(resetAt && resetAt === getStockToday());
}

function isStockResetOverdue(account) {
  const resetAt = String(account.resetAt || '').slice(0, 10);
  return account.status === 'reset' || Boolean(resetAt && resetAt < getStockToday());
}

function normalizeStockAccount(account) {
  return {
    id: String(account.id || createStockAccountId()),
    parentStockId: String(account.parentStockId || account.parent_stock_id || '').trim(),
    teamMemberIndex: Number(account.teamMemberIndex || account.team_member_index || 0),
    stockType: normalizeStockType(account.stockType || account.stock_type),
    productName: String(account.productName || account.product_name || '').trim(),
    accountName: String(account.accountName || account.account_name || '').trim(),
    accountTarget: String(account.accountTarget || account.account_target || '').trim(),
    loginUsername: String(account.loginUsername || account.login_username || '').trim(),
    loginPassword: String(account.loginPassword || account.login_password || '').trim(),
    stockDate: getStockAccountDate(account),
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

  if (sortBy === 'stockDate') {
    return account.stockDate ? Date.parse(`${account.stockDate}T00:00:00`) || 0 : 0;
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

function getFilteredStockAccounts(options = {}) {
  const term = getStockSearchTerm();
  const productFilter = getStockFilterValue('[data-stock-filter-product]');
  const typeFilter = getEffectiveStockTypeFilter();
  const statusFilter = getStockFilterValue('[data-stock-filter-status]');
  const monthFilter = getStockFilterValue('[data-stock-filter-month]', '');
  const sortBy = getStockFilterValue('[data-stock-sort-by]', 'updatedAt');
  const sortDirection = getStockFilterValue('[data-stock-sort-direction]', 'desc');
  let filteredAccounts = [...productStockAccounts];

  if (term) {
    filteredAccounts = filteredAccounts.filter((account) => normalizeStockValue([
      account.productName,
      account.accountName,
      account.loginUsername,
      account.stockDate,
      getParentTeamAccount(account.parentStockId)?.accountName || '',
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

  if (!options.ignoreStatus) {
    if (statusFilter === 'reset_today') {
      filteredAccounts = filteredAccounts.filter(isStockResetToday);
    } else if (statusFilter === 'reset_overdue') {
      filteredAccounts = filteredAccounts.filter(isStockResetOverdue);
    } else if (statusFilter === 'reset_due') {
      filteredAccounts = filteredAccounts.filter(isStockResetDue);
    } else if (statusFilter !== 'all') {
      filteredAccounts = filteredAccounts.filter((account) => account.status === statusFilter);
    }
  }

  if (monthFilter) {
    filteredAccounts = filteredAccounts.filter((account) => getStockMonthValue(getStockAccountDate(account)) === monthFilter);
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
    const monthFilter = getStockFilterValue('[data-stock-filter-month]', '');
    stockUrl.searchParams.set('limit', '300');
    if (monthFilter) {
      stockUrl.searchParams.set('month', monthFilter);
    }
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

function buildCustomerRecordsApiUrl(id = '', params = {}) {
  const url = new URL(CUSTOMER_RECORDS_API, window.location.href);

  if (id) {
    url.pathname = `${url.pathname.replace(/\/$/, '')}/${encodeURIComponent(id)}`;
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value).trim());
    }
  });

  url.searchParams.set('_', String(Date.now()));
  return url.toString();
}

function normalizeStockOrderNumber(value) {
  return String(value || '').trim().replace(/\s+/g, '').toLowerCase();
}

async function findCustomerRecordByJoinQuery(query) {
  const cleanQuery = normalizeStockOrderNumber(query);
  const rawQuery = String(query || '').trim();

  if (!cleanQuery) {
    return null;
  }

  const response = await fetch(buildCustomerRecordsApiUrl('', {
    limit: 1,
    lookup: rawQuery
  }), {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
  });

  if (!response.ok) {
    throw new Error(`API customer ${response.status}`);
  }

  const payload = await response.json();
  const records = Array.isArray(payload) ? payload : (payload.records || payload.results || []);
  return records[0] || null;
}

async function patchCustomerRecordStock(record, targetAccount) {
  const recordId = String(record?.id || '').trim();

  if (!recordId) {
    throw new Error('Data customer tidak memiliki ID.');
  }

  const stockAccount = getStockJoinSaveValue(targetAccount);
  const response = await fetch(buildCustomerRecordsApiUrl(recordId), {
    method: 'PATCH',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stockAccount,
      productName: targetAccount.productName || record.productName || '',
      updatedAt: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `API customer ${response.status}`);
  }

  return response.json();
}

function getStockJoinSaveValue(account) {
  return String(account?.loginUsername || account?.accountName || account?.id || '').trim();
}

function getStockJoinTargetAccount(account) {
  if (!account) {
    return null;
  }

  if (account.stockType !== 'team') {
    return account;
  }

  const members = getTeamMemberAccounts(account.id);
  const withSlots = members.find((member) => (Number(member.openSlots) || 0) > 0);
  return withSlots || members[0] || account;
}

function isCustomerJoinedToStock(record, account) {
  const currentStock = normalizeStockValue(record?.stockAccount || record?.stock_account || '');

  if (!currentStock || !account) {
    return false;
  }

  const stockTargets = account.stockType === 'team'
    ? [account, ...getTeamMemberAccounts(account.id)]
    : [account];

  return stockTargets.some((target) => [
    target.id,
    target.accountName,
    target.loginUsername,
    target.accountTarget
  ].some((value) => normalizeStockValue(value) === currentStock));
}

function setStockJoinStatus(message = '', type = '') {
  const status = document.querySelector('[data-stock-join-status]');

  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle('success', type === 'success');
  status.classList.toggle('warning', type === 'warning');
}

async function addJoinedCustomerByOrder(event) {
  event.preventDefault();

  if (isProductStockMutating || !activeStockDrawerAccount) {
    return;
  }

  const input = document.querySelector('[data-stock-join-order]');
  const lookupQuery = input?.value || '';
  const targetAccount = getStockJoinTargetAccount(activeStockDrawerAccount);

  if (!normalizeStockOrderNumber(lookupQuery)) {
    setStockJoinStatus('Isi nomor pesanan, nomor HP, atau username.');
    input?.focus();
    return;
  }

  if (!targetAccount) {
    setStockJoinStatus('Simpan stok terlebih dulu sebelum menambah customer.');
    return;
  }

  isProductStockMutating = true;
  setStockJoinStatus('Mencari customer...');

  try {
    const record = await findCustomerRecordByJoinQuery(lookupQuery);

    if (!record) {
      setStockJoinStatus('Customer tidak ditemukan di database.');
      return;
    }

    if (isCustomerJoinedToStock(record, activeStockDrawerAccount)) {
      setStockJoinStatus('Customer sudah terhubung ke stok ini.', 'warning');
      return;
    }

    setStockJoinStatus('Menghubungkan customer...');
    await patchCustomerRecordStock(record, targetAccount);
    await fetchProductStockAccounts({ silent: true });
    activeStockDrawerAccount = productStockAccounts.find((item) => item.id === activeStockDrawerAccount.id) || activeStockDrawerAccount;
    isStockJoinedExpanded = true;
    renderJoinedCustomers(activeStockDrawerAccount);
    if (input) input.value = '';
    setStockJoinStatus(`Customer ${record.customerName || record.orderNumber || 'terpilih'} ditambahkan.`, 'success');
  } catch (error) {
    setStockJoinStatus(`Gagal menambah customer: ${error.message}`);
  } finally {
    isProductStockMutating = false;
  }
}

function toggleJoinedCustomerEditor(customerId) {
  const editor = document.querySelector(`[data-stock-join-editor="${escapeStockSelector(customerId)}"]`);

  if (!editor) {
    return;
  }

  editor.hidden = !editor.hidden;
}

async function unlinkJoinedCustomer(customerId) {
  if (isProductStockMutating || !customerId) {
    return;
  }

  isProductStockMutating = true;
  setStockJoinStatus('Melepas customer dari stok...');

  try {
    const response = await fetch(buildCustomerRecordsApiUrl(customerId), {
      method: 'PATCH',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stockAccount: '',
        updatedAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `API customer ${response.status}`);
    }

    await fetchProductStockAccounts({ silent: true });
    activeStockDrawerAccount = productStockAccounts.find((item) => item.id === activeStockDrawerAccount?.id) || activeStockDrawerAccount;
    isStockJoinedExpanded = true;
    renderJoinedCustomers(activeStockDrawerAccount);
    setStockJoinStatus('Customer dilepas dari stok.', 'success');
  } catch (error) {
    setStockJoinStatus(`Gagal melepas customer: ${error.message}`);
  } finally {
    isProductStockMutating = false;
  }
}

function renderProductStockAccounts() {
  const list = document.querySelector('[data-stock-list]');
  const total = document.querySelector('[data-stock-total]');
  const reset = document.querySelector('[data-stock-reset]');
  const costTotal = document.querySelector('[data-stock-cost-total]');
  const profitTotal = document.querySelector('[data-stock-profit-total]');
  const resetToday = document.querySelector('[data-stock-reset-today]');
  const resetOverdue = document.querySelector('[data-stock-reset-overdue]');

  if (!list) {
    return;
  }

  renderStockFilterOptions();

  const visible = getFilteredStockAccounts();
  const visibleResetBase = getFilteredStockAccounts({ ignoreStatus: true });
  const paged = visible.slice(0, productStockPageSize);
  const visibleCost = visible.reduce((sum, account) => sum + getStockCostForTotals(account, visible), 0);
  const visibleProfit = visible.reduce((sum, account) => sum + getStockProfitForTotals(account, visible), 0);

  if (total) total.textContent = String(visible.length);
  if (reset) reset.textContent = String(visible.filter(isStockResetDue).length);
  if (resetToday) resetToday.textContent = String(visibleResetBase.filter(isStockResetToday).length);
  if (resetOverdue) resetOverdue.textContent = String(visibleResetBase.filter(isStockResetOverdue).length);
  if (costTotal) costTotal.textContent = formatStockCurrency(visibleCost);
  if (profitTotal) {
    profitTotal.textContent = formatStockCurrency(visibleProfit);
    profitTotal.closest('div')?.classList.toggle('is-negative', visibleProfit < 0);
  }

  const statusFilter = getStockFilterValue('[data-stock-filter-status]');
  document.querySelectorAll('[data-stock-reset-filter]').forEach((button) => {
    const isActive = button.dataset.stockResetFilter === statusFilter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

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
    const metrics = getStockDisplayMetrics(account, visible);
    const parentTeam = getParentTeamAccount(account.parentStockId);
    const usageText = `${metrics.joinedActive}/${metrics.capacity}`;
    const resetText = isStockResetDue(account) ? 'Perlu Reset' : formatStockDate(account.resetAt);
    const stockDateText = formatStockDate(getStockAccountDate(account));
    const statusText = stockStatusLabels[account.status] || 'Aktif';
    const typeText = stockTypeLabels[account.stockType] || 'Akun';
    const typeDetail = account.stockType === 'team'
      ? `Tim ${getStockTeamMemberCount(account)} anggota`
      : parentTeam
        ? `Member Tim · ${parentTeam.accountName}`
      : typeText;
    const costDetail = account.stockType === 'team'
      ? `Biaya ${formatStockCurrency(account.stockCost)} · ${formatStockCurrency(getStockCostPerMember(account))}/anggota`
      : parentTeam
        ? `Biaya member ${formatStockCurrency(account.stockCost)}`
      : `Biaya ${formatStockCurrency(account.stockCost)}`;
    const isSelected = selectedStockIds.has(account.id);
    const joinedDetail = metrics.joinedExpired
      ? `${metrics.joinedExpired} Habis`
      : `${metrics.openSlots} Slot Kosong`;

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
          <b>${escapeStockHtml(formatStockCurrency(metrics.totalRevenue))}</b>
          <small>${escapeStockHtml(costDetail)}</small>
        </span>
        <span>
          <b>${escapeStockHtml(statusText)}</b>
          <small>${escapeStockHtml(`${resetText} · Stok ${stockDateText}`)}</small>
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

function renderParentTeamOptions(selectedParentId = '', currentId = '') {
  const select = document.querySelector('[data-stock-parent-team]');
  if (!select) {
    return;
  }

  const teams = getAvailableTeamAccounts(currentId);
  const cleanSelectedId = String(selectedParentId || '').trim();
  select.innerHTML = [
    '<option value="">Tidak Terhubung</option>',
    ...teams.map((team) => `<option value="${escapeStockHtml(team.id)}">${escapeStockHtml(team.accountName)}</option>`)
  ].join('');

  select.value = teams.some((team) => team.id === cleanSelectedId) ? cleanSelectedId : '';
}

function updateStockTypeFields() {
  const type = normalizeStockType(document.querySelector('[data-stock-type]')?.value || 'account');
  const teamField = document.querySelector('[data-stock-team-field]');
  const teamMembersSection = document.querySelector('[data-stock-team-members-section]');
  const parentTeamField = document.querySelector('[data-stock-parent-team-field]');
  const teamInput = document.querySelector('[data-stock-team-members]');
  const capacityInput = document.querySelector('[data-stock-capacity]');
  const productSelect = document.querySelector('[data-stock-product]');
  const accountNameInput = document.querySelector('[data-stock-account-name]');
  const loginUsernameInput = document.querySelector('[data-stock-login-username]');
  const currentId = document.querySelector('[data-stock-id]')?.value || '';

  if (teamField) {
    teamField.hidden = type !== 'team';
  }

  if (teamMembersSection) {
    teamMembersSection.hidden = type !== 'team';
  }

  if (parentTeamField) {
    parentTeamField.hidden = type !== 'account';
  }

  renderParentTeamOptions(document.querySelector('[data-stock-parent-team]')?.value || '', currentId);

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
    renderTeamMemberRows();
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

function syncTeamMemberDraftFromInput(event) {
  const input = event.currentTarget;
  const key = input.dataset.teamMemberKey;
  const field = input.dataset.teamMemberField;
  const draft = stockTeamMemberDrafts.find((item) => item.draftKey === key);

  if (!draft || !field) {
    return;
  }

  if (field === 'capacity' || field === 'stockCost') {
    draft[field] = field === 'stockCost' ? parseStockCurrency(input.value) : Number(input.value || 1);
  } else {
    draft[field] = input.value;
  }
}

function removeTeamMemberDraft(key) {
  stockTeamMemberDrafts = stockTeamMemberDrafts.filter((draft) => draft.draftKey !== key);
  renderTeamMemberRows();
}

function addTeamMemberDraft() {
  const parentAccount = getStockFormValues();
  const nextIndex = stockTeamMemberDrafts.reduce((max, draft) => Math.max(max, Number(draft.teamMemberIndex) || 0), 0) + 1;
  stockTeamMemberDrafts.push(createTeamMemberDraft(parentAccount, { teamMemberIndex: nextIndex }));
  const teamInput = document.querySelector('[data-stock-team-members]');

  if (teamInput && Number(teamInput.value || 0) < stockTeamMemberDrafts.length) {
    teamInput.value = String(stockTeamMemberDrafts.length);
  }

  renderTeamMemberRows();
}

function renderTeamMemberRows() {
  const list = document.querySelector('[data-stock-team-member-list]');
  if (!list) {
    return;
  }

  if (!stockTeamMemberDrafts.length) {
    list.innerHTML = '<p class="stock-team-members-empty">Belum ada member. Klik Tambah Member untuk membuat akun stok individu dari tim ini.</p>';
    return;
  }

  list.innerHTML = stockTeamMemberDrafts.map((member, index) => {
    const key = escapeStockHtml(member.draftKey);
    return `
      <div class="stock-team-member-row">
        <span class="stock-team-member-number">${index + 1}</span>
        <label>
          Nama Member
          <input type="text" data-team-member-key="${key}" data-team-member-field="accountName" value="${escapeStockHtml(member.accountName)}" placeholder="Member ${index + 1}" />
        </label>
        <label>
          Username
          <input type="text" data-team-member-key="${key}" data-team-member-field="loginUsername" value="${escapeStockHtml(member.loginUsername)}" placeholder="email atau username" />
        </label>
        <label>
          Password
          <input type="text" data-team-member-key="${key}" data-team-member-field="loginPassword" value="${escapeStockHtml(member.loginPassword)}" placeholder="password login" />
        </label>
        <label>
          Kapasitas
          <input type="number" min="1" max="500" step="1" data-team-member-key="${key}" data-team-member-field="capacity" value="${escapeStockHtml(member.capacity)}" />
        </label>
        <button class="stock-team-member-remove" type="button" data-remove-team-member="${key}" aria-label="Hapus member ${index + 1}">×</button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-team-member-field]').forEach((input) => {
    input.addEventListener('input', syncTeamMemberDraftFromInput);
    input.addEventListener('change', syncTeamMemberDraftFromInput);
    if (input.dataset.teamMemberField === 'stockCost') {
      input.addEventListener('blur', (event) => {
        event.target.value = formatStockCurrency(parseStockCurrency(event.target.value));
      });
    }
  });

  list.querySelectorAll('[data-remove-team-member]').forEach((button) => {
    button.addEventListener('click', () => removeTeamMemberDraft(button.dataset.removeTeamMember));
  });
}

function applyLinkedTeamDefaults() {
  const type = normalizeStockType(document.querySelector('[data-stock-type]')?.value || 'account');
  const parentTeam = getParentTeamAccount(document.querySelector('[data-stock-parent-team]')?.value || '');

  if (type !== 'account' || !parentTeam) {
    return;
  }

  const productSelect = document.querySelector('[data-stock-product]');
  const costInput = document.querySelector('[data-stock-cost]');

  setStockSelectValue(productSelect, parentTeam.productName);
  if (costInput) {
    costInput.value = formatStockCurrency(getStockCostPerMember(parentTeam));
  }
}

function resetStockForm() {
  const form = document.querySelector('[data-stock-form]');
  if (!form) return;
  form.reset();
  setStockSaveState(false);
  activeStockDrawerAccount = null;
  isStockJoinedExpanded = false;
  stockTeamMemberDrafts = [];
  stockTeamMemberOriginalIds = new Set();
  const defaultType = getDefaultStockTypeForDrawer();
  document.querySelector('[data-stock-id]').value = '';
  document.querySelector('[data-stock-capacity]').value = defaultType === 'team' ? '10' : (defaultType === 'redeem_code' ? '1' : '7');
  document.querySelector('[data-stock-team-members]').value = defaultType === 'team' ? '10' : '1';
  document.querySelector('[data-stock-type]').value = defaultType;
  setStockSelectValue(document.querySelector('[data-stock-product]'), defaultType === 'redeem_code' ? 'Redeem Code' : 'ChatGPT');
  document.querySelector('[data-stock-cost]').value = 'Rp 0';
  document.querySelector('[data-stock-date]').value = getStockToday();
  renderParentTeamOptions('', '');
  document.querySelector('[data-stock-status-field]').value = 'active';
  document.querySelector('[data-stock-delete-section]').hidden = true;
  updateStockTypeFields();
  renderTeamMemberRows();
  renderJoinedCustomers(null);
  updateStockDrawerTitle();
}

function renderJoinedCustomers(account) {
  const summary = document.querySelector('[data-stock-joined-summary]');
  const list = document.querySelector('[data-stock-joined-list]');

  if (!summary || !list) {
    return;
  }

  const metrics = getStockDisplayMetrics(account);
  const capacity = metrics.capacity || account?.capacity || 7;
  const activeTotal = metrics.joinedActive || 0;
  summary.textContent = `${activeTotal}/${capacity} Aktif`;
  summary.disabled = !account;
  summary.setAttribute('aria-expanded', String(Boolean(account && isStockJoinedExpanded)));
  summary.classList.toggle('is-open', Boolean(account && isStockJoinedExpanded));
  list.hidden = !account || !isStockJoinedExpanded;

  if (!account) {
    list.innerHTML = '';
    return;
  }

  const searchForm = `
    <form class="stock-join-search" data-stock-join-search>
      <label>
        Tambah Customer
        <span class="stock-join-search-row">
          <input type="search" data-stock-join-order placeholder="No. pesanan, HP, atau username" autocomplete="off" />
          <button class="admin-spectrum-secondary" type="submit">Tambah</button>
        </span>
      </label>
      <small data-stock-join-status></small>
    </form>
  `;
  const joinedCustomers = account.stockType === 'team'
    ? [
      ...(account.joinedCustomers || []).map((customer) => ({
        ...customer,
        stockMemberName: account.accountName
      })),
      ...getTeamMemberAccounts(account.id).flatMap((member) => (member.joinedCustomers || []).map((customer) => ({
        ...customer,
        stockMemberName: member.accountName
      })))
    ].filter((customer, index, customers) => {
      const key = customer.id || `${customer.orderNumber || ''}-${customer.activatedEmail || ''}`;
      return customers.findIndex((item) => (item.id || `${item.orderNumber || ''}-${item.activatedEmail || ''}`) === key) === index;
    })
    : account.joinedCustomers;

  if (!joinedCustomers.length) {
    list.innerHTML = `${searchForm}<p>Belum ada customer yang terhubung. Cari nomor pesanan, nomor HP, atau username untuk menambah customer ke stok ini.</p>`;
    list.querySelector('[data-stock-join-search]')?.addEventListener('submit', addJoinedCustomerByOrder);
    return;
  }

  list.innerHTML = searchForm + joinedCustomers.map((customer) => {
    const statusText = customer.isExpired ? 'Habis' : (customer.status === 'problem' ? 'Bermasalah' : 'Aktif');
    const customerId = escapeStockHtml(customer.id || '');
    return `
      <div class="stock-joined-row" data-stock-joined-row="${customerId}">
        <span class="admin-spectrum-avatar stock-customer" aria-hidden="true">${escapeStockHtml(getStockInitials(customer.customerName || customer.activatedEmail))}</span>
        <span>
          <strong>${escapeStockHtml(customer.customerName || 'Customer')}</strong>
          <small>${escapeStockHtml(customer.orderNumber || customer.activatedEmail || 'Tanpa order')}</small>
        </span>
        <span>
          <b>${escapeStockHtml(statusText)}</b>
          <small>${escapeStockHtml(customer.stockMemberName ? `${customer.stockMemberName} · ` : '')}${escapeStockHtml(formatStockCurrency(customer.incomeAmount || 0))} · ${escapeStockHtml(formatStockDate(customer.expiryDate))}</small>
        </span>
        <button class="stock-joined-edit-toggle" type="button" data-stock-edit-join="${customerId}" aria-label="Edit customer ${escapeStockHtml(customer.customerName || customer.orderNumber || '')}">Ubah</button>
        <div class="stock-joined-edit" data-stock-join-editor="${customerId}" hidden>
          <span>Customer ini terhubung lewat field Stok di database customer.</span>
          <button class="admin-spectrum-secondary" type="button" data-stock-unlink-customer="${customerId}">Lepas Dari Stok</button>
        </div>
      </div>
    `;
  }).join('');

  list.querySelector('[data-stock-join-search]')?.addEventListener('submit', addJoinedCustomerByOrder);
  list.querySelectorAll('[data-stock-edit-join]').forEach((button) => {
    button.addEventListener('click', () => toggleJoinedCustomerEditor(button.dataset.stockEditJoin));
  });
  list.querySelectorAll('[data-stock-unlink-customer]').forEach((button) => {
    button.addEventListener('click', () => unlinkJoinedCustomer(button.dataset.stockUnlinkCustomer));
  });
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
    renderParentTeamOptions(account.parentStockId, account.id);
    document.querySelector('[data-stock-parent-team]').value = account.parentStockId || '';
    document.querySelector('[data-stock-account-name]').value = account.accountName;
    document.querySelector('[data-stock-login-username]').value = account.loginUsername;
    document.querySelector('[data-stock-login-password]').value = account.loginPassword;
    document.querySelector('[data-stock-cost]').value = formatStockCurrency(account.stockCost);
    document.querySelector('[data-stock-date]').value = getStockAccountDate(account);
    document.querySelector('[data-stock-team-members]').value = getStockTeamMemberCount(account);
    document.querySelector('[data-stock-capacity]').value = account.capacity;
    document.querySelector('[data-stock-status-field]').value = account.status;
    document.querySelector('[data-stock-reset-at]').value = account.resetAt;
    document.querySelector('[data-stock-notes]').value = account.notes;
    document.querySelector('[data-stock-delete-section]').hidden = false;
    stockTeamMemberDrafts = account.stockType === 'team'
      ? getTeamMemberAccounts(account.id).map((member) => ({
        ...member,
        draftKey: member.id,
        stockCost: Number(member.stockCost) || getStockCostPerMember(account)
      }))
      : [];
    stockTeamMemberOriginalIds = new Set(stockTeamMemberDrafts.map((member) => member.id).filter(Boolean));
    updateStockTypeFields();
    renderTeamMemberRows();
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
  const idInput = document.querySelector('[data-stock-id]');
  let id = idInput?.value || '';
  if (!id) {
    id = createStockAccountId();
    if (idInput) idInput.value = id;
  }
  const now = new Date().toISOString();
  const existing = productStockAccounts.find((account) => account.id === id);

  return {
    ...(existing || {}),
    id,
    parentStockId: document.querySelector('[data-stock-parent-team]')?.value || '',
    stockType: document.querySelector('[data-stock-type]').value,
    productName: document.querySelector('[data-stock-product]').value.trim(),
    accountName: document.querySelector('[data-stock-account-name]').value.trim(),
    accountTarget: '',
    loginUsername: document.querySelector('[data-stock-login-username]').value.trim(),
    loginPassword: document.querySelector('[data-stock-login-password]').value.trim(),
    stockCost: parseStockCurrency(document.querySelector('[data-stock-cost]').value || ''),
    stockDate: document.querySelector('[data-stock-date]').value || getStockToday(),
    teamMemberCount: Number(document.querySelector('[data-stock-team-members]')?.value || 1),
    capacity: Number(document.querySelector('[data-stock-capacity]').value || 7),
    status: document.querySelector('[data-stock-status-field]').value,
    resetAt: document.querySelector('[data-stock-reset-at]').value,
    notes: document.querySelector('[data-stock-notes]').value.trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
}

function buildStockSavePayload(values) {
  const now = new Date().toISOString();
  const existing = productStockAccounts.find((account) => account.id === values.id);

  if (values.stockType === 'team') {
    const memberCount = Math.max(Number(values.teamMemberCount) || 1, stockTeamMemberDrafts.length || 0, 1);
    const memberCost = Math.round((Number(values.stockCost) || 0) / memberCount);
    const parentAccount = {
      ...values,
      parentStockId: '',
      teamMemberIndex: 0,
      teamMemberCount: memberCount,
      capacity: Number(values.capacity) || 1,
      updatedAt: now
    };

    const memberAccounts = stockTeamMemberDrafts.map((draft, index) => ({
      ...draft,
      id: draft.id || createStockAccountId(),
      parentStockId: values.id,
      teamMemberIndex: index + 1,
      stockType: 'account',
      productName: values.productName,
      accountName: String(draft.accountName || '').trim() || getTeamMemberDisplayName(parentAccount, index + 1),
      accountTarget: '',
      loginUsername: String(draft.loginUsername || '').trim(),
      loginPassword: String(draft.loginPassword || '').trim(),
      stockCost: memberCost,
      stockDate: values.stockDate,
      teamMemberCount: 1,
      capacity: Number(draft.capacity || values.capacity || 1) || 1,
      status: draft.status || values.status,
      resetAt: draft.resetAt || values.resetAt,
      notes: draft.notes || '',
      createdAt: draft.createdAt || now,
      updatedAt: now
    }));

    const activeMemberIds = new Set(memberAccounts.map((member) => member.id));
    const removedMembers = [...stockTeamMemberOriginalIds]
      .filter((id) => !activeMemberIds.has(id))
      .map((id) => ({ id, deleted: true }));

    return [parentAccount, ...memberAccounts, ...removedMembers];
  }

  const parentTeam = values.stockType === 'account' ? getParentTeamAccount(values.parentStockId) : null;
  const shouldDeleteOldMembers = existing?.stockType === 'team' ? getTeamMemberAccounts(existing.id).map((member) => ({
    id: member.id,
    deleted: true
  })) : [];

  const account = {
    ...values,
    parentStockId: values.stockType === 'account' ? values.parentStockId : '',
    teamMemberIndex: values.parentStockId
      ? (existing?.parentStockId === values.parentStockId && existing?.teamMemberIndex
        ? existing.teamMemberIndex
        : getNextTeamMemberIndex(values.parentStockId))
      : 0,
    productName: parentTeam ? parentTeam.productName : values.productName,
    stockCost: parentTeam ? getStockCostPerMember(parentTeam) : values.stockCost,
    stockDate: values.stockDate,
    teamMemberCount: 1,
    updatedAt: now
  };

  if (!parentTeam) {
    return [account, ...shouldDeleteOldMembers];
  }

  const linkedCount = getTeamMemberAccounts(parentTeam.id).filter((member) => member.id !== account.id).length + 1;
  const updatedParentTeam = {
    ...parentTeam,
    teamMemberCount: Math.max(getStockTeamMemberCount(parentTeam), linkedCount),
    updatedAt: now
  };

  return [updatedParentTeam, account, ...shouldDeleteOldMembers];
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
    const savePayload = buildStockSavePayload(values);
    const result = await pushProductStockAccounts(savePayload);
    if (Array.isArray(result.accounts)) {
      productStockAccounts = result.accounts.map(normalizeStockAccount);
      pruneSelectedStockIds();
      renderProductStockAccounts();
    } else {
      const savedAccounts = Array.isArray(result.saved) && result.saved.length ? result.saved : savePayload.filter((account) => !account.deleted);
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
  document.querySelectorAll('[data-stock-filter-product], [data-stock-filter-type], [data-stock-filter-status], [data-stock-filter-month], [data-stock-sort-by], [data-stock-sort-direction]').forEach((input) => {
    input.addEventListener('change', async () => {
      if (input.matches('[data-stock-filter-type]')) {
        setActiveStockTypeTab(input.value || 'all');
      }
      selectedStockIds.clear();
      if (input.matches('[data-stock-filter-month]')) {
        try {
          await fetchProductStockAccounts({ silent: true });
        } catch (error) {
          setStockStatus(`Gagal memfilter bulan: ${error.message}`);
        }
        return;
      }
      renderProductStockAccounts();
    });
  });
  document.querySelectorAll('[data-stock-reset-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const statusSelect = document.querySelector('[data-stock-filter-status]');
      const nextStatus = button.dataset.stockResetFilter || 'all';
      if (statusSelect) {
        statusSelect.value = statusSelect.value === nextStatus ? 'all' : nextStatus;
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
  document.querySelector('[data-stock-add-team-member]')?.addEventListener('click', addTeamMemberDraft);
  document.querySelector('[data-stock-parent-team]')?.addEventListener('change', () => {
    applyLinkedTeamDefaults();
    updateStockDrawerTitle();
  });
  document.querySelector('[data-stock-type]')?.addEventListener('change', () => {
    updateStockTypeFields();
    applyLinkedTeamDefaults();
    updateStockDrawerTitle();
  });
  document.querySelector('[data-stock-team-members]')?.addEventListener('input', (event) => {
    const capacityInput = document.querySelector('[data-stock-capacity]');
    if (document.querySelector('[data-stock-type]')?.value === 'team' && capacityInput && (!Number(capacityInput.value) || capacityInput.value === '10')) {
      capacityInput.value = String(Number(event.target.value || 10) || 10);
    }
    renderTeamMemberRows();
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
