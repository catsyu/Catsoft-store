if (!window.CATSOFT_ADMIN_AUTHORIZED) {
  throw new Error('Catsoft admin authorization required.');
}

const productionApiEndpoint = 'https://catsoft.store/api/email-messages';
const apiEndpoint = window.CATSOFT_EMAIL_INBOX_API || getDefaultApiEndpoint();
const readStorageKey = 'catsoftEmailInboxReadIds';
const deletedStorageKey = 'catsoftEmailInboxDeletedIds';
const autoRefreshMs = 15000;
const emailFetchLimit = 500;

const refreshBtn = document.getElementById('refreshBtn');
const syncStatus = document.getElementById('syncStatus');
const totalCount = document.getElementById('totalCount');
const unreadCount = document.getElementById('unreadCount');
const otpCount = document.getElementById('otpCount');
const recipientCount = document.getElementById('recipientCount');
const filterForm = document.getElementById('filterForm');
const recipientFilter = document.getElementById('recipientFilter');
const domainFilter = document.getElementById('domainFilter');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const keywordFilter = document.getElementById('keywordFilter');
const categoryTabs = document.getElementById('categoryTabs');
const bulkToolbar = document.getElementById('bulkToolbar');
const selectAllEmails = document.getElementById('selectAllEmails');
const selectedEmailCount = document.getElementById('selectedEmailCount');
const emailControlToggle = document.getElementById('emailControlToggle');
const emailControlPanel = document.getElementById('emailControlPanel');
const emailList = document.getElementById('emailList');
const messagePanel = document.getElementById('messagePanel');
const mobileDetailQuery = window.matchMedia('(max-width: 1060px)');

const categoryLabels = {
  all: 'Semua',
  'chatgpt-otp': 'ChatGPT',
  adobe: 'Adobe',
  canva: 'Canva',
  support: 'Support',
  other: 'Lainnya'
};

const categoryRules = [
  {
    value: 'chatgpt-otp',
    checks: ['chatgpt', 'openai', 'tm.openai.com', 'verification code', 'kode verifikasi', 'otp']
  },
  {
    value: 'adobe',
    checks: ['adobe', 'creative cloud', 'photoshop', 'illustrator', 'acrobat']
  },
  {
    value: 'canva',
    checks: ['canva']
  },
  {
    value: 'support',
    checks: ['support', 'bantuan', 'refund', 'order', 'pesanan', 'customer']
  }
];

const chatgptChecks = ['openai', 'chatgpt', 'tm.openai.com'];
const adobeChecks = ['adobe', 'creative cloud', 'photoshop', 'illustrator', 'acrobat'];

const state = {
  emails: [],
  filteredEmails: [],
  selectedId: null,
  source: 'api',
  readIds: loadReadIds(),
  deletedIds: loadDeletedIds(),
  selectedIds: new Set(),
  lastUpdatedAt: null
};

const currentAdminAccess = window.CatsoftAdminAuth ? window.CatsoftAdminAuth.getCurrentAdmin() : null;
const inboxAccess = currentAdminAccess && currentAdminAccess.role !== 'owner' && window.CatsoftAdminAuth
  ? window.CatsoftAdminAuth.getInboxAccess()
  : { all: true, rules: [] };

let isLoadingEmails = false;
let autoRefreshTimer;

function canUseDemoFallback() {
  return window.location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(window.location.hostname.toLowerCase());
}

function setupMobileCollapse(toggle, panel) {
  if (!toggle || !panel) {
    return;
  }

  const toggleLabel = toggle.querySelector('strong');

  const setOpen = (isOpen) => {
    panel.classList.toggle('is-open', isOpen);
    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));

    if (toggleLabel) {
      toggleLabel.textContent = isOpen ? 'Sembunyikan' : 'Tampilkan';
    }
  };

  setOpen(false);

  toggle.addEventListener('click', () => {
    setOpen(!panel.classList.contains('is-open'));
  });
}

setupMobileCollapse(emailControlToggle, emailControlPanel);

function getDefaultApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalPage || hostname !== 'catsoft.store') {
    return productionApiEndpoint;
  }

  return '/api/email-messages';
}

function createSampleEmails() {
  const now = Date.now();

  return [
    {
      id: 'demo-chatgpt-1',
      from: 'noreply@tm.openai.com',
      to: 'Chatgpt@catsoft.store',
      subject: 'Your ChatGPT verification code is 482193',
      receivedAt: new Date(now - 8 * 60 * 1000).toISOString(),
      body: 'Your ChatGPT verification code is 482193. This code expires shortly.',
      snippet: 'Your ChatGPT verification code is 482193.',
      read: false
    },
    {
      id: 'demo-adobe-1',
      from: 'message@adobe.com',
      to: 'adobe@catsoft.store',
      subject: 'Kode verifikasi Adobe',
      receivedAt: new Date(now - 43 * 60 * 1000).toISOString(),
      body: 'Kode verifikasi Adobe Anda adalah 731284. Jangan bagikan kode ini kepada siapa pun.',
      snippet: 'Kode verifikasi Adobe Anda adalah 731284.',
      read: false
    },
    {
      id: 'demo-canva-1',
      from: 'no-reply@canva.com',
      to: 'canva@catsoft.store',
      subject: 'Canva team invitation',
      receivedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      body: 'A new Canva team invitation was sent to canva@catsoft.store.',
      snippet: 'A new Canva team invitation was sent.',
      read: true
    },
    {
      id: 'demo-support-1',
      from: 'customer@example.com',
      to: 'support@catsoft.store',
      subject: 'Kendala aktivasi pesanan',
      receivedAt: new Date(now - 9 * 60 * 60 * 1000).toISOString(),
      body: 'Halo admin, saya ada kendala saat aktivasi akun. Mohon dibantu cek pesanan saya.',
      snippet: 'Halo admin, saya ada kendala saat aktivasi akun.',
      read: true
    }
  ];
}

function loadReadIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    return new Set();
  }
}

function saveReadIds() {
  localStorage.setItem(readStorageKey, JSON.stringify([...state.readIds]));
}

function loadDeletedIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(deletedStorageKey) || '[]');
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    return new Set();
  }
}

function saveDeletedIds() {
  localStorage.setItem(deletedStorageKey, JSON.stringify([...state.deletedIds]));
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeSearch(value) {
  return String(value || '').toLowerCase().trim();
}

function cleanAddress(value) {
  return String(value || '').trim();
}

function isEmailAllowed(email) {
  if (inboxAccess.all) {
    return true;
  }

  const rules = Array.isArray(inboxAccess.rules) ? inboxAccess.rules : [];

  if (!rules.length) {
    return false;
  }

  const haystack = normalizeSearch([
    email.from,
    email.to,
    email.subject,
    email.snippet,
    email.body,
    email.category,
    categoryLabels[email.category],
    getSenderName(email.from, email.category),
    getRecipientLabel(email)
  ].join(' '));

  return rules.some((rule) => haystack.includes(rule));
}

function getEmailDomain(value) {
  const address = cleanAddress(value).toLowerCase();
  const domain = address.split('@').pop() || '';
  return domain.replace(/^www\./, '');
}

function getRecipientName(value) {
  const address = cleanAddress(value).toLowerCase();
  const localPart = address.split('@')[0] || address;

  if (!localPart) {
    return 'Penerima tidak diketahui';
  }

  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSenderName(value, category) {
  const address = cleanAddress(value);
  const lowerAddress = address.toLowerCase();
  const domain = getEmailDomain(address);

  if (category === 'chatgpt-otp' || domain.includes('openai.com') || lowerAddress.includes('openai') || lowerAddress.includes('chatgpt')) {
    return 'OpenAI';
  }

  if (category === 'adobe' || domain.includes('adobe.com') || lowerAddress.includes('adobe')) {
    return 'Adobe';
  }

  if (category === 'canva' || domain.includes('canva.com') || lowerAddress.includes('canva')) {
    return 'Canva';
  }

  if (lowerAddress.includes('bounce') || lowerAddress.includes('noreply') || lowerAddress.includes('no-reply')) {
    return domain || 'Pengirim otomatis';
  }

  return address.split('@')[0] || 'Pengirim tidak diketahui';
}

function getRecipientLabel(email) {
  return cleanAddress(email.to).toLowerCase() || 'Penerima tidak diketahui';
}

function getAddressSummary(email) {
  return `Dari ${getSenderName(email.from, email.category)} • Masuk ke ${getRecipientLabel(email)}`;
}

function getMessageDomain(email) {
  return getEmailDomain(email.to);
}

function htmlToText(value) {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|td|tr|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&zwnj;/g, '')
    .replace(/&#8204;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => {
      const point = Number(code);
      return Number.isFinite(point) ? String.fromCodePoint(point) : ' ';
    })
    .replace(/&#x([A-Fa-f0-9]+);/g, (_, code) => {
      const point = parseInt(code, 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : ' ';
    })
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .trim();
}

function normalizeEmail(rawEmail) {
  const id = rawEmail.id || rawEmail.emailId || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const from = cleanAddress(rawEmail.from || rawEmail.sender);
  const to = cleanAddress(rawEmail.to || rawEmail.recipient);
  const htmlBody = rawEmail.htmlBody || rawEmail.html_body || '';
  const textBody = rawEmail.body || rawEmail.textBody || rawEmail.text_body || '';
  const htmlText = htmlToText(htmlBody);
  const body = buildReadableMessageBody(textBody, htmlText, rawEmail.rawContent || rawEmail.raw_content || '');
  const receivedAt = rawEmail.receivedAt || rawEmail.received_at || rawEmail.timestamp || rawEmail.date || new Date().toISOString();
  const subject = rawEmail.subject || '(Tanpa subject)';
  const category = normalizeCategory(rawEmail.category, { from, to, subject, body });
  const snippet = getReadableSnippet(rawEmail.snippet || rawEmail.preview, subject, body, category);
  const otpCode = rawEmail.otpCode || rawEmail.otp_code || extractOtp(`${subject}\n${body}`);
  const hasServerReadState = Object.prototype.hasOwnProperty.call(rawEmail, 'read')
    || Object.prototype.hasOwnProperty.call(rawEmail, 'readAt')
    || Object.prototype.hasOwnProperty.call(rawEmail, 'read_at');
  const read = hasServerReadState
    ? Boolean(rawEmail.read || rawEmail.readAt || rawEmail.read_at)
    : state.readIds.has(id);

  return {
    id,
    from,
    to,
    subject,
    receivedAt,
    body,
    snippet,
    category,
    otpCode,
    read,
    size: rawEmail.size || rawEmail.rawSize || 0
  };
}

function buildReadableMessageBody(textBody, htmlText, rawContent) {
  const text = cleanMessageText(textBody);
  const html = cleanMessageText(htmlText);

  if (isUsefulMessageText(text) && (!html || text.length >= Math.min(html.length, 120))) {
    return text;
  }

  return html || text || cleanMessageText(rawContent);
}

function getReadableSnippet(snippet, subject, body, category) {
  const text = cleanMessageText(snippet);

  if (isUsefulMessageText(text)) {
    return text.slice(0, 180);
  }

  return cleanMessageText(body || subject || (category === 'adobe' ? 'Email Adobe' : 'Isi email tersedia')).slice(0, 180);
}

function cleanMessageText(value) {
  return String(value || '')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUsefulMessageText(value) {
  return cleanMessageText(value)
    .replace(/[-=_*•·\s]/g, '')
    .trim()
    .length >= 24;
}

function normalizeCategory(value, email) {
  if (value && categoryLabels[value]) {
    return value;
  }

  const haystack = normalizeSearch(`${email.to} ${email.from} ${email.subject} ${email.body}`);

  if (chatgptChecks.some((check) => haystack.includes(check))) {
    return 'chatgpt-otp';
  }

  if (adobeChecks.some((check) => haystack.includes(check))) {
    return 'adobe';
  }

  const matchedRule = categoryRules
    .filter((rule) => rule.value !== 'chatgpt-otp' && rule.value !== 'adobe')
    .find((rule) => rule.checks.some((check) => haystack.includes(check)));

  return matchedRule ? matchedRule.value : 'other';
}

function extractOtp(value) {
  const match = String(value || '').match(/\b\d{4,8}\b/);
  return match ? match[0] : '';
}

function isRead(email) {
  return email.read || state.readIds.has(email.id);
}

function setStatus(message, type) {
  syncStatus.textContent = message;
  syncStatus.title = '';
  syncStatus.classList.remove('success', 'warning');
  if (type) {
    syncStatus.classList.add(type);
  }
}

function parseEmailsResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.emails)) {
    return data.emails;
  }

  if (Array.isArray(data.messages)) {
    return data.messages;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  return [];
}

function buildEmailListUrl() {
  const url = new URL(apiEndpoint, window.location.href);
  url.searchParams.set('limit', String(emailFetchLimit));
  url.searchParams.set('_', String(Date.now()));

  return url;
}

function formatClock(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function getFreshStatus() {
  const updatedAt = state.lastUpdatedAt ? formatClock(state.lastUpdatedAt) : '-';
  return updatedAt;
}

async function loadEmails(options = {}) {
  if (isLoadingEmails) {
    return;
  }

  isLoadingEmails = true;

  if (!options.silent) {
    setStatus('Memuat...');
  }

  refreshBtn.disabled = true;

  try {
    const response = await fetch(buildEmailListUrl(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(getApiErrorMessage(response.status));
    }

    const data = await response.json();
    const emails = parseEmailsResponse(data)
      .map(normalizeEmail)
      .filter(isEmailAllowed);

    state.source = 'api';
    state.emails = sortEmails(emails);
    state.lastUpdatedAt = new Date();
    setStatus(getFreshStatus(), 'success');
  } catch (error) {
    if (state.source === 'api' && state.emails.length) {
      setStatus('Gagal sinkron', 'warning');
      syncStatus.title = error.message;
      return;
    }

    if (canUseDemoFallback()) {
      state.source = 'demo';
      state.emails = sortEmails(createSampleEmails()
        .map(normalizeEmail)
        .filter((email) => !state.deletedIds.has(email.id))
        .filter(isEmailAllowed));
      state.lastUpdatedAt = new Date();
      setStatus('Data demo', 'warning');
      syncStatus.title = error.message;
    } else {
      state.source = 'api';
      state.emails = [];
      state.lastUpdatedAt = new Date();
      setStatus('Tidak tersinkron', 'warning');
      syncStatus.title = `${error.message}. Data demo dinonaktifkan di catsoft.store agar inbox selalu memakai database.`;
    }
  } finally {
    isLoadingEmails = false;
    refreshBtn.disabled = false;
    applyFilters();
  }
}

function getApiErrorMessage(status) {
  const messages = {
    401: 'API 401 unauthorized, cek Cloudflare Access atau ALLOW_UNAUTHENTICATED_API',
    403: 'API 403 forbidden, cek permission Access/route Worker',
    404: 'API 404, route /api/email-messages belum menuju Worker',
    500: 'API 500, cek D1 binding/schema dan Worker logs'
  };

  return messages[status] || `API ${status}`;
}

function sortEmails(emails) {
  return [...emails].sort((first, second) => new Date(second.receivedAt) - new Date(first.receivedAt));
}

function applyFilters() {
  const recipientQuery = normalizeSearch(recipientFilter.value);
  const domainValue = domainFilter.value;
  const categoryValue = categoryFilter.value;
  const statusValue = statusFilter.value;
  const keywordQuery = normalizeSearch(keywordFilter.value);

  state.filteredEmails = state.emails.filter((email) => {
    const recipient = normalizeSearch(email.to);
    const domain = getMessageDomain(email);
    const searchable = normalizeSearch(`${email.from} ${email.to} ${email.subject} ${email.snippet} ${email.body}`);

    if (state.deletedIds.has(email.id) || !isEmailAllowed(email)) {
      return false;
    }

    if (recipientQuery) {
      const isExactEmail = recipientQuery.includes('@');
      const recipientMatches = isExactEmail ? recipient === recipientQuery : recipient.includes(recipientQuery);

      if (!recipientMatches) {
        return false;
      }
    }

    if (categoryValue !== 'all' && email.category !== categoryValue) {
      return false;
    }

    if (domainValue !== 'all' && domain !== domainValue) {
      return false;
    }

    if (statusValue === 'unread' && isRead(email)) {
      return false;
    }

    if (statusValue === 'read' && !isRead(email)) {
      return false;
    }

    return !keywordQuery || searchable.includes(keywordQuery);
  });

  renderStats();
  renderCategoryTabs();
  syncSelectedIds();
  renderEmailList();
  renderSelectedEmail();
  renderBulkToolbar();
}

function syncSelectedIds() {
  const filteredIds = new Set(state.filteredEmails.map((email) => email.id));
  state.selectedIds.forEach((id) => {
    if (!filteredIds.has(id)) {
      state.selectedIds.delete(id);
    }
  });
}

function renderStats() {
  const uniqueRecipients = new Set(state.emails.map((email) => normalizeSearch(email.to)).filter(Boolean));

  totalCount.textContent = state.emails.length;
  unreadCount.textContent = state.emails.filter((email) => !isRead(email)).length;

  if (otpCount) {
    otpCount.textContent = state.emails.filter((email) => email.category === 'chatgpt-otp').length;
  }

  if (recipientCount) {
    recipientCount.textContent = uniqueRecipients.size;
  }
}

function renderCategoryTabs() {
  categoryTabs.querySelectorAll('.category-tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.categoryTab === categoryFilter.value);
  });
}

function renderBulkToolbar() {
  const selectedCount = state.selectedIds.size;
  const filteredCount = state.filteredEmails.length;

  selectedEmailCount.textContent = `${selectedCount} dipilih`;
  bulkToolbar.classList.toggle('has-selection', selectedCount > 0);
  bulkToolbar.querySelectorAll('button[data-bulk-action]').forEach((button) => {
    button.disabled = selectedCount === 0 && button.dataset.bulkAction !== 'clear';
  });

  selectAllEmails.checked = filteredCount > 0 && selectedCount === filteredCount;
  selectAllEmails.indeterminate = selectedCount > 0 && selectedCount < filteredCount;
}

function renderEmailList() {
  if (!state.filteredEmails.length) {
    emailList.innerHTML = '<p class="empty-state">Tidak ada email yang cocok.</p>';
    return;
  }

  emailList.innerHTML = state.filteredEmails.map((email) => {
    const read = isRead(email);
    const selected = email.id === state.selectedId;
    const checked = state.selectedIds.has(email.id);

    return `
      <article class="email-item ${read ? '' : 'is-unread'} ${selected ? 'is-selected' : ''}" data-email-id="${escapeHtml(email.id)}" role="button" tabindex="0">
        <label class="email-select" aria-label="Pilih email">
          <input type="checkbox" data-email-select="${escapeHtml(email.id)}" ${checked ? 'checked' : ''} />
          <span></span>
        </label>
        <div class="email-top">
          <span class="sender-avatar" aria-hidden="true">${escapeHtml(getSenderInitial(email))}</span>
          <div class="email-title">
            <strong class="sender-name">${escapeHtml(getSenderName(email.from, email.category))}</strong>
            <h3>${escapeHtml(email.subject)}</h3>
            <p>${escapeHtml(getAddressSummary(email))}</p>
          </div>
          <span class="email-time">${escapeHtml(formatDateTime(email.receivedAt))}</span>
        </div>
        <p class="email-preview">${escapeHtml(email.snippet || email.body || 'Tidak ada preview.')}</p>
        <div class="email-meta-row">
          <span class="category-badge ${escapeHtml(email.category)}">${escapeHtml(categoryLabels[email.category] || categoryLabels.other)}</span>
          <span class="read-badge ${read ? '' : 'unread'}">${read ? 'Sudah dibaca' : 'Belum dibaca'}</span>
        </div>
      </article>
    `;
  }).join('');
}

function toggleEmailSelection(id, checked) {
  if (checked) {
    state.selectedIds.add(id);
  } else {
    state.selectedIds.delete(id);
  }

  renderEmailList();
  renderBulkToolbar();
}

function clearEmailSelection() {
  state.selectedIds.clear();
  renderEmailList();
  renderBulkToolbar();
}

function setAllFilteredSelection(checked) {
  state.filteredEmails.forEach((email) => {
    if (checked) {
      state.selectedIds.add(email.id);
    } else {
      state.selectedIds.delete(email.id);
    }
  });
  renderEmailList();
  renderBulkToolbar();
}

function getSenderInitial(email) {
  const name = getSenderName(email.from, email.category);
  return (name || 'M').slice(0, 1).toUpperCase();
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

async function selectEmail(id) {
  state.selectedId = id;
  const localEmail = state.emails.find((email) => email.id === id);

  if (!localEmail) {
    renderSelectedEmail();
    return;
  }

  markRead(localEmail);
  renderEmailList();
  renderSelectedEmail(localEmail);
  openMobileDetail();

  if (state.source !== 'api') {
    return;
  }

  try {
    const response = await fetch(`${apiEndpoint}/${encodeURIComponent(id)}`, { cache: 'no-store' });

    if (!response.ok) {
      return;
    }

    const fullEmail = normalizeEmail(await response.json());
    const index = state.emails.findIndex((email) => email.id === id);

    if (index >= 0) {
      state.emails[index] = { ...state.emails[index], ...fullEmail, read: true };
      renderSelectedEmail(state.emails[index]);
      openMobileDetail();
    }
  } catch (error) {
    renderSelectedEmail(localEmail);
    openMobileDetail();
  }
}

function markRead(email) {
  email.read = true;
  state.readIds.add(email.id);
  saveReadIds();

  if (state.source === 'api') {
    fetch(`${apiEndpoint}/${encodeURIComponent(email.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true })
    }).catch(() => {});
  }
}

function markUnread(email) {
  email.read = false;
  state.readIds.delete(email.id);
  saveReadIds();

  if (state.source === 'api') {
    fetch(`${apiEndpoint}/${encodeURIComponent(email.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: false })
    }).catch(() => {});
  }
}

function deleteEmail(email) {
  state.deletedIds.add(email.id);
  state.readIds.delete(email.id);

  if (state.selectedId === email.id) {
    state.selectedId = null;
  }

  if (state.source === 'api') {
    fetch(`${apiEndpoint}/${encodeURIComponent(email.id)}`, {
      method: 'DELETE'
    }).catch(() => {});
  }
}

function getSelectedEmailBody(email) {
  const raw = String(email.body || email.snippet || 'Isi email belum tersedia.')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!raw) {
    return 'Isi email belum tersedia.';
  }

  if (/^to view this email as a web page/i.test(raw)) {
    return raw.split(/\n\s*\n/)[0] || raw;
  }

  return raw;
}

function runBulkAction(action) {
  const selectedEmails = state.emails.filter((email) => state.selectedIds.has(email.id));

  if (action === 'clear') {
    clearEmailSelection();
    return;
  }

  if (!selectedEmails.length) {
    return;
  }

  if (action === 'read') {
    selectedEmails.forEach(markRead);
  } else if (action === 'unread') {
    selectedEmails.forEach(markUnread);
  } else if (action === 'delete') {
    selectedEmails.forEach(deleteEmail);
    saveDeletedIds();
    saveReadIds();
    state.emails = state.emails.filter((email) => !state.deletedIds.has(email.id));
  }

  state.selectedIds.clear();
  applyFilters();
}

function renderSelectedEmail(email) {
  const selectedEmail = email || state.emails.find((item) => item.id === state.selectedId);

  if (!selectedEmail) {
    messagePanel.innerHTML = `
      <div class="detail-empty">
        <span class="section-kicker">Detail email</span>
        <h2>Pilih email</h2>
      </div>
    `;
    return;
  }

  const body = getSelectedEmailBody(selectedEmail);
  const recipientLabel = getRecipientLabel(selectedEmail);
  const senderLabel = getSenderName(selectedEmail.from, selectedEmail.category);
  const otpMarkup = selectedEmail.otpCode ? `
    <div class="otp-strip">
      <div>
        <span>Kode OTP</span>
        <strong>${escapeHtml(selectedEmail.otpCode)}</strong>
      </div>
      <button class="secondary-button" type="button" data-detail-action="copy-otp" data-copy-value="${escapeHtml(selectedEmail.otpCode)}">Copy OTP</button>
    </div>
  ` : '';

  messagePanel.innerHTML = `
    <div class="detail-header">
      <div class="detail-toolbar">
        <button class="secondary-button mobile-close-button" type="button" data-detail-action="close-detail">Tutup</button>
        <button class="secondary-button" type="button" data-detail-action="copy-recipient" data-copy-value="${escapeHtml(selectedEmail.to)}">Copy Email</button>
        <button class="secondary-button" type="button" data-detail-action="copy-body" data-copy-value="${escapeHtml(body)}">Copy Isi</button>
      </div>
      <h2 class="detail-subject">${escapeHtml(selectedEmail.subject)}</h2>
      <div class="detail-top">
        <span class="sender-avatar detail-avatar" aria-hidden="true">${escapeHtml(getSenderInitial(selectedEmail))}</span>
        <div class="detail-title">
          <strong class="sender-name">${escapeHtml(senderLabel)}</strong>
          <p class="detail-address">Kepada ${escapeHtml(recipientLabel)}</p>
        </div>
        <span class="email-time">${escapeHtml(formatDateTime(selectedEmail.receivedAt))}</span>
      </div>
      <div class="detail-meta-line">
        <span class="category-badge ${escapeHtml(selectedEmail.category)}">${escapeHtml(categoryLabels[selectedEmail.category] || categoryLabels.other)}</span>
        <span>Dari ${escapeHtml(senderLabel)}</span>
        <span>${escapeHtml(formatDateTime(selectedEmail.receivedAt))}</span>
      </div>
    </div>
    ${otpMarkup}
    <div class="message-body">
      <div class="message-content">${escapeHtml(body)}</div>
    </div>
  `;
}

function openMobileDetail() {
  if (!mobileDetailQuery.matches || !state.selectedId) {
    return;
  }

  document.body.classList.add('detail-drawer-open');
  messagePanel.classList.add('is-open');
}

function closeMobileDetail() {
  document.body.classList.remove('detail-drawer-open');
  messagePanel.classList.remove('is-open');
}

function copyText(value) {
  const text = String(value || '');

  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
  return Promise.resolve();
}

function setCategoryFilter(value) {
  categoryFilter.value = categoryLabels[value] ? value : 'all';
  applyFilters();
}

function refreshIfVisible() {
  if (document.hidden) {
    return;
  }

  loadEmails({ silent: true });
}

function startAutoRefresh() {
  window.clearInterval(autoRefreshTimer);
  autoRefreshTimer = window.setInterval(refreshIfVisible, autoRefreshMs);
}

refreshBtn.addEventListener('click', () => loadEmails());

filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  applyFilters();
});

[recipientFilter, domainFilter, categoryFilter, statusFilter, keywordFilter].forEach((element) => {
  element.addEventListener('input', applyFilters);
  element.addEventListener('change', applyFilters);
});

categoryTabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-category-tab]');

  if (!tab) {
    return;
  }

  setCategoryFilter(tab.dataset.categoryTab);
});

emailList.addEventListener('click', (event) => {
  const checkbox = event.target.closest('[data-email-select]');

  if (checkbox) {
    event.stopPropagation();
    toggleEmailSelection(checkbox.dataset.emailSelect, checkbox.checked);
    return;
  }

  if (event.target.closest('.email-select')) {
    return;
  }

  const item = event.target.closest('[data-email-id]');

  if (!item) {
    return;
  }

  selectEmail(item.dataset.emailId);
});

selectAllEmails.addEventListener('change', () => {
  setAllFilteredSelection(selectAllEmails.checked);
});

bulkToolbar.addEventListener('click', (event) => {
  const button = event.target.closest('[data-bulk-action]');

  if (!button) {
    return;
  }

  runBulkAction(button.dataset.bulkAction);
});

emailList.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  const item = event.target.closest('[data-email-id]');

  if (!item) {
    return;
  }

  event.preventDefault();
  selectEmail(item.dataset.emailId);
});

messagePanel.addEventListener('click', (event) => {
  const button = event.target.closest('[data-detail-action]');

  if (!button) {
    return;
  }

  if (button.dataset.detailAction === 'close-detail') {
    closeMobileDetail();
    return;
  }

  copyText(button.dataset.copyValue || '').then(() => {
    const originalText = button.textContent;
    button.textContent = 'Tersalin';
    setTimeout(() => {
      button.textContent = originalText;
    }, 900);
  });
});

messagePanel.addEventListener('click', (event) => {
  if (!mobileDetailQuery.matches || event.target !== messagePanel) {
    return;
  }

  closeMobileDetail();
});

function handleMobileDetailQueryChange(event) {
  if (!event.matches) {
    closeMobileDetail();
  }
}

if (mobileDetailQuery.addEventListener) {
  mobileDetailQuery.addEventListener('change', handleMobileDetailQueryChange);
} else {
  mobileDetailQuery.addListener(handleMobileDetailQueryChange);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMobileDetail();
  }
});

document.querySelectorAll('[data-stat-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    const statFilter = button.dataset.statFilter;

    if (statFilter === 'unread') {
      statusFilter.value = 'unread';
      categoryFilter.value = 'all';
    } else if (categoryLabels[statFilter]) {
      categoryFilter.value = statFilter;
      statusFilter.value = 'all';
    } else {
      categoryFilter.value = 'all';
      domainFilter.value = 'all';
      statusFilter.value = 'all';
      recipientFilter.value = '';
      keywordFilter.value = '';
    }

    applyFilters();
  });
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadEmails({ silent: true });
  }
});

window.addEventListener('focus', () => {
  loadEmails({ silent: true });
});

startAutoRefresh();
loadEmails();
