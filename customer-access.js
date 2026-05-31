const CUSTOMER_ACCESS_API = window.CATSOFT_CUSTOMER_ACCOUNTS_API || getDefaultCustomerAccessApiEndpoint();

function getCatsoftSharedEmailDomains() {
  const sharedDomains = typeof window.getCatsoftEmailDomains === 'function'
    ? window.getCatsoftEmailDomains()
    : window.CATSOFT_EMAIL_DOMAINS;

  const fallbackDomains = [
    'catsoft.store',
    'catsoft.digital',
    'catsoft.online',
    'ask1q2.uk',
    'fadisa1.uk',
    'gasddqw1.uk',
    'kulamusic.us',
    'wkwkksks.uk'
  ];

  const domains = Array.isArray(sharedDomains) && sharedDomains.length ? sharedDomains : fallbackDomains;

  return domains
    .map((domain) => String(domain || '').trim().toLowerCase())
    .filter(Boolean)
    .filter((domain, index, list) => list.indexOf(domain) === index);
}

const CUSTOMER_EMAIL_DOMAINS = getCatsoftSharedEmailDomains();
const CUSTOMER_INBOX_PRESETS = [
  { value: 'all', label: 'Semua Email Masuk' },
  { value: 'openai', label: 'OpenAI / ChatGPT' },
  { value: 'adobe', label: 'Adobe' },
  { value: 'canva', label: 'Canva' },
  { value: 'support', label: 'Support' },
  { value: 'office', label: 'Office' },
  ...CUSTOMER_EMAIL_DOMAINS.map((domain) => ({
    value: domain,
    label: `Domain ${domain}`
  }))
];

let customerAccessAccounts = [];
let customerAccessPageSize = 10;
let customerAccessSaving = false;

function getDefaultCustomerAccessApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage || hostname !== 'catsoft.store') {
    return 'https://catsoft.store/api/customer-accounts';
  }

  return '/api/customer-accounts';
}

function normalizeCustomerAccessValue(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeCustomerAccessRules(account) {
  const modernRules = Array.isArray(account.inboxRules) ? account.inboxRules : [];
  const snakeRules = Array.isArray(account.inbox_rules) ? account.inbox_rules : [];
  const legacyRecipients = Array.isArray(account.inboxRecipients) ? account.inboxRecipients : [];

  return [...modernRules, ...snakeRules, ...legacyRecipients]
    .map(normalizeCustomerAccessValue)
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function escapeCustomerAccessHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCustomerAccessInitials(username) {
  const parts = String(username || 'CU').replace(/[^a-z0-9._ -]/gi, ' ').split(/\s+|[._-]+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : String(username || 'CU').replace(/[^a-z0-9]/gi, '').slice(0, 2);
  return (initials || 'CU').toUpperCase();
}

function generateCustomerAccessPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    bytes.forEach((_, index) => {
      bytes[index] = Math.floor(Math.random() * 255);
    });
  }

  return `CS-${[...bytes].map((byte) => alphabet[byte % alphabet.length]).join('')}`;
}

function formatCustomerAccessDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Belum Ada Aktivitas';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function normalizeCustomerAccessAccount(account) {
  return {
    username: String(account.username || '').trim(),
    password: String(account.password || ''),
    passwordHash: String(account.passwordHash || account.password_hash || ''),
    status: normalizeCustomerAccessValue(account.status) === 'inactive' ? 'inactive' : 'active',
    inboxAccessAll: Boolean(account.inboxAccessAll || account.inbox_access_all),
    inboxRules: normalizeCustomerAccessRules(account),
    sourceRecordId: account.sourceRecordId || account.source_record_id || '',
    recordCount: Number(account.recordCount || account.record_count || 0),
    lastRecordAt: account.lastRecordAt || account.last_record_at || '',
    createdAt: account.createdAt || account.created_at || new Date().toISOString(),
    updatedAt: account.updatedAt || account.updated_at || new Date().toISOString()
  };
}

function getCustomerSearchTerm() {
  return normalizeCustomerAccessValue(document.querySelector('[data-customer-access-search]')?.value || '');
}

function getFilteredCustomerAccounts() {
  const term = getCustomerSearchTerm();

  if (!term) {
    return [...customerAccessAccounts];
  }

  return customerAccessAccounts.filter((account) => normalizeCustomerAccessValue([
    account.username,
    account.password,
    account.status,
    account.inboxAccessAll ? 'semua email masuk' : '',
    ...account.inboxRules
  ].join(' ')).includes(term));
}

function setCustomerAccessStatus(message, type = '') {
  const status = document.querySelector('[data-customer-access-status]');

  if (!status) {
    return;
  }

  status.textContent = message || '';
  status.classList.toggle('success', type === 'success');
}

async function fetchCustomerAccounts() {
  const response = await fetch(`${CUSTOMER_ACCESS_API}?_=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' }
  });

  if (!response.ok) {
    throw new Error(`API customer ${response.status}`);
  }

  const data = await response.json();
  customerAccessAccounts = (Array.isArray(data) ? data : data.accounts || []).map(normalizeCustomerAccessAccount);
  renderCustomerAccounts();
  return customerAccessAccounts;
}

async function pushCustomerAccounts(accounts) {
  const response = await fetch(CUSTOMER_ACCESS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accounts: accounts.map((account) => ({
        ...normalizeCustomerAccessAccount(account),
        originalUsername: account.originalUsername || account.original_username || account.username,
        deleted: Boolean(account.deleted)
      }))
    })
  });

  if (!response.ok) {
    throw new Error(`API customer ${response.status}`);
  }

  return response.json().catch(() => ({}));
}

function renderInboxPresetChecks() {
  const root = document.querySelector('[data-customer-inbox-presets]');

  if (!root || root.dataset.rendered === 'true') {
    return;
  }

  root.dataset.rendered = 'true';
  root.innerHTML = CUSTOMER_INBOX_PRESETS.map((preset) => `
    <label ${preset.value === 'all' ? '' : 'data-customer-inbox-detail'}>
      <input type="checkbox" name="customerInboxPresets" value="${escapeCustomerAccessHtml(preset.value)}" />
      <span class="admin-check-icon" aria-hidden="true">✓</span>
      <span class="admin-check-text">${escapeCustomerAccessHtml(preset.label)}</span>
    </label>
  `).join('');
}

function renderCustomerAccounts() {
  const list = document.querySelector('[data-customer-access-list]');
  const count = document.querySelector('[data-customer-access-count]');

  if (!list) {
    return;
  }

  const visible = getFilteredCustomerAccounts();
  const paged = visible.slice(0, customerAccessPageSize);

  if (count) {
    count.textContent = String(visible.length);
  }

  if (!visible.length) {
    list.innerHTML = `
      <div class="admin-spectrum-empty">
        <div>
          <h3>Belum Ada Customer</h3>
          <span>Sync dari database untuk membuat akun customer otomatis.</span>
        </div>
      </div>
    `;
    updateCustomerDeleteSelectedState();
    return;
  }

  const rows = paged.map((account) => {
    const inboxText = account.inboxAccessAll
      ? 'Email Penuh'
      : account.inboxRules.length
        ? 'Email Terbatas'
        : 'Customer Center';
    const inboxDetail = account.inboxAccessAll
      ? 'Semua Inbox'
      : account.inboxRules.length
        ? account.inboxRules.join(', ')
        : `${account.recordCount} Data Customer`;

    return `
      <div class="admin-spectrum-row customer-spectrum-row" data-edit-customer="${escapeCustomerAccessHtml(account.username)}" role="row">
        <span class="admin-spectrum-check"><input type="checkbox" name="selectedCustomer" value="${escapeCustomerAccessHtml(account.username)}" aria-label="Pilih ${escapeCustomerAccessHtml(account.username)}" /></span>
        <span class="admin-spectrum-name">
          <span class="admin-spectrum-avatar customer" aria-hidden="true">${escapeCustomerAccessHtml(getCustomerAccessInitials(account.username))}</span>
          <span><strong>${escapeCustomerAccessHtml(account.username)}</strong><small>${escapeCustomerAccessHtml(account.recordCount)} Data Customer</small></span>
        </span>
        <button class="admin-spectrum-open" type="button" data-open-customer="${escapeCustomerAccessHtml(account.username)}" aria-label="Buka Detail ${escapeCustomerAccessHtml(account.username)}"></button>
        <span>${escapeCustomerAccessHtml(account.username)}</span>
        <span>${escapeCustomerAccessHtml(account.status === 'inactive' ? 'Nonaktif' : inboxText)}<small>${escapeCustomerAccessHtml(inboxDetail)}</small></span>
      </div>
    `;
  }).join('');

  list.innerHTML = `
    <div class="admin-spectrum-table customer-spectrum-table" role="grid" aria-label="Daftar Customer">
      <div class="admin-spectrum-row is-heading" role="row">
        <span><input type="checkbox" id="customerSelectAll" aria-label="Pilih Semua Customer" /></span>
        <span>Nama</span>
        <span></span>
        <span>Username</span>
        <span>Akses Customer</span>
      </div>
      ${rows}
    </div>
    <div class="admin-spectrum-pager">
      <div class="admin-spectrum-page-buttons" aria-label="Navigasi Halaman Customer">
        <button class="admin-spectrum-page-nav is-prev" type="button" disabled aria-label="Halaman Sebelumnya"><span>Sebelumnya</span></button>
        <button class="admin-spectrum-page-nav is-next" type="button" disabled aria-label="Halaman Berikutnya"><span>Berikutnya</span></button>
      </div>
      <label class="admin-spectrum-page-size">
        <span>Item Per Halaman</span>
        <select id="customerPageSize">
          ${[5, 10, 20, 50].map((size) => `<option value="${size}" ${customerAccessPageSize === size ? 'selected' : ''}>${size}</option>`).join('')}
        </select>
      </label>
      <span class="admin-spectrum-page-count">${paged.length ? `1-${paged.length}` : '0'} Dari ${visible.length}</span>
    </div>
  `;

  list.querySelectorAll('[data-open-customer]').forEach((button) => {
    button.addEventListener('click', () => openCustomerDrawer(button.dataset.openCustomer));
  });

  list.querySelectorAll('input[name="selectedCustomer"]').forEach((input) => {
    input.addEventListener('change', updateCustomerDeleteSelectedState);
  });

  const selectAll = document.getElementById('customerSelectAll');
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      document.querySelectorAll('input[name="selectedCustomer"]').forEach((input) => {
        input.checked = selectAll.checked;
      });
      updateCustomerDeleteSelectedState();
    });
  }

  const pageSize = document.getElementById('customerPageSize');
  if (pageSize) {
    pageSize.addEventListener('change', () => {
      customerAccessPageSize = Number(pageSize.value) || 10;
      renderCustomerAccounts();
    });
  }

  updateCustomerDeleteSelectedState();
}

function updateCustomerDeleteSelectedState() {
  const deleteButton = document.querySelector('[data-customer-delete-selected]');

  if (!deleteButton) {
    return;
  }

  deleteButton.disabled = !document.querySelector('input[name="selectedCustomer"]:checked');
}

function setCustomerDrawerOpen(isOpen) {
  const drawer = document.querySelector('[data-customer-access-drawer]');
  const scrim = document.querySelector('[data-customer-access-scrim]');

  if (drawer) {
    drawer.hidden = !isOpen;
  }

  if (scrim) {
    scrim.hidden = !isOpen;
  }

  document.body.classList.toggle('admin-drawer-open', isOpen);
}

function updateCustomerDrawerTitle(label = 'Tambah Akses') {
  const username = document.querySelector('[data-customer-username]');
  const title = document.querySelector('[data-customer-drawer-title]');
  const avatar = document.querySelector('[data-customer-drawer-avatar]');
  const value = username && username.value.trim() ? username.value.trim() : label;

  if (title) title.textContent = value;
  if (avatar) avatar.textContent = getCustomerAccessInitials(value);
}

function resetCustomerAccessForm() {
  const form = document.querySelector('[data-customer-access-form]');

  if (!form) {
    return;
  }

  form.reset();
  document.querySelector('[data-customer-original-username]').value = '';
  document.querySelector('[data-customer-username]').value = '';
  document.querySelector('[data-customer-password]').value = generateCustomerAccessPassword();
  document.querySelector('[data-customer-status]').value = 'active';
  document.querySelector('[data-customer-record-count]').textContent = 'Akses Manual';
  document.querySelector('[data-customer-last-record]').textContent = 'Belum Terhubung Ke Database Customer';
  document.querySelectorAll('input[name="customerInboxPresets"]').forEach((input) => {
    input.checked = false;
  });

  const textarea = document.querySelector('[data-customer-inbox-rules]');
  if (textarea) {
    textarea.value = '';
  }

  updateCustomerInboxAccessVisibility();
  updateCustomerDrawerTitle('Tambah Akses');
}

function updateCustomerInboxAccessVisibility() {
  const allInput = document.querySelector('input[name="customerInboxPresets"][value="all"]');
  const showDetails = !allInput?.checked;

  document.querySelectorAll('[data-customer-inbox-detail]').forEach((element) => {
    element.classList.toggle('is-hidden', !showDetails);
  });

  if (allInput?.checked) {
    document.querySelectorAll('input[name="customerInboxPresets"]:not([value="all"])').forEach((input) => {
      input.checked = false;
    });
    const textarea = document.querySelector('[data-customer-inbox-rules]');
    if (textarea) textarea.value = '';
  }
}

function handleCustomerInboxPresetChange(changedInput) {
  const allInput = document.querySelector('input[name="customerInboxPresets"][value="all"]');

  if (changedInput.value === 'all' && changedInput.checked) {
    document.querySelectorAll('input[name="customerInboxPresets"]:not([value="all"])').forEach((input) => {
      input.checked = false;
    });
    const textarea = document.querySelector('[data-customer-inbox-rules]');
    if (textarea) textarea.value = '';
  } else if (changedInput.value !== 'all' && changedInput.checked && allInput) {
    allInput.checked = false;
  }

  updateCustomerInboxAccessVisibility();
}

function openCustomerDrawer(username) {
  const account = customerAccessAccounts.find((item) => normalizeCustomerAccessValue(item.username) === normalizeCustomerAccessValue(username));

  if (!account) {
    return;
  }

  renderInboxPresetChecks();
  document.querySelector('[data-customer-original-username]').value = account.username;
  document.querySelector('[data-customer-username]').value = account.username;
  document.querySelector('[data-customer-password]').value = account.password;
  document.querySelector('[data-customer-status]').value = account.status;
  document.querySelector('[data-customer-record-count]').textContent = `${account.recordCount} Data Customer`;
  document.querySelector('[data-customer-last-record]').textContent = `Aktivitas Terakhir ${formatCustomerAccessDate(account.lastRecordAt)}`;

  const presetValues = CUSTOMER_INBOX_PRESETS.map((preset) => preset.value);
  document.querySelectorAll('input[name="customerInboxPresets"]').forEach((input) => {
    input.checked = input.value === 'all' ? account.inboxAccessAll : account.inboxRules.includes(input.value);
  });
  document.querySelector('[data-customer-inbox-rules]').value = account.inboxRules
    .filter((rule) => !presetValues.includes(rule))
    .join('\n');

  updateCustomerInboxAccessVisibility();
  updateCustomerDrawerTitle(account.username);
  setCustomerDrawerOpen(true);
}

function openNewCustomerDrawer() {
  renderInboxPresetChecks();
  resetCustomerAccessForm();
  setCustomerDrawerOpen(true);
  setCustomerAccessStatus('');
  document.querySelector('[data-customer-username]')?.focus();
}

function getCustomerAccountFormValues() {
  const presetRules = [...document.querySelectorAll('input[name="customerInboxPresets"]:checked')].map((input) => input.value);
  const customRules = document.querySelector('[data-customer-inbox-rules]').value
    .split(/\n|,/)
    .map(normalizeCustomerAccessValue)
    .filter(Boolean);
  const inboxRules = [...presetRules, ...customRules]
    .map(normalizeCustomerAccessValue)
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);

  return {
    originalUsername: document.querySelector('[data-customer-original-username]').value,
    username: document.querySelector('[data-customer-username]').value.trim(),
    password: document.querySelector('[data-customer-password]').value,
    status: document.querySelector('[data-customer-status]').value,
    inboxAccessAll: inboxRules.includes('all'),
    inboxRules: inboxRules.filter((rule) => rule !== 'all')
  };
}

async function saveCustomerAccountForm(event) {
  event.preventDefault();
  if (customerAccessSaving) {
    return;
  }

  customerAccessSaving = true;
  const saveButton = document.querySelector('[data-customer-save]');
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = 'Menyimpan';
  }

  try {
    const values = getCustomerAccountFormValues();
    const existing = values.originalUsername
      ? customerAccessAccounts.find((item) => normalizeCustomerAccessValue(item.username) === normalizeCustomerAccessValue(values.originalUsername))
      : null;
    const usernameTaken = customerAccessAccounts.some((item) => (
      normalizeCustomerAccessValue(item.username) === normalizeCustomerAccessValue(values.username)
      && normalizeCustomerAccessValue(item.username) !== normalizeCustomerAccessValue(values.originalUsername)
    ));

    if (!values.username || !values.password) {
      setCustomerAccessStatus('Username dan password wajib diisi.');
      return;
    }

    if (usernameTaken) {
      setCustomerAccessStatus('Username customer sudah terdaftar. Buka data tersebut untuk mengedit.');
      return;
    }

    const nextAccount = normalizeCustomerAccessAccount({
      ...(existing || {}),
      ...values,
      sourceRecordId: existing ? existing.sourceRecordId : '',
      recordCount: existing ? existing.recordCount : 0,
      lastRecordAt: existing ? existing.lastRecordAt : '',
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    const nextAccounts = customerAccessAccounts
      .filter((item) => normalizeCustomerAccessValue(item.username) !== normalizeCustomerAccessValue(values.originalUsername))
      .concat(nextAccount);

    setCustomerAccessStatus('Menyimpan customer...');
    await pushCustomerAccounts([{ ...nextAccount, originalUsername: values.originalUsername || nextAccount.username }]);
    customerAccessAccounts = nextAccounts;
    renderCustomerAccounts();
    setCustomerAccessStatus('Customer tersimpan dan tersinkron.', 'success');
    setCustomerDrawerOpen(false);
  } catch (error) {
    setCustomerAccessStatus(`Gagal menyimpan: ${error.message}`);
  } finally {
    customerAccessSaving = false;
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = 'Simpan';
    }
  }
}

async function deleteSelectedCustomers() {
  const selected = [...document.querySelectorAll('input[name="selectedCustomer"]:checked')].map((input) => input.value);

  if (!selected.length) {
    return;
  }

  const deletedPayload = selected.map((username) => ({ username, originalUsername: username, password: 'deleted', deleted: true }));
  const selectedSet = new Set(selected.map(normalizeCustomerAccessValue));
  setCustomerAccessStatus('Menghapus customer...');

  try {
    await pushCustomerAccounts(deletedPayload);
    customerAccessAccounts = customerAccessAccounts.filter((account) => !selectedSet.has(normalizeCustomerAccessValue(account.username)));
    renderCustomerAccounts();
    setCustomerAccessStatus('Customer dihapus dan tersinkron.', 'success');
  } catch (error) {
    setCustomerAccessStatus(`Gagal menghapus: ${error.message}`);
  }
}

function bindCustomerAccess() {
  renderInboxPresetChecks();
  document.querySelector('[data-customer-access-search]')?.addEventListener('input', renderCustomerAccounts);
  document.querySelector('[data-customer-add-access]')?.addEventListener('click', openNewCustomerDrawer);
  document.querySelector('[data-customer-access-sync]')?.addEventListener('click', async () => {
    setCustomerAccessStatus('Menyinkronkan akun dari database...');
    try {
      await fetchCustomerAccounts();
      setCustomerAccessStatus('Akun customer tersinkron.', 'success');
    } catch (error) {
      setCustomerAccessStatus(`Gagal sync: ${error.message}`);
    }
  });
  document.querySelector('[data-customer-delete-selected]')?.addEventListener('click', deleteSelectedCustomers);
  document.querySelector('[data-customer-save]')?.addEventListener('click', () => {
    const form = document.querySelector('[data-customer-access-form]');
    if (typeof form?.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });
  document.querySelector('[data-customer-access-form]')?.addEventListener('submit', saveCustomerAccountForm);
  document.querySelector('[data-customer-drawer-close]')?.addEventListener('click', () => setCustomerDrawerOpen(false));
  document.querySelector('[data-customer-access-scrim]')?.addEventListener('click', () => setCustomerDrawerOpen(false));
  document.querySelector('[data-customer-username]')?.addEventListener('input', () => updateCustomerDrawerTitle('Tambah Akses'));
  document.querySelectorAll('input[name="customerInboxPresets"]').forEach((input) => {
    input.addEventListener('change', () => handleCustomerInboxPresetChange(input));
  });
}

async function initCustomerAccess() {
  if (!window.CATSOFT_ADMIN_AUTHORIZED) {
    window.setTimeout(initCustomerAccess, 80);
    return;
  }

  bindCustomerAccess();

  try {
    await fetchCustomerAccounts();
    setCustomerAccessStatus('');
  } catch (error) {
    setCustomerAccessStatus(`Gagal memuat akun customer: ${error.message}`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomerAccess);
} else {
  initCustomerAccess();
}
