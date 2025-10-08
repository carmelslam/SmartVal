import os
import requests
import io
import pdfplumber
import hashlib
import re
from datetime import date
from supabase_io import get_client, upsert_rows
from utils import chunked

def fix_hebrew_and_years(text):
    """Fix reversed Hebrew text and preserve year patterns"""
    if not text:
        return text
    
    # If pure Hebrew, just reverse
    if all(c in 'אבגדהוזחטיכלמנסעפצקרשתןםךףץ \'"-' for c in text):
        return text[::-1]
    
    # Check for reversed year patterns (like 210-80 which should be 08-012)
    reversed_year_pattern = r'(\d{3})-(\d{2})'
    match = re.search(reversed_year_pattern, text)
    if match:
        part1 = match.group(1)[::-1]  # 210 -> 012
        part2 = match.group(2)[::-1]  # 80 -> 08
        fixed_year = f"{part2}-{part1}"  # 08-012
        text = text.replace(match.group(), fixed_year)
    
    # Handle mixed content with year at beginning
    if re.match(r'^\d{2}-', text):
        parts = text.split(' ', 1)
        if len(parts) > 1:
            year_part = parts[0]
            rest = parts[1]
            if any('\u0590' <= c <= '\u05FF' for c in rest):
                rest = rest[::-1]
            return f"{year_part} {rest}"
    
    # For complex mixed content
    words = text.split()
    fixed_words = []
    
    for word in words:
        if re.match(r'^\d{2}-$', word):
            fixed_words.append(word)
        elif word == 'T5' or word == '5T':
            fixed_words.append('T5')
        elif any('\u0590' <= c <= '\u05FF' for c in word):
            fixed_words.append(word[::-1])
        else:
            fixed_words.append(word)
    
    if any('\u0590' <= c <= '\u05FF' for c in text):
        fixed_words.reverse()
    
    return ' '.join(fixed_words)

def parse_mpines_pdf(pdf_bytes):
    """Parse M-Pines PDF with Hebrew fix and correct column mapping"""
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
                        
                        # FIX HEBREW REVERSAL
                        if make:
                            make = fix_hebrew_and_years(make)
                        if source:
                            source = fix_hebrew_and_years(source)
                        if cat_num_desc:
                            cat_num_desc = fix_hebrew_and_years(cat_num_desc)
                        
                        # Parse price
                        price = None
                        if price_str:
                            try:
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
                            hash_key = f"{pcode}|{cat_num_desc}|{price}|{make}|{page_num}"
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
    
    # Get supplier ID and DELETE old data
    client = get_client()
    supplier = client.table("suppliers").select("id").eq("slug", "m-pines").single().execute()
    supplier_id = supplier.data["id"] if supplier.data else None
    
    # DELETE old catalog items for this supplier
    print(f"\nChecking for old catalog items...")
    count_before = client.table("catalog_items").select("count", count="exact").eq("supplier_id", supplier_id).execute()
    print(f"Found {count_before.count} existing items")
    
    if count_before.count > 0:
        print(f"Deleting old catalog for m-pines...")
        delete_result = client.table("catalog_items").delete().eq("supplier_id", supplier_id).execute()
        print(f"✓ Delete completed - removed {count_before.count} old items")
    else:
        print("No old items to delete")
    
    # Parse
    print("\nParsing PDF...")
    rows = parse_mpines_pdf(pdf_bytes)
    print(f"Parsed {len(rows)} rows")
    
    if rows:
        print("\nSample rows (checking Hebrew fix):")
        for i in range(min(3, len(rows))):
            r = rows[i]
            print(f"  {r['pcode']}: {r['cat_num_desc']} - ₪{r['price']} ({r['make']}) [{r['source']}]")
        
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
