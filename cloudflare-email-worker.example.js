const MAX_BODY_CHARS = 50000;
const DEFAULT_LIMIT = 80;
const MAX_LIMIT = 500;

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

    const detailMatch = url.pathname.match(/^\/api\/email-messages\/([^/]+)$/);

    if (detailMatch && request.method === 'GET') {
      return getEmail(request, env, detailMatch[1]);
    }

    if (detailMatch && request.method === 'PATCH') {
      return markEmailRead(request, env, detailMatch[1]);
    }

    return json({ error: 'Not found' }, 404, request);
  }
};

async function saveEmailMessage(message, env) {
  if (!env.EMAIL_DB) {
    throw new Error('Missing EMAIL_DB D1 binding');
  }

  const id = crypto.randomUUID();
  const rawContent = await readEmailStream(message.raw);
  const subject = decodeMimeHeader(message.headers.get('subject') || '(Tanpa subject)');
  const textBody = extractMimePart(rawContent, 'text/plain');
  const htmlBody = extractMimePart(rawContent, 'text/html');
  const readableBody = textBody || stripHtml(htmlBody) || stripHeaders(rawContent);
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

async function listEmails(request, env) {
  if (!env.EMAIL_DB) {
    return json({ error: 'Missing EMAIL_DB D1 binding' }, 500, request);
  }

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
      snippet: row.snippet,
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

  const row = await env.EMAIL_DB.prepare(`
    SELECT id, sender, recipient, subject, category, received_at, size,
      snippet, text_body, html_body, raw_content, otp_code, read_at
    FROM email_messages
    WHERE id = ?
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
    snippet: row.snippet,
    textBody: row.text_body,
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

  await env.EMAIL_DB.prepare(`
    UPDATE email_messages
    SET read_at = COALESCE(read_at, ?)
    WHERE id = ?
  `).bind(new Date().toISOString(), id).run();

  return json({ ok: true }, 200, request);
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

function corsHeaders(request) {
  const origin = request ? request.headers.get('Origin') : '';
  const headers = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-catsoft-inbox-key'
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

function stripHeaders(rawContent) {
  const normalized = String(rawContent || '').replace(/\r\n/g, '\n');
  const splitIndex = normalized.indexOf('\n\n');

  return splitIndex >= 0 ? normalized.slice(splitIndex + 2).trim() : normalized.trim();
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
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
