import os
from supabase import create_client

# Get credentials from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

def get_client():
    """Get Supabase client instance"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def upsert_rows(table_name, rows):
    """Insert or update rows in a Supabase table"""
    if not rows:
        return 0
    
    client = get_client()
    
    # Upsert the rows (will update if row_hash matches, insert if new)
    try:
        response = client.table(table_name).upsert(rows, on_conflict="row_hash").execute()
        return len(rows)
    except Exception as e:
        print(f"Error upserting rows: {e}")
        # Try without on_conflict if row_hash doesn't exist
        try:
            response = client.table(table_name).insert(rows).execute()
            return len(rows)
        except Exception as e2:
            print(f"Error inserting rows: {e2}")
            return 0

def upsert_supplier(slug, name):
    """Create or update a supplier"""
    client = get_client()
    
    supplier_data = {
        "slug": slug,
        "name": name,
        "type": "catalog"
    }
    
    try:
        response = client.table("suppliers").upsert(supplier_data, on_conflict="slug").execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error upserting supplier: {e}")
        return None

def upsert_catalog(supplier_slug, version_date, source_path):
    """Create a catalog entry (if you have a catalogs table)"""
    # Skip if you don't have a catalogs table
    return True

def mark_catalog_done(supplier_slug, version_date):
    """Mark catalog as done (if you have a catalogs table)"""
    # Skip if you don't have a catalogs table
    return True
