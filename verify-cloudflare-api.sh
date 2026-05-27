#!/bin/sh

set -u

endpoints="
https://catsoft.store/api/admin-accounts
https://www.catsoft.store/api/admin-accounts
https://catsoft.store/api/email-messages/health
https://www.catsoft.store/api/email-messages/health
https://catsoft.store/api/customer-records/health
https://www.catsoft.store/api/customer-records/health
https://catsoft.digital/api/admin-accounts
https://www.catsoft.digital/api/admin-accounts
https://catsoft.digital/api/email-messages/health
https://www.catsoft.digital/api/email-messages/health
https://catsoft.digital/api/customer-records/health
https://www.catsoft.digital/api/customer-records/health
https://catsoft.online/api/admin-accounts
https://www.catsoft.online/api/admin-accounts
https://catsoft.online/api/email-messages/health
https://www.catsoft.online/api/email-messages/health
https://catsoft.online/api/customer-records/health
https://www.catsoft.online/api/customer-records/health
"

for endpoint in $endpoints; do
  output_file="/tmp/catsoft-api-check.json"
  rm -f "$output_file"
  status="$(curl -sS -o "$output_file" -w '%{http_code}' "$endpoint")"
  printf '%s %s\n' "$status" "$endpoint"
  if [ "$status" != "200" ]; then
    if [ -s "$output_file" ]; then
      sed -n '1,3p' "$output_file"
    fi
  fi
done
