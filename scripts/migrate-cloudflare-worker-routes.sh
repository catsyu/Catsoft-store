#!/bin/sh

set -eu

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-9b19f1b31d88513e013d1a522e583c08}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-}}"
ROUTES_FILE="${ROUTES_FILE:-cloudflare-worker-routes.txt}"
TARGET_WORKER="${TARGET_WORKER:-catsoft}"
OLD_WORKER="${OLD_WORKER:-mail-base-all-catch}"

if [ -z "$API_TOKEN" ]; then
  printf '%s\n' "Missing CLOUDFLARE_API_TOKEN or CF_API_TOKEN." >&2
  exit 1
fi

if [ ! -f "$ROUTES_FILE" ]; then
  printf 'Routes file not found: %s\n' "$ROUTES_FILE" >&2
  exit 1
fi

cat <<'EOF' >/tmp/catsoft-route-permissions.txt
Required Cloudflare token permissions:
- Zone: Zone: Read
- Zone: Workers Routes: Edit
Recommended for DNS checks:
- Zone: DNS: Read
EOF

api_request() {
  method="$1"
  path="$2"
  data="${3:-}"
  response_file="$(mktemp)"

  if [ -n "$data" ]; then
    status="$(curl -sS -o "$response_file" -w '%{http_code}' \
      -X "$method" "https://api.cloudflare.com/client/v4$path" \
      -H "Authorization: Bearer $API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$data")"
  else
    status="$(curl -sS -o "$response_file" -w '%{http_code}' \
      -X "$method" "https://api.cloudflare.com/client/v4$path" \
      -H "Authorization: Bearer $API_TOKEN" \
      -H "Content-Type: application/json")"
  fi

  if [ "$status" -lt 200 ] || [ "$status" -ge 300 ]; then
    printf 'Cloudflare API error %s %s %s\n' "$method" "$path" "$status" >&2
    jq -r '.errors // .messages // .' "$response_file" >&2
    if [ "$status" = "403" ]; then
      cat /tmp/catsoft-route-permissions.txt >&2
    fi
    rm -f "$response_file"
    exit 1
  fi

  cat "$response_file"
  rm -f "$response_file"
}

zone_name_for_pattern() {
  host="$(printf '%s' "$1" | cut -d/ -f1)"
  host="${host#www.}"
  parts="$(printf '%s' "$host" | awk -F. '{print $(NF-1)"."$NF}')"
  printf '%s' "$parts"
}

zone_id_for_name() {
  zone_name="$1"
  encoded_name="$(printf '%s' "$zone_name" | jq -sRr @uri)"
  api_request GET "/zones?name=$encoded_name&account.id=$ACCOUNT_ID" |
    jq -r '.result[0].id // empty'
}

route_json_for_pattern() {
  zone_id="$1"
  pattern="$2"
  response="$(api_request GET "/zones/$zone_id/workers/routes")"
  printf '%s' "$response" |
    jq -c --arg pattern "$pattern" '.result[] | select(.pattern == $pattern)' |
    sed -n '1p'
}

delete_route() {
  zone_id="$1"
  route_id="$2"
  api_request DELETE "/zones/$zone_id/workers/routes/$route_id" >/dev/null
}

create_route() {
  zone_id="$1"
  pattern="$2"
  payload="$(jq -n --arg pattern "$pattern" --arg script "$TARGET_WORKER" '{pattern: $pattern, script: $script}')"
  api_request POST "/zones/$zone_id/workers/routes" "$payload" >/dev/null
}

printf 'Migrating HTTP Worker routes from %s to %s...\n' "$OLD_WORKER" "$TARGET_WORKER"

while IFS= read -r pattern; do
  pattern="$(printf '%s' "$pattern" | sed 's/[[:space:]]*$//')"

  case "$pattern" in
    ''|'#'*) continue ;;
  esac

  zone_name="$(zone_name_for_pattern "$pattern")"
  zone_id="$(zone_id_for_name "$zone_name")"

  if [ -z "$zone_id" ]; then
    printf 'Zone not found for pattern %s (zone %s)\n' "$pattern" "$zone_name" >&2
    exit 1
  fi

  existing="$(route_json_for_pattern "$zone_id" "$pattern")"

  if [ -n "$existing" ]; then
    route_id="$(printf '%s' "$existing" | jq -r '.id')"
    script="$(printf '%s' "$existing" | jq -r '.script // empty')"

    if [ "$script" = "$TARGET_WORKER" ]; then
      printf 'OK     %s already assigned to %s\n' "$pattern" "$TARGET_WORKER"
      continue
    fi

    printf 'MOVE   %s from %s to %s\n' "$pattern" "${script:-unknown}" "$TARGET_WORKER"
    delete_route "$zone_id" "$route_id"
  else
    printf 'ADD    %s to %s\n' "$pattern" "$TARGET_WORKER"
  fi

  create_route "$zone_id" "$pattern"
done < "$ROUTES_FILE"

printf 'Done. Email Routing catch-all is not changed by this script.\n'
