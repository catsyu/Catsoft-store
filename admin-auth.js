const CATSOFT_OWNER_USERNAME = 'OwnerCatsoft';
const CATSOFT_OWNER_PASSWORD = 'Rhyhusnul24!';
const CATSOFT_ADMIN_SESSION_KEY = 'catsoftAdminSession';
const CATSOFT_ADMIN_ACCOUNTS_KEY = 'catsoftAdminAccounts';
const CATSOFT_ADMIN_ACCOUNTS_SYNC_KEY = 'catsoftAdminAccountsLastSync';
const CATSOFT_ADMIN_ACCOUNTS_API = window.CATSOFT_ADMIN_ACCOUNTS_API || getDefaultAdminAccountsApiEndpoint();
const CATSOFT_ADMIN_ACCOUNTS_REFRESH_MS = 10000;
const CATSOFT_SUPPLIER_ACCOUNTS_KEY = 'catsoftSupplierAccounts';
const CATSOFT_SUPPLIER_ACCOUNTS_API = window.CATSOFT_SUPPLIER_ACCOUNTS_API || getDefaultSupplierAccountsApiEndpoint();
const CATSOFT_CUSTOMER_ACCOUNTS_API = window.CATSOFT_CUSTOMER_ACCOUNTS_API || getDefaultCustomerAccountsApiEndpoint();
const CATSOFT_SESSION_ACTIVITY_API = window.CATSOFT_SESSION_ACTIVITY_API || getDefaultSessionActivityApiEndpoint();
let catsoftAdminAccountsRefreshTimer = null;
let catsoftAdminHeartbeatTimer = null;
let catsoftAdminPageSize = 10;
let catsoftSupplierPageSize = 10;
let catsoftActiveAdminAccessPane = '';
const catsoftActiveConsoleToolPanes = {};

const CATSOFT_ADMIN_TOOLS = [
  { id: 'customer-access', label: 'Customer Access', path: 'customer-access.html', route: '/customer-access' },
  { id: 'refund-calculator', label: 'Refund Calculator', path: 'refund-calculator.html', route: '/refund' },
  { id: 'customer-database', label: 'Customer Database', path: 'customer-database.html', route: '/customers' },
  { id: 'email-inbox', label: 'Email Inbox', path: 'email-inbox.html', route: '/mail' },
  { id: 'internal-chat', label: 'Chat Internal', path: 'internal-chat.html', route: '/chat' },
  { id: 'office-activation', label: 'Office Activation', path: 'office-activation.html', route: '/office' },
  { id: 'marketing-calculator', label: 'Marketing Calculator', path: 'marketing-calculator.html', route: '/marketing' },
  { id: 'content-editor', label: 'Content Editor', path: 'content-editor.html', route: '/content' },
  { id: 'supplier-access', label: 'Supplier Center Access', path: 'supplier-access.html', route: '/supplier-access' },
  { id: 'admin-access', label: 'Admin Access', path: 'admin-access.html', route: '/access', ownerOnly: true }
];

const CATSOFT_ADMIN_TOOL_GROUPS = {
  'customer-suite': ['customer-access', 'customer-database', 'refund-calculator', 'office-activation'],
  'marketing-suite': ['marketing-calculator', 'content-editor'],
  'access-console': ['admin-access', 'supplier-access']
};

const CATSOFT_ADMIN_ACCESS_TOOL_CATEGORIES = [
  {
    id: 'customer',
    label: 'Customer',
    note: 'Akun, Database, Refund, Aktivasi Office',
    tools: ['customer-access', 'customer-database', 'refund-calculator', 'office-activation']
  },
  {
    id: 'email',
    label: 'Komunikasi',
    note: 'Email Inbox Dan Chat Internal',
    tools: ['email-inbox', 'internal-chat']
  },
  {
    id: 'marketing',
    label: 'Marketing',
    note: 'Simulasi Dan Konten',
    tools: ['marketing-calculator', 'content-editor']
  },
  {
    id: 'access',
    label: 'Akses',
    note: 'Supplier Center',
    tools: ['supplier-access']
  }
];

const CATSOFT_CONSOLE_TOOL_PANES = {
  customer: CATSOFT_ADMIN_TOOL_GROUPS['customer-suite'],
  marketing: CATSOFT_ADMIN_TOOL_GROUPS['marketing-suite']
};

const CATSOFT_SUPPLIER_TOOLS = [
  { id: 'supplier-email', label: 'Email', path: 'supplier-email.html', route: '/mail' }
];

const CATSOFT_SUPPLIER_DOMAINS = [
  'catsoft.store',
  'catsoft.digital',
  'catsoft.online',
  'ask1q2.uk',
  'fadisa1.uk',
  'gasddqw1.uk',
  'kulamusic.us',
  'wkwkksks.uk'
];

const CATSOFT_DEFAULT_INBOX_RULES = [
  'openai',
  'adobe',
  'canva',
  'support',
  'chatgpt@catsoft.store'
];

const CATSOFT_INBOX_PRESETS = [
  { value: 'all', label: 'Semua Email Masuk' },
  { value: 'openai', label: 'OpenAI / ChatGPT' },
  { value: 'adobe', label: 'Adobe' },
  { value: 'canva', label: 'Canva' },
  { value: 'support', label: 'Support' },
  { value: 'office', label: 'Office' },
  ...CATSOFT_SUPPLIER_DOMAINS.map((domain) => ({
    value: domain,
    label: `Domain ${domain}`
  }))
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

function normalizeRoutePath(value) {
  const clean = `/${String(value || '').replace(/^\/+|\/+$/g, '')}`;
  return clean === '/' ? '/' : clean.toLowerCase();
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

function getDefaultCustomerAccountsApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (window.location.protocol === 'file:' || isLocalPage || hostname !== 'catsoft.store') {
    return 'https://catsoft.store/api/customer-accounts';
  }

  return '/api/customer-accounts';
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
  const routePath = normalizeRoutePath(window.location.pathname);
  const basePageName = pageName.replace(/\.html$/i, '');
  const tool = CATSOFT_ADMIN_TOOLS.find((item) => {
    const toolBasePath = String(item.path || '').replace(/\.html$/i, '');
    return item.path === pageName
      || toolBasePath === basePageName
      || normalizeRoutePath(item.route) === routePath
      || normalizeRoutePath(`/tool/${toolBasePath}`) === routePath;
  });
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
    whatsappTarget: normalizeWhatsappTarget(account.whatsappTarget || account.whatsapp_target || ''),
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

function normalizeWhatsappTarget(value) {
  const digits = String(value || '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith('8')) {
    return `62${digits}`;
  }

  return digits;
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

function adminCanUseAccessConsole(admin = getCurrentAdmin()) {
  return Boolean(admin && (
    admin.role === 'owner'
    || (Array.isArray(admin.tools) && (admin.tools.includes('admin-access') || admin.tools.includes('supplier-access')))
  ));
}

function adminCanUseAccessPane(paneName, admin = getCurrentAdmin()) {
  if (!admin) {
    return false;
  }

  if (admin.role === 'owner') {
    return true;
  }

  if (paneName === 'supplier') {
    return admin.tools.includes('supplier-access');
  }

  return admin.tools.includes('admin-access');
}

function getDefaultAccessPane(admin = getCurrentAdmin()) {
  return adminCanUseAccessPane('admin', admin) ? 'admin' : 'supplier';
}

function canAccessToolLink(toolId, admin = getCurrentAdmin()) {
  if (toolId === 'access-console') {
    return adminCanUseAccessConsole(admin);
  }

  if (!admin) {
    return false;
  }

  if (CATSOFT_ADMIN_TOOL_GROUPS[toolId]) {
    return CATSOFT_ADMIN_TOOL_GROUPS[toolId].some((childToolId) => canAccessToolLink(childToolId, admin));
  }

  const tool = CATSOFT_ADMIN_TOOLS.find((item) => item.id === toolId);
  return admin.role === 'owner' || !(tool && tool.ownerOnly) && admin.tools.includes(toolId);
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

    body.catsoft-embedded-tool {
      background: #fff !important;
      color: #222 !important;
      font-family: "Adobe Clean", adobe-clean, "Source Sans 3", "Segoe UI", Roboto, Arial, sans-serif !important;
      min-height: 0 !important;
      overflow: hidden !important;
    }

    body.catsoft-embedded-tool,
    body.catsoft-embedded-tool * {
      font-family: "Adobe Clean", adobe-clean, "Source Sans 3", "Segoe UI", Roboto, Arial, sans-serif !important;
    }

    body.catsoft-embedded-tool .admin-header,
    body.catsoft-embedded-tool .refund-header,
    body.catsoft-embedded-tool .customer-header,
    body.catsoft-embedded-tool .email-header,
    body.catsoft-embedded-tool .activation-header {
      display: none !important;
    }

    body.catsoft-embedded-tool .admin-page,
    body.catsoft-embedded-tool .refund-page,
    body.catsoft-embedded-tool .customer-page,
    body.catsoft-embedded-tool .email-page,
    body.catsoft-embedded-tool .activation-page {
      width: 100% !important;
      max-width: none !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 14px 16px 24px !important;
      background: #fff !important;
    }

    body.catsoft-embedded-tool .overview-band {
      margin-bottom: 14px !important;
      border-color: #d8d8d8 !important;
      background: #fff !important;
      box-shadow: none !important;
    }

    body.catsoft-embedded-tool .section-kicker {
      color: #555 !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      letter-spacing: 0 !important;
    }

    body.catsoft-embedded-tool h1,
    body.catsoft-embedded-tool h2,
    body.catsoft-embedded-tool h3,
    body.catsoft-embedded-tool strong,
    body.catsoft-embedded-tool label,
    body.catsoft-embedded-tool button {
      font-weight: 500 !important;
    }

    body.catsoft-embedded-tool input,
    body.catsoft-embedded-tool select,
    body.catsoft-embedded-tool textarea {
      border-color: #cfcfcf !important;
      border-radius: 8px !important;
      box-shadow: none !important;
    }

    body.catsoft-embedded-tool input:focus,
    body.catsoft-embedded-tool select:focus,
    body.catsoft-embedded-tool textarea:focus {
      border-color: #777 !important;
      box-shadow: none !important;
      outline: none !important;
    }

    body.catsoft-embedded-tool .refund-form,
    body.catsoft-embedded-tool .result-panel,
    body.catsoft-embedded-tool .customer-form,
    body.catsoft-embedded-tool .database-panel,
    body.catsoft-embedded-tool .inbox-panel,
    body.catsoft-embedded-tool .message-panel,
    body.catsoft-embedded-tool .activation-form,
    body.catsoft-embedded-tool .workflow-panel,
    body.catsoft-embedded-tool .marketing-panel,
    body.catsoft-embedded-tool .content-database-panel,
    body.catsoft-embedded-tool .content-editor-panel,
    body.catsoft-embedded-tool .content-import-panel,
    body.catsoft-embedded-tool .content-empty-state,
    body.catsoft-embedded-tool .content-preview-panel {
      border-color: #d8d8d8 !important;
      border-radius: 10px !important;
      background: #fff !important;
      box-shadow: none !important;
    }

    body.catsoft-embedded-tool .upload-panel,
    body.catsoft-embedded-tool .result-card,
    body.catsoft-embedded-tool .stat-card,
    body.catsoft-embedded-tool .temp-mail-panel,
    body.catsoft-embedded-tool .content-live-preview-card,
    body.catsoft-embedded-tool .content-preview-note,
    body.catsoft-embedded-tool .inline-suggestion {
      border-color: #d8d8d8 !important;
      background: #f8f8f8 !important;
      box-shadow: none !important;
    }

    body.catsoft-embedded-tool .result-card.primary {
      border-color: #111 !important;
      background: #111 !important;
      color: #fff !important;
    }

    body.catsoft-embedded-tool .primary-button,
    body.catsoft-embedded-tool .secondary-button,
    body.catsoft-embedded-tool .ghost-button,
    body.catsoft-embedded-tool .mini-button,
    body.catsoft-embedded-tool .suggestion-button,
    body.catsoft-embedded-tool button[type="submit"] {
      min-height: 34px;
      border-radius: 999px !important;
      box-shadow: none !important;
      font-size: 12px !important;
    }

    body.catsoft-embedded-tool .primary-button,
    body.catsoft-embedded-tool button[type="submit"] {
      border: 1px solid #111 !important;
      background: #111 !important;
      color: #fff !important;
    }

    body.catsoft-embedded-tool .secondary-button,
    body.catsoft-embedded-tool .ghost-button,
    body.catsoft-embedded-tool .mini-button,
    body.catsoft-embedded-tool .suggestion-button {
      border: 1px solid #cfcfcf !important;
      background: #fff !important;
      color: #333 !important;
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
      text-transform: none;
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

    .admin-access-form .admin-whatsapp-send {
      min-height: 36px;
      border: 1px solid #cfcfcf;
      border-radius: 999px;
      padding: 7px 13px;
      background: #fff;
      color: #222;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      box-shadow: none;
    }

    .admin-access-form .admin-whatsapp-send:hover,
    .admin-access-form .admin-whatsapp-send:focus-visible {
      border-color: #999;
      background: #f3f3f3;
      color: #111;
      outline: none;
      box-shadow: none;
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
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      max-width: 100%;
      min-height: 38px;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }

    .admin-profile-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      min-height: 38px;
      border: 0;
      border-radius: 999px;
      padding: 0;
      background: transparent;
      cursor: pointer;
    }

    .admin-profile-trigger:hover,
    .admin-profile-trigger:focus-visible {
      outline: none;
      filter: brightness(0.94);
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
      text-transform: none;
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
      text-transform: none;
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

      .admin-profile-name {
        max-width: none;
      }

      .header-actions .admin-session-bar {
        grid-column: auto;
        width: auto;
      }

      .header-actions .admin-profile {
        width: auto;
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
      .admin-profile-avatar {
        width: 34px;
        height: 34px;
        font-size: 12px;
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
        <a class="admin-login-submit" href="https://admin.catsoft.store/">Kembali</a>
        <button class="admin-login-submit" id="adminLogoutDenied" type="button">Logout</button>
      </div>
      </div>
    </section>
  `);

  document.getElementById('adminLogoutDenied').addEventListener('click', () => {
    clearAdminSession();
    window.location.href = 'https://admin.catsoft.store/';
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

function getAdminChatPopup() {
  return document.querySelector('[data-admin-chat-popup]');
}

function ensureAdminChatPopup() {
  let popup = getAdminChatPopup();

  if (popup) {
    return popup;
  }

  popup = document.createElement('section');
  popup.className = 'admin-chat-popup';
  popup.setAttribute('data-admin-chat-popup', '');
  popup.setAttribute('aria-label', 'Inbox Chat Internal');
  popup.hidden = true;
  popup.innerHTML = `
    <header class="admin-chat-popup-head">
      <div>
        <span>Inbox</span>
        <h2>Chat Internal</h2>
      </div>
      <button type="button" data-admin-chat-close aria-label="Tutup Chat">×</button>
    </header>
    <iframe class="admin-chat-popup-frame" title="Chat Internal" allow="clipboard-write" data-admin-chat-frame></iframe>
  `;

  document.body.appendChild(popup);
  popup.querySelector('[data-admin-chat-close]')?.addEventListener('click', closeAdminChatPopup);
  return popup;
}

function openAdminChatPopup() {
  const admin = getCurrentAdmin();

  if (!admin || !canAccessToolLink('internal-chat', admin)) {
    return;
  }

  const popup = ensureAdminChatPopup();
  const frame = popup.querySelector('[data-admin-chat-frame]');

  if (frame && !frame.getAttribute('src')) {
    frame.setAttribute('src', '/tool/internal-chat?embedded=1&popup=1');
  }

  popup.hidden = false;
  document.body.classList.add('admin-chat-popup-open');
}

function closeAdminChatPopup() {
  const popup = getAdminChatPopup();

  if (popup) {
    popup.hidden = true;
  }

  document.body.classList.remove('admin-chat-popup-open');
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

  if (!admin || !header || header.querySelector('[data-admin-profile-menu]')) {
    return;
  }

  const profileName = header.querySelector('.console-site-link');
  if (profileName) {
    profileName.textContent = admin.username;
  }

  const showInboxButton = document.body.classList.contains('admin-console-body') && canAccessToolLink('internal-chat', admin);
  const sessionBar = document.createElement('div');
  sessionBar.className = 'admin-session-bar';
  sessionBar.innerHTML = `
    <div class="admin-profile">
      <button class="admin-profile-trigger" type="button" data-admin-profile-toggle aria-expanded="false" aria-label="Buka Menu Profil ${escapeAdminHtml(admin.username)}">
        <span class="admin-profile-avatar" aria-hidden="true">${escapeAdminHtml(getAdminInitials(admin.username))}</span>
      </button>
      <div class="admin-profile-menu" data-admin-profile-menu hidden>
        <div class="admin-profile-menu-head">
          <span class="admin-profile-avatar" aria-hidden="true">${escapeAdminHtml(getAdminInitials(admin.username))}</span>
          <div>
            <span class="admin-profile-role">${escapeAdminHtml(admin.role === 'owner' ? 'Owner' : 'Admin')}</span>
            <span class="admin-profile-name">${escapeAdminHtml(admin.username)}</span>
          </div>
        </div>
        ${showInboxButton ? '<button type="button" data-admin-inbox>Inbox</button>' : ''}
        <button type="button" data-admin-password>Ubah Password</button>
        <button type="button" data-admin-logout>Logout</button>
      </div>
    </div>
  `;
  header.appendChild(sessionBar);
  const trigger = sessionBar.querySelector('[data-admin-profile-toggle]');
  const menu = sessionBar.querySelector('[data-admin-profile-menu]');
  const closeProfileMenu = () => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = menu.hidden;
    menu.hidden = !isOpen;
    trigger.setAttribute('aria-expanded', String(isOpen));
  });
  menu.addEventListener('click', (event) => event.stopPropagation());
  document.addEventListener('click', closeProfileMenu);
  sessionBar.querySelector('[data-admin-inbox]')?.addEventListener('click', () => {
    closeProfileMenu();
    openAdminChatPopup();
  });
  sessionBar.querySelector('[data-admin-password]').addEventListener('click', () => {
    closeProfileMenu();
    showAdminPasswordDialog();
  });
  sessionBar.querySelector('[data-admin-logout]').addEventListener('click', () => {
    clearAdminSession();
    window.location.href = 'https://admin.catsoft.store/';
  });
}

function filterAdminToolCards() {
  const admin = getCurrentAdmin();
  let visibleCount = 0;
  let cardCount = 0;
  document.querySelectorAll('[data-admin-tool-card]').forEach((card) => {
    cardCount += 1;
    const toolId = card.getAttribute('data-admin-tool-card');
    const tool = CATSOFT_ADMIN_TOOLS.find((item) => item.id === toolId);
    const hidden = !admin || (admin.role !== 'owner' && (tool && tool.ownerOnly || !admin.tools.includes(toolId)));
    card.hidden = hidden;

    if (!hidden) {
      visibleCount += 1;
    }
  });

  if (!cardCount && admin) {
    visibleCount = CATSOFT_ADMIN_TOOLS.filter((tool) => {
      return admin.role === 'owner' || (!tool.ownerOnly && admin.tools.includes(tool.id));
    }).length;
  }

  document.querySelectorAll('[data-admin-tool-link]').forEach((link) => {
    const toolId = link.getAttribute('data-admin-tool-link');
    link.hidden = !canAccessToolLink(toolId, admin);
  });

  document.querySelectorAll('[data-admin-tool-module]').forEach((module) => {
    const toolId = module.getAttribute('data-admin-tool-module');
    const hidden = !canAccessToolLink(toolId, admin);
    module.dataset.permissionHidden = hidden ? 'true' : 'false';
    if (hidden) {
      module.hidden = true;
    }
  });

  document.querySelectorAll('[data-tools-category]').forEach((category) => {
    category.hidden = !category.querySelector('[data-admin-tool-card]:not([hidden])');
  });

  updateAdminToolsSummary(admin, visibleCount);
  const consoleState = getCurrentAdminConsoleState();
  showAdminConsoleView(consoleState.view, {
    updateHash: false,
    scroll: false,
    adminAccessPane: consoleState.adminAccessPane || getActiveAdminAccessPane(),
    consoleToolPane: consoleState.consoleToolPane || getActiveConsoleToolPane(consoleState.view)
  });
}

function enableAdminToolAccordions() {
  const closeOtherAdminToolCategories = (activeCategory) => {
    document.querySelectorAll('[data-tools-category][open]').forEach((otherCategory) => {
      if (otherCategory !== activeCategory) {
        otherCategory.open = false;
      }
    });
  };

  document.querySelectorAll('[data-tools-category]').forEach((category) => {
    if (category.dataset.accordionReady === 'true') {
      return;
    }

    category.dataset.accordionReady = 'true';
    const summary = category.querySelector('summary');
    if (summary) {
      summary.addEventListener('click', () => {
        if (!category.open) {
          closeOtherAdminToolCategories(category);
        }
      });
    }

    category.addEventListener('toggle', () => {
      if (!category.open) {
        return;
      }

      closeOtherAdminToolCategories(category);
    });
  });

  document.querySelectorAll('.tools-console-nav a[href^="#"], .console-tabs a[href^="#"], .console-tour-card a[href^="#"], .console-panel-head a[href^="#"]').forEach((link) => {
    if (link.dataset.navReady === 'true') {
      return;
    }

    link.dataset.navReady = 'true';
    link.addEventListener('click', () => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target && target.matches('[data-tools-category]')) {
        closeOtherAdminToolCategories(target);
        target.open = true;
      }
    });
  });
}

function getCurrentAdminConsoleState() {
  const hash = String(window.location.hash || '').replace(/^#/, '');
  const viewAliases = {
    'customer-access': 'customer',
    refund: 'customer',
    office: 'customer',
    content: 'marketing',
    'supplier-access': 'admin'
  };
  const hashToolPanes = {
    'customer-access': 'customer-access',
    customer: 'customer-database',
    refund: 'refund-calculator',
    office: 'office-activation',
    marketing: 'marketing-calculator',
    content: 'content-editor'
  };
  const hashAccessPanes = {
    admin: 'admin',
    'supplier-access': 'supplier'
  };
  const routeState = {
    '/access': { view: 'admin', adminAccessPane: 'admin' },
    '/supplier-access': { view: 'admin', adminAccessPane: 'supplier' },
    '/customer-access': { view: 'customer', consoleToolPane: 'customer-access' },
    '/customers': { view: 'customer', consoleToolPane: 'customer-database' },
    '/refund': { view: 'customer', consoleToolPane: 'refund-calculator' },
    '/office': { view: 'customer', consoleToolPane: 'office-activation' },
    '/mail': { view: 'email' },
    '/chat': { view: 'overview' },
    '/marketing': { view: 'marketing', consoleToolPane: 'marketing-calculator' },
    '/content': { view: 'marketing', consoleToolPane: 'content-editor' }
  };
  const normalizedHash = viewAliases[hash] || hash;
  const allowedViews = ['overview', 'admin', 'customer', 'email', 'marketing'];
  if (allowedViews.includes(normalizedHash)) {
    return {
      view: normalizedHash,
      consoleToolPane: hashToolPanes[hash] || '',
      adminAccessPane: hashAccessPanes[hash] || ''
    };
  }

  const routePath = normalizeRoutePath(window.location.pathname);
  return routeState[routePath] || { view: 'overview', consoleToolPane: '', adminAccessPane: '' };
}

function getCurrentAdminConsoleView() {
  return getCurrentAdminConsoleState().view;
}

function setAdminConsoleActiveTab(viewName) {
  let activeLink = null;
  document.querySelectorAll('[data-console-target]').forEach((link) => {
    const isActive = link.getAttribute('data-console-target') === viewName;
    link.classList.toggle('is-active', isActive);
    if (isActive && link.closest('.console-tabs')) {
      activeLink = link;
    }
  });

  if (activeLink) {
    activeLink.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
}

function getActiveConsoleToolPane(viewName) {
  return catsoftActiveConsoleToolPanes[viewName] || '';
}

function getActiveAdminAccessPane() {
  return catsoftActiveAdminAccessPane || '';
}

function getAdminConsoleHashForState(viewName) {
  if (viewName === 'customer') {
    const activeToolPane = getActiveConsoleToolPane('customer');
    if (activeToolPane === 'customer-access') return '#customer-access';
    if (activeToolPane === 'refund-calculator') return '#refund';
    if (activeToolPane === 'office-activation') return '#office';
    return '#customer';
  }

  if (viewName === 'marketing') {
    return getActiveConsoleToolPane('marketing') === 'content-editor' ? '#content' : '#marketing';
  }

  if (viewName === 'admin') {
    return getActiveAdminAccessPane() === 'supplier' ? '#supplier-access' : '#admin';
  }

  if (viewName === 'email') {
    return '#email';
  }

  return '#overview';
}

const catsoftConsoleFrameAutoHeight = new WeakMap();

function getConsoleFrameMinimumHeight(frame) {
  const computedMinHeight = Number.parseFloat(window.getComputedStyle(frame).minHeight);
  return Number.isFinite(computedMinHeight) && computedMinHeight > 0 ? computedMinHeight : 720;
}

function resizeConsoleToolFrame(frame) {
  if (!frame) {
    return;
  }

  let doc;
  try {
    doc = frame.contentDocument || frame.contentWindow?.document;
  } catch (error) {
    return;
  }

  if (!doc || !doc.documentElement || !doc.body) {
    return;
  }

  doc.documentElement.style.overflow = 'hidden';
  doc.documentElement.style.minHeight = '0';
  doc.documentElement.style.height = 'auto';
  doc.body.style.overflow = 'hidden';
  doc.body.style.minHeight = '0';
  doc.body.style.height = 'auto';

  const bodyRect = doc.body.getBoundingClientRect();
  const childContentHeight = Array.from(doc.body.children).reduce((height, child) => {
    const childRect = child.getBoundingClientRect();
    return Math.max(height, childRect.bottom - bodyRect.top);
  }, 0);
  const measuredScrollHeight = Math.max(
    doc.documentElement.scrollHeight,
    doc.documentElement.offsetHeight,
    doc.body.scrollHeight,
    doc.body.offsetHeight
  );
  const contentHeight = childContentHeight > 0
    ? Math.max(childContentHeight, Math.min(measuredScrollHeight, childContentHeight + 120))
    : measuredScrollHeight;
  const minHeight = getConsoleFrameMinimumHeight(frame);
  const nextHeight = Math.ceil(Math.max(minHeight, contentHeight + 12));

  if (Number.parseInt(frame.style.height, 10) !== nextHeight) {
    frame.style.height = `${nextHeight}px`;
  }

  frame.dataset.autoHeightReady = 'true';
}

function setupConsoleToolFrameAutoHeight(frame) {
  if (!frame) {
    return;
  }

  const previous = catsoftConsoleFrameAutoHeight.get(frame);
  if (previous?.cleanup) {
    previous.cleanup();
  }

  let doc;
  try {
    doc = frame.contentDocument || frame.contentWindow?.document;
  } catch (error) {
    resizeConsoleToolFrame(frame);
    return;
  }

  if (!doc || !doc.body) {
    resizeConsoleToolFrame(frame);
    return;
  }

  let frameRaf = 0;
  const timeouts = [];
  const cleanups = [];
  const refresh = () => {
    window.cancelAnimationFrame(frameRaf);
    frameRaf = window.requestAnimationFrame(() => resizeConsoleToolFrame(frame));
  };

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(refresh);
    resizeObserver.observe(doc.documentElement);
    resizeObserver.observe(doc.body);
    cleanups.push(() => resizeObserver.disconnect());
  }

  if (typeof MutationObserver !== 'undefined') {
    const mutationObserver = new MutationObserver(refresh);
    mutationObserver.observe(doc.body, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });
    cleanups.push(() => mutationObserver.disconnect());
  }

  if (frame.contentWindow) {
    frame.contentWindow.addEventListener('resize', refresh);
    cleanups.push(() => frame.contentWindow.removeEventListener('resize', refresh));
  }

  [0, 120, 360, 900, 1800].forEach((delay) => {
    const timeout = window.setTimeout(refresh, delay);
    timeouts.push(timeout);
  });

  catsoftConsoleFrameAutoHeight.set(frame, {
    cleanup() {
      window.cancelAnimationFrame(frameRaf);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      cleanups.forEach((cleanup) => cleanup());
    }
  });

  refresh();
}

function bindConsoleToolFrameAutoHeight(frame) {
  if (!frame) {
    return;
  }

  frame.setAttribute('scrolling', 'no');

  if (frame.dataset.autoHeightBound === 'true') {
    resizeConsoleToolFrame(frame);
    return;
  }

  frame.dataset.autoHeightBound = 'true';
  frame.addEventListener('load', () => setupConsoleToolFrameAutoHeight(frame));

  try {
    if (frame.contentDocument?.readyState === 'complete') {
      setupConsoleToolFrameAutoHeight(frame);
    }
  } catch (error) {
    // Cross-origin frames are not expected here, but leaving them alone keeps the console usable.
  }
}

function refreshConsoleToolFrames(root = document) {
  root.querySelectorAll('[data-console-frame]').forEach((frame) => {
    bindConsoleToolFrameAutoHeight(frame);
    resizeConsoleToolFrame(frame);
  });
}

function loadAdminConsoleFrame(view) {
  const frame = view.querySelector('[data-console-tool-pane]:not([hidden]) [data-console-frame]')
    || view.querySelector('[data-console-frame]');

  if (!frame) {
    return;
  }

  bindConsoleToolFrameAutoHeight(frame);

  if (frame.getAttribute('src')) {
    resizeConsoleToolFrame(frame);
    return;
  }

  const src = frame.getAttribute('data-src');
  if (src) {
    frame.setAttribute('src', src);
  }
}

function getDefaultConsoleToolPane(viewName, admin = getCurrentAdmin()) {
  const toolIds = CATSOFT_CONSOLE_TOOL_PANES[viewName] || [];
  return toolIds.find((toolId) => canAccessToolLink(toolId, admin)) || toolIds[0] || '';
}

function showConsoleToolPane(viewName, toolId = '') {
  const admin = getCurrentAdmin();
  const moduleView = document.querySelector(`[data-console-view="${viewName}"]`);
  const allowedToolIds = CATSOFT_CONSOLE_TOOL_PANES[viewName] || [];

  if (!moduleView || !allowedToolIds.length) {
    return;
  }

  const requestedToolId = allowedToolIds.includes(toolId) ? toolId : getDefaultConsoleToolPane(viewName, admin);
  const activeToolId = canAccessToolLink(requestedToolId, admin)
    ? requestedToolId
    : getDefaultConsoleToolPane(viewName, admin);

  catsoftActiveConsoleToolPanes[viewName] = activeToolId;

  moduleView.querySelectorAll('[data-console-tool-pane]').forEach((pane) => {
    const paneToolId = pane.getAttribute('data-console-tool-pane');
    const canUsePane = canAccessToolLink(paneToolId, admin);
    pane.hidden = paneToolId !== activeToolId || !canUsePane;
  });

  moduleView.querySelectorAll('.console-tool-sidebar [data-console-tool-target]').forEach((control) => {
    const paneToolId = control.getAttribute('data-console-tool-target');
    const canUsePane = canAccessToolLink(paneToolId, admin);
    control.hidden = !canUsePane;
    control.classList.toggle('is-active', canUsePane && paneToolId === activeToolId);
  });

  loadAdminConsoleFrame(moduleView);
  window.requestAnimationFrame(() => refreshConsoleToolFrames(moduleView));
}

function showAdminAccessPane(paneName = 'admin') {
  const admin = getCurrentAdmin();
  const requestedPane = paneName === 'supplier' ? 'supplier' : 'admin';
  const activePane = adminCanUseAccessPane(requestedPane, admin) ? requestedPane : getDefaultAccessPane(admin);

  catsoftActiveAdminAccessPane = activePane;

  document.querySelectorAll('[data-admin-access-pane]').forEach((pane) => {
    const paneName = pane.getAttribute('data-admin-access-pane');
    pane.hidden = paneName !== activePane || !adminCanUseAccessPane(paneName, admin);
  });

  document.querySelectorAll('.console-access-sidebar [data-admin-access-target]').forEach((control) => {
    const paneName = control.getAttribute('data-admin-access-target');
    const canUsePane = adminCanUseAccessPane(paneName, admin);
    control.hidden = !canUsePane;
    control.classList.toggle('is-active', canUsePane && paneName === activePane);
  });
}

function showAdminConsoleView(viewName = 'overview', options = {}) {
  const viewAliases = {
    'customer-access': 'customer',
    refund: 'customer',
    office: 'customer',
    content: 'marketing'
  };
  const requestedView = viewAliases[viewName] || viewName || 'overview';
  const moduleView = document.querySelector(`[data-console-view="${requestedView}"]`);
  const canShowModule = requestedView !== 'overview'
    && moduleView
    && moduleView.dataset.permissionHidden !== 'true';
  const activeView = canShowModule ? requestedView : 'overview';
  const showOverview = activeView === 'overview';

  document.querySelectorAll('[data-console-overview]').forEach((section) => {
    section.hidden = !showOverview;
  });

  document.querySelectorAll('[data-console-view]').forEach((view) => {
    const isActive = view.getAttribute('data-console-view') === activeView && view.dataset.permissionHidden !== 'true';
    view.hidden = !isActive;
    if (isActive && !CATSOFT_CONSOLE_TOOL_PANES[activeView]) {
      loadAdminConsoleFrame(view);
    }
  });

  setAdminConsoleActiveTab(activeView);

  if (activeView === 'admin') {
    showAdminAccessPane(options.adminAccessPane || getActiveAdminAccessPane() || getDefaultAccessPane());
  }

  if (CATSOFT_CONSOLE_TOOL_PANES[activeView]) {
    showConsoleToolPane(activeView, options.consoleToolPane || getActiveConsoleToolPane(activeView));
  }

  if (options.updateHash !== false) {
    const nextHash = getAdminConsoleHashForState(activeView);
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  }

  if (options.scroll !== false) {
    const shell = document.querySelector('.console-shell');
    if (shell) {
      shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function enableAdminConsoleViews() {
  document.querySelectorAll('[data-console-target]').forEach((link) => {
    if (link.dataset.consoleReady === 'true') {
      return;
    }

    link.dataset.consoleReady = 'true';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showAdminConsoleView(link.getAttribute('data-console-target'), {
        updateHash: true,
        scroll: true,
        adminAccessPane: link.getAttribute('data-admin-access-target') || 'admin',
        consoleToolPane: link.getAttribute('data-console-tool-target') || ''
      });
    });
  });

  document.querySelectorAll('.console-access-sidebar [data-admin-access-target]').forEach((button) => {
    if (button.dataset.accessReady === 'true') {
      return;
    }

    button.dataset.accessReady = 'true';
    button.addEventListener('click', () => {
      showAdminConsoleView('admin', {
        updateHash: true,
        scroll: false,
        adminAccessPane: button.getAttribute('data-admin-access-target')
      });
    });
  });

  document.querySelectorAll('.console-tool-sidebar [data-console-tool-target]').forEach((button) => {
    if (button.dataset.toolPaneReady === 'true') {
      return;
    }

    button.dataset.toolPaneReady = 'true';
    button.addEventListener('click', () => {
      const moduleView = button.closest('[data-console-view]');
      if (!moduleView) {
        return;
      }

      showAdminConsoleView(moduleView.getAttribute('data-console-view'), {
        updateHash: true,
        scroll: false,
        consoleToolPane: button.getAttribute('data-console-tool-target')
      });
    });
  });

  window.addEventListener('hashchange', () => {
    const consoleState = getCurrentAdminConsoleState();
    showAdminConsoleView(consoleState.view, {
      updateHash: false,
      scroll: false,
      adminAccessPane: consoleState.adminAccessPane || getActiveAdminAccessPane(),
      consoleToolPane: consoleState.consoleToolPane || getActiveConsoleToolPane(consoleState.view)
    });
  });

  const consoleState = getCurrentAdminConsoleState();
  showAdminConsoleView(consoleState.view, {
    updateHash: false,
    scroll: false,
    adminAccessPane: consoleState.adminAccessPane || getActiveAdminAccessPane(),
    consoleToolPane: consoleState.consoleToolPane || getActiveConsoleToolPane(consoleState.view)
  });
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

function renderAdminToolAccessCategories() {
  const toolById = new Map(CATSOFT_ADMIN_TOOLS.map((tool) => [tool.id, tool]));

  return `
    <div class="admin-tool-categories" aria-label="Akses Tool">
      ${CATSOFT_ADMIN_ACCESS_TOOL_CATEGORIES.map((category, index) => `
        <details class="admin-tool-category" data-admin-tool-category="${escapeAdminHtml(category.id)}" ${index === 0 ? 'open' : ''}>
          <summary>
            <span>
              <strong>${escapeAdminHtml(category.label)}</strong>
              <small>${escapeAdminHtml(category.note)}</small>
            </span>
            <em data-admin-tool-category-count>0 Aktif</em>
          </summary>
          <div class="admin-access-checks">
            ${category.tools.map((toolId) => {
              const tool = toolById.get(toolId);

              if (!tool || tool.ownerOnly) {
                return '';
              }

              return `
                <label>
                  <input type="checkbox" name="tools" value="${escapeAdminHtml(tool.id)}" />
                  <span class="admin-check-icon" aria-hidden="true">✓</span>
                  <span class="admin-check-text">${escapeAdminHtml(tool.label)}</span>
                </label>
              `;
            }).join('')}
          </div>
        </details>
      `).join('')}
    </div>
  `;
}

function renderSupplierToolAccessCategories() {
  return `
    <div class="admin-tool-categories" aria-label="Akses Tool Supplier">
      <details class="admin-tool-category" open>
        <summary>
          <span>
            <strong>Supplier Center</strong>
            <small>Email Center Dan Temp Mail</small>
          </span>
          <em data-supplier-tool-category-count>0 Aktif</em>
        </summary>
        <div class="admin-access-checks">
          ${CATSOFT_SUPPLIER_TOOLS.map((tool) => `
            <label>
              <input type="checkbox" name="supplierTools" value="${escapeAdminHtml(tool.id)}" checked />
              <span class="admin-check-icon" aria-hidden="true">✓</span>
              <span class="admin-check-text">${escapeAdminHtml(tool.label)}</span>
            </label>
          `).join('')}
        </div>
      </details>
    </div>
  `;
}

function renderInboxPresetChecks(inputName, detailAttribute) {
  return CATSOFT_INBOX_PRESETS.map((preset) => `
    <label ${preset.value === 'all' ? '' : detailAttribute}>
      <input type="checkbox" name="${escapeAdminHtml(inputName)}" value="${escapeAdminHtml(preset.value)}" />
      <span class="admin-check-icon" aria-hidden="true">✓</span>
      <span class="admin-check-text">${escapeAdminHtml(preset.label)}</span>
    </label>
  `).join('');
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
    <div class="admin-spectrum-page">
      <div class="admin-spectrum-head">
        <h2>Administrator</h2>
        <dl>
          <div>
            <dt>Total Admin</dt>
            <dd data-admin-count>0</dd>
          </div>
        </dl>
      </div>
      <div class="admin-spectrum-rule"></div>
      <div class="admin-spectrum-toolbar">
        <label class="admin-spectrum-search">
          <span>Cari Berdasarkan Email, Nama Pengguna, Nama Depan Atau Belakang</span>
          <span class="admin-spectrum-search-field">
            <input id="adminAccountSearch" type="search" autocomplete="off" />
          </span>
        </label>
        <div class="admin-spectrum-actions">
          <button class="admin-spectrum-primary" type="button" id="adminAddAccount">Tambahkan Admin</button>
          <button class="admin-spectrum-secondary" type="button" id="adminDeleteSelected" disabled>Hapus Admin</button>
        </div>
      </div>
      <p class="admin-access-status" id="adminAccessStatus" aria-live="polite"></p>
      <div class="admin-account-list" id="adminAccountList"></div>
    </div>
    <div class="admin-detail-scrim" id="adminAccessScrim" hidden></div>
    <aside class="admin-detail-drawer" id="adminAccessDrawer" aria-label="Edit Admin" hidden>
      <div class="admin-detail-head">
        <span class="admin-detail-avatar" aria-hidden="true"></span>
        <div>
          <h3 id="adminAccessDrawerTitle">Tambahkan Admin</h3>
          <span class="admin-detail-role">Akses Admin</span>
        </div>
        <div class="admin-detail-actions">
          <button class="admin-detail-save" type="submit" form="adminAccessForm">Simpan</button>
          <button class="admin-detail-close" type="button" id="adminAccessDrawerClose" aria-label="Tutup">×</button>
        </div>
      </div>
      <form class="admin-access-form admin-detail-form" id="adminAccessForm">
        <input id="adminAccessOriginalUsername" type="hidden" />
        <section class="admin-detail-section">
          <div class="admin-detail-section-head">
            <h4>Profil Admin</h4>
          </div>
          <label>
            Username Admin
            <input id="adminAccessUsername" type="text" autocomplete="off" required />
          </label>
          <label>
            Password Admin
            <input id="adminAccessPassword" type="text" autocomplete="off" required />
          </label>
          <div class="admin-whatsapp-share">
            <label class="admin-whatsapp-field">
              <span>WhatsApp</span>
              <input id="adminAccessWhatsapp" type="tel" inputmode="tel" autocomplete="off" placeholder="62812..." />
            </label>
            <button class="admin-whatsapp-send" type="button" id="adminSendAccessWhatsapp">Kirim Akses</button>
            <span id="adminWhatsappStatus" aria-live="polite"></span>
          </div>
        </section>
        <section class="admin-detail-section">
          <div class="admin-detail-section-head">
            <h4>Produk</h4>
          </div>
          <div class="admin-access-field-block">
            <span class="admin-access-label">Akses Tool</span>
            ${renderAdminToolAccessCategories()}
          </div>
        </section>
        <section class="admin-detail-section" id="adminInboxAccessBlock">
          <div class="admin-detail-section-head">
            <h4>Email Inbox</h4>
          </div>
          <div class="admin-access-field-block">
            <span class="admin-access-label">Akses Email Inbox</span>
            <div class="admin-access-checks admin-inbox-presets" aria-label="Preset Akses Email">
              ${renderInboxPresetChecks('inboxPresets', 'data-admin-inbox-detail')}
            </div>
          </div>
          <label id="adminInboxRulesField" data-admin-inbox-detail>
            Rule Custom
            <textarea id="adminAccessRules" placeholder="Satu Rule Per Baris:&#10;openai&#10;adobe.com&#10;billing@catsoft.store"></textarea>
          </label>
        </section>
      </form>
    </aside>
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
    whatsappTarget: normalizeWhatsappTarget(document.getElementById('adminAccessWhatsapp')?.value || ''),
    tools,
    inboxAccessAll: inboxRules.includes('all'),
    inboxRules: inboxRules.filter((rule) => rule !== 'all')
  };
}

function getAdminToolShareUrl(tool) {
  return new URL(tool.route || '/', 'https://admin.catsoft.store').href;
}

function getAdminToolShareLines(toolIds) {
  const toolById = new Map(CATSOFT_ADMIN_TOOLS.map((tool) => [tool.id, tool]));
  return toolIds
    .map((toolId) => toolById.get(toolId))
    .filter((tool) => tool && !tool.ownerOnly)
    .map((tool) => `- ${tool.label}: ${getAdminToolShareUrl(tool)}`);
}

function buildAdminAccessWhatsappMessage(values) {
  const accessLines = getAdminToolShareLines(values.tools);
  const messageLines = [
    'Halo, berikut akses Admin Catsoft.',
    '',
    `Username: ${values.username}`,
    `Password: ${values.password}`,
    'Login: https://admin.catsoft.store/',
    '',
    'Akses:',
    ...(accessLines.length ? accessLines : ['- Belum ada tool yang dipilih'])
  ];

  if (values.tools.includes('email-inbox')) {
    messageLines.push(values.inboxAccessAll
      ? 'Email Inbox: Semua email masuk'
      : `Email Inbox: ${values.inboxRules.length ? values.inboxRules.join(', ') : 'Rule belum diatur'}`);
  }

  messageLines.push('', 'Silakan login melalui link di atas.');
  return messageLines.join('\n');
}

function setAdminWhatsappStatus(message, type = '') {
  const status = document.getElementById('adminWhatsappStatus');

  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle('success', type === 'success');
}

function sendAdminAccessViaWhatsapp() {
  const values = getAccessFormValues();

  if (!values.username) {
    setAdminWhatsappStatus('Isi username dulu.');
    document.getElementById('adminAccessUsername')?.focus();
    return;
  }

  if (!values.password) {
    setAdminWhatsappStatus('Isi password dulu.');
    document.getElementById('adminAccessPassword')?.focus();
    return;
  }

  if (!values.whatsappTarget) {
    setAdminWhatsappStatus('Isi nomor WhatsApp tujuan.');
    document.getElementById('adminAccessWhatsapp')?.focus();
    return;
  }

  const message = buildAdminAccessWhatsappMessage(values);
  const url = `https://wa.me/${values.whatsappTarget}?text=${encodeURIComponent(message)}`;
  const opened = window.open(url, '_blank', 'noopener');

  if (!opened) {
    setAdminWhatsappStatus('Popup diblokir. Izinkan popup lalu klik lagi.');
    return;
  }

  setAdminWhatsappStatus('WhatsApp dibuka dengan akses siap kirim.', 'success');
}

function setAccessStatus(message, type = '') {
  const status = document.getElementById('adminAccessStatus');

  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle('success', type === 'success');
}

function setAdminAccessDrawerOpen(isOpen) {
  const drawer = document.getElementById('adminAccessDrawer');
  const scrim = document.getElementById('adminAccessScrim');

  if (!drawer || !scrim) {
    return;
  }

  drawer.hidden = !isOpen;
  scrim.hidden = !isOpen;
  document.body.classList.toggle('admin-drawer-open', isOpen);
}

function updateAdminAccessDrawerTitle(label = 'Tambahkan Admin') {
  const username = document.getElementById('adminAccessUsername');
  const title = document.getElementById('adminAccessDrawerTitle');
  const avatar = document.querySelector('#adminAccessDrawer .admin-detail-avatar');
  const value = username && username.value.trim() ? username.value.trim() : label;

  if (title) title.textContent = value;
  if (avatar) avatar.textContent = getAdminInitials(value);
}

function resetAccessForm() {
  const form = document.getElementById('adminAccessForm');
  form.reset();
  document.getElementById('adminAccessOriginalUsername').value = '';
  document.getElementById('adminAccessWhatsapp').value = '';
  setAdminWhatsappStatus('');
  document.querySelectorAll('#adminAccessForm input[name="inboxPresets"]').forEach((input) => {
    input.checked = CATSOFT_DEFAULT_INBOX_RULES.includes(input.value);
  });
  document.getElementById('adminAccessRules').value = '';
  updateInboxAccessVisibility();
  resetAdminToolCategoryOpenState();
  updateAdminToolCategoryState();
  updateAdminAccessDrawerTitle('Tambahkan Admin');
}

function wireOwnerAccessPanel() {
  resetAccessForm();

  document.getElementById('adminAccessCancelEdit')?.addEventListener('click', () => {
    resetAccessForm();
    setAdminAccessDrawerOpen(false);
    setAccessStatus('', 'success');
  });

  document.getElementById('adminAccessDrawerClose').addEventListener('click', () => {
    resetAccessForm();
    setAdminAccessDrawerOpen(false);
  });

  document.getElementById('adminAccessScrim').addEventListener('click', () => {
    resetAccessForm();
    setAdminAccessDrawerOpen(false);
  });

  document.getElementById('adminAddAccount').addEventListener('click', () => {
    resetAccessForm();
    setAdminAccessDrawerOpen(true);
    setAccessStatus('');
  });

  document.getElementById('adminDeleteSelected').addEventListener('click', async () => {
    const selected = [...document.querySelectorAll('#adminAccountList input[name="selectedAdmin"]:checked')]
      .map((input) => input.value);

    for (const username of selected) {
      await deleteAdminAccount(username);
    }
  });

  document.getElementById('adminAccessUsername').addEventListener('input', () => updateAdminAccessDrawerTitle('Tambahkan Admin'));
  document.getElementById('adminAccessWhatsapp').addEventListener('input', () => setAdminWhatsappStatus(''));
  document.getElementById('adminAccessPassword').addEventListener('input', () => setAdminWhatsappStatus(''));
  document.getElementById('adminSendAccessWhatsapp').addEventListener('click', sendAdminAccessViaWhatsapp);

  document.querySelectorAll('#adminAccessForm input[name="tools"]').forEach((input) => {
    input.addEventListener('change', () => {
      updateInboxAccessVisibility();
      updateAdminToolCategoryState();
    });
  });

  document.querySelectorAll('#adminAccessForm input[name="inboxPresets"]').forEach((input) => {
    input.addEventListener('change', () => handleAdminInboxPresetChange(input));
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
      whatsappTarget: values.whatsappTarget,
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
    setAdminAccessDrawerOpen(false);
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

function updateAdminToolCategoryState() {
  const categories = [...document.querySelectorAll('#adminAccessForm .admin-tool-category')];

  categories.forEach((category, index) => {
    const checkedCount = category.querySelectorAll('input[name="tools"]:checked').length;
    const totalCount = category.querySelectorAll('input[name="tools"]').length;
    const counter = category.querySelector('[data-admin-tool-category-count]');

    if (counter) {
      counter.textContent = checkedCount ? `${checkedCount}/${totalCount} Aktif` : '0 Aktif';
    }

    if (!categories.some((item) => item.open)) {
      category.open = index === 0;
    }
  });
}

function resetAdminToolCategoryOpenState() {
  document.querySelectorAll('#adminAccessForm .admin-tool-category').forEach((category, index) => {
    category.open = index === 0;
  });
}

function handleAdminInboxPresetChange(changedInput) {
  const allInput = document.querySelector('#adminAccessForm input[name="inboxPresets"][value="all"]');

  if (changedInput.value === 'all' && changedInput.checked) {
    document.querySelectorAll('#adminAccessForm input[name="inboxPresets"]:not([value="all"])').forEach((input) => {
      input.checked = false;
    });
    document.getElementById('adminAccessRules').value = '';
  } else if (changedInput.value !== 'all' && changedInput.checked && allInput) {
    allInput.checked = false;
  }

  updateInboxAccessVisibility();
}

function updateInboxAccessVisibility() {
  const inboxToolInput = document.querySelector('#adminAccessForm input[name="tools"][value="email-inbox"]');
  const inboxBlock = document.getElementById('adminInboxAccessBlock');
  const inboxRulesField = document.getElementById('adminInboxRulesField');
  const allInboxInput = document.querySelector('#adminAccessForm input[name="inboxPresets"][value="all"]');
  const isVisible = Boolean(inboxToolInput && inboxToolInput.checked);
  const showDetails = isVisible && !allInboxInput?.checked;

  if (!inboxBlock || !inboxRulesField) {
    return;
  }

  inboxBlock.classList.toggle('is-hidden', !isVisible);
  document.querySelectorAll('#adminAccessForm [data-admin-inbox-detail]').forEach((element) => {
    element.classList.toggle('is-hidden', !showDetails);
  });

  if (!isVisible) {
    document.querySelectorAll('#adminAccessForm input[name="inboxPresets"]').forEach((input) => {
      input.checked = false;
    });
    document.getElementById('adminAccessRules').value = '';
  } else if (allInboxInput?.checked) {
    document.querySelectorAll('#adminAccessForm input[name="inboxPresets"]:not([value="all"])').forEach((input) => {
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
  const count = document.querySelector('[data-admin-count]');

  if (!list) {
    return;
  }

  const accounts = loadAdminAccounts();

  if (count) {
    count.textContent = String(accounts.length);
  }

  if (!accounts.length) {
    list.innerHTML = `
      <div class="admin-spectrum-empty">
        <div>
          <h3>Belum Ada Admin Tambahan</h3>
          <span>Tambahkan Admin baru dari tombol Tambahkan Admin.</span>
        </div>
      </div>
    `;
    return;
  }

  const visibleAccounts = accounts.slice(0, catsoftAdminPageSize);
  const rows = visibleAccounts.map((account) => {
    const toolCount = (account.tools || []).length;
    const roleText = account.inboxAccessAll ? 'Sistem + Full Inbox' : 'Sistem';

    return `
      <div class="admin-spectrum-row" data-edit-admin="${escapeAdminHtml(account.username)}" role="row">
        <span class="admin-spectrum-check"><input type="checkbox" name="selectedAdmin" value="${escapeAdminHtml(account.username)}" aria-label="Pilih ${escapeAdminHtml(account.username)}" /></span>
        <span class="admin-spectrum-name">
          <span class="admin-spectrum-avatar" aria-hidden="true">${escapeAdminHtml(getAdminInitials(account.username))}</span>
          <span><strong>${escapeAdminHtml(account.username)}</strong><small>${escapeAdminHtml(getOnlineLabel(account.activeAt))}</small></span>
        </span>
        <span class="admin-spectrum-row-actions">
          <button class="admin-spectrum-open" type="button" data-open-admin="${escapeAdminHtml(account.username)}" aria-label="Buka Detail ${escapeAdminHtml(account.username)}"></button>
          <button class="admin-spectrum-chat" type="button" data-chat-admin="${escapeAdminHtml(account.username)}" ${account.whatsappTarget ? '' : 'disabled'} aria-label="Chat WhatsApp ${escapeAdminHtml(account.username)}"></button>
        </span>
        <span>${escapeAdminHtml(account.username)}</span>
        <span>${escapeAdminHtml(roleText)}<small>${escapeAdminHtml(toolCount)} Tools</small></span>
      </div>
    `;
  }).join('');

  list.innerHTML = `
    <div class="admin-spectrum-table" role="grid" aria-label="Daftar Administrator">
      <div class="admin-spectrum-row is-heading" role="row">
        <span><input type="checkbox" id="adminSelectAll" aria-label="Pilih Semua Admin" /></span>
        <span>Nama</span>
        <span></span>
        <span>Username</span>
        <span>Peran Admin</span>
      </div>
      ${rows}
    </div>
    <div class="admin-spectrum-pager">
      <div class="admin-spectrum-page-buttons" aria-label="Navigasi Halaman Admin">
        <button class="admin-spectrum-page-nav is-prev" type="button" disabled aria-label="Halaman Sebelumnya"><span>Sebelumnya</span></button>
        <button class="admin-spectrum-page-nav is-next" type="button" disabled aria-label="Halaman Berikutnya"><span>Berikutnya</span></button>
      </div>
      <label class="admin-spectrum-page-size">
        <span>Item Per Halaman</span>
        <select id="adminPageSize">
          ${[5, 10, 20, 50].map((size) => `<option value="${size}" ${catsoftAdminPageSize === size ? 'selected' : ''}>${size}</option>`).join('')}
        </select>
      </label>
      <span class="admin-spectrum-page-count">${visibleAccounts.length ? `1-${visibleAccounts.length}` : '0'} Dari ${accounts.length}</span>
    </div>
  `;

  list.querySelectorAll('[data-open-admin]').forEach((button) => {
    button.addEventListener('click', () => editAdminAccount(button.dataset.openAdmin));
  });

  list.querySelectorAll('[data-chat-admin]').forEach((button) => {
    button.addEventListener('click', () => openAdminWhatsappChat(button.dataset.chatAdmin));
  });

  list.querySelectorAll('input[name="selectedAdmin"]').forEach((input) => {
    input.addEventListener('change', updateAdminDeleteSelectedState);
  });

  const selectAll = document.getElementById('adminSelectAll');
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      document.querySelectorAll('#adminAccountList input[name="selectedAdmin"]').forEach((input) => {
        input.checked = selectAll.checked;
      });
      updateAdminDeleteSelectedState();
    });
  }

  const search = document.getElementById('adminAccountSearch');
  if (search) {
    search.addEventListener('input', filterAdminAccountRows);
    filterAdminAccountRows();
  }

  const pageSize = document.getElementById('adminPageSize');
  if (pageSize) {
    pageSize.addEventListener('change', () => {
      catsoftAdminPageSize = Number(pageSize.value) || 10;
      renderAdminAccountList();
    });
  }

  updateAdminDeleteSelectedState();
}

function filterAdminAccountRows() {
  const search = document.getElementById('adminAccountSearch');
  const query = normalizeAdminValue(search ? search.value : '');

  document.querySelectorAll('#adminAccountList .admin-spectrum-row[data-edit-admin]').forEach((row) => {
    row.hidden = query ? !normalizeAdminValue(row.textContent).includes(query) : false;
  });
}

function updateAdminDeleteSelectedState() {
  const deleteButton = document.getElementById('adminDeleteSelected');

  if (!deleteButton) {
    return;
  }

  deleteButton.disabled = !document.querySelector('#adminAccountList input[name="selectedAdmin"]:checked');
}

function openAdminWhatsappChat(username) {
  const account = getAccountByUsername(username);
  const whatsappTarget = normalizeWhatsappTarget(account?.whatsappTarget || '');

  if (!whatsappTarget) {
    setAccessStatus('Nomor WhatsApp admin belum diisi.');
    return;
  }

  window.open(`https://wa.me/${whatsappTarget}`, '_blank', 'noopener');
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
    <div class="admin-spectrum-page">
      <div class="admin-spectrum-head">
        <h2>Supplier</h2>
        <dl>
          <div>
            <dt>Total Supplier</dt>
            <dd data-supplier-count>0</dd>
          </div>
        </dl>
      </div>
      <div class="admin-spectrum-rule"></div>
      <div class="admin-spectrum-toolbar">
        <label class="admin-spectrum-search">
          <span>Cari Berdasarkan Email, Nama Supplier, Atau Domain</span>
          <span class="admin-spectrum-search-field">
            <input id="supplierAccountSearch" type="search" autocomplete="off" />
          </span>
        </label>
        <div class="admin-spectrum-actions">
          <button class="admin-spectrum-primary" type="button" id="supplierAddAccount">Tambahkan Supplier</button>
          <button class="admin-spectrum-secondary" type="button" id="supplierDeleteSelected" disabled>Hapus Supplier</button>
        </div>
      </div>
      <p class="admin-access-status" id="supplierAccessStatus" aria-live="polite"></p>
      <div class="admin-account-list" id="supplierAccountList"></div>
    </div>
    <div class="admin-detail-scrim" id="supplierAccessScrim" hidden></div>
    <aside class="admin-detail-drawer" id="supplierAccessDrawer" aria-label="Edit Supplier" hidden>
      <div class="admin-detail-head">
        <span class="admin-detail-avatar" aria-hidden="true"></span>
        <div>
          <h3 id="supplierAccessDrawerTitle">Tambahkan Supplier</h3>
          <span class="admin-detail-role">Akses Supplier</span>
        </div>
        <div class="admin-detail-actions">
          <button class="admin-detail-save" type="submit" form="supplierAccessForm">Simpan</button>
          <button class="admin-detail-close" type="button" id="supplierAccessDrawerClose" aria-label="Tutup">×</button>
        </div>
      </div>
      <form class="admin-access-form admin-detail-form" id="supplierAccessForm">
        <input id="supplierAccessOriginalUsername" type="hidden" />
        <section class="admin-detail-section">
          <div class="admin-detail-section-head">
            <h4>Profil Supplier</h4>
          </div>
          <label>
            Username Supplier
            <input id="supplierAccessUsername" type="text" autocomplete="off" required />
          </label>
          <label>
            Password Supplier
            <input id="supplierAccessPassword" type="text" autocomplete="off" required />
          </label>
        </section>
        <section class="admin-detail-section">
          <div class="admin-detail-section-head">
            <h4>Produk</h4>
          </div>
          <div class="admin-access-field-block">
            <span class="admin-access-label">Akses Tool Supplier Center</span>
            ${renderSupplierToolAccessCategories()}
          </div>
        </section>
        <section class="admin-detail-section" id="supplierInboxAccessBlock">
          <div class="admin-detail-section-head">
            <h4>Email Temp Mail</h4>
          </div>
          <div class="admin-access-field-block">
            <span class="admin-access-label">Akses Email Temp Mail</span>
            <div class="admin-access-checks admin-inbox-presets" aria-label="Preset Akses Email Supplier">
              ${renderInboxPresetChecks('supplierInboxPresets', 'data-supplier-inbox-detail')}
            </div>
          </div>
          <label id="supplierInboxRulesField" data-supplier-inbox-detail>
            Rule Custom
            <textarea id="supplierAccessRules" placeholder="Satu Rule Per Baris:&#10;supplier@catsoft.store&#10;openai&#10;catsoft.digital"></textarea>
          </label>
        </section>
        <section class="admin-detail-section">
          <div class="admin-detail-section-head">
            <h4>Domain</h4>
          </div>
          <div class="admin-access-field-block">
            <span class="admin-access-label">Domain Yang Bisa Dibuat Supplier</span>
            <div class="admin-access-checks admin-inbox-presets" aria-label="Domain Temp Mail Supplier">
              ${CATSOFT_SUPPLIER_DOMAINS.map((domain) => `
                <label>
                  <input type="checkbox" name="supplierDomains" value="${escapeAdminHtml(domain)}" checked />
                  <span class="admin-check-icon" aria-hidden="true">✓</span>
                  <span class="admin-check-text">${escapeAdminHtml(domain)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </section>
      </form>
    </aside>
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

function setSupplierAccessDrawerOpen(isOpen) {
  const drawer = document.getElementById('supplierAccessDrawer');
  const scrim = document.getElementById('supplierAccessScrim');

  if (!drawer || !scrim) {
    return;
  }

  drawer.hidden = !isOpen;
  scrim.hidden = !isOpen;
  document.body.classList.toggle('admin-drawer-open', isOpen);
}

function updateSupplierAccessDrawerTitle(label = 'Tambahkan Supplier') {
  const username = document.getElementById('supplierAccessUsername');
  const title = document.getElementById('supplierAccessDrawerTitle');
  const avatar = document.querySelector('#supplierAccessDrawer .admin-detail-avatar');
  const value = username && username.value.trim() ? username.value.trim() : label;

  if (title) title.textContent = value;
  if (avatar) avatar.textContent = getAdminInitials(value);
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
  updateSupplierInboxAccessVisibility();
  updateSupplierToolCategoryState();
  updateSupplierAccessDrawerTitle('Tambahkan Supplier');
}

function wireSupplierAccessPanel() {
  resetSupplierAccessForm();

  document.getElementById('supplierAccessCancelEdit')?.addEventListener('click', () => {
    resetSupplierAccessForm();
    setSupplierAccessDrawerOpen(false);
    setSupplierAccessStatus('', 'success');
  });

  document.getElementById('supplierAccessDrawerClose').addEventListener('click', () => {
    resetSupplierAccessForm();
    setSupplierAccessDrawerOpen(false);
  });

  document.getElementById('supplierAccessScrim').addEventListener('click', () => {
    resetSupplierAccessForm();
    setSupplierAccessDrawerOpen(false);
  });

  document.getElementById('supplierAddAccount').addEventListener('click', () => {
    resetSupplierAccessForm();
    setSupplierAccessDrawerOpen(true);
    setSupplierAccessStatus('Form siap untuk supplier baru.', 'success');
  });

  document.getElementById('supplierDeleteSelected').addEventListener('click', async () => {
    const selected = [...document.querySelectorAll('#supplierAccountList input[name="selectedSupplier"]:checked')]
      .map((input) => input.value);

    for (const username of selected) {
      await deleteSupplierAccount(username);
    }
  });

  document.getElementById('supplierAccessUsername').addEventListener('input', () => updateSupplierAccessDrawerTitle('Tambahkan Supplier'));

  document.querySelectorAll('#supplierAccessForm input[name="supplierTools"]').forEach((input) => {
    input.addEventListener('change', () => {
      updateSupplierInboxAccessVisibility();
      updateSupplierToolCategoryState();
    });
  });

  document.querySelectorAll('#supplierAccessForm input[name="supplierInboxPresets"]').forEach((input) => {
    input.addEventListener('change', () => handleSupplierInboxPresetChange(input));
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
    setSupplierAccessDrawerOpen(false);
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

function updateSupplierToolCategoryState() {
  document.querySelectorAll('#supplierAccessForm .admin-tool-category').forEach((category) => {
    const checkedCount = category.querySelectorAll('input[name="supplierTools"]:checked').length;
    const totalCount = category.querySelectorAll('input[name="supplierTools"]').length;
    const counter = category.querySelector('[data-supplier-tool-category-count]');

    if (counter) {
      counter.textContent = checkedCount ? `${checkedCount}/${totalCount} Aktif` : '0 Aktif';
    }

    category.open = true;
  });
}

function handleSupplierInboxPresetChange(changedInput) {
  const allInput = document.querySelector('#supplierAccessForm input[name="supplierInboxPresets"][value="all"]');

  if (changedInput.value === 'all' && changedInput.checked) {
    document.querySelectorAll('#supplierAccessForm input[name="supplierInboxPresets"]:not([value="all"])').forEach((input) => {
      input.checked = false;
    });
    document.getElementById('supplierAccessRules').value = '';
  } else if (changedInput.value !== 'all' && changedInput.checked && allInput) {
    allInput.checked = false;
  }

  updateSupplierInboxAccessVisibility();
}

function updateSupplierInboxAccessVisibility() {
  const inboxToolInput = document.querySelector('#supplierAccessForm input[name="supplierTools"][value="supplier-email"]');
  const inboxBlock = document.getElementById('supplierInboxAccessBlock');
  const allInboxInput = document.querySelector('#supplierAccessForm input[name="supplierInboxPresets"][value="all"]');
  const isVisible = Boolean(inboxToolInput && inboxToolInput.checked);
  const showDetails = isVisible && !allInboxInput?.checked;

  if (!inboxBlock) {
    return;
  }

  inboxBlock.classList.toggle('is-hidden', !isVisible);
  document.querySelectorAll('#supplierAccessForm [data-supplier-inbox-detail]').forEach((element) => {
    element.classList.toggle('is-hidden', !showDetails);
  });

  if (!isVisible) {
    document.querySelectorAll('#supplierAccessForm input[name="supplierInboxPresets"]').forEach((input) => {
      input.checked = false;
    });
    document.getElementById('supplierAccessRules').value = '';
  } else if (allInboxInput?.checked) {
    document.querySelectorAll('#supplierAccessForm input[name="supplierInboxPresets"]:not([value="all"])').forEach((input) => {
      input.checked = false;
    });
    document.getElementById('supplierAccessRules').value = '';
  }
}

function renderSupplierAccountList() {
  const list = document.getElementById('supplierAccountList');
  const count = document.querySelector('[data-supplier-count]');

  if (!list) {
    return;
  }

  const accounts = loadSupplierAccounts();

  if (count) {
    count.textContent = String(accounts.length);
  }

  if (!accounts.length) {
    list.innerHTML = `
      <div class="admin-spectrum-empty">
        <div>
          <h3>Belum Ada Supplier</h3>
          <span>Tambahkan Supplier baru dari tombol Tambahkan Supplier.</span>
        </div>
      </div>
    `;
    return;
  }

  const visibleAccounts = accounts.slice(0, catsoftSupplierPageSize);
  const rows = visibleAccounts.map((account) => {
    const domainSummary = (account.allowedDomains || []).length
      ? (account.allowedDomains || []).join(', ')
      : 'Tidak Ada Domain';
    const roleText = account.inboxAccessAll ? 'Email Penuh' : 'Supplier';

    return `
      <div class="admin-spectrum-row" data-edit-supplier="${escapeAdminHtml(account.username)}" role="row">
        <span class="admin-spectrum-check"><input type="checkbox" name="selectedSupplier" value="${escapeAdminHtml(account.username)}" aria-label="Pilih ${escapeAdminHtml(account.username)}" /></span>
        <span class="admin-spectrum-name">
          <span class="admin-spectrum-avatar supplier" aria-hidden="true">${escapeAdminHtml(getAdminInitials(account.username))}</span>
          <span><strong>${escapeAdminHtml(account.username)}</strong><small>${escapeAdminHtml(getOnlineLabel(account.activeAt))}</small></span>
        </span>
        <button class="admin-spectrum-open" type="button" data-open-supplier="${escapeAdminHtml(account.username)}" aria-label="Buka Detail ${escapeAdminHtml(account.username)}"></button>
        <span>${escapeAdminHtml(account.username)}</span>
        <span>${escapeAdminHtml(roleText)}<small>${escapeAdminHtml(domainSummary)}</small></span>
      </div>
    `;
  }).join('');

  list.innerHTML = `
    <div class="admin-spectrum-table" role="grid" aria-label="Daftar Supplier">
      <div class="admin-spectrum-row is-heading" role="row">
        <span><input type="checkbox" id="supplierSelectAll" aria-label="Pilih Semua Supplier" /></span>
        <span>Nama</span>
        <span></span>
        <span>Username</span>
        <span>Peran Supplier</span>
      </div>
      ${rows}
    </div>
    <div class="admin-spectrum-pager">
      <div class="admin-spectrum-page-buttons" aria-label="Navigasi Halaman Supplier">
        <button class="admin-spectrum-page-nav is-prev" type="button" disabled aria-label="Halaman Sebelumnya"><span>Sebelumnya</span></button>
        <button class="admin-spectrum-page-nav is-next" type="button" disabled aria-label="Halaman Berikutnya"><span>Berikutnya</span></button>
      </div>
      <label class="admin-spectrum-page-size">
        <span>Item Per Halaman</span>
        <select id="supplierPageSize">
          ${[5, 10, 20, 50].map((size) => `<option value="${size}" ${catsoftSupplierPageSize === size ? 'selected' : ''}>${size}</option>`).join('')}
        </select>
      </label>
      <span class="admin-spectrum-page-count">${visibleAccounts.length ? `1-${visibleAccounts.length}` : '0'} Dari ${accounts.length}</span>
    </div>
  `;

  list.querySelectorAll('[data-open-supplier]').forEach((button) => {
    button.addEventListener('click', () => editSupplierAccount(button.dataset.openSupplier));
  });

  list.querySelectorAll('input[name="selectedSupplier"]').forEach((input) => {
    input.addEventListener('change', updateSupplierDeleteSelectedState);
  });

  const selectAll = document.getElementById('supplierSelectAll');
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      document.querySelectorAll('#supplierAccountList input[name="selectedSupplier"]').forEach((input) => {
        input.checked = selectAll.checked;
      });
      updateSupplierDeleteSelectedState();
    });
  }

  const search = document.getElementById('supplierAccountSearch');
  if (search) {
    search.addEventListener('input', filterSupplierAccountRows);
    filterSupplierAccountRows();
  }

  const pageSize = document.getElementById('supplierPageSize');
  if (pageSize) {
    pageSize.addEventListener('change', () => {
      catsoftSupplierPageSize = Number(pageSize.value) || 10;
      renderSupplierAccountList();
    });
  }

  updateSupplierDeleteSelectedState();
}

function filterSupplierAccountRows() {
  const search = document.getElementById('supplierAccountSearch');
  const query = normalizeAdminValue(search ? search.value : '');

  document.querySelectorAll('#supplierAccountList .admin-spectrum-row[data-edit-supplier]').forEach((row) => {
    row.hidden = query ? !normalizeAdminValue(row.textContent).includes(query) : false;
  });
}

function updateSupplierDeleteSelectedState() {
  const deleteButton = document.getElementById('supplierDeleteSelected');

  if (!deleteButton) {
    return;
  }

  deleteButton.disabled = !document.querySelector('#supplierAccountList input[name="selectedSupplier"]:checked');
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
  updateSupplierInboxAccessVisibility();
  updateSupplierToolCategoryState();
  updateSupplierAccessDrawerTitle(account.username);
  setSupplierAccessDrawerOpen(true);
  setSupplierAccessStatus('');
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
  document.getElementById('adminAccessWhatsapp').value = account.whatsappTarget || '';
  setAdminWhatsappStatus('');
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
  resetAdminToolCategoryOpenState();
  updateAdminToolCategoryState();
  updateAdminAccessDrawerTitle(account.username);
  setAdminAccessDrawerOpen(true);
  setAccessStatus('');
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

function initSoftDateInputs(root = document) {
  root.querySelectorAll?.('input[type="date"]').forEach((input) => {
    if (!input.dataset.emptyLabel) {
      input.dataset.emptyLabel = 'Pilih Tanggal';
    }

    const updateDateState = () => {
      input.classList.toggle('has-date-value', Boolean(input.value));
    };

    input.classList.add('soft-date-input');
    updateDateState();

    if (input.dataset.softDateReady === 'true') {
      return;
    }

    input.dataset.softDateReady = 'true';
    input.addEventListener('input', updateDateState);
    input.addEventListener('change', updateDateState);
  });
}

function startSoftDateInputObserver() {
  initSoftDateInputs();

  if (window.catsoftSoftDateObserver) {
    return;
  }

  window.catsoftSoftDateObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          initSoftDateInputs(node);
        }
      });
    });
  });

  window.catsoftSoftDateObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function initAdminAuth() {
  if (new URLSearchParams(window.location.search).get('embedded') === '1') {
    document.body.classList.add('catsoft-embedded-tool');
  }

  startSoftDateInputObserver();

  if (window.CATSOFT_SKIP_ADMIN_AUTH) {
    return;
  }

  injectAuthStyles();

  const currentToolId = getCurrentAdminToolId();
  const admin = getCurrentAdmin();

  if (!admin) {
    renderLogin();
    return;
  }

  if (currentToolId && !(currentToolId === 'admin-access' ? adminCanUseAccessConsole(admin) : adminHasToolAccess(currentToolId))) {
    renderAccessDenied();
    return;
  }

  window.CATSOFT_ADMIN_AUTHORIZED = true;
  addSessionControls();
  filterAdminToolCards();
  enableAdminToolAccordions();
  renderOwnerAccessPanel();
  renderSupplierAccessPanel();
  enableAdminConsoleViews();
  if (document.body.classList.contains('admin-console-body')) {
    const currentHash = String(window.location.hash || '').replace(/^#/, '');
    const routePath = normalizeRoutePath(window.location.pathname);
    if (currentHash === 'chat' || routePath === '/chat') {
      window.setTimeout(openAdminChatPopup, 0);
    }
  }
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
