#!/usr/bin/env python3
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "9b19f1b31d88513e013d1a522e583c08")
API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN") or os.environ.get("CF_API_TOKEN")
ZONE_NAME = os.environ.get("CLOUDFLARE_ZONE_NAME", "catsoft.store")
TARGET_WORKER = os.environ.get("TARGET_WORKER", "catsoft")
DNS_TARGET = os.environ.get("CATSOFT_SUBDOMAIN_TARGET", "192.0.2.1")
SUBDOMAINS = tuple(
    item.strip()
    for item in os.environ.get("CATSOFT_SUBDOMAINS", "admin,supplier,customer").split(",")
    if item.strip()
)


def die(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def request(method, path, payload=None, ignore_error_codes=None):
    if not API_TOKEN:
        die("Missing CLOUDFLARE_API_TOKEN or CF_API_TOKEN.")

    body = None
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json",
    }

    if payload is not None:
        body = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4{path}",
        data=body,
        headers=headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            text = response.read().decode("utf-8")
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as error:
        text = error.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(text)
            errors = parsed.get("errors") or []
            if any(item.get("code") in (ignore_error_codes or []) for item in errors):
                return parsed
            details = json.dumps(parsed.get("errors") or parsed, indent=2)
        except Exception:
            details = text
        die(f"Cloudflare API error {method} {path} {error.code}\n{details}")


def get_zone_id():
    query = urllib.parse.urlencode({"name": ZONE_NAME, "account.id": ACCOUNT_ID})
    result = request("GET", f"/zones?{query}").get("result") or []

    if not result:
        die(f"Zone not found: {ZONE_NAME}")

    return result[0]["id"]


def remove_worker_custom_domain(hostname):
    response = request("GET", f"/accounts/{ACCOUNT_ID}/workers/domains")
    domains = response.get("result") or []
    domain = next((item for item in domains if item.get("hostname") == hostname), None)

    if not domain:
        return

    request("DELETE", f"/accounts/{ACCOUNT_ID}/workers/domains/{domain['id']}", ignore_error_codes={10016})
    print(f"DOMAIN DEL {hostname}")


def delete_dns_records(zone_id, hostname):
    query = urllib.parse.urlencode({"name": hostname})
    records = request("GET", f"/zones/{zone_id}/dns_records?{query}").get("result") or []

    for record in records:
        response = request(
            "DELETE",
            f"/zones/{zone_id}/dns_records/{record['id']}",
            ignore_error_codes={1043},
        )
        if response.get("success") is False:
            print(f"DNS SKIP {hostname} {record.get('type', '')} read-only")
            continue
        print(f"DNS DEL {hostname} {record.get('type', '')}")


def create_dns_record(zone_id, hostname):
    request(
        "POST",
        f"/zones/{zone_id}/dns_records",
        {
            "type": "A",
            "name": hostname,
            "content": DNS_TARGET,
            "ttl": 1,
            "proxied": True,
            "comment": "Catsoft tools Worker hostname",
        },
    )
    print(f"DNS ADD {hostname} A {DNS_TARGET} (proxied)")


def upsert_worker_route(zone_id, pattern):
    routes = request("GET", f"/zones/{zone_id}/workers/routes").get("result") or []
    existing = next((route for route in routes if route.get("pattern") == pattern), None)

    if existing and existing.get("script") == TARGET_WORKER:
        print(f"ROUTE OK  {pattern} -> {TARGET_WORKER}")
        return

    if existing:
        request("DELETE", f"/zones/{zone_id}/workers/routes/{existing['id']}")

    request("POST", f"/zones/{zone_id}/workers/routes", {"pattern": pattern, "script": TARGET_WORKER})
    print(f"ROUTE SET {pattern} -> {TARGET_WORKER}")


def main():
    zone_id = get_zone_id()

    for subdomain in SUBDOMAINS:
        hostname = f"{subdomain}.{ZONE_NAME}"
        remove_worker_custom_domain(hostname)
        delete_dns_records(zone_id, hostname)
        create_dns_record(zone_id, hostname)
        upsert_worker_route(zone_id, hostname)
        upsert_worker_route(zone_id, f"{hostname}/")
        upsert_worker_route(zone_id, f"{hostname}/*")

    print("Done. Tunggu propagasi DNS Cloudflare beberapa menit, lalu buka admin/supplier/customer subdomain.")


if __name__ == "__main__":
    main()
