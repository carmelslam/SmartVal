# tools/parts_search/supabase_io.py
import os, requests
from typing import List, Dict, Any, Optional

# ---- Env ----
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SERVICE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")

# Try SDK; if missing, we auto-fallback to REST
try:
    from supabase import create_client, Client  # type: ignore
    _SDK_AVAILABLE = True
except Exception:
    _SDK_AVAILABLE = False

REST_BASE = f"{SUPABASE_URL}/rest/v1"
STORAGE_BASE = f"{SUPABASE_URL}/storage/v1"

def _headers(json: bool = True, extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    h = {"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY}
    if json:
        h["Content-Type"] = "application/json"
    if extra:
        h.update(extra)
    return h

# ---------------- Core (kept API) ----------------

def get_client():
    """Return Supabase SDK client if available; else None (REST will be used)."""
    if _SDK_AVAILABLE:
        return create_client(SUPABASE_URL, SERVICE_KEY)
    return None

def upsert_rows(table_name: str, rows: List[Dict[str, Any]], on_conflict: str = "row_hash") -> int:
    """Upsert rows into a table. Uses SDK if available, otherwise REST (PostgREST)."""
    if not rows:
        return 0
    if _SDK_AVAILABLE:
        client = get_client()
        client.table(table_name).upsert(rows, on_conflict=on_conflict).execute()
        return len(rows)

    # REST fallback
    url = f"{REST_BASE}/{table_name}?on_conflict={on_conflict}"
    r = requests.post(
        url,
        headers=_headers(True, {"Prefer": "resolution=merge-duplicates"}),
        json=rows,
        timeout=60,
    )
    if r.status_code not in (201, 204):
        raise RuntimeError(f"Upsert {table_name} failed ({r.status_code}): {r.text}")
    return len(rows)

def upsert_supplier(slug: str, name: str):
    """Create/update a supplier row (public.suppliers with UNIQUE slug)."""
    payload = [{"slug": slug, "name": name, "type": "catalog"}]

    if _SDK_AVAILABLE:
        client = get_client()
        client.table("suppliers").upsert(payload, on_conflict="slug").execute()
        return {"slug": slug, "name": name, "type": "catalog"}

    url = f"{REST_BASE}/suppliers?on_conflict=slug"
    r = requests.post(
        url,
        headers=_headers(True, {"Prefer": "resolution=merge-duplicates"}),
        json=payload,
        timeout=30,
    )
    if r.status_code not in (201, 204):
        raise RuntimeError(f"Upsert suppliers failed ({r.status_code}): {r.text}")
    return {"slug": slug, "name": name, "type": "catalog"}

def upsert_catalog(supplier_slug: str, version_date: str, source_path: str):
    """No-op unless you add a catalogs table (kept for compatibility)."""
    return True

def mark_catalog_done(supplier_slug: str, version_date: str):
    """No-op unless you add a catalogs table (kept for compatibility)."""
    return True

# ------------- Storage helpers (new, safe to use anywhere) -------------

def download_signed(signed_url: str) -> bytes:
    """GET a signed URL (private bucket)."""
    r = requests.get(signed_url, timeout=600)
    r.raise_for_status()
    return r.content

def storage_put(path: str, content: bytes, content_type: str):
    """Upload to Storage via REST. path example: vendor_parsed/m-pines/2025-06.ndjson"""
    url = f"{STORAGE_BASE}/object/{path}"
    r = requests.put(
        url,
        headers=_headers(False, {"Content-Type": content_type, "x-upsert": "true"}),
        data=content,
        timeout=120,
    )
    r.raise_for_status()

def sign_object(path: str, expires_in: int = 10800) -> str:
    """Create a signed URL for a stored object and return an absolute URL."""
    url = f"{STORAGE_BASE}/object/sign/{path}"
    r = requests.post(
        url,
        headers=_headers(True),
        json={"expiresIn": expires_in},
        timeout=60,
    )
    r.raise_for_status()
    rel = r.json().get("signedURL")
    return f"{STORAGE_BASE}{rel}"  # API returns /object/sign/...; prefix it