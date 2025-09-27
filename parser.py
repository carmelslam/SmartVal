import os, requests
from utils import chunked
from supabase_io import upsert_rows, upsert_supplier, upsert_catalog, mark_catalog_done
from suppliers import mpines

SUPPLIER_MAP = {
    "m-pines": mpines,
}

def download_signed(signed_url: str) -> bytes:
    r = requests.get(signed_url, timeout=600)
    r.raise_for_status()
    return r.content

def main():
    supplier_slug = os.environ["SUPPLIER_SLUG"]
    version_date  = os.environ["VERSION_DATE"]
    signed_url    = os.environ["SIGNED_URL"]
    source_path   = os.environ["SOURCE_PATH"]

    parser = SUPPLIER_MAP[supplier_slug]

    upsert_supplier(supplier_slug, name=supplier_slug)
    upsert_catalog(supplier_slug, version_date, source_path)

    pdf_bytes = download_signed(signed_url)
    rows = parser.parse(pdf_bytes, supplier_slug, version_date, source_path)

    total = 0
    for batch in chunked(rows, 800):
        total += upsert_rows("catalog_items", batch)

    mark_catalog_done(supplier_slug, version_date)
    print({"supplier": supplier_slug, "version_date": version_date, "parsed": len(rows), "upserted": total})

if __name__ == "__main__":
    main()

