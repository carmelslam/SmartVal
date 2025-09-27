import os
import requests
import io
import pdfplumber
import hashlib
from datetime import date
from supabase_io import get_client, upsert_rows
from utils import chunked

def parse_mpines_pdf(pdf_bytes):
    """Parse M-Pines PDF with correct column mapping"""
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
                    if row_idx == 0 and 'Pcode' in str(row):
                        continue
                    
                    if row and len(row) >= 5:
                        # Columns are: Make, Expr2 (source), Price, CatNumDesc, Pcode
                        make = row[0] if row[0] else None
                        source = row[1] if len(row) > 1 else None
                        price_str = row[2] if len(row) > 2 else None
                        cat_num_desc = row[3] if len(row) > 3 else None
                        pcode = row[4] if len(row) > 4 else None
                        
                        # Parse price
                        price = None
                        if price_str:
                            try:
                                # Remove any non-numeric characters
                                price_clean = ''.join(c for c in price_str if c.isdigit() or c == '.')
                                price = float(price_clean) if price_clean else None
                            except:
                                pass
                        
                        # Create row with correct structure for catalog_items table
                        if pcode or cat_num_desc:
                            row_data = {
                                "pcode": pcode,
                                "cat_num_desc": cat_num_desc,
                                "price": price,
                                "source": source,
                                "make": make,
                                "version_date": date.today().isoformat(),
                                "raw_row": {"page": page_num, "data": row}
                            }
                            
                            # Generate hash
                            hash_key = f"{pcode}|{cat_num_desc}|{price}|{make}"
                            row_data["row_hash"] = hashlib.sha256(hash_key.encode()).hexdigest()
                            
                            rows.append(row_data)
    
    return rows

def main():
    # Download PDF
    url = "https://m-pines.com/wp-content/uploads/2025/06/מחירון-06-25.pdf"
    print(f"Downloading from {url}...")
    
    response = requests.get(url)
    response.raise_for_status()
    pdf_bytes = response.content
    print(f"Downloaded {len(pdf_bytes)} bytes")
    
    # Parse
    print("Parsing PDF...")
    rows = parse_mpines_pdf(pdf_bytes)
    print(f"Parsed {len(rows)} rows")
    
    if rows:
        print("\nSample rows:")
        for i in range(min(3, len(rows))):
            r = rows[i]
            print(f"  {r['pcode']}: {r['cat_num_desc']} - ₪{r['price']} ({r['make']})")
        
        # Get supplier ID
        client = get_client()
        supplier = client.table("suppliers").select("id").eq("slug", "m-pines").single().execute()
        supplier_id = supplier.data["id"] if supplier.data else None
        
        # Add supplier_id to all rows
        for row in rows:
            row["supplier_id"] = supplier_id
        
        # Upload to Supabase
        print(f"\nUploading {len(rows)} rows to Supabase...")
        total = 0
        for batch in chunked(rows, 500):
            count = upsert_rows("catalog_items", batch)
            total += len(batch)
            print(f"Uploaded batch: {len(batch)} rows (total: {total})")
        
        print(f"\n✓ Complete! Uploaded {total} rows to catalog_items table")
    else:
        print("No rows found to upload")

if __name__ == "__main__":
    # Set environment variables if needed
    if not os.getenv("SUPABASE_URL"):
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables")
        exit(1)
    
    main()
