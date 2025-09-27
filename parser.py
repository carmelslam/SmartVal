import os, requests
from utils import chunked
from supabase_io import upsert_rows, upsert_supplier, get_client
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

    # Get supplier
    client = get_client()
    upsert_supplier(supplier_slug, name=supplier_slug)
    supplier = client.table("suppliers").select("id").eq("slug", supplier_slug).single().execute()
    supplier_id = supplier.data["id"]

    # DELETE old catalog items
    print(f"Checking for old catalog items for supplier: {supplier_slug}")
    count_before = client.table("catalog_items").select("count", count="exact").eq("supplier_id", supplier_id).execute()
    print(f"Found {count_before.count} existing items")
    
    if count_before.count > 0:
        print(f"Deleting old catalog...")
        delete_result = client.table("catalog_items").delete().eq("supplier_id", supplier_id).execute()
        print(f"Delete completed")
    else:
        print("No old items to delete")
    
    # Download and parse new catalog
    print(f"Downloading from {signed_url}...")
    pdf_bytes = download_signed(signed_url)
    print(f"Downloaded {len(pdf_bytes)} bytes")
    
    print(f"Parsing with {supplier_slug} parser...")
    rows = parser.parse(pdf_bytes, supplier_slug, version_date, source_path)
    
    # Upload new catalog (might be empty if parser uploaded in chunks)
    if rows:
        total = 0
        for batch in chunked(rows, 800):
            total += upsert_rows("catalog_items", batch)
        print(f"Uploaded {total} rows")
    else:
        print("Parser handled uploading internally")

if __name__ == "__main__":
    main()
