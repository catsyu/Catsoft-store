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
  read_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_messages_received_at
  ON email_messages (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_messages_recipient
  ON email_messages (recipient);

CREATE INDEX IF NOT EXISTS idx_email_messages_category
  ON email_messages (category);

CREATE INDEX IF NOT EXISTS idx_email_messages_read_at
  ON email_messages (read_at);

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

-- Run these if the table already existed before the full schema was added.
-- D1 will error if a column already exists, so use the dashboard Console and
-- run only the ALTER statements for columns that are missing.
-- ALTER TABLE email_messages ADD COLUMN subject TEXT;
-- ALTER TABLE email_messages ADD COLUMN category TEXT NOT NULL DEFAULT 'other';
-- ALTER TABLE email_messages ADD COLUMN size INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE email_messages ADD COLUMN snippet TEXT;
-- ALTER TABLE email_messages ADD COLUMN text_body TEXT;
-- ALTER TABLE email_messages ADD COLUMN html_body TEXT;
-- ALTER TABLE email_messages ADD COLUMN raw_content TEXT;
-- ALTER TABLE email_messages ADD COLUMN otp_code TEXT;
-- ALTER TABLE email_messages ADD COLUMN read_at TEXT;
