const productionApiEndpoint = 'https://catsoft.store/api/email-messages';
const apiEndpoint = window.CATSOFT_EMAIL_INBOX_API || getDefaultApiEndpoint();
const readStorageKey = 'catsoftEmailInboxReadIds';
const autoRefreshMs = 15000;
const emailFetchLimit = 200;

const refreshBtn = document.getElementById('refreshBtn');
const syncStatus = document.getElementById('syncStatus');
const totalCount = document.getElementById('totalCount');
const unreadCount = document.getElementById('unreadCount');
const otpCount = document.getElementById('otpCount');
const recipientCount = document.getElementById('recipientCount');
const filterForm = document.getElementById('filterForm');
const recipientFilter = document.getElementById('recipientFilter');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const keywordFilter = document.getElementById('keywordFilter');
const categoryTabs = document.getElementById('categoryTabs');
const emailList = document.getElementById('emailList');
const messagePanel = document.getElementById('messagePanel');

const categoryLabels = {
  all: 'Semua',
  'chatgpt-otp': 'OTP ChatGPT',
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

const state = {
  emails: [],
  filteredEmails: [],
  selectedId: null,
  source: 'api',
  readIds: loadReadIds(),
  lastUpdatedAt: null
};

let isLoadingEmails = false;
let autoRefreshTimer;

function getDefaultApiEndpoint() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalPage) {
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

function htmlToText(value) {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .trim();
}

function normalizeEmail(rawEmail) {
  const id = rawEmail.id || rawEmail.emailId || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const from = cleanAddress(rawEmail.from || rawEmail.sender);
  const to = cleanAddress(rawEmail.to || rawEmail.recipient);
  const htmlBody = rawEmail.htmlBody || rawEmail.html_body || '';
  const body = rawEmail.body || rawEmail.textBody || rawEmail.text_body || htmlToText(htmlBody) || rawEmail.rawContent || rawEmail.raw_content || '';
  const snippet = rawEmail.snippet || rawEmail.preview || body.slice(0, 180);
  const receivedAt = rawEmail.receivedAt || rawEmail.received_at || rawEmail.timestamp || rawEmail.date || new Date().toISOString();
  const subject = rawEmail.subject || '(Tanpa subject)';
  const category = normalizeCategory(rawEmail.category, { from, to, subject, body });
  const otpCode = rawEmail.otpCode || rawEmail.otp_code || extractOtp(`${subject}\n${body}`);
  const read = Boolean(rawEmail.read || rawEmail.readAt || rawEmail.read_at || state.readIds.has(id));

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

function normalizeCategory(value, email) {
  if (value && categoryLabels[value]) {
    return value;
  }

  const haystack = normalizeSearch(`${email.to} ${email.from} ${email.subject} ${email.body}`);
  const matchedRule = categoryRules.find((rule) => rule.checks.some((check) => haystack.includes(check)));

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
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

function getFreshStatus(prefix, count) {
  const updatedAt = state.lastUpdatedAt ? formatClock(state.lastUpdatedAt) : '-';
  const source = apiEndpoint.startsWith('http') ? 'catsoft.store' : 'same-origin';
  return `${prefix} - ${count} email - update ${updatedAt} - ${source} - auto 15 detik`;
}

async function loadEmails(options = {}) {
  if (isLoadingEmails) {
    return;
  }

  isLoadingEmails = true;

  if (!options.silent) {
    setStatus('Memuat email...');
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
    const emails = parseEmailsResponse(data).map(normalizeEmail);

    state.source = 'api';
    state.emails = sortEmails(emails);
    state.lastUpdatedAt = new Date();
    setStatus(getFreshStatus('API aktif', state.emails.length), 'success');
  } catch (error) {
    if (state.source === 'api' && state.emails.length) {
      setStatus(`Refresh gagal: ${error.message} - data terakhir ${formatClock(state.lastUpdatedAt)}`, 'warning');
      return;
    }

    state.source = 'demo';
    state.emails = sortEmails(createSampleEmails().map(normalizeEmail));
    state.lastUpdatedAt = new Date();
    setStatus(`${getFreshStatus('Data demo', state.emails.length)} - ${error.message}`, 'warning');
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
  const categoryValue = categoryFilter.value;
  const statusValue = statusFilter.value;
  const keywordQuery = normalizeSearch(keywordFilter.value);

  state.filteredEmails = state.emails.filter((email) => {
    const recipient = normalizeSearch(email.to);
    const searchable = normalizeSearch(`${email.from} ${email.to} ${email.subject} ${email.snippet} ${email.body}`);

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
  renderEmailList();
  renderSelectedEmail();
}

function renderStats() {
  const uniqueRecipients = new Set(state.emails.map((email) => normalizeSearch(email.to)).filter(Boolean));

  totalCount.textContent = state.emails.length;
  unreadCount.textContent = state.emails.filter((email) => !isRead(email)).length;
  otpCount.textContent = state.emails.filter((email) => email.category === 'chatgpt-otp').length;
  recipientCount.textContent = uniqueRecipients.size;
}

function renderCategoryTabs() {
  categoryTabs.querySelectorAll('.category-tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.categoryTab === categoryFilter.value);
  });
}

function renderEmailList() {
  if (!state.filteredEmails.length) {
    emailList.innerHTML = '<p class="empty-state">Tidak ada email yang cocok.</p>';
    return;
  }

  emailList.innerHTML = state.filteredEmails.map((email) => {
    const read = isRead(email);
    const selected = email.id === state.selectedId;

    return `
      <article class="email-item ${read ? '' : 'is-unread'} ${selected ? 'is-selected' : ''}" data-email-id="${escapeHtml(email.id)}" role="button" tabindex="0">
        <div class="email-top">
          <div class="email-title">
            <h3>${escapeHtml(email.subject)}</h3>
            <p>${escapeHtml(email.from)} ke ${escapeHtml(email.to)}</p>
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
    }
  } catch (error) {
    renderSelectedEmail(localEmail);
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

  const body = selectedEmail.body || selectedEmail.snippet || 'Isi email belum tersedia.';
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
      <div class="detail-top">
        <div class="detail-title">
          <span class="category-badge ${escapeHtml(selectedEmail.category)}">${escapeHtml(categoryLabels[selectedEmail.category] || categoryLabels.other)}</span>
          <h2>${escapeHtml(selectedEmail.subject)}</h2>
          <p class="detail-address">${escapeHtml(selectedEmail.from)} ke ${escapeHtml(selectedEmail.to)}</p>
        </div>
        <span class="email-time">${escapeHtml(formatDateTime(selectedEmail.receivedAt))}</span>
      </div>
      <div class="detail-actions">
        <button class="secondary-button" type="button" data-detail-action="copy-recipient" data-copy-value="${escapeHtml(selectedEmail.to)}">Copy Penerima</button>
        <button class="secondary-button" type="button" data-detail-action="copy-body" data-copy-value="${escapeHtml(body)}">Copy Isi</button>
      </div>
    </div>
    ${otpMarkup}
    <div class="message-body">
      <pre>${escapeHtml(body)}</pre>
    </div>
  `;
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

[recipientFilter, categoryFilter, statusFilter, keywordFilter].forEach((element) => {
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
  const item = event.target.closest('[data-email-id]');

  if (!item) {
    return;
  }

  selectEmail(item.dataset.emailId);
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

  copyText(button.dataset.copyValue || '').then(() => {
    const originalText = button.textContent;
    button.textContent = 'Tersalin';
    setTimeout(() => {
      button.textContent = originalText;
    }, 900);
  });
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
