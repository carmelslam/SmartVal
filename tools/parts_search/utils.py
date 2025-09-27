import hashlib

def row_hash(version_date, supplier_slug, make, model, year, part_name, oem_code, unit, price):
    basis = f"{version_date}|{supplier_slug}|{make or ''}|{model or ''}|{year or ''}|{part_name or ''}|{oem_code or ''}|{unit or ''}|{price or ''}"
    return hashlib.sha1(basis.encode("utf-8")).hexdigest()

def chunked(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i+n]

