const CATSOFT_SUPPLIER_SESSION_KEY = 'catsoftSupplierSession';
const CATSOFT_SUPPLIER_ACCOUNTS_KEY = 'catsoftSupplierAccounts';
const CATSOFT_SUPPLIER_ACCOUNTS_API = window.CATSOFT_SUPPLIER_ACCOUNTS_API || getDefaultSupplierAccountsApiEndpoint();

const CATSOFT_SUPPLIER_TOOLS = [
  { id: 'supplier-email', label: 'Email', path: 'supplier-email.html' }
];

const CATSOFT_SUPPLIER_DOMAINS = [
  'catsoft.store',
  'catsoft.digital',
  'catsoft.online'
];

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

  if (window.location.protocol === 'file:' || isLocalPage || hostname !== 'catsoft.store') {
    return 'https://catsoft.store/api/supplier-accounts';
  }

  return '/api/supplier-accounts';
}

function getSupplierPageName() {
  const page = window.location.pathname.split('/').pop();
  return page || 'supplier-center.html';
}

function getCurrentSupplierToolId() {
  const pageName = getSupplierPageName();
  const tool = CATSOFT_SUPPLIER_TOOLS.find((item) => item.path === pageName);
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
    tools: Array.isArray(account.tools) ? account.tools : [],
    inboxAccessAll: Boolean(account.inboxAccessAll),
    inboxRules: normalizeSupplierRules(account),
    allowedDomains: allowedDomains
      .map(normalizeSupplierValue)
      .filter((domain) => CATSOFT_SUPPLIER_DOMAINS.includes(domain)),
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

function parseSupplierAccountsResponse(data) {
  const accounts = Array.isArray(data) ? data : Array.isArray(data.accounts) ? data.accounts : [];
  return accounts.map(normalizeSupplierAccount).filter((account) => account.username && account.password);
}

async function syncSupplierAccountsFromApi() {
  try {
    const response = await fetch(`${CATSOFT_SUPPLIER_ACCOUNTS_API}?_=${Date.now()}`, {
      cache: 'no-store',
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
  await syncSupplierAccountsFromApi();
  const account = getSupplierAccountByUsername(username);

  if (!account || account.password !== password) {
    return { ok: false, message: 'Username atau password supplier salah.' };
  }

  saveSupplierSession({ username: account.username, role: 'supplier', loggedInAt: new Date().toISOString() });
  return { ok: true };
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
      text-transform: uppercase;
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
      min-height: 44px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      color: #0f172a;
      font: inherit;
      font-weight: 700;
      background: #fff;
    }

    .admin-password-row {
      display: grid;
      gap: 8px;
    }

    .admin-password-toggle {
      min-height: 44px;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      padding: 9px 12px;
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
      grid-template-columns: 42px minmax(0, 1fr) auto;
      align-items: center;
      gap: 10px;
      min-height: 52px;
      padding: 6px 8px 6px 6px;
      border: 1px solid rgba(148, 163, 184, 0.28);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
    }

    .admin-profile-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
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
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .admin-profile-name {
      color: #0f172a;
      font-size: 14px;
      font-weight: 950;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }

    .admin-profile button {
      min-height: 34px;
      border: 1px solid #dbeafe;
      border-radius: 999px;
      padding: 7px 12px;
      background: #eff6ff;
      color: #1e40af;
      font: inherit;
      font-size: 12px;
      font-weight: 950;
      cursor: pointer;
    }

    @media (max-width: 760px) {
      .admin-session-bar,
      .admin-profile {
        width: 100%;
      }

      .admin-profile {
        grid-template-columns: 42px minmax(0, 1fr) auto;
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
          <a class="admin-login-submit" href="supplier-center.html">Kembali</a>
          <button class="admin-login-submit" id="supplierLogoutDenied" type="button">Logout</button>
        </div>
      </div>
    </section>
  `);

  document.getElementById('supplierLogoutDenied').addEventListener('click', () => {
    clearSupplierSession();
    window.location.href = 'supplier-center.html';
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
      <button type="button" data-supplier-logout>Logout</button>
    </div>
  `;
  header.appendChild(sessionBar);
  sessionBar.querySelector('[data-supplier-logout]').addEventListener('click', () => {
    clearSupplierSession();
    window.location.href = 'supplier-center.html';
  });
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
}

window.CatsoftSupplierAuth = {
  getCurrentSupplier,
  hasToolAccess: supplierHasToolAccess,
  getInboxAccess: getSupplierInboxAccess,
  getAllowedDomains: () => {
    const supplier = getCurrentSupplier();
    return supplier && supplier.allowedDomains && supplier.allowedDomains.length
      ? supplier.allowedDomains
      : [CATSOFT_SUPPLIER_DOMAINS[0]];
  },
  logout: clearSupplierSession
};

initSupplierAuth();
