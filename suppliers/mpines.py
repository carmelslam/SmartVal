import re
import pdfplumber
import io
import hashlib
import gc  # For garbage collection

def parse(pdf_bytes, supplier_slug, version_date, source_path):
    rows = []
    
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        total_pages = len(pdf.pages)
        print(f"PDF has {total_pages} pages")
        
        # Get supplier ID once
        from supabase_io import get_client
        client = get_client()
        supplier = client.table("suppliers").select("id").eq("slug", supplier_slug).single().execute()
        supplier_id = supplier.data["id"] if supplier.data else None
        
        for page_num in range(total_pages):
            try:
                if page_num % 50 == 0:
                    print(f"Processing page {page_num}/{total_pages}...")
                    
                    # Upload batch every 100 pages to avoid memory issues
                    if page_num > 0 and page_num % 100 == 0 and rows:
                        print(f"Uploading batch of {len(rows)} rows...")
                        from supabase_io import upsert_rows
                        upsert_rows("catalog_items", rows)
                        rows = []  # Clear memory
                        gc.collect()
                
                page = pdf.pages[page_num]
                tables = page.extract_tables()
                
                if not tables:
                    continue
                    
                for table in tables:
                    for row_idx, row in enumerate(table):
                        if row_idx == 0 and row and 'Pcode' in str(row):
                            continue
                        
                        if row and len(row) >= 5:
                            make = row[0] if row[0] else None
                            source = row[1] if len(row) > 1 else None
                            price_str = row[2] if len(row) > 2 else None
                            cat_num_desc = row[3] if len(row) > 3 else None
                            pcode = row[4] if len(row) > 4 else None
                            
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
                                    "raw_row": {"page": page_num + 1, "data": row}
                                }
                                
                                hash_key = f"{version_date}|{pcode}|{cat_num_desc}|{price}|{make}"
                                row_data["row_hash"] = hashlib.sha256(hash_key.encode()).hexdigest()
                                
                                rows.append(row_data)
                                
            except Exception as e:
                print(f"Error on page {page_num + 1}: {e}")
                continue
        
        print(f"Parsing complete. Total rows: {len(rows)}")
    
    return rows
