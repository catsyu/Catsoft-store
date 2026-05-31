const CATSOFT_SUPPLIER_SESSION_KEY = 'catsoftSupplierSession';
const CATSOFT_SUPPLIER_ACCOUNTS_KEY = 'catsoftSupplierAccounts';
const CATSOFT_SUPPLIER_ACCOUNTS_API = window.CATSOFT_SUPPLIER_ACCOUNTS_API || getDefaultSupplierAccountsApiEndpoint();
const CATSOFT_SUPPLIER_AUTH_API = window.CATSOFT_AUTH_API || getDefaultSupplierAuthApiEndpoint();
const CATSOFT_SUPPLIER_SESSION_ACTIVITY_API = window.CATSOFT_SESSION_ACTIVITY_API || getDefaultSessionActivityApiEndpoint();
const CATSOFT_SUPPLIER_ACCOUNTS_REFRESH_MS = 3000;
let catsoftSupplierHeartbeatTimer = null;
let catsoftSupplierAccountsRefreshTimer = null;

const CATSOFT_SUPPLIER_TOOLS = [
  { id: 'supplier-email', label: 'Email', path: 'supplier-email.html', route: '/mail' }
];

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
    'wkwkksks.uk',
    'malibus.org'
  ];

  const domains = Array.isArray(sharedDomains) && sharedDomains.length ? sharedDomains : fallbackDomains;

  return domains
    .map((domain) => String(domain || '').trim().toLowerCase())
    .filter(Boolean)
    .filter((domain, index, list) => list.indexOf(domain) === index);
}

const CATSOFT_SUPPLIER_DOMAINS = getCatsoftSharedEmailDomains();

function normalizeSupplierValue(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeSupplierRules(account) {
  const modernRules = Array.isArray(account.inboxRules) ? account.inboxRules : [];
  const legacyRecipients = Array.isArray(account.inboxRecipients) ? account.inboxRecipients : [];

  return [...modernRules, ...legacyRecipients]
    .map(normalizeSupplierValue)
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function getDefaultSupplierAccountsApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage) {
    return 'https://catsoft.store/api/supplier-accounts';
  }

  return '/api/supplier-accounts';
}

function getDefaultSupplierAuthApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage) {
    return 'https://catsoft.store/api/auth/login';
  }

  return '/api/auth/login';
}

function getDefaultSessionActivityApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage) {
    return 'https://catsoft.store/api/session-activity';
  }

  return '/api/session-activity';
}

function getSupplierPageName() {
  const page = window.location.pathname.split('/').pop();
  return page || 'supplier-center.html';
}

function normalizeSupplierRoutePath(value) {
  const clean = `/${String(value || '').replace(/^\/+|\/+$/g, '')}`;
  return clean === '/' ? '/' : clean.toLowerCase();
}

function getCurrentSupplierToolId() {
  const pageName = getSupplierPageName();
  const routePath = normalizeSupplierRoutePath(window.location.pathname);
  const tool = CATSOFT_SUPPLIER_TOOLS.find((item) => item.path === pageName || normalizeSupplierRoutePath(item.route) === routePath);
  return tool ? tool.id : '';
}

function normalizeSupplierAccount(account) {
  const allowedDomains = Array.isArray(account.allowedDomains)
    ? account.allowedDomains
    : Array.isArray(account.domains)
      ? account.domains
      : CATSOFT_SUPPLIER_DOMAINS;

  return {
    username: String(account.username || '').trim(),
    password: String(account.password || ''),
    passwordHash: String(account.passwordHash || account.password_hash || ''),
    tools: Array.isArray(account.tools) ? account.tools : [],
    inboxAccessAll: Boolean(account.inboxAccessAll),
    inboxRules: normalizeSupplierRules(account),
    allowedDomains: allowedDomains
      .map(normalizeSupplierValue)
      .filter((domain) => CATSOFT_SUPPLIER_DOMAINS.includes(domain)),
    lastLoginAt: account.lastLoginAt || account.last_login_at || '',
    activeAt: account.activeAt || account.active_at || '',
    loginCountToday: Number(account.loginCountToday || account.login_count_today || 0),
    loginCountDate: account.loginCountDate || account.login_count_date || '',
    createdAt: account.createdAt || new Date().toISOString(),
    updatedAt: account.updatedAt || new Date().toISOString()
  };
}

function loadSupplierAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CATSOFT_SUPPLIER_ACCOUNTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(normalizeSupplierAccount).filter((account) => account.username) : [];
  } catch (error) {
    localStorage.setItem(CATSOFT_SUPPLIER_ACCOUNTS_KEY, '[]');
    return [];
  }
}

function saveSupplierAccounts(accounts) {
  localStorage.setItem(CATSOFT_SUPPLIER_ACCOUNTS_KEY, JSON.stringify(accounts.map(normalizeSupplierAccount)));
}

async function pushSupplierAccountsToApi(accounts) {
  const response = await fetch(CATSOFT_SUPPLIER_ACCOUNTS_API, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accounts: accounts.map(normalizeSupplierAccount) })
  });

  if (!response.ok) {
    throw new Error(`API supplier ${response.status}`);
  }
}

function parseSupplierAccountsResponse(data) {
  const accounts = Array.isArray(data) ? data : Array.isArray(data.accounts) ? data.accounts : [];
  return accounts.map(normalizeSupplierAccount).filter((account) => account.username && (account.password || account.passwordHash));
}

async function syncSupplierAccountsFromApi() {
  try {
    const response = await fetch(`${CATSOFT_SUPPLIER_ACCOUNTS_API}?_=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      throw new Error(`API supplier ${response.status}`);
    }

    const accounts = parseSupplierAccountsResponse(await response.json());
    saveSupplierAccounts(accounts);
    return accounts;
  } catch (error) {
    return loadSupplierAccounts();
  }
}

function loadSupplierSession() {
  try {
    return JSON.parse(sessionStorage.getItem(CATSOFT_SUPPLIER_SESSION_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function saveSupplierSession(session) {
  sessionStorage.setItem(CATSOFT_SUPPLIER_SESSION_KEY, JSON.stringify(session));
}

function clearSupplierSession() {
  sessionStorage.removeItem(CATSOFT_SUPPLIER_SESSION_KEY);
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true }).catch(() => {});
}

function getSupplierAccountByUsername(username) {
  return loadSupplierAccounts().find((account) => normalizeSupplierValue(account.username) === normalizeSupplierValue(username));
}

function getCurrentSupplier() {
  const session = loadSupplierSession();

  if (!session || !session.username) {
    return null;
  }

  const account = getSupplierAccountByUsername(session.username);

  if (!account) {
    clearSupplierSession();
    return null;
  }

  return {
    username: account.username,
    role: 'supplier',
    tools: Array.isArray(account.tools) ? account.tools : [],
    inboxRules: normalizeSupplierRules(account),
    inboxAccessAll: Boolean(account.inboxAccessAll),
    allowedDomains: (account.allowedDomains || []).length ? account.allowedDomains : [CATSOFT_SUPPLIER_DOMAINS[0]]
  };
}

function supplierBytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function supplierSha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || '')));
  return supplierBytesToHex(new Uint8Array(digest));
}

async function createSupplierPasswordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = supplierBytesToHex(salt);
  const hashHex = await supplierSha256Hex(`${saltHex}:${password}`);
  return `sha256$${saltHex}$${hashHex}`;
}

async function verifySupplierPasswordHash(password, passwordHash) {
  const parts = String(passwordHash || '').split('$');

  if (parts.length !== 3 || parts[0] !== 'sha256') {
    return false;
  }

  return await supplierSha256Hex(`${parts[1]}:${password}`) === parts[2];
}

async function verifySupplierAccountPassword(account, password) {
  if (!account) {
    return false;
  }

  if (account.passwordHash) {
    return verifySupplierPasswordHash(password, account.passwordHash);
  }

  return account.password === password;
}

async function migrateSupplierPasswordIfLegacy(account, password) {
  if (!account || account.passwordHash || !account.password) {
    return;
  }

  const passwordHash = await createSupplierPasswordHash(password);
  const nextAccounts = loadSupplierAccounts().map((item) => normalizeSupplierValue(item.username) === normalizeSupplierValue(account.username)
    ? { ...item, password: '', passwordHash, updatedAt: new Date().toISOString() }
    : item);
  saveSupplierAccounts(nextAccounts);

  try {
    await pushSupplierAccountsToApi(nextAccounts);
  } catch (error) {}
}

function supplierHasToolAccess(toolId) {
  const supplier = getCurrentSupplier();

  if (!toolId || !supplier) {
    return Boolean(supplier);
  }

  return supplier.tools.includes(toolId);
}

function getSupplierInboxAccess() {
  const supplier = getCurrentSupplier();

  if (!supplier) {
    return { all: false, rules: [] };
  }

  return {
    all: Boolean(supplier.inboxAccessAll),
    rules: (supplier.inboxRules || []).map(normalizeSupplierValue).filter(Boolean)
  };
}

async function loginSupplier(username, password) {
  const response = await fetch(CATSOFT_SUPPLIER_AUTH_API, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'supplier', username, password })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.ok) {
    return { ok: false, message: payload.message || 'Username atau password supplier salah.' };
  }

  const account = normalizeSupplierAccount(payload.account || {});
  saveSupplierAccounts([account]);
  saveSupplierSession({ username: account.username, role: 'supplier', loggedInAt: new Date().toISOString() });
  recordSupplierSessionActivity(account.username, 'login');
  return { ok: true };
}

async function recordSupplierSessionActivity(username, eventType = 'active') {
  const activeAt = new Date().toISOString();
  const today = activeAt.slice(0, 10);
  const accounts = loadSupplierAccounts();
  const nextAccounts = accounts.map((account) => {
    if (normalizeSupplierValue(account.username) !== normalizeSupplierValue(username)) {
      return account;
    }

    const previousDate = account.loginCountDate || '';
    const previousCount = previousDate === today ? Number(account.loginCountToday || 0) : 0;

    return {
      ...account,
      activeAt,
      lastLoginAt: eventType === 'login' ? activeAt : account.lastLoginAt,
      loginCountDate: eventType === 'login' ? today : account.loginCountDate,
      loginCountToday: eventType === 'login' ? previousCount + 1 : Number(account.loginCountToday || 0)
    };
  });

  saveSupplierAccounts(nextAccounts);

  try {
    const response = await fetch(CATSOFT_SUPPLIER_SESSION_ACTIVITY_API, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'supplier', username, eventType, activeAt, loginDate: today })
    });

    if (!response.ok) {
      throw new Error(`API activity ${response.status}`);
    }

    const payload = await response.json();
    if (Array.isArray(payload.supplierAccounts)) {
      saveSupplierAccounts(payload.supplierAccounts);
    }
  } catch (error) {}
}

function escapeSupplierHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSupplierInitials(username) {
  const compact = String(username || 'SP').replace(/[^a-z0-9]/gi, '');
  const uppercase = compact.toUpperCase();
  return uppercase ? uppercase.slice(0, 2) : 'SP';
}

function closeSupplierPasswordDialog() {
  const dialog = document.getElementById('supplierPasswordDialog');
  if (dialog) {
    dialog.remove();
  }
}

function showSupplierPasswordDialog() {
  const supplier = getCurrentSupplier();

  if (!supplier || document.getElementById('supplierPasswordDialog')) {
    return;
  }

  document.body.insertAdjacentHTML('beforeend', `
    <div class="admin-auth-modal" id="supplierPasswordDialog" role="dialog" aria-modal="true" aria-labelledby="supplierPasswordTitle">
      <div class="admin-auth-dialog">
        <h2 id="supplierPasswordTitle">Atur Password</h2>
        <form id="supplierPasswordForm">
          <label>
            Password saat ini
            <input id="supplierCurrentPassword" type="password" autocomplete="current-password" required />
          </label>
          <label>
            Password baru
            <input id="supplierNewPassword" type="password" autocomplete="new-password" minlength="6" required />
          </label>
          <label>
            Ulangi password baru
            <input id="supplierConfirmPassword" type="password" autocomplete="new-password" minlength="6" required />
          </label>
          <p class="admin-login-error" id="supplierPasswordStatus" aria-live="polite"></p>
          <div class="admin-auth-dialog-actions">
            <button type="submit">Simpan Password</button>
            <button type="button" id="supplierPasswordCancel">Tutup</button>
          </div>
        </form>
      </div>
    </div>
  `);

  document.getElementById('supplierPasswordCancel').addEventListener('click', closeSupplierPasswordDialog);
  document.getElementById('supplierPasswordDialog').addEventListener('click', (event) => {
    if (event.target.id === 'supplierPasswordDialog') {
      closeSupplierPasswordDialog();
    }
  });
  document.getElementById('supplierPasswordForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await updateCurrentSupplierPassword(supplier);
  });
}

async function updateCurrentSupplierPassword(supplier) {
  const status = document.getElementById('supplierPasswordStatus');
  const currentPassword = document.getElementById('supplierCurrentPassword').value;
  const newPassword = document.getElementById('supplierNewPassword').value;
  const confirmPassword = document.getElementById('supplierConfirmPassword').value;
  const account = getSupplierAccountByUsername(supplier.username);

  if (!account || !(await verifySupplierAccountPassword(account, currentPassword))) {
    status.textContent = 'Password saat ini tidak sesuai.';
    return;
  }

  if (newPassword.length < 6) {
    status.textContent = 'Password baru minimal 6 karakter.';
    return;
  }

  if (newPassword !== confirmPassword) {
    status.textContent = 'Konfirmasi password belum sama.';
    return;
  }

  const nextAccounts = loadSupplierAccounts().map((item) => normalizeSupplierValue(item.username) === normalizeSupplierValue(supplier.username)
    ? { ...item, password: '', passwordHash: '', updatedAt: new Date().toISOString() }
    : item);
  const passwordHash = await createSupplierPasswordHash(newPassword);
  nextAccounts.forEach((item) => {
    if (normalizeSupplierValue(item.username) === normalizeSupplierValue(supplier.username)) {
      item.passwordHash = passwordHash;
    }
  });

  saveSupplierAccounts(nextAccounts);
  status.textContent = 'Password tersimpan lokal, sinkronisasi...';

  try {
    await pushSupplierAccountsToApi(nextAccounts);
    status.classList.add('success');
    status.textContent = 'Password berhasil diganti.';
    setTimeout(closeSupplierPasswordDialog, 900);
  } catch (error) {
    status.textContent = `Password lokal berubah, sync web gagal: ${error.message}`;
  }
}

function renderSupplierLogin(message = '') {
  document.body.classList.add('catsoft-auth-locked');
  document.body.insertAdjacentHTML('afterbegin', `
    <section class="admin-login-page" aria-labelledby="supplierLoginTitle">
      <div class="admin-login-panel">
        <div class="admin-login-brand">
          <img src="logo.png" alt="Catsoft" />
          <div>
            <span>Catsoft Supplier</span>
            <h1 id="supplierLoginTitle">Supplier Login</h1>
          </div>
        </div>
        <form class="admin-login-form" id="supplierLoginForm">
          <label>
            Username
            <input id="supplierLoginUsername" type="text" autocomplete="username" required />
          </label>
          <label>
            Password
            <span class="admin-password-row">
              <input id="supplierLoginPassword" type="password" autocomplete="current-password" required />
              <button class="admin-password-toggle" id="supplierPasswordToggle" type="button">Lihat</button>
            </span>
          </label>
          <p class="admin-login-error" id="supplierLoginError" aria-live="polite">${escapeSupplierHtml(message)}</p>
          <button class="admin-login-submit" type="submit">Masuk Supplier Center</button>
        </form>
      </div>
    </section>
  `);

  document.getElementById('supplierLoginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = event.currentTarget.querySelector('.admin-login-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Memeriksa...';
    const result = await loginSupplier(
      document.getElementById('supplierLoginUsername').value,
      document.getElementById('supplierLoginPassword').value
    );

    if (!result.ok) {
      document.getElementById('supplierLoginError').textContent = result.message;
      submitButton.disabled = false;
      submitButton.textContent = 'Masuk Supplier Center';
      return;
    }

    window.location.reload();
  });

  document.getElementById('supplierPasswordToggle').addEventListener('click', () => {
    const passwordInput = document.getElementById('supplierLoginPassword');
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    document.getElementById('supplierPasswordToggle').textContent = isHidden ? 'Sembunyi' : 'Lihat';
  });
}

function injectSupplierAuthStyles() {
  if (document.getElementById('catsoftSupplierAuthStyles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'catsoftSupplierAuthStyles';
  style.textContent = `
    .admin-login-page {
      width: 100%;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
      color: #0f172a;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body.catsoft-auth-locked {
      overflow: hidden;
    }

    body.catsoft-auth-locked > :not(.admin-login-page) {
      display: none !important;
    }

    .admin-login-panel {
      width: calc(100vw - 48px);
      max-width: 430px;
      overflow: hidden;
      padding: 24px;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 22px 58px rgba(15, 23, 42, 0.12);
    }

    .admin-login-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 22px;
    }

    .admin-login-brand img {
      width: 46px;
      height: 46px;
      object-fit: contain;
    }

    .admin-login-brand span {
      display: block;
      color: #2563eb;
      font-size: 12px;
      font-weight: 900;
      text-transform: none;
    }

    .admin-login-brand h1 {
      margin: 4px 0 0;
      font-size: 28px;
      line-height: 1.1;
    }

    .admin-login-form {
      display: grid;
      gap: 14px;
      min-width: 0;
    }

    .admin-login-form label {
      display: grid;
      gap: 7px;
      color: #334155;
      font-size: 13px;
      font-weight: 800;
    }

    .admin-login-form input {
      width: 100%;
      min-height: 38px;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 8px 10px;
      color: #0f172a;
      font: inherit;
      font-size: 13px;
      font-weight: 800;
      background: #fff;
    }

    .admin-password-row {
      display: grid;
      gap: 8px;
    }

    .admin-password-toggle {
      min-height: 38px;
      border: 1px solid #dbeafe;
      border-radius: 7px;
      padding: 8px 10px;
      background: #eff6ff;
      color: #1e40af;
      font: inherit;
      font-size: 12px;
      font-weight: 950;
      cursor: pointer;
      width: 100%;
    }

    .admin-login-error {
      min-height: 20px;
      color: #dc2626;
      font-size: 13px;
      font-weight: 800;
    }

    .admin-login-submit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      border: 0;
      border-radius: 10px;
      padding: 11px 18px;
      background: #2563eb;
      color: #fff;
      font: inherit;
      font-weight: 900;
      text-decoration: none;
      cursor: pointer;
      box-shadow: 0 12px 28px rgba(37, 99, 235, 0.16);
    }

    .admin-denied-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }

    .admin-session-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      flex-wrap: wrap;
    }

    .admin-profile {
      display: inline-grid;
      grid-template-columns: 38px minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
      min-width: 0;
      max-width: 100%;
      min-height: 46px;
      padding: 4px 6px 4px 4px;
      border: 1px solid rgba(148, 163, 184, 0.28);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
    }

    .admin-profile-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 999px;
      background: linear-gradient(135deg, #1d4ed8, #0f766e);
      color: #fff;
      font-size: 14px;
      font-weight: 950;
      letter-spacing: 0;
    }

    .admin-profile-text {
      display: grid;
      min-width: 0;
      line-height: 1.15;
    }

    .admin-profile-role {
      color: #64748b;
      font-size: 10px;
      font-weight: 900;
      text-transform: none;
    }

    .admin-profile-name {
      color: #0f172a;
      font-size: 13px;
      font-weight: 950;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }

    .admin-profile button {
      min-height: 30px;
      border: 1px solid #dbeafe;
      border-radius: 999px;
      padding: 6px 10px;
      background: #eff6ff;
      color: #1e40af;
      font: inherit;
      font-size: 11px;
      font-weight: 950;
      cursor: pointer;
    }

    .admin-profile-actions {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .admin-profile button[data-supplier-password] {
      background: #f8fafc;
      color: #334155;
      border-color: #e2e8f0;
    }

    .admin-auth-modal {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      padding: 18px;
      background: rgba(15, 23, 42, 0.38);
    }

    .admin-auth-dialog {
      width: min(430px, 100%);
      padding: 18px;
      border: 1px solid #dbeafe;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.2);
    }

    .admin-auth-dialog h2 {
      margin: 0 0 12px;
      font-size: 22px;
      line-height: 1.15;
    }

    .admin-auth-dialog form,
    .admin-auth-dialog label {
      display: grid;
      gap: 12px;
    }

    .admin-auth-dialog label {
      gap: 6px;
      color: #334155;
      font-size: 13px;
      font-weight: 850;
    }

    .admin-auth-dialog input {
      width: 100%;
      min-height: 38px;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 8px 10px;
      color: #0f172a;
      font: inherit;
      font-size: 13px;
      font-weight: 800;
    }

    .admin-auth-dialog-actions {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
    }

    .admin-auth-dialog-actions button {
      min-height: 42px;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      padding: 9px 13px;
      background: #2563eb;
      color: #fff;
      font: inherit;
      font-weight: 900;
      cursor: pointer;
    }

    .admin-auth-dialog-actions button[type="button"] {
      background: #f8fafc;
      color: #334155;
      border-color: #e2e8f0;
    }

    @media (max-width: 760px) {
      .admin-session-bar,
      .admin-profile {
        width: 100%;
      }

      .header-actions .admin-session-bar {
        grid-column: 1 / -1;
        width: 100%;
      }

      .header-actions .admin-profile {
        width: 100%;
      }

      .admin-profile {
        grid-template-columns: 36px minmax(0, 1fr);
        gap: 7px;
        min-height: 0;
        padding: 7px;
        border-radius: 18px;
      }

      .admin-profile-avatar {
        width: 34px;
        height: 34px;
        font-size: 12px;
      }

      .admin-profile-actions {
        display: grid;
        grid-column: 1 / -1;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        width: 100%;
      }

      .admin-profile-actions button {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);
}

function renderSupplierDenied() {
  const supplier = getCurrentSupplier();
  document.body.classList.add('catsoft-auth-locked');
  document.body.insertAdjacentHTML('afterbegin', `
    <section class="admin-login-page" aria-labelledby="supplierDeniedTitle">
      <div class="admin-login-panel">
        <div class="admin-login-brand">
          <img src="logo.png" alt="Catsoft" />
          <div>
            <span>Catsoft Supplier</span>
            <h1 id="supplierDeniedTitle">Akses Ditolak</h1>
          </div>
        </div>
        <p>Akun ${escapeSupplierHtml(supplier ? supplier.username : 'supplier')} belum diberi akses ke halaman ini.</p>
        <div class="admin-denied-actions">
          <a class="admin-login-submit" href="https://supplier.catsoft.store/">Kembali</a>
          <button class="admin-login-submit" id="supplierLogoutDenied" type="button">Logout</button>
        </div>
      </div>
    </section>
  `);

  document.getElementById('supplierLogoutDenied').addEventListener('click', () => {
    clearSupplierSession();
    window.location.href = 'https://supplier.catsoft.store/';
  });
}

function addSupplierSessionControls() {
  const supplier = getCurrentSupplier();
  const header = document.querySelector('.admin-nav, .header-actions');

  if (!supplier || !header || header.querySelector('[data-supplier-logout]')) {
    return;
  }

  const sessionBar = document.createElement('div');
  sessionBar.className = 'admin-session-bar';
  sessionBar.innerHTML = `
    <div class="admin-profile">
      <span class="admin-profile-avatar" aria-hidden="true">${escapeSupplierHtml(getSupplierInitials(supplier.username))}</span>
      <span class="admin-profile-text">
        <span class="admin-profile-role">Supplier</span>
        <span class="admin-profile-name">${escapeSupplierHtml(supplier.username)}</span>
      </span>
      <span class="admin-profile-actions">
        <button type="button" data-supplier-password>Password</button>
        <button type="button" data-supplier-logout>Logout</button>
      </span>
    </div>
  `;
  header.appendChild(sessionBar);
  sessionBar.querySelector('[data-supplier-password]').addEventListener('click', showSupplierPasswordDialog);
  sessionBar.querySelector('[data-supplier-logout]').addEventListener('click', () => {
    clearSupplierSession();
    window.location.href = 'https://supplier.catsoft.store/';
  });
}

function startSupplierHeartbeat() {
  window.clearInterval(catsoftSupplierHeartbeatTimer);
  const supplier = getCurrentSupplier();

  if (!supplier) {
    return;
  }

  recordSupplierSessionActivity(supplier.username, 'active');
  catsoftSupplierHeartbeatTimer = window.setInterval(() => {
    const currentSupplier = getCurrentSupplier();
    if (currentSupplier) {
      recordSupplierSessionActivity(currentSupplier.username, 'active');
    }
  }, 60000);
}

function startSupplierAccountsAutoRefresh() {
  window.clearInterval(catsoftSupplierAccountsRefreshTimer);

  const refresh = async () => {
    if (!getCurrentSupplier()) {
      return;
    }

    await syncSupplierAccountsFromApi();
    const supplier = getCurrentSupplier();

    if (!supplier) {
      renderSupplierLogin();
      return;
    }

    filterSupplierToolCards();
  };

  catsoftSupplierAccountsRefreshTimer = window.setInterval(refresh, CATSOFT_SUPPLIER_ACCOUNTS_REFRESH_MS);
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refresh();
    }
  });
  refresh();
}

function filterSupplierToolCards() {
  const supplier = getCurrentSupplier();
  let visibleCount = 0;

  document.querySelectorAll('[data-supplier-tool-card]').forEach((card) => {
    const toolId = card.getAttribute('data-supplier-tool-card');
    const hidden = !supplier || !supplier.tools.includes(toolId);
    card.hidden = hidden;

    if (!hidden) {
      visibleCount += 1;
    }
  });

  const toolsSummary = document.querySelector('[data-supplier-summary="tools"]');
  if (toolsSummary) {
    toolsSummary.textContent = `${visibleCount} Aktif`;
  }

  document.querySelectorAll('[data-supplier-empty]').forEach((emptyState) => {
    emptyState.hidden = visibleCount > 0;
  });
}

function initSupplierAuth() {
  injectSupplierAuthStyles();

  if (window.CatsoftAdminAuth && window.CatsoftAdminAuth.getCurrentAdmin()) {
    window.CATSOFT_SUPPLIER_AUTHORIZED = true;
    return;
  }

  const currentToolId = getCurrentSupplierToolId();
  const supplier = getCurrentSupplier();

  if (!supplier) {
    renderSupplierLogin();
    return;
  }

  if (currentToolId && !supplierHasToolAccess(currentToolId)) {
    renderSupplierDenied();
    return;
  }

  window.CATSOFT_SUPPLIER_AUTHORIZED = true;
  addSupplierSessionControls();
  filterSupplierToolCards();
  startSupplierAccountsAutoRefresh();
  startSupplierHeartbeat();
}

window.CatsoftSupplierAuth = {
  getCurrentSupplier,
  hasToolAccess: supplierHasToolAccess,
  getInboxAccess: getSupplierInboxAccess,
  getAllowedDomains: () => {
    const supplier = getCurrentSupplier();
    return supplier && supplier.allowedDomains && supplier.allowedDomains.length
      ? supplier.allowedDomains
      : CATSOFT_SUPPLIER_DOMAINS;
  },
  logout: clearSupplierSession
};

initSupplierAuth();
