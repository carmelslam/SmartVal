import io, re, pdfplumber, fitz
from utils import row_hash

def _num(s):
    if not s: return None
    z = re.sub(r"[^\d.]", "", s)
    return float(z) if z else None

def parse(pdf_bytes: bytes, supplier_slug: str, version_date: str, source_path: str) -> list[dict]:
    rows = []

    # Try structured tables with pdfplumber
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables() or []
            for tbl in tables:
                for cells in tbl:
                    if not cells or not any((c or "").strip() for c in cells): 
                        continue
                    cells = [(c or "").strip() for c in cells]
                    while len(cells) < 7: cells.append("")
                    make, model, year_s, part_name, oem_code, unit, price_s = cells[:7]
                    try:
                        year = int(re.sub(r"[^\d]", "", year_s)) if year_s else None
                    except: 
                        year = None
                    price = _num(price_s)

                    row = {
                        "supplier_slug": supplier_slug,
                        "version_date": version_date,
                        "source_url": source_path,
                        "make": make or None,
                        "model": model or None,
                        "year": year,
                        "trim": None, "engine": None,
                        "part_group": None,
                        "part_name": part_name or None,
                        "oem_code": oem_code or None,
                        "alt_codes": None,
                        "unit": unit or None,
                        "currency": "ILS",
                        "price": price,
                        "availability": None,
                        "raw_row": {"cells": cells}
                    }
                    row["row_hash"] = row_hash(version_date, supplier_slug, row["make"], row["model"], row["year"], row["part_name"], row["oem_code"], row["unit"], row["price"])
                    rows.append(row)

    # Fallback: text mode with PyMuPDF
    if not rows:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        for page in doc:
            for line in page.get_text("text").splitlines():
                parts = re.split(r"\s{2,}", line.strip())
                if not parts: 
                    continue
                price = _num(parts[-1]) if parts else None
                part_name = " ".join(parts[:-1] if price is not None else parts).strip()
                if not part_name: 
                    continue
                row = {
                    "supplier_slug": supplier_slug,
                    "version_date": version_date,
                    "source_url": source_path,
                    "make": None, "model": None, "year": None,
                    "trim": None, "engine": None,
                    "part_group": None,
                    "part_name": part_name,
                    "oem_code": None,
                    "alt_codes": None,
                    "unit": None,
                    "currency": "ILS",
                    "price": price,
                    "availability": None,
                    "raw_row": {"line": line}
                }
                row["row_hash"] = row_hash(version_date, supplier_slug, None, None, None, part_name, None, None, price)
                rows.append(row)

    return rows

