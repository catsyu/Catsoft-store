const CATSOFT_CUSTOMER_SESSION_KEY = 'catsoftCustomerSession';
const CATSOFT_CUSTOMER_ACCOUNTS_KEY = 'catsoftCustomerAccounts';
const CUSTOMER_AUTH_ACCOUNTS_API = window.CATSOFT_CUSTOMER_ACCOUNTS_API || getDefaultCustomerAccountsApiEndpoint();
const CUSTOMER_AUTH_LOGIN_API = window.CATSOFT_AUTH_API || getDefaultCustomerAuthApiEndpoint();
const CATSOFT_CUSTOMER_ACCOUNTS_REFRESH_MS = 4000;
let catsoftCustomerAccountsRefreshTimer = null;
let customerUnauthorizedHandled = false;

function normalizeCustomerValue(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeCustomerRules(account) {
  const modernRules = Array.isArray(account.inboxRules) ? account.inboxRules : [];
  const snakeRules = Array.isArray(account.inbox_rules) ? account.inbox_rules : [];
  const legacyRecipients = Array.isArray(account.inboxRecipients) ? account.inboxRecipients : [];

  return [...modernRules, ...snakeRules, ...legacyRecipients]
    .map(normalizeCustomerValue)
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function isCustomerAuthContext() {
  const hostname = window.location.hostname.toLowerCase();
  const params = new URLSearchParams(window.location.search);

  return window.CATSOFT_CUSTOMER_AUTH_REQUIRED
    || hostname === 'customer.catsoft.store'
    || document.body.classList.contains('customer-console-body')
    || params.get('customer') === '1';
}

function getDefaultCustomerAccountsApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage) {
    return 'https://catsoft.store/api/customer-accounts';
  }

  return '/api/customer-accounts';
}

function getDefaultCustomerAuthApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage) {
    return 'https://catsoft.store/api/auth/login';
  }

  return '/api/auth/login';
}

function normalizeCustomerAccount(account) {
  return {
    username: String(account.username || '').trim(),
    password: String(account.password || ''),
    passwordHash: String(account.passwordHash || account.password_hash || ''),
    status: normalizeCustomerValue(account.status) === 'inactive' ? 'inactive' : 'active',
    inboxAccessAll: Boolean(account.inboxAccessAll || account.inbox_access_all),
    inboxRules: normalizeCustomerRules(account),
    recordCount: Number(account.recordCount || account.record_count || 0),
    lastRecordAt: account.lastRecordAt || account.last_record_at || '',
    createdAt: account.createdAt || account.created_at || new Date().toISOString(),
    updatedAt: account.updatedAt || account.updated_at || new Date().toISOString()
  };
}

function loadCustomerAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CATSOFT_CUSTOMER_ACCOUNTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(normalizeCustomerAccount).filter((account) => account.username) : [];
  } catch (error) {
    localStorage.setItem(CATSOFT_CUSTOMER_ACCOUNTS_KEY, '[]');
    return [];
  }
}

function saveCustomerAccounts(accounts) {
  localStorage.setItem(CATSOFT_CUSTOMER_ACCOUNTS_KEY, JSON.stringify(accounts.map(normalizeCustomerAccount)));
}

function handleCustomerUnauthorized(error) {
  if (Number(error?.status) !== 401 || customerUnauthorizedHandled) {
    return false;
  }

  customerUnauthorizedHandled = true;
  clearCustomerSession();
  window.setTimeout(() => window.location.reload(), 700);
  return true;
}

async function syncCustomerAccountsFromApi() {
  try {
    const response = await fetch(`${CUSTOMER_AUTH_ACCOUNTS_API}?_=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      const error = new Error(response.status === 401 ? 'Sesi customer berakhir. Silakan login ulang.' : `API customer ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const accounts = (Array.isArray(data) ? data : data.accounts || [])
      .map(normalizeCustomerAccount)
      .filter((account) => account.username && (account.password || account.passwordHash));
    saveCustomerAccounts(accounts);
    return accounts;
  } catch (error) {
    if (handleCustomerUnauthorized(error)) {
      return [];
    }
    return loadCustomerAccounts();
  }
}

function loadCustomerSession() {
  try {
    return JSON.parse(sessionStorage.getItem(CATSOFT_CUSTOMER_SESSION_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function saveCustomerSession(session) {
  sessionStorage.setItem(CATSOFT_CUSTOMER_SESSION_KEY, JSON.stringify(session));
}

function clearCustomerSession() {
  sessionStorage.removeItem(CATSOFT_CUSTOMER_SESSION_KEY);
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true }).catch(() => {});
}

function getCustomerAccountByUsername(username) {
  return loadCustomerAccounts().find((account) => normalizeCustomerValue(account.username) === normalizeCustomerValue(username));
}

function getCurrentCustomer() {
  const session = loadCustomerSession();

  if (!session || !session.username) {
    return null;
  }

  const account = getCustomerAccountByUsername(session.username);

  if (!account || account.status === 'inactive') {
    clearCustomerSession();
    return null;
  }

  return {
    username: account.username,
    role: 'customer',
    inboxAccessAll: Boolean(account.inboxAccessAll),
    inboxRules: Array.isArray(account.inboxRules) ? account.inboxRules : [],
    recordCount: account.recordCount,
    lastRecordAt: account.lastRecordAt
  };
}

function customerBytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function customerSha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || '')));
  return customerBytesToHex(new Uint8Array(digest));
}

async function verifyCustomerPasswordHash(password, passwordHash) {
  const parts = String(passwordHash || '').split('$');

  if (parts.length !== 3 || parts[0] !== 'sha256') {
    return false;
  }

  return await customerSha256Hex(`${parts[1]}:${password}`) === parts[2];
}

async function verifyCustomerAccountPassword(account, password) {
  if (!account || account.status === 'inactive') {
    return false;
  }

  if (account.passwordHash) {
    return verifyCustomerPasswordHash(password, account.passwordHash);
  }

  return account.password === password;
}

async function loginCustomer(username, password) {
  const response = await fetch(CUSTOMER_AUTH_LOGIN_API, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'customer', username, password })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.ok) {
    return { ok: false, message: payload.message || 'Username atau password customer salah.' };
  }

  const account = normalizeCustomerAccount(payload.account || {});
  saveCustomerAccounts([account]);
  saveCustomerSession({ username: account.username, role: 'customer', loggedInAt: new Date().toISOString() });
  return { ok: true };
}

function escapeCustomerHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCustomerInitials(username) {
  const parts = String(username || 'CU').replace(/[^a-z0-9._ -]/gi, ' ').split(/\s+|[._-]+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : String(username || 'CU').replace(/[^a-z0-9]/gi, '').slice(0, 2);
  return (initials || 'CU').toUpperCase();
}

function renderCustomerLogin(message = '') {
  document.body.classList.add('catsoft-customer-auth-locked');
  document.body.insertAdjacentHTML('afterbegin', `
    <section class="customer-login-page" aria-labelledby="customerLoginTitle">
      <div class="customer-login-panel">
        <div class="customer-login-brand">
          <img src="logo.png" alt="Catsoft" />
          <div>
            <span>Customer Center</span>
            <h1 id="customerLoginTitle">Masuk Customer</h1>
          </div>
        </div>
        <form class="customer-login-form" id="customerLoginForm">
          <label>
            Username
            <input id="customerLoginUsername" type="text" autocomplete="username" required />
          </label>
          <label>
            Password
            <input id="customerLoginPassword" type="password" autocomplete="current-password" required />
          </label>
          <p class="customer-login-error" id="customerLoginError" aria-live="polite">${escapeCustomerHtml(message)}</p>
          <button class="customer-login-submit" type="submit">Masuk Customer Center</button>
        </form>
      </div>
    </section>
  `);

  document.getElementById('customerLoginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = event.currentTarget.querySelector('.customer-login-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Memeriksa...';
    const result = await loginCustomer(
      document.getElementById('customerLoginUsername').value,
      document.getElementById('customerLoginPassword').value
    );

    if (!result.ok) {
      document.getElementById('customerLoginError').textContent = result.message;
      submitButton.disabled = false;
      submitButton.textContent = 'Masuk Customer Center';
      return;
    }

    window.location.reload();
  });
}

function injectCustomerAuthStyles() {
  if (document.getElementById('catsoftCustomerAuthStyles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'catsoftCustomerAuthStyles';
  style.textContent = `
    body.catsoft-customer-auth-locked {
      overflow: hidden;
    }

    body.catsoft-customer-auth-locked > :not(.customer-login-page) {
      display: none !important;
    }

    .customer-login-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 20px;
      background: #f4f4f4;
      color: #222;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .customer-login-panel {
      width: min(430px, calc(100vw - 40px));
      border: 1px solid #d8d8d8;
      border-radius: 12px;
      padding: 22px;
      background: #fff;
    }

    .customer-login-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }

    .customer-login-brand img {
      width: 42px;
      height: 42px;
      object-fit: contain;
    }

    .customer-login-brand span,
    .customer-login-form label {
      color: #666;
      font-size: 12px;
      font-weight: 500;
    }

    .customer-login-brand h1 {
      margin: 2px 0 0;
      font-size: 24px;
      font-weight: 500;
      line-height: 1.15;
    }

    .customer-login-form {
      display: grid;
      gap: 12px;
    }

    .customer-login-form label {
      display: grid;
      gap: 6px;
    }

    .customer-login-form input {
      min-height: 40px;
      border: 1px solid #cfcfcf;
      border-radius: 999px;
      padding: 8px 14px;
      color: #222;
      font: inherit;
      font-size: 14px;
      font-weight: 500;
      background: #fff;
    }

    .customer-login-submit {
      min-height: 42px;
      border: 1px solid #111;
      border-radius: 999px;
      padding: 10px 18px;
      background: #111;
      color: #fff;
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }

    .customer-login-error {
      min-height: 18px;
      margin: 0;
      color: #b91c1c;
      font-size: 12px;
    }
  `;
  document.head.appendChild(style);
}

function addCustomerSessionControls() {
  const customer = getCurrentCustomer();
  const actions = document.querySelector('.customer-console-actions');

  if (!customer || !actions || actions.querySelector('[data-customer-logout]')) {
    return;
  }

  actions.innerHTML = `
    <span class="customer-profile-name">${escapeCustomerHtml(customer.username)}</span>
    <button class="customer-profile-button" type="button" title="Akun Customer">
      <span>${escapeCustomerHtml(getCustomerInitials(customer.username))}</span>
    </button>
    <button class="customer-logout-button" type="button" data-customer-logout>Logout</button>
  `;

  actions.querySelector('[data-customer-logout]').addEventListener('click', () => {
    clearCustomerSession();
    window.location.href = 'https://customer.catsoft.store/';
  });
}

function markCustomerAuthorized() {
  window.CATSOFT_CUSTOMER_AUTHORIZED = true;
  addCustomerSessionControls();
  document.dispatchEvent(new CustomEvent('catsoft-customer-ready', {
    detail: { customer: getCurrentCustomer() }
  }));
}

function startCustomerAccountsAutoRefresh() {
  window.clearInterval(catsoftCustomerAccountsRefreshTimer);

  const refresh = async () => {
    if (!loadCustomerSession()) {
      return;
    }

    await syncCustomerAccountsFromApi();

    if (!getCurrentCustomer()) {
      window.location.reload();
    }
  };

  catsoftCustomerAccountsRefreshTimer = window.setInterval(refresh, CATSOFT_CUSTOMER_ACCOUNTS_REFRESH_MS);
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refresh();
    }
  });
}

function getCustomerInboxAccess() {
  const customer = getCurrentCustomer();

  if (!customer) {
    return { all: false, rules: [] };
  }

  return {
    all: Boolean(customer.inboxAccessAll),
    rules: (customer.inboxRules || []).map(normalizeCustomerValue).filter(Boolean)
  };
}

async function initCustomerAuth() {
  injectCustomerAuthStyles();

  if (window.CatsoftAdminAuth && window.CatsoftAdminAuth.getCurrentAdmin()) {
    window.CATSOFT_CUSTOMER_AUTHORIZED = true;
    return;
  }

  if (!isCustomerAuthContext()) {
    return;
  }

  if (getCurrentCustomer()) {
    markCustomerAuthorized();
    syncCustomerAccountsFromApi().catch(() => {});
    startCustomerAccountsAutoRefresh();
    return;
  }

  if (!getCurrentCustomer()) {
    renderCustomerLogin();
    return;
  }

  markCustomerAuthorized();
  startCustomerAccountsAutoRefresh();
}

window.CatsoftCustomerAuth = {
  getCurrentCustomer,
  getInboxAccess: getCustomerInboxAccess,
  logout: clearCustomerSession
};

initCustomerAuth();
