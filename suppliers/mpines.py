import re
import pdfplumber
import io
import hashlib
import gc

def parse(pdf_bytes, supplier_slug, version_date, source_path):
    """Parse PDF in chunks to avoid memory issues"""
    
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        total_pages = len(pdf.pages)
        print(f"PDF has {total_pages} pages")
        
        # Get supplier ID once
        from supabase_io import get_client, upsert_rows
        client = get_client()
        supplier = client.table("suppliers").select("id").eq("slug", supplier_slug).single().execute()
        supplier_id = supplier.data["id"] if supplier.data else None
        
        batch_rows = []
        total_processed = 0
        BATCH_SIZE = 100  # Process 100 pages at a time
        
        for page_num in range(total_pages):
            try:
                # Progress indicator
                if page_num % 50 == 0:
                    print(f"Processing page {page_num + 1}/{total_pages}...")
                
                page = pdf.pages[page_num]
                tables = page.extract_tables()
                
                if tables:
                    for table in tables:
                        for row_idx, row in enumerate(table):
                            # Skip header
                            if row_idx == 0 and row and 'Pcode' in str(row):
                                continue
                            
                            if row and len(row) >= 5:
                                # Extract columns
                                make = row[0] if row[0] else None
                                source = row[1] if len(row) > 1 else None
                                price_str = row[2] if len(row) > 2 else None
                                cat_num_desc = row[3] if len(row) > 3 else None
                                pcode = row[4] if len(row) > 4 else None
                                
                                # Parse price
                                price = None
                                if price_str:
                                    try:
                                        price_clean = ''.join(c for c in price_str if c.isdigit() or c == '.')
                                        price = float(price_clean) if price_clean else None
                                    except:
                                        pass
                                
                                if pcode or cat_num_desc:
                                    row_data = {
                                        "supplier_id": supplier_id,
                                        "pcode": pcode,
                                        "cat_num_desc": cat_num_desc,
                                        "price": price,
                                        "source": source,
                                        "make": make,
                                        "version_date": version_date,
                                        "raw_row": {"page": page_num + 1}
                                    }
                                    
                                    hash_key = f"{version_date}|{pcode}|{cat_num_desc}|{price}|{make}"
                                    row_data["row_hash"] = hashlib.sha256(hash_key.encode()).hexdigest()
                                    
                                    batch_rows.append(row_data)
                
                # Upload batch every 100 pages
                if (page_num + 1) % BATCH_SIZE == 0 or page_num == total_pages - 1:
                    if batch_rows:
                        print(f"Uploading batch of {len(batch_rows)} rows...")
                        upsert_rows("catalog_items", batch_rows)
                        total_processed += len(batch_rows)
                        print(f"Total processed so far: {total_processed} rows")
                        batch_rows = []  # Clear batch
                        gc.collect()  # Force garbage collection
                        
            except Exception as e:
                print(f"Error on page {page_num + 1}: {str(e)}")
                continue
        
        print(f"Parsing complete. Total rows processed: {total_processed}")
        return []  # Return empty since we already uploaded everything
