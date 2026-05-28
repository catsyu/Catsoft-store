#!/bin/sh

set -eu

DATABASES="${DATABASES:-ADMIN_DB CUSTOMER_DB EMAIL_DB}"
SCHEMA_FILE="${SCHEMA_FILE:-cloudflare-email-schema.sql}"

if ! command -v wrangler >/dev/null 2>&1; then
  printf '%s\n' "wrangler is required. Install Cloudflare Wrangler first." >&2
  exit 1
fi

if [ ! -f "$SCHEMA_FILE" ]; then
  printf 'Schema file not found: %s\n' "$SCHEMA_FILE" >&2
  exit 1
fi

for database in $DATABASES; do
  printf 'Applying %s to %s...\n' "$SCHEMA_FILE" "$database"
  wrangler d1 execute "$database" --remote --file "$SCHEMA_FILE"
done

printf '%s\n' "Done."
