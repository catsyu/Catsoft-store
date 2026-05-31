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
const productStockStatusValues = new Set(['active', 'full', 'reset', 'paused']);
const productStockTypeValues = new Set(['account', 'team', 'redeem_code']);
const financeSourceValues = new Set(['shopee', 'gopay']);

const categoryRules = [
  {
    value: 'spam',
    checks: [
      'loan offer',
      'pinjaman',
      'quick cash',
      'easy loan',
      'cash loan',
      'kredit tanpa',
      'casino',
      'jackpot',
      'lottery',
      'winner',
      'free money',
      'claim now',
      'crypto profit',
      'investment opportunity'
    ]
  },
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

    if (url.pathname === '/api/customer-accounts' && request.method === 'GET') {
      return listCustomerAccounts(request, env);
    }

    if (url.pathname === '/api/customer-accounts' && request.method === 'POST') {
      return saveCustomerAccountsApi(request, env);
    }

    if (url.pathname === '/api/session-activity' && request.method === 'POST') {
      return saveSessionActivity(request, env);
    }

    if (url.pathname === '/api/audit-logs' && request.method === 'GET') {
      return listAuditLogs(request, env);
    }

    if (url.pathname === '/api/internal-chat/messages' && request.method === 'GET') {
      return listInternalChatMessages(request, env);
    }

    if (url.pathname === '/api/internal-chat/messages' && request.method === 'POST') {
      return createInternalChatMessage(request, env);
    }

    if (url.pathname === '/api/tool-settings/marketing-calculator' && request.method === 'GET') {
      return getToolSetting(request, env, 'marketing-calculator');
    }

    if (url.pathname === '/api/tool-settings/marketing-calculator' && request.method === 'POST') {
      return saveToolSetting(request, env, 'marketing-calculator');
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

    if (url.pathname === '/api/product-stock' && request.method === 'GET') {
      return listProductStockAccounts(request, env);
    }

    if (url.pathname === '/api/product-stock' && request.method === 'POST') {
      return saveProductStockAccounts(request, env);
    }

    if (url.pathname === '/api/product-stock/health' && request.method === 'GET') {
      return productStockHealthCheck(request, env);
    }

    if (url.pathname === '/api/finance-records' && request.method === 'GET') {
      return listFinanceRecords(request, env);
    }

    if (url.pathname === '/api/finance-records' && request.method === 'POST') {
      return saveFinanceRecords(request, env);
    }

    if (url.pathname === '/api/finance-records/bulk-import' && request.method === 'POST') {
      return bulkImportFinanceRecords(request, env);
    }

    if (url.pathname === '/api/finance-records/health' && request.method === 'GET') {
      return financeRecordsHealthCheck(request, env);
    }

    if (url.pathname === '/api/office-confirmation' && request.method === 'POST') {
      return generateOfficeConfirmation(request, env);
    }

    const internalChatDetailMatch = url.pathname.match(/^\/api\/internal-chat\/messages\/([^/]+)$/);
    const customerDetailMatch = url.pathname.match(/^\/api\/customer-records\/([^/]+)$/);
    const productStockDetailMatch = url.pathname.match(/^\/api\/product-stock\/([^/]+)$/);
    const financeDetailMatch = url.pathname.match(/^\/api\/finance-records\/([^/]+)$/);
    const detailMatch = url.pathname.match(/^\/api\/email-messages\/([^/]+)$/);

    if (internalChatDetailMatch && request.method === 'DELETE') {
      return deleteInternalChatMessage(request, env, internalChatDetailMatch[1]);
    }

    if (customerDetailMatch && request.method === 'PATCH') {
      return patchCustomerRecord(request, env, customerDetailMatch[1]);
    }

    if (customerDetailMatch && request.method === 'DELETE') {
      return deleteCustomerRecord(request, env, customerDetailMatch[1]);
    }

    if (productStockDetailMatch && request.method === 'DELETE') {
      return deleteProductStockAccount(request, env, productStockDetailMatch[1]);
    }

    if (financeDetailMatch && request.method === 'DELETE') {
      return deleteFinanceRecord(request, env, financeDetailMatch[1]);
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
  ['/admin-access', '/admin-tools.html'],
  ['/admin-access.html', '/admin-tools.html'],
  ['/supplier-access', '/admin-tools.html'],
  ['/supplier-access.html', '/admin-tools.html'],
  ['/customer-access', '/customer-access.html'],
  ['/customer-access.html', '/customer-access.html'],
  ['/customer-database', '/customer-database.html'],
  ['/customer-database.html', '/customer-database.html'],
  ['/refund-calculator', '/refund-calculator.html'],
  ['/refund-calculator.html', '/refund-calculator.html'],
  ['/office-activation', '/office-activation.html'],
  ['/office-activation.html', '/office-activation.html'],
  ['/email-inbox', '/email-inbox.html'],
  ['/email-inbox.html', '/email-inbox.html'],
  ['/internal-chat', '/internal-chat.html'],
  ['/internal-chat.html', '/internal-chat.html'],
  ['/marketing-calculator', '/marketing-calculator.html'],
  ['/marketing-calculator.html', '/marketing-calculator.html'],
  ['/content-editor', '/content-editor.html'],
  ['/content-editor.html', '/content-editor.html'],
  ['/product-stock', '/product-stock.html'],
  ['/product-stock.html', '/product-stock.html'],
  ['/finance-database', '/finance-database.html'],
  ['/finance-database.html', '/finance-database.html'],
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

const adminHostRouteFallbacks = new Map([
  ['/', '/admin-tools.html'],
  ['/access', '/admin-tools.html'],
  ['/supplier-access', '/admin-tools.html'],
  ['/customer-access', '/admin-tools.html'],
  ['/customers', '/admin-tools.html'],
  ['/refund', '/admin-tools.html'],
  ['/mail', '/admin-tools.html'],
  ['/chat', '/admin-tools.html'],
  ['/office', '/admin-tools.html'],
  ['/marketing', '/admin-tools.html'],
  ['/content', '/admin-tools.html'],
  ['/stock', '/admin-tools.html'],
  ['/finance', '/admin-tools.html'],
  ['/tool/customer-database', '/customer-database.html'],
  ['/tool/customer-access', '/customer-access.html'],
  ['/tool/refund-calculator', '/refund-calculator.html'],
  ['/tool/office-activation', '/office-activation.html'],
  ['/tool/email-inbox', '/email-inbox.html'],
  ['/tool/internal-chat', '/internal-chat.html'],
  ['/tool/marketing-calculator', '/marketing-calculator.html'],
  ['/tool/content-editor', '/content-editor.html'],
  ['/tool/product-stock', '/product-stock.html'],
  ['/tool/finance-database', '/finance-database.html']
]);

const supplierHostRouteFallbacks = new Map([
  ['/', '/supplier-center.html'],
  ['/mail', '/supplier-email.html']
]);

const customerHostRouteFallbacks = new Map([
  ['/', '/customer-center.html'],
  ['/center', '/customer-center.html'],
  ['/subscriptions', '/customer-center.html'],
  ['/mail', '/customer-center.html'],
  ['/tool/email-inbox', '/email-inbox.html']
]);

async function serveStaticAsset(request, env) {
  const url = new URL(request.url);
  const routedRequest = getHostRoutedStaticRequest(request, url);
  const routedUrl = new URL(routedRequest.url);
  const fallbackPath = getStaticFallbackPath(routedUrl.pathname, routedUrl.hostname) || routedUrl.pathname;
  const toolsHost = isToolsHostname(routedUrl.hostname);
  const assetRequest = createStaticAssetRequest(routedRequest, fallbackPath, routedUrl.search);

  if (env.ASSETS) {
    const response = await fetchStaticAssetWithoutClientRedirect(env.ASSETS, assetRequest);

    if (response.status !== 404) {
      return withToolsStaticHeaders(response, toolsHost, fallbackPath, url.pathname);
    }
  }

  if (env.ASSETS && fallbackPath !== routedUrl.pathname) {
    const response = await fetchStaticAssetWithoutClientRedirect(
      env.ASSETS,
      routedRequest
    );
    if (response.status !== 404) {
      return withToolsStaticHeaders(response, toolsHost, routedUrl.pathname, url.pathname);
    }
  }

  if (toolsHost) {
    const githubResponse = await fetchGitHubStaticAsset(fallbackPath, routedUrl.search);

    if (githubResponse.status !== 404) {
      return withToolsStaticHeaders(githubResponse, true, fallbackPath, url.pathname);
    }
  }

  return withToolsStaticHeaders(await fetchGitHubStaticAsset(fallbackPath, routedUrl.search), toolsHost, fallbackPath, url.pathname);
}

function createStaticAssetRequest(request, pathname, search = '') {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = pathname;
  assetUrl.search = search;
  return new Request(assetUrl.toString(), request);
}

async function fetchStaticAssetWithoutClientRedirect(assetFetcher, request, maxRedirects = 3) {
  let currentRequest = request;
  let response = await assetFetcher.fetch(currentRequest);
  let redirectCount = 0;

  while ([301, 302, 303, 307, 308].includes(response.status) && redirectCount < maxRedirects) {
    const location = response.headers.get('Location');

    if (!location) {
      break;
    }

    const nextUrl = new URL(location, currentRequest.url);
    currentRequest = new Request(nextUrl.toString(), currentRequest);
    response = await assetFetcher.fetch(currentRequest);
    redirectCount += 1;
  }

  return response;
}

async function withToolsStaticHeaders(response, toolsHost, pathname = '', sourcePathname = '') {
  const headers = new Headers(response.headers);
  const hasStaticPath = Boolean(pathname);

  if (!toolsHost && !hasStaticPath) {
    return response;
  }

  if (hasStaticPath) {
    headers.set('Content-Type', getStaticContentType(pathname));
  }

  if (toolsHost) {
    headers.set('Cache-Control', 'no-store');
  }

  const embeddedToolHtmlFiles = new Set([
    '/customer-database',
    '/customer-database.html',
    '/customer-access',
    '/customer-access.html',
    '/customer-center',
    '/customer-center.html',
    '/refund-calculator',
    '/refund-calculator.html',
    '/office-activation',
    '/office-activation.html',
    '/email-inbox',
    '/email-inbox.html',
    '/internal-chat',
    '/internal-chat.html',
    '/marketing-calculator',
    '/marketing-calculator.html',
    '/content-editor',
    '/content-editor.html',
    '/product-stock',
    '/product-stock.html',
    '/finance-database',
    '/finance-database.html'
  ]);
  const normalizedPathname = String(pathname || '').split('?')[0].replace(/\/+$/, '');
  const shouldInjectBaseHref = toolsHost
    && (
      String(sourcePathname || '').startsWith('/tool/')
      || embeddedToolHtmlFiles.has(normalizedPathname)
    )
    && headers.get('Content-Type')?.includes('text/html')
    && response.status < 400;

  if (shouldInjectBaseHref) {
    headers.delete('Content-Length');
    const html = await response.text();
    const htmlWithBase = /<base\s/i.test(html)
      ? html
      : html.replace(/<head([^>]*)>/i, '<head$1>\n  <base href="/">');

    return new Response(htmlWithBase, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function isToolsHostname(hostname) {
  const normalizedHost = String(hostname || '').toLowerCase();
  return normalizedHost === 'admin.catsoft.store'
    || normalizedHost === 'supplier.catsoft.store'
    || normalizedHost === 'customer.catsoft.store';
}

function getHostRoutedStaticRequest(request, url) {
  const routedPath = getHostRoutedStaticPath(url.pathname, url.hostname);

  if (!routedPath || routedPath === url.pathname) {
    return request;
  }

  const routedUrl = new URL(url.toString());
  routedUrl.pathname = routedPath;
  return new Request(routedUrl.toString(), request);
}

function getHostRoutedStaticPath(pathname, hostname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const normalizedHost = String(hostname || '').toLowerCase();

  if (normalizedHost === 'admin.catsoft.store' && adminHostRouteFallbacks.has(normalizedPath)) {
    return adminHostRouteFallbacks.get(normalizedPath);
  }

  if (normalizedHost === 'supplier.catsoft.store' && supplierHostRouteFallbacks.has(normalizedPath)) {
    return supplierHostRouteFallbacks.get(normalizedPath);
  }

  if (normalizedHost === 'customer.catsoft.store' && customerHostRouteFallbacks.has(normalizedPath)) {
    return customerHostRouteFallbacks.get(normalizedPath);
  }

  return '';
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

function getStaticFallbackPath(pathname, hostname = '') {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const hostRoute = getHostRoutedStaticPath(normalizedPath, hostname);

  if (hostRoute) {
    return hostRoute;
  }

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
  const cleanPath = String(pathname || '').split('?')[0].replace(/\/+$/, '');
  const fileName = cleanPath.split('/').pop().toLowerCase();
  const extension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
  const extensionlessHtmlFiles = new Set([
    'admin-tools',
    'customer-access',
    'customer-center',
    'customer-database',
    'refund-calculator',
    'office-activation',
    'email-inbox',
    'internal-chat',
    'marketing-calculator',
    'content-editor',
    'product-stock',
    'finance-database',
    'supplier-center',
    'supplier-email'
  ]);

  if (!extension && extensionlessHtmlFiles.has(fileName)) {
    return 'text/html; charset=utf-8';
  }

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
  const updates = [];
  const params = [];

  if (Object.prototype.hasOwnProperty.call(payload, 'read')) {
    updates.push('read_at = ?');
    params.push(payload.read !== false ? new Date().toISOString() : null);
  }

  if (typeof payload.category === 'string') {
    const category = normalizeSearch(payload.category);
    const allowedCategories = new Set(['chatgpt-otp', 'adobe', 'canva', 'support', 'spam', 'other']);

    if (allowedCategories.has(category)) {
      updates.push('category = ?');
      params.push(category);
    }
  }

  if (typeof payload.spam === 'boolean') {
    updates.push('category = ?');
    params.push(payload.spam ? 'spam' : 'other');
  }

  if (!updates.length) {
    updates.push('read_at = ?');
    params.push(new Date().toISOString());
  }

  await env.EMAIL_DB.prepare(`
    UPDATE email_messages
    SET ${updates.join(', ')}
    WHERE id = ?
  `).bind(...params, id).run();

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
      password_hash TEXT,
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

  await addColumnIfMissing(adminDb, 'admin_accounts', 'last_login_at', 'TEXT');
  await addColumnIfMissing(adminDb, 'admin_accounts', 'password_hash', 'TEXT');
  await addColumnIfMissing(adminDb, 'admin_accounts', 'active_at', 'TEXT');
  await addColumnIfMissing(adminDb, 'admin_accounts', 'login_count_today', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(adminDb, 'admin_accounts', 'login_count_date', 'TEXT');
  await addColumnIfMissing(adminDb, 'admin_accounts', 'whatsapp_target', 'TEXT');
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
    passwordHash: row.password_hash || '',
    whatsappTarget: row.whatsapp_target || '',
    tools: parseJsonArray(row.tools),
    inboxAccessAll: Boolean(row.inbox_access_all),
    inboxRules: parseJsonArray(row.inbox_rules),
    lastLoginAt: row.last_login_at || '',
    activeAt: row.active_at || '',
    loginCountToday: Number(row.login_count_today || 0),
    loginCountDate: row.login_count_date || '',
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
      password_hash TEXT,
      tools TEXT NOT NULL DEFAULT '[]',
      allowed_domains TEXT NOT NULL DEFAULT '["catsoft.store","catsoft.digital","catsoft.online","ask1q2.uk","fadisa1.uk","gasddqw1.uk","kulamusic.us","wkwkksks.uk"]',
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
    'TEXT NOT NULL DEFAULT \'["catsoft.store","catsoft.digital","catsoft.online","ask1q2.uk","fadisa1.uk","gasddqw1.uk","kulamusic.us","wkwkksks.uk"]\''
  );
  await addColumnIfMissing(adminDb, 'supplier_accounts', 'password_hash', 'TEXT');
  await addColumnIfMissing(adminDb, 'supplier_accounts', 'last_login_at', 'TEXT');
  await addColumnIfMissing(adminDb, 'supplier_accounts', 'active_at', 'TEXT');
  await addColumnIfMissing(adminDb, 'supplier_accounts', 'login_count_today', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(adminDb, 'supplier_accounts', 'login_count_date', 'TEXT');
}

function mapSupplierAccountRow(row) {
  return {
    username: row.username,
    password: row.password,
    passwordHash: row.password_hash || '',
    tools: parseJsonArray(row.tools),
    allowedDomains: parseJsonArray(row.allowed_domains),
    inboxAccessAll: Boolean(row.inbox_access_all),
    inboxRules: parseJsonArray(row.inbox_rules),
    createdBy: row.created_by || '',
    lastLoginAt: row.last_login_at || '',
    activeAt: row.active_at || '',
    loginCountToday: Number(row.login_count_today || 0),
    loginCountDate: row.login_count_date || '',
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
    SELECT username, password, password_hash, whatsapp_target, tools, inbox_access_all, inbox_rules,
      last_login_at, active_at, login_count_today, login_count_date, created_at, updated_at
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
  const accounts = Array.isArray(payload.accounts)
    ? payload.accounts
    : Array.isArray(payload)
      ? payload
      : [payload.account || payload].filter(Boolean);
  const now = new Date().toISOString();

  const statements = [];
  const savedUsernames = [];
  const deletedUsernames = [];

  accounts.forEach((account) => {
    const originalUsername = String(account.originalUsername || account.original_username || account.username || '').trim();
    const username = String(account.username || '').trim();
    const password = String(account.password || '');
    const passwordHash = String(account.passwordHash || account.password_hash || '');
    const whatsappTarget = String(account.whatsappTarget || account.whatsapp_target || '').replace(/\D/g, '');

    if (account.deleted) {
      if (originalUsername) {
        statements.push(adminDb.prepare('DELETE FROM admin_accounts WHERE LOWER(username) = ?').bind(normalizeSearch(originalUsername)));
        deletedUsernames.push(originalUsername);
      }
      return;
    }

    if (!username || (!password && !passwordHash)) {
      return;
    }

    if (originalUsername && normalizeSearch(originalUsername) !== normalizeSearch(username)) {
      statements.push(adminDb.prepare('DELETE FROM admin_accounts WHERE LOWER(username) = ?').bind(normalizeSearch(originalUsername)));
      deletedUsernames.push(originalUsername);
    }

    statements.push(adminDb.prepare(`
      INSERT INTO admin_accounts (
        username, password, password_hash, whatsapp_target, tools, inbox_access_all, inbox_rules,
        last_login_at, active_at, login_count_today, login_count_date, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        password = excluded.password,
        password_hash = excluded.password_hash,
        whatsapp_target = excluded.whatsapp_target,
        tools = excluded.tools,
        inbox_access_all = excluded.inbox_access_all,
        inbox_rules = excluded.inbox_rules,
        last_login_at = COALESCE(excluded.last_login_at, admin_accounts.last_login_at),
        active_at = COALESCE(excluded.active_at, admin_accounts.active_at),
        login_count_today = excluded.login_count_today,
        login_count_date = COALESCE(excluded.login_count_date, admin_accounts.login_count_date),
        updated_at = excluded.updated_at
    `).bind(
      username,
      password,
      passwordHash || null,
      whatsappTarget,
      JSON.stringify(Array.isArray(account.tools) ? account.tools : []),
      account.inboxAccessAll ? 1 : 0,
      JSON.stringify(Array.isArray(account.inboxRules) ? account.inboxRules : []),
      account.lastLoginAt || null,
      account.activeAt || null,
      Number(account.loginCountToday || 0),
      account.loginCountDate || null,
      account.createdAt || now,
      account.updatedAt || now
    ));
    savedUsernames.push(username);
  });

  if (statements.length) {
    await adminDb.batch(statements);
  }

  await saveAuditLog(adminDb, {
    action: 'admin_accounts_saved',
    targetType: 'admin_accounts',
    targetId: String(savedUsernames.length),
    metadata: { saved: savedUsernames.length, deleted: deletedUsernames.length }
  });

  const result = await adminDb.prepare(`
    SELECT username, password, password_hash, whatsapp_target, tools, inbox_access_all, inbox_rules,
      last_login_at, active_at, login_count_today, login_count_date, created_at, updated_at
    FROM admin_accounts
    ORDER BY updated_at DESC
  `).all();

  return json({
    ok: true,
    saved: savedUsernames,
    deletedUsernames,
    accounts: (result.results || []).map(mapAdminAccountRow)
  }, 200, request);
}

async function listSupplierAccounts(request, env) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureSupplierAccountsTable(adminDb);

  const result = await adminDb.prepare(`
    SELECT username, password, password_hash, tools, allowed_domains, inbox_access_all, inbox_rules, created_by,
      last_login_at, active_at, login_count_today, login_count_date, created_at, updated_at
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
  const accounts = Array.isArray(payload.accounts)
    ? payload.accounts
    : Array.isArray(payload)
      ? payload
      : [payload.account || payload].filter(Boolean);
  const now = new Date().toISOString();

  const statements = [];
  const savedUsernames = [];
  const deletedUsernames = [];

  accounts.forEach((account) => {
    const originalUsername = String(account.originalUsername || account.original_username || account.username || '').trim();
    const username = String(account.username || '').trim();
    const password = String(account.password || '');
    const passwordHash = String(account.passwordHash || account.password_hash || '');

    if (account.deleted) {
      if (originalUsername) {
        statements.push(adminDb.prepare('DELETE FROM supplier_accounts WHERE LOWER(username) = ?').bind(normalizeSearch(originalUsername)));
        deletedUsernames.push(originalUsername);
      }
      return;
    }

    if (!username || (!password && !passwordHash)) {
      return;
    }

    if (originalUsername && normalizeSearch(originalUsername) !== normalizeSearch(username)) {
      statements.push(adminDb.prepare('DELETE FROM supplier_accounts WHERE LOWER(username) = ?').bind(normalizeSearch(originalUsername)));
      deletedUsernames.push(originalUsername);
    }

    statements.push(adminDb.prepare(`
      INSERT INTO supplier_accounts (
        username, password, password_hash, tools, allowed_domains, inbox_access_all, inbox_rules, created_by,
        last_login_at, active_at, login_count_today, login_count_date, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        password = excluded.password,
        password_hash = excluded.password_hash,
        tools = excluded.tools,
        allowed_domains = excluded.allowed_domains,
        inbox_access_all = excluded.inbox_access_all,
        inbox_rules = excluded.inbox_rules,
        created_by = excluded.created_by,
        last_login_at = COALESCE(excluded.last_login_at, supplier_accounts.last_login_at),
        active_at = COALESCE(excluded.active_at, supplier_accounts.active_at),
        login_count_today = excluded.login_count_today,
        login_count_date = COALESCE(excluded.login_count_date, supplier_accounts.login_count_date),
        updated_at = excluded.updated_at
    `).bind(
      username,
      password,
      passwordHash || null,
      JSON.stringify(Array.isArray(account.tools) ? account.tools : []),
      JSON.stringify(Array.isArray(account.allowedDomains) ? account.allowedDomains : ['catsoft.store', 'catsoft.digital', 'catsoft.online', 'ask1q2.uk', 'fadisa1.uk', 'gasddqw1.uk', 'kulamusic.us', 'wkwkksks.uk']),
      account.inboxAccessAll ? 1 : 0,
      JSON.stringify(Array.isArray(account.inboxRules) ? account.inboxRules : []),
      String(account.createdBy || ''),
      account.lastLoginAt || null,
      account.activeAt || null,
      Number(account.loginCountToday || 0),
      account.loginCountDate || null,
      account.createdAt || now,
      account.updatedAt || now
    ));
    savedUsernames.push(username);
  });

  if (statements.length) {
    await adminDb.batch(statements);
  }

  await saveAuditLog(adminDb, {
    action: 'supplier_accounts_saved',
    targetType: 'supplier_accounts',
    targetId: String(savedUsernames.length),
    metadata: { saved: savedUsernames.length, deleted: deletedUsernames.length }
  });

  const result = await adminDb.prepare(`
    SELECT username, password, password_hash, tools, allowed_domains, inbox_access_all, inbox_rules, created_by,
      last_login_at, active_at, login_count_today, login_count_date, created_at, updated_at
    FROM supplier_accounts
    ORDER BY updated_at DESC
  `).all();

  return json({
    ok: true,
    saved: savedUsernames,
    deletedUsernames,
    accounts: (result.results || []).map(mapSupplierAccountRow)
  }, 200, request);
}

async function ensureCustomerAccountsTable(customerDb) {
  await customerDb.prepare(`
    CREATE TABLE IF NOT EXISTS customer_accounts (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      password_hash TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      inbox_access_all INTEGER NOT NULL DEFAULT 0,
      inbox_rules TEXT NOT NULL DEFAULT '[]',
      source_record_id TEXT,
      record_count INTEGER NOT NULL DEFAULT 0,
      last_record_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  await customerDb.prepare(`
    CREATE INDEX IF NOT EXISTS idx_customer_accounts_updated_at
    ON customer_accounts (updated_at DESC)
  `).run();

  await customerDb.prepare(`
    CREATE INDEX IF NOT EXISTS idx_customer_accounts_status
    ON customer_accounts (status)
  `).run();

  await addColumnIfMissing(customerDb, 'customer_accounts', 'password_hash', 'TEXT');
  await addColumnIfMissing(customerDb, 'customer_accounts', 'status', "TEXT NOT NULL DEFAULT 'active'");
  await addColumnIfMissing(customerDb, 'customer_accounts', 'inbox_access_all', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(customerDb, 'customer_accounts', 'inbox_rules', "TEXT NOT NULL DEFAULT '[]'");
  await addColumnIfMissing(customerDb, 'customer_accounts', 'source_record_id', 'TEXT');
  await addColumnIfMissing(customerDb, 'customer_accounts', 'record_count', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(customerDb, 'customer_accounts', 'last_record_at', 'TEXT');
}

function generateCustomerDefaultPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `CS-${[...bytes].map((byte) => alphabet[byte % alphabet.length]).join('')}`;
}

function normalizeCustomerAccountUsername(value) {
  return cleanValue(value, 120).replace(/\s+/g, '');
}

function mapCustomerAccountRow(row) {
  return {
    username: row.username || '',
    password: row.password || '',
    passwordHash: row.password_hash || '',
    status: row.status || 'active',
    inboxAccessAll: Boolean(row.inbox_access_all),
    inboxRules: parseJsonArray(row.inbox_rules),
    sourceRecordId: row.source_record_id || '',
    recordCount: Number(row.record_count || 0),
    lastRecordAt: row.last_record_at || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || ''
  };
}

async function syncCustomerAccountsFromRecords(customerDb) {
  await ensureCustomerAccountsTable(customerDb);

  let records = [];

  try {
    const result = await customerDb.prepare(`
      SELECT id, customer_name, updated_at, created_at
      FROM customer_records
      WHERE customer_name IS NOT NULL AND TRIM(customer_name) != ''
      ORDER BY updated_at DESC
    `).all();
    records = result.results || [];
  } catch (error) {
    if (!/no such table/i.test(error.message || '')) {
      throw error;
    }
  }

  if (!records.length) {
    return 0;
  }

  const existingResult = await customerDb.prepare(`
    SELECT username, password, password_hash, status, source_record_id, record_count,
      last_record_at, created_at, updated_at
    FROM customer_accounts
  `).all();
  const existingByUsername = new Map((existingResult.results || []).map((row) => [
    normalizeSearch(row.username),
    mapCustomerAccountRow(row)
  ]));
  const grouped = new Map();

  for (const row of records) {
    const username = normalizeCustomerAccountUsername(row.customer_name);
    const key = normalizeSearch(username);

    if (!username || !key) {
      continue;
    }

    const current = grouped.get(key) || {
      username,
      sourceRecordId: row.id,
      recordCount: 0,
      lastRecordAt: row.updated_at || row.created_at || ''
    };

    current.recordCount += 1;

    if ((row.updated_at || row.created_at || '') > (current.lastRecordAt || '')) {
      current.lastRecordAt = row.updated_at || row.created_at || '';
      current.sourceRecordId = row.id;
    }

    grouped.set(key, current);
  }

  const statements = [];
  const now = new Date().toISOString();

  grouped.forEach((account, key) => {
    const existing = existingByUsername.get(key);

    if (existing) {
      statements.push(customerDb.prepare(`
        UPDATE customer_accounts
        SET source_record_id = ?,
          record_count = ?,
          last_record_at = ?,
          updated_at = ?
        WHERE LOWER(username) = ?
      `).bind(account.sourceRecordId, account.recordCount, account.lastRecordAt, now, key));
      return;
    }

    statements.push(customerDb.prepare(`
      INSERT INTO customer_accounts (
        username, password, password_hash, status, source_record_id,
        record_count, last_record_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      account.username,
      generateCustomerDefaultPassword(),
      null,
      'active',
      account.sourceRecordId,
      account.recordCount,
      account.lastRecordAt,
      now,
      now
    ));
  });

  if (statements.length) {
    await customerDb.batch(statements);
  }

  return statements.length;
}

async function listCustomerAccounts(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await syncCustomerAccountsFromRecords(customerDb);

    const result = await customerDb.prepare(`
    SELECT username, password, password_hash, status, inbox_access_all, inbox_rules, source_record_id,
      record_count, last_record_at, created_at, updated_at
    FROM customer_accounts
    ORDER BY updated_at DESC
  `).all();

  return json({
    accounts: (result.results || []).map(mapCustomerAccountRow)
  }, 200, request);
}

async function saveCustomerAccountsApi(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureCustomerAccountsTable(customerDb);

  const payload = await readJson(request);
  const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
  const now = new Date().toISOString();
  const statements = [];

  accounts.forEach((account) => {
    const originalUsername = normalizeCustomerAccountUsername(account.originalUsername || account.original_username || account.username);
    const username = normalizeCustomerAccountUsername(account.username);
    const password = String(account.password || '');
    const passwordHash = String(account.passwordHash || account.password_hash || '');
    const status = normalizeSearch(account.status) === 'inactive' ? 'inactive' : 'active';
    const inboxRules = Array.isArray(account.inboxRules)
      ? account.inboxRules
      : Array.isArray(account.inbox_rules)
        ? account.inbox_rules
        : [];

    if (account.deleted && originalUsername) {
      statements.push(customerDb.prepare('DELETE FROM customer_accounts WHERE LOWER(username) = ?').bind(normalizeSearch(originalUsername)));
      return;
    }

    if (!username || (!password && !passwordHash)) {
      return;
    }

    if (originalUsername && normalizeSearch(originalUsername) !== normalizeSearch(username)) {
      statements.push(customerDb.prepare('DELETE FROM customer_accounts WHERE LOWER(username) = ?').bind(normalizeSearch(originalUsername)));
    }

    statements.push(customerDb.prepare(`
      INSERT INTO customer_accounts (
        username, password, password_hash, status, inbox_access_all, inbox_rules, source_record_id,
        record_count, last_record_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        password = excluded.password,
        password_hash = excluded.password_hash,
        status = excluded.status,
        inbox_access_all = excluded.inbox_access_all,
        inbox_rules = excluded.inbox_rules,
        source_record_id = COALESCE(excluded.source_record_id, customer_accounts.source_record_id),
        record_count = COALESCE(excluded.record_count, customer_accounts.record_count),
        last_record_at = COALESCE(excluded.last_record_at, customer_accounts.last_record_at),
        updated_at = excluded.updated_at
    `).bind(
      username,
      password,
      passwordHash || null,
      status,
      account.inboxAccessAll || account.inbox_access_all ? 1 : 0,
      JSON.stringify(inboxRules),
      account.sourceRecordId || account.source_record_id || null,
      Number(account.recordCount || account.record_count || 0),
      account.lastRecordAt || account.last_record_at || null,
      account.createdAt || account.created_at || now,
      now
    ));
  });

  if (statements.length) {
    await customerDb.batch(statements);
  }

  await saveAuditLog(getAdminDb(env) || customerDb, {
    action: 'customer_accounts_saved',
    targetType: 'customer_accounts',
    targetId: String(accounts.length),
    metadata: { total: accounts.length }
  });

  return json({ ok: true, accounts: accounts.length }, 200, request);
}

async function saveSessionActivity(request, env) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  const payload = await readJson(request);
  const role = normalizeSearch(payload.role) === 'supplier' ? 'supplier' : 'admin';
  const username = cleanValue(payload.username, 120);
  const eventType = normalizeSearch(payload.eventType) === 'login' ? 'login' : 'active';
  const activeAt = cleanValue(payload.activeAt || payload.active_at, 80) || new Date().toISOString();
  const loginDate = cleanValue(payload.loginDate || payload.login_count_date, 32) || activeAt.slice(0, 10);

  if (!username) {
    return json({ ok: false, error: 'Username wajib diisi.' }, 400, request);
  }

  if (role === 'supplier') {
    await ensureSupplierAccountsTable(adminDb);
  } else {
    await ensureAdminAccountsTable(adminDb);
  }

  const tableName = role === 'supplier' ? 'supplier_accounts' : 'admin_accounts';
  const row = await adminDb.prepare(`
    SELECT login_count_today, login_count_date
    FROM ${tableName}
    WHERE LOWER(username) = ?
    LIMIT 1
  `).bind(normalizeSearch(username)).first();

  if (!row) {
    return json({ ok: false, error: 'Akun tidak ditemukan.' }, 404, request);
  }

  const previousDate = row.login_count_date || '';
  const previousCount = previousDate === loginDate ? Number(row.login_count_today || 0) : 0;
  const loginCountToday = eventType === 'login' ? previousCount + 1 : previousCount;
  const lastLoginAt = eventType === 'login' ? activeAt : null;

  await adminDb.prepare(`
    UPDATE ${tableName}
    SET active_at = ?,
      last_login_at = COALESCE(?, last_login_at),
      login_count_today = ?,
      login_count_date = ?,
      updated_at = updated_at
    WHERE LOWER(username) = ?
  `).bind(activeAt, lastLoginAt, loginCountToday, loginDate, normalizeSearch(username)).run();

  await saveAuditLog(adminDb, {
    actorRole: role,
    actorUsername: username,
    action: eventType === 'login' ? 'account_login' : 'account_active',
    targetType: role === 'supplier' ? 'supplier_account' : 'admin_account',
    targetId: username,
    metadata: { loginCountToday, loginCountDate: loginDate }
  });

  const responsePayload = { ok: true, role, username, activeAt, loginCountToday, loginCountDate: loginDate };

  if (role === 'supplier') {
    const result = await adminDb.prepare(`
      SELECT username, password, password_hash, tools, allowed_domains, inbox_access_all, inbox_rules, created_by,
        last_login_at, active_at, login_count_today, login_count_date, created_at, updated_at
      FROM supplier_accounts
      ORDER BY updated_at DESC
    `).all();
    responsePayload.supplierAccounts = (result.results || []).map(mapSupplierAccountRow);
  } else {
    const result = await adminDb.prepare(`
      SELECT username, password, password_hash, whatsapp_target, tools, inbox_access_all, inbox_rules,
        last_login_at, active_at, login_count_today, login_count_date, created_at, updated_at
      FROM admin_accounts
      ORDER BY updated_at DESC
    `).all();
    responsePayload.adminAccounts = (result.results || []).map(mapAdminAccountRow);
  }

  return json(responsePayload, 200, request);
}

async function ensureToolSettingsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS tool_settings (
      tool_id TEXT PRIMARY KEY,
      settings TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL
    )
  `).run();
}

async function ensureAuditLogsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_role TEXT,
      actor_username TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    )
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs (created_at DESC)
  `).run();
}

async function saveAuditLog(db, entry) {
  await ensureAuditLogsTable(db);
  await db.prepare(`
    INSERT INTO audit_logs (
      id, actor_role, actor_username, action, target_type, target_id, metadata, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    cleanValue(entry.actorRole || entry.actor_role, 40),
    cleanValue(entry.actorUsername || entry.actor_username, 120),
    cleanValue(entry.action, 120),
    cleanValue(entry.targetType || entry.target_type, 80),
    cleanValue(entry.targetId || entry.target_id, 240),
    JSON.stringify(entry.metadata || {}),
    new Date().toISOString()
  ).run();
}

async function listAuditLogs(request, env) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureAuditLogsTable(adminDb);

  const url = new URL(request.url);
  const limit = clampNumber(url.searchParams.get('limit'), 80, 1, 300);
  const result = await adminDb.prepare(`
    SELECT id, actor_role, actor_username, action, target_type, target_id, metadata, created_at
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(limit).all();

  return json({
    logs: (result.results || []).map((row) => ({
      id: row.id,
      actorRole: row.actor_role || '',
      actorUsername: row.actor_username || '',
      action: row.action,
      targetType: row.target_type || '',
      targetId: row.target_id || '',
      metadata: parseJson(row.metadata) || {},
      createdAt: row.created_at
    }))
  }, 200, request);
}

async function ensureInternalChatTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS internal_chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL DEFAULT 'all',
      sender_username TEXT NOT NULL,
      target_username TEXT,
      message_text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_internal_chat_room_created
    ON internal_chat_messages (room_id, created_at DESC)
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_internal_chat_created
    ON internal_chat_messages (created_at DESC)
  `).run();
}

function normalizeInternalChatRoomId(value) {
  const text = cleanValue(value || 'all', 180).toLowerCase();
  return text.replace(/[^a-z0-9:._-]+/g, '-') || 'all';
}

function mapInternalChatMessageRow(row) {
  return {
    id: row.id,
    roomId: row.room_id || 'all',
    senderUsername: row.sender_username || '',
    targetUsername: row.target_username || '',
    messageText: row.message_text || '',
    createdAt: row.created_at || '',
    deletedAt: row.deleted_at || ''
  };
}

async function listInternalChatMessages(request, env) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureInternalChatTable(adminDb);

  const url = new URL(request.url);
  const roomId = normalizeInternalChatRoomId(url.searchParams.get('room') || 'all');
  const limit = clampNumber(url.searchParams.get('limit'), 120, 1, 300);
  const result = await adminDb.prepare(`
    SELECT id, room_id, sender_username, target_username, message_text, created_at, deleted_at
    FROM (
      SELECT id, room_id, sender_username, target_username, message_text, created_at, deleted_at
      FROM internal_chat_messages
      WHERE room_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ?
    )
    ORDER BY created_at ASC
  `).bind(roomId, limit).all();

  return json({
    roomId,
    messages: (result.results || []).map(mapInternalChatMessageRow)
  }, 200, request);
}

async function createInternalChatMessage(request, env) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureInternalChatTable(adminDb);

  const payload = await readJson(request);
  const roomId = normalizeInternalChatRoomId(payload.roomId || payload.room || 'all');
  const senderUsername = cleanValue(payload.senderUsername || payload.sender || payload.actorUsername, 120);
  const targetUsername = cleanValue(payload.targetUsername || payload.target || '', 120);
  const messageText = cleanValue(payload.messageText || payload.message || payload.body, 1200);

  if (!senderUsername) {
    return json({ ok: false, error: 'Username pengirim wajib diisi.' }, 400, request);
  }

  if (!messageText) {
    return json({ ok: false, error: 'Pesan wajib diisi.' }, 400, request);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await adminDb.prepare(`
    INSERT INTO internal_chat_messages (
      id, room_id, sender_username, target_username, message_text, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, roomId, senderUsername, targetUsername, messageText, createdAt).run();

  await saveAuditLog(adminDb, {
    actorRole: 'admin',
    actorUsername: senderUsername,
    action: 'internal_chat_message_created',
    targetType: 'internal_chat',
    targetId: roomId,
    metadata: { targetUsername }
  });

  return json({
    ok: true,
    message: {
      id,
      roomId,
      senderUsername,
      targetUsername,
      messageText,
      createdAt,
      deletedAt: ''
    }
  }, 200, request);
}

async function deleteInternalChatMessage(request, env, id) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureInternalChatTable(adminDb);

  await adminDb.prepare(`
    UPDATE internal_chat_messages
    SET deleted_at = COALESCE(deleted_at, ?)
    WHERE id = ?
  `).bind(new Date().toISOString(), cleanValue(id, 120)).run();

  return json({ ok: true }, 200, request);
}

async function getToolSetting(request, env, toolId) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureToolSettingsTable(adminDb);

  const row = await adminDb.prepare(`
    SELECT tool_id, settings, updated_at
    FROM tool_settings
    WHERE tool_id = ?
  `).bind(toolId).first();

  return json({
    toolId,
    settings: row ? parseJson(row.settings) || {} : {},
    updatedAt: row ? row.updated_at : ''
  }, 200, request);
}

async function saveToolSetting(request, env, toolId) {
  const adminDb = getAdminDb(env);

  if (!adminDb) {
    return json({ error: 'Missing ADMIN_DB, CUSTOMER_DB, or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureToolSettingsTable(adminDb);

  const payload = await readJson(request);
  const settings = payload.settings && typeof payload.settings === 'object' ? payload.settings : {};
  const updatedAt = new Date().toISOString();

  await adminDb.prepare(`
    INSERT INTO tool_settings (tool_id, settings, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(tool_id) DO UPDATE SET
      settings = excluded.settings,
      updated_at = excluded.updated_at
  `).bind(toolId, JSON.stringify(settings), updatedAt).run();

  await saveAuditLog(adminDb, {
    action: 'tool_settings_saved',
    targetType: 'tool_settings',
    targetId: toolId,
    metadata: { keys: Object.keys(settings) }
  });

  return json({ ok: true, toolId, settings, updatedAt }, 200, request);
}

async function ensureProductStockTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS product_stock_accounts (
      id TEXT PRIMARY KEY,
      parent_stock_id TEXT,
      team_member_index INTEGER NOT NULL DEFAULT 0,
      stock_type TEXT NOT NULL DEFAULT 'account',
      product_name TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_target TEXT,
      login_username TEXT,
      login_password TEXT,
      stock_date TEXT,
      stock_cost INTEGER NOT NULL DEFAULT 0,
      team_member_count INTEGER NOT NULL DEFAULT 1,
      capacity INTEGER NOT NULL DEFAULT 7,
      status TEXT NOT NULL DEFAULT 'active',
      reset_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  await addColumnIfMissing(db, 'product_stock_accounts', 'stock_type', "TEXT NOT NULL DEFAULT 'account'");
  await addColumnIfMissing(db, 'product_stock_accounts', 'stock_cost', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'product_stock_accounts', 'team_member_count', 'INTEGER NOT NULL DEFAULT 1');
  await addColumnIfMissing(db, 'product_stock_accounts', 'parent_stock_id', 'TEXT');
  await addColumnIfMissing(db, 'product_stock_accounts', 'team_member_index', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'product_stock_accounts', 'stock_date', 'TEXT');

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_product_stock_accounts_product
    ON product_stock_accounts (LOWER(product_name))
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_product_stock_accounts_parent
    ON product_stock_accounts (parent_stock_id)
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_product_stock_accounts_target
    ON product_stock_accounts (LOWER(account_target))
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_product_stock_accounts_status
    ON product_stock_accounts (status)
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_product_stock_accounts_reset_at
    ON product_stock_accounts (reset_at)
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_product_stock_accounts_stock_date
    ON product_stock_accounts (stock_date)
  `).run();
}

function normalizeProductStockStatus(value) {
  const status = cleanValue(value, 40).toLowerCase();
  return productStockStatusValues.has(status) ? status : 'active';
}

function normalizeProductStockType(value) {
  const stockType = cleanValue(value, 40).toLowerCase().replace(/[\s-]+/g, '_');
  return productStockTypeValues.has(stockType) ? stockType : 'account';
}

function normalizeProductStockAccount(account) {
  if (!account || typeof account !== 'object') {
    return null;
  }

  const now = new Date().toISOString();
  const productName = normalizeCustomerProductName(account.productName ?? account.product_name);
  const accountName = cleanValue(account.accountName ?? account.account_name, 240)
    || (productName ? `${productName} sharing` : '');

  return {
    id: cleanValue(account.id, 120) || crypto.randomUUID(),
    parentStockId: cleanValue(account.parentStockId ?? account.parent_stock_id, 120),
    teamMemberIndex: clampNumber(account.teamMemberIndex ?? account.team_member_index, 0, 0, 500),
    stockType: normalizeProductStockType(account.stockType ?? account.stock_type),
    productName,
    accountName,
    accountTarget: cleanValue(account.accountTarget ?? account.account_target, 240),
    loginUsername: cleanValue(account.loginUsername ?? account.login_username, 240),
    loginPassword: cleanValue(account.loginPassword ?? account.login_password, 240),
    stockDate: cleanDate(account.stockDate ?? account.stock_date),
    stockCost: clampNumber(account.stockCost ?? account.stock_cost, 0, 0, 999999999),
    teamMemberCount: clampNumber(account.teamMemberCount ?? account.team_member_count, 1, 1, 500),
    capacity: clampNumber(account.capacity, 7, 1, 500),
    status: normalizeProductStockStatus(account.status),
    resetAt: cleanDate(account.resetAt ?? account.reset_at),
    notes: cleanValue(account.notes, 2000),
    createdAt: cleanValue(account.createdAt ?? account.created_at, 80) || now,
    updatedAt: cleanValue(account.updatedAt ?? account.updated_at, 80) || now
  };
}

function mapProductStockRow(row) {
  return {
    id: row.id,
    parentStockId: row.parent_stock_id || '',
    teamMemberIndex: row.team_member_index || 0,
    stockType: row.stock_type || 'account',
    productName: row.product_name || '',
    accountName: row.account_name || '',
    accountTarget: row.account_target || '',
    loginUsername: row.login_username || '',
    loginPassword: row.login_password || '',
    stockDate: row.stock_date || '',
    stockCost: row.stock_cost || 0,
    teamMemberCount: row.team_member_count || 1,
    capacity: row.capacity || 7,
    status: row.status || 'active',
    resetAt: row.reset_at || '',
    notes: row.notes || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || row.created_at || ''
  };
}

function isCustomerRecordExpired(record, today = new Date().toISOString().slice(0, 10)) {
  return record.status === 'expired'
    || Boolean(record.expiryDate && cleanDate(record.expiryDate) && cleanDate(record.expiryDate) < today);
}

async function getProductStockJoinedCustomers(customerDb, account) {
  const productName = normalizeCustomerProductName(account.productName);
  const stockKeys = uniqueValues([
    account.id,
    account.accountName,
    account.loginUsername,
    account.accountTarget
  ].map(normalizeCustomerUniqueEmail).filter(Boolean));

  if (!productName || !stockKeys.length) {
    return [];
  }

  await ensureCustomerRecordsSchema(customerDb);
  const placeholders = stockKeys.map(() => '?').join(', ');
  const result = await customerDb.prepare(`
    SELECT id, customer_name, activated_email, stock_account, income_amount, whatsapp_number, order_number,
      order_source, product_name, duration_days, start_date, expiry_date,
      status, notes, created_at, updated_at
    FROM customer_records
    WHERE LOWER(product_name) = ?
      AND (
        LOWER(COALESCE(stock_account, '')) IN (${placeholders})
        OR (
          (stock_account IS NULL OR TRIM(stock_account) = '')
          AND LOWER(COALESCE(activated_email, '')) IN (${placeholders})
        )
      )
      AND status NOT IN ('removed', 'refund')
    ORDER BY
      CASE WHEN expiry_date IS NULL OR expiry_date = '' THEN 1 ELSE 0 END,
      expiry_date ASC,
      updated_at DESC
    LIMIT 120
  `).bind(productName.toLowerCase(), ...stockKeys, ...stockKeys).all();

  return (result.results || []).map(mapCustomerRecordRow);
}

async function hydrateProductStockAccount(customerDb, account) {
  const joinedCustomers = await getProductStockJoinedCustomers(customerDb, account);
  const today = new Date().toISOString().slice(0, 10);
  const activeCustomers = joinedCustomers.filter((record) => record.status === 'active' && !isCustomerRecordExpired(record, today));
  const expiredCustomers = joinedCustomers.filter((record) => isCustomerRecordExpired(record, today));
  const problemCustomers = joinedCustomers.filter((record) => record.status === 'problem');
  const totalRevenue = joinedCustomers.reduce((sum, record) => sum + (Number(record.incomeAmount) || 0), 0);

  return {
    ...account,
    totalRevenue,
    netRevenue: totalRevenue - (Number(account.stockCost) || 0),
    costPerMember: account.stockType === 'team'
      ? Math.round((Number(account.stockCost) || 0) / Math.max(Number(account.teamMemberCount) || 1, 1))
      : Number(account.stockCost) || 0,
    joinedTotal: joinedCustomers.length,
    joinedActive: activeCustomers.length,
    joinedExpired: expiredCustomers.length,
    joinedProblem: problemCustomers.length,
    openSlots: Math.max((Number(account.capacity) || 0) - activeCustomers.length, 0),
    joinedCustomers: joinedCustomers.map((record) => ({
      ...record,
      isExpired: isCustomerRecordExpired(record, today)
    }))
  };
}

async function listProductStockAccounts(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureProductStockTable(customerDb);

  const url = new URL(request.url);
  const limit = clampNumber(url.searchParams.get('limit'), 80, 1, 300);
  const offset = clampNumber(url.searchParams.get('offset'), 0, 0, 10000);
  const search = normalizeCustomerUniqueEmail(url.searchParams.get('q') || url.searchParams.get('search'));
  const stockMonth = cleanValue(url.searchParams.get('month') || url.searchParams.get('stockMonth') || '', 7);
  const whereParts = [];
  const bindings = [];

  if (search) {
    whereParts.push(`LOWER(product_name || ' ' || account_name || ' ' || stock_type || ' ' || COALESCE(parent_stock_id, '') || ' ' || COALESCE(account_target, '') || ' ' || COALESCE(login_username, '')) LIKE ?`);
    bindings.push(`%${search}%`);
  }

  if (/^\d{4}-\d{2}$/.test(stockMonth)) {
    whereParts.push("(stock_date LIKE ? OR (COALESCE(stock_date, '') = '' AND created_at LIKE ?))");
    bindings.push(`${stockMonth}%`, `${stockMonth}%`);
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
  const result = await customerDb.prepare(`
    SELECT id, parent_stock_id, team_member_index, stock_type, product_name, account_name, account_target, login_username, login_password, stock_date,
      stock_cost, team_member_count, capacity, status, reset_at, notes, created_at, updated_at
    FROM product_stock_accounts
    ${whereClause}
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all();

  const accounts = [];
  for (const row of result.results || []) {
    accounts.push(await hydrateProductStockAccount(customerDb, mapProductStockRow(row)));
  }

  return json({ accounts }, 200, request);
}

async function productStockHealthCheck(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ ok: false, error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureProductStockTable(customerDb);
  const row = await customerDb.prepare('SELECT COUNT(*) AS total FROM product_stock_accounts').first();
  const columns = await customerDb.prepare('PRAGMA table_info(product_stock_accounts)').all();

  return json({
    ok: true,
    database: 'connected',
    total: row ? row.total : 0,
    columns: (columns.results || []).map((column) => column.name)
  }, 200, request);
}

async function saveProductStockAccounts(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureProductStockTable(customerDb);

  let payload = {};

  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Body request harus JSON.' }, 400, request);
  }

  const inputAccounts = Array.isArray(payload.accounts)
    ? payload.accounts
    : Array.isArray(payload)
      ? payload
      : [payload.account || payload];

  const savedAccounts = [];
  const deletedIds = [];

  for (const rawAccount of inputAccounts) {
    const id = cleanValue(rawAccount && rawAccount.id, 120);

    if (rawAccount && rawAccount.deleted) {
      if (id) {
        await customerDb.prepare('DELETE FROM product_stock_accounts WHERE id = ?').bind(id).run();
        deletedIds.push(id);
      }
      continue;
    }

    const account = normalizeProductStockAccount(rawAccount);

    if (!account || !account.productName || !account.accountName) {
      return json({ ok: false, error: 'Produk dan nama akun stok wajib diisi.' }, 400, request);
    }

    await customerDb.prepare(`
      INSERT INTO product_stock_accounts (
        id, parent_stock_id, team_member_index, stock_type, product_name, account_name, account_target, login_username, login_password, stock_date,
        stock_cost, team_member_count, capacity, status, reset_at, notes, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        parent_stock_id = excluded.parent_stock_id,
        team_member_index = excluded.team_member_index,
        stock_type = excluded.stock_type,
        product_name = excluded.product_name,
        account_name = excluded.account_name,
        account_target = excluded.account_target,
        login_username = excluded.login_username,
        login_password = excluded.login_password,
        stock_date = excluded.stock_date,
        stock_cost = excluded.stock_cost,
        team_member_count = excluded.team_member_count,
        capacity = excluded.capacity,
        status = excluded.status,
        reset_at = excluded.reset_at,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `).bind(
      account.id,
      account.parentStockId,
      account.teamMemberIndex,
      account.stockType,
      account.productName,
      account.accountName,
      account.accountTarget,
      account.loginUsername,
      account.loginPassword,
      account.stockDate,
      account.stockCost,
      account.teamMemberCount,
      account.capacity,
      account.status,
      account.resetAt,
      account.notes,
      account.createdAt,
      account.updatedAt
    ).run();

    savedAccounts.push(account);
  }

  const listResult = await customerDb.prepare(`
    SELECT id, parent_stock_id, team_member_index, stock_type, product_name, account_name, account_target, login_username, login_password, stock_date,
      stock_cost, team_member_count, capacity, status, reset_at, notes, created_at, updated_at
    FROM product_stock_accounts
    ORDER BY updated_at DESC
    LIMIT 300
  `).all();
  const accounts = [];

  for (const row of listResult.results || []) {
    accounts.push(await hydrateProductStockAccount(customerDb, mapProductStockRow(row)));
  }

  return json({
    ok: true,
    saved: savedAccounts,
    deletedIds,
    accounts
  }, 200, request);
}

async function deleteProductStockAccount(request, env, id) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureProductStockTable(customerDb);
  await customerDb.prepare('DELETE FROM product_stock_accounts WHERE id = ?').bind(cleanValue(id, 120)).run();

  return json({ ok: true }, 200, request);
}

async function ensureFinanceTransactionsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS finance_transactions (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL DEFAULT 'shopee',
      transaction_date TEXT NOT NULL,
      month_key TEXT NOT NULL,
      transaction_type TEXT NOT NULL DEFAULT 'withdrawal',
      description TEXT,
      reference TEXT,
      amount INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'posted',
      import_batch TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_finance_transactions_month
    ON finance_transactions (month_key)
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_finance_transactions_source
    ON finance_transactions (source)
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_finance_transactions_date
    ON finance_transactions (transaction_date DESC)
  `).run();
}

function normalizeFinanceSource(value) {
  const source = cleanValue(value, 40).toLowerCase();
  return financeSourceValues.has(source) ? source : 'shopee';
}

function normalizeFinanceAmount(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.abs(Math.round(value)) : 0;
  }

  const digits = String(value || '').replace(/[^\d]/g, '');
  if (!digits) {
    return 0;
  }

  const amount = Number(digits);
  return Number.isFinite(amount) ? Math.abs(Math.round(amount)) : 0;
}

function normalizeFinanceMonthKey(value, transactionDate = '') {
  const cleanMonth = cleanValue(value, 20);

  if (/^\d{4}-\d{2}$/.test(cleanMonth)) {
    return cleanMonth;
  }

  const date = cleanDate(transactionDate);
  return date ? date.slice(0, 7) : new Date().toISOString().slice(0, 7);
}

function normalizeFinanceRecord(record) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const now = new Date().toISOString();
  const source = normalizeFinanceSource(record.source);
  const transactionDate = cleanDate(record.transactionDate ?? record.transaction_date ?? record.date) || now.slice(0, 10);
  const amount = normalizeFinanceAmount(record.amount ?? record.nominal ?? record.jumlah);
  const normalized = {
    id: cleanValue(record.id, 160),
    source,
    transactionDate,
    monthKey: normalizeFinanceMonthKey(record.monthKey ?? record.month_key, transactionDate),
    transactionType: 'withdrawal',
    description: cleanValue(record.description ?? record.deskripsi, 1000) || (source === 'gopay' ? 'Penarikan GoPay' : 'Penarikan Dana Shopee'),
    reference: cleanValue(record.reference ?? record.noPesanan ?? record.no_pesanan ?? record.orderNumber ?? record.order_number, 240),
    amount,
    status: cleanValue(record.status, 120) || 'posted',
    importBatch: cleanValue(record.importBatch ?? record.import_batch, 160),
    createdAt: cleanValue(record.createdAt ?? record.created_at, 80) || now,
    updatedAt: now
  };

  if (!normalized.id) {
    const seed = [
      normalized.source,
      normalized.transactionDate,
      normalized.reference,
      normalized.description,
      normalized.amount
    ].join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    normalized.id = `${normalized.source}-${seed || crypto.randomUUID()}`.slice(0, 160);
  }

  return normalized;
}

function mapFinanceRecordRow(row) {
  return {
    id: row.id,
    source: row.source,
    transactionDate: row.transaction_date,
    monthKey: row.month_key,
    transactionType: row.transaction_type,
    description: row.description || '',
    reference: row.reference || '',
    amount: row.amount || 0,
    status: row.status || 'posted',
    importBatch: row.import_batch || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || row.created_at || ''
  };
}

async function saveFinanceRecordToDb(db, record) {
  await db.prepare(`
    INSERT INTO finance_transactions (
      id, source, transaction_date, month_key, transaction_type,
      description, reference, amount, status, import_batch, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      source = excluded.source,
      transaction_date = excluded.transaction_date,
      month_key = excluded.month_key,
      transaction_type = excluded.transaction_type,
      description = excluded.description,
      reference = excluded.reference,
      amount = excluded.amount,
      status = excluded.status,
      import_batch = excluded.import_batch,
      updated_at = excluded.updated_at
  `).bind(
    record.id,
    record.source,
    record.transactionDate,
    record.monthKey,
    record.transactionType,
    record.description,
    record.reference,
    record.amount,
    record.status,
    record.importBatch,
    record.createdAt,
    record.updatedAt
  ).run();
}

async function listFinanceRecords(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureFinanceTransactionsTable(customerDb);

  const url = new URL(request.url);
  const limit = clampNumber(url.searchParams.get('limit'), DEFAULT_LIMIT, 1, 1000);
  const offset = clampNumber(url.searchParams.get('offset'), 0, 0, 10000);
  const source = normalizeFinanceSource(url.searchParams.get('source'));
  const hasSource = financeSourceValues.has(cleanValue(url.searchParams.get('source'), 40).toLowerCase());
  const month = cleanValue(url.searchParams.get('month'), 20);
  const search = normalizeSearch(url.searchParams.get('q') || url.searchParams.get('search'));
  const where = [];
  const bindings = [];

  if (hasSource) {
    where.push('source = ?');
    bindings.push(source);
  }

  if (/^\d{4}-\d{2}$/.test(month)) {
    where.push('month_key = ?');
    bindings.push(month);
  }

  if (search) {
    where.push(`LOWER(source || ' ' || description || ' ' || COALESCE(reference, '') || ' ' || status) LIKE ?`);
    bindings.push(`%${search}%`);
  }

  bindings.push(limit, offset);
  const result = await customerDb.prepare(`
    SELECT id, source, transaction_date, month_key, transaction_type, description, reference,
      amount, status, import_batch, created_at, updated_at
    FROM finance_transactions
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY transaction_date DESC, updated_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings).all();

  return json({
    records: (result.results || []).map(mapFinanceRecordRow)
  }, 200, request);
}

async function financeRecordsHealthCheck(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ ok: false, error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureFinanceTransactionsTable(customerDb);
  const row = await customerDb.prepare('SELECT COUNT(*) AS total FROM finance_transactions').first();
  const columns = await customerDb.prepare('PRAGMA table_info(finance_transactions)').all();

  return json({
    ok: true,
    database: 'connected',
    total: row ? row.total : 0,
    columns: (columns.results || []).map((column) => column.name)
  }, 200, request);
}

async function saveFinanceRecords(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureFinanceTransactionsTable(customerDb);

  let payload = {};

  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Body request harus JSON.' }, 400, request);
  }

  const inputRecords = Array.isArray(payload.records)
    ? payload.records
    : Array.isArray(payload)
      ? payload
      : [payload.record || payload];
  const saved = [];

  for (const rawRecord of inputRecords) {
    const record = normalizeFinanceRecord(rawRecord);

    if (!record || !record.amount) {
      return json({ ok: false, error: 'Nominal penarikan wajib diisi.' }, 400, request);
    }

    await saveFinanceRecordToDb(customerDb, record);
    saved.push(record);
  }

  return json({
    ok: true,
    record: saved[0] || null,
    records: saved
  }, 200, request);
}

async function bulkImportFinanceRecords(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureFinanceTransactionsTable(customerDb);

  let payload = {};

  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Body request harus JSON.' }, 400, request);
  }

  const inputRecords = Array.isArray(payload.records) ? payload.records : [];
  const records = inputRecords
    .map(normalizeFinanceRecord)
    .filter((record) => record && record.amount);

  if (!records.length) {
    return json({ ok: false, error: 'Tidak ada transaksi valid untuk diupload.' }, 400, request);
  }

  for (const chunk of chunkArray(records, customerImportBatchSize)) {
    await Promise.all(chunk.map((record) => saveFinanceRecordToDb(customerDb, record)));
  }

  return json({
    ok: true,
    uploaded: records.length,
    records
  }, 200, request);
}

async function deleteFinanceRecord(request, env, id) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureFinanceTransactionsTable(customerDb);
  await customerDb.prepare('DELETE FROM finance_transactions WHERE id = ?').bind(cleanValue(id, 160)).run();

  return json({ ok: true }, 200, request);
}

async function listCustomerRecords(request, env) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureCustomerRecordsSchema(customerDb);
  const url = new URL(request.url);
  const limit = clampNumber(url.searchParams.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = clampNumber(url.searchParams.get('offset'), 0, 0, 10000);
  const customerFilter = normalizeSearch(url.searchParams.get('customer') || url.searchParams.get('username'));
  const orderFilter = normalizeCustomerUniqueOrderNumber(
    url.searchParams.get('orderNumber')
    || url.searchParams.get('order')
    || url.searchParams.get('pesanan')
    || ''
  ).replace(/\s+/g, '');
  const lookupRaw = cleanValue(
    url.searchParams.get('lookup')
    || url.searchParams.get('q')
    || url.searchParams.get('search')
    || '',
    180
  );
  const lookupText = normalizeSearch(lookupRaw);
  const lookupCompact = lookupText.replace(/\s+/g, '');
  const lookupDigits = lookupRaw.replace(/\D/g, '');
  const whereParts = [];
  const bindings = [];

  if (customerFilter) {
    whereParts.push('LOWER(customer_name) = ?');
    bindings.push(customerFilter);
  }

  if (orderFilter) {
    whereParts.push("LOWER(REPLACE(order_number, ' ', '')) = ?");
    bindings.push(orderFilter);
  }

  if (lookupText) {
    const phoneExpression = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(whatsapp_number, ''), ' ', ''), '-', ''), '+', ''), '.', ''), '(', ''), ')', '')";
    const lookupParts = [
      "LOWER(REPLACE(COALESCE(order_number, ''), ' ', '')) = ?",
      "LOWER(COALESCE(customer_name, '')) = ?",
      "LOWER(REPLACE(COALESCE(customer_name, ''), ' ', '')) = ?",
      "LOWER(COALESCE(customer_name, '')) LIKE ?",
      "LOWER(COALESCE(activated_email, '')) LIKE ?"
    ];

    bindings.push(lookupCompact, lookupText, lookupCompact, `%${lookupText}%`, `%${lookupText}%`);

    if (lookupDigits) {
      const phoneLookups = uniqueValues([
        lookupDigits,
        lookupDigits.startsWith('62') ? `0${lookupDigits.slice(2)}` : '',
        lookupDigits.startsWith('0') ? `62${lookupDigits.slice(1)}` : ''
      ].filter(Boolean));

      for (const phoneLookup of phoneLookups) {
        lookupParts.push(`${phoneExpression} LIKE ?`);
        bindings.push(`%${phoneLookup}%`);
      }
    }

    whereParts.push(`(${lookupParts.join(' OR ')})`);
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
  const result = await customerDb.prepare(`
    SELECT id, customer_name, activated_email, stock_account, income_amount, whatsapp_number, order_number,
      order_source, product_name, duration_days, start_date, expiry_date,
      status, notes, created_at, updated_at
    FROM customer_records
    ${whereClause}
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all();

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
    await ensureCustomerRecordsSchema(customerDb);
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

  await ensureCustomerRecordsSchema(customerDb);

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

  await syncCustomerAccountsFromRecords(customerDb);

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

  await ensureCustomerRecordsSchema(customerDb);

  if (batchConflict) {
    return customerRecordConflictResponse(batchConflict, request);
  }

  const mergedRecords = await mergeCustomerImportRecords(customerDb, records);
  const existingConflict = await findCustomerRecordBulkConflict(customerDb, mergedRecords);

  if (existingConflict) {
    return customerRecordConflictResponse(existingConflict, request);
  }

  await saveCustomerRecordsBatch(customerDb, mergedRecords);
  await syncCustomerAccountsFromRecords(customerDb);

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
    return json({ ok: false, error: 'Status Bulk tidak valid.' }, 400, request);
  }

  if (!ids.length) {
    return json({ ok: false, error: 'Tidak ada data yang dipilih.' }, 400, request);
  }

  await ensureCustomerRecordsSchema(customerDb);
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

  await ensureCustomerRecordsSchema(customerDb);
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

  await ensureCustomerRecordsSchema(customerDb);
  const existingRow = await customerDb.prepare(`
    SELECT id, customer_name, activated_email, stock_account, income_amount, whatsapp_number, order_number,
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
  await syncCustomerAccountsFromRecords(customerDb);

  return json({ ok: true, record }, 200, request);
}

async function deleteCustomerRecord(request, env, id) {
  const customerDb = getCustomerDb(env);

  if (!customerDb) {
    return json({ error: 'Missing CUSTOMER_DB or EMAIL_DB D1 binding' }, 500, request);
  }

  await ensureCustomerRecordsSchema(customerDb);
  await customerDb.prepare('DELETE FROM customer_records WHERE id = ?').bind(id).run();

  return json({ ok: true }, 200, request);
}

function getCustomerDb(env) {
  return env.CUSTOMER_DB || env.EMAIL_DB;
}

async function ensureCustomerRecordsSchema(customerDb) {
  await customerDb.prepare(`
    CREATE TABLE IF NOT EXISTS customer_records (
      id TEXT PRIMARY KEY,
      customer_name TEXT,
      activated_email TEXT,
      stock_account TEXT,
      income_amount INTEGER NOT NULL DEFAULT 0,
      whatsapp_number TEXT,
      order_number TEXT,
      order_source TEXT NOT NULL DEFAULT 'shopee',
      product_name TEXT NOT NULL,
      duration_days INTEGER NOT NULL DEFAULT 30,
      start_date TEXT,
      expiry_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  await addColumnIfMissing(customerDb, 'customer_records', 'stock_account', 'TEXT');
  await addColumnIfMissing(customerDb, 'customer_records', 'income_amount', 'INTEGER NOT NULL DEFAULT 0');
  await customerDb.prepare(`
    CREATE INDEX IF NOT EXISTS idx_customer_records_stock_account
    ON customer_records (LOWER(stock_account))
    WHERE stock_account IS NOT NULL AND stock_account != ''
  `).run();
}

function findCustomerRecordBatchConflict(records) {
  const orderNumbers = new Map();

  for (const record of records) {
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
  }

  return null;
}

async function findCustomerRecordConflict(customerDb, record) {
  const orderNumber = normalizeCustomerUniqueOrderNumber(record.orderNumber);

  if (orderNumber) {
    const orderRow = await customerDb.prepare(`
    SELECT id, customer_name, activated_email, stock_account, income_amount, whatsapp_number, order_number,
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

  return null;
}

function customerRecordConflictResponse(conflict, request) {
  const message = `Nomor pesanan ${conflict.value} sudah ada di database.`;

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
      stockAccount: record.stockAccount || existingRecord.stockAccount,
      incomeAmount: record.incomeAmount || existingRecord.incomeAmount,
      whatsappNumber: record.whatsappNumber || existingRecord.whatsappNumber,
      status: customerProtectedStatuses.has(existingRecord.status) ? existingRecord.status : record.status,
      notes: record.notes || existingRecord.notes,
      createdAt: existingRecord.createdAt || record.createdAt
    };
  });
}

async function findCustomerRecordBulkConflict(customerDb, records) {
  const orderRecords = new Map();

  records.forEach((record) => {
    const orderNumber = normalizeCustomerUniqueOrderNumber(record.orderNumber);

    if (orderNumber) {
      orderRecords.set(orderNumber, record);
    }
  });

  const orderConflict = await findCustomerRecordBulkConflictByField(customerDb, 'order_number', orderRecords, 'orderNumber');

  if (orderConflict) {
    return orderConflict;
  }

  return null;
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
      SELECT id, customer_name, activated_email, stock_account, income_amount, whatsapp_number, order_number,
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
      SELECT id, customer_name, activated_email, stock_account, income_amount, whatsapp_number, order_number,
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
    stockAccount: row.stock_account || '',
    incomeAmount: row.income_amount || 0,
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
    stockAccount: cleanValue(record.stockAccount ?? record.stock_account, 240),
    incomeAmount: clampNumber(record.incomeAmount ?? record.income_amount, 0, 0, 999999999),
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
      id, customer_name, activated_email, stock_account, income_amount, whatsapp_number, order_number,
      order_source, product_name, duration_days, start_date, expiry_date,
      status, notes, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      customer_name = excluded.customer_name,
      activated_email = excluded.activated_email,
      stock_account = excluded.stock_account,
      income_amount = excluded.income_amount,
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
    record.stockAccount,
    record.incomeAmount,
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
      id, customer_name, activated_email, stock_account, income_amount, whatsapp_number, order_number,
      order_source, product_name, duration_days, start_date, expiry_date,
      status, notes, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      customer_name = excluded.customer_name,
      activated_email = excluded.activated_email,
      stock_account = excluded.stock_account,
      income_amount = excluded.income_amount,
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
      record.stockAccount,
      record.incomeAmount,
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
  return false;
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
  const sender = String(email.sender || '');
  const subject = String(email.subject || '');
  const compactSubject = normalizeSearch(subject).replace(/\s+/g, ' ');
  const numericSender = /^[\s"'<]*\d{3,8}[\s"'>]*$/i.test(sender) || /^[\d\s+-]{3,12}$/.test((sender.split('@')[0] || sender));

  if (numericSender && /(loan|pinjaman|kredit|offer|promo|cash)/i.test(subject)) {
    return 'spam';
  }

  if (/^loan offer$/i.test(compactSubject)) {
    return 'spam';
  }

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
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(number), min), max);
}
