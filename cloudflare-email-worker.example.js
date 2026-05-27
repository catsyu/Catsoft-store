const MAX_BODY_CHARS = 50000;
const DEFAULT_LIMIT = 80;
const MAX_LIMIT = 500;
const OFFICE_SELLER_PAGE_URL = 'https://lastorialicense.com/get-conf-catsyu/';
const OFFICE_SELLER_AJAX_URL = 'https://lastorialicense.com/wp-admin/admin-ajax.php';
const STATIC_ASSET_BASE_URL = 'https://raw.githubusercontent.com/catsyu/Catsoft-store/main';
const customerStatusValues = new Set(['active', 'expired', 'removed', 'refund', 'problem', 'incomplete']);
const customerImportBatchSize = 25;
const customerImportLookupSize = 50;
const customerBulkMutationSize = 100;
const customerProtectedStatuses = new Set(['removed', 'refund', 'problem']);

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

export default {
  async email(message, env) {
    console.log('Incoming email received', {
      from: message.from,
      to: message.to,
      rawSize: message.rawSize
    });

    try {
      await saveEmailMessage(message, env);
    } catch (error) {
      console.error('Failed to save incoming email to D1', {
        from: message.from,
        to: message.to,
        error: error.message
      });
    } finally {
      if (env.FORWARD_TO) {
        await message.forward(env.FORWARD_TO);
        console.log('Incoming email forwarded', {
          from: message.from,
          to: message.to,
          forwardTo: env.FORWARD_TO
        });
      } else {
        console.warn('FORWARD_TO is not set, incoming email was not forwarded', {
          from: message.from,
          to: message.to
        });
      }
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (!isAuthorized(request, env)) {
      return json({ error: 'Unauthorized' }, 401, request);
    }

    if (url.pathname === '/api/email-messages' && request.method === 'GET') {
      return listEmails(request, env);
    }

    if (url.pathname === '/api/email-messages/health' && request.method === 'GET') {
      return healthCheck(request, env);
    }

    if (url.pathname === '/api/admin-accounts' && request.method === 'GET') {
      return listAdminAccounts(request, env);
    }

    if (url.pathname === '/api/admin-accounts' && request.method === 'POST') {
      return saveAdminAccountsApi(request, env);
    }

    if (url.pathname === '/api/supplier-accounts' && request.method === 'GET') {
      return listSupplierAccounts(request, env);
    }

    if (url.pathname === '/api/supplier-accounts' && request.method === 'POST') {
      return saveSupplierAccountsApi(request, env);
    }

    if (url.pathname === '/api/customer-records' && request.method === 'GET') {
      return listCustomerRecords(request, env);
    }

    if (url.pathname === '/api/customer-records' && request.method === 'POST') {
      return upsertCustomerRecords(request, env);
    }

    if (url.pathname === '/api/customer-records/bulk-import' && request.method === 'POST') {
      return bulkImportCustomerRecords(request, env);
    }

    if (url.pathname === '/api/customer-records/bulk-status' && request.method === 'POST') {
      return bulkUpdateCustomerRecordStatus(request, env);
    }

    if (url.pathname === '/api/customer-records/bulk-delete' && request.method === 'POST') {
      return bulkDeleteCustomerRecords(request, env);
    }

    if (url.pathname === '/api/customer-records/health' && request.method === 'GET') {
      return customerRecordsHealthCheck(request, env);
    }

    if (url.pathname === '/api/office-confirmation' && request.method === 'POST') {
      return generateOfficeConfirmation(request, env);
    }

    const customerDetailMatch = url.pathname.match(/^\/api\/customer-records\/([^/]+)$/);
    const detailMatch = url.pathname.match(/^\/api\/email-messages\/([^/]+)$/);

    if (customerDetailMatch && request.method === 'PATCH') {
      return patchCustomerRecord(request, env, customerDetailMatch[1]);
    }

    if (customerDetailMatch && request.method === 'DELETE') {
      return deleteCustomerRecord(request, env, customerDetailMatch[1]);
    }

    if (detailMatch && request.method === 'GET') {
      return getEmail(request, env, detailMatch[1]);
    }

    if (detailMatch && request.method === 'PATCH') {
      return markEmailRead(request, env, detailMatch[1]);
    }

    if (detailMatch && request.method === 'DELETE') {
      return deleteEmailMessage(request, env, detailMatch[1]);
    }

    if (!url.pathname.startsWith('/api/')) {
      return serveStaticAsset(request, env);
    }

    return json({ error: 'Not found' }, 404, request);
  }
};

const staticRouteFallbacks = new Map([
  ['/tutorial/office', '/office-tutorial.html'],
  ['/tutorial/lutapplelog', '/tutorial-lut-apple-log.html'],
  ['/tutorial/lut-apple-log', '/tutorial-lut-apple-log.html'],
  ['/tutorial/aeassets', '/tutorial-after-effects-assets.html'],
  ['/tutorial/after-effects-assets', '/tutorial-after-effects-assets.html'],
  ['/tutorial/lightroompreset', '/tutorial-lightroom-preset.html'],
  ['/tutorial/lightroom-preset', '/tutorial-lightroom-preset.html'],
  ['/tutorial', '/tutorial.html'],
  ['/produk', '/index.html'],
  ['/order', '/index.html'],
  ['/keunggulan', '/index.html'],
  ['/testimoni', '/index.html'],
  ['/faq', '/index.html'],
  ['/kontak', '/index.html']
]);

async function serveStaticAsset(request, env) {
  const url = new URL(request.url);

  if (env.ASSETS) {
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404) {
      return response;
    }
  }

  const fallbackPath = getStaticFallbackPath(url.pathname) || url.pathname;

  if (env.ASSETS && fallbackPath !== url.pathname) {
    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = fallbackPath;
    fallbackUrl.search = url.search;

    const response = await env.ASSETS.fetch(new Request(fallbackUrl.toString(), request));

    if (response.status !== 404) {
      return response;
    }
  }

  return fetchGitHubStaticAsset(fallbackPath, url.search);
}

async function fetchGitHubStaticAsset(pathname, search = '') {
  const path = pathname.replace(/^\/+/, '') || 'index.html';
  const assetResponse = await fetch(`${STATIC_ASSET_BASE_URL}/${path}${search}`, {
    headers: {
      Accept: '*/*'
    }
  });

  if (!assetResponse.ok) {
    return new Response('Not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }

  return new Response(assetResponse.body, {
    status: 200,
    headers: {
      'Content-Type': getStaticContentType(path),
      'Cache-Control': 'public, max-age=300'
    }
  });
}

function getStaticFallbackPath(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/') {
    return '/index.html';
  }

  if (staticRouteFallbacks.has(normalizedPath)) {
    return staticRouteFallbacks.get(normalizedPath);
  }

  if (normalizedPath.startsWith('/produk/')) {
    return '/index.html';
  }

  if (!normalizedPath.includes('.')) {
    return `${normalizedPath}/index.html`;
  }

  return '';
}

function getStaticContentType(pathname) {
  const extension = pathname.split('.').pop().toLowerCase();
  const types = {
    css: 'text/css; charset=utf-8',
    html: 'text/html; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    json: 'application/json; charset=utf-8',
    png: 'image/png',
    svg: 'image/svg+xml',
    txt: 'text/plain; charset=utf-8',
    webp: 'image/webp'
  };

  return types[extension] || 'application/octet-stream';
}

async function saveEmailMessage(message, env) {
  if (!env.EMAIL_DB) {
    throw new Error('Missing EMAIL_DB D1 binding');
  }

  const id = crypto.randomUUID();
  const rawContent = await readEmailStream(message.raw);
  const subject = decodeMimeHeader(message.headers.get('subject') || '(Tanpa subject)');
  const textBody = extractMimePart(rawContent, 'text/plain');
  const htmlBody = extractMimePart(rawContent, 'text/html');
  const readableBody = getReadableEmailBody(textBody, htmlBody, rawContent);
  const category = categorizeEmail({
    sender: message.from,
    recipient: message.to,
    subject,
    body: readableBody
  });
  const otpCode = extractOtp(`${subject}\n${readableBody}`);
  const receivedAt = new Date().toISOString();
  const snippet = compactText(readableBody).slice(0, 220);

  try {
    await insertFullEmail(env, {
      id,
      sender: message.from,
      recipient: message.to,
      subject,
      category,
      receivedAt,
      size: message.rawSize || rawContent.length,
      snippet,
      textBody: textBody.slice(0, MAX_BODY_CHARS),
      htmlBody: htmlBody.slice(0, MAX_BODY_CHARS),
      rawContent: rawContent.slice(0, MAX_BODY_CHARS),
      otpCode
    });
  } catch (error) {
    console.error('Full email insert failed, retrying minimal insert', {
      id,
      error: error.message
    });

    try {
      await insertMinimalEmail(env, {
        id,
        sender: message.from,
        recipient: message.to,
        subject,
        category,
        receivedAt,
        size: message.rawSize || rawContent.length,
        snippet,
        otpCode
      });
    } catch (minimalError) {
      console.error('Minimal email insert failed, retrying core insert', {
        id,
        error: minimalError.message
      });

      await insertCoreEmail(env, {
        id,
        sender: message.from,
        recipient: message.to,
        receivedAt
      });
    }
  }

  console.log('Incoming email saved', {
    id,
    from: message.from,
    to: message.to,
    subject,
    category
  });
}

async function insertFullEmail(env, email) {
  await env.EMAIL_DB.prepare(`
    INSERT INTO email_messages (
      id, sender, recipient, subject, category, received_at, size,
      snippet, text_body, html_body, raw_content, otp_code
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    email.id,
    email.sender,
    email.recipient,
    email.subject,
    email.category,
    email.receivedAt,
    email.size,
    email.snippet,
    email.textBody,
    email.htmlBody,
    email.rawContent,
    email.otpCode
  ).run();
}

async function insertMinimalEmail(env, email) {
  await env.EMAIL_DB.prepare(`
    INSERT INTO email_messages (
      id, sender, recipient, subject, category, received_at, size, snippet, otp_code
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    email.id,
    email.sender,
    email.recipient,
    email.subject,
    email.category,
    email.receivedAt,
    email.size,
    email.snippet,
    email.otpCode
  ).run();
}

async function insertCoreEmail(env, email) {
  await env.EMAIL_DB.prepare(`
    INSERT INTO email_messages (id, sender, recipient, received_at)
    VALUES (?, ?, ?, ?)
  `).bind(
    email.id,
    email.sender,
    email.recipient,
    email.receivedAt
  ).run();
}

async function ensureEmailMaintenanceColumns(emailDb) {
  const columns = await emailDb.prepare('PRAGMA table_info(email_messages)').all();
  const columnNames = new Set((columns.results || []).map((column) => column.name));

  if (!columnNames.has('deleted_at')) {
    try {
      await emailDb.prepare('ALTER TABLE email_messages ADD COLUMN deleted_at TEXT').run();
    } catch (error) {
      if (!/duplicate column|already exists/i.test(error.message || '')) {
        throw error;
      }
    }
  }

  await emailDb.prepare(`
    CREATE INDEX IF NOT EXISTS idx_email_messages_deleted_at
    ON email_messages (deleted_at)
  `).run();
}

async function listEmails(request, env) {
  if (!env.EMAIL_DB) {
    return json({ error: 'Missing EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureEmailMaintenanceColumns(env.EMAIL_DB);

  const url = new URL(request.url);
  const where = [];
  const params = [];
  const recipient = normalizeSearch(url.searchParams.get('to') || url.searchParams.get('recipient'));
  const category = normalizeSearch(url.searchParams.get('category'));
  const status = normalizeSearch(url.searchParams.get('status'));
  const query = normalizeSearch(url.searchParams.get('q') || url.searchParams.get('search'));
  const limit = clampNumber(url.searchParams.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = clampNumber(url.searchParams.get('offset'), 0, 0, 10000);

  if (recipient) {
    if (recipient.includes('@')) {
      where.push('LOWER(recipient) = ?');
      params.push(recipient);
    } else {
      where.push('LOWER(recipient) LIKE ?');
      params.push(`%${recipient}%`);
    }
  }

  if (category && category !== 'all') {
    where.push('category = ?');
    params.push(category);
  }

  if (status === 'unread') {
    where.push('read_at IS NULL');
  } else if (status === 'read') {
    where.push('read_at IS NOT NULL');
  }

  where.push('deleted_at IS NULL');

  if (query) {
    where.push('(LOWER(sender) LIKE ? OR LOWER(recipient) LIKE ? OR LOWER(subject) LIKE ? OR LOWER(snippet) LIKE ?)');
    params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const result = await env.EMAIL_DB.prepare(`
    SELECT id, sender, recipient, subject, category, received_at, size, snippet, otp_code, read_at
    FROM email_messages
    ${whereSql}
    ORDER BY received_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  return json({
    emails: (result.results || []).map((row) => ({
      id: row.id,
      from: row.sender,
      to: row.recipient,
      subject: row.subject,
      category: row.category,
      receivedAt: row.received_at,
      size: row.size,
      snippet: getReadableEmailSnippet(row.snippet, row.subject, row.category),
      otpCode: row.otp_code,
      readAt: row.read_at
    }))
  }, 200, request);
}

async function healthCheck(request, env) {
  if (!env.EMAIL_DB) {
    return json({
      ok: false,
      error: 'Missing EMAIL_DB D1 binding'
    }, 500, request);
  }

  try {
    await ensureEmailMaintenanceColumns(env.EMAIL_DB);
    const row = await env.EMAIL_DB.prepare('SELECT COUNT(*) AS total FROM email_messages').first();
    const columns = await env.EMAIL_DB.prepare('PRAGMA table_info(email_messages)').all();

    return json({
      ok: true,
      database: 'connected',
      total: row ? row.total : 0,
      columns: (columns.results || []).map((column) => column.name)
    }, 200, request);
  } catch (error) {
    return json({
      ok: false,
      error: error.message
    }, 500, request);
  }
}

async function getEmail(request, env, id) {
  if (!env.EMAIL_DB) {
    return json({ error: 'Missing EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureEmailMaintenanceColumns(env.EMAIL_DB);

  const row = await env.EMAIL_DB.prepare(`
    SELECT id, sender, recipient, subject, category, received_at, size,
      snippet, text_body, html_body, raw_content, otp_code, read_at
    FROM email_messages
    WHERE id = ? AND deleted_at IS NULL
  `).bind(id).first();

  if (!row) {
    return json({ error: 'Email not found' }, 404, request);
  }

  return json({
    id: row.id,
    from: row.sender,
    to: row.recipient,
    subject: row.subject,
    category: row.category,
    receivedAt: row.received_at,
    size: row.size,
    snippet: getReadableEmailSnippet(row.snippet, row.subject, row.category),
    textBody: getReadableEmailBody(row.text_body, row.html_body, row.raw_content),
    htmlBody: row.html_body,
    rawContent: row.raw_content,
    otpCode: row.otp_code,
    readAt: row.read_at
  }, 200, request);
}

async function markEmailRead(request, env, id) {
  if (!env.EMAIL_DB) {
    return json({ error: 'Missing EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureEmailMaintenanceColumns(env.EMAIL_DB);

  const payload = await readJson(request).catch(() => ({}));
  const shouldRead = payload.read !== false;

  await env.EMAIL_DB.prepare(`
    UPDATE email_messages
    SET read_at = ?
    WHERE id = ?
  `).bind(shouldRead ? new Date().toISOString() : null, id).run();

  return json({ ok: true }, 200, request);
}

async function deleteEmailMessage(request, env, id) {
  if (!env.EMAIL_DB) {
    return json({ error: 'Missing EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureEmailMaintenanceColumns(env.EMAIL_DB);

  await env.EMAIL_DB.prepare(`
    UPDATE email_messages
    SET deleted_at = COALESCE(deleted_at, ?)
    WHERE id = ?
  `).bind(new Date().toISOString(), id).run();

  return json({ ok: true }, 200, request);
}

function getAdminDb(env) {
  return env.ADMIN_DB || env.CUSTOMER_DB || env.EMAIL_DB;
}

async function ensureAdminAccountsTable(adminDb) {
  await adminDb.prepare(`
    CREATE TABLE IF NOT EXISTS admin_accounts (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      tools TEXT NOT NULL DEFAULT '[]',
      inbox_access_all INTEGER NOT NULL DEFAULT 0,
      inbox_rules TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  await adminDb.prepare(`
    CREATE INDEX IF NOT EXISTS idx_admin_accounts_updated_at
    ON admin_accounts (updated_at DESC)
  `).run();
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function mapAdminAccountRow(row) {
  return {
    username: row.username,
    password: row.password,
    tools: parseJsonArray(row.tools),
    inboxAccessAll: Boolean(row.inbox_access_all),
    inboxRules: parseJsonArray(row.inbox_rules),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function addColumnIfMissing(db, tableName, columnName, definition) {
  const columns = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  const columnNames = new Set((columns.results || []).map((column) => column.name));

  if (columnNames.has(columnName)) {
    return;
  }

  try {
    await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  } catch (error) {
    if (!/duplicate column|already exists/i.test(error.message || '')) {
      throw error;
    }
  }
}

async function ensureSupplierAccountsTable(adminDb) {
  await adminDb.prepare(`
    CREATE TABLE IF NOT EXISTS supplier_accounts (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      tools TEXT NOT NULL DEFAULT '[]',
      allowed_domains TEXT NOT NULL DEFAULT '["catsoft.store","catsoft.digital","catsoft.online"]',
      inbox_access_all INTEGER NOT NULL DEFAULT 0,
      inbox_rules TEXT NOT NULL DEFAULT '[]',
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  await adminDb.prepare(`
    CREATE INDEX IF NOT EXISTS idx_supplier_accounts_updated_at
    ON supplier_accounts (updated_at DESC)
  `).run();

  await addColumnIfMissing(
    adminDb,
    'supplier_accounts',
    'allowed_domains',
    'TEXT NOT NULL DEFAULT \'["catsoft.store","catsoft.digital","catsoft.online"]\''
  );
}

function mapSupplierAccountRow(row) {
  return {
    username: row.username,
    password: row.password,
    tools: parseJsonArray(row.tools),
    allowedDomains: parseJsonArray(row.allowed_domains),
    inboxAccessAll: Boolean(row.inbox_access_all),
    inboxRules: parseJsonArray(row.inbox_rules),
    createdBy: row.created_by || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function listAdminAccounts(request, env) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureAdminAccountsTable(adminDb);

  const result = await adminDb.prepare(`
    SELECT username, password, tools, inbox_access_all, inbox_rules, created_at, updated_at
    FROM admin_accounts
    ORDER BY updated_at DESC
  `).all();

  return json({
    accounts: (result.results || []).map(mapAdminAccountRow)
  }, 200, request);
}

async function saveAdminAccountsApi(request, env) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureAdminAccountsTable(adminDb);

  const payload = await readJson(request);
  const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
  const now = new Date().toISOString();

  const existing = await adminDb.prepare('SELECT username FROM admin_accounts').all();
  const incomingNames = new Set(accounts.map((account) => normalizeSearch(account.username)).filter(Boolean));
  const statements = [];

  accounts.forEach((account) => {
    const username = String(account.username || '').trim();
    const password = String(account.password || '');

    if (!username || !password) {
      return;
    }

    statements.push(adminDb.prepare(`
      INSERT INTO admin_accounts (
        username, password, tools, inbox_access_all, inbox_rules, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        password = excluded.password,
        tools = excluded.tools,
        inbox_access_all = excluded.inbox_access_all,
        inbox_rules = excluded.inbox_rules,
        updated_at = excluded.updated_at
    `).bind(
      username,
      password,
      JSON.stringify(Array.isArray(account.tools) ? account.tools : []),
      account.inboxAccessAll ? 1 : 0,
      JSON.stringify(Array.isArray(account.inboxRules) ? account.inboxRules : []),
      account.createdAt || now,
      account.updatedAt || now
    ));
  });

  (existing.results || []).forEach((row) => {
    if (!incomingNames.has(normalizeSearch(row.username))) {
      statements.push(adminDb.prepare('DELETE FROM admin_accounts WHERE username = ?').bind(row.username));
    }
  });

  if (statements.length) {
    await adminDb.batch(statements);
  }

  return json({ ok: true, accounts: accounts.length }, 200, request);
}

async function listSupplierAccounts(request, env) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureSupplierAccountsTable(adminDb);

  const result = await adminDb.prepare(`
    SELECT username, password, tools, allowed_domains, inbox_access_all, inbox_rules, created_by, created_at, updated_at
    FROM supplier_accounts
    ORDER BY updated_at DESC
  `).all();

  return json({
    accounts: (result.results || []).map(mapSupplierAccountRow)
  }, 200, request);
}

async function saveSupplierAccountsApi(request, env) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureSupplierAccountsTable(adminDb);

  const payload = await readJson(request);
  const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
  const now = new Date().toISOString();

  const existing = await adminDb.prepare('SELECT username FROM supplier_accounts').all();
  const incomingNames = new Set(accounts.map((account) => normalizeSearch(account.username)).filter(Boolean));
  const statements = [];

  accounts.forEach((account) => {
    const username = String(account.username || '').trim();
    const password = String(account.password || '');

    if (!username || !password) {
      return;
    }

    statements.push(adminDb.prepare(`
      INSERT INTO supplier_accounts (
        username, password, tools, allowed_domains, inbox_access_all, inbox_rules, created_by, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        password = excluded.password,
        tools = excluded.tools,
        allowed_domains = excluded.allowed_domains,
        inbox_access_all = excluded.inbox_access_all,
        inbox_rules = excluded.inbox_rules,
        created_by = excluded.created_by,
        updated_at = excluded.updated_at
    `).bind(
      username,
      password,
      JSON.stringify(Array.isArray(account.tools) ? account.tools : []),
      JSON.stringify(Array.isArray(account.allowedDomains) ? account.allowedDomains : ['catsoft.store', 'catsoft.digital', 'catsoft.online']),
      account.inboxAccessAll ? 1 : 0,
      JSON.stringify(Array.isArray(account.inboxRules) ? account.inboxRules : []),
      String(account.createdBy || ''),
      account.createdAt || now,
      account.updatedAt || now
    ));
  });

  (existing.results || []).forEach((row) => {
    if (!incomingNames.has(normalizeSearch(row.username))) {
      statements.push(adminDb.prepare('DELETE FROM supplier_accounts WHERE username = ?').bind(row.username));
    }
  });

  if (statements.length) {
    await adminDb.batch(statements);
  }

  return json({ ok: true, accounts: accounts.length }, 200, request);
}

async function listCustomerRecords(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  const url = new URL(request.url);
  const limit = clampNumber(url.searchParams.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = clampNumber(url.searchParams.get('offset'), 0, 0, 10000);
  const result = await customerDb.prepare(`
    SELECT id, customer_name, activated_email, whatsapp_number, order_number,
      order_source, product_name, duration_days, start_date, expiry_date,
      status, notes, created_at, updated_at
    FROM customer_records
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  return json({
    records: (result.results || []).map(mapCustomerRecordRow)
  }, 200, request);
}

async function customerRecordsHealthCheck(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({
      ok: false,
      error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding'
    }, 500, request);
  }

  try {
    const row = await customerDb.prepare('SELECT COUNT(*) AS total FROM customer_records').first();
    const columns = await customerDb.prepare('PRAGMA table_info(customer_records)').all();

    return json({
      ok: true,
      database: 'connected',
      total: row ? row.total : 0,
      columns: (columns.results || []).map((column) => column.name)
    }, 200, request);
  } catch (error) {
    return json({
      ok: false,
      error: error.message
    }, 500, request);
  }
}

async function upsertCustomerRecords(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  let payload = {};

  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Body request harus JSON.' }, 400, request);
  }

  const inputRecords = Array.isArray(payload.records) ? payload.records : (Array.isArray(payload) ? payload : [payload]);
  const records = inputRecords.map(normalizeCustomerRecord).filter(Boolean);
  const batchConflict = findCustomerRecordBatchConflict(records);

  if (batchConflict) {
    return customerRecordConflictResponse(batchConflict, request);
  }

  for (const record of records) {
    const conflict = await findCustomerRecordConflict(customerDb, record);

    if (conflict) {
      return customerRecordConflictResponse(conflict, request);
    }

    await saveCustomerRecord(customerDb, record);
  }

  return json({
    ok: true,
    total: records.length,
    records
  }, 200, request);
}

async function bulkImportCustomerRecords(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  let payload = {};

  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Body request harus JSON.' }, 400, request);
  }

  const inputRecords = Array.isArray(payload.records) ? payload.records : (Array.isArray(payload) ? payload : []);
  const records = inputRecords.map(normalizeCustomerRecord).filter(Boolean);
  const batchConflict = findCustomerRecordBatchConflict(records);

  if (batchConflict) {
    return customerRecordConflictResponse(batchConflict, request);
  }

  const mergedRecords = await mergeCustomerImportRecords(customerDb, records);
  const existingConflict = await findCustomerRecordBulkConflict(customerDb, mergedRecords);

  if (existingConflict) {
    return customerRecordConflictResponse(existingConflict, request);
  }

  await saveCustomerRecordsBatch(customerDb, mergedRecords);

  return json({
    ok: true,
    mode: 'bulk-import',
    total: mergedRecords.length
  }, 200, request);
}

async function bulkUpdateCustomerRecordStatus(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  let payload = {};

  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Body request harus JSON.' }, 400, request);
  }

  const status = cleanValue(payload.status, 40).toLowerCase();
  const ids = uniqueValues((Array.isArray(payload.ids) ? payload.ids : [])
    .map((id) => cleanValue(id, 120))
    .filter(Boolean));
  const updatedAt = cleanValue(payload.updatedAt || payload.updated_at, 80) || new Date().toISOString();

  if (!customerStatusValues.has(status) || status === 'incomplete') {
    return json({ ok: false, error: 'Status bulk tidak valid.' }, 400, request);
  }

  if (!ids.length) {
    return json({ ok: false, error: 'Tidak ada data yang dipilih.' }, 400, request);
  }

  const updated = await updateCustomerRecordsStatusBatch(customerDb, ids, status, updatedAt);

  return json({
    ok: true,
    total: ids.length,
    updated,
    status,
    updatedAt
  }, 200, request);
}

async function bulkDeleteCustomerRecords(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  let payload = {};

  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Body request harus JSON.' }, 400, request);
  }

  const ids = uniqueValues((Array.isArray(payload.ids) ? payload.ids : [])
    .map((id) => cleanValue(id, 120))
    .filter(Boolean));

  if (!ids.length) {
    return json({ ok: false, error: 'Tidak ada data yang dipilih.' }, 400, request);
  }

  const deleted = await deleteCustomerRecordsBatch(customerDb, ids);

  return json({
    ok: true,
    total: ids.length,
    deleted
  }, 200, request);
}

async function patchCustomerRecord(request, env, id) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  let payload = {};

  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Body request harus JSON.' }, 400, request);
  }

  const existingRow = await customerDb.prepare(`
    SELECT id, customer_name, activated_email, whatsapp_number, order_number,
      order_source, product_name, duration_days, start_date, expiry_date,
      status, notes, created_at, updated_at
    FROM customer_records
    WHERE id = ?
  `).bind(id).first();

  if (!existingRow) {
    return json({ error: 'Customer record not found' }, 404, request);
  }

  const record = normalizeCustomerRecord({
    ...mapCustomerRecordRow(existingRow),
    ...payload,
    id
  });
  const conflict = await findCustomerRecordConflict(customerDb, record);

  if (conflict) {
    return customerRecordConflictResponse(conflict, request);
  }

  await saveCustomerRecord(customerDb, record);

  return json({ ok: true, record }, 200, request);
}

async function deleteCustomerRecord(request, env, id) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await customerDb.prepare('DELETE FROM customer_records WHERE id = ?').bind(id).run();

  return json({ ok: true }, 200, request);
}

function getCustomerDb(env) {
  return env.CUSTOMER_DB || env.EMAIL_DB;
}

function findCustomerRecordBatchConflict(records) {
  const emailRecords = new Map();
  const orderNumbers = new Map();

  for (const record of records) {
    const email = normalizeCustomerUniqueEmail(record.activatedEmail);
    const orderNumber = normalizeCustomerUniqueOrderNumber(record.orderNumber);

    if (orderNumber) {
      const existingRecord = orderNumbers.get(orderNumber);

      if (existingRecord && existingRecord.id !== record.id) {
        return {
          field: 'orderNumber',
          value: record.orderNumber,
          existingRecord
        };
      }

      orderNumbers.set(orderNumber, record);
    }

    if (email && shouldCheckCustomerActivationEmailDuplicate(record)) {
      const matchingRecords = emailRecords.get(email) || [];
      const existingRecord = matchingRecords.find((matchingRecord) => {
        return matchingRecord.id !== record.id && shouldBlockCustomerActivationEmailDuplicate(record, matchingRecord);
      });

      if (existingRecord) {
        return {
          field: 'activatedEmail',
          value: record.activatedEmail,
          existingRecord
        };
      }

      matchingRecords.push(record);
      emailRecords.set(email, matchingRecords);
    }
  }

  return null;
}

async function findCustomerRecordConflict(customerDb, record) {
  const email = normalizeCustomerUniqueEmail(record.activatedEmail);
  const orderNumber = normalizeCustomerUniqueOrderNumber(record.orderNumber);

  if (orderNumber) {
    const orderRow = await customerDb.prepare(`
    SELECT id, customer_name, activated_email, whatsapp_number, order_number,
      order_source, product_name, duration_days, start_date, expiry_date,
      status, notes, created_at, updated_at
    FROM customer_records
    WHERE id <> ? AND LOWER(order_number) = ?
    LIMIT 1
  `).bind(record.id, orderNumber).first();

    if (orderRow) {
      return {
        field: 'orderNumber',
        value: record.orderNumber,
        existingRecord: mapCustomerRecordRow(orderRow)
      };
    }
  }

  if (!email || !shouldCheckCustomerActivationEmailDuplicate(record)) {
    return null;
  }

  const emailRows = await customerDb.prepare(`
    SELECT id, customer_name, activated_email, whatsapp_number, order_number,
      order_source, product_name, duration_days, start_date, expiry_date,
      status, notes, created_at, updated_at
    FROM customer_records
    WHERE id <> ? AND LOWER(activated_email) = ?
  `).bind(record.id, email).all();

  for (const row of emailRows.results || []) {
    const existingRecord = mapCustomerRecordRow(row);

    if (shouldBlockCustomerActivationEmailDuplicate(record, existingRecord)) {
      return {
        field: 'activatedEmail',
        value: record.activatedEmail,
        existingRecord
      };
    }
  }

  return null;
}

function customerRecordConflictResponse(conflict, request) {
  const label = conflict.field === 'activatedEmail' ? 'Email aktivasi' : 'Nomor pesanan';
  const message = conflict.field === 'activatedEmail' ?
    `${label} ${conflict.value} sudah dipakai pada periode langganan yang bentrok.` :
    `${label} ${conflict.value} sudah ada di database.`;

  return json({
    ok: false,
    error: message,
    field: conflict.field,
    existingId: conflict.existingRecord ? conflict.existingRecord.id : ''
  }, 409, request);
}

async function mergeCustomerImportRecords(customerDb, records) {
  if (!records.length) {
    return [];
  }

  const orderNumbers = uniqueValues(records.map((record) => normalizeCustomerUniqueOrderNumber(record.orderNumber)).filter(Boolean));
  const existingByOrder = await getCustomerRecordsByOrderNumbers(customerDb, orderNumbers);

  return records.map((record) => {
    const existingRecord = existingByOrder.get(normalizeCustomerUniqueOrderNumber(record.orderNumber));

    if (!existingRecord) {
      return record;
    }

    return {
      ...record,
      id: existingRecord.id || record.id,
      customerName: record.customerName || existingRecord.customerName,
      activatedEmail: record.activatedEmail || existingRecord.activatedEmail,
      whatsappNumber: record.whatsappNumber || existingRecord.whatsappNumber,
      status: customerProtectedStatuses.has(existingRecord.status) ? existingRecord.status : record.status,
      notes: record.notes || existingRecord.notes,
      createdAt: existingRecord.createdAt || record.createdAt
    };
  });
}

async function findCustomerRecordBulkConflict(customerDb, records) {
  const recordsByEmail = new Map();
  const orderRecords = new Map();

  records.forEach((record) => {
    const email = normalizeCustomerUniqueEmail(record.activatedEmail);
    const orderNumber = normalizeCustomerUniqueOrderNumber(record.orderNumber);

    if (email && shouldCheckCustomerActivationEmailDuplicate(record)) {
      const matchingRecords = recordsByEmail.get(email) || [];
      matchingRecords.push(record);
      recordsByEmail.set(email, matchingRecords);
    }

    if (orderNumber) {
      orderRecords.set(orderNumber, record);
    }
  });

  const orderConflict = await findCustomerRecordBulkConflictByField(customerDb, 'order_number', orderRecords, 'orderNumber');

  if (orderConflict) {
    return orderConflict;
  }

  return findCustomerRecordBulkEmailConflict(customerDb, recordsByEmail);
}

async function findCustomerRecordBulkConflictByField(customerDb, columnName, recordMap, field) {
  const values = [...recordMap.keys()];

  for (const chunk of chunkArray(values, customerImportLookupSize)) {
    const placeholders = chunk.map(() => '?').join(', ');
    const result = await customerDb.prepare(`
      SELECT id, activated_email, order_number
      FROM customer_records
      WHERE LOWER(${columnName}) IN (${placeholders})
    `).bind(...chunk).all();

    for (const row of result.results || []) {
      const value = field === 'activatedEmail' ?
        normalizeCustomerUniqueEmail(row.activated_email) :
        normalizeCustomerUniqueOrderNumber(row.order_number);
      const record = recordMap.get(value);

      if (record && row.id !== record.id) {
        return {
          field,
          value: field === 'activatedEmail' ? record.activatedEmail : record.orderNumber,
          existingRecord: mapCustomerRecordRow(row)
        };
      }
    }
  }

  return null;
}

async function findCustomerRecordBulkEmailConflict(customerDb, recordsByEmail) {
  const values = [...recordsByEmail.keys()];

  for (const chunk of chunkArray(values, customerImportLookupSize)) {
    const placeholders = chunk.map(() => '?').join(', ');
    const result = await customerDb.prepare(`
      SELECT id, customer_name, activated_email, whatsapp_number, order_number,
        order_source, product_name, duration_days, start_date, expiry_date,
        status, notes, created_at, updated_at
      FROM customer_records
      WHERE LOWER(activated_email) IN (${placeholders})
    `).bind(...chunk).all();

    for (const row of result.results || []) {
      const existingRecord = mapCustomerRecordRow(row);
      const email = normalizeCustomerUniqueEmail(existingRecord.activatedEmail);
      const matchingRecords = recordsByEmail.get(email) || [];
      const conflictingRecord = matchingRecords.find((record) => {
        return row.id !== record.id && shouldBlockCustomerActivationEmailDuplicate(record, existingRecord);
      });

      if (conflictingRecord) {
        return {
          field: 'activatedEmail',
          value: conflictingRecord.activatedEmail,
          existingRecord
        };
      }
    }
  }

  return null;
}

async function getCustomerRecordsByOrderNumbers(customerDb, orderNumbers) {
  const rowsByOrder = new Map();

  for (const chunk of chunkArray(orderNumbers, customerImportLookupSize)) {
    const placeholders = chunk.map(() => '?').join(', ');
    const result = await customerDb.prepare(`
      SELECT id, customer_name, activated_email, whatsapp_number, order_number,
        order_source, product_name, duration_days, start_date, expiry_date,
        status, notes, created_at, updated_at
      FROM customer_records
      WHERE LOWER(order_number) IN (${placeholders})
    `).bind(...chunk).all();

    for (const row of result.results || []) {
      rowsByOrder.set(normalizeCustomerUniqueOrderNumber(row.order_number), mapCustomerRecordRow(row));
    }
  }

  return rowsByOrder;
}

function mapCustomerRecordRow(row) {
  return {
    id: row.id,
    customerName: row.customer_name || '',
    activatedEmail: row.activated_email || '',
    whatsappNumber: row.whatsapp_number || '',
    orderNumber: row.order_number || '',
    orderSource: row.order_source || (row.whatsapp_number ? 'whatsapp' : 'shopee'),
    productName: normalizeCustomerProductName(row.product_name),
    durationDays: row.duration_days || 30,
    startDate: row.start_date || '',
    expiryDate: row.expiry_date || '',
    status: row.status || 'active',
    notes: row.notes || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || row.created_at || ''
  };
}

function normalizeCustomerRecord(record) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const now = new Date().toISOString();
  const status = cleanValue(record.status).toLowerCase();
  const rawOrderSource = cleanValue(record.orderSource || record.order_source).toLowerCase();
  const hasWhatsappReference = Boolean(record.whatsappNumber || record.whatsapp_number);
  const hasOrderReference = Boolean(record.orderNumber || record.order_number);
  const orderSource = rawOrderSource === 'whatsapp' || (!rawOrderSource && hasWhatsappReference && !hasOrderReference) ? 'whatsapp' : 'shopee';

  return {
    id: cleanValue(record.id, 120) || crypto.randomUUID(),
    customerName: cleanValue(record.customerName ?? record.customer_name, 240),
    activatedEmail: cleanValue(record.activatedEmail ?? record.activated_email, 240),
    whatsappNumber: cleanValue(record.whatsappNumber ?? record.whatsapp_number, 80),
    orderNumber: cleanValue(record.orderNumber ?? record.order_number, 120),
    orderSource,
    productName: normalizeCustomerProductName(record.productName ?? record.product_name),
    durationDays: clampNumber(record.durationDays ?? record.duration_days, 30, 1, 3650),
    startDate: cleanDate(record.startDate ?? record.start_date),
    expiryDate: cleanDate(record.expiryDate ?? record.expiry_date),
    status: customerStatusValues.has(status) ? status : 'active',
    notes: cleanValue(record.notes, 2000),
    createdAt: cleanValue(record.createdAt ?? record.created_at, 80) || now,
    updatedAt: cleanValue(record.updatedAt ?? record.updated_at, 80) || now
  };
}

async function saveCustomerRecord(customerDb, record) {
  await customerDb.prepare(`
    INSERT INTO customer_records (
      id, customer_name, activated_email, whatsapp_number, order_number,
      order_source, product_name, duration_days, start_date, expiry_date,
      status, notes, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      customer_name = excluded.customer_name,
      activated_email = excluded.activated_email,
      whatsapp_number = excluded.whatsapp_number,
      order_number = excluded.order_number,
      order_source = excluded.order_source,
      product_name = excluded.product_name,
      duration_days = excluded.duration_days,
      start_date = excluded.start_date,
      expiry_date = excluded.expiry_date,
      status = excluded.status,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `).bind(
    record.id,
    record.customerName,
    record.activatedEmail,
    record.whatsappNumber,
    record.orderNumber,
    record.orderSource,
    record.productName,
    record.durationDays,
    record.startDate,
    record.expiryDate,
    record.status,
    record.notes,
    record.createdAt,
    record.updatedAt
  ).run();
}

async function saveCustomerRecordsBatch(customerDb, records) {
  if (!records.length) {
    return;
  }

  const statement = customerDb.prepare(`
    INSERT INTO customer_records (
      id, customer_name, activated_email, whatsapp_number, order_number,
      order_source, product_name, duration_days, start_date, expiry_date,
      status, notes, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      customer_name = excluded.customer_name,
      activated_email = excluded.activated_email,
      whatsapp_number = excluded.whatsapp_number,
      order_number = excluded.order_number,
      order_source = excluded.order_source,
      product_name = excluded.product_name,
      duration_days = excluded.duration_days,
      start_date = excluded.start_date,
      expiry_date = excluded.expiry_date,
      status = excluded.status,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `);

  for (const chunk of chunkArray(records, customerImportBatchSize)) {
    await customerDb.batch(chunk.map((record) => statement.bind(
      record.id,
      record.customerName,
      record.activatedEmail,
      record.whatsappNumber,
      record.orderNumber,
      record.orderSource,
      record.productName,
      record.durationDays,
      record.startDate,
      record.expiryDate,
      record.status,
      record.notes,
      record.createdAt,
      record.updatedAt
    )));
  }
}

async function updateCustomerRecordsStatusBatch(customerDb, ids, status, updatedAt) {
  let updated = 0;

  for (const chunk of chunkArray(ids, customerBulkMutationSize)) {
    const placeholders = chunk.map(() => '?').join(', ');
    const result = await customerDb.prepare(`
      UPDATE customer_records
      SET status = ?, updated_at = ?
      WHERE id IN (${placeholders})
    `).bind(status, updatedAt, ...chunk).run();

    updated += result && result.meta && Number.isFinite(result.meta.changes) ? result.meta.changes : 0;
  }

  return updated;
}

async function deleteCustomerRecordsBatch(customerDb, ids) {
  let deleted = 0;

  for (const chunk of chunkArray(ids, customerBulkMutationSize)) {
    const placeholders = chunk.map(() => '?').join(', ');
    const result = await customerDb.prepare(`
      DELETE FROM customer_records
      WHERE id IN (${placeholders})
    `).bind(...chunk).run();

    deleted += result && result.meta && Number.isFinite(result.meta.changes) ? result.meta.changes : 0;
  }

  return deleted;
}

function cleanValue(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength);
}

function uniqueValues(values) {
  return [...new Set(values)];
}

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function normalizeCustomerProductName(value) {
  const productName = cleanValue(value, 240);
  const productType = getCustomerAiProductType(productName);

  if (!productName) {
    return '';
  }

  if (productType) {
    return 'ChatGPT';
  }

  return productName;
}

function getCustomerAiProductType(value) {
  const text = cleanValue(value, 240)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!text) {
    return '';
  }

  if (/chat\s*gpt|chatgpt|openai/.test(text)) {
    return 'chatgpt';
  }

  const hasVirtualAi = /\b(asisten|assistant)?\s*virtual\s*ai\b/.test(text) ||
    /\bvirtual\s*(asisten|assistant)?\s*ai\b/.test(text);
  const hasChatAi = /\bchat\s*(with|bot)?\b.*\b(ai|asisten virtual|assistant virtual|virtual ai)\b/.test(text) ||
    /\b(ai|asisten virtual|assistant virtual|virtual ai)\b.*\bchat\b/.test(text);

  if (hasChatAi) {
    return 'chat-ai';
  }

  if (hasVirtualAi) {
    return 'virtual-ai';
  }

  return '';
}

function isCustomerSharedActivationEmailProduct(record) {
  return Boolean(getCustomerAiProductType(record.productName || record.product_name));
}

function isCustomerTargetLinkProduct(record) {
  const text = cleanValue(record.productName || record.product_name, 240)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!text) {
    return false;
  }

  const hasSocialBrand = /\b(instagram|ig|reels|tiktok|youtube|shorts)\b/.test(text);
  const hasTargetService = /\b(view|views|viewer|like|likes|komen|komentar|comment|comments|follower|followers|follow|subscriber|subscribers|share|save)\b/.test(text);

  return hasSocialBrand || hasTargetService;
}

function shouldCheckCustomerActivationEmailDuplicate(record) {
  return Boolean(normalizeCustomerUniqueEmail(record.activatedEmail || record.activated_email)) &&
    !isCustomerSharedActivationEmailProduct(record) &&
    !isCustomerTargetLinkProduct(record);
}

function customerDateValue(value) {
  const date = new Date(`${cleanDate(value)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function doCustomerSubscriptionPeriodsOverlap(firstRecord, secondRecord) {
  const firstStart = customerDateValue(firstRecord.startDate || firstRecord.start_date);
  const firstExpiry = customerDateValue(firstRecord.expiryDate || firstRecord.expiry_date);
  const secondStart = customerDateValue(secondRecord.startDate || secondRecord.start_date);
  const secondExpiry = customerDateValue(secondRecord.expiryDate || secondRecord.expiry_date);

  if (firstStart === null || firstExpiry === null || secondStart === null || secondExpiry === null) {
    return true;
  }

  return firstStart < secondExpiry && secondStart < firstExpiry;
}

function shouldBlockCustomerActivationEmailDuplicate(firstRecord, secondRecord) {
  const firstEmail = normalizeCustomerUniqueEmail(firstRecord.activatedEmail || firstRecord.activated_email);
  const secondEmail = normalizeCustomerUniqueEmail(secondRecord.activatedEmail || secondRecord.activated_email);

  if (!firstEmail || firstEmail !== secondEmail) {
    return false;
  }

  if (!shouldCheckCustomerActivationEmailDuplicate(firstRecord) || !shouldCheckCustomerActivationEmailDuplicate(secondRecord)) {
    return false;
  }

  return doCustomerSubscriptionPeriodsOverlap(firstRecord, secondRecord);
}

function normalizeCustomerUniqueEmail(value) {
  return cleanValue(value, 240).toLowerCase();
}

function normalizeCustomerUniqueOrderNumber(value) {
  return cleanValue(value, 120).toLowerCase();
}

function cleanDate(value) {
  const text = cleanValue(value, 32);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : '';
}

async function generateOfficeConfirmation(request, env) {
  let payload = {};

  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Body request harus JSON.' }, 400, request);
  }

  const installationDigits = normalizeOfficeDigits(payload.installationId || payload.installation_id);

  if (installationDigits.length !== 63) {
    return json({
      ok: false,
      error: 'Installation ID harus 63 digit atau 9 grup angka.'
    }, 400, request);
  }

  try {
    const sellerConfig = await getOfficeSellerConfig(env);
    const sellerBody = new URLSearchParams({
      action: 'proxy_generate_cid',
      nonce: sellerConfig.nonce,
      installation_id: formatOfficeInstallationId(installationDigits),
      page_slug: sellerConfig.pageSlug
    });

    const sellerResponse = await fetch(OFFICE_SELLER_AJAX_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: sellerBody
    });

    const sellerText = await sellerResponse.text();
    const sellerPayload = parseJson(sellerText);

    if (!sellerPayload) {
      return json({
        ok: false,
        error: 'Response seller tidak berbentuk JSON.',
        message: sellerText.slice(0, 1000)
      }, 502, request);
    }

    const sellerMessageHtml = String(sellerPayload.data || sellerPayload.message || '');
    const sellerMessage = compactText(stripHtml(sellerMessageHtml));
    const confirmationId = extractOfficeConfirmationId(sellerMessage);

    if (sellerPayload.success === false) {
      return json({
        ok: false,
        error: sellerMessage || 'Seller menolak Installation ID.',
        message: sellerMessage,
        html: sellerMessageHtml
      }, 422, request);
    }

    return json({
      ok: true,
      message: sellerMessage,
      html: sellerMessageHtml,
      confirmationId
    }, 200, request);
  } catch (error) {
    return json({
      ok: false,
      error: error.message || 'Gagal menghubungi seller.'
    }, 502, request);
  }
}

async function getOfficeSellerConfig(env) {
  if (env.OFFICE_ACTIVATION_NONCE) {
    return {
      nonce: env.OFFICE_ACTIVATION_NONCE,
      pageSlug: env.OFFICE_ACTIVATION_PAGE_SLUG || 'get-conf-catsyu'
    };
  }

  const pageResponse = await fetch(OFFICE_SELLER_PAGE_URL, {
    headers: {
      Accept: 'text/html'
    }
  });

  if (!pageResponse.ok) {
    throw new Error(`Gagal membuka halaman seller (${pageResponse.status}).`);
  }

  const pageHtml = await pageResponse.text();
  const nonce = extractOfficeSellerNonce(pageHtml);
  const pageSlug = extractOfficePageSlug(pageHtml) || env.OFFICE_ACTIVATION_PAGE_SLUG || 'get-conf-catsyu';

  if (!nonce) {
    throw new Error('Nonce seller tidak ditemukan. Cek ulang halaman seller.');
  }

  return { nonce, pageSlug };
}

function extractOfficeSellerNonce(html) {
  const patterns = [
    /nonce:\s*['"]([^'"]+)['"]/i,
    /name=["']nonce["']\s+value=["']([^"']+)["']/i,
    /nonce=([A-Za-z0-9_-]+)/i
  ];

  for (const pattern of patterns) {
    const match = String(html || '').match(pattern);

    if (match) {
      return match[1];
    }
  }

  return '';
}

function extractOfficePageSlug(html) {
  const match = String(html || '').match(/pageSlug\s*=\s*['"]([^'"]+)['"]/i);
  return match ? match[1] : '';
}

function normalizeOfficeDigits(value) {
  return String(value || '')
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/[Ss]/g, '5')
    .replace(/[Bb]/g, '8')
    .replace(/\D/g, '');
}

function formatOfficeInstallationId(value) {
  return normalizeOfficeDigits(value).slice(0, 63).match(/.{1,7}/g).join(' ');
}

function extractOfficeConfirmationId(value) {
  const runs = String(value || '').match(/\d+/g) || [];
  const groupedRuns = runs.filter((run) => run.length >= 5 && run.length <= 7);

  for (let index = 0; index <= groupedRuns.length - 8; index += 1) {
    const candidate = groupedRuns.slice(index, index + 8).join('');

    if (candidate.length >= 48) {
      return candidate.slice(0, 48).match(/.{1,6}/g).join(' ');
    }
  }

  const digits = normalizeOfficeDigits(value);
  return digits.length >= 48 ? digits.slice(0, 48).match(/.{1,6}/g).join(' ') : '';
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function isAuthorized(request, env) {
  if (request.headers.get('Cf-Access-Authenticated-User-Email')) {
    return true;
  }

  if (!env.INBOX_API_TOKEN) {
    return env.ALLOW_UNAUTHENTICATED_API === 'true';
  }

  const authorization = request.headers.get('Authorization') || '';
  const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const headerToken = request.headers.get('x-catsoft-inbox-key') || '';

  return bearerToken === env.INBOX_API_TOKEN || headerToken === env.INBOX_API_TOKEN;
}

function json(payload, status = 200, request) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(request)
    }
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return {};
  }
}

function corsHeaders(request) {
  const origin = request ? request.headers.get('Origin') : '';
  const headers = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, PATCH, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Cache-Control, Pragma, x-catsoft-inbox-key'
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

async function readEmailStream(stream) {
  const reader = stream.getReader();
  const chunks = [];

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.length;
  });

  return new TextDecoder().decode(bytes);
}

function extractMimePart(rawContent, mimeType) {
  const normalized = String(rawContent || '').replace(/\r\n/g, '\n');
  const escapedType = mimeType.replace('/', '\\/');
  const pattern = new RegExp(`(Content-Type:\\s*${escapedType}[^\\n]*(?:\\n(?!\\n)[^\\n]*)*)\\n\\n([\\s\\S]*?)(?=\\n--|\\nContent-Type:|$)`, 'i');
  const match = normalized.match(pattern);

  if (!match) {
    return '';
  }

  return decodeTransferContent(match[2], match[1]).trim();
}

function decodeTransferContent(value, headers = '') {
  const charset = getHeaderCharset(headers);

  if (/content-transfer-encoding:\s*base64/i.test(headers)) {
    try {
      const binary = atob(String(value || '').replace(/\s/g, ''));
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      return new TextDecoder(charset).decode(bytes);
    } catch (error) {
      return String(value || '');
    }
  }

  if (/content-transfer-encoding:\s*quoted-printable/i.test(headers) || /=([A-Fa-f0-9]{2})/.test(String(value || ''))) {
    return decodeQuotedPrintable(value, charset);
  }

  return String(value || '');
}

function getHeaderCharset(headers = '') {
  const match = String(headers || '').match(/charset=["']?([^;"'\s]+)/i);
  return match ? match[1] : 'utf-8';
}

function decodeQuotedPrintable(value, charset = 'utf-8') {
  const input = String(value || '').replace(/=\r?\n/g, '');
  const bytes = [];
  const encoder = new TextEncoder();

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const hex = input.slice(index + 1, index + 3);

    if (char === '=' && /^[A-Fa-f0-9]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16));
      index += 2;
      continue;
    }

    bytes.push(...encoder.encode(char));
  }

  try {
    return new TextDecoder(charset).decode(new Uint8Array(bytes));
  } catch (error) {
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
}

function decodeMimeHeader(value) {
  return String(value || '').replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (_, charset, encoding, encodedText) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        const binary = atob(encodedText.replace(/\s/g, ''));
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        return new TextDecoder(charset).decode(bytes);
      }

      return new TextDecoder(charset).decode(
        Uint8Array.from(
          encodedText
            .replace(/_/g, ' ')
            .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))),
          (char) => char.charCodeAt(0)
        )
      );
    } catch (error) {
      return encodedText;
    }
  });
}

function getReadableEmailBody(textBody, htmlBody, rawContent) {
  const text = cleanEmailText(textBody);
  const htmlText = cleanEmailText(stripHtml(htmlBody));

  if (isUsefulEmailText(text) && (!htmlText || text.length >= Math.min(htmlText.length, 120))) {
    return text;
  }

  return htmlText || text || cleanEmailText(stripHeaders(rawContent));
}

function getReadableEmailSnippet(snippet, subject, category) {
  const text = cleanEmailText(snippet);

  if (isUsefulEmailText(text)) {
    return compactText(text).slice(0, 220);
  }

  return compactText(subject || (category === 'adobe' ? 'Email Adobe' : 'Isi email tersedia')).slice(0, 220);
}

function cleanEmailText(value) {
  return String(value || '')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isUsefulEmailText(value) {
  const text = compactText(value)
    .replace(/[-=_*•·\s]/g, '')
    .trim();

  return text.length >= 24;
}

function stripHeaders(rawContent) {
  const normalized = String(rawContent || '').replace(/\r\n/g, '\n');
  const splitIndex = normalized.indexOf('\n\n');

  return splitIndex >= 0 ? normalized.slice(splitIndex + 2).trim() : normalized.trim();
}

function stripHtml(value) {
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
    });
}

function categorizeEmail(email) {
  const haystack = normalizeSearch(`${email.recipient} ${email.sender} ${email.subject} ${email.body}`);
  const matchedRule = categoryRules.find((rule) => rule.checks.some((check) => haystack.includes(check)));

  return matchedRule ? matchedRule.value : 'other';
}

function extractOtp(value) {
  const normalized = String(value || '').replace(/\s+/g, ' ');
  const patterns = [
    /(?:verification|security|login|authentication|one-time)\s+code[^\d]{0,48}(\d[\d\s-]{2,16}\d)/i,
    /(?:kode\s+(?:verifikasi|keamanan|otp)|otp|code)[^\d]{0,48}(\d[\d\s-]{2,16}\d)/i,
    /(\d[\d\s-]{2,16}\d)[^\w]{0,24}(?:is your|adalah)\s+(?:verification|security|login|authentication|otp|kode)/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (!match) {
      continue;
    }

    const code = match[1].replace(/\D/g, '');

    if (code.length >= 4 && code.length <= 8) {
      return code;
    }
  }

  return '';
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeSearch(value) {
  return String(value || '').toLowerCase().trim();
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(number), min), max);
}
