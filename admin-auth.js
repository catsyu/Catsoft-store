const CATSOFT_OWNER_USERNAME = 'OwnerCatsoft';
const CATSOFT_OWNER_PASSWORD = 'Rhyhusnul24!';
const CATSOFT_ADMIN_SESSION_KEY = 'catsoftAdminSession';
const CATSOFT_ADMIN_ACCOUNTS_KEY = 'catsoftAdminAccounts';
const CATSOFT_ADMIN_ACCOUNTS_SYNC_KEY = 'catsoftAdminAccountsLastSync';
const CATSOFT_ADMIN_ACCOUNTS_API = window.CATSOFT_ADMIN_ACCOUNTS_API || getDefaultAdminAccountsApiEndpoint();
const CATSOFT_ADMIN_ACCOUNTS_REFRESH_MS = 10000;
const CATSOFT_SUPPLIER_ACCOUNTS_KEY = 'catsoftSupplierAccounts';
const CATSOFT_SUPPLIER_ACCOUNTS_API = window.CATSOFT_SUPPLIER_ACCOUNTS_API || getDefaultSupplierAccountsApiEndpoint();
const CATSOFT_SESSION_ACTIVITY_API = window.CATSOFT_SESSION_ACTIVITY_API || getDefaultSessionActivityApiEndpoint();
let catsoftAdminAccountsRefreshTimer = null;
let catsoftAdminHeartbeatTimer = null;

const CATSOFT_ADMIN_TOOLS = [
  { id: 'refund-calculator', label: 'Refund Calculator', path: 'refund-calculator.html' },
  { id: 'customer-database', label: 'Customer Database', path: 'customer-database.html' },
  { id: 'email-inbox', label: 'Email Inbox', path: 'email-inbox.html' },
  { id: 'office-activation', label: 'Office Activation', path: 'office-activation.html' },
  { id: 'marketing-calculator', label: 'Marketing Calculator', path: 'marketing-calculator.html' },
  { id: 'content-editor', label: 'Content Editor', path: 'content-editor.html' },
  { id: 'supplier-access', label: 'Supplier Center Access', path: 'supplier-access.html' },
  { id: 'admin-access', label: 'Admin Access', path: 'admin-access.html', ownerOnly: true }
];

const CATSOFT_SUPPLIER_TOOLS = [
  { id: 'supplier-email', label: 'Email', path: 'supplier-email.html' }
];

const CATSOFT_SUPPLIER_DOMAINS = [
  'catsoft.store',
  'catsoft.digital',
  'catsoft.online'
];

const CATSOFT_DEFAULT_INBOX_RULES = [
  'openai',
  'adobe',
  'canva',
  'support',
  'chatgpt@catsoft.store'
];

const CATSOFT_INBOX_PRESETS = [
  { value: 'all', label: 'Semua email masuk' },
  { value: 'openai', label: 'OpenAI / ChatGPT' },
  { value: 'adobe', label: 'Adobe' },
  { value: 'canva', label: 'Canva' },
  { value: 'support', label: 'Support' },
  { value: 'office', label: 'Office' },
  { value: 'catsoft.store', label: 'Domain catsoft.store' },
  { value: 'catsoft.digital', label: 'Domain catsoft.digital' },
  { value: 'catsoft.online', label: 'Domain catsoft.online' }
];

const CATSOFT_DEFAULT_ADMIN_ACCOUNTS = [
  {
    username: 'RifaP22',
    password: 'CatsoftAdmin24!',
    tools: ['email-inbox'],
    inboxAccessAll: false,
    inboxRules: ['openai', 'chatgpt', 'tm.openai.com'],
    createdAt: '2026-05-27T00:00:00.000Z',
    updatedAt: '2026-05-27T00:00:00.000Z'
  }
];

function normalizeAdminValue(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeInboxRules(account) {
  const modernRules = Array.isArray(account.inboxRules) ? account.inboxRules : [];
  const legacyRecipients = Array.isArray(account.inboxRecipients) ? account.inboxRecipients : [];

  return [...modernRules, ...legacyRecipients]
    .map(normalizeAdminValue)
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function getCurrentPageName() {
  const page = window.location.pathname.split('/').pop();
  return page || 'index.html';
}

function getDefaultAdminAccountsApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage || hostname !== 'catsoft.store') {
    return 'https://catsoft.store/api/admin-accounts';
  }

  return '/api/admin-accounts';
}

function getDefaultSupplierAccountsApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage || hostname !== 'catsoft.store') {
    return 'https://catsoft.store/api/supplier-accounts';
  }

  return '/api/supplier-accounts';
}

function getDefaultSessionActivityApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage || hostname !== 'catsoft.store') {
    return 'https://catsoft.store/api/session-activity';
  }

  return '/api/session-activity';
}

function getCurrentAdminToolId() {
  const pageName = getCurrentPageName();
  const tool = CATSOFT_ADMIN_TOOLS.find((item) => item.path === pageName);
  return tool ? tool.id : '';
}

function loadAdminAccounts() {
  try {
    const savedAccounts = localStorage.getItem(CATSOFT_ADMIN_ACCOUNTS_KEY);

    if (savedAccounts === null) {
      saveAdminAccounts(CATSOFT_DEFAULT_ADMIN_ACCOUNTS);
      return [...CATSOFT_DEFAULT_ADMIN_ACCOUNTS];
    }

    const parsed = JSON.parse(savedAccounts || '[]');
    const accounts = Array.isArray(parsed) ? parsed.filter((account) => account && account.username) : [];
    return accounts;
  } catch (error) {
    saveAdminAccounts([]);
    return [];
  }
}

function saveAdminAccounts(accounts) {
  localStorage.setItem(CATSOFT_ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function normalizeAdminAccount(account) {
  return {
    username: String(account.username || '').trim(),
    password: String(account.password || ''),
    passwordHash: String(account.passwordHash || account.password_hash || ''),
    tools: Array.isArray(account.tools) ? account.tools : [],
    inboxAccessAll: Boolean(account.inboxAccessAll),
    inboxRules: normalizeInboxRules(account),
    lastLoginAt: account.lastLoginAt || account.last_login_at || '',
    activeAt: account.activeAt || account.active_at || '',
    loginCountToday: Number(account.loginCountToday || account.login_count_today || 0),
    loginCountDate: account.loginCountDate || account.login_count_date || '',
    createdAt: account.createdAt || new Date().toISOString(),
    updatedAt: account.updatedAt || new Date().toISOString()
  };
}

function parseAdminAccountsResponse(data) {
  const accounts = Array.isArray(data) ? data : Array.isArray(data.accounts) ? data.accounts : [];
  return accounts.map(normalizeAdminAccount).filter((account) => account.username && (account.password || account.passwordHash));
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
    inboxRules: normalizeInboxRules(account),
    allowedDomains: allowedDomains
      .map(normalizeAdminValue)
      .filter((domain) => CATSOFT_SUPPLIER_DOMAINS.includes(domain)),
    createdBy: String(account.createdBy || ''),
    lastLoginAt: account.lastLoginAt || account.last_login_at || '',
    activeAt: account.activeAt || account.active_at || '',
    loginCountToday: Number(account.loginCountToday || account.login_count_today || 0),
    loginCountDate: account.loginCountDate || account.login_count_date || '',
    createdAt: account.createdAt || new Date().toISOString(),
    updatedAt: account.updatedAt || new Date().toISOString()
  };
}

function parseSupplierAccountsResponse(data) {
  const accounts = Array.isArray(data) ? data : Array.isArray(data.accounts) ? data.accounts : [];
  return accounts.map(normalizeSupplierAccount).filter((account) => account.username && (account.password || account.passwordHash));
}

function loadSupplierAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CATSOFT_SUPPLIER_ACCOUNTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((account) => account && account.username).map(normalizeSupplierAccount) : [];
  } catch (error) {
    saveSupplierAccounts([]);
    return [];
  }
}

function saveSupplierAccounts(accounts) {
  localStorage.setItem(CATSOFT_SUPPLIER_ACCOUNTS_KEY, JSON.stringify(accounts.map(normalizeSupplierAccount)));
}

function getSupplierAccountByUsername(username) {
  return loadSupplierAccounts().find((account) => normalizeAdminValue(account.username) === normalizeAdminValue(username));
}

async function syncSupplierAccountsFromApi(options = {}) {
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

    if (!options.silent) {
      setSupplierAccessStatus('Akses supplier tersinkron.', 'success');
    }

    return accounts;
  } catch (error) {
    if (!options.silent) {
      setSupplierAccessStatus(`Gagal sinkron supplier: ${error.message}`);
    }

    return loadSupplierAccounts();
  }
}

async function pushSupplierAccountsToApi(accounts) {
  const response = await fetch(CATSOFT_SUPPLIER_ACCOUNTS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accounts: accounts.map(normalizeSupplierAccount) })
  });

  if (!response.ok) {
    throw new Error(`API supplier ${response.status}`);
  }
}

async function syncAdminAccountsFromApi(options = {}) {
  try {
    const response = await fetch(`${CATSOFT_ADMIN_ACCOUNTS_API}?_=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`API admin ${response.status}`);
    }

    const accounts = parseAdminAccountsResponse(await response.json());
    saveAdminAccounts(accounts);
    localStorage.setItem(CATSOFT_ADMIN_ACCOUNTS_SYNC_KEY, new Date().toISOString());

    if (!options.silent) {
      setAccessStatus('Akses admin tersinkron.', 'success');
    }

    return accounts;
  } catch (error) {
    if (!options.silent) {
      setAccessStatus(`Gagal sinkron admin: ${error.message}`);
    }

    return loadAdminAccounts();
  }
}

async function pushAdminAccountsToApi(accounts) {
  const response = await fetch(CATSOFT_ADMIN_ACCOUNTS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accounts: accounts.map(normalizeAdminAccount) })
  });

  if (!response.ok) {
    throw new Error(`API admin ${response.status}`);
  }
}

async function recordSessionActivity(role, username, eventType = 'active') {
  const normalizedRole = role === 'supplier' ? 'supplier' : 'admin';
  const normalizedUsername = String(username || '').trim();

  if (!normalizedUsername) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  const activeAt = new Date().toISOString();

  updateLocalSessionActivity(normalizedRole, normalizedUsername, eventType, activeAt, today);

  try {
    const response = await fetch(CATSOFT_SESSION_ACTIVITY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: normalizedRole, username: normalizedUsername, eventType, activeAt, loginDate: today })
    });

    if (!response.ok) {
      throw new Error(`API activity ${response.status}`);
    }

    const payload = await response.json();
    if (Array.isArray(payload.adminAccounts)) {
      saveAdminAccounts(payload.adminAccounts);
    }
    if (Array.isArray(payload.supplierAccounts)) {
      saveSupplierAccounts(payload.supplierAccounts);
    }
    return payload;
  } catch (error) {
    return null;
  }
}

function updateLocalSessionActivity(role, username, eventType, activeAt, today) {
  const key = role === 'supplier' ? CATSOFT_SUPPLIER_ACCOUNTS_KEY : CATSOFT_ADMIN_ACCOUNTS_KEY;
  const loader = role === 'supplier' ? loadSupplierAccounts : loadAdminAccounts;
  const saver = role === 'supplier' ? saveSupplierAccounts : saveAdminAccounts;
  const accounts = loader();
  const nextAccounts = accounts.map((account) => {
    if (normalizeAdminValue(account.username) !== normalizeAdminValue(username)) {
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

  if (nextAccounts.some((account, index) => account !== accounts[index])) {
    saver(nextAccounts);
  } else if (key) {
    localStorage.setItem(key, JSON.stringify(accounts));
  }
}

function loadAdminSession() {
  try {
    return JSON.parse(sessionStorage.getItem(CATSOFT_ADMIN_SESSION_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function saveAdminSession(session) {
  sessionStorage.setItem(CATSOFT_ADMIN_SESSION_KEY, JSON.stringify(session));
}

function clearAdminSession() {
  sessionStorage.removeItem(CATSOFT_ADMIN_SESSION_KEY);
}

function isOwnerCredential(username, password) {
  return normalizeAdminValue(username) === normalizeAdminValue(CATSOFT_OWNER_USERNAME) && password === CATSOFT_OWNER_PASSWORD;
}

function getAccountByUsername(username) {
  return loadAdminAccounts().find((account) => normalizeAdminValue(account.username) === normalizeAdminValue(username));
}

function getCurrentAdmin() {
  const session = loadAdminSession();

  if (!session || !session.username) {
    return null;
  }

  if (session.role === 'owner' && normalizeAdminValue(session.username) === normalizeAdminValue(CATSOFT_OWNER_USERNAME)) {
    return {
      username: CATSOFT_OWNER_USERNAME,
      role: 'owner',
      tools: CATSOFT_ADMIN_TOOLS.map((tool) => tool.id),
      inboxRules: [],
      inboxAccessAll: true
    };
  }

  const account = getAccountByUsername(session.username);

  if (!account) {
    clearAdminSession();
    return null;
  }

  return {
    username: account.username,
    role: 'admin',
    tools: Array.isArray(account.tools) ? account.tools : [],
    inboxRules: normalizeInboxRules(account),
    inboxAccessAll: Boolean(account.inboxAccessAll)
  };
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(value) {
  const clean = String(value || '').replace(/[^a-f0-9]/gi, '');
  const bytes = new Uint8Array(clean.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(clean.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || '')));
  return bytesToHex(new Uint8Array(digest));
}

async function createPasswordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bytesToHex(salt);
  const hashHex = await sha256Hex(`${saltHex}:${password}`);
  return `sha256$${saltHex}$${hashHex}`;
}

async function verifyPasswordHash(password, passwordHash) {
  const parts = String(passwordHash || '').split('$');

  if (parts.length !== 3 || parts[0] !== 'sha256') {
    return false;
  }

  const expectedHash = await sha256Hex(`${parts[1]}:${password}`);
  return expectedHash === parts[2];
}

async function verifyAccountPassword(account, password) {
  if (!account) {
    return false;
  }

  if (account.passwordHash) {
    return verifyPasswordHash(password, account.passwordHash);
  }

  return account.password === password;
}

function getPasswordStorageLabel(account) {
  if (account.passwordHash) {
    return 'Hash tersimpan';
  }

  if (account.password) {
    return `Legacy: ${account.password}`;
  }

  return 'Belum ada password';
}

async function migrateAdminPasswordIfLegacy(account, password) {
  if (!account || account.passwordHash || !account.password) {
    return;
  }

  const passwordHash = await createPasswordHash(password);
  const nextAccounts = loadAdminAccounts().map((item) => normalizeAdminValue(item.username) === normalizeAdminValue(account.username)
    ? { ...item, password: '', passwordHash, updatedAt: new Date().toISOString() }
    : item);
  saveAdminAccounts(nextAccounts);

  try {
    await pushAdminAccountsToApi(nextAccounts);
  } catch (error) {}
}

function adminHasToolAccess(toolId) {
  const admin = getCurrentAdmin();

  if (!toolId || !admin) {
    return Boolean(admin);
  }

  const tool = CATSOFT_ADMIN_TOOLS.find((item) => item.id === toolId);

  if (admin.role === 'owner') {
    return true;
  }

  if (tool && tool.ownerOnly) {
    return false;
  }

  return admin.tools.includes(toolId);
}

function getInboxAccess() {
  const admin = getCurrentAdmin();

  if (!admin || admin.role === 'owner') {
    return { all: true, rules: [] };
  }

  return {
    all: Boolean(admin.inboxAccessAll),
    rules: (admin.inboxRules || []).map(normalizeAdminValue).filter(Boolean)
  };
}

function getAllowedInboxRecipients() {
  return getInboxAccess().rules;
}

async function loginAdmin(username, password) {
  if (isOwnerCredential(username, password)) {
    saveAdminSession({ username: CATSOFT_OWNER_USERNAME, role: 'owner', loggedInAt: new Date().toISOString() });
    recordSessionActivity('admin', CATSOFT_OWNER_USERNAME, 'login');
    return { ok: true };
  }

  await syncAdminAccountsFromApi({ silent: true });
  const account = getAccountByUsername(username);

  if (!account || !(await verifyAccountPassword(account, password))) {
    return { ok: false, message: 'Username atau password salah.' };
  }

  saveAdminSession({ username: account.username, role: 'admin', loggedInAt: new Date().toISOString() });
  await migrateAdminPasswordIfLegacy(account, password);
  recordSessionActivity('admin', account.username, 'login');
  return { ok: true };
}

function injectAuthStyles() {
  if (document.getElementById('catsoftAdminAuthStyles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'catsoftAdminAuthStyles';
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

    .admin-login-brand span,
    .admin-access-kicker {
      display: block;
      color: #2563eb;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .admin-login-brand h1,
    .admin-access-panel h2 {
      margin: 4px 0 0;
      font-size: 28px;
      line-height: 1.1;
    }

    .admin-login-form,
    .admin-access-form {
      display: grid;
      gap: 14px;
      min-width: 0;
    }

    .admin-login-form label,
    .admin-access-form label {
      display: grid;
      gap: 7px;
      color: #334155;
      font-size: 13px;
      font-weight: 800;
    }

    .admin-login-form input,
    .admin-access-form input,
    .admin-access-form textarea {
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
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .admin-password-row input {
      min-width: 0;
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

    @media (max-width: 420px) {
      .admin-login-page {
        padding: 16px;
      }

      .admin-login-panel {
        width: calc(100vw - 32px);
        max-width: 100%;
        padding: 18px;
      }

      .admin-password-row {
        grid-template-columns: 1fr;
      }

      .admin-password-toggle {
        width: 100%;
      }
    }

    .admin-login-form textarea,
    .admin-access-form textarea {
      min-height: 92px;
      resize: vertical;
    }

    .admin-login-error,
    .admin-access-status {
      min-height: 20px;
      color: #dc2626;
      font-size: 13px;
      font-weight: 800;
    }

    .admin-access-status.success {
      color: #047857;
    }

    .admin-login-submit,
    .admin-access-form button,
    .admin-account-card button {
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
      cursor: pointer;
      box-shadow: 0 12px 28px rgba(37, 99, 235, 0.16);
    }

    .admin-denied-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }

    .admin-access-panel {
      margin-top: 28px;
      padding-top: 26px;
      border-top: 1px solid #dbeafe;
    }

    .admin-access-header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 16px;
      margin-bottom: 18px;
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
      text-transform: uppercase;
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

    .admin-profile button[data-admin-password] {
      background: #f8fafc;
      color: #334155;
      border-color: #e2e8f0;
    }

    .admin-account-secret {
      display: inline-flex;
      align-items: center;
      max-width: 100%;
      min-height: 24px;
      border-radius: 999px;
      padding: 5px 10px;
      background: #fff7ed;
      color: #9a3412;
      border: 1px solid #fed7aa;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      font-weight: 850;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

    .admin-auth-dialog form {
      display: grid;
      gap: 12px;
    }

    .admin-auth-dialog label {
      display: grid;
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

    .admin-access-grid {
      display: grid;
      grid-template-columns: minmax(300px, 0.76fr) minmax(420px, 1.24fr);
      gap: 14px;
      align-items: start;
    }

    .admin-access-card,
    .admin-account-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
      padding: 14px;
    }

    .admin-access-checks {
      display: grid;
      gap: 9px;
    }

    .admin-access-field-block {
      display: grid;
      gap: 10px;
    }

    .admin-access-field-block.is-hidden {
      display: none;
    }

    .admin-access-form .is-hidden {
      display: none;
    }

    .admin-access-label {
      color: #334155;
      font-size: 13px;
      font-weight: 900;
    }

    .admin-inbox-presets {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
    }

    .admin-access-checks label {
      position: relative;
      display: flex;
      align-items: center;
      gap: 9px;
      min-height: 40px;
      padding: 9px 10px 9px 9px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
    }

    .admin-access-checks label:has(input:checked) {
      border-color: #bfdbfe;
      background: #eff6ff;
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.08);
    }

    .admin-access-checks input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }

    .admin-check-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 20px;
      width: 20px;
      height: 20px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #fff;
      color: transparent;
      font-size: 13px;
      font-weight: 950;
      line-height: 1;
      transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
    }

    .admin-access-checks input:checked + .admin-check-icon {
      border-color: #2563eb;
      background: #2563eb;
      color: #fff;
    }

    .admin-check-text {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .admin-account-list {
      display: grid;
      gap: 10px;
    }

    .admin-account-toolbar {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 2px;
    }

    .admin-account-stat {
      min-height: 72px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
    }

    .admin-account-stat span {
      display: block;
      color: #64748b;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .admin-account-stat strong {
      display: block;
      margin-top: 5px;
      font-size: 22px;
      line-height: 1;
    }

    .admin-account-table {
      display: grid;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
    }

    .admin-account-row {
      display: grid;
      grid-template-columns: minmax(120px, 0.8fr) minmax(180px, 1.2fr) minmax(150px, 1fr) minmax(126px, auto);
      gap: 10px;
      align-items: center;
      padding: 12px;
      border-top: 1px solid #e2e8f0;
    }

    .admin-account-row:first-child {
      border-top: 0;
    }

    .admin-account-row.is-heading {
      min-height: 38px;
      padding-top: 9px;
      padding-bottom: 9px;
      background: #f8fafc;
      color: #64748b;
      font-size: 11px;
      font-weight: 950;
      text-transform: uppercase;
    }

    .admin-account-main {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .admin-account-main h3 {
      margin: 0;
      font-size: 16px;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .admin-account-main span {
      color: #64748b;
      font-size: 12px;
      font-weight: 800;
    }

    .admin-account-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      color: #334155;
      font-size: 12px;
      font-weight: 800;
    }

    .admin-pill {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      max-width: 100%;
      border-radius: 999px;
      padding: 5px 10px;
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #dbeafe;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      line-height: 1.1;
    }

    .admin-pill.neutral {
      background: #f8fafc;
      color: #475569;
      border-color: #e2e8f0;
    }

    .admin-account-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .admin-account-actions button {
      min-height: 36px;
      border: 1px solid #dbeafe;
      border-radius: 10px;
      padding: 8px 13px;
      background: #eff6ff;
      color: #1e40af;
      box-shadow: none;
      font-size: 12px;
    }

    .admin-account-actions button[data-delete-admin] {
      background: #fee2e2;
      color: #991b1b;
      border-color: #fecaca;
      box-shadow: none;
    }

    .admin-form-actions {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
    }

    .admin-form-actions button[type="button"] {
      background: #f1f5f9;
      color: #334155;
      box-shadow: none;
    }

    @media (max-width: 1100px) {
      .admin-access-header,
      .admin-access-grid {
        grid-template-columns: 1fr;
        flex-direction: column;
        align-items: stretch;
      }

      .admin-session-bar {
        justify-content: flex-start;
        grid-column: 1 / -1;
        width: 100%;
      }

      .admin-profile {
        width: 100%;
      }

      .admin-profile-actions {
        grid-column: 1 / -1;
        justify-content: stretch;
      }

      .admin-profile-actions button {
        flex: 1 1 120px;
      }

      .admin-profile-name {
        max-width: none;
      }

      .header-actions .admin-session-bar {
        grid-column: 1 / -1;
        width: 100%;
      }

      .header-actions .admin-profile {
        width: 100%;
      }

      .admin-account-toolbar {
        grid-template-columns: 1fr;
      }

      .admin-account-row {
        grid-template-columns: 1fr;
      }

      .admin-account-row.is-heading {
        display: none;
      }

      .admin-account-actions {
        justify-content: flex-start;
      }
    }

    @media (max-width: 520px) {
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

      .admin-account-actions,
      .admin-form-actions {
        grid-template-columns: 1fr;
      }

      .admin-account-actions button,
      .admin-form-actions button {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);
}

function renderLogin(message = '') {
  document.body.classList.add('catsoft-auth-locked');
  document.body.insertAdjacentHTML('afterbegin', `
    <section class="admin-login-page" aria-labelledby="adminLoginTitle">
      <div class="admin-login-panel">
      <div class="admin-login-brand">
        <img src="logo.png" alt="Catsoft" />
        <div>
          <span>Catsoft Tools</span>
          <h1 id="adminLoginTitle">Admin Login</h1>
        </div>
      </div>
      <form class="admin-login-form" id="adminLoginForm">
        <label>
          Username
          <input id="adminLoginUsername" type="text" autocomplete="username" required />
        </label>
        <label>
          Password
          <span class="admin-password-row">
            <input id="adminLoginPassword" type="password" autocomplete="current-password" required />
            <button class="admin-password-toggle" id="adminPasswordToggle" type="button">Lihat</button>
          </span>
        </label>
        <p class="admin-login-error" id="adminLoginError" aria-live="polite">${escapeAdminHtml(message)}</p>
        <button class="admin-login-submit" type="submit">Masuk Admin Tools</button>
      </form>
      </div>
    </section>
  `);

  document.getElementById('adminLoginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('adminLoginUsername').value;
    const password = document.getElementById('adminLoginPassword').value;
    const submitButton = event.currentTarget.querySelector('.admin-login-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Memeriksa...';
    const result = await loginAdmin(username, password);

    if (!result.ok) {
      document.getElementById('adminLoginError').textContent = result.message;
      submitButton.disabled = false;
      submitButton.textContent = 'Masuk Admin Tools';
      return;
    }

    window.location.reload();
  });

  document.getElementById('adminPasswordToggle').addEventListener('click', () => {
    const passwordInput = document.getElementById('adminLoginPassword');
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    document.getElementById('adminPasswordToggle').textContent = isHidden ? 'Sembunyi' : 'Lihat';
  });
}

function renderAccessDenied() {
  const admin = getCurrentAdmin();
  document.body.classList.add('catsoft-auth-locked');
  document.body.insertAdjacentHTML('afterbegin', `
    <section class="admin-login-page" aria-labelledby="adminDeniedTitle">
      <div class="admin-login-panel">
      <div class="admin-login-brand">
        <img src="logo.png" alt="Catsoft" />
        <div>
          <span>Catsoft Tools</span>
          <h1 id="adminDeniedTitle">Akses Ditolak</h1>
        </div>
      </div>
      <p>Akun ${escapeAdminHtml(admin ? admin.username : 'admin')} belum diberi akses ke halaman ini.</p>
      <div class="admin-denied-actions">
        <a class="admin-login-submit" href="admin-tools.html">Kembali</a>
        <button class="admin-login-submit" id="adminLogoutDenied" type="button">Logout</button>
      </div>
      </div>
    </section>
  `);

  document.getElementById('adminLogoutDenied').addEventListener('click', () => {
    clearAdminSession();
    window.location.href = 'admin-tools.html';
  });
}

function escapeAdminHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getAdminInitials(username) {
  const compact = String(username || 'AD').replace(/[^a-z0-9]/gi, '');

  if (!compact) {
    return 'AD';
  }

  const uppercase = compact.toUpperCase();
  return uppercase.length === 1 ? uppercase : `${uppercase[0]}${uppercase[Math.min(uppercase.length - 1, 1)]}`;
}

function closeAdminPasswordDialog() {
  const dialog = document.getElementById('adminPasswordDialog');
  if (dialog) {
    dialog.remove();
  }
}

function showAdminPasswordDialog() {
  const admin = getCurrentAdmin();

  if (!admin || document.getElementById('adminPasswordDialog')) {
    return;
  }

  const isOwner = admin.role === 'owner';
  document.body.insertAdjacentHTML('beforeend', `
    <div class="admin-auth-modal" id="adminPasswordDialog" role="dialog" aria-modal="true" aria-labelledby="adminPasswordTitle">
      <div class="admin-auth-dialog">
        <h2 id="adminPasswordTitle">Atur Password</h2>
        <form id="adminPasswordForm">
          <label>
            Password saat ini
            <input id="adminCurrentPassword" type="password" autocomplete="current-password" ${isOwner ? 'disabled' : 'required'} />
          </label>
          <label>
            Password baru
            <input id="adminNewPassword" type="password" autocomplete="new-password" minlength="6" ${isOwner ? 'disabled' : 'required'} />
          </label>
          <label>
            Ulangi password baru
            <input id="adminConfirmPassword" type="password" autocomplete="new-password" minlength="6" ${isOwner ? 'disabled' : 'required'} />
          </label>
          <p class="admin-login-error" id="adminPasswordStatus" aria-live="polite">${isOwner ? 'Password OwnerCatsoft masih memakai kredensial utama di konfigurasi.' : ''}</p>
          <div class="admin-auth-dialog-actions">
            <button type="submit" ${isOwner ? 'disabled' : ''}>Simpan Password</button>
            <button type="button" id="adminPasswordCancel">Tutup</button>
          </div>
        </form>
      </div>
    </div>
  `);

  document.getElementById('adminPasswordCancel').addEventListener('click', closeAdminPasswordDialog);
  document.getElementById('adminPasswordDialog').addEventListener('click', (event) => {
    if (event.target.id === 'adminPasswordDialog') {
      closeAdminPasswordDialog();
    }
  });

  document.getElementById('adminPasswordForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await updateCurrentAdminPassword(admin);
  });
}

async function updateCurrentAdminPassword(admin) {
  const status = document.getElementById('adminPasswordStatus');
  const currentPassword = document.getElementById('adminCurrentPassword').value;
  const newPassword = document.getElementById('adminNewPassword').value;
  const confirmPassword = document.getElementById('adminConfirmPassword').value;
  const account = getAccountByUsername(admin.username);

  if (!account || !(await verifyAccountPassword(account, currentPassword))) {
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

  const nextAccounts = loadAdminAccounts().map((item) => normalizeAdminValue(item.username) === normalizeAdminValue(admin.username)
    ? { ...item, password: '', passwordHash: '', updatedAt: new Date().toISOString() }
    : item);
  const passwordHash = await createPasswordHash(newPassword);
  nextAccounts.forEach((item) => {
    if (normalizeAdminValue(item.username) === normalizeAdminValue(admin.username)) {
      item.passwordHash = passwordHash;
    }
  });

  saveAdminAccounts(nextAccounts);
  status.textContent = 'Password tersimpan lokal, sinkronisasi...';

  try {
    await pushAdminAccountsToApi(nextAccounts);
    status.classList.add('success');
    status.textContent = 'Password berhasil diganti.';
    setTimeout(closeAdminPasswordDialog, 900);
  } catch (error) {
    status.textContent = `Password lokal berubah, sync web gagal: ${error.message}`;
  }
}

function addSessionControls() {
  const admin = getCurrentAdmin();
  const header = document.querySelector('.admin-nav, .header-actions');

  if (!admin || !header || header.querySelector('[data-admin-logout]')) {
    return;
  }

  const sessionBar = document.createElement('div');
  sessionBar.className = 'admin-session-bar';
  sessionBar.innerHTML = `
    <div class="admin-profile">
      <span class="admin-profile-avatar" aria-hidden="true">${escapeAdminHtml(getAdminInitials(admin.username))}</span>
      <span class="admin-profile-text">
        <span class="admin-profile-role">${escapeAdminHtml(admin.role === 'owner' ? 'Owner' : 'Admin')}</span>
        <span class="admin-profile-name">${escapeAdminHtml(admin.username)}</span>
      </span>
      <span class="admin-profile-actions">
        <button type="button" data-admin-password>Password</button>
        <button type="button" data-admin-logout>Logout</button>
      </span>
    </div>
  `;
  header.appendChild(sessionBar);
  sessionBar.querySelector('[data-admin-password]').addEventListener('click', showAdminPasswordDialog);
  sessionBar.querySelector('[data-admin-logout]').addEventListener('click', () => {
    clearAdminSession();
    window.location.href = 'admin-tools.html';
  });
}

function filterAdminToolCards() {
  const admin = getCurrentAdmin();
  let visibleCount = 0;
  document.querySelectorAll('[data-admin-tool-card]').forEach((card) => {
    const toolId = card.getAttribute('data-admin-tool-card');
    const tool = CATSOFT_ADMIN_TOOLS.find((item) => item.id === toolId);
    const hidden = !admin || (admin.role !== 'owner' && (tool && tool.ownerOnly || !admin.tools.includes(toolId)));
    card.hidden = hidden;

    if (!hidden) {
      visibleCount += 1;
    }
  });
  updateAdminToolsSummary(admin, visibleCount);
}

function updateAdminToolsSummary(admin, visibleCount) {
  const toolsSummary = document.querySelector('[data-admin-summary="tools"]');
  const accessSummary = document.querySelector('[data-admin-summary="access"]');

  if (toolsSummary) {
    toolsSummary.textContent = `${visibleCount} Aktif`;
  }

  if (accessSummary && admin) {
    accessSummary.textContent = admin.role === 'owner' ? 'Owner Full' : 'Terbatas';
  }
}

function formatAdminDateTime(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Belum ada';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function getOnlineLabel(activeAt) {
  const date = activeAt ? new Date(activeAt) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Offline';
  }

  return Date.now() - date.getTime() <= 2 * 60 * 1000 ? 'Online' : `Aktif ${formatAdminDateTime(activeAt)}`;
}

function renderOwnerAccessPanel() {
  const admin = getCurrentAdmin();
  const accessRoot = document.getElementById('adminAccessRoot');

  if (!accessRoot || !admin || admin.role !== 'owner' || document.getElementById('adminAccessPanel')) {
    return;
  }

  const panel = document.createElement('section');
  panel.className = 'admin-access-panel admin-access-page-panel';
  panel.id = 'adminAccessPanel';
  panel.innerHTML = `
    <div class="admin-access-header">
      <div>
        <span class="admin-access-kicker">OwnerCatsoft</span>
        <h2>Kelola Admin</h2>
      </div>
      <p class="admin-access-status" id="adminAccessStatus" aria-live="polite"></p>
    </div>
    <div class="admin-access-grid">
      <form class="admin-access-card admin-access-form" id="adminAccessForm">
        <input id="adminAccessOriginalUsername" type="hidden" />
        <label>
          Username admin
          <input id="adminAccessUsername" type="text" autocomplete="off" required />
        </label>
        <label>
          Password admin
          <input id="adminAccessPassword" type="text" autocomplete="off" required />
        </label>
        <div class="admin-access-field-block">
          <span class="admin-access-label">Akses tool</span>
          <div class="admin-access-checks" aria-label="Akses tool">
          ${CATSOFT_ADMIN_TOOLS.filter((tool) => !tool.ownerOnly).map((tool) => `
            <label>
              <input type="checkbox" name="tools" value="${escapeAdminHtml(tool.id)}" />
              <span class="admin-check-icon" aria-hidden="true">✓</span>
              <span class="admin-check-text">${escapeAdminHtml(tool.label)}</span>
            </label>
          `).join('')}
          </div>
        </div>
        <div class="admin-access-field-block" id="adminInboxAccessBlock">
          <span class="admin-access-label">Akses Email Inbox</span>
          <div class="admin-access-checks admin-inbox-presets" aria-label="Preset akses email">
            ${CATSOFT_INBOX_PRESETS.map((preset) => `
              <label>
                <input type="checkbox" name="inboxPresets" value="${escapeAdminHtml(preset.value)}" />
                <span class="admin-check-icon" aria-hidden="true">✓</span>
                <span class="admin-check-text">${escapeAdminHtml(preset.label)}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <label id="adminInboxRulesField">
          Rule custom
          <textarea id="adminAccessRules" placeholder="Contoh:&#10;openai&#10;adobe.com&#10;billing@catsoft.store&#10;kode verifikasi"></textarea>
        </label>
        <div class="admin-form-actions">
          <button type="submit">Simpan Admin</button>
          <button type="button" id="adminAccessCancelEdit">Bersihkan</button>
        </div>
      </form>
      <div class="admin-account-list" id="adminAccountList"></div>
    </div>
  `;

  accessRoot.appendChild(panel);
  wireOwnerAccessPanel();
  renderAdminAccountList();
}

function getAccessFormValues() {
  const tools = [...document.querySelectorAll('#adminAccessForm input[name="tools"]:checked')].map((input) => input.value);
  const hasInboxTool = tools.includes('email-inbox');
  const presetRules = [...document.querySelectorAll('#adminAccessForm input[name="inboxPresets"]:checked')].map((input) => input.value);
  const customRules = document.getElementById('adminAccessRules').value
    .split(/\n|,/)
    .map(normalizeAdminValue)
    .filter(Boolean);
  const inboxRules = hasInboxTool ? [...presetRules, ...customRules]
    .map(normalizeAdminValue)
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index) : [];

  return {
    originalUsername: document.getElementById('adminAccessOriginalUsername').value,
    username: document.getElementById('adminAccessUsername').value.trim(),
    password: document.getElementById('adminAccessPassword').value,
    tools,
    inboxAccessAll: inboxRules.includes('all'),
    inboxRules: inboxRules.filter((rule) => rule !== 'all')
  };
}

function setAccessStatus(message, type = '') {
  const status = document.getElementById('adminAccessStatus');

  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle('success', type === 'success');
}

function resetAccessForm() {
  const form = document.getElementById('adminAccessForm');
  form.reset();
  document.getElementById('adminAccessOriginalUsername').value = '';
  document.querySelectorAll('#adminAccessForm input[name="inboxPresets"]').forEach((input) => {
    input.checked = CATSOFT_DEFAULT_INBOX_RULES.includes(input.value);
  });
  document.getElementById('adminAccessRules').value = '';
  updateInboxAccessVisibility();
}

function wireOwnerAccessPanel() {
  resetAccessForm();

  document.getElementById('adminAccessCancelEdit').addEventListener('click', () => {
    resetAccessForm();
    setAccessStatus('Form siap untuk admin baru.', 'success');
  });

  document.querySelectorAll('#adminAccessForm input[name="tools"]').forEach((input) => {
    input.addEventListener('change', updateInboxAccessVisibility);
  });

  document.getElementById('adminAccessForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = getAccessFormValues();

    if (normalizeAdminValue(values.username) === normalizeAdminValue(CATSOFT_OWNER_USERNAME)) {
      setAccessStatus('Username OwnerCatsoft tidak bisa dipakai untuk admin lain.');
      return;
    }

    const accounts = loadAdminAccounts();
    const usernameTaken = accounts.some((account) => (
      normalizeAdminValue(account.username) === normalizeAdminValue(values.username)
      && normalizeAdminValue(account.username) !== normalizeAdminValue(values.originalUsername)
    ));

    if (usernameTaken) {
      setAccessStatus('Username admin sudah terdaftar.');
      return;
    }

    const existingAccount = values.originalUsername
      ? accounts.find((account) => normalizeAdminValue(account.username) === normalizeAdminValue(values.originalUsername))
      : null;

    if (!values.username || (!values.password && !existingAccount)) {
      setAccessStatus('Username dan password wajib diisi untuk admin baru.');
      return;
    }

    const passwordHash = values.password ? await createPasswordHash(values.password) : (existingAccount ? existingAccount.passwordHash : '');
    const nextAccount = {
      username: values.username,
      password: values.password ? '' : (existingAccount ? existingAccount.password : ''),
      passwordHash,
      tools: values.tools,
      inboxAccessAll: values.inboxAccessAll,
      inboxRules: values.inboxRules,
      lastLoginAt: existingAccount ? existingAccount.lastLoginAt : '',
      activeAt: existingAccount ? existingAccount.activeAt : '',
      loginCountToday: existingAccount ? existingAccount.loginCountToday : 0,
      loginCountDate: existingAccount ? existingAccount.loginCountDate : '',
      createdAt: values.originalUsername ? (existingAccount || {}).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextAccounts = values.originalUsername
      ? accounts.map((account) => normalizeAdminValue(account.username) === normalizeAdminValue(values.originalUsername) ? nextAccount : account)
      : [...accounts, nextAccount];

    saveAdminAccounts(nextAccounts);
    resetAccessForm();
    renderAdminAccountList();
    setAccessStatus('Akses admin tersimpan lokal, mengirim sync...', 'success');

    try {
      await pushAdminAccountsToApi(nextAccounts);
      setAccessStatus('Akses admin tersimpan dan tersinkron.', 'success');
    } catch (error) {
      setAccessStatus(`Belum bisa login di device lain. Sync web gagal: ${error.message}`);
    }
  });
}

function updateInboxAccessVisibility() {
  const inboxToolInput = document.querySelector('#adminAccessForm input[name="tools"][value="email-inbox"]');
  const inboxBlock = document.getElementById('adminInboxAccessBlock');
  const inboxRulesField = document.getElementById('adminInboxRulesField');
  const isVisible = Boolean(inboxToolInput && inboxToolInput.checked);

  if (!inboxBlock || !inboxRulesField) {
    return;
  }

  inboxBlock.classList.toggle('is-hidden', !isVisible);
  inboxRulesField.classList.toggle('is-hidden', !isVisible);

  if (!isVisible) {
    document.querySelectorAll('#adminAccessForm input[name="inboxPresets"]').forEach((input) => {
      input.checked = false;
    });
    document.getElementById('adminAccessRules').value = '';
  } else {
    const hasCheckedRule = Boolean(document.querySelector('#adminAccessForm input[name="inboxPresets"]:checked'));
    const hasCustomRule = Boolean(document.getElementById('adminAccessRules').value.trim());

    if (!hasCheckedRule && !hasCustomRule) {
      document.querySelectorAll('#adminAccessForm input[name="inboxPresets"]').forEach((input) => {
        input.checked = CATSOFT_DEFAULT_INBOX_RULES.includes(input.value);
      });
    }
  }
}

function renderAdminAccountList() {
  const list = document.getElementById('adminAccountList');

  if (!list) {
    return;
  }

  const accounts = loadAdminAccounts();
  const totalTools = CATSOFT_ADMIN_TOOLS.filter((tool) => !tool.ownerOnly).length;
  const allInboxCount = accounts.filter((account) => account.inboxAccessAll).length;
  const toolAccessCount = accounts.reduce((total, account) => total + (account.tools || []).length, 0);

  if (!accounts.length) {
    list.innerHTML = `
      <div class="admin-account-toolbar">
        <div class="admin-account-stat"><span>Total admin</span><strong>0</strong></div>
        <div class="admin-account-stat"><span>Tool access</span><strong>0</strong></div>
        <div class="admin-account-stat"><span>Full inbox</span><strong>0</strong></div>
      </div>
      <div class="admin-account-card">
        <div class="admin-account-main">
          <h3>Belum ada admin tambahan</h3>
          <span>Tambahkan admin baru dari form di sebelah kiri.</span>
        </div>
      </div>
    `;
    return;
  }

  const rows = accounts.map((account) => {
    const toolLabels = CATSOFT_ADMIN_TOOLS
      .filter((tool) => (account.tools || []).includes(tool.id))
      .map((tool) => tool.label);
    const inboxRules = normalizeInboxRules(account);
    const inboxSummary = account.inboxAccessAll
      ? 'Semua email masuk'
      : (inboxRules.length ? `${inboxRules.length} rule inbox` : 'Tidak ada email inbox');
    const updatedText = formatAdminDateTime(account.updatedAt);
    const loginToday = account.loginCountDate === new Date().toISOString().slice(0, 10) ? Number(account.loginCountToday || 0) : 0;

    return `
      <div class="admin-account-row">
        <div class="admin-account-main">
          <h3>${escapeAdminHtml(account.username)}</h3>
          <span>Update: ${escapeAdminHtml(updatedText)} - ${escapeAdminHtml(getOnlineLabel(account.activeAt))}</span>
        </div>
        <div class="admin-account-meta">
          ${toolLabels.slice(0, 3).map((label) => `<span class="admin-pill">${escapeAdminHtml(label)}</span>`).join('')}
          ${toolLabels.length > 3 ? `<span class="admin-pill neutral">+${toolLabels.length - 3} tool</span>` : ''}
          ${!toolLabels.length ? '<span class="admin-pill neutral">Tidak ada tool</span>' : ''}
          <span class="admin-account-secret" title="Status password">${escapeAdminHtml(getPasswordStorageLabel(account))}</span>
          <span class="admin-pill neutral">Login hari ini: ${escapeAdminHtml(loginToday)}</span>
        </div>
        <span class="admin-pill neutral" title="Last login: ${escapeAdminHtml(formatAdminDateTime(account.lastLoginAt))}">${escapeAdminHtml(inboxSummary)}</span>
        <div class="admin-account-actions">
          <button type="button" data-edit-admin="${escapeAdminHtml(account.username)}">Edit</button>
          <button type="button" data-delete-admin="${escapeAdminHtml(account.username)}">Hapus</button>
        </div>
      </div>
    `;
  }).join('');

  list.innerHTML = `
    <div class="admin-account-toolbar">
      <div class="admin-account-stat"><span>Total admin</span><strong>${accounts.length}</strong></div>
      <div class="admin-account-stat"><span>Tool access</span><strong>${toolAccessCount}/${accounts.length * totalTools}</strong></div>
      <div class="admin-account-stat"><span>Full inbox</span><strong>${allInboxCount}</strong></div>
    </div>
    <div class="admin-account-table">
      <div class="admin-account-row is-heading">
        <span>Akun</span>
        <span>Akses tool</span>
        <span>Email inbox</span>
        <span>Aksi</span>
      </div>
      ${rows}
    </div>
  `;

  list.querySelectorAll('[data-edit-admin]').forEach((button) => {
    button.addEventListener('click', () => editAdminAccount(button.dataset.editAdmin));
  });

  list.querySelectorAll('[data-delete-admin]').forEach((button) => {
    button.addEventListener('click', () => deleteAdminAccount(button.dataset.deleteAdmin));
  });
}

function renderSupplierAccessPanel() {
  const admin = getCurrentAdmin();
  const accessRoot = document.getElementById('supplierAccessRoot');

  if (!accessRoot || !admin || !adminHasToolAccess('supplier-access') || document.getElementById('supplierAccessPanel')) {
    return;
  }

  const panel = document.createElement('section');
  panel.className = 'admin-access-panel admin-access-page-panel';
  panel.id = 'supplierAccessPanel';
  panel.innerHTML = `
    <div class="admin-access-header">
      <div>
        <span class="admin-access-kicker">${escapeAdminHtml(admin.role === 'owner' ? 'OwnerCatsoft' : 'AdminCatsoft')}</span>
        <h2>Kelola Supplier</h2>
      </div>
      <p class="admin-access-status" id="supplierAccessStatus" aria-live="polite"></p>
    </div>
    <div class="admin-access-grid">
      <form class="admin-access-card admin-access-form" id="supplierAccessForm">
        <input id="supplierAccessOriginalUsername" type="hidden" />
        <label>
          Username supplier
          <input id="supplierAccessUsername" type="text" autocomplete="off" required />
        </label>
        <label>
          Password supplier
          <input id="supplierAccessPassword" type="text" autocomplete="off" required />
        </label>
        <div class="admin-access-field-block">
          <span class="admin-access-label">Akses tool Supplier Center</span>
          <div class="admin-access-checks" aria-label="Akses tool supplier">
            ${CATSOFT_SUPPLIER_TOOLS.map((tool) => `
              <label>
                <input type="checkbox" name="supplierTools" value="${escapeAdminHtml(tool.id)}" checked />
                <span class="admin-check-icon" aria-hidden="true">✓</span>
                <span class="admin-check-text">${escapeAdminHtml(tool.label)}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="admin-access-field-block" id="supplierInboxAccessBlock">
          <span class="admin-access-label">Akses Email Temp Mail</span>
          <div class="admin-access-checks admin-inbox-presets" aria-label="Preset akses email supplier">
            ${CATSOFT_INBOX_PRESETS.map((preset) => `
              <label>
                <input type="checkbox" name="supplierInboxPresets" value="${escapeAdminHtml(preset.value)}" />
                <span class="admin-check-icon" aria-hidden="true">✓</span>
                <span class="admin-check-text">${escapeAdminHtml(preset.label)}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <label id="supplierInboxRulesField">
          Rule custom
          <textarea id="supplierAccessRules" placeholder="Contoh:&#10;supplier@catsoft.store&#10;openai&#10;catsoft.digital&#10;kode verifikasi"></textarea>
        </label>
        <div class="admin-access-field-block">
          <span class="admin-access-label">Domain yang bisa dibuat supplier</span>
          <div class="admin-access-checks admin-inbox-presets" aria-label="Domain temp mail supplier">
            ${CATSOFT_SUPPLIER_DOMAINS.map((domain) => `
              <label>
                <input type="checkbox" name="supplierDomains" value="${escapeAdminHtml(domain)}" checked />
                <span class="admin-check-icon" aria-hidden="true">✓</span>
                <span class="admin-check-text">${escapeAdminHtml(domain)}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="admin-form-actions">
          <button type="submit">Simpan Supplier</button>
          <button type="button" id="supplierAccessCancelEdit">Bersihkan</button>
        </div>
      </form>
      <div class="admin-account-list" id="supplierAccountList"></div>
    </div>
  `;

  accessRoot.appendChild(panel);
  wireSupplierAccessPanel();
  renderSupplierAccountList();
  syncSupplierAccountsFromApi({ silent: true }).then(renderSupplierAccountList);
}

function getSupplierAccessFormValues() {
  const tools = [...document.querySelectorAll('#supplierAccessForm input[name="supplierTools"]:checked')].map((input) => input.value);
  const allowedDomains = [...document.querySelectorAll('#supplierAccessForm input[name="supplierDomains"]:checked')]
    .map((input) => normalizeAdminValue(input.value))
    .filter((domain) => CATSOFT_SUPPLIER_DOMAINS.includes(domain));
  const presetRules = [...document.querySelectorAll('#supplierAccessForm input[name="supplierInboxPresets"]:checked')].map((input) => input.value);
  const customRules = document.getElementById('supplierAccessRules').value
    .split(/\n|,/)
    .map(normalizeAdminValue)
    .filter(Boolean);
  const inboxRules = tools.includes('supplier-email') ? [...presetRules, ...customRules]
    .map(normalizeAdminValue)
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index) : [];

  return {
    originalUsername: document.getElementById('supplierAccessOriginalUsername').value,
    username: document.getElementById('supplierAccessUsername').value.trim(),
    password: document.getElementById('supplierAccessPassword').value,
    tools,
    allowedDomains,
    inboxAccessAll: inboxRules.includes('all'),
    inboxRules: inboxRules.filter((rule) => rule !== 'all')
  };
}

function setSupplierAccessStatus(message, type = '') {
  const status = document.getElementById('supplierAccessStatus');

  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle('success', type === 'success');
}

function resetSupplierAccessForm() {
  const form = document.getElementById('supplierAccessForm');
  if (!form) {
    return;
  }

  form.reset();
  document.getElementById('supplierAccessOriginalUsername').value = '';
  document.querySelectorAll('#supplierAccessForm input[name="supplierTools"]').forEach((input) => {
    input.checked = input.value === 'supplier-email';
  });
  document.querySelectorAll('#supplierAccessForm input[name="supplierInboxPresets"]').forEach((input) => {
    input.checked = false;
  });
  document.querySelectorAll('#supplierAccessForm input[name="supplierDomains"]').forEach((input) => {
    input.checked = true;
  });
  document.getElementById('supplierAccessRules').value = '';
}

function wireSupplierAccessPanel() {
  resetSupplierAccessForm();

  document.getElementById('supplierAccessCancelEdit').addEventListener('click', () => {
    resetSupplierAccessForm();
    setSupplierAccessStatus('Form siap untuk supplier baru.', 'success');
  });

  document.getElementById('supplierAccessForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = getSupplierAccessFormValues();

    const accounts = loadSupplierAccounts();
    const usernameTaken = accounts.some((account) => (
      normalizeAdminValue(account.username) === normalizeAdminValue(values.username)
      && normalizeAdminValue(account.username) !== normalizeAdminValue(values.originalUsername)
    ));

    if (usernameTaken) {
      setSupplierAccessStatus('Username supplier sudah terdaftar.');
      return;
    }

    const admin = getCurrentAdmin();
    const existingAccount = values.originalUsername
      ? accounts.find((account) => normalizeAdminValue(account.username) === normalizeAdminValue(values.originalUsername))
      : null;

    if (!values.username || (!values.password && !existingAccount)) {
      setSupplierAccessStatus('Username dan password wajib diisi untuk supplier baru.');
      return;
    }

    const passwordHash = values.password ? await createPasswordHash(values.password) : (existingAccount ? existingAccount.passwordHash : '');
    const nextAccount = {
      username: values.username,
      password: values.password ? '' : (existingAccount ? existingAccount.password : ''),
      passwordHash,
      tools: values.tools,
      allowedDomains: values.allowedDomains.length ? values.allowedDomains : [CATSOFT_SUPPLIER_DOMAINS[0]],
      inboxAccessAll: values.inboxAccessAll,
      inboxRules: values.inboxRules,
      createdBy: admin ? admin.username : '',
      lastLoginAt: existingAccount ? existingAccount.lastLoginAt : '',
      activeAt: existingAccount ? existingAccount.activeAt : '',
      loginCountToday: existingAccount ? existingAccount.loginCountToday : 0,
      loginCountDate: existingAccount ? existingAccount.loginCountDate : '',
      createdAt: values.originalUsername ? (existingAccount || {}).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const nextAccounts = values.originalUsername
      ? accounts.map((account) => normalizeAdminValue(account.username) === normalizeAdminValue(values.originalUsername) ? nextAccount : account)
      : [...accounts, nextAccount];

    saveSupplierAccounts(nextAccounts);
    resetSupplierAccessForm();
    renderSupplierAccountList();
    setSupplierAccessStatus('Akses supplier tersimpan lokal, mengirim sync...', 'success');

    try {
      await pushSupplierAccountsToApi(nextAccounts);
      setSupplierAccessStatus('Akses supplier tersimpan dan tersinkron.', 'success');
    } catch (error) {
      setSupplierAccessStatus(`Belum bisa login di device lain. Sync web gagal: ${error.message}`);
    }
  });
}

function renderSupplierAccountList() {
  const list = document.getElementById('supplierAccountList');

  if (!list) {
    return;
  }

  const accounts = loadSupplierAccounts();
  const fullInboxCount = accounts.filter((account) => account.inboxAccessAll).length;
  const emailToolCount = accounts.filter((account) => (account.tools || []).includes('supplier-email')).length;

  if (!accounts.length) {
    list.innerHTML = `
      <div class="admin-account-toolbar">
        <div class="admin-account-stat"><span>Total supplier</span><strong>0</strong></div>
        <div class="admin-account-stat"><span>Email tool</span><strong>0</strong></div>
        <div class="admin-account-stat"><span>Full inbox</span><strong>0</strong></div>
      </div>
      <div class="admin-account-card">
        <div class="admin-account-main">
          <h3>Belum ada supplier</h3>
          <span>Tambahkan akun supplier dari form di sebelah kiri.</span>
        </div>
      </div>
    `;
    return;
  }

  const rows = accounts.map((account) => {
    const inboxRules = normalizeInboxRules(account);
    const inboxSummary = account.inboxAccessAll
      ? 'Semua email masuk'
      : (inboxRules.length ? `${inboxRules.length} rule email` : 'Tidak ada akses email');
    const domainSummary = (account.allowedDomains || []).length
      ? (account.allowedDomains || []).join(', ')
      : 'Tidak ada domain';
    const toolLabels = CATSOFT_SUPPLIER_TOOLS
      .filter((tool) => (account.tools || []).includes(tool.id))
      .map((tool) => tool.label);
    const updatedText = formatAdminDateTime(account.updatedAt);
    const loginToday = account.loginCountDate === new Date().toISOString().slice(0, 10) ? Number(account.loginCountToday || 0) : 0;

    return `
      <div class="admin-account-row">
        <div class="admin-account-main">
          <h3>${escapeAdminHtml(account.username)}</h3>
          <span>Update: ${escapeAdminHtml(updatedText)} - ${escapeAdminHtml(getOnlineLabel(account.activeAt))}</span>
        </div>
        <div class="admin-account-meta">
          ${toolLabels.map((label) => `<span class="admin-pill">${escapeAdminHtml(label)}</span>`).join('')}
          ${!toolLabels.length ? '<span class="admin-pill neutral">Tidak ada tool</span>' : ''}
          <span class="admin-account-secret" title="Status password">${escapeAdminHtml(getPasswordStorageLabel(account))}</span>
          <span class="admin-pill neutral">Login hari ini: ${escapeAdminHtml(loginToday)}</span>
        </div>
        <span class="admin-pill neutral" title="${escapeAdminHtml(domainSummary)} | Last login: ${escapeAdminHtml(formatAdminDateTime(account.lastLoginAt))}">${escapeAdminHtml(inboxSummary)} - ${escapeAdminHtml((account.allowedDomains || []).length)} domain</span>
        <div class="admin-account-actions">
          <button type="button" data-edit-supplier="${escapeAdminHtml(account.username)}">Edit</button>
          <button type="button" data-delete-supplier="${escapeAdminHtml(account.username)}">Hapus</button>
        </div>
      </div>
    `;
  }).join('');

  list.innerHTML = `
    <div class="admin-account-toolbar">
      <div class="admin-account-stat"><span>Total supplier</span><strong>${accounts.length}</strong></div>
      <div class="admin-account-stat"><span>Email tool</span><strong>${emailToolCount}</strong></div>
      <div class="admin-account-stat"><span>Full inbox</span><strong>${fullInboxCount}</strong></div>
    </div>
    <div class="admin-account-table">
      <div class="admin-account-row is-heading">
        <span>Akun</span>
        <span>Akses tool</span>
        <span>Email temp mail</span>
        <span>Aksi</span>
      </div>
      ${rows}
    </div>
  `;

  list.querySelectorAll('[data-edit-supplier]').forEach((button) => {
    button.addEventListener('click', () => editSupplierAccount(button.dataset.editSupplier));
  });
  list.querySelectorAll('[data-delete-supplier]').forEach((button) => {
    button.addEventListener('click', () => deleteSupplierAccount(button.dataset.deleteSupplier));
  });
}

function editSupplierAccount(username) {
  const account = getSupplierAccountByUsername(username);

  if (!account) {
    return;
  }

  document.getElementById('supplierAccessOriginalUsername').value = account.username;
  document.getElementById('supplierAccessUsername').value = account.username;
  document.getElementById('supplierAccessPassword').value = account.password || '';
  document.querySelectorAll('#supplierAccessForm input[name="supplierTools"]').forEach((input) => {
    input.checked = (account.tools || []).includes(input.value);
  });
  const inboxRules = normalizeInboxRules(account);
  document.querySelectorAll('#supplierAccessForm input[name="supplierInboxPresets"]').forEach((input) => {
    input.checked = input.value === 'all' ? Boolean(account.inboxAccessAll) : inboxRules.includes(input.value);
  });
  document.querySelectorAll('#supplierAccessForm input[name="supplierDomains"]').forEach((input) => {
    const allowedDomains = account.allowedDomains || CATSOFT_SUPPLIER_DOMAINS;
    input.checked = allowedDomains.includes(input.value);
  });
  const presetValues = CATSOFT_INBOX_PRESETS.map((preset) => preset.value);
  document.getElementById('supplierAccessRules').value = inboxRules
    .filter((rule) => !presetValues.includes(rule))
    .join('\n');
  setSupplierAccessStatus('Mode edit supplier.');
}

async function deleteSupplierAccount(username) {
  const nextAccounts = loadSupplierAccounts().filter((account) => normalizeAdminValue(account.username) !== normalizeAdminValue(username));
  saveSupplierAccounts(nextAccounts);
  renderSupplierAccountList();
  setSupplierAccessStatus('Supplier dihapus lokal, mengirim sync...', 'success');

  try {
    await pushSupplierAccountsToApi(nextAccounts);
    setSupplierAccessStatus('Supplier dihapus dan tersinkron.', 'success');
  } catch (error) {
    setSupplierAccessStatus(`Hapus belum tersinkron ke device lain. Sync web gagal: ${error.message}`);
  }
}

function editAdminAccount(username) {
  const account = getAccountByUsername(username);

  if (!account) {
    return;
  }

  document.getElementById('adminAccessOriginalUsername').value = account.username;
  document.getElementById('adminAccessUsername').value = account.username;
  document.getElementById('adminAccessPassword').value = account.password || '';
  document.querySelectorAll('#adminAccessForm input[name="tools"]').forEach((input) => {
    input.checked = (account.tools || []).includes(input.value);
  });
  const inboxRules = normalizeInboxRules(account);
  document.querySelectorAll('#adminAccessForm input[name="inboxPresets"]').forEach((input) => {
    input.checked = input.value === 'all' ? Boolean(account.inboxAccessAll) : inboxRules.includes(input.value);
  });
  const presetValues = CATSOFT_INBOX_PRESETS.map((preset) => preset.value);
  document.getElementById('adminAccessRules').value = inboxRules
    .filter((rule) => !presetValues.includes(rule))
    .join('\n');
  updateInboxAccessVisibility();
  setAccessStatus('Mode edit admin.');
}

async function deleteAdminAccount(username) {
  const nextAccounts = loadAdminAccounts().filter((account) => normalizeAdminValue(account.username) !== normalizeAdminValue(username));
  saveAdminAccounts(nextAccounts);

  const currentAdmin = getCurrentAdmin();
  if (currentAdmin && normalizeAdminValue(currentAdmin.username) === normalizeAdminValue(username)) {
    clearAdminSession();
  }

  renderAdminAccountList();
  setAccessStatus('Admin dihapus lokal, mengirim sync...', 'success');

  try {
    await pushAdminAccountsToApi(nextAccounts);
    setAccessStatus('Admin dihapus dan tersinkron.', 'success');
  } catch (error) {
      setAccessStatus(`Hapus belum tersinkron ke device lain. Sync web gagal: ${error.message}`);
  }
}

function startAdminAccountsAutoRefresh() {
  window.clearInterval(catsoftAdminAccountsRefreshTimer);

  const refresh = async () => {
    const admin = getCurrentAdmin();

    if (!admin) {
      return;
    }

    await syncAdminAccountsFromApi({ silent: true });

    if (document.getElementById('adminAccountList')) {
      renderAdminAccountList();
    }

    filterAdminToolCards();
  };

  catsoftAdminAccountsRefreshTimer = window.setInterval(refresh, CATSOFT_ADMIN_ACCOUNTS_REFRESH_MS);
  refresh();
}

function startAdminHeartbeat() {
  window.clearInterval(catsoftAdminHeartbeatTimer);
  const admin = getCurrentAdmin();

  if (!admin) {
    return;
  }

  recordSessionActivity('admin', admin.username, 'active');
  catsoftAdminHeartbeatTimer = window.setInterval(() => {
    const currentAdmin = getCurrentAdmin();
    if (currentAdmin) {
      recordSessionActivity('admin', currentAdmin.username, 'active');
    }
  }, 60000);
}

function initAdminAuth() {
  injectAuthStyles();

  const currentToolId = getCurrentAdminToolId();
  const admin = getCurrentAdmin();

  if (!admin) {
    renderLogin();
    return;
  }

  if (currentToolId && !adminHasToolAccess(currentToolId)) {
    renderAccessDenied();
    return;
  }

  window.CATSOFT_ADMIN_AUTHORIZED = true;
  addSessionControls();
  filterAdminToolCards();
  renderOwnerAccessPanel();
  renderSupplierAccessPanel();
  startAdminAccountsAutoRefresh();
  startAdminHeartbeat();
}

window.CatsoftAdminAuth = {
  getCurrentAdmin,
  hasToolAccess: adminHasToolAccess,
  getInboxAccess,
  getAllowedInboxRecipients,
  logout: clearAdminSession
};

initAdminAuth();
