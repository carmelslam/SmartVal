Short answer to both:

1) Can you access it, or is there a bot blocker?
The PDFs on m-pines.com are public under /wp-content/uploads/... and load directly (examples: 2025-06, 2025-05, 2023-01). I see no login wall or obvious bot protection on those files. So yes—you can fetch them programmatically with a normal GET.  

⸻

2) Easiest, efficient, and sustainable method (works for MANY suppliers, not just this one)

Go with this simple 3-piece architecture. It’s easy to operate, scales to 2,000-page PDFs, and reuses the same flow for every vendor.

A) Supabase (one-time setup)
	•	Storage bucket: vendor_raw (private).
	•	Tables:
	•	suppliers(id, slug, name, homepage, pdf_discovery_regex)
	•	catalogs(id, supplier_id, version_date, source_url, storage_path, status, processed_at)
	•	catalog_items(id, supplier_id, catalog_id, category, item_code, item_name, unit, price_nis, row_hash, raw_row jsonb)
	•	Add GIN (full-text) + trigram indexes for fast search.

(If you want, I’ll give you exact SQL once you confirm column names you care about.)

B) One Make.com scenario for all suppliers (no Google Drive needed)
	1.	HTTP GET {{supplier.homepage}}
	2.	HTML to text
	3.	Match pattern (global) to find the first PDF URL:

https?://[^\s"'<>]+\.pdf


	4.	HTTP GET the pdf_url (Download = Yes).
	5.	HTTP POST → Supabase Storage:
.../storage/v1/object/vendor_raw/{{supplier.slug}}/{{YYYY}}-{{MM}}.pdf
	6.	HTTP POST → Supabase Storage sign URL (expires 1–3h).
	7.	HTTP POST → Parser webhook with:

{
  "supplier_id": "{{supplier.id}}",
  "catalog_id": "{{catalog.id}}",
  "version_date": "{{YYYY}}-{{MM}}-01",
  "signed_url": "<signed download link>",
  "storage_path": "vendor_raw/{{supplier.slug}}/{{YYYY}}-{{MM}}.pdf"
}


	8.	Update catalogs.status → “queued”.

This is the whole Make flow. It doesn’t store to Google Drive and it’s reusable: just change the supplier record (homepage + regex) to run it for another site.

C) One parser job (shared for ALL suppliers)

Pick one of these two—both are easy and cheap:
	•	Option 1 (recommended): GitHub Action that runs on a schedule or when Make “queues” a catalog.
The Action:
	•	downloads the PDF via the signed URL,
	•	extracts rows (table parser; OCR only if needed),
	•	streams batches (e.g., 500–1,000 rows) into catalog_items via Supabase REST upsert (on row_hash),
	•	marks catalogs.status = 'done'.
	•	Option 2: Cloud Run/Lambda small HTTP service.
Same steps, but you trigger it via the webhook from Make and it returns immediately while processing in the background.

Why this is the easiest long-term:
	•	Make.com handles discovery and storage (no code).
	•	One shared parser handles any supplier PDF—your Make scenario never changes.
	•	Supabase is your single source of truth: Storage keeps originals; DB keeps searchable rows.
	•	It scales to very large PDFs because parsing happens outside Make and upserts are batched.

⸻

Your search UI (single table across all suppliers)

Query one table (catalog_items) with a supplier filter:

// example
.from('catalog_items')
.select('supplier_id,item_code,item_name,category,unit,price_nis,version_date')
.eq('supplier_id', wantedSupplierId)           // or remove to search all
.or(`item_name.ilike.%${q}%,item_code.ilike.%${q}%`)
.order('version_date', { ascending: false })
.limit(200)

Because every row has supplier_id and catalog_id, you can show results mixed or per supplier, and always know which PDF/month they came from.

⸻

Notes specific to m-pines.com
	•	Direct PDF access works (examples above). If they later add basic rate-limits, your flow still works because it’s one polite request per month per supplier.  

⸻

If you want, I’ll hand you:
	•	the SQL for the three tables with the right indexes,
	•	a Make step-by-step (exact URLs/headers for Supabase Storage + sign URL), and
	•	a ready GitHub Action (workflow.yml + parse.py) that you just drop into a repo.



Perfect — then design everything around (part name + car details filters). Here’s a tight, future-proof setup you can reuse for ANY supplier.

1) Minimal, reusable data model (Supabase)

Use one main table for searchable rows. Keep suppliers/vehicles normalized so you can filter fast.

-- Suppliers
create table if not exists suppliers (
  id bigserial primary key,
  slug text unique not null,           -- e.g., 'm-pines'
  name text not null
);

-- Vehicle dimension (normalized, optional but recommended)
create table if not exists vehicles (
  id bigserial primary key,
  make text not null,                  -- e.g., 'Toyota'
  model text,                          -- e.g., 'Corolla'
  year int,                            -- e.g., 2018
  trim text,                           -- e.g., 'LE'
  engine text,                         -- e.g., '1.8L'
  unique (make, model, year, trim, engine)
);

-- Catalogs (one per monthly PDF/file per supplier)
create table if not exists catalogs (
  id bigserial primary key,
  supplier_id bigint references suppliers(id) on delete cascade not null,
  version_date date not null,
  source_url text not null,            -- original URL or storage path
  status text default 'done',
  processed_at timestamptz default now()
);

-- Searchable rows (one per part/line)
create table if not exists catalog_items (
  id bigserial primary key,
  supplier_id bigint references suppliers(id) on delete cascade not null,
  catalog_id bigint references catalogs(id) on delete cascade not null,
  vehicle_id bigint references vehicles(id) on delete set null, -- link if known
  make text, model text, year int, trim text, engine text,      -- denormalized for simple filters
  part_group text,                 -- e.g., 'Body > Doors'
  part_name text not null,         -- search target
  oem_code text,
  alt_codes text[],                -- optional array (cross refs)
  unit text,                       -- 'pcs', 'set', 'יח׳'
  currency text default 'ILS',
  price numeric,
  availability text,               -- 'in_stock', 'order', etc. (optional)
  version_date date not null,      -- copy from catalogs
  row_hash text not null unique,   -- sha1(version_date|supplier|make|model|year|part_name|oem_code|unit|price)
  raw_row jsonb not null,          -- whole parsed row for audit
  inserted_at timestamptz default now()
);

-- Indexes for fast search
create extension if not exists pg_trgm;

create index if not exists catalog_items_text_idx on catalog_items
using gin (to_tsvector('simple',
  coalesce(part_name,'') || ' ' ||
  coalesce(part_group,'') || ' ' ||
  coalesce(oem_code,'') || ' ' ||
  coalesce(make,'') || ' ' || coalesce(model,'')
));

create index if not exists catalog_items_partname_trgm on catalog_items
using gin (part_name gin_trgm_ops);

create index if not exists catalog_items_oem_trgm on catalog_items
using gin (oem_code gin_trgm_ops);

create index if not exists catalog_items_vehicle_filters
on catalog_items (make, model, year, trim, engine, version_date desc);

Why this works:
	•	part_name is full-text + trigram indexed for fuzzy Hebrew/English matches.
	•	make/model/year/trim/engine are plain columns so you can filter quickly.
	•	row_hash prevents duplicates on re-ingest.
	•	raw_row keeps the original supplier row for audit.

2) Ingestion (one parser for all suppliers)

Make your parser output a uniform JSON per row (even if each supplier formats differently). Example:

{
  "supplier_slug": "m-pines",
  "catalog_version_date": "2025-06-01",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2018,
  "trim": "LE",
  "engine": "1.8L",
  "part_group": "Body > Doors",
  "part_name": "Front left door shell",
  "oem_code": "67002-12A30",
  "alt_codes": ["6700212A30", "67002-12A31"],
  "unit": "pcs",
  "currency": "ILS",
  "price": 1290.00,
  "availability": "in_stock",
  "raw_row": {"cells": ["... original cells ..."]}
}

Your parser should:
	•	Upsert the supplier by slug.
	•	Upsert/find the vehicle by (make, model, year, trim, engine) and set vehicle_id.
	•	Create/find the catalog (supplier_id + version_date).
	•	Build row_hash = sha1(version_date|supplier_slug|make|model|year|part_name|oem_code|unit|price).
	•	Bulk upsert rows into catalog_items with on_conflict=row_hash.

You can do all upserts via Supabase REST from the parser (batch of 500–1000 items per call).

3) Make.com flow (simple, reusable)
	•	Get homepage → extract .pdf URL (regex)
	•	GET PDF (binary) → Upload to Supabase Storage vendor_raw/{supplier_slug}/{YYYY}-{MM}.pdf
	•	Sign URL (1–3h) → Call parser webhook with { supplier_slug, version_date, signed_url, storage_path }

Parser fetches the file, parses, and upserts. Make stays light. No Google Drive.

4) Search API (one RPC for precise + fuzzy)

Create one RPC that accepts the car details + a part name query and returns best matches, most-recent first:

create or replace function search_catalog_items(
  p_make text default null,
  p_model text default null,
  p_year int default null,
  p_trim text default null,
  p_engine text default null,
  p_q text default null,           -- user's part name or OEM code
  p_supplier_slug text default null
)
returns setof catalog_items
language sql stable as $$
  with base as (
    select ci.*
    from catalog_items ci
    join suppliers s on s.id = ci.supplier_id
    where (p_supplier_slug is null or s.slug = p_supplier_slug)
      and (p_make   is null or ci.make   ilike p_make)
      and (p_model  is null or ci.model  ilike p_model)
      and (p_year   is null or ci.year   = p_year)
      and (p_trim   is null or ci.trim   ilike p_trim)
      and (p_engine is null or ci.engine ilike p_engine)
      and (
           p_q is null
        or  to_tsvector('simple', coalesce(ci.part_name,'') || ' ' || coalesce(ci.part_group,'') || ' ' || coalesce(ci.oem_code,''))
            @@ plainto_tsquery('simple', p_q)
        or  ci.part_name ilike '%'||p_q||'%'
        or  ci.oem_code ilike '%'||p_q||'%'
      )
  )
  select *
  from base
  order by version_date desc, part_name asc
  limit 300;
$$;

Client call (Supabase JS):

const { data, error } = await supabase.rpc('search_catalog_items', {
  p_make:   make || null,
  p_model:  model || null,
  p_year:   year || null,
  p_trim:   trim || null,
  p_engine: engine || null,
  p_q:      query || null,
  p_supplier_slug: supplierSlug || null
});

5) UX tips (so results feel smart)
	•	Autocomplete: use a lightweight endpoint that returns top part_name suggestions for given make/model/year.
	•	Hebrew/English: normalize input (trim spaces, unify apostrophes), and keep both trigram and full-text (we did).
	•	Sort: newest version_date first, then price ascending or part_name A→Z.
	•	Show provenance: display supplier + month so users know the catalog version.

6) What YOU need to implement now (short checklist)
	1.	Create the tables & indexes above in Supabase.
	2.	Implement the Make discovery+upload+sign steps (3–4 modules).
	3.	Deploy one parser (GitHub Action or Cloud Run) that:
	•	reads the signed URL,
	•	outputs uniform JSON rows,
	•	bulk-upserts to catalog_items (and upserts suppliers/vehicles/catalogs as needed).
	4.	Add the RPC and connect your UI with the JS snippet.

If you want, I’ll give you:
	•	a ready SQL pack to paste,
	•	a parser skeleton (Python) that you run as a GitHub Action (no servers), and
	•	the exact Make module settings (URLs, headers, and example payloads).



More : 
Got it. Here’s a clean, production-ready approach that (1) always finds the latest PDF even if the filename changes, and (2) parses + stores rows into a Supabase table your search UI can query.

⸻

Plan (no fluff)
	1.	Discover the latest PDF
	•	Try /sitemap.xml → follow child sitemaps → collect any URLs ending in .pdf.
	•	Fallback: parse the homepage (and any “Price list / מחירון” page) for .pdf links.
	•	Rank candidates by:
	•	Last-Modified (HTTP HEAD) if present; else
	•	date in filename (e.g., מחירון-06-25.pdf → 2025-06-01); else
	•	most recent URL path segment (e.g., /2025/06/…).
	2.	Download the newest PDF (URL-encoding Hebrew path segments).
	3.	Extract tables
	•	First try pdfplumber to get structured tables page-by-page.
	•	If no tables found, fallback to PyMuPDF text with a simple column splitter (multiple-space regex).
	•	Normalize to rows with fields you care about (e.g., category, item_code, item_name, unit, price_nis), but keep the raw row for safety.
	4.	Upsert into Supabase
	•	Table has a unique row_hash (SHA1 of version_date + item_code + item_name + unit + price_nis) so re-runs won’t duplicate.
	•	Store source_url, version_date, and raw_row (JSON) for audit.
	•	Optional: mark a batch with import_id for easy rollback.
	5.	Search module
	•	Add full-text (tsvector) and trigram indexes (Hebrew friendly) for fast search by item name / category / code.

⸻

Supabase schema (run once)

create extension if not exists pg_trgm;

create table if not exists mpines_prices (
  id           bigserial primary key,
  source_url   text not null,
  version_date date not null,
  category     text,
  item_code    text,
  item_name    text,
  unit         text,
  price_nis    numeric,
  raw_row      jsonb not null,
  row_hash     text not null unique,
  import_id    uuid default gen_random_uuid(),
  inserted_at  timestamptz default now()
);

-- Full-text (use 'simple' or 'hebrew' if enabled on your instance)
create index if not exists mpines_prices_ft_idx
  on mpines_prices using gin (to_tsvector('simple',
    coalesce(category,'') || ' ' || coalesce(item_name,'') || ' ' || coalesce(item_code,'')
));

-- Fuzzy (trigram) for partial matches
create index if not exists mpines_prices_name_trgm_idx
  on mpines_prices using gin (item_name gin_trgm_ops);

create index if not exists mpines_prices_code_trgm_idx
  on mpines_prices using gin (item_code gin_trgm_ops);


⸻

Python scraper → parser → Supabase upsert

Save as mpines_ingest.py.

import os, re, io, hashlib, datetime, json, time
from urllib.parse import urljoin, urlparse, quote
import requests
from bs4 import BeautifulSoup
import pdfplumber
import fitz  # PyMuPDF
from supabase import create_client, Client  # pip install supabase==2.* requests bs4 pdfplumber pymupdf

BASE = "https://m-pines.com/"

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]  # prefer service key on server-side

def _safe_url(u: str) -> str:
    p = urlparse(u)
    return p._replace(path=quote(p.path)).geturl()

def _head_last_modified(u: str) -> datetime.datetime | None:
    try:
        r = requests.head(_safe_url(u), timeout=15, allow_redirects=True)
        if "Last-Modified" in r.headers:
            return datetime.datetime.strptime(r.headers["Last-Modified"], "%a, %d %b %Y %H:%M:%S %Z")
    except Exception:
        pass
    return None

def _date_from_filename(u: str) -> datetime.date | None:
    name = urlparse(u).path.split("/")[-1]
    m = re.search(r"(\d{2})[-_\.](\d{2})", name)
    if m:
        mm, yy = m.groups()
        # Assume yy is 2000+yy (e.g., 25 -> 2025)
        year = 2000 + int(yy)
        month = int(mm)
        return datetime.date(year, month, 1)
    return None

def discover_pdf_candidates() -> list[str]:
    urls = set()
    # 1) sitemap.xml if exists
    try:
        sm = requests.get(urljoin(BASE, "sitemap.xml"), timeout=20)
        if sm.ok and sm.text:
            soup = BeautifulSoup(sm.text, "xml")
            for loc in soup.find_all("loc"):
                loc_url = loc.text.strip()
                if loc_url.lower().endswith(".xml"):
                    # child sitemap
                    s2 = requests.get(loc_url, timeout=20)
                    if s2.ok:
                        s2soup = BeautifulSoup(s2.text, "xml")
                        for loc2 in s2soup.find_all("loc"):
                            u = loc2.text.strip()
                            if u.lower().endswith(".pdf"):
                                urls.add(u)
                elif loc_url.lower().endswith(".pdf"):
                    urls.add(loc_url)
    except Exception:
        pass

    # 2) homepage fallback
    try:
        r = requests.get(BASE, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if ".pdf" in href.lower():
                urls.add(urljoin(BASE, href))
    except Exception:
        pass

    return sorted(urls)

def choose_latest_pdf(candidates: list[str]) -> str | None:
    if not candidates:
        return None
    scored = []
    for u in candidates:
        lm = _head_last_modified(u)
        fn_date = _date_from_filename(u)
        # Score tuple: (has Last-Modified, last_modified_ts, filename_date or 0, path yyyy/mm guess)
        ts = int(lm.timestamp()) if lm else 0
        fn_ts = int(datetime.datetime.combine(fn_date, datetime.time(0,0)).timestamp()) if fn_date else 0
        path = urlparse(u).path
        path_m = re.search(r"/(20\d{2})/(\d{2})/", path)
        path_ts = 0
        if path_m:
            year = int(path_m.group(1)); month = int(path_m.group(2))
            path_ts = int(datetime.datetime(year, month, 1).timestamp())
        scored.append((1 if lm else 0, ts, fn_ts, path_ts, u))
        time.sleep(0.2)  # be polite
    scored.sort(reverse=True)
    return scored[0][-1]

def download_pdf(url: str) -> bytes:
    r = requests.get(_safe_url(url), timeout=60)
    r.raise_for_status()
    return r.content

def extract_rows(pdf_bytes: bytes) -> list[dict]:
    rows = []

    # Try pdfplumber tables
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            try:
                tables = page.extract_tables()
            except Exception:
                tables = []
            for tbl in tables or []:
                # Heuristic: drop all-empty rows and 1-col rows that are pure headers
                if not tbl: continue
                for raw in tbl:
                    if not any(c and str(c).strip() for c in raw):
                        continue
                    # Normalize columns count (pad to 5)
                    cells = [ (c or "").strip() for c in raw ]
                    while len(cells) < 5: cells.append("")
                    # Map heuristically: adjust to your PDF columns
                    category, item_code, item_name, unit, price = cells[:5]
                    price_nis = _parse_price(price)
                    rows.append({
                        "category": category or None,
                        "item_code": item_code or None,
                        "item_name": item_name or None,
                        "unit": unit or None,
                        "price_nis": price_nis,
                        "raw_row": {"cells": cells}
                    })

    # Fallback if no rows found: basic text splitter
    if not rows:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        for page in doc:
            text = page.get_text("text")
            for line in text.splitlines():
                # split on 2+ spaces
                parts = re.split(r"\s{2,}", line.strip())
                if len(parts) >= 2:
                    # Very loose mapping: last token as price if it looks like a number
                    price_nis = _parse_price(parts[-1])
                    unit = None
                    if price_nis is not None:
                        core = parts[:-1]
                    else:
                        core = parts
                    item_name = " ".join(core).strip()
                    if item_name:
                        rows.append({
                            "category": None,
                            "item_code": None,
                            "item_name": item_name,
                            "unit": unit,
                            "price_nis": price_nis,
                            "raw_row": {"line": line}
                        })
    return _dedupe(rows)

def _parse_price(s: str) -> float | None:
    if not s: return None
    ss = s.replace(",", "").replace("₪", "").strip()
    m = re.match(r"^\d+(\.\d+)?$", ss)
    return float(ss) if m else None

def _dedupe(rows: list[dict]) -> list[dict]:
    seen = set(); out = []
    for r in rows:
        key = json.dumps([r.get("category"), r.get("item_code"), r.get("item_name"), r.get("unit"), r.get("price_nis")], ensure_ascii=False)
        if key in seen: continue
        seen.add(key); out.append(r)
    return out

def infer_version_date(url: str, last_modified: datetime.datetime | None) -> datetime.date:
    d = _date_from_filename(url)
    if d: return d
    if last_modified: return last_modified.date()
    return datetime.date.today()

def row_hash(version_date: datetime.date, r: dict) -> str:
    basis = f"{version_date}|{r.get('item_code') or ''}|{r.get('item_name') or ''}|{r.get('unit') or ''}|{r.get('price_nis') or ''}"
    return hashlib.sha1(basis.encode("utf-8")).hexdigest()

def upsert_supabase(rows: list[dict], source_url: str, version_date: datetime.date) -> int:
    sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    payload = []
    for r in rows:
        payload.append({
            "source_url": source_url,
            "version_date": str(version_date),
            "category": r.get("category"),
            "item_code": r.get("item_code"),
            "item_name": r.get("item_name"),
            "unit": r.get("unit"),
            "price_nis": r.get("price_nis"),
            "raw_row": r.get("raw_row"),
            "row_hash": row_hash(version_date, r),
        })
    if not payload:
        return 0
    # Upsert on row_hash
    res = sb.table("mpines_prices").upsert(payload, on_conflict="row_hash").execute()
    # supabase-py v2 returns data in res.data
    return len(res.data) if res and res.data is not None else 0

def main():
    cands = discover_pdf_candidates()
    if not cands:
        raise SystemExit("No PDF candidates found.")
    url = choose_latest_pdf(cands)
    if not url:
        raise SystemExit("Could not choose latest PDF.")
    lm = _head_last_modified(url)
    ver_date = infer_version_date(url, lm)
    pdf_bytes = download_pdf(url)
    rows = extract_rows(pdf_bytes)
    inserted = upsert_supabase(rows, url, ver_date)
    print(f"Discovered: {url}")
    print(f"Version date: {ver_date}  | Rows parsed: {len(rows)}  | Upserted/updated: {inserted}")

if __name__ == "__main__":
    main()

Environment variables (server side):

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...

Use the service role key only on a trusted server (not in the browser).

⸻

Hooking your search module

Option A — Supabase JS (client-side):

import { createClient } from '@supabase/supabase-js'
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export async function searchPrices(q) {
  // fuzzy match on item_name and code; you can also use RPC for full-text
  const { data, error } = await supabase
    .from('mpines_prices')
    .select('item_code,item_name,category,unit,price_nis,version_date')
    .or(`item_name.ilike.%${q}%,item_code.ilike.%${q}%`)
    .limit(100)
  if (error) throw error
  return data
}

Option B — a performant SQL view/RPC (server-side full-text):

create or replace view mpines_prices_search as
select
  id, source_url, version_date, category, item_code, item_name, unit, price_nis,
  to_tsvector('simple', coalesce(category,'')||' '||coalesce(item_name,'')||' '||coalesce(item_code,'')) as doc
from mpines_prices;

-- RPC
create or replace function search_mpines(q text)
returns setof mpines_prices
language sql stable as $$
  select *
  from mpines_prices
  where to_tsvector('simple', coalesce(category,'')||' '||coalesce(item_name,'')||' '||coalesce(item_code,'')) @@ plainto_tsquery('simple', q)
  order by version_date desc, item_name asc
  limit 200;
$$;

Then call via Supabase JS:

const { data, error } = await supabase.rpc('search_mpines', { q: userQuery })


⸻

Notes & tuning
	•	Hebrew/RTL: Everything is UTF-8; pdfplumber generally preserves Hebrew text but some PDFs may have glyph encoding quirks. If rows look jumbled, try pdfplumber.open(..., laparams={"detect_vertical": True}) or switch to Tabula (“tabula-py”) for stubborn tables.
	•	OCR fallback: If your parsed rows are empty and the PDF is a scan, run ocrmypdf before extraction (you can shell out in the script).
	•	Change detection: Because we upsert by row_hash per version_date, re-running monthly is safe. If the vendor revises the same month’s file, new/changed rows get updated.
	•	Scheduling: cron on a VPS or a GitHub Action monthly is enough (e.g., first day of month 07:05).

⸻

If you want, I can tailor the column mapping once you show me one actual exported table page (image or sample PDF) so the parser maps precisely (e.g., “קטגוריה / מספר פריט / פריט / יחידה / מחיר”).

Got it. Let’s keep this super practical and in the right order:

1) Tools to get the PDF (pick one)

A) Zero-code (Make.com) – simplest
	•	Modules you need:
	1.	HTTP > Make a request (GET) → fetch the PDF URL
	2.	Tools > Set variable (optional: filename)
	3.	OneDrive / Google Drive > Upload a file (store it), and/or
	4.	Webhook response (return the file to your UI or store the binary for next step)
	•	If the filename changes each month: add one HTTP GET to the homepage (or a known page that links the “מחירון/Price List”) → Parse HTML with HTML to text → Match pattern to capture the first link that ends with .pdf → feed that URL into the GET step.

Regex to capture a .pdf link in the HTML-to-text output (Match pattern - global):

https?://[^\s"'<>]+\.pdf

B) Quick command line (for testing only)
	•	Install curl, then:

curl -L -o latest.pdf "PASTE-THE-ENCODED-PDF-URL-HERE"

C) Tiny Python downloader (auto-finds the current PDF on the homepage)

Install once:

python3 -m pip install requests beautifulsoup4

Script:

# fetch_latest_pdf.py
import re, requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, quote

BASE = "https://m-pines.com/"

def safe_url(u):
    p = urlparse(u)
    return p._replace(path=quote(p.path)).geturl()

def find_pdf_url():
    r = requests.get(BASE, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    for a in soup.find_all("a", href=True):
        if ".pdf" in a["href"].lower():
            return urljoin(BASE, a["href"])
    raise SystemExit("No PDF link found on homepage.")

def download(url, out="latest.pdf"):
    r = requests.get(safe_url(url), timeout=60)
    r.raise_for_status()
    with open(out, "wb") as f: f.write(r.content)
    print("Saved:", out)

if __name__ == "__main__":
    url = find_pdf_url()
    print("PDF:", url)
    download(url, "latest.pdf")

Run:

python3 fetch_latest_pdf.py


⸻

2) Tools to parse the PDF (turn it into rows)

You have two cases:

Case 1 — Text-based PDF (most WordPress PDFs)

Use pdfplumber (easier for tables).

Install:

python3 -m pip install pdfplumber

Code (extract rows; you’ll tune the column mapping later):

# parse_pdf.py
import pdfplumber, json, re

def parse_price_pdf(path="latest.pdf"):
    rows = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables() or []
            for tbl in tables:
                for r in tbl:
                    if not r or not any((c or "").strip() for c in r):
                        continue
                    cells = [(c or "").strip() for c in r]
                    # Heuristic: expect first 5 columns as [category, code, name, unit, price]
                    while len(cells) < 5: cells.append("")
                    category, code, name, unit, price = cells[:5]
                    # normalize price
                    price_clean = re.sub(r"[^\d.]", "", price or "")
                    price_val = float(price_clean) if price_clean else None
                    rows.append({
                        "category": category or None,
                        "item_code": code or None,
                        "item_name": name or None,
                        "unit": unit or None,
                        "price_nis": price_val,
                        "raw_cells": cells
                    })
    return rows

if __name__ == "__main__":
    data = parse_price_pdf("latest.pdf")
    print(json.dumps(data[:10], ensure_ascii=False, indent=2))

Case 2 — Scanned PDF (no selectable text)

Use OCR once → then parse with the same code:

Install on macOS (Homebrew):

brew install tesseract ocrmypdf

Run OCR:

ocrmypdf latest.pdf latest_ocr.pdf

Then parse latest_ocr.pdf with the same parse_pdf.py.

If tables still don’t extract cleanly, we can switch to Camelot or Tabula later — but start with pdfplumber.

⸻

3) Tools to store in Supabase and connect to your search

A) Minimal Supabase table (run once in SQL editor)

create extension if not exists pg_trgm;

create table if not exists mpines_prices (
  id           bigserial primary key,
  source_url   text not null,
  version_date date not null,
  category     text,
  item_code    text,
  item_name    text,
  unit         text,
  price_nis    numeric,
  raw_row      jsonb not null,
  row_hash     text not null unique,
  inserted_at  timestamptz default now()
);

create index if not exists mpines_prices_ft_idx
  on mpines_prices using gin (to_tsvector('simple',
    coalesce(category,'') || ' ' || coalesce(item_name,'') || ' ' || coalesce(item_code,'')
));
create index if not exists mpines_prices_name_trgm_idx
  on mpines_prices using gin (item_name gin_trgm_ops);

B) Python upsert into Supabase

Install:

python3 -m pip install supabase

Upsert script:

# upsert_supabase.py
import os, json, hashlib, datetime
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]  # server-side use only

def row_hash(version_date, r):
    basis = f"{version_date}|{r.get('item_code') or ''}|{r.get('item_name') or ''}|{r.get('unit') or ''}|{r.get('price_nis') or ''}"
    return hashlib.sha1(basis.encode("utf-8")).hexdigest()

def upsert(rows, source_url, version_date):
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    payload = []
    for r in rows:
        payload.append({
            "source_url": source_url,
            "version_date": str(version_date),
            "category": r.get("category"),
            "item_code": r.get("item_code"),
            "item_name": r.get("item_name"),
            "unit": r.get("unit"),
            "price_nis": r.get("price_nis"),
            "raw_row": r,  # keep raw
            "row_hash": row_hash(version_date, r),
        })
    if payload:
        sb.table("mpines_prices").upsert(payload, on_conflict="row_hash").execute()

if __name__ == "__main__":
    # Example wire-up: read parsed rows from a JSON file your parser produced
    rows = json.load(open("parsed.json","r", encoding="utf-8"))
    upsert(rows, source_url="https://m-pines.com", version_date=datetime.date.today())
    print("Upserted", len(rows))

C) Glue it together (one runner)

Create a simple runner that:
	1.	Finds & downloads latest.pdf
	2.	Parses rows
	3.	Saves parsed.json
	4.	Upserts to Supabase

python3 fetch_latest_pdf.py
python3 parse_pdf.py > parsed_preview.json  # to eyeball first 10 rows
python3 - <<'PY'
import json, datetime, os, re
from parse_pdf import parse_price_pdf
from upsert_supabase import upsert
rows = parse_price_pdf("latest.pdf")
json.dump(rows, open("parsed.json","w",encoding="utf-8"), ensure_ascii=False)
upsert(rows, "https://m-pines.com", datetime.date.today())
print("Done:", len(rows))
PY

Put those commands in a monthly cron on your server (e.g., day 1 at 07:05).

D) Your search module (client)

Basic JS using Supabase JS:

import { createClient } from '@supabase/supabase-js'
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export async function searchPrices(q) {
  const { data, error } = await supabase
    .from('mpines_prices')
    .select('item_code,item_name,category,unit,price_nis,version_date')
    .or(`item_name.ilike.%${q}%,item_code.ilike.%${q}%`)
    .order('version_date', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}


⸻

What to do right now (checklist)
	1.	Make.com route: build the 3-step flow (GET homepage → regex .pdf → GET file) so you can always fetch the newest PDF. Save to Drive/OneDrive.
	2.	Run the Python parser on one sample file (pdfplumber) and see if you get reasonable rows. If columns are off, send me one page screenshot and I’ll tighten the mapping.
	3.	Create the Supabase table (SQL above).
	4.	Set SUPABASE_URL and SUPABASE_SERVICE_KEY on your server (or a GitHub Action secret), then run the upsert script.
	5.	Wire your search UI to the mpines_prices table (JS snippet).

If you want, I’ll give you a Make.com-only variant (no Python): GET PDF → call a lightweight API I’ll sketch that runs pdfplumber (or OCR) and returns JSON → Make inserts rows via HTTP to Supabase REST.

Got it. Let’s keep this super practical and in the right order:

1) Tools to get the PDF (pick one)

A) Zero-code (Make.com) – simplest
	•	Modules you need:
	1.	HTTP > Make a request (GET) → fetch the PDF URL
	2.	Tools > Set variable (optional: filename)
	3.	OneDrive / Google Drive > Upload a file (store it), and/or
	4.	Webhook response (return the file to your UI or store the binary for next step)
	•	If the filename changes each month: add one HTTP GET to the homepage (or a known page that links the “מחירון/Price List”) → Parse HTML with HTML to text → Match pattern to capture the first link that ends with .pdf → feed that URL into the GET step.

Regex to capture a .pdf link in the HTML-to-text output (Match pattern - global):

https?://[^\s"'<>]+\.pdf

B) Quick command line (for testing only)
	•	Install curl, then:

curl -L -o latest.pdf "PASTE-THE-ENCODED-PDF-URL-HERE"

C) Tiny Python downloader (auto-finds the current PDF on the homepage)

Install once:

python3 -m pip install requests beautifulsoup4

Script:

# fetch_latest_pdf.py
import re, requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, quote

BASE = "https://m-pines.com/"

def safe_url(u):
    p = urlparse(u)
    return p._replace(path=quote(p.path)).geturl()

def find_pdf_url():
    r = requests.get(BASE, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    for a in soup.find_all("a", href=True):
        if ".pdf" in a["href"].lower():
            return urljoin(BASE, a["href"])
    raise SystemExit("No PDF link found on homepage.")

def download(url, out="latest.pdf"):
    r = requests.get(safe_url(url), timeout=60)
    r.raise_for_status()
    with open(out, "wb") as f: f.write(r.content)
    print("Saved:", out)

if __name__ == "__main__":
    url = find_pdf_url()
    print("PDF:", url)
    download(url, "latest.pdf")

Run:

python3 fetch_latest_pdf.py


⸻

2) Tools to parse the PDF (turn it into rows)

You have two cases:

Case 1 — Text-based PDF (most WordPress PDFs)

Use pdfplumber (easier for tables).

Install:

python3 -m pip install pdfplumber

Code (extract rows; you’ll tune the column mapping later):

# parse_pdf.py
import pdfplumber, json, re

def parse_price_pdf(path="latest.pdf"):
    rows = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables() or []
            for tbl in tables:
                for r in tbl:
                    if not r or not any((c or "").strip() for c in r):
                        continue
                    cells = [(c or "").strip() for c in r]
                    # Heuristic: expect first 5 columns as [category, code, name, unit, price]
                    while len(cells) < 5: cells.append("")
                    category, code, name, unit, price = cells[:5]
                    # normalize price
                    price_clean = re.sub(r"[^\d.]", "", price or "")
                    price_val = float(price_clean) if price_clean else None
                    rows.append({
                        "category": category or None,
                        "item_code": code or None,
                        "item_name": name or None,
                        "unit": unit or None,
                        "price_nis": price_val,
                        "raw_cells": cells
                    })
    return rows

if __name__ == "__main__":
    data = parse_price_pdf("latest.pdf")
    print(json.dumps(data[:10], ensure_ascii=False, indent=2))

Case 2 — Scanned PDF (no selectable text)

Use OCR once → then parse with the same code:

Install on macOS (Homebrew):

brew install tesseract ocrmypdf

Run OCR:

ocrmypdf latest.pdf latest_ocr.pdf

Then parse latest_ocr.pdf with the same parse_pdf.py.

If tables still don’t extract cleanly, we can switch to Camelot or Tabula later — but start with pdfplumber.

⸻

3) Tools to store in Supabase and connect to your search

A) Minimal Supabase table (run once in SQL editor)

create extension if not exists pg_trgm;

create table if not exists mpines_prices (
  id           bigserial primary key,
  source_url   text not null,
  version_date date not null,
  category     text,
  item_code    text,
  item_name    text,
  unit         text,
  price_nis    numeric,
  raw_row      jsonb not null,
  row_hash     text not null unique,
  inserted_at  timestamptz default now()
);

create index if not exists mpines_prices_ft_idx
  on mpines_prices using gin (to_tsvector('simple',
    coalesce(category,'') || ' ' || coalesce(item_name,'') || ' ' || coalesce(item_code,'')
));
create index if not exists mpines_prices_name_trgm_idx
  on mpines_prices using gin (item_name gin_trgm_ops);

B) Python upsert into Supabase

Install:

python3 -m pip install supabase

Upsert script:

# upsert_supabase.py
import os, json, hashlib, datetime
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]  # server-side use only

def row_hash(version_date, r):
    basis = f"{version_date}|{r.get('item_code') or ''}|{r.get('item_name') or ''}|{r.get('unit') or ''}|{r.get('price_nis') or ''}"
    return hashlib.sha1(basis.encode("utf-8")).hexdigest()

def upsert(rows, source_url, version_date):
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    payload = []
    for r in rows:
        payload.append({
            "source_url": source_url,
            "version_date": str(version_date),
            "category": r.get("category"),
            "item_code": r.get("item_code"),
            "item_name": r.get("item_name"),
            "unit": r.get("unit"),
            "price_nis": r.get("price_nis"),
            "raw_row": r,  # keep raw
            "row_hash": row_hash(version_date, r),
        })
    if payload:
        sb.table("mpines_prices").upsert(payload, on_conflict="row_hash").execute()

if __name__ == "__main__":
    # Example wire-up: read parsed rows from a JSON file your parser produced
    rows = json.load(open("parsed.json","r", encoding="utf-8"))
    upsert(rows, source_url="https://m-pines.com", version_date=datetime.date.today())
    print("Upserted", len(rows))

C) Glue it together (one runner)

Create a simple runner that:
	1.	Finds & downloads latest.pdf
	2.	Parses rows
	3.	Saves parsed.json
	4.	Upserts to Supabase

python3 fetch_latest_pdf.py
python3 parse_pdf.py > parsed_preview.json  # to eyeball first 10 rows
python3 - <<'PY'
import json, datetime, os, re
from parse_pdf import parse_price_pdf
from upsert_supabase import upsert
rows = parse_price_pdf("latest.pdf")
json.dump(rows, open("parsed.json","w",encoding="utf-8"), ensure_ascii=False)
upsert(rows, "https://m-pines.com", datetime.date.today())
print("Done:", len(rows))
PY

Put those commands in a monthly cron on your server (e.g., day 1 at 07:05).

D) Your search module (client)

Basic JS using Supabase JS:

import { createClient } from '@supabase/supabase-js'
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export async function searchPrices(q) {
  const { data, error } = await supabase
    .from('mpines_prices')
    .select('item_code,item_name,category,unit,price_nis,version_date')
    .or(`item_name.ilike.%${q}%,item_code.ilike.%${q}%`)
    .order('version_date', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}


⸻

What to do right now (checklist)
	1.	Make.com route: build the 3-step flow (GET homepage → regex .pdf → GET file) so you can always fetch the newest PDF. Save to Drive/OneDrive.
	2.	Run the Python parser on one sample file (pdfplumber) and see if you get reasonable rows. If columns are off, send me one page screenshot and I’ll tighten the mapping.
	3.	Create the Supabase table (SQL above).
	4.	Set SUPABASE_URL and SUPABASE_SERVICE_KEY on your server (or a GitHub Action secret), then run the upsert script.
	5.	Wire your search UI to the mpines_prices table (JS snippet).

If you want, I’ll give you a Make.com-only variant (no Python): GET PDF → call a lightweight API I’ll sketch that runs pdfplumber (or OCR) and returns JSON → Make inserts rows via HTTP to Supabase REST.

Perfect — then design everything around (part name + car details filters). Here’s a tight, future-proof setup you can reuse for ANY supplier.

1) Minimal, reusable data model (Supabase)

Use one main table for searchable rows. Keep suppliers/vehicles normalized so you can filter fast.

-- Suppliers
create table if not exists suppliers (
  id bigserial primary key,
  slug text unique not null,           -- e.g., 'm-pines'
  name text not null
);

-- Vehicle dimension (normalized, optional but recommended)
create table if not exists vehicles (
  id bigserial primary key,
  make text not null,                  -- e.g., 'Toyota'
  model text,                          -- e.g., 'Corolla'
  year int,                            -- e.g., 2018
  trim text,                           -- e.g., 'LE'
  engine text,                         -- e.g., '1.8L'
  unique (make, model, year, trim, engine)
);

-- Catalogs (one per monthly PDF/file per supplier)
create table if not exists catalogs (
  id bigserial primary key,
  supplier_id bigint references suppliers(id) on delete cascade not null,
  version_date date not null,
  source_url text not null,            -- original URL or storage path
  status text default 'done',
  processed_at timestamptz default now()
);

-- Searchable rows (one per part/line)
create table if not exists catalog_items (
  id bigserial primary key,
  supplier_id bigint references suppliers(id) on delete cascade not null,
  catalog_id bigint references catalogs(id) on delete cascade not null,
  vehicle_id bigint references vehicles(id) on delete set null, -- link if known
  make text, model text, year int, trim text, engine text,      -- denormalized for simple filters
  part_group text,                 -- e.g., 'Body > Doors'
  part_name text not null,         -- search target
  oem_code text,
  alt_codes text[],                -- optional array (cross refs)
  unit text,                       -- 'pcs', 'set', 'יח׳'
  currency text default 'ILS',
  price numeric,
  availability text,               -- 'in_stock', 'order', etc. (optional)
  version_date date not null,      -- copy from catalogs
  row_hash text not null unique,   -- sha1(version_date|supplier|make|model|year|part_name|oem_code|unit|price)
  raw_row jsonb not null,          -- whole parsed row for audit
  inserted_at timestamptz default now()
);

-- Indexes for fast search
create extension if not exists pg_trgm;

create index if not exists catalog_items_text_idx on catalog_items
using gin (to_tsvector('simple',
  coalesce(part_name,'') || ' ' ||
  coalesce(part_group,'') || ' ' ||
  coalesce(oem_code,'') || ' ' ||
  coalesce(make,'') || ' ' || coalesce(model,'')
));

create index if not exists catalog_items_partname_trgm on catalog_items
using gin (part_name gin_trgm_ops);

create index if not exists catalog_items_oem_trgm on catalog_items
using gin (oem_code gin_trgm_ops);

create index if not exists catalog_items_vehicle_filters
on catalog_items (make, model, year, trim, engine, version_date desc);

Why this works:
	•	part_name is full-text + trigram indexed for fuzzy Hebrew/English matches.
	•	make/model/year/trim/engine are plain columns so you can filter quickly.
	•	row_hash prevents duplicates on re-ingest.
	•	raw_row keeps the original supplier row for audit.

2) Ingestion (one parser for all suppliers)

Make your parser output a uniform JSON per row (even if each supplier formats differently). Example:

{
  "supplier_slug": "m-pines",
  "catalog_version_date": "2025-06-01",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2018,
  "trim": "LE",
  "engine": "1.8L",
  "part_group": "Body > Doors",
  "part_name": "Front left door shell",
  "oem_code": "67002-12A30",
  "alt_codes": ["6700212A30", "67002-12A31"],
  "unit": "pcs",
  "currency": "ILS",
  "price": 1290.00,
  "availability": "in_stock",
  "raw_row": {"cells": ["... original cells ..."]}
}

Your parser should:
	•	Upsert the supplier by slug.
	•	Upsert/find the vehicle by (make, model, year, trim, engine) and set vehicle_id.
	•	Create/find the catalog (supplier_id + version_date).
	•	Build row_hash = sha1(version_date|supplier_slug|make|model|year|part_name|oem_code|unit|price).
	•	Bulk upsert rows into catalog_items with on_conflict=row_hash.

You can do all upserts via Supabase REST from the parser (batch of 500–1000 items per call).

3) Make.com flow (simple, reusable)
	•	Get homepage → extract .pdf URL (regex)
	•	GET PDF (binary) → Upload to Supabase Storage vendor_raw/{supplier_slug}/{YYYY}-{MM}.pdf
	•	Sign URL (1–3h) → Call parser webhook with { supplier_slug, version_date, signed_url, storage_path }

Parser fetches the file, parses, and upserts. Make stays light. No Google Drive.

4) Search API (one RPC for precise + fuzzy)

Create one RPC that accepts the car details + a part name query and returns best matches, most-recent first:

create or replace function search_catalog_items(
  p_make text default null,
  p_model text default null,
  p_year int default null,
  p_trim text default null,
  p_engine text default null,
  p_q text default null,           -- user's part name or OEM code
  p_supplier_slug text default null
)
returns setof catalog_items
language sql stable as $$
  with base as (
    select ci.*
    from catalog_items ci
    join suppliers s on s.id = ci.supplier_id
    where (p_supplier_slug is null or s.slug = p_supplier_slug)
      and (p_make   is null or ci.make   ilike p_make)
      and (p_model  is null or ci.model  ilike p_model)
      and (p_year   is null or ci.year   = p_year)
      and (p_trim   is null or ci.trim   ilike p_trim)
      and (p_engine is null or ci.engine ilike p_engine)
      and (
           p_q is null
        or  to_tsvector('simple', coalesce(ci.part_name,'') || ' ' || coalesce(ci.part_group,'') || ' ' || coalesce(ci.oem_code,''))
            @@ plainto_tsquery('simple', p_q)
        or  ci.part_name ilike '%'||p_q||'%'
        or  ci.oem_code ilike '%'||p_q||'%'
      )
  )
  select *
  from base
  order by version_date desc, part_name asc
  limit 300;
$$;

Client call (Supabase JS):

const { data, error } = await supabase.rpc('search_catalog_items', {
  p_make:   make || null,
  p_model:  model || null,
  p_year:   year || null,
  p_trim:   trim || null,
  p_engine: engine || null,
  p_q:      query || null,
  p_supplier_slug: supplierSlug || null
});

5) UX tips (so results feel smart)
	•	Autocomplete: use a lightweight endpoint that returns top part_name suggestions for given make/model/year.
	•	Hebrew/English: normalize input (trim spaces, unify apostrophes), and keep both trigram and full-text (we did).
	•	Sort: newest version_date first, then price ascending or part_name A→Z.
	•	Show provenance: display supplier + month so users know the catalog version.

6) What YOU need to implement now (short checklist)
	1.	Create the tables & indexes above in Supabase.
	2.	Implement the Make discovery+upload+sign steps (3–4 modules).
	3.	Deploy one parser (GitHub Action or Cloud Run) that:
	•	reads the signed URL,
	•	outputs uniform JSON rows,
	•	bulk-upserts to catalog_items (and upserts suppliers/vehicles/catalogs as needed).
	4.	Add the RPC and connect your UI with the JS snippet.

If you want, I’ll give you:
	•	a ready SQL pack to paste,
	•	a parser skeleton (Python) that you run as a GitHub Action (no servers), and
	•	the exact Make module settings (URLs, headers, and example payloads).

Got it. Here’s a straight, step-by-step on using Python + GitHub for your catalog pipeline (fetch → parse → upsert to Supabase). Copy/paste as you go.

⸻

0) What you’ll end up with
	•	A small Python project: downloads a PDF (via signed URL), parses rows, upserts into Supabase.
	•	A GitHub repo hosting that code.
	•	A GitHub Actions workflow that runs the parser on a schedule and/or when you trigger it (e.g., from Make.com).

⸻

1) Install Python and prepare a project

macOS (works similarly on Windows/Linux):

# Check Python (3.10+)
python3 --version

# Create a folder
mkdir mpines_ingest && cd mpines_ingest

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Create the files
touch parser.py supabase_io.py utils.py requirements.txt README.md
mkdir -p .github/workflows

requirements.txt

requests
beautifulsoup4
pdfplumber
pymupdf
python-dotenv

If PDFs are scans and you need OCR later: add ocrmypdf and system Tesseract (can be added later).

⸻

2) Minimal code you can run today

utils.py (helpers)

import hashlib, datetime

def row_hash(version_date, supplier_slug, make, model, year, part_name, oem_code, unit, price):
    basis = f"{version_date}|{supplier_slug}|{make or ''}|{model or ''}|{year or ''}|{part_name or ''}|{oem_code or ''}|{unit or ''}|{price or ''}"
    return hashlib.sha1(basis.encode("utf-8")).hexdigest()

def chunked(iterable, size):
    buf = []
    for x in iterable:
        buf.append(x)
        if len(buf) >= size:
            yield buf
            buf = []
    if buf:
        yield buf

supabase_io.py (REST upsert)

import os, requests

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

def upsert_rows(table, rows):
    if not rows:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/{table}?on_conflict=row_hash"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    r = requests.post(url, headers=headers, json=rows, timeout=120)
    r.raise_for_status()
    return len(rows)

parser.py (download + parse + upsert)
This skeleton assumes text-based PDFs. If tables are messy, we’ll fine-tune later.

import os, io, re, json, datetime, requests, pdfplumber
from utils import row_hash, chunked
from supabase_io import upsert_rows

"""
Inputs (env or CLI):
- SIGNED_URL: signed link to the PDF (from Supabase Storage sign API)
- SUPPLIER_SLUG: e.g., "m-pines"
- VERSION_DATE: e.g., "2025-06-01"
- SOURCE_PATH: storage path e.g., "vendor_raw/m-pines/2025-06.pdf" (for provenance)
"""

def download_pdf(signed_url: str) -> bytes:
    r = requests.get(signed_url, timeout=180)
    r.raise_for_status()
    return r.content

def parse_pdf(pdf_bytes: bytes, supplier_slug: str, version_date: str, source_path: str):
    # TODO: if tables don’t extract well, we’ll adjust column mapping or switch to Tabula.
    rows = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables() or []
            for tbl in tables:
                for raw in tbl:
                    if not raw or not any((c or "").strip() for c in raw):
                        continue
                    cells = [(c or "").strip() for c in raw]
                    # Heuristic mapping: [make, model, year, part_name, oem_code, unit, price]
                    while len(cells) < 7:
                        cells.append("")
                    make, model, year_s, part_name, oem_code, unit, price_s = cells[:7]

                    # normalize
                    try:
                        year = int(re.sub(r"[^\d]", "", year_s)) if year_s else None
                    except Exception:
                        year = None
                    price_clean = re.sub(r"[^\d.]", "", price_s or "")
                    price_val = float(price_clean) if price_clean else None

                    row = {
                        "supplier_slug": supplier_slug,
                        "version_date": version_date,
                        "source_url": source_path,
                        "make": make or None,
                        "model": model or None,
                        "year": year,
                        "trim": None,
                        "engine": None,
                        "part_group": None,
                        "part_name": part_name or None,
                        "oem_code": oem_code or None,
                        "alt_codes": None,
                        "unit": unit or None,
                        "currency": "ILS",
                        "price": price_val,
                        "availability": None,
                        "raw_row": {"cells": cells}
                    }
                    row["row_hash"] = row_hash(
                        version_date, supplier_slug,
                        row["make"], row["model"], row["year"],
                        row["part_name"], row["oem_code"], row["unit"], row["price"]
                    )
                    rows.append(row)
    return rows

def to_catalog_items_payload(rows, supplier_id=None, catalog_id=None):
    # Convert parser rows into DB rows (flat)
    out = []
    for r in rows:
        out.append({
            "supplier_id": supplier_id,      # you can resolve supplier_id in DB or store slug and resolve later
            "catalog_id": catalog_id,
            "make": r["make"],
            "model": r["model"],
            "year": r["year"],
            "trim": r["trim"],
            "engine": r["engine"],
            "part_group": r["part_group"],
            "part_name": r["part_name"],
            "oem_code": r["oem_code"],
            "alt_codes": r["alt_codes"],
            "unit": r["unit"],
            "currency": r["currency"],
            "price_nis": r["price"],
            "version_date": r["version_date"],
            "raw_row": r["raw_row"],
            "row_hash": r["row_hash"],
            "source_url": r["source_url"]
        })
    return out

def main():
    signed_url   = os.environ["SIGNED_URL"]
    supplier     = os.environ["SUPPLIER_SLUG"]
    version_date = os.environ["VERSION_DATE"]   # "YYYY-MM-DD"
    source_path  = os.environ.get("SOURCE_PATH", "")

    pdf_bytes = download_pdf(signed_url)
    rows = parse_pdf(pdf_bytes, supplier, version_date, source_path)
    payload = to_catalog_items_payload(rows)

    # Upsert in batches to avoid timeouts
    total = 0
    for batch in chunked(payload, 800):
        total += upsert_rows("catalog_items", batch)
    print(json.dumps({"upserted": total, "version_date": version_date, "supplier": supplier}, ensure_ascii=False))

if __name__ == "__main__":
    main()

Run locally (test):

# Activate venv if needed
source .venv/bin/activate

# Install deps
pip install -r requirements.txt

# Set env (temporary, for testing)
export SUPABASE_URL="https://YOUR.supabase.co"
export SUPABASE_SERVICE_KEY="SERVICE-ROLE-KEY"
export SIGNED_URL="PASTE-SIGNED-URL"
export SUPPLIER_SLUG="m-pines"
export VERSION_DATE="2025-06-01"
export SOURCE_PATH="vendor_raw/m-pines/2025-06.pdf"

# Run
python parser.py


⸻

3) Put it on GitHub

# still inside mpines_ingest/
git init
git add .
git commit -m "Initial parser"
# Create an empty repo on GitHub, copy its URL, then:
git remote add origin https://github.com/YOURUSER/mpines_ingest.git
git push -u origin main


⸻

4) GitHub Actions (run on schedule or by button)

.github/workflows/ingest.yml

name: Ingest Catalog

on:
  workflow_dispatch:
    inputs:
      signed_url:
        description: "Signed URL to PDF"
        required: true
      supplier_slug:
        required: true
      version_date:
        required: true
      source_path:
        required: true
  schedule:
    - cron: "7 5 1 * *"   # monthly on the 1st at 05:07 UTC

jobs:
  run-ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install deps
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run parser
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          SIGNED_URL: ${{ github.event.inputs.signed_url || '' }}
          SUPPLIER_SLUG: ${{ github.event.inputs.supplier_slug || 'm-pines' }}
          VERSION_DATE: ${{ github.event.inputs.version_date || '2025-06-01' }}
          SOURCE_PATH: ${{ github.event.inputs.source_path || '' }}
        run: python parser.py

Add GitHub Secrets (Repo → Settings → Secrets and variables → Actions → New repository secret):
	•	SUPABASE_URL
	•	SUPABASE_SERVICE_KEY

Run it manually (Actions tab → “Ingest Catalog” → “Run workflow”) and paste the signed_url, etc.

⸻

5) Trigger Actions from Make.com (optional)

If you want your Make scenario to kick this off:
	•	In Make: HTTP > Make a request (POST)
URL:

https://api.github.com/repos/YOURUSER/mpines_ingest/actions/workflows/ingest.yml/dispatches

Headers:

Authorization: Bearer GITHUB_PERSONAL_ACCESS_TOKEN
Accept: application/vnd.github+json

Body (JSON):

{
  "ref": "main",
  "inputs": {
    "signed_url": "{{signed_url}}",
    "supplier_slug": "{{supplier_slug}}",
    "version_date": "{{YYYY}}-{{MM}}-01",
    "source_path": "vendor_raw/{{supplier_slug}}/{{YYYY}}-{{MM}}.pdf"
  }
}



The signed_url is the Supabase Storage “sign” you created in your Make flow.

⸻

6) Supabase tables (for the search you want)

If you haven’t created them yet, use the schema we discussed (at minimum you need catalog_items with row_hash and indexes). Keep RLS ON, give your client UI SELECT only.

⸻

7) How you’ll use this every month
	1.	Make finds the newest PDF URL, uploads to Supabase Storage, and gets a signed URL.
	2.	Make triggers the GitHub Action with that signed URL and metadata.
	3.	Action runs the Python script, parses the PDF, upserts into Supabase.
	4.	Your UI calls the search RPC or simple .or('part_name.ilike...') with car filters.

⸻

Notes / Tuning later
	•	If tables don’t extract cleanly, we’ll switch the parser’s extraction block to Tabula or tweak column mapping for that supplier.
	•	For huge scans, add an OCR step (outside Actions or in a separate job).
	•	If you expand to many suppliers, keep one parser and branch on supplier slug to apply supplier-specific cleaning rules.

If you want, I can tighten the column mapping once you show me a one-page sample (screenshot or PDF page).

