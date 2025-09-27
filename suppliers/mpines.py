import re
import pdfplumber
import io
import hashlib

def parse(pdf_bytes, supplier_slug, version_date, source_path):
    """Parse M-Pines PDF with correct Hebrew column order"""
    rows = []
    
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        print(f"PDF has {len(pdf.pages)} pages")
        
        for page_num, page in enumerate(pdf.pages, 1):
            if page_num % 100 == 0:
                print(f"Processing page {page_num}...")
            
            tables = page.extract_tables()
            if not tables:
                continue
                
            for table in tables:
                for row_idx, row in enumerate(table):
                    # Skip header row
                    if row_idx == 0 and row and 'Pcode' in str(row):
                        continue
                    
                    if row and len(row) >= 5:
                        # Actual column order: Make, Expr2(source), Price, CatNumDesc, Pcode
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
                        
                        # Get supplier ID
                        from supabase_io import get_client
                        client = get_client()
                        supplier = client.table("suppliers").select("id").eq("slug", supplier_slug).single().execute()
                        supplier_id = supplier.data["id"] if supplier.data else None
                        
                        if pcode or cat_num_desc:
                            row_data = {
                                "supplier_id": supplier_id,
                                "pcode": pcode,
                                "cat_num_desc": cat_num_desc,
                                "price": price,
                                "source": source,
                                "make": make,
                                "version_date": version_date,
                                "raw_row": {"page": page_num, "data": row}
                            }
                            
                            # Generate hash
                            hash_key = f"{version_date}|{pcode}|{cat_num_desc}|{price}|{make}"
                            row_data["row_hash"] = hashlib.sha256(hash_key.encode()).hexdigest()
                            
                            rows.append(row_data)
    
    return rows
