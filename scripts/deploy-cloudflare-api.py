#!/usr/bin/env python3
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path


ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "9b19f1b31d88513e013d1a522e583c08")
API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN") or os.environ.get("CF_API_TOKEN")
SCRIPT_NAME = os.environ.get("CLOUDFLARE_WORKER_NAME", "catsoft")
ROOT = Path(__file__).resolve().parents[1]
SCHEMA_FILE = ROOT / "cloudflare-email-schema.sql"
WORKER_FILE = ROOT / "cloudflare-email-worker.example.js"
ROUTES_FILE = ROOT / "cloudflare-worker-routes.txt"

DATABASES = {
    "ADMIN_DB": "05cdff0f-1d32-49a3-97d0-1e240655c66c",
    "CUSTOMER_DB": "1e575674-84ef-4f09-a151-6f80e36bab5d",
    "EMAIL_DB": "17d3485b-c3f1-40a7-b583-f58ebd63bd87",
}


def die(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def request(method, path, payload=None, headers=None, raw_body=None):
    if not API_TOKEN:
      die("Missing CLOUDFLARE_API_TOKEN or CF_API_TOKEN.")

    body = raw_body
    final_headers = {
        "Authorization": f"Bearer {API_TOKEN}",
    }
    if headers:
        final_headers.update(headers)

    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        final_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4{path}",
        data=body,
        headers=final_headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            text = res.read().decode("utf-8")
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as error:
        text = error.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(text)
            message = json.dumps(parsed.get("errors") or parsed, indent=2)
        except Exception:
            message = text
        die(f"Cloudflare API error {method} {path} {error.code}\n{message}")


def split_sql(sql):
    lines = []
    for line in sql.splitlines():
        stripped = line.strip()
        if stripped.startswith("--"):
            continue
        lines.append(line)
    cleaned = "\n".join(lines)
    return [statement.strip() for statement in cleaned.split(";") if statement.strip()]


def migrate_d1():
    sql = SCHEMA_FILE.read_text()
    statements = split_sql(sql)
    for name, database_id in DATABASES.items():
        print(f"Migrating {name}...")
        for statement in statements:
            response = request(
                "POST",
                f"/accounts/{ACCOUNT_ID}/d1/database/{database_id}/query",
                {"sql": statement},
            )
            if response.get("success") is False:
                die(f"D1 migration failed for {name}: {response}")
    print("D1 migration done.")


def upload_worker():
    print(f"Uploading Worker {SCRIPT_NAME}...")
    metadata = {
        "main_module": WORKER_FILE.name,
        "compatibility_date": "2026-05-25",
        "bindings": [
            {"type": "d1", "name": name, "id": database_id}
            for name, database_id in DATABASES.items()
        ] + [
            {"type": "plain_text", "name": "FORWARD_TO", "text": "cundigitora@gmail.com"},
            {"type": "plain_text", "name": "ALLOW_UNAUTHENTICATED_API", "text": "true"},
        ],
        "keep_assets": True,
        "annotations": {
            "workers/message": "Catsoft admin tools update",
            "workers/tag": "catsoft-admin-tools",
        },
    }
    boundary = f"----catsoft{uuid.uuid4().hex}"
    parts = []

    def add_part(name, value, content_type="application/json", filename=None):
        disposition = f'form-data; name="{name}"'
        if filename:
            disposition += f'; filename="{filename}"'
        headers = (
            f"--{boundary}\r\n"
            f"Content-Disposition: {disposition}\r\n"
            f"Content-Type: {content_type}\r\n\r\n"
        )
        parts.append(headers.encode("utf-8") + value + b"\r\n")

    add_part("metadata", json.dumps(metadata).encode("utf-8"))
    add_part(
        WORKER_FILE.name,
        WORKER_FILE.read_bytes(),
        content_type="application/javascript+module",
        filename=WORKER_FILE.name,
    )
    body = b"".join(parts) + f"--{boundary}--\r\n".encode("utf-8")
    response = request(
        "PUT",
        f"/accounts/{ACCOUNT_ID}/workers/scripts/{SCRIPT_NAME}",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        raw_body=body,
    )
    if response.get("success") is False:
        die(f"Worker upload failed: {response}")
    print("Worker upload done.")


def zone_name_for_pattern(pattern):
    host = pattern.split("/", 1)[0]
    if host.startswith("www."):
        host = host[4:]
    return ".".join(host.split(".")[-2:])


def get_zone_id(zone_name):
    query = urllib.parse.urlencode({"name": zone_name, "account.id": ACCOUNT_ID})
    response = request("GET", f"/zones?{query}")
    result = response.get("result") or []
    return result[0]["id"] if result else ""


def migrate_routes():
    print("Migrating routes...")
    patterns = [
        line.strip()
        for line in ROUTES_FILE.read_text().splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    zone_ids = {}
    for pattern in patterns:
        zone_name = zone_name_for_pattern(pattern)
        zone_id = zone_ids.get(zone_name) or get_zone_id(zone_name)
        if not zone_id:
            die(f"Zone not found for {pattern}")
        zone_ids[zone_name] = zone_id
        routes = request("GET", f"/zones/{zone_id}/workers/routes").get("result") or []
        existing = next((route for route in routes if route.get("pattern") == pattern), None)
        if existing and existing.get("script") == SCRIPT_NAME:
            print(f"OK    {pattern}")
            continue
        if existing:
            request("DELETE", f"/zones/{zone_id}/workers/routes/{existing['id']}")
        request(
            "POST",
            f"/zones/{zone_id}/workers/routes",
            {"pattern": pattern, "script": SCRIPT_NAME},
        )
        print(f"SET   {pattern}")
    print("Routes done.")


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else "all"
    if action in ("all", "d1"):
        migrate_d1()
    if action in ("all", "worker"):
        upload_worker()
    if action in ("all", "routes"):
        migrate_routes()


if __name__ == "__main__":
    main()
