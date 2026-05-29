CREATE TABLE IF NOT EXISTS email_messages (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  received_at TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  snippet TEXT,
  text_body TEXT,
  html_body TEXT,
  raw_content TEXT,
  otp_code TEXT,
  read_at TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_messages_received_at
  ON email_messages (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_messages_recipient
  ON email_messages (recipient);

CREATE INDEX IF NOT EXISTS idx_email_messages_category
  ON email_messages (category);

CREATE INDEX IF NOT EXISTS idx_email_messages_read_at
  ON email_messages (read_at);

CREATE INDEX IF NOT EXISTS idx_email_messages_deleted_at
  ON email_messages (deleted_at);

CREATE TABLE IF NOT EXISTS admin_accounts (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  password_hash TEXT,
  tools TEXT NOT NULL DEFAULT '[]',
  inbox_access_all INTEGER NOT NULL DEFAULT 0,
  inbox_rules TEXT NOT NULL DEFAULT '[]',
  last_login_at TEXT,
  active_at TEXT,
  login_count_today INTEGER NOT NULL DEFAULT 0,
  login_count_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_accounts_updated_at
  ON admin_accounts (updated_at DESC);

CREATE TABLE IF NOT EXISTS supplier_accounts (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  password_hash TEXT,
  tools TEXT NOT NULL DEFAULT '[]',
  allowed_domains TEXT NOT NULL DEFAULT '["catsoft.store","catsoft.digital","catsoft.online","ask1q2.uk","fadisa1.uk","gasddqw1.uk","kulamusic.us","wkwkksks.uk"]',
  inbox_access_all INTEGER NOT NULL DEFAULT 0,
  inbox_rules TEXT NOT NULL DEFAULT '[]',
  created_by TEXT,
  last_login_at TEXT,
  active_at TEXT,
  login_count_today INTEGER NOT NULL DEFAULT 0,
  login_count_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_supplier_accounts_updated_at
  ON supplier_accounts (updated_at DESC);

CREATE TABLE IF NOT EXISTS customer_records (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  activated_email TEXT,
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
);

CREATE INDEX IF NOT EXISTS idx_customer_records_updated_at
  ON customer_records (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_records_expiry_date
  ON customer_records (expiry_date);

CREATE INDEX IF NOT EXISTS idx_customer_records_status
  ON customer_records (status);

CREATE INDEX IF NOT EXISTS idx_customer_records_order_number
  ON customer_records (order_number);

CREATE INDEX IF NOT EXISTS idx_customer_records_whatsapp_number
  ON customer_records (whatsapp_number);

CREATE INDEX IF NOT EXISTS idx_customer_records_activated_email
  ON customer_records (LOWER(activated_email))
  WHERE activated_email IS NOT NULL AND activated_email != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_records_order_number_unique
  ON customer_records (LOWER(order_number))
  WHERE order_number IS NOT NULL AND order_number != '';

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
);

CREATE INDEX IF NOT EXISTS idx_customer_accounts_updated_at
  ON customer_accounts (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_accounts_status
  ON customer_accounts (status);

CREATE TABLE IF NOT EXISTS tool_settings (
  tool_id TEXT PRIMARY KEY,
  settings TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_role TEXT,
  actor_username TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS internal_chat_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL DEFAULT 'all',
  sender_username TEXT NOT NULL,
  target_username TEXT,
  message_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_internal_chat_room_created
  ON internal_chat_messages (room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_chat_created
  ON internal_chat_messages (created_at DESC);

-- Run these if the table already existed before the full schema was added.
-- D1 will error if a column already exists, so use the dashboard Console and
-- run only the ALTER statements for columns that are missing.
-- DROP INDEX IF EXISTS idx_customer_records_activated_email_unique;
-- CREATE INDEX IF NOT EXISTS idx_customer_records_activated_email
--   ON customer_records (LOWER(activated_email))
--   WHERE activated_email IS NOT NULL AND activated_email != '';
-- ALTER TABLE email_messages ADD COLUMN subject TEXT;
-- ALTER TABLE email_messages ADD COLUMN category TEXT NOT NULL DEFAULT 'other';
-- ALTER TABLE email_messages ADD COLUMN size INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE email_messages ADD COLUMN snippet TEXT;
-- ALTER TABLE email_messages ADD COLUMN text_body TEXT;
-- ALTER TABLE email_messages ADD COLUMN html_body TEXT;
-- ALTER TABLE email_messages ADD COLUMN raw_content TEXT;
-- ALTER TABLE email_messages ADD COLUMN otp_code TEXT;
-- ALTER TABLE email_messages ADD COLUMN read_at TEXT;
-- ALTER TABLE email_messages ADD COLUMN deleted_at TEXT;
-- CREATE TABLE IF NOT EXISTS admin_accounts (
--   username TEXT PRIMARY KEY,
--   password TEXT NOT NULL,
--   tools TEXT NOT NULL DEFAULT '[]',
--   allowed_domains TEXT NOT NULL DEFAULT '["catsoft.store","catsoft.digital","catsoft.online","ask1q2.uk","fadisa1.uk","gasddqw1.uk","kulamusic.us","wkwkksks.uk"]',
--   inbox_access_all INTEGER NOT NULL DEFAULT 0,
--   inbox_rules TEXT NOT NULL DEFAULT '[]',
--   created_at TEXT NOT NULL,
--   updated_at TEXT NOT NULL
-- );
-- CREATE TABLE IF NOT EXISTS supplier_accounts (
--   username TEXT PRIMARY KEY,
--   password TEXT NOT NULL,
--   tools TEXT NOT NULL DEFAULT '[]',
--   inbox_access_all INTEGER NOT NULL DEFAULT 0,
--   inbox_rules TEXT NOT NULL DEFAULT '[]',
--   created_by TEXT,
--   created_at TEXT NOT NULL,
--   updated_at TEXT NOT NULL
-- );
-- ALTER TABLE supplier_accounts ADD COLUMN allowed_domains TEXT NOT NULL DEFAULT '["catsoft.store","catsoft.digital","catsoft.online","ask1q2.uk","fadisa1.uk","gasddqw1.uk","kulamusic.us","wkwkksks.uk"]';
-- ALTER TABLE admin_accounts ADD COLUMN password_hash TEXT;
-- ALTER TABLE supplier_accounts ADD COLUMN password_hash TEXT;
-- ALTER TABLE admin_accounts ADD COLUMN last_login_at TEXT;
-- ALTER TABLE admin_accounts ADD COLUMN active_at TEXT;
-- ALTER TABLE admin_accounts ADD COLUMN login_count_today INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE admin_accounts ADD COLUMN login_count_date TEXT;
-- ALTER TABLE supplier_accounts ADD COLUMN last_login_at TEXT;
-- ALTER TABLE supplier_accounts ADD COLUMN active_at TEXT;
-- ALTER TABLE supplier_accounts ADD COLUMN login_count_today INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE supplier_accounts ADD COLUMN login_count_date TEXT;
-- CREATE TABLE IF NOT EXISTS tool_settings (
--   tool_id TEXT PRIMARY KEY,
--   settings TEXT NOT NULL DEFAULT '{}',
--   updated_at TEXT NOT NULL
-- );
-- CREATE TABLE IF NOT EXISTS audit_logs (
--   id TEXT PRIMARY KEY,
--   actor_role TEXT,
--   actor_username TEXT,
--   action TEXT NOT NULL,
--   target_type TEXT,
--   target_id TEXT,
--   metadata TEXT NOT NULL DEFAULT '{}',
--   created_at TEXT NOT NULL
-- );
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
--   ON audit_logs (created_at DESC);
