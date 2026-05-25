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
