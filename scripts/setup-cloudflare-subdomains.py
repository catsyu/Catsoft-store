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

SUBDOMAINS = ("admin", "supplier")


def die(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def request(method, path, payload=None):
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


def upsert_dns_record(zone_id, hostname):
    query = urllib.parse.urlencode({"name": hostname})
    records = request("GET", f"/zones/{zone_id}/dns_records?{query}").get("result") or []
    payload = {
        "type": "A",
        "name": hostname,
        "content": DNS_TARGET,
        "ttl": 1,
        "proxied": True,
        "comment": "Catsoft tools Worker hostname",
    }

    if records:
        for record in records[1:]:
            request("DELETE", f"/zones/{zone_id}/dns_records/{record['id']}")
        request("PUT", f"/zones/{zone_id}/dns_records/{records[0]['id']}", payload)
        print(f"DNS OK  {hostname} A {DNS_TARGET} (proxied)")
        return

    request("POST", f"/zones/{zone_id}/dns_records", payload)
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
        upsert_dns_record(zone_id, hostname)
        upsert_worker_route(zone_id, hostname)
        upsert_worker_route(zone_id, f"{hostname}/")
        upsert_worker_route(zone_id, f"{hostname}/*")

    print("Done. Tunggu propagasi DNS Cloudflare beberapa menit, lalu buka admin/supplier subdomain.")


if __name__ == "__main__":
    main()
