(function initInternalChat() {
  if (new URLSearchParams(window.location.search).get('popup') === '1') {
    document.body.classList.add('internal-chat-popup-mode');
  }

  if (!window.CATSOFT_ADMIN_AUTHORIZED || !window.CatsoftAdminAuth) {
    return;
  }

  const currentAdmin = window.CatsoftAdminAuth.getCurrentAdmin();

  if (!currentAdmin || !currentAdmin.username) {
    return;
  }

  const elements = {
    status: document.getElementById('chatStatus'),
    refresh: document.getElementById('refreshChatBtn'),
    directList: document.getElementById('directRoomList'),
    activeRoomLabel: document.getElementById('activeRoomLabel'),
    activeRoomTitle: document.getElementById('activeRoomTitle'),
    messageCount: document.getElementById('messageCount'),
    messages: document.getElementById('chatMessages'),
    form: document.getElementById('chatForm'),
    input: document.getElementById('chatInput')
  };

  const state = {
    roomId: 'all',
    roomTitle: 'Semua Admin',
    roomLabel: 'Ruang bersama',
    targetUsername: '',
    messages: [],
    pollTimer: null,
    isLoading: false
  };

  const apiEndpoint = window.CATSOFT_INTERNAL_CHAT_API || getDefaultInternalChatApiEndpoint();
  const adminAccountsEndpoint = window.CATSOFT_ADMIN_ACCOUNTS_API || getDefaultAdminAccountsApiEndpoint();

  renderDirectRooms();
  refreshKnownAdmins();
  bindEvents();
  loadMessages();
  state.pollTimer = window.setInterval(() => loadMessages({ silent: true }), 5000);

  function getDefaultInternalChatApiEndpoint() {
    const hostname = window.location.hostname.toLowerCase();
    const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

    if (window.location.protocol === 'file:' || isLocalPage || hostname !== 'catsoft.store') {
      return 'https://catsoft.store/api/internal-chat/messages';
    }

    return '/api/internal-chat/messages';
  }

  function getDefaultAdminAccountsApiEndpoint() {
    const hostname = window.location.hostname.toLowerCase();
    const isLocalPage = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';

    if (window.location.protocol === 'file:' || isLocalPage || hostname !== 'catsoft.store') {
      return 'https://catsoft.store/api/admin-accounts';
    }

    return '/api/admin-accounts';
  }

  function bindEvents() {
    document.querySelectorAll('.chat-room').forEach((button) => {
      button.addEventListener('click', () => activateRoomFromButton(button));
    });

    elements.refresh.addEventListener('click', () => loadMessages());

    elements.form.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage();
    });

    elements.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    window.addEventListener('beforeunload', () => {
      if (state.pollTimer) {
        window.clearInterval(state.pollTimer);
      }
    });
  }

  async function refreshKnownAdmins() {
    try {
      const response = await fetch(adminAccountsEndpoint, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];

      if (response.ok && accounts.length) {
        renderDirectRooms(accounts);
      }
    } catch (error) {}
  }

  function renderDirectRooms(sourceAccounts) {
    const accounts = Array.isArray(sourceAccounts) ? sourceAccounts : getKnownAdminAccounts();
    const currentKey = normalizeKey(currentAdmin.username);
    const uniqueAccounts = accounts
      .filter((account) => account.username && normalizeKey(account.username) !== currentKey)
      .filter((account, index, list) => list.findIndex((item) => normalizeKey(item.username) === normalizeKey(account.username)) === index);

    elements.directList.innerHTML = '';

    if (!uniqueAccounts.length) {
      const empty = document.createElement('div');
      empty.className = 'chat-empty chat-direct-empty';
      empty.textContent = 'Admin lain belum tersedia.';
      elements.directList.appendChild(empty);
      return;
    }

    uniqueAccounts.forEach((account) => {
      const button = document.createElement('button');
      button.className = `chat-room${getDirectRoomId(account.username) === state.roomId ? ' is-active' : ''}`;
      button.type = 'button';
      button.dataset.roomId = getDirectRoomId(account.username);
      button.dataset.roomTitle = account.username;
      button.dataset.roomLabel = 'Chat langsung';
      button.dataset.targetUsername = account.username;
      button.innerHTML = `<strong>${escapeHtml(account.username)}</strong><small>Chat langsung</small>`;
      button.addEventListener('click', () => activateRoomFromButton(button));
      elements.directList.appendChild(button);
    });
  }

  function getKnownAdminAccounts() {
    const localAccounts = typeof window.loadAdminAccounts === 'function'
      ? window.loadAdminAccounts()
      : parseLocalAccounts();
    const accounts = Array.isArray(localAccounts) ? localAccounts : [];

    if (!accounts.some((account) => normalizeKey(account.username) === normalizeKey(currentAdmin.username))) {
      accounts.unshift({ username: currentAdmin.username });
    }

    return accounts;
  }

  function parseLocalAccounts() {
    try {
      const parsed = JSON.parse(localStorage.getItem('catsoftAdminAccounts') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function activateRoomFromButton(button) {
    state.roomId = button.dataset.roomId || 'all';
    state.roomTitle = button.dataset.roomTitle || 'Semua Admin';
    state.roomLabel = button.dataset.roomLabel || (state.roomId === 'all' ? 'Ruang bersama' : 'Chat langsung');
    state.targetUsername = button.dataset.targetUsername || '';

    document.querySelectorAll('.chat-room').forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });

    elements.activeRoomTitle.textContent = state.roomTitle;
    elements.activeRoomLabel.textContent = state.roomLabel;
    loadMessages();
  }

  async function loadMessages(options = {}) {
    if (state.isLoading) {
      return;
    }

    state.isLoading = true;

    if (!options.silent) {
      setStatus('Memuat', false);
    }

    try {
      const url = new URL(apiEndpoint, window.location.href);
      url.searchParams.set('room', state.roomId);
      url.searchParams.set('limit', '150');
      const response = await fetch(url.toString(), { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Chat belum bisa dimuat.');
      }

      state.messages = Array.isArray(payload.messages) ? payload.messages : [];
      renderMessages();
      setStatus('Online', true);
    } catch (error) {
      if (!options.silent) {
        renderError(error.message || 'Chat belum bisa dimuat.');
      }
      setStatus('Offline', false);
    } finally {
      state.isLoading = false;
    }
  }

  async function sendMessage() {
    const messageText = elements.input.value.trim();

    if (!messageText) {
      elements.input.focus();
      return;
    }

    elements.input.disabled = true;

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: state.roomId,
          senderUsername: currentAdmin.username,
          targetUsername: state.targetUsername,
          messageText
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Pesan belum terkirim.');
      }

      elements.input.value = '';
      state.messages.push(payload.message);
      renderMessages({ jumpToBottom: true });
      setStatus('Online', true);
    } catch (error) {
      renderError(error.message || 'Pesan belum terkirim.');
      setStatus('Offline', false);
    } finally {
      elements.input.disabled = false;
      elements.input.focus();
    }
  }

  function renderMessages(options = {}) {
    elements.messages.innerHTML = '';
    elements.messageCount.textContent = `${state.messages.length} Pesan`;

    if (!state.messages.length) {
      const empty = document.createElement('div');
      empty.className = 'chat-empty';
      empty.textContent = state.roomId === 'all'
        ? 'Belum ada pesan di ruang bersama.'
        : 'Belum ada pesan dengan admin ini.';
      elements.messages.appendChild(empty);
      return;
    }

    state.messages.forEach((message) => {
      const article = document.createElement('article');
      const isOwn = normalizeKey(message.senderUsername) === normalizeKey(currentAdmin.username);
      article.className = `chat-message${isOwn ? ' is-own' : ''}`;

      const meta = document.createElement('div');
      meta.className = 'chat-message-meta';
      meta.innerHTML = `<span>${escapeHtml(message.senderUsername || 'Admin')}</span><time>${formatChatTime(message.createdAt)}</time>`;

      const text = document.createElement('div');
      text.className = 'chat-message-text';
      text.textContent = message.messageText || '';

      article.append(meta, text);
      elements.messages.appendChild(article);
    });

    if (options.jumpToBottom) {
      elements.messages.lastElementChild?.scrollIntoView({ block: 'nearest' });
    }
  }

  function renderError(message) {
    elements.messages.innerHTML = '';
    const error = document.createElement('div');
    error.className = 'chat-error';
    error.textContent = message;
    elements.messages.appendChild(error);
  }

  function setStatus(text, isOnline) {
    elements.status.textContent = text;
    elements.status.classList.toggle('is-online', Boolean(isOnline));
  }

  function getDirectRoomId(targetUsername) {
    return `dm:${[currentAdmin.username, targetUsername].map(normalizeKey).sort().join('__')}`;
  }

  function normalizeKey(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'admin';
  }

  function formatChatTime(value) {
    const date = value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
